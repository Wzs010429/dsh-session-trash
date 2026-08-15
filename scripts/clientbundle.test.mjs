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
assert.ok(client.includes("'entry.label.count'"), 'bundle renders a pending-trash count')
assert.ok(client.includes("'confirm.purge.title'"), 'bundle requires a dedicated permanent-delete confirmation')
assert.ok(client.includes('formatBytes'), 'bundle previews artifact sizes')
assert.ok(!client.includes('workspaceFork'), 'bundle does not embed the stock Workspace plugin')
assert.ok(!client.includes('const NS = "workspace"'), 'bundle cannot register the stock Workspace locale')
assert.ok(!patch.includes('id: ui-workspace'), 'bundle patch does not disable the stock Workspace entry')

console.log('clientbundle: all assertions passed')
