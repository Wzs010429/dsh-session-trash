/** Immediate purge flow: size preview, live-session guard, and runtime metadata cleanup. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-purge-'))
process.env.DSH_HOME = tmp
const COLD = 'session-cold0000-0000-4000-8000-000000000000'
const LIVE = 'session-live0000-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
const sessionsRoot = join(tmp, 'sessions', '--workspace--')
const paths = new Map()
for (const [id, content] of [[COLD, 'cold log'], [LIVE, 'live log']]) {
  const dir = join(sessionsRoot, id)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, 'session.jsonl.zstd')
  writeFileSync(path, content)
  paths.set(id, path)
}
mkdirSync(storages, { recursive: true })

const registry = {
  state: { initialized: true, workspaceIds: ['w1'], archivedSessionIds: [] },
  async archiveSession(id) {
    if (!paths.has(id)) throw new Error('unknown session')
    if (!this.state.archivedSessionIds.includes(id)) this.state.archivedSessionIds.push(id)
    writeWorkspace()
  },
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
  record: { path: 'C:\\workspace', title: 'workspace', sessionIds: [COLD, LIVE] },
  get sessionIds() {
    return this.record.sessionIds
  },
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
const projcache = {
  unit: { name: 'session_projcache', version: 3 },
  tables: { sessions: { [COLD]: { rows: {} }, [LIVE]: { rows: {} } } },
}
function writeProjcache() {
  writeFileSync(join(storages, 'session_projcache.json'), JSON.stringify(projcache))
}
writeWorkspace()
writeProjcache()

const routes = new Map()
const disposers = []
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
    if (name === 'sessionPersistence') {
      return {
        locate: (header) => ({ path: paths.get(header.id) }),
        list: async () => [...paths.keys()].map((id) => ({ id })),
      }
    }
    if (name === 'sessions') return { get: (id) => (id === LIVE ? { header: { id } } : undefined) }
    return undefined
  },
  effect(setup) {
    const dispose = setup()
    if (typeof dispose === 'function') disposers.push(dispose)
  },
}

const host = await import('../lib/index.js')
host.apply(ctx)

async function callRaw(path, payload, method = 'POST') {
  const route = routes.get(path)
  assert.ok(route, `route registered: ${path}`)
  const req = {
    method,
    on(event, callback) {
      if (event === 'data' && payload !== undefined) callback(Buffer.from(JSON.stringify(payload)))
      if (event === 'end') queueMicrotask(callback)
    },
  }
  const res = { statusCode: 0, headers: {}, setHeader(name, value) { this.headers[name] = value }, end(body) { this.body = body } }
  await route.handler(req, res)
  return { status: res.statusCode, headers: res.headers, body: res.body }
}
async function call(path, payload, method = 'POST') {
  const out = await callRaw(path, payload, method)
  return { ...out, body: JSON.parse(out.body) }
}

let out = await call('/session-trash/diagnostics', undefined, 'GET')
assert.equal(out.body.pluginVersion, '0.13.0', 'diagnostics reports the plugin version')
assert.equal(out.body.compatible, true, 'mock exposes every required capability')

assert.equal((await call('/session-trash/delete', { sessionId: COLD })).status, 200)
assert.equal((await call('/session-trash/delete', { sessionId: LIVE })).status, 200)
out = await call('/session-trash/list', undefined, 'GET')
const cold = out.body.trash.find((entry) => entry.sessionId === COLD)
const live = out.body.trash.find((entry) => entry.sessionId === LIVE)
assert.equal(cold.sizeBytes, 8, 'cold artifact size is previewed')
assert.equal(cold.canPurge, true, 'cold session can purge immediately')
assert.equal(live.canPurge, false, 'live session is protected')
assert.equal(out.body.stats.knownBytes, 16, 'storage statistics include known bytes')

out = await call('/session-trash/purge', { sessionIds: [COLD, LIVE] })
assert.deepEqual(out.body.purged, [COLD], 'eligible cold session is purged')
assert.deepEqual(out.body.blocked, [{ sessionId: LIVE, reason: 'session is still running' }], 'live session is skipped')
assert.ok(!existsSync(join(sessionsRoot, COLD)), 'cold artifact directory removed')
assert.ok(existsSync(join(sessionsRoot, LIVE)), 'live artifact remains')
assert.deepEqual(workspace.record.sessionIds, [LIVE], 'runtime workspace accounting pruned')
assert.deepEqual(registry.state.archivedSessionIds, [LIVE], 'runtime archive set pruned')
assert.ok(!(COLD in projcache.tables.sessions), 'runtime projection cache row pruned')
assert.ok(LIVE in projcache.tables.sessions, 'live projection row retained')
assert.deepEqual(JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8')).trash.map((entry) => entry.sessionId), [LIVE])

out = await call('/session-trash/purge', { sessionIds: [LIVE] })
assert.equal(out.body.purged.length, 0, 'all-live purge is a no-op')
assert.equal(out.body.blocked.length, 1, 'all-live purge reports the guard')

out = await call('/session-trash/settings', { requireExportBeforePurge: true, spaceWarningBytes: 1024 ** 3 })
assert.equal(out.body.settings.requireExportBeforePurge, true, 'export-before-purge policy persists')
assert.equal(out.body.settings.spaceWarningBytes, 1024 ** 3, 'space warning threshold persists')
const guarded = out.body.trash.find((entry) => entry.sessionId === LIVE)
assert.equal(guarded.needsExport, true, 'unexported entries are marked')
assert.equal(guarded.canPurge, false, 'unexported entries cannot purge')
out = await call('/session-trash/purge', { sessionIds: [LIVE] })
assert.equal(out.body.blocked[0].reason, 'export required before permanent deletion', 'host enforces export requirement')

const exported = await callRaw('/session-trash/export', { sessionIds: [LIVE] })
assert.equal(exported.status, 200, 'backup export succeeds')
assert.equal(exported.headers['Content-Type'], 'application/zip')
assert.equal(exported.body.readUInt32LE(0), 0x04034b50, 'backup response is a ZIP archive')
out = await call('/session-trash/list', undefined, 'GET')
assert.equal(out.body.trash[0].needsExport, false, 'successful export satisfies the guard')

out = await call('/session-trash/restore', { sessionIds: [LIVE] })
assert.deepEqual(out.body.restored, [LIVE], 'bulk restore API accepts sessionIds')
assert.ok(!existsSync(join(storages, 'session-trash.json')), 'bulk restore empties the manifest')
out = await call('/session-trash/history', undefined, 'GET')
assert.ok(out.body.events.some((event) => event.type === 'delete'), 'history records delete operations')
assert.ok(out.body.events.some((event) => event.type === 'export'), 'history records exports')
assert.ok(out.body.events.some((event) => event.type === 'restore'), 'history records restores')
out = await call('/session-trash/history', { action: 'clear' })
assert.deepEqual(out.body.events, [], 'history can be cleared')

for (const dispose of [...disposers].reverse()) dispose()
rmSync(tmp, { recursive: true, force: true })
console.log('purgeflow: all assertions passed')
