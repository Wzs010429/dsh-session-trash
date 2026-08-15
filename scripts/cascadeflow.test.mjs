/** Verify optional subagent cascade preview, rollback, batch commit, and batch restore. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-cascade-'))
process.env.DSH_HOME = tmp

const ROOT = 'session-root0000-0000-4000-8000-000000000000'
const CHILD = 'session-child000-0000-4000-8000-000000000000'
const GRAND = 'session-grand000-0000-4000-8000-000000000000'
const ARCHIVED = 'session-archived0-0000-4000-8000-000000000000'
const FORK = 'session-fork00000-0000-4000-8000-000000000000'
const FORK_CHILD = 'session-forkchild-0000-4000-8000-000000000000'
const headers = [
  { id: ROOT, cwd: 'C:\\workspace', createdAt: 1 },
  { id: CHILD, cwd: 'C:\\workspace', parentSession: ROOT, origin: 'subagent', createdAt: 2 },
  { id: GRAND, cwd: 'C:\\workspace', parentSession: CHILD, origin: 'subagent', createdAt: 3 },
  { id: ARCHIVED, cwd: 'C:\\workspace', parentSession: ROOT, origin: 'subagent', createdAt: 4 },
  { id: FORK, cwd: 'C:\\workspace', parentSession: ROOT, createdAt: 5 },
  { id: FORK_CHILD, cwd: 'C:\\workspace', parentSession: FORK, origin: 'subagent', createdAt: 6 },
]

const storages = join(tmp, 'storages')
const sessions = join(tmp, 'sessions', '--workspace--')
mkdirSync(storages, { recursive: true })
for (const header of headers) {
  const dir = join(sessions, header.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'session.jsonl.zstd'), header.id)
}

const host = await import('../lib/index.js')
const routes = new Map()
const registry = {
  state: { archivedSessionIds: [ARCHIVED] },
  failAt: GRAND,
  async archiveSession(id) {
    const manifest = JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8'))
    assert.ok(manifest.trash.every((entry) => entry.state === 'pending'), 'the whole batch stays non-purgeable until every archive succeeds')
    if (id === this.failAt) throw new Error('fixture archive failure')
    if (!this.state.archivedSessionIds.includes(id)) this.state.archivedSessionIds.push(id)
  },
  enqueueOperation(operation) {
    return operation()
  },
  requireState() {
    return this.state
  },
  async setState(next) {
    this.state = next
  },
}
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get(name) {
    if (name === 'webServer') return { register: (route) => { routes.set(route.path, route); return () => {} } }
    if (name === 'workspaceRegistry') return registry
    if (name === 'sessionPersistence') {
      return {
        list: async () => headers,
        locate: (header) => ({ path: join(sessions, header.id, 'session.jsonl.zstd') }),
      }
    }
    if (name === 'sessions') return { get: (id) => (id === CHILD ? { header: headers[1] } : undefined) }
    return undefined
  },
  effect(setup) {
    setup()
  },
}
host.apply(ctx)

async function call(path, payload, method = 'POST') {
  const route = routes.get(path)
  assert.ok(route, `route registered: ${path}`)
  const req = {
    method,
    on(event, callback) {
      if (event === 'data' && payload !== undefined) callback(Buffer.from(JSON.stringify(payload)))
      if (event === 'end') queueMicrotask(callback)
    },
  }
  const res = { statusCode: 0, setHeader() {}, end(body) { this.body = body } }
  await route.handler(req, res)
  return { status: res.statusCode, body: JSON.parse(res.body) }
}

let out = await call('/session-trash/preview', { sessionId: ROOT })
assert.equal(out.status, 200)
assert.equal(out.body.descendantCount, 3, 'ordinary fork lineage is excluded from cascade preview')
assert.equal(out.body.eligibleDescendantCount, 2, 'already archived descendants stay untouched')
assert.equal(out.body.runningDescendantCount, 1, 'running eligible descendants are surfaced in the preview')
assert.equal(out.body.alreadyArchivedCount, 1)
assert.deepEqual(out.body.descendants.map((entry) => entry.sessionId), [CHILD, ARCHIVED, GRAND])

out = await call('/session-trash/delete', { sessionId: ROOT, cascade: true })
assert.equal(out.status, 404, 'an archive failure rolls the entire attempted batch back')
assert.deepEqual(out.body.trash, [])
assert.deepEqual(registry.state.archivedSessionIds, [ARCHIVED], 'rollback restores the original archive set')
assert.ok(!existsSync(join(storages, 'session-trash.json')), 'successful rollback removes the prepared manifest')

registry.failAt = undefined
out = await call('/session-trash/delete', { sessionId: ROOT, cascade: true })
assert.equal(out.status, 200)
assert.deepEqual(out.body.deleted, [ROOT, CHILD, GRAND])
assert.match(out.body.batchId, /^batch-/)
assert.ok(out.body.trash.every((entry) => entry.state === 'committed'))
assert.ok(out.body.trash.every((entry) => entry.batchId === out.body.batchId && entry.batchSize === 3))
const manifest = JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8'))
assert.equal(manifest.version, 3)
assert.equal(new Set(manifest.trash.map((entry) => entry.batchId)).size, 1)
assert.ok(!registry.state.archivedSessionIds.includes(FORK), 'ordinary fork remains visible')
assert.ok(!registry.state.archivedSessionIds.includes(FORK_CHILD), 'subagent below an ordinary fork remains visible')

out = await call('/session-trash/restore', { sessionId: CHILD })
assert.equal(out.status, 200)
assert.deepEqual(out.body.restored, [ROOT, CHILD, GRAND], 'restoring any row restores the remaining batch')
assert.deepEqual(registry.state.archivedSessionIds, [ARCHIVED])
assert.ok(!existsSync(join(storages, 'session-trash.json')))

out = await call('/session-trash/delete', { sessionId: ROOT, cascade: false })
assert.equal(out.status, 200)
assert.deepEqual(out.body.deleted, [ROOT], 'cascade stays opt-in')
assert.equal(out.body.batchId, undefined)
assert.deepEqual(registry.state.archivedSessionIds, [ARCHIVED, ROOT])
await call('/session-trash/restore', { sessionId: ROOT })

rmSync(tmp, { recursive: true, force: true })
console.log('cascadeflow: all assertions passed')
