/** Build the browser bundle from the supported trash-panel source fragment. */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const panelPath = fileURLToPath(new URL('../lib/panel.code.js', import.meta.url))
const outputPath = fileURLToPath(new URL('../lib/client.js', import.meta.url))
const panel = readFileSync(panelPath, 'utf8')

const output = `/**
 * @dsh-external/dsh-session-trash — generated browser bundle.
 * Source: lib/panel.code.js. Run npm run build:client after editing it.
 */
window.__ModuleLoader__.load({
\tid: '@dsh-external/dsh-session-trash',
\tfactory: (require) => {
\t\t'use strict'
\t\tvar module = { exports: {} }
\t\tvar exports = module.exports
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
\t\tconst React = require('react')
\t\tconst ReactDOM = require('react-dom')
\t\tconst primitives = require('@deepseek-ai/dsh-client-ui-primitives')
\t\tconst { Button, Modal, RiskConfirmation, Toast, Tooltip, IconTrashOutline16, IconCloseOutline16, IconWarningOutline16 } = primitives

${panel}

\t\texports.apply = apply
\t\texports.inject = inject
\t\treturn module.exports
\t},
})
`

if (!output.includes("ctx.slots.inject('sidebar.footer.action'") || output.includes('workspaceFork')) {
  throw new Error('[build-client] sanity check failed')
}

writeFileSync(outputPath, output)
console.log(`[build-client] wrote ${output.length} chars to lib/client.js`)
