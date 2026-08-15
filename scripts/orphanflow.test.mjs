/** Orphan flow: missing artifact becomes a zero-byte, metadata-only purge. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-orphan-'))
process.env.DSH_HOME = tmp
const ORPHAN = 'session-orphan00-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
mkdirSync(storages, { recursive: true })

const registry = {
  state: { initialized: true, workspaceIds: ['w1'], archivedSessionIds: [ORPHAN] },
  enqueueOperation(operation) {
    return operation()
  },
  requireState() {
    return this.state
  },
  async setState(next) {
    this.state = next
    writeWorkspace()
  },
  list() {
    return [workspace]
  },
}
const workspace = {
  record: { path: 'C:\\workspace', title: 'workspace', sessionIds: [ORPHAN] },
  async detachSession(id) {
    this.record.sessionIds = this.record.sessionIds.filter((sessionId) => sessionId !== id)
    writeWorkspace()
  },
}
function writeWorkspace() {
  writeFileSync(
    join(storages, 'workspace.json'),
    JSON.stringify({
      unit: { name: 'workspace', version: 2 },
      global: registry.state,
      tables: { workspaces: { w1: workspace.record } },
    }),
  )
}

const projcache = { unit: { name: 'session_projcache', version: 3 }, tables: { sessions: { [ORPHAN]: { rows: {} } } } }
function writeProjcache() {
  writeFileSync(join(storages, 'session_projcache.json'), JSON.stringify(projcache))
}
writeWorkspace()
writeProjcache()
writeFileSync(
  join(storages, 'session-trash.json'),
  JSON.stringify({ version: 2, trash: [{ sessionId: ORPHAN, archivedAt: 1, state: 'committed' }] }),
)

const routes = new Map()
const projectionCache = {
  table: {
    async delete(id) {
      delete projcache.tables.sessions[id]
      writeProjcache()
    },
  },
}
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get(name) {
    if (name === 'webServer') return { register: (route) => { routes.set(route.path, route); return () => {} } }
    if (name === 'workspaceRegistry') return registry
    if (name === 'sessionProjectionCache') return projectionCache
    if (name === 'sessions') return { get: () => undefined }
    return undefined
  },
  effect(setup) {
    return setup()
  },
}

const host = await import('../lib/index.js')
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

let out = await call('/session-trash/list', undefined, 'GET')
assert.equal(out.body.trash.length, 1)
assert.equal(out.body.trash[0].artifactMissing, true, 'startup confirms that the artifact directory is absent')
assert.equal(out.body.trash[0].sizeBytes, 0, 'confirmed missing artifact reports zero bytes')
assert.equal(out.body.trash[0].canPurge, true, 'metadata-only orphan remains purgeable')
const manifest = JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8'))
assert.equal(manifest.trash[0].artifactMissing, true, 'confirmed absence is persisted for crash-safe retries')

out = await call('/session-trash/purge', { sessionIds: [ORPHAN] })
assert.deepEqual(out.body.purged, [ORPHAN], 'orphan purge commits without an artifact path')
assert.deepEqual(workspace.record.sessionIds, [], 'workspace accounting is removed')
assert.deepEqual(registry.state.archivedSessionIds, [], 'archive set is removed')
assert.ok(!(ORPHAN in projcache.tables.sessions), 'projection cache row is removed')
assert.ok(!existsSync(join(storages, 'session-trash.json')), 'empty trash manifest is removed')

rmSync(tmp, { recursive: true, force: true })
console.log('orphanflow: all assertions passed')
