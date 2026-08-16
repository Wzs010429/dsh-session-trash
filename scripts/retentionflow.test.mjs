/** Verify that a finite retention policy purges only entries whose age elapsed. */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-retention-'))
process.env.DSH_HOME = tmp
const OLD = 'session-oldretain-0000-4000-8000-000000000000'
const RECENT = 'session-newretain-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
const sessions = join(tmp, 'sessions', '--workspace--')
const oldDir = join(sessions, OLD)
const recentDir = join(sessions, RECENT)
mkdirSync(storages, { recursive: true })
mkdirSync(oldDir, { recursive: true })
mkdirSync(recentDir, { recursive: true })
writeFileSync(join(oldDir, 'session.jsonl.zstd'), 'old')
writeFileSync(join(recentDir, 'session.jsonl.zstd'), 'recent')

const now = Date.now()
writeFileSync(join(storages, 'session-trash-settings.json'), JSON.stringify({ version: 2, retentionDays: 7 }))
writeFileSync(join(storages, 'session-trash.json'), JSON.stringify({
  version: 3,
  trash: [
    { sessionId: OLD, archivedAt: now - 8 * 86400000, artifactPath: join(oldDir, 'session.jsonl.zstd'), state: 'committed' },
    { sessionId: RECENT, archivedAt: now - 6 * 86400000, artifactPath: join(recentDir, 'session.jsonl.zstd'), state: 'committed' },
  ],
}))
writeFileSync(join(storages, 'workspace.json'), JSON.stringify({
  global: { archivedSessionIds: [OLD, RECENT] },
  tables: { workspaces: { w1: { sessionIds: [OLD, RECENT] } } },
}))
writeFileSync(join(storages, 'session_projcache.json'), JSON.stringify({
  tables: { sessions: { [OLD]: { rows: {} }, [RECENT]: { rows: {} } } },
}))

const host = await import('../lib/index.js')
const disposers = []
const ctx = {
  logger: { info() {}, warn() {}, error() {} },
  get() {
    return undefined
  },
  effect(setup) {
    const dispose = setup()
    if (typeof dispose === 'function') disposers.push(dispose)
  },
}
host.apply(ctx)

process.emit('SIGTERM')
for (const dispose of [...disposers].reverse()) dispose()

assert.ok(!existsSync(oldDir), 'entry older than seven days is purged on shutdown')
assert.ok(existsSync(recentDir), 'entry younger than seven days remains recoverable')
const manifest = JSON.parse(readFileSync(join(storages, 'session-trash.json'), 'utf8'))
assert.deepEqual(manifest.trash.map((entry) => entry.sessionId), [RECENT], 'manifest retains only the unexpired entry')
const workspace = JSON.parse(readFileSync(join(storages, 'workspace.json'), 'utf8'))
assert.deepEqual(workspace.global.archivedSessionIds, [RECENT])
assert.deepEqual(workspace.tables.workspaces.w1.sessionIds, [RECENT])
const projection = JSON.parse(readFileSync(join(storages, 'session_projcache.json'), 'utf8'))
assert.ok(!(OLD in projection.tables.sessions))
assert.ok(RECENT in projection.tables.sessions)

rmSync(tmp, { recursive: true, force: true })
console.log('retentionflow: all assertions passed')
