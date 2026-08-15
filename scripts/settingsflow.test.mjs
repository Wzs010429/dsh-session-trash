/** Verify that disabling shutdown purge preserves every trashed artifact. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-settings-'))
process.env.DSH_HOME = tmp
const SESSION = 'session-keeptrash-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
const artifactDir = join(tmp, 'sessions', '--workspace--', SESSION)
const artifact = join(artifactDir, 'session.jsonl.zstd')
mkdirSync(storages, { recursive: true })
mkdirSync(artifactDir, { recursive: true })
writeFileSync(artifact, 'preserve me')
writeFileSync(join(storages, 'session-trash-settings.json'), JSON.stringify({ version: 1, purgeOnShutdown: false }))
writeFileSync(
  join(storages, 'workspace.json'),
  JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { initialized: true, workspaceIds: ['w1'], archivedSessionIds: [] },
    tables: { workspaces: { w1: { sessionIds: [SESSION] } } },
  }),
)
writeFileSync(
  join(storages, 'session_projcache.json'),
  JSON.stringify({ unit: { name: 'session_projcache', version: 3 }, tables: { sessions: { [SESSION]: { rows: {} } } } }),
)

const host = await import('../lib/index.js')
const routes = new Map()
const disposers = []
const registry = {
  state: { archivedSessionIds: [] },
  async archiveSession(id) {
    this.state.archivedSessionIds.push(id)
  },
}
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get(name) {
    if (name === 'webServer') return { register: (route) => { routes.set(route.path, route); return () => {} } }
    if (name === 'workspaceRegistry') return registry
    if (name === 'sessionPersistence') return { locate: () => ({ path: artifact }) }
    if (name === 'sessions') return { get: () => ({ header: { id: SESSION } }) }
    return undefined
  },
  effect(setup) {
    const dispose = setup()
    if (typeof dispose === 'function') disposers.push(dispose)
  },
}
host.apply(ctx)

const route = routes.get('/session-trash/delete')
assert.ok(route, 'delete route registered')
const req = {
  method: 'POST',
  on(event, callback) {
    if (event === 'data') callback(Buffer.from(JSON.stringify({ sessionId: SESSION })))
    if (event === 'end') queueMicrotask(callback)
  },
}
const res = {
  statusCode: 0,
  setHeader() {},
  end(body) {
    this.body = body
  },
}
await route.handler(req, res)
assert.equal(res.statusCode, 200, 'delete succeeds')
assert.ok(existsSync(join(storages, 'session-trash.json')), 'trash manifest persisted')

process.emit('SIGTERM')
for (const dispose of [...disposers].reverse()) dispose()

assert.ok(existsSync(artifact), 'artifact remains when shutdown purge is disabled')
assert.ok(existsSync(join(storages, 'session-trash.json')), 'manifest remains when shutdown purge is disabled')
const workspace = JSON.parse(readFileSync(join(storages, 'workspace.json'), 'utf8'))
assert.deepEqual(workspace.tables.workspaces.w1.sessionIds, [SESSION], 'workspace accounting remains for restore')

rmSync(tmp, { recursive: true, force: true })
console.log('settingsflow: all assertions passed')
