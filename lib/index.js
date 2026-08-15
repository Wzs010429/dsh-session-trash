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
 *  - RESTORE (same process lifetime): the registry has no unarchive API, so
 *    the plugin runs the write through the registry's own operation queue
 *    (`enqueueOperation` + `setState`). The domain write emits
 *    `domain/changed`, and the api-proxy pushes the fresh archive set to every
 *    client — the session reappears everywhere, instantly.
 *
 *  - HARD DELETE (on process exit): a `process.on('exit')` handler runs after
 *    the event loop drains — every session flush and domain write has settled,
 *    so the files on disk are final. The handler synchronously removes each
 *    trashed session's artifact directory, prunes its ids from
 *    `storages/workspace.json` (workspace accounting + archive set) and drops
 *    its rows from `storages/session_projcache.json`, then shrinks the
 *    manifest. All writes are tmp-file + rename (atomic).
 *
 *  - CRASH SAFETY: the manifest is durable. If the process dies without a
 *    clean exit (SIGKILL, power loss), the sessions stay archived (hidden)
 *    and the manifest reloads on the next start, so restore remains available
 *    and nothing is ever lost by accident. Only a clean shutdown commits the
 *    permanent purge.
 *
 * Data roots are derived the same way the shipped web profile does:
 * `$DSH_HOME` (default `~/.dsh`) with `sessions/` and `storages/` children.
 *
 * @module @dsh-external/dsh-session-trash
 */
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'

export const name = 'session-trash'

/**
 * Hard dependencies (the web profile provides every one of them). Declared so
 * the loader wires these services into the plugin fiber — `ctx.get()` on a
 * fiber context only resolves DECLARED services.
 */
export const inject = ['webServer', 'workspaceRegistry', 'sessionPersistence', 'sessions']

/** DSH data home; mirrors the dshHomePath() derivation of the shipped profile. */
const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const storagesRoot = join(dshHome, 'storages')
const sessionsRoot = join(dshHome, 'sessions')
const stateFile = join(storagesRoot, 'session-trash.json')

const API_ROOT = '/session-trash'
const MANIFEST_VERSION = 1

/** Loose but strict-enough session id guard (also keeps ids out of paths we touch). */
const SESSION_ID_PATTERN = /^session-[\w-]{8,}$/

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

/** Atomically replace `file` with pretty-printed JSON (same-dir temp + rename). */
export function writeJsonAtomic(file, value) {
  const data = `${JSON.stringify(value, null, 2)}\n`
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, data, 'utf8')
  renameSync(tmp, file)
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
  const file = entry && typeof entry.artifactPath === 'string' ? entry.artifactPath : undefined
  if (!file) return { ok: true }
  if (!isAbsolute(file)) return { ok: false, reason: `not an absolute path: ${file}` }
  const root = resolve(sessionsRoot)
  const target = resolve(file)
  if (target === root || !target.startsWith(root + sep)) {
    return { ok: false, reason: `outside sessions root: ${file}` }
  }
  const dir = dirname(target)
  if (dir !== root && dir.startsWith(root + sep) && basename(dir).startsWith('session-')) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return { ok: true, dir }
    } catch {
      // fall through to file-level removal
    }
  }
  try {
    rmSync(target, { force: true })
    return { ok: true, file: target }
  } catch (error) {
    return { ok: false, reason: String(error && error.message ? error.message : error) }
  }
}

/** Best-effort absolute artifact path for a live or cold session. */
async function locateArtifact(ctx, sessionId) {
  const persistence = ctx.get('sessionPersistence')
  if (!persistence || typeof persistence.locate !== 'function') return undefined
  const live = ctx.get('sessions')?.get(sessionId)
  if (live && live.header) {
    const loc = persistence.locate(live.header)
    if (loc && typeof loc.path === 'string') return loc.path
  }
  try {
    const headers = await persistence.list()
    for (const header of headers) {
      if (header && header.id === sessionId) {
        const loc = persistence.locate(header)
        if (loc && typeof loc.path === 'string') return loc.path
      }
    }
  } catch {
    // storage fault: leave artifactPath undefined; the exit purge skips it.
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * No hard injects: every seam is read through ctx.get() so the plugin stays a
 * quiet no-op in compositions that lack the web server, the workspace
 * registry, or the client surfaces.
 */
export function apply(ctx) {
  /** in-memory trash: sessionId -> { sessionId, archivedAt, artifactPath } */
  const trashMap = new Map()

  const loadTrash = () => {
    const doc = readJsonFile(stateFile)
    if (!doc || !Array.isArray(doc.trash)) return
    for (const entry of doc.trash) {
      if (entry && typeof entry.sessionId === 'string' && !trashMap.has(entry.sessionId)) {
        trashMap.set(entry.sessionId, {
          sessionId: entry.sessionId,
          archivedAt: typeof entry.archivedAt === 'number' ? entry.archivedAt : Date.now(),
          artifactPath: typeof entry.artifactPath === 'string' ? entry.artifactPath : undefined,
        })
      }
    }
  }
  loadTrash()
  if (trashMap.size > 0) ctx.logger.info(`[session-trash] restored ${trashMap.size} pending deletion(s) from manifest`)

  const saveTrash = () => {
    try {
      if (trashMap.size === 0) {
        if (existsSync(stateFile)) rmSync(stateFile, { force: true })
        return
      }
      writeJsonAtomic(stateFile, {
        version: MANIFEST_VERSION,
        trash: [...trashMap.values()],
      })
    } catch (error) {
      ctx.logger.warn(`[session-trash] manifest write failed: ${String(error)}`)
    }
  }

  const trashList = () =>
    [...trashMap.values()].map(({ sessionId, archivedAt }) => ({ sessionId, archivedAt }))

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
      respond(res, 200, { trash: trashList() })
    })

    register(`${API_ROOT}/delete`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!SESSION_ID_PATTERN.test(sessionId)) return respond(res, 400, { error: 'invalid session id' })
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      try {
        await registry.archiveSession(sessionId)
      } catch (error) {
        return respond(res, 404, {
          error: `cannot delete session: ${String(error && error.message ? error.message : error)}`,
        })
      }
      if (!trashMap.has(sessionId)) {
        const entry = { sessionId, archivedAt: Date.now(), artifactPath: undefined }
        try {
          entry.artifactPath = await locateArtifact(ctx, sessionId)
        } catch {
          // locate is best-effort; the exit purge skips entries without a path.
        }
        trashMap.set(sessionId, entry)
        saveTrash()
      }
      respond(res, 200, { trash: trashList() })
    })

    register(`${API_ROOT}/restore`, async (req, res) => {
      if (req.method !== 'POST') return respond(res, 405, { error: 'method not allowed' })
      const body = await readBody(req)
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!SESSION_ID_PATTERN.test(sessionId)) return respond(res, 400, { error: 'invalid session id' })
      const registry = ctx.get('workspaceRegistry')
      if (!registry) return respond(res, 503, { error: 'workspace registry unavailable' })
      if (!trashMap.has(sessionId)) return respond(res, 404, { error: 'session is not in the trash' })
      try {
        // Unarchive through the registry's own write path: its in-memory state
        // and the durable domain stay coherent, and the domain write emits
        // `domain/changed`, which the api-proxy turns into a
        // `host/archived-sessions-changed` frame for every connected client.
        await registry.enqueueOperation(async () => {
          const state = registry.requireState()
          if (!state.archivedSessionIds.includes(sessionId)) return
          await registry.setState({
            ...state,
            archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
          })
        })
      } catch (error) {
        return respond(res, 500, {
          error: `cannot restore session: ${String(error && error.message ? error.message : error)}`,
        })
      }
      trashMap.delete(sessionId)
      saveTrash()
      respond(res, 200, { trash: trashList() })
    })

    ctx.effect(() => () => {
      for (const dispose of disposers) dispose()
    }, 'session-trash: http routes')
  }

  // ---- hard purge on process exit --------------------------------------
  // `exit` fires after the event loop drains: session flushes and domain
  // writes have settled, so the files on disk are final. Sync fs only; every
  // step is guarded so a partial failure degrades toward "keep the data".
  ctx.effect(() => {
    const onExit = () => {
      if (trashMap.size === 0) return
      const removed = new Set()
      for (const entry of trashMap.values()) {
        const result = deleteSessionArtifact(entry)
        if (result.ok) {
          removed.add(entry.sessionId)
        } else {
          console.error(`[session-trash] artifact purge failed for ${entry.sessionId}: ${result.reason}`)
        }
      }
      if (removed.size > 0) {
        const ids = [...removed]
        try {
          const file = join(storagesRoot, 'workspace.json')
          const doc = readJsonFile(file)
          if (doc !== undefined) {
            const { doc: next, changed } = stripSessionFromWorkspaceDoc(doc, ids)
            if (changed) writeJsonAtomic(file, next)
          }
        } catch (error) {
          console.error(`[session-trash] workspace registry cleanup failed: ${String(error)}`)
        }
        try {
          const file = join(storagesRoot, 'session_projcache.json')
          const doc = readJsonFile(file)
          if (doc !== undefined) {
            const { doc: next, changed } = stripSessionFromProjcacheDoc(doc, ids)
            if (changed) writeJsonAtomic(file, next)
          }
        } catch (error) {
          console.error(`[session-trash] projection cache cleanup failed: ${String(error)}`)
        }
      }
      const rest = [...trashMap.values()].filter((entry) => !removed.has(entry.sessionId))
      try {
        if (rest.length === 0) {
          if (existsSync(stateFile)) rmSync(stateFile, { force: true })
        } else {
          writeJsonAtomic(stateFile, { version: MANIFEST_VERSION, trash: rest })
        }
      } catch (error) {
        console.error(`[session-trash] manifest update failed: ${String(error)}`)
      }
      if (removed.size > 0) console.log(`[session-trash] purged ${removed.size} session(s) on shutdown`)
    }
    process.on('exit', onExit)
    return () => process.off('exit', onExit)
  }, 'session-trash: exit purge')
}
