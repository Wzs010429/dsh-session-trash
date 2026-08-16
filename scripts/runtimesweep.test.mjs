/** Runtime sweep: purge expired and crash-interrupted rows, preserve recent rows. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-runtime-sweep-'))
process.env.DSH_HOME = tmp
const EXPIRED = 'session-expired0-0000-4000-8000-000000000000'
const RETRY = 'session-retrypurge-0000-4000-8000-000000000000'
const RECENT = 'session-recent00-0000-4000-8000-000000000000'
const ids = [EXPIRED, RETRY, RECENT]
const storages = join(tmp, 'storages')
const sessions = join(tmp, 'sessions', '--workspace--')
mkdirSync(storages, { recursive: true })
for (const id of ids) {
  const dir = join(sessions, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'session.jsonl.zstd'), id)
}
const now = Date.now()
writeFileSync(join(storages, 'session-trash-settings.json'), JSON.stringify({ version: 3, retentionDays: 7 }))
writeFileSync(join(storages, 'session-trash.json'), JSON.stringify({
  version: 3,
  trash: [
    { sessionId: EXPIRED, archivedAt: now - 8 * 86400000, artifactPath: join(sessions, EXPIRED, 'session.jsonl.zstd'), state: 'committed' },
    { sessionId: RETRY, archivedAt: now - 86400000, artifactPath: join(sessions, RETRY, 'session.jsonl.zstd'), state: 'purging' },
    { sessionId: RECENT, archivedAt: now - 86400000, artifactPath: join(sessions, RECENT, 'session.jsonl.zstd'), state: 'committed' },
  ],
}))

const registry = {
  state: { archivedSessionIds: [...ids] },
  record: { sessionIds: [...ids] },
  list() {
    return [{ record: this.record, detachSession: async (id) => { this.record.sessionIds = this.record.sessionIds.filter((value) => value !== id) } }]
  },
  enqueueOperation(operation) { return operation() },
  requireState() { return this.state },
  async setState(next) { this.state = next },
}
const projection = { rows: new Set(ids), table: { delete: async (id) => projection.rows.delete(id) } }
const disposers = []
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get(name) {
    if (name === 'workspaceRegistry') return registry
    if (name === 'sessionProjectionCache') return projection
    if (name === 'sessions') return { get: () => undefined }
    return undefined
  },
  effect(setup) {
    const dispose = setup()
    if (typeof dispose === 'function') disposers.push(dispose)
  },
}

const host = await import('../lib/index.js')
host.apply(ctx)
await new Promise((resolve) => setTimeout(resolve, 1200))

assert.ok(!existsSync(join(sessions, EXPIRED)), 'expired committed row is purged at runtime')
assert.ok(!existsSync(join(sessions, RETRY)), 'crash-interrupted purge resumes before its retention age')
assert.ok(existsSync(join(sessions, RECENT)), 'recent committed row remains recoverable')
const manifest = JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8'))
assert.deepEqual(manifest.trash.map((entry) => entry.sessionId), [RECENT])
assert.deepEqual(registry.record.sessionIds, [RECENT])
assert.deepEqual(registry.state.archivedSessionIds, [RECENT])
assert.deepEqual([...projection.rows], [RECENT])
const audit = JSON.parse(readFileSync(join(storages, 'session-trash-audit.json'), 'utf8'))
assert.ok(audit.events.some((event) => event.type === 'auto-purge' && event.result === 'success'))

for (const dispose of [...disposers].reverse()) dispose()
rmSync(tmp, { recursive: true, force: true })
console.log('runtimesweep: all assertions passed')
