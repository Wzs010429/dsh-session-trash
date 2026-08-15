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

const API_ROOT = '/session-trash'
const MANIFEST_VERSION = 3
const SETTINGS_VERSION = 1

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
  return {
    purgeOnShutdown: doc?.purgeOnShutdown !== false,
  }
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
    ...(batchId ? { batchId } : {}),
    ...(batchRootSessionId ? { batchRootSessionId } : {}),
  }
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
  let trashNeedsSave = false

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
        artifactMissing: entry.artifactMissing === true,
        live,
        canRestore: entry.state !== 'purging',
        canPurge: entry.state !== 'pending' && !live,
        ...(entry.batchId ? { batchId: entry.batchId, batchSize: batchSizes.get(entry.batchId) ?? 1 } : {}),
        ...(entry.batchRootSessionId ? { batchRootSessionId: entry.batchRootSessionId } : {}),
      }
    })
  }
  const settingsSnapshot = () => ({ ...settings })
  const saveSettings = (next) => {
    writeJsonAtomic(settingsFile, {
      version: SETTINGS_VERSION,
      ...next,
    })
    settings = next
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
      } else if (!allowLive && isLive(sessionId)) {
        blocked.push({ sessionId, reason: 'session is still running' })
      } else {
        candidates.push(entry)
      }
    }
    for (const entry of candidates) purgeInFlight.add(entry.sessionId)

    const newlyPurging = candidates.filter((entry) => entry.state !== 'purging')
    for (const entry of newlyPurging) entry.state = 'purging'
    if (newlyPurging.length > 0) {
      try {
        persistTrash()
      } catch (error) {
        for (const entry of newlyPurging) entry.state = 'committed'
        for (const entry of candidates) failed.push({ sessionId: entry.sessionId, reason: `cannot start purge: ${String(error)}` })
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
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
        failed.push({ sessionId: entry.sessionId, reason: result.reason })
      }
    }
    if (failed.length > 0) saveTrash()

    const ids = artifactRemoved.map((entry) => entry.sessionId)
    if (ids.length === 0) {
      for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
      return { purged: [], blocked, failed, trash: trashList() }
    }
    const finish = (metadata) => {
      if (!metadata.ok) {
        const reason = metadata.errors.join('; ')
        for (const entry of artifactRemoved) failed.push({ sessionId: entry.sessionId, reason })
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
        saveTrash()
        return { purged: [], blocked, failed, trash: trashList() }
      }

      for (const entry of artifactRemoved) trashMap.delete(entry.sessionId)
      try {
        persistTrash()
      } catch (error) {
        for (const entry of artifactRemoved) trashMap.set(entry.sessionId, entry)
        for (const entry of artifactRemoved) failed.push({ sessionId: entry.sessionId, reason: `cleanup committed but manifest update failed: ${String(error)}` })
        for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
        return { purged: [], blocked, failed, trash: trashList() }
      }
      for (const entry of candidates) purgeInFlight.delete(entry.sessionId)
      return { purged: ids, blocked, failed, trash: trashList() }
    }

    if (options.runtimeMetadata === false) return finish(cleanupMetadataSync(ids))
    return cleanupMetadataRuntime(ids).then(finish, (error) => finish({ ok: false, errors: [String(error)] }))
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
      respond(res, 200, { trash: trashList(), settings: settingsSnapshot() })
    })

    register(`${API_ROOT}/settings`, async (req, res) => {
      if (req.method === 'GET') return respond(res, 200, { settings: settingsSnapshot() })
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      if (typeof body.purgeOnShutdown !== 'boolean') {
        return respond(res, 400, { error: 'purgeOnShutdown must be a boolean' })
      }
      try {
        saveSettings({ purgeOnShutdown: body.purgeOnShutdown })
      } catch (error) {
        return respond(res, 500, {
          error: `cannot save settings: ${String(error && error.message ? error.message : error)}`,
        })
      }
      respond(res, 200, { settings: settingsSnapshot() })
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
      respond(res, 200, { trash: trashList(), deleted: sessionIds, batchId })
    })

    register(`${API_ROOT}/restore`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!SESSION_ID_PATTERN.test(sessionId)) return respond(res, 400, { error: 'invalid session id' })
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      const entry = trashMap.get(sessionId)
      if (!entry) return respond(res, 404, { error: 'session is not in the trash' })
      const entries = entry.batchId
        ? [...trashMap.values()].filter((candidate) => candidate.batchId === entry.batchId)
        : [entry]
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
      respond(res, 200, { trash: trashList(), restored: sessionIds, batchId: entry.batchId })
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
      const result = await purgeEntries(body.sessionIds)
      respond(res, 200, result)
    })

    ctx.effect(() => () => {
      for (const dispose of disposers) dispose()
    }, 'session-trash: http routes')
  }

  // ---- hard purge during Harness shutdown ------------------------------
  // DSH handles SIGINT/SIGTERM by disposing the Cordis tree before calling
  // process.exit(). Remember the signal and commit from this plugin's disposer;
  // an exit listener remains as a forced-shutdown fallback.
  ctx.effect(() => {
    let shutdownRequested = false
    let purging = false

    const purgeTrash = () => {
      if (purging || trashMap.size === 0) return
      if (!settings.purgeOnShutdown) {
        console.log(`[session-trash] preserved ${trashMap.size} trashed session(s); shutdown purge is disabled`)
        return
      }
      purging = true
      try {
        const result = purgeEntries([...trashMap.keys()], { allowLive: true, runtimeMetadata: false })
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
