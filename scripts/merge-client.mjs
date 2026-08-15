/**
 * Build lib/client.js from two source fragments:
 *   1. lib/panel.code.js            — the trash-panel source (this package)
 *   2. the stock workspace-browser client bundle (the installed
 *      @deepseek-ai/dsh-client-ui-workspace), patched to add a "delete" item
 *      to the session row menu and wrapped as an in-closure fork.
 *
 * Usage: node scripts/merge-client.mjs [stock-client.js-path] [version-tag]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const stockPath =
  process.argv[2] ??
  'C:/Users/ROG/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-ui-workspace/lib/client.js'
const versionTag = process.argv[3] ?? '0.1.0-rc.6'

let src = readFileSync(stockPath, 'utf8')

/** Apply one regex patch; the pattern must match exactly once. */
function patch(name, re, replacement) {
  const globalRe = new RegExp(re.source, 'g')
  const count = (src.match(globalRe) ?? []).length
  if (count !== 1) {
    throw new Error(`[merge-client] patch target "${name}" matched ${count} time(s), expected exactly 1`)
  }
  src = src.replace(re, replacement)
}

// 1. Session row menu: add a "delete" item after "archive".
patch(
  'menu item',
  /(IconArchiveOutline20, \{ size: 16 \}\)\n\t{4}\}\n\t{3}\];)/,
  'IconArchiveOutline20, { size: 16 })\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\tid: "delete",\n\t\t\t\t\tlabel: t("menu.deleteSession"),\n\t\t\t\t\ticon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 16 })\n\t\t\t\t}\n\t\t\t];',
)

// 2. Menu onSelect dispatch.
patch(
  'menu onSelect',
  /(\t*)(if \(id === "archive"\) onArchive\(node\.id\);)/,
  '$1$2\n$1if (id === "delete") onDelete(node.id, row.title);',
)

// 3. SessionNodeItem props.
patch('SessionNodeItem props', /onFork, onArchive, drag, flat = false, t \}\) \{/, 'onFork, onDelete, onArchive, drag, flat = false, t }) {')

// 4/5. SessionTree + FlatList props.
patch(
  'SessionTree props',
  /onSessionRename, onSessionArchive, insertWorkspaceBefore/,
  'onSessionRename, onSessionArchive, onSessionDelete, insertWorkspaceBefore',
)
patch(
  'FlatList props',
  /onSessionRename, onSessionArchive, archivedSessionIds/,
  'onSessionRename, onSessionArchive, onSessionDelete, archivedSessionIds',
)

// 6/7. SessionNodeItem call sites.
patch('SessionTree call site', /(onArchive: onSessionArchive,\n)(\t+)drag: \{/, '$1$2onDelete: onSessionDelete,\n$2drag: {')
patch('FlatList call site', /(onArchive: onSessionArchive,\n)(\t+)flat: true,/, '$1$2onDelete: onSessionDelete,\n$2flat: true,')

// 8. Deletion state inside WorkspaceBrowser.
patch(
  'browser state',
  /(\t{3}const \[searchOnExpand, setSearchOnExpand\] = \(0, react\.useState\)\(false\);)/,
  '$1\n\t\t\t// [session-trash] session deletion state (menu delete -> confirm -> trash)\n\t\t\tconst [sessionDeleteTarget, setSessionDeleteTarget] = (0, react.useState)(null);\n\t\t\tconst [sessionDeleteAck, setSessionDeleteAck] = (0, react.useState)(false);\n\t\t\tconst [sessionDeleting, setSessionDeleting] = (0, react.useState)(false);\n\t\t\tconst [sessionToast, setSessionToast] = (0, react.useState)(null);',
)

// 9. Delete flow handlers before onSessionArchive.
patch(
  'delete handlers',
  /(\t*)(const onSessionArchive = \(sessionId\) => \{)/,
  '$1const onSessionDelete = (sessionId, title) => {\n$1\tsetSessionDeleteAck(false);\n$1\tsetSessionDeleteTarget({ sessionId, title });\n$1};\n$1const closeSessionDelete = () => {\n$1\tif (sessionDeleting) return;\n$1\tsetSessionDeleteTarget(null);\n$1\tsetSessionDeleteAck(false);\n$1};\n$1const confirmSessionDelete = async () => {\n$1\tif (sessionDeleteTarget === null) return;\n$1\tsetSessionDeleting(true);\n$1\ttry {\n$1\t\tconst response = await fetch("/session-trash/delete", {\n$1\t\t\tmethod: "POST",\n$1\t\t\theaders: { "Content-Type": "application/json" },\n$1\t\t\tbody: JSON.stringify({ sessionId: sessionDeleteTarget.sessionId })\n$1\t\t});\n$1\t\tif (!response.ok) throw new Error("HTTP " + response.status);\n$1\t\tsetSessionToast({ key: Date.now(), text: t("menu.deleteToast") });\n$1\t} catch {\n$1\t\tsetSessionToast({ key: Date.now(), text: t("menu.deleteFailed") });\n$1\t} finally {\n$1\t\tsetSessionDeleting(false);\n$1\t\tsetSessionDeleteTarget(null);\n$1\t\tsetSessionDeleteAck(false);\n$1\t}\n$1};\n$1$2',
)

// 10/11. Pass onSessionDelete into the two list views.
patch('FlatList usage', /(onSessionArchive,\n)(\t+)archivedSessionIds,/, '$1$2onSessionDelete,\n$2archivedSessionIds,')
patch('SessionTree usage', /(onSessionArchive,\n)(\t+)forkSession,/, '$1$2onSessionDelete,\n$2forkSession,')

// 12. Append the RiskConfirmation + Toast to the browser root children.
// String-anchored (no regex): the tail layout is
//   <TAB*5>})   (delete-workspace Modal close, last root child)
//   <TAB*4>]    (root children array close)
//   <TAB*3>});  (root element close)
//   <TAB*2>}    (WorkspaceBrowser function close)
//   <TAB*2>//#endregion ... //#region lib/types/client/locales.js
{
  const T = '\t'
  const T5 = T.repeat(5)
  const T6 = T.repeat(6)
  const T7 = T.repeat(7)
  const rest =
    T.repeat(4) + ']\n' + T.repeat(3) + '});\n' + T.repeat(2) + '}\n' + T.repeat(2) + '//#endregion\n' + T.repeat(2) + '//#region lib/types/client/locales.js'
  const anchor = '\n' + T5 + '})\n' + rest
  const first = src.indexOf(anchor)
  if (first < 0 || src.indexOf(anchor, first + 1) >= 0) throw new Error('[merge-client] tail anchor not found (or ambiguous)')
  const insert =
    '\n' + T5 + '}),\n' +
    T5 + '(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.RiskConfirmation, {\n' +
    T6 + 'open: sessionDeleteTarget !== null,\n' +
    T6 + 'title: t("menu.deleteTitle"),\n' +
    T6 + 'description: sessionDeleteTarget === null ? "" : t("menu.deleteDesc", { title: sessionDeleteTarget.title }),\n' +
    T6 + 'acknowledgeLabel: t("menu.deleteAck"),\n' +
    T6 + 'cancelLabel: t("cancel"),\n' +
    T6 + 'confirmLabel: t("menu.deleteSession"),\n' +
    T6 + 'acknowledged: sessionDeleteAck,\n' +
    T6 + 'disabled: sessionDeleting,\n' +
    T6 + 'onAcknowledgedChange: setSessionDeleteAck,\n' +
    T6 + 'onCancel: closeSessionDelete,\n' +
    T6 + 'onConfirm: confirmSessionDelete\n' +
    T5 + '}),\n' +
    T5 + 'sessionToast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {\n' +
    T6 + 'key: sessionToast.key,\n' +
    T6 + 'text: sessionToast.text,\n' +
    T6 + 'onDone: () => {\n' +
    T7 + 'setSessionToast(null);\n' +
    T6 + '}\n' +
    T5 + '})\n' +
    rest
  src = src.replace(anchor, insert)
}

// 13/14. Locale keys.
patch(
  'zh locale',
  /(\t{3}"menu\.archiveSession": "归档会话",\n)/,
  '$1\t\t\t"menu.deleteSession": "删除会话",\n\t\t\t"menu.deleteTitle": "删除会话？",\n\t\t\t"menu.deleteDesc": "删除「{title}」后，该会话会立即从列表与搜索中隐藏。在关闭 dsh web 之前，你可以在回收站中恢复它；一旦 dsh web 关闭，该会话的全部记录将被永久删除，无法找回。",\n\t\t\t"menu.deleteAck": "我已知晓：dsh web 关闭后该会话将无法恢复",\n\t\t\t"menu.deleteToast": "已移入回收站",\n\t\t\t"menu.deleteFailed": "删除失败，请重试",\n',
)
patch(
  'en locale',
  /(\t{3}"menu\.archiveSession": "Archive session",\n)/,
  '$1\t\t\t"menu.deleteSession": "Delete session",\n\t\t\t"menu.deleteTitle": "Delete session?",\n\t\t\t"menu.deleteDesc": "Deleting \\"{title}\\" hides it from the list and search immediately. You can restore it from the trash until dsh web shuts down; once it shuts down, all records of this session are permanently deleted and cannot be recovered.",\n\t\t\t"menu.deleteAck": "I understand: after dsh web shuts down this session cannot be recovered",\n\t\t\t"menu.deleteToast": "Moved to trash",\n\t\t\t"menu.deleteFailed": "Delete failed, please retry",\n',
)

// Strip the loader wrapper: keep only the factory body.
const marker = 'factory: (require) => {'
const markerIndex = src.indexOf(marker)
if (markerIndex < 0) throw new Error('[merge-client] factory marker not found')
const bodyStart = src.indexOf('\n', markerIndex) + 1
const bodyEnd = src.lastIndexOf('\n});')
if (bodyEnd < 0) throw new Error('[merge-client] closing wrapper not found')
const forkBody = src.slice(bodyStart, bodyEnd)

const panel = readFileSync(fileURLToPath(new URL('../lib/panel.code.js', import.meta.url)), 'utf8')

const output = `/**
 * @dsh-external/dsh-session-trash — client half (GENERATED by scripts/merge-client.mjs, do not edit by hand).
 *
 * Contains two fragments:
 *   1. the trash-panel source (lib/panel.code.js);
 *   2. a fork of the stock workspace browser (${stockPath}, ${versionTag})
 *      patched with a "delete" item in the session row menu and wrapped as an
 *      in-closure module. The stock \`ui-workspace\` row is disabled by
 *      cordis.patch.yml so this fork is the only registrant of
 *      \`sidebar.workspaces\`.
 */
window.__ModuleLoader__.load({
	id: '@dsh-external/dsh-session-trash',
	factory: (require) => {
		'use strict'
		var module = { exports: {} }
		var exports = module.exports
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
		const React = require('react')
		const ReactDOM = require('react-dom')
		const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
		const { Button, RiskConfirmation, Toast, Tooltip, IconTrashOutline16, IconCloseOutline16, IconWarningOutline16 } = primitives

${panel}

		// [session-trash] Forked workspace browser (stock bundle + delete menu item).
		const workspaceFork = (function () {
${forkBody}
		)()

		exports.apply = apply
		exports.inject = inject
		return module.exports
	},
})
`

if (!output.includes('menu.deleteSession') || !output.includes('workspaceFork')) {
  throw new Error('[merge-client] sanity check failed on merged output')
}
writeFileSync(fileURLToPath(new URL('../lib/client.js', import.meta.url)), output)
console.log(`[merge-client] ok — stock: ${stockPath} (${versionTag}), fork body ${forkBody.length} chars, output ${output.length} chars`)
