/**
 * Offline self-test for the host half's data-surgery helpers.
 * Runs against fixture files in a temp directory — never touches the real
 * dsh data home. Set DSH_HOME to the temp dir BEFORE importing the host
 * module (its roots are derived at module scope).
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'session-trash-selftest-'))
process.env.DSH_HOME = tmp
const host = await import('../lib/index.js')

assert.deepEqual(host.normalizeSettings(undefined), { purgeOnShutdown: true }, 'settings default to shutdown purge')
assert.deepEqual(host.normalizeSettings({ purgeOnShutdown: false }), { purgeOnShutdown: false }, 'explicit keep policy persists')
assert.deepEqual(host.normalizeSettings({ purgeOnShutdown: 'no' }), { purgeOnShutdown: true }, 'invalid setting falls back safely')
assert.equal(host.normalizeTrashEntry({ sessionId: 'invalid' }), undefined, 'invalid manifest rows are ignored')
assert.equal(
  host.normalizeTrashEntry({ sessionId: 'session-legacy00-0000-4000-8000-000000000000', archivedAt: 1 }).state,
  'committed',
  'legacy manifest rows migrate as committed',
)
assert.equal(
  host.normalizeTrashEntry({ sessionId: 'session-missing0-0000-4000-8000-000000000000', artifactMissing: true }).artifactMissing,
  true,
  'confirmed missing-artifact state survives normalization',
)
assert.equal(
  host.normalizeTrashEntry({
    sessionId: 'session-batchrow-0000-4000-8000-000000000000',
    batchId: 'batch-12345678-0000-4000-8000-000000000000',
    batchRootSessionId: 'session-batchroot-0000-4000-8000-000000000000',
  }).batchRootSessionId,
  'session-batchroot-0000-4000-8000-000000000000',
  'valid cascade batch metadata survives normalization',
)

const lineageRoot = 'session-lineageroot-0000-4000-8000-000000000000'
const lineageChild = 'session-lineagechild-0000-4000-8000-000000000000'
const lineageGrandchild = 'session-lineagegrand-0000-4000-8000-000000000000'
const ordinaryFork = 'session-ordinaryfork-0000-4000-8000-000000000000'
const forkSubagent = 'session-forksubagent-0000-4000-8000-000000000000'
assert.deepEqual(
  host.subagentDescendants([
    { id: lineageChild, parentSession: lineageRoot, origin: 'subagent', createdAt: 2 },
    { id: lineageGrandchild, parentSession: lineageChild, origin: 'subagent', createdAt: 3 },
    { id: ordinaryFork, parentSession: lineageRoot, createdAt: 1 },
    { id: forkSubagent, parentSession: ordinaryFork, origin: 'subagent', createdAt: 4 },
  ], lineageRoot).map((header) => header.id),
  [lineageChild, lineageGrandchild],
  'cascade follows uninterrupted subagent lineage and stops at ordinary forks',
)

const DEAD = 'session-deadbeef-0000-4000-8000-000000000000'
const KEEP = 'session-keep0000-0000-4000-8000-000000000000'
const storages = join(tmp, 'storages')
const sessions = join(tmp, 'sessions')
mkdirSync(storages, { recursive: true })
const deadDir = join(sessions, '--C-Users-ROG-Desktop--', DEAD)
mkdirSync(deadDir, { recursive: true })
writeFileSync(join(deadDir, 'session.jsonl.zstd'), 'fake-log')
assert.equal(host.inspectSessionArtifactOnDisk(DEAD).status, 'found', 'guarded disk inspection finds a canonical session directory')
assert.equal(host.inspectSessionArtifactOnDisk(KEEP).status, 'missing', 'guarded disk inspection confirms an absent session directory')

// ---- workspace.json surgery ------------------------------------------------
const wsFile = join(storages, 'workspace.json')
writeFileSync(
  wsFile,
  JSON.stringify(
    {
      unit: { name: 'workspace', version: 2 },
      global: {
        initialized: true,
        workspaceIds: ['w1'],
        archivedSessionIds: [DEAD, KEEP],
      },
      tables: {
        workspaces: {
          w1: {
            path: 'C:\\Users\\ROG\\Desktop',
            title: 'Desktop',
            sessionIds: [DEAD, KEEP],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      },
    },
    null,
    2,
  ),
  'utf8',
)
let doc = host.readJsonFile(wsFile)
assert.ok(doc, 'workspace fixture parses')
let { doc: next, changed } = host.stripSessionFromWorkspaceDoc(doc, [DEAD])
assert.ok(changed, 'workspace strip reports a change')
assert.ok(!next.global.archivedSessionIds.includes(DEAD), 'dead id removed from archive set')
assert.ok(next.global.archivedSessionIds.includes(KEEP), 'other id kept in archive set')
assert.deepEqual(next.tables.workspaces.w1.sessionIds, [KEEP], 'dead id removed from sessionIds, order kept')
assert.equal(next.unit.version, 2, 'unit metadata preserved')
assert.equal(next.tables.workspaces.w1.path, 'C:\\Users\\ROG\\Desktop', 'unrelated fields preserved')
const unchanged = host.stripSessionFromWorkspaceDoc(next, [DEAD])
assert.ok(!unchanged.changed, 'second strip is a no-op')

// ---- session_projcache.json surgery -----------------------------------------
const pcFile = join(storages, 'session_projcache.json')
writeFileSync(
  pcFile,
  JSON.stringify(
    {
      unit: { name: 'session_projcache', version: 3 },
      global: null,
      tables: {
        sessions: {
          [DEAD]: { identity: { createdAt: 1 }, rows: { title: { ver: 1, seq: 1, val: 'secret title' } } },
          [KEEP]: { identity: { createdAt: 2 }, rows: {} },
        },
      },
    },
    null,
    2,
  ),
  'utf8',
)
doc = host.readJsonFile(pcFile)
assert.ok(doc, 'projcache fixture parses')
;({ doc: next, changed } = host.stripSessionFromProjcacheDoc(doc, [DEAD]))
assert.ok(changed, 'projcache strip reports a change')
assert.ok(!(DEAD in next.tables.sessions), 'dead cache row (cached title text) removed')
assert.ok(KEEP in next.tables.sessions, 'other cache row kept')

// ---- atomic write roundtrip ---------------------------------------------------
host.writeJsonAtomic(wsFile, next)
assert.deepEqual(host.readJsonFile(wsFile), next, 'atomic write roundtrips')

// ---- artifact deletion ----------------------------------------------------------
const entry = { sessionId: DEAD, artifactPath: join(deadDir, 'session.jsonl.zstd') }
assert.equal(host.sessionArtifactSize(entry), 8, 'artifact size includes the stored log bytes')
const result = host.deleteSessionArtifact(entry)
assert.ok(result.ok, `artifact purge succeeds: ${JSON.stringify(result)}`)
assert.ok(!existsSync(deadDir), 'session directory fully removed')

// missing artifact is a silent success (force)
const missing = host.deleteSessionArtifact({ sessionId: DEAD, artifactPath: join(deadDir, 'session.jsonl.zstd') })
assert.ok(missing.ok, 'missing artifact tolerates')

// An unknown artifact path must keep the manifest for a later retry.
const unknown = host.deleteSessionArtifact({ sessionId: DEAD })
assert.ok(!unknown.ok, 'missing artifact path is not committed as a successful purge')
assert.equal(host.sessionArtifactSize({ sessionId: KEEP, artifactMissing: true }), 0, 'confirmed missing artifact reports zero bytes')
assert.ok(host.deleteSessionArtifact({ sessionId: KEEP, artifactMissing: true }).ok, 'confirmed missing artifact permits metadata-only purge')

// outside-root guard
const outside = host.deleteSessionArtifact({ sessionId: DEAD, artifactPath: join(tmp, '..', 'other', 'session.jsonl.zstd') })
assert.ok(!outside.ok, 'outside-root path refused')

// malformed / empty docs degrade to no-op
assert.ok(!host.stripSessionFromWorkspaceDoc(undefined, [DEAD]).changed, 'undefined workspace doc is a no-op')
assert.ok(!host.stripSessionFromProjcacheDoc({}, [DEAD]).changed, 'empty projcache doc is a no-op')

rmSync(tmp, { recursive: true, force: true })
console.log('selftest: all assertions passed')
