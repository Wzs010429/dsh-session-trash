/**
 * End-to-end host flow test with a mocked cordis context:
 * delete -> manifest persisted -> restore -> delete again -> SIGINT -> Cordis
 * disposal -> hard purge (artifact + workspace.json + session_projcache.json).
 * DSH_HOME points at a temp dir; the real data home is never touched.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-flow-'))
process.env.DSH_HOME = tmp
const host = await import('../lib/index.js')

const LIVE = 'session-live0000-0000-4000-8000-000000000000'
const KEEP = 'session-keep0000-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
const sessions = join(tmp, 'sessions')
const liveDir = join(sessions, '--C-Users-ROG-Desktop--', LIVE)
mkdirSync(storages, { recursive: true })
mkdirSync(liveDir, { recursive: true })
writeFileSync(join(liveDir, 'session.jsonl.zstd'), 'live log')
writeFileSync(
  join(storages, 'workspace.json'),
  JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { initialized: true, workspaceIds: ['w1'], archivedSessionIds: [KEEP] },
    tables: { workspaces: { w1: { path: 'C:\\Users\\ROG\\Desktop', title: 'Desktop', sessionIds: [LIVE, KEEP], createdAt: '', updatedAt: '' } } },
  }),
)
writeFileSync(
  join(storages, 'session_projcache.json'),
  JSON.stringify({
    unit: { name: 'session_projcache', version: 3 },
    global: null,
    tables: { sessions: { [LIVE]: { identity: {}, rows: {} }, [KEEP]: { identity: {}, rows: {} } } },
  }),
)

// ---- mocked context ----------------------------------------------------------
const routes = new Map()
const registry = {
  state: { initialized: true, workspaceIds: ['w1'], archivedSessionIds: [KEEP] },
  async archiveSession(id) {
    if (id !== LIVE) throw new Error(`cannot archive session '${id}': unknown`)
    if (this.state.archivedSessionIds.includes(id)) return
    this.state.archivedSessionIds.push(id)
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
    if (name === 'sessionPersistence')
      return {
        locate: (header) => ({ kind: 'jsonl', path: join(liveDir, 'session.jsonl.zstd') }),
        list: async () => [{ id: LIVE, cwd: 'C:\\Users\\ROG\\Desktop' }, { id: KEEP, cwd: 'C:\\Users\\ROG\\Desktop' }],
      }
    if (name === 'sessions') return { get: (id) => (id === LIVE ? { header: { id: LIVE } } : undefined) }
    return undefined
  },
  effect(fn) {
    if (typeof fn !== 'function') return
    const dispose = fn()
    if (typeof dispose === 'function') disposers.push(dispose)
    return dispose
  },
}
const disposers = []
host.apply(ctx)

// ---- tiny http plumbing ------------------------------------------------------
async function call(path, payload) {
  const route = routes.get(path)
  assert.ok(route, `route registered: ${path}`)
  const res = { statusCode: 0, headers: {}, body: '', setHeader(k, v) { this.headers[k] = v }, end(text) { this.body = text } }
  const req = { method: 'POST', on(event, cb) { if (event === 'end') queueMicrotask(cb); if (event === 'error') {} if (event === 'data') {} }, raw: JSON.stringify(payload ?? {}) }
  // patch: deliver the body
  req.on = (event, cb) => {
    if (event === 'data' && payload !== undefined) cb(Buffer.from(JSON.stringify(payload)))
    if (event === 'end') queueMicrotask(cb)
    if (event === 'error') {}
  }
  await route.handler(req, res)
  return { status: res.statusCode, body: JSON.parse(res.body) }
}

// ---- flow ----------------------------------------------------------------------
// 1. list starts empty
let out = await call('/session-trash/list')
assert.deepEqual(out.body.trash, [], 'initial trash empty')

// 2. delete the live session
out = await call('/session-trash/delete', { sessionId: LIVE })
assert.equal(out.status, 200, 'delete succeeds')
assert.equal(out.body.trash.length, 1, 'trash has one entry')
assert.ok(registry.state.archivedSessionIds.includes(LIVE), 'registry archived the session')
assert.ok(existsSync(join(storages, 'session-trash.json')), 'manifest persisted')

// 3. restore it
out = await call('/session-trash/restore', { sessionId: LIVE })
assert.equal(out.status, 200, 'restore succeeds')
assert.ok(!registry.state.archivedSessionIds.includes(LIVE), 'registry unarchived the session')
assert.ok(registry.state.archivedSessionIds.includes(KEEP), 'unrelated archive entry untouched')
assert.ok(!existsSync(join(storages, 'session-trash.json')), 'manifest removed when trash empties')

// 4. delete again, then unknown/invalid ids
out = await call('/session-trash/delete', { sessionId: LIVE })
assert.equal(out.status, 200)
out = await call('/session-trash/delete', { sessionId: 'session-nope0000-0000-4000-8000-000000000000' })
assert.equal(out.status, 404, 'unknown session refused')
out = await call('/session-trash/delete', { sessionId: '..%2F..%2Fetc' })
assert.equal(out.status, 400, 'invalid id refused')
out = await call('/session-trash/restore', { sessionId: KEEP })
assert.equal(out.status, 404, 'restore of non-trashed session refused')

// 5. Match DSH's real shutdown order: signal first, then dispose the tree.
assert.ok(existsSync(join(liveDir, 'session.jsonl.zstd')), 'artifact still on disk before exit')
process.emit('SIGINT')
for (const dispose of [...disposers].reverse()) dispose()
assert.ok(!existsSync(liveDir), 'artifact directory purged on exit')
let ws = JSON.parse(readFileSync(join(storages, 'workspace.json'), 'utf8'))
assert.ok(!ws.global.archivedSessionIds.includes(LIVE), 'archive set pruned on exit')
assert.ok(ws.global.archivedSessionIds.includes(KEEP), 'unrelated archive entry kept')
assert.deepEqual(ws.tables.workspaces.w1.sessionIds, [KEEP], 'workspace accounting pruned on exit')
const pc = JSON.parse(readFileSync(join(storages, 'session_projcache.json'), 'utf8'))
assert.ok(!(LIVE in pc.tables.sessions), 'projection cache row purged on exit')
assert.ok(KEEP in pc.tables.sessions, 'unrelated cache row kept')
assert.ok(!existsSync(join(storages, 'session-trash.json')), 'manifest removed after purge')

rmSync(tmp, { recursive: true, force: true })
console.log('hostflow: all assertions passed')
