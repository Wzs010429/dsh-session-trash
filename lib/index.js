/**
 * @dsh-external/dsh-session-trash — host half.
 *
 * A session trash bin for the dsh web GUI:
 *
 *  - SOFT DELETE (while the web process is running): the session is archived
 *    through the official `workspaceRegistry.archiveSession` seam, which hides
 *    it from every grouping surface AND from search in all connected tabs
 *    (the api-proxy broadcasts `host/archived-sessions-changed`). The log on
 *    disk is untouched, and a trash manifest records the pending deletion.
 *
 *  - RESTORE: the registry has no unarchive API, so
 *    the plugin runs the write through the registry's own operation queue
 *    (`enqueueOperation` + `setState`). The domain write emits
 *    `domain/changed`, and the api-proxy pushes the fresh archive set to every
 *    client — the session reappears everywhere, instantly.
 *
 *  - HARD DELETE: stopped sessions can be purged immediately through the live
 *    Workspace/projection-cache write paths. Optional shutdown purge performs
 *    the equivalent synchronous file cleanup during Cordis disposal. An exit
 *    hook remains as fallback. All metadata writes are atomic.
 *
 *  - CRASH SAFETY: the manifest is durable. If the process dies without a
 *    clean exit (SIGKILL, power loss), the v3 pending/committed/purging states
 *    reload on the next start. Uncommitted work is never purged, while a purge
 *    that already removed artifacts can only be retried, never falsely
 *    restored. A clean shutdown starts purge only when enabled.
 *
 * Data roots are derived the same way the shipped web profile does:
 * `$DSH_HOME` (default `~/.dsh`) with `sessions/` and `storages/` children.
 *
 * @module @dsh-external/dsh-session-trash
 */
import { existsSync, lstatSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'

export const name = 'session-trash'

/**
 * Hard dependencies (the web profile provides every one of them). Declared so
 * the loader wires these services into the plugin fiber — `ctx.get()` on a
 * fiber context only resolves DECLARED services.
 */
export const inject = ['webServer', 'workspaceRegistry', 'sessionPersistence', 'sessionProjectionCache', 'sessions']

/** DSH data home; mirrors the dshHomePath() derivation of the shipped profile. */
const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const storagesRoot = join(dshHome, 'storages')
const sessionsRoot = join(dshHome, 'sessions')
const stateFile = join(storagesRoot, 'session-trash.json')
const settingsFile = join(storagesRoot, 'session-trash-settings.json')
const auditFile = join(storagesRoot, 'session-trash-audit.json')

const API_ROOT = '/session-trash'
const PLUGIN_VERSION = '0.13.0'
const MANIFEST_VERSION = 3
const SETTINGS_VERSION = 3
const AUDIT_VERSION = 1
const AUDIT_LIMIT = 200
const MAX_EXPORT_BYTES = 512 * 1024 * 1024
const RETENTION_DAYS = new Set([0, 7, 30])
const SPACE_WARNING_BYTES = new Set([null, 1024 ** 3, 5 * 1024 ** 3, 10 * 1024 ** 3])
const DAY_MS = 24 * 60 * 60 * 1000

/** Loose but strict-enough session id guard (also keeps ids out of paths we touch). */
const SESSION_ID_PATTERN = /^session-[\w-]{8,}$/
const BATCH_ID_PATTERN = /^batch-[\w-]{8,}$/

// ---------------------------------------------------------------------------
// Pure helpers (exported so scripts/selftest.mjs can exercise them on fixtures)
// ---------------------------------------------------------------------------

/** Read and parse a JSON file; undefined on any failure (missing, malformed). */
export function readJsonFile(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

/** Normalize persisted settings while preserving safe defaults on old/corrupt files. */
export function normalizeSettings(doc) {
  const retentionDays = doc?.retentionDays === null || RETENTION_DAYS.has(doc?.retentionDays)
    ? doc.retentionDays
    : doc?.purgeOnShutdown === false ? null : 0
  return {
    retentionDays,
    requireExportBeforePurge: doc?.requireExportBeforePurge === true,
    spaceWarningBytes: SPACE_WARNING_BYTES.has(doc?.spaceWarningBytes) ? doc.spaceWarningBytes : null,
  }
}

/** Whether an entry has reached the configured automatic-purge age. */
export function retentionExpired(entry, settings, now = Date.now()) {
  const days = settings?.retentionDays
  if (days === null || !RETENTION_DAYS.has(days)) return false
  if (days === 0) return true
  return typeof entry?.archivedAt === 'number' && entry.archivedAt <= now - days * DAY_MS
}

/** Continue crash-interrupted purges; otherwise honor runtime/shutdown policy timing. */
export function automaticPurgeDue(entry, settings, onShutdown = false, now = Date.now()) {
  if (entry?.state === 'purging') return true
  if (!onShutdown && settings?.retentionDays === 0) return false
  return retentionExpired(entry, settings, now)
}

/** Atomically replace `file` with pretty-printed JSON (same-dir temp + rename). */
export function writeJsonAtomic(file, value) {
  const data = `${JSON.stringify(value, null, 2)}\n`
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, data, 'utf8')
  renameSync(tmp, file)
}

/** Normalize old and current manifest rows; legacy rows are fully committed. */
export function normalizeTrashEntry(entry) {
  if (!entry || typeof entry.sessionId !== 'string' || !SESSION_ID_PATTERN.test(entry.sessionId)) return undefined
  const artifactPath = typeof entry.artifactPath === 'string' ? entry.artifactPath : undefined
  const batchId = typeof entry.batchId === 'string' && BATCH_ID_PATTERN.test(entry.batchId) ? entry.batchId : undefined
  const batchRootSessionId = batchId && typeof entry.batchRootSessionId === 'string' && SESSION_ID_PATTERN.test(entry.batchRootSessionId)
    ? entry.batchRootSessionId
    : undefined
  return {
    sessionId: entry.sessionId,
    archivedAt: typeof entry.archivedAt === 'number' ? entry.archivedAt : Date.now(),
    artifactPath,
    artifactMissing: artifactPath === undefined && entry.artifactMissing === true,
    state: ['pending', 'committed', 'purging'].includes(entry.state) ? entry.state : 'committed',
    ...(typeof entry.exportedAt === 'number' ? { exportedAt: entry.exportedAt } : {}),
    ...(typeof entry.lastPurgeError === 'string' && entry.lastPurgeError ? { lastPurgeError: entry.lastPurgeError.slice(0, 1000) } : {}),
    ...(batchId ? { batchId } : {}),
    ...(batchRootSessionId ? { batchRootSessionId } : {}),
  }
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[index] = value >>> 0
  }
  return table
})()

function crc32(data) {
  let crc = 0xffffffff
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  const year = Math.max(1980, date.getFullYear())
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  }
}

/** Build a dependency-free ZIP using stored entries (no compression). */
export function createStoredZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(String(file.name).replace(/\\/g, '/'), 'utf8')
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
    const checksum = crc32(data)
    const stamp = dosDateTime(file.mtime)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(stamp.time, 10)
    local.writeUInt16LE(stamp.date, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, name, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(stamp.time, 12)
    central.writeUInt16LE(stamp.date, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, name)
    offset += local.length + name.length + data.length
  }
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, ...centralParts, end])
}

/**
 * Return descendants connected to `rootSessionId` only through uninterrupted
 * `origin: subagent` edges. This mirrors Harness' own sidebar lineage rules:
 * an ordinary fork is not cascaded and terminates propagation to its children.
 */
export function subagentDescendants(headers, rootSessionId) {
  if (!SESSION_ID_PATTERN.test(rootSessionId) || !Array.isArray(headers)) return []
  const children = new Map()
  for (const header of headers) {
    if (!header || header.origin !== 'subagent') continue
    if (typeof header.id !== 'string' || !SESSION_ID_PATTERN.test(header.id)) continue
    if (typeof header.parentSession !== 'string' || !SESSION_ID_PATTERN.test(header.parentSession)) continue
    const siblings = children.get(header.parentSession) ?? []
    siblings.push(header)
    children.set(header.parentSession, siblings)
  }
  for (const siblings of children.values()) {
    siblings.sort((left, right) => (left.createdAt ?? 0) - (right.createdAt ?? 0) || left.id.localeCompare(right.id))
  }

  const descendants = []
  const seen = new Set([rootSessionId])
  const queue = [...(children.get(rootSessionId) ?? [])]
  while (queue.length > 0) {
    const header = queue.shift()
    if (!header || seen.has(header.id)) continue
    seen.add(header.id)
    descendants.push(header)
    queue.push(...(children.get(header.id) ?? []))
  }
  return descendants
}

/** Resolve the smallest safe path that contains the session artifact. */
function artifactRemovalTarget(entry) {
  const file = entry && typeof entry.artifactPath === 'string' ? entry.artifactPath : undefined
  if (!file && entry?.artifactMissing === true) return { ok: true, missing: true }
  if (!file) return { ok: false, reason: 'artifact path unavailable' }
  if (!isAbsolute(file)) return { ok: false, reason: `not an absolute path: ${file}` }
  const root = resolve(sessionsRoot)
  const target = resolve(file)
  if (target === root || !target.startsWith(root + sep)) {
    return { ok: false, reason: `outside sessions root: ${file}` }
  }
  const dir = dirname(target)
  if (dir !== root && dir.startsWith(root + sep) && basename(dir).startsWith('session-')) {
    return { ok: true, target: dir, directory: true }
  }
  return { ok: true, target, directory: false }
}

function pathSize(path) {
  const stat = lstatSync(path)
  if (!stat.isDirectory() || stat.isSymbolicLink()) return stat.size
  let total = 0
  for (const name of readdirSync(path)) total += pathSize(join(path, name))
  return total
}

function collectArtifactFiles(entry) {
  const resolved = artifactRemovalTarget(entry)
  if (!resolved.ok) throw new Error(resolved.reason)
  if (resolved.missing || !existsSync(resolved.target)) return []
  const files = []
  const visit = (path, archiveName) => {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) {
      for (const name of readdirSync(path)) visit(join(path, name), `${archiveName}/${name}`)
      return
    }
    files.push({ name: archiveName, data: readFileSync(path), mtime: stat.mtime })
  }
  if (resolved.directory) {
    for (const name of readdirSync(resolved.target)) visit(join(resolved.target, name), `${entry.sessionId}/${name}`)
  } else {
    visit(resolved.target, `${entry.sessionId}/${basename(resolved.target)}`)
  }
  return files
}

/** Best-effort artifact size used by the confirmation preview. */
export function sessionArtifactSize(entry) {
  const resolved = artifactRemovalTarget(entry)
  if (!resolved.ok) return undefined
  if (resolved.missing) return 0
  try {
    return pathSize(resolved.target)
  } catch {
    return undefined
  }
}

/**
 * Mutate a `workspace.json` domain document in place: drop every `id` from
 * each workspace record's `sessionIds` and from the global `archivedSessionIds`.
 * Unknown keys are preserved (the doc is spread, not rebuilt).
 * @returns { doc, changed }
 */
export function stripSessionFromWorkspaceDoc(doc, ids) {
  let changed = false
  if (!doc || typeof doc !== 'object') return { doc, changed }
  const set = new Set(ids)
  const workspaces = doc.tables && typeof doc.tables === 'object' ? doc.tables.workspaces : undefined
  if (workspaces && typeof workspaces === 'object') {
    for (const record of Object.values(workspaces)) {
      if (record && typeof record === 'object' && Array.isArray(record.sessionIds)) {
        const next = record.sessionIds.filter((id) => !set.has(id))
        if (next.length !== record.sessionIds.length) {
          record.sessionIds = next
          changed = true
        }
      }
    }
  }
  const global = doc.global
  if (global && typeof global === 'object' && Array.isArray(global.archivedSessionIds)) {
    const next = global.archivedSessionIds.filter((id) => !set.has(id))
    if (next.length !== global.archivedSessionIds.length) {
      global.archivedSessionIds = next
      changed = true
    }
  }
  return { doc, changed }
}

/**
 * Mutate a `session_projcache.json` domain document in place: delete the
 * `tables.sessions` row of every `id` (title/stat/goal checkpoints of the
 * deleted log — the "cached text" the deletion must make unreachable).
 * @returns { doc, changed }
 */
export function stripSessionFromProjcacheDoc(doc, ids) {
  let changed = false
  if (!doc || typeof doc !== 'object') return { doc, changed }
  const sessions = doc.tables && typeof doc.tables === 'object' ? doc.tables.sessions : undefined
  if (sessions && typeof sessions === 'object') {
    for (const id of ids) {
      if (Object.prototype.hasOwnProperty.call(sessions, id)) {
        delete sessions[id]
        changed = true
      }
    }
  }
  return { doc, changed }
}

/**
 * Synchronously delete one trashed session's persisted artifacts. Deletes the
 * session directory when it sits directly under the sessions root and its name
 * looks like a session dir; otherwise falls back to the artifact file. Both
 * removals are force + recursive and tolerate missing paths. Never touches
 * anything outside the sessions root.
 * @returns { ok, dir?|file?, reason? }
 */
export function deleteSessionArtifact(entry) {
  const resolved = artifactRemovalTarget(entry)
  if (!resolved.ok) return resolved
  if (resolved.missing) return { ok: true, missing: true }
  try {
    rmSync(resolved.target, { recursive: resolved.directory, force: true })
    return resolved.directory ? { ok: true, dir: resolved.target } : { ok: true, file: resolved.target }
  } catch (error) {
    return { ok: false, reason: String(error && error.message ? error.message : error) }
  }
}

/**
 * Inspect the canonical two-level DSH sessions layout without following
 * symlinks. A successful `missing` result lets orphaned manifest rows finish
 * metadata cleanup without pretending an unreadable sessions root is empty.
 */
export function inspectSessionArtifactOnDisk(sessionId) {
  if (!SESSION_ID_PATTERN.test(sessionId)) return { status: 'unknown', reason: 'invalid session id' }
  try {
    if (!existsSync(sessionsRoot)) return { status: 'missing' }
    const candidates = [join(sessionsRoot, sessionId)]
    for (const item of readdirSync(sessionsRoot, { withFileTypes: true })) {
      if (!item.isDirectory() || item.isSymbolicLink()) continue
      candidates.push(join(sessionsRoot, item.name, sessionId))
    }
    for (const directory of candidates) {
      if (!existsSync(directory)) continue
      const stat = lstatSync(directory)
      if (!stat.isDirectory() || stat.isSymbolicLink()) continue
      return { status: 'found', path: join(directory, 'session.jsonl.zstd') }
    }
    return { status: 'missing' }
  } catch (error) {
    return { status: 'unknown', reason: String(error && error.message ? error.message : error) }
  }
}

/** Best-effort absolute artifact path for a live or cold session. */
async function locateArtifact(ctx, sessionId, knownHeaders) {
  const persistence = ctx.get('sessionPersistence')
  if (persistence && typeof persistence.locate === 'function') {
    const live = ctx.get('sessions')?.get(sessionId)
    if (live && live.header) {
      const loc = persistence.locate(live.header)
      if (loc && typeof loc.path === 'string') return { path: loc.path, missing: false }
    }
    try {
      const headers = Array.isArray(knownHeaders) ? knownHeaders : await persistence.list()
      for (const header of headers) {
        if (header && header.id === sessionId) {
          const loc = persistence.locate(header)
          if (loc && typeof loc.path === 'string') return { path: loc.path, missing: false }
        }
      }
    } catch {
      // Fall through to the guarded filesystem inspection.
    }
  }
  const disk = inspectSessionArtifactOnDisk(sessionId)
  if (disk.status === 'found') return { path: disk.path, missing: false }
  if (disk.status === 'missing') return { path: undefined, missing: true }
  return { path: undefined, missing: false }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * The declared inject list ensures every required host service is visible from
 * this plugin fiber. Individual reads remain guarded so startup failures
 * degrade to a clear HTTP error instead of corrupting the trash manifest.
 */
export function apply(ctx) {
  /** in-memory trash: sessionId -> durable transaction row (optionally grouped by batchId) */
  const trashMap = new Map()
  const sizeCache = new Map()
  const purgeInFlight = new Set()
  let settings = normalizeSettings(readJsonFile(settingsFile))
  let audit = []
  let trashNeedsSave = false

  const auditDoc = readJsonFile(auditFile)
  if (Array.isArray(auditDoc?.events)) {
    audit = auditDoc.events.filter((event) => event && typeof event.id === 'string' && typeof event.type === 'string').slice(-AUDIT_LIMIT)
  }
  const persistAudit = () => {
    if (audit.length === 0) {
      if (existsSync(auditFile)) rmSync(auditFile, { force: true })
      return
    }
    writeJsonAtomic(auditFile, { version: AUDIT_VERSION, events: audit.slice(-AUDIT_LIMIT) })
  }
  const recordAudit = (type, sessionIds = [], details = {}) => {
    const event = {
      id: `event-${randomUUID()}`,
      type,
      timestamp: Date.now(),
      sessionIds: [...new Set(sessionIds)].filter((id) => typeof id === 'string' && SESSION_ID_PATTERN.test(id)).slice(0, 100),
      ...details,
    }
    audit.push(event)
    audit = audit.slice(-AUDIT_LIMIT)
    try {
      persistAudit()
    } catch (error) {
      ctx.logger.warn(`[session-trash] audit write failed: ${String(error)}`)
    }
    return event
  }

  const loadTrash = () => {
    const doc = readJsonFile(stateFile)
    if (!doc || !Array.isArray(doc.trash)) return
    for (const entry of doc.trash) {
      const normalized = normalizeTrashEntry(entry)
      if (!normalized || trashMap.has(normalized.sessionId)) continue
      if (!normalized.artifactPath && !normalized.artifactMissing) {
        const disk = inspectSessionArtifactOnDisk(normalized.sessionId)
        if (disk.status === 'found') {
          normalized.artifactPath = disk.path
          trashNeedsSave = true
        } else if (disk.status === 'missing') {
          normalized.artifactMissing = true
          trashNeedsSave = true
        }
      }
      trashMap.set(normalized.sessionId, normalized)
    }
  }
  loadTrash()
  if (trashMap.size > 0) ctx.logger.info(`[session-trash] restored ${trashMap.size} pending deletion(s) from manifest`)

  const persistTrash = () => {
    if (trashMap.size === 0) {
      if (existsSync(stateFile)) rmSync(stateFile, { force: true })
      return
    }
    writeJsonAtomic(stateFile, {
      version: MANIFEST_VERSION,
      trash: [...trashMap.values()],
    })
  }

  const saveTrash = () => {
    try {
      persistTrash()
      return true
    } catch (error) {
      ctx.logger.warn(`[session-trash] manifest write failed: ${String(error)}`)
      return false
    }
  }
  if (trashNeedsSave) saveTrash()

  const isLive = (sessionId) => {
    try {
      const sessions = ctx.get('sessions')
      if (!sessions || typeof sessions.get !== 'function') return true
      return Boolean(sessions.get(sessionId))
    } catch {
      // A broken liveness check must never authorize irreversible deletion.
      return true
    }
  }
  const sizeOf = (entry) => {
    const cached = sizeCache.get(entry.sessionId)
    if (cached && cached.path === entry.artifactPath && Date.now() - cached.measuredAt < 10000) return cached.bytes
    const bytes = sessionArtifactSize(entry)
    sizeCache.set(entry.sessionId, { path: entry.artifactPath, measuredAt: Date.now(), bytes })
    return bytes
  }
  const trashList = () => {
    const batchSizes = new Map()
    for (const entry of trashMap.values()) {
      if (entry.batchId) batchSizes.set(entry.batchId, (batchSizes.get(entry.batchId) ?? 0) + 1)
    }
    return [...trashMap.values()].map((entry) => {
      const live = isLive(entry.sessionId)
      return {
        sessionId: entry.sessionId,
        archivedAt: entry.archivedAt,
        state: entry.state,
        sizeBytes: sizeOf(entry),
        sizeMeasuredAt: sizeCache.get(entry.sessionId)?.measuredAt,
        artifactMissing: entry.artifactMissing === true,
        live,
        canRestore: entry.state !== 'purging',
        canPurge: entry.state !== 'pending' && !live && (!settings.requireExportBeforePurge || typeof entry.exportedAt === 'number' || entry.state === 'purging'),
        canExport: entry.state !== 'purging',
        needsExport: settings.requireExportBeforePurge && typeof entry.exportedAt !== 'number' && entry.state !== 'purging',
        exportedAt: entry.exportedAt,
        lastPurgeError: entry.lastPurgeError,
        expiresAt: settings.retentionDays === 7 || settings.retentionDays === 30
          ? entry.archivedAt + settings.retentionDays * DAY_MS
          : undefined,
        expired: (settings.retentionDays === 7 || settings.retentionDays === 30) && retentionExpired(entry, settings),
        ...(entry.batchId ? { batchId: entry.batchId, batchSize: batchSizes.get(entry.batchId) ?? 1 } : {}),
        ...(entry.batchRootSessionId ? { batchRootSessionId: entry.batchRootSessionId } : {}),
      }
    })
  }
  const trashStats = (entries = trashList()) => {
    const known = entries.filter((entry) => Number.isFinite(entry.sizeBytes))
    const knownBytes = known.reduce((total, entry) => total + entry.sizeBytes, 0)
    return {
      count: entries.length,
      liveCount: entries.filter((entry) => entry.live).length,
      purgeableCount: entries.filter((entry) => entry.canPurge).length,
      expiredCount: entries.filter((entry) => entry.expired).length,
      failedCount: entries.filter((entry) => entry.lastPurgeError).length,
      unknownSizeCount: entries.length - known.length,
      knownBytes,
      spaceWarningExceeded: Number.isFinite(settings.spaceWarningBytes) && knownBytes >= settings.spaceWarningBytes,
    }
  }
  const settingsSnapshot = () => ({
    ...settings,
    // Keep older browser bundles functional during a rolling restart.
    purgeOnShutdown: settings.retentionDays !== null,
  })
  const saveSettings = (next) => {
    writeJsonAtomic(settingsFile, {
      version: SETTINGS_VERSION,
      ...next,
    })
    settings = next
  }

  const diagnosticsSnapshot = () => {
    const registry = ctx.get('workspaceRegistry')
    const persistence = ctx.get('sessionPersistence')
    const projection = ctx.get('sessionProjectionCache')
    const sessions = ctx.get('sessions')
    const capabilities = {
      webRoutes: Boolean(ctx.get('webServer')),
      archive: typeof registry?.archiveSession === 'function',
      restore: typeof registry?.enqueueOperation === 'function' && typeof registry?.setState === 'function' && typeof registry?.requireState === 'function',
      runtimeMetadataCleanup: typeof registry?.list === 'function' && Boolean(projection && (typeof projection.requireTable === 'function' || projection.table)),
      artifactDiscovery: typeof persistence?.list === 'function' && typeof persistence?.locate === 'function',
      livenessGuard: typeof sessions?.get === 'function',
      semanticMenuBridge: true,
    }
    return {
      pluginVersion: PLUGIN_VERSION,
      generatedAt: Date.now(),
      manifestVersion: MANIFEST_VERSION,
      settingsVersion: SETTINGS_VERSION,
      dshHome,
      capabilities,
      compatible: Object.entries(capabilities).filter(([key]) => key !== 'semanticMenuBridge').every(([, value]) => value),
      issues: Object.entries(capabilities).filter(([, value]) => !value).map(([key]) => key),
      trash: trashStats(),
      settings: settingsSnapshot(),
    }
  }

  const listSessionHeaders = async () => {
    const persistence = ctx.get('sessionPersistence')
    if (!persistence || typeof persistence.list !== 'function') throw new Error('session persistence listing unavailable')
    const persisted = await persistence.list()
    const byId = new Map()
    for (const header of persisted) {
      if (header && typeof header.id === 'string') byId.set(header.id, header)
    }
    const sessions = ctx.get('sessions')
    if (sessions && typeof sessions.list === 'function') {
      for (const session of sessions.list()) {
        if (session?.header && typeof session.header.id === 'string') byId.set(session.header.id, session.header)
      }
    }
    return [...byId.values()]
  }

  const archivedSessionIds = (registry) => {
    if (!registry || typeof registry.requireState !== 'function') throw new Error('workspace archive state unavailable')
    const ids = registry.requireState()?.archivedSessionIds
    if (!Array.isArray(ids)) throw new Error('workspace archive state is invalid')
    return new Set(ids)
  }

  const cascadePreview = async (registry, sessionId) => {
    const headers = await listSessionHeaders()
    const archived = archivedSessionIds(registry)
    const descendants = subagentDescendants(headers, sessionId).map((header) => {
      const alreadyTrashed = trashMap.has(header.id)
      const alreadyArchived = archived.has(header.id)
      return {
        sessionId: header.id,
        parentSessionId: header.parentSession,
        running: isLive(header.id),
        alreadyTrashed,
        alreadyArchived,
        eligible: !alreadyTrashed && !alreadyArchived,
      }
    })
    const eligible = descendants.filter((entry) => entry.eligible)
    return {
      headers,
      data: {
        sessionId,
        descendantCount: descendants.length,
        eligibleDescendantCount: eligible.length,
        cascadeCount: 1 + eligible.length,
        runningDescendantCount: eligible.filter((entry) => entry.running).length,
        alreadyTrashedCount: descendants.filter((entry) => entry.alreadyTrashed).length,
        alreadyArchivedCount: descendants.filter((entry) => entry.alreadyArchived && !entry.alreadyTrashed).length,
        descendants,
      },
    }
  }

  const unarchiveSessions = async (registry, sessionIds) => {
    const removed = new Set(sessionIds)
    await registry.enqueueOperation(async () => {
      const state = registry.requireState()
      await registry.setState({
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter((id) => !removed.has(id)),
      })
    })
  }

  const expandTrashEntries = (sessionIds, expandBatches = false) => {
    const selectedIds = new Set(sessionIds)
    const batchIds = new Set()
    for (const sessionId of sessionIds) {
      const entry = trashMap.get(sessionId)
      if (expandBatches && entry?.batchId) batchIds.add(entry.batchId)
    }
    return [...trashMap.values()].filter((entry) => selectedIds.has(entry.sessionId) || (entry.batchId && batchIds.has(entry.batchId)))
  }

  const cleanupMetadataSync = (ids) => {
    let ok = true
    const errors = []
    try {
      const file = join(storagesRoot, 'workspace.json')
      const doc = readJsonFile(file)
      if (existsSync(file) && doc === undefined) throw new Error('workspace.json is unreadable')
      if (doc !== undefined) {
        const { doc: next, changed } = stripSessionFromWorkspaceDoc(doc, ids)
        if (changed) writeJsonAtomic(file, next)
      }
    } catch (error) {
      ok = false
      errors.push(`workspace registry: ${String(error)}`)
    }
    try {
      const file = join(storagesRoot, 'session_projcache.json')
      const doc = readJsonFile(file)
      if (existsSync(file) && doc === undefined) throw new Error('session_projcache.json is unreadable')
      if (doc !== undefined) {
        const { doc: next, changed } = stripSessionFromProjcacheDoc(doc, ids)
        if (changed) writeJsonAtomic(file, next)
      }
    } catch (error) {
      ok = false
      errors.push(`projection cache: ${String(error)}`)
    }
    return { ok, errors }
  }

  const cleanupMetadataRuntime = async (ids) => {
    const registry = ctx.get('workspaceRegistry')
    const projectionCache = ctx.get('sessionProjectionCache')
    if (!registry) return { ok: false, errors: ['workspace registry unavailable'] }
    if (!projectionCache) return { ok: false, errors: ['projection cache unavailable'] }
    const errors = []
    try {
      await registry.enqueueOperation(async () => {
        for (const workspace of registry.list()) {
          const accounted = Array.isArray(workspace.record?.sessionIds) ? workspace.record.sessionIds : workspace.sessionIds
          for (const sessionId of ids) {
            if (accounted.includes(sessionId)) await workspace.detachSession(sessionId)
          }
        }
        const state = registry.requireState()
        const removed = new Set(ids)
        await registry.setState({
          ...state,
          archivedSessionIds: state.archivedSessionIds.filter((sessionId) => !removed.has(sessionId)),
        })
      })
    } catch (error) {
      errors.push(`workspace registry: ${String(error)}`)
    }
    try {
      const table = typeof projectionCache.requireTable === 'function' ? projectionCache.requireTable() : projectionCache.table
      if (!table || typeof table.delete !== 'function') throw new Error('projection cache table unavailable')
      for (const sessionId of ids) await table.delete(sessionId)
    } catch (error) {
      errors.push(`projection cache: ${String(error)}`)
    }
    return { ok: errors.length === 0, errors }
  }

  /** Two-phase physical purge. A durable `purging` row is never restorable. */
  const purgeEntries = (sessionIds, options = {}) => {
    const allowLive = options.allowLive === true
    const candidates = []
    const blocked = []
    const failed = []

    for (const sessionId of [...new Set(sessionIds)]) {
      const entry = trashMap.get(sessionId)
      if (!entry) {
        blocked.push({ sessionId, reason: 'not in trash' })
      } else if (entry.state === 'pending') {
        blocked.push({ sessionId, reason: 'archive transaction is pending' })
      } else if (purgeInFlight.has(sessionId)) {
        blocked.push({ sessionId, reason: 'purge is already in progress' })
      } else if (settings.requireExportBeforePurge && entry.state !== 'purging' && typeof entry.exportedAt !== 'number') {
        blocked.push({ sessionId, reason: 'export required before permanent deletion' })
      } else if (!allowLive && isLive(sessionId)) {
        blocked.push({ sessionId, reason: 'session is still running' })
      } else {
        candidates.push(entry)
      }
    }
    for (const entry of candidates) purgeInFlight.add(entry.sessionId)

    const newlyPurging = candidates.filter((entry) => entry.state !== 'purging')
    for (const entry of newlyPurging) {
      entry.state = 'purging'
      delete entry.lastPurgeError
    }
    if (newlyPurging.length > 0) {
      try {
        persistTrash()
      } catch (error) {
        for (const entry of newlyPurging) {
          entry.state = 'committed'
          entry.lastPurgeError = `cannot start purge: ${String(error)}`
        }
        for (const entry of candidates) failed.push({ sessionId: entry.sessionId, reason: entry.lastPurgeError })
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
        recordAudit(options.source ?? 'purge', sessionIds, { result: 'failed', failedCount: failed.length, blockedCount: blocked.length })
        return { purged: [], blocked, failed, trash: trashList() }
      }
    }

    const artifactRemoved = []
    for (const entry of candidates) {
      const result = deleteSessionArtifact(entry)
      if (result.ok) {
        artifactRemoved.push(entry)
        sizeCache.delete(entry.sessionId)
      } else {
        entry.state = 'committed'
        entry.lastPurgeError = result.reason
        failed.push({ sessionId: entry.sessionId, reason: result.reason })
      }
    }
    if (failed.length > 0) saveTrash()

    const ids = artifactRemoved.map((entry) => entry.sessionId)
    if (ids.length === 0) {
      for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
      recordAudit(options.source ?? 'purge', sessionIds, { result: failed.length > 0 ? 'failed' : 'blocked', failedCount: failed.length, blockedCount: blocked.length })
      return { purged: [], blocked, failed, trash: trashList() }
    }
    const finish = (metadata) => {
      if (!metadata.ok) {
        const reason = metadata.errors.join('; ')
        for (const entry of artifactRemoved) {
          entry.lastPurgeError = reason
          failed.push({ sessionId: entry.sessionId, reason })
        }
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
        saveTrash()
        recordAudit(options.source ?? 'purge', ids, { result: 'failed', failedCount: failed.length, blockedCount: blocked.length })
        return { purged: [], blocked, failed, trash: trashList() }
      }

      for (const entry of artifactRemoved) trashMap.delete(entry.sessionId)
      try {
        persistTrash()
      } catch (error) {
        for (const entry of artifactRemoved) trashMap.set(entry.sessionId, entry)
        for (const entry of artifactRemoved) {
          entry.lastPurgeError = `cleanup committed but manifest update failed: ${String(error)}`
          failed.push({ sessionId: entry.sessionId, reason: entry.lastPurgeError })
        }
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
        recordAudit(options.source ?? 'purge', ids, { result: 'failed', failedCount: failed.length, blockedCount: blocked.length })
        return { purged: [], blocked, failed, trash: trashList() }
      }
      for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
      recordAudit(options.source ?? 'purge', ids, { result: 'success' })
      return { purged: ids, blocked, failed, trash: trashList() }
    }

    if (options.runtimeMetadata === false) return finish(cleanupMetadataSync(ids))
    return cleanupMetadataRuntime(ids).then(finish, (error) => finish({ ok: false, errors: [String(error)] }))
  }

  let retentionSweepInFlight = false
  const runRetentionSweep = async () => {
    if (retentionSweepInFlight) return undefined
    const expired = [...trashMap.values()].filter((entry) => automaticPurgeDue(entry, settings)).map((entry) => entry.sessionId)
    if (expired.length === 0) return undefined
    retentionSweepInFlight = true
    try {
      const result = await purgeEntries(expired, { source: 'auto-purge' })
      if (result.purged.length > 0) ctx.logger.info(`[session-trash] retention sweep purged ${result.purged.length} expired session(s)`)
      return result
    } finally {
      retentionSweepInFlight = false
    }
  }

  // ---- HTTP surface for the client half --------------------------------
  const webServer = ctx.get('webServer')
  if (webServer) {
    const disposers = []
    const respond = (res, status, body) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(body))
    }
    const readBody = (req) =>
      new Promise((resolveBody) => {
        const chunks = []
        let size = 0
        req.on('data', (chunk) => {
          size += chunk.length
          if (size <= 65536) chunks.push(chunk)
        })
        req.on('end', () => {
          try {
            resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
          } catch {
            resolveBody({})
          }
        })
        req.on('error', () => resolveBody({}))
      })
    const register = (path, handler) => disposers.push(webServer.register({ kind: 'exact', path, handler }))

    register(`${API_ROOT}/list`, (req, res) => {
      const trash = trashList()
      respond(res, 200, { trash, stats: trashStats(trash), settings: settingsSnapshot() })
    })

    register(`${API_ROOT}/settings`, async (req, res) => {
      if (req.method === 'GET') return respond(res, 200, { settings: settingsSnapshot() })
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const next = { ...settings }
      let changed = false
      if (Object.prototype.hasOwnProperty.call(body, 'retentionDays')) {
        if (body.retentionDays !== null && !RETENTION_DAYS.has(body.retentionDays)) return respond(res, 400, { error: 'retentionDays must be 0, 7, 30, or null' })
        next.retentionDays = body.retentionDays
        changed = true
      } else if (typeof body.purgeOnShutdown === 'boolean') {
        next.retentionDays = body.purgeOnShutdown ? 0 : null
        changed = true
      }
      if (Object.prototype.hasOwnProperty.call(body, 'requireExportBeforePurge')) {
        if (typeof body.requireExportBeforePurge !== 'boolean') return respond(res, 400, { error: 'requireExportBeforePurge must be a boolean' })
        next.requireExportBeforePurge = body.requireExportBeforePurge
        changed = true
      }
      if (Object.prototype.hasOwnProperty.call(body, 'spaceWarningBytes')) {
        if (!SPACE_WARNING_BYTES.has(body.spaceWarningBytes)) return respond(res, 400, { error: 'spaceWarningBytes must be null, 1 GiB, 5 GiB, or 10 GiB' })
        next.spaceWarningBytes = body.spaceWarningBytes
        changed = true
      }
      if (!changed) return respond(res, 400, { error: 'no recognized setting supplied' })
      try {
        saveSettings(next)
      } catch (error) {
        return respond(res, 500, {
          error: `cannot save settings: ${String(error && error.message ? error.message : error)}`,
        })
      }
      const sweep = await runRetentionSweep()
      recordAudit('settings', [], { result: 'success' })
      const trash = trashList()
      respond(res, 200, {
        settings: settingsSnapshot(),
        ...(sweep ? { autoPurged: sweep.purged, autoSkipped: [...sweep.blocked, ...sweep.failed] } : {}),
        trash,
        stats: trashStats(trash),
      })
    })

    register(`${API_ROOT}/diagnostics`, (req, res) => {
      if (req.method !== 'GET') return respond(res, 405, { error: 'method not allowed' })
      respond(res, 200, diagnosticsSnapshot())
    })

    register(`${API_ROOT}/history`, async (req, res) => {
      if (req.method === 'GET') return respond(res, 200, { events: [...audit].reverse() })
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      if (body.action !== 'clear') return respond(res, 400, { error: 'action must be clear' })
      audit = []
      try {
        persistAudit()
      } catch (error) {
        return respond(res, 500, { error: `cannot clear history: ${String(error)}` })
      }
      respond(res, 200, { events: [] })
    })

    register(`${API_ROOT}/preview`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!SESSION_ID_PATTERN.test(sessionId)) return respond(res, 400, { error: 'invalid session id' })
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      try {
        const preview = await cascadePreview(registry, sessionId)
        respond(res, 200, preview.data)
      } catch (error) {
        respond(res, 503, {
          error: `cannot inspect subagent descendants: ${String(error && error.message ? error.message : error)}`,
        })
      }
    })

    register(`${API_ROOT}/delete`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!SESSION_ID_PATTERN.test(sessionId)) return respond(res, 400, { error: 'invalid session id' })
      if (body.cascade !== undefined && typeof body.cascade !== 'boolean') return respond(res, 400, { error: 'cascade must be a boolean' })
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      if (trashMap.has(sessionId)) return respond(res, 200, { trash: trashList() })

      let preview
      if (body.cascade === true) {
        try {
          preview = await cascadePreview(registry, sessionId)
        } catch (error) {
          return respond(res, 503, {
            error: `cannot safely resolve subagent descendants: ${String(error && error.message ? error.message : error)}`,
          })
        }
      }

      const sessionIds = [sessionId, ...(preview?.data.descendants ?? []).filter((entry) => entry.eligible).map((entry) => entry.sessionId)]
      const batchId = sessionIds.length > 1 ? `batch-${randomUUID()}` : undefined
      const archivedAt = Date.now()
      const entries = []
      for (const id of sessionIds) {
        const entry = {
          sessionId: id,
          archivedAt,
          artifactPath: undefined,
          artifactMissing: false,
          state: 'pending',
          ...(batchId ? { batchId, batchRootSessionId: sessionId } : {}),
        }
        try {
          const artifact = await locateArtifact(ctx, id, preview?.headers)
          entry.artifactPath = artifact.path
          entry.artifactMissing = artifact.missing
        } catch {
          // Artifact discovery is best-effort; restore remains available.
        }
        entries.push(entry)
        trashMap.set(id, entry)
      }
      try {
        persistTrash()
      } catch (error) {
        for (const entry of entries) trashMap.delete(entry.sessionId)
        return respond(res, 500, {
          error: `cannot prepare recoverable delete: ${String(error && error.message ? error.message : error)}`,
        })
      }

      try {
        for (const entry of entries) await registry.archiveSession(entry.sessionId)
      } catch (error) {
        for (const entry of entries) entry.state = 'pending'
        saveTrash()
        let rollbackError
        try {
          await unarchiveSessions(registry, sessionIds)
          for (const entry of entries) trashMap.delete(entry.sessionId)
          persistTrash()
        } catch (cleanupError) {
          rollbackError = cleanupError
          for (const entry of entries) trashMap.set(entry.sessionId, entry)
          saveTrash()
          ctx.logger.warn(`[session-trash] cascade rollback remains pending: ${String(cleanupError)}`)
        }
        return respond(res, rollbackError ? 500 : 404, {
          error: `cannot delete session: ${String(error && error.message ? error.message : error)}`,
          recoveryPending: Boolean(rollbackError),
          trash: trashList(),
        })
      }

      for (const entry of entries) entry.state = 'committed'
      try {
        persistTrash()
      } catch (error) {
        for (const entry of entries) entry.state = 'pending'
        saveTrash()
        return respond(res, 500, {
          error: `sessions were hidden but their delete transaction is pending: ${String(error && error.message ? error.message : error)}`,
          batchId,
          trash: trashList(),
        })
      }
      recordAudit('delete', sessionIds, { result: 'success', batch: sessionIds.length > 1 })
      respond(res, 200, { trash: trashList(), deleted: sessionIds, batchId })
    })

    register(`${API_ROOT}/restore`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const requestedIds = Array.isArray(body.sessionIds) ? body.sessionIds : [body.sessionId]
      if (requestedIds.length === 0 || requestedIds.length > 100 || requestedIds.some((id) => typeof id !== 'string' || !SESSION_ID_PATTERN.test(id))) {
        return respond(res, 400, { error: 'sessionIds must contain between 1 and 100 valid ids' })
      }
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      const entries = expandTrashEntries(requestedIds, true)
      if (entries.length === 0) return respond(res, 404, { error: 'sessions are not in the trash' })
      if (requestedIds.some((id) => !trashMap.has(id))) return respond(res, 404, { error: 'one or more sessions are not in the trash' })
      if (entries.some((candidate) => candidate.state === 'purging')) {
        return respond(res, 409, { error: 'session batch purge already started and cannot be restored' })
      }
      const sessionIds = entries.map((candidate) => candidate.sessionId)
      try {
        // Unarchive through the registry's own write path: its in-memory state
        // and the durable domain stay coherent, and the domain write emits
        // `domain/changed`, which the api-proxy turns into a
        // `host/archived-sessions-changed` frame for every connected client.
        await unarchiveSessions(registry, sessionIds)
      } catch (error) {
        return respond(res, 500, {
          error: `cannot restore session: ${String(error && error.message ? error.message : error)}`,
        })
      }
      for (const candidate of entries) {
        trashMap.delete(candidate.sessionId)
        sizeCache.delete(candidate.sessionId)
      }
      try {
        persistTrash()
      } catch (error) {
        for (const candidate of entries) trashMap.set(candidate.sessionId, candidate)
        return respond(res, 500, {
          error: `sessions were restored but their trash rows could not be removed: ${String(error && error.message ? error.message : error)}`,
          trash: trashList(),
        })
      }
      recordAudit('restore', sessionIds, { result: 'success', batch: sessionIds.length > 1 })
      respond(res, 200, { trash: trashList(), restored: sessionIds })
    })

    register(`${API_ROOT}/export`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      if (!Array.isArray(body.sessionIds) || body.sessionIds.length === 0 || body.sessionIds.length > 100) {
        return respond(res, 400, { error: 'sessionIds must contain between 1 and 100 ids' })
      }
      if (body.sessionIds.some((id) => typeof id !== 'string' || !SESSION_ID_PATTERN.test(id))) {
        return respond(res, 400, { error: 'invalid session id' })
      }
      const entries = expandTrashEntries(body.sessionIds, true)
      if (entries.length === 0 || body.sessionIds.some((id) => !trashMap.has(id))) return respond(res, 404, { error: 'one or more sessions are not in the trash' })
      if (entries.some((entry) => entry.state === 'purging')) return respond(res, 409, { error: 'cannot export a session whose purge already started' })
      try {
        const exportedAt = Date.now()
        const archiveFiles = []
        for (const entry of entries) archiveFiles.push(...collectArtifactFiles(entry))
        const manifest = {
          format: 'dsh-session-trash-export',
          version: 1,
          pluginVersion: PLUGIN_VERSION,
          exportedAt,
          sessions: entries.map((entry) => ({ sessionId: entry.sessionId, archivedAt: entry.archivedAt, artifactMissing: entry.artifactMissing === true })),
        }
        archiveFiles.push({ name: 'session-trash-export.json', data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`), mtime: new Date(exportedAt) })
        const totalBytes = archiveFiles.reduce((total, file) => total + file.data.length, 0)
        if (totalBytes > MAX_EXPORT_BYTES) return respond(res, 413, { error: 'export exceeds the 512 MiB browser download limit' })
        if (archiveFiles.length > 65535) return respond(res, 413, { error: 'export contains too many files for a ZIP archive' })
        const zip = createStoredZip(archiveFiles)
        const previousExportedAt = entries.map((entry) => entry.exportedAt)
        for (const entry of entries) entry.exportedAt = exportedAt
        try {
          persistTrash()
        } catch (error) {
          entries.forEach((entry, index) => {
            if (previousExportedAt[index] === undefined) delete entry.exportedAt
            else entry.exportedAt = previousExportedAt[index]
          })
          throw error
        }
        recordAudit('export', entries.map((entry) => entry.sessionId), { result: 'success', bytes: totalBytes })
        const suffix = entries.length === 1 ? entries[0].sessionId : `batch-${entries.length}-sessions`
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="dsh-trash-${suffix}.zip"`)
        res.setHeader('Cache-Control', 'no-store')
        res.end(zip)
      } catch (error) {
        respond(res, 500, { error: `cannot export sessions: ${String(error && error.message ? error.message : error)}` })
      }
    })

    register(`${API_ROOT}/purge`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      if (!Array.isArray(body.sessionIds) || body.sessionIds.length === 0 || body.sessionIds.length > 100) {
        return respond(res, 400, { error: 'sessionIds must contain between 1 and 100 ids' })
      }
      if (body.sessionIds.some((sessionId) => typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId))) {
        return respond(res, 400, { error: 'invalid session id' })
      }
      const result = await purgeEntries(body.sessionIds, { source: 'purge' })
      respond(res, 200, result)
    })

    ctx.effect(() => () => {
      for (const dispose of disposers) dispose()
    }, 'session-trash: http routes')
  }

  ctx.effect(() => {
    const sweep = () => {
      runRetentionSweep().catch((error) => ctx.logger.warn(`[session-trash] retention sweep failed: ${String(error)}`))
    }
    const startupTimer = setTimeout(sweep, 1000)
    const interval = setInterval(sweep, 60 * 60 * 1000)
    startupTimer.unref?.()
    interval.unref?.()
    return () => {
      clearTimeout(startupTimer)
      clearInterval(interval)
    }
  }, 'session-trash: retention sweep')

  // ---- hard purge during Harness shutdown ------------------------------
  // DSH handles SIGINT/SIGTERM by disposing the Cordis tree before calling
  // process.exit(). Remember the signal and commit from this plugin's disposer;
  // an exit listener remains as a forced-shutdown fallback.
  ctx.effect(() => {
    let shutdownRequested = false
    let purging = false

    const purgeTrash = () => {
      if (purging || trashMap.size === 0) return
      const expired = [...trashMap.values()].filter((entry) => automaticPurgeDue(entry, settings, true)).map((entry) => entry.sessionId)
      if (expired.length === 0) {
        const reason = settings.retentionDays === null ? 'shutdown purge is disabled' : 'retention period has not elapsed'
        console.log(`[session-trash] preserved ${trashMap.size} trashed session(s); ${reason}`)
        return
      }
      purging = true
      try {
        const result = purgeEntries(expired, { allowLive: true, runtimeMetadata: false, source: 'shutdown-purge' })
        if (result.purged.length > 0) console.log(`[session-trash] purged ${result.purged.length} session(s) on shutdown`)
        for (const item of [...result.blocked, ...result.failed]) {
          console.error(`[session-trash] shutdown purge skipped ${item.sessionId}: ${item.reason}`)
        }
      } finally {
        purging = false
      }
    }

    const markShutdown = () => {
      shutdownRequested = true
    }
    process.on('SIGINT', markShutdown)
    process.on('SIGTERM', markShutdown)
    process.on('exit', purgeTrash)

    return () => {
      process.off('SIGINT', markShutdown)
      process.off('SIGTERM', markShutdown)
      process.off('exit', purgeTrash)
      if (shutdownRequested) purgeTrash()
    }
  }, 'session-trash: shutdown purge')
}
