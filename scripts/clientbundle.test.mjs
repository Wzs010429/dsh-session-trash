/** Regression checks for the browser bundle conflict that broke DSH startup. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const client = read('../lib/client.js')
const patch = read('../cordis.patch.yml')

assert.ok(client.includes("id: '@dsh-external/dsh-session-trash'"), 'bundle keeps its own module id')
assert.ok(client.includes("ctx.slots.inject('sidebar.footer.action'"), 'bundle uses the supported footer slot')
assert.ok(client.includes('data-session-trash-menu-item'), 'bundle enhances the stock session menu without forking it')
assert.ok(client.includes('[role="treeitem"][draggable="true"]'), 'menu bridge targets semantic session rows')
assert.ok(client.includes("'/session-trash/settings'"), 'bundle exposes the shutdown purge policy')
assert.ok(client.includes("'/session-trash/purge'"), 'bundle exposes guarded permanent purge')
assert.ok(client.includes("'/session-trash/preview'"), 'bundle previews subagent descendants before deletion')
assert.ok(client.includes("'entry.label.count'"), 'bundle renders a pending-trash count')
assert.ok(client.includes("'confirm.purge.title'"), 'bundle requires a dedicated permanent-delete confirmation')
assert.ok(client.includes('formatBytes'), 'bundle previews artifact sizes')
assert.ok(client.includes('function UndoToast'), 'bundle offers one-click restore after a soft delete')
assert.ok(client.includes('function DeleteConfirmation'), 'bundle offers an explicit current-only or cascade choice')
assert.ok(client.includes('cascade: cascadeDelete'), 'cascade deletion stays an explicit client request')
assert.ok(client.includes("new window.BroadcastChannel(TRASH_CHANNEL)"), 'bundle synchronizes trash changes across tabs')
assert.ok(client.includes('window.setInterval(refresh, 30000)'), 'bundle retains a low-frequency compatibility refresh')
assert.ok(client.includes("'data-session-trash-panel': ''"), 'bundle exposes a stable panel hook for theme packages')
assert.ok(client.includes('var(--dsw-specific-menu'), 'bundle uses the native Harness menu surface token')
assert.ok(client.includes('var(--dsw-alias-toast-bg'), 'undo banner follows the native Harness toast palette')
assert.ok(client.includes("'panel.size.missing'"), 'bundle distinguishes absent artifacts from unknown size')
assert.ok(client.includes("'panel.size.partial'"), 'bundle labels partial size totals conservatively')
assert.ok(client.includes("type: 'search'"), 'bundle provides a session and id filter')
assert.ok(client.includes('right.entry.archivedAt - left.entry.archivedAt'), 'trash rows are newest first')
assert.ok(!client.includes('--dsw-alias-surface-raised'), 'bundle does not depend on nonexistent surface tokens')
assert.ok(!client.includes('--dsw-alias-divider'), 'bundle does not depend on nonexistent divider tokens')
assert.ok(!client.includes('workspaceFork'), 'bundle does not embed the stock Workspace plugin')
assert.ok(!client.includes('const NS = "workspace"'), 'bundle cannot register the stock Workspace locale')
assert.ok(!patch.includes('id: ui-workspace'), 'bundle patch does not disable the stock Workspace entry')

console.log('clientbundle: all assertions passed')
