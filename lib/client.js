/**
 * @dsh-external/dsh-session-trash — generated browser bundle.
 * Source: lib/panel.code.js. Run npm run build:client after editing it.
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

		// ------------------------------------------------------------------
		// Trash panel (sidebar footer entry) — source fragment, stitched into
		// lib/client.js by scripts/build-client.mjs.
		// ------------------------------------------------------------------
		const NS = 'session-trash'
		const zh = {
			'entry.label': '回收站',
			'entry.label.count': '回收站，{count} 个待处理会话',
			'panel.title': '会话回收站',
			'panel.note.auto': '删除的会话会立即隐藏并可恢复；正常关闭 dsh web 时永久清理。',
			'panel.note.keep': '删除的会话会立即隐藏并持续保留，直到恢复或重新开启关停清理。',
			'panel.sessions': '会话',
			'panel.trash': '回收站中',
			'panel.empty.sessions': '没有可删除的会话',
			'panel.empty.trash': '回收站是空的',
			'panel.delete': '删除',
			'panel.restore': '恢复',
			'panel.purge': '永久删除',
			'panel.purge.retry': '重试清理',
			'panel.empty.action': '清空回收站',
			'panel.size.unknown': '大小未知',
			'panel.state.pending': '安全事务待完成',
			'panel.state.purging': '物理清理待完成',
			'menu.delete': '删除当前会话',
			'panel.current': '当前',
			'panel.running': '运行中',
			'panel.subagent': '子代理',
			'panel.local': '仅本机生效',
			'settings.purge.title': '关闭时永久清理',
			'settings.purge.description': '关闭后删除日志、工作区登记和投影缓存',
			'confirm.title': '删除会话？',
			'confirm.description.auto': '删除「{title}」后，该会话会立即从列表与搜索中隐藏。在关闭 dsh web 之前可以恢复；正常关闭后，其全部记录将被永久删除。',
			'confirm.description.keep': '删除「{title}」后，该会话会立即从列表与搜索中隐藏，并保留在回收站中，直到你恢复它或重新开启关停清理。',
			'confirm.description.current': '这是当前正在使用的会话：删除后界面会回到新会话，该会话可能继续在后台运行。',
			'confirm.acknowledge.auto': '我已知晓：正常关闭 dsh web 后该会话将无法恢复',
			'confirm.acknowledge.keep': '我已知晓：该会话将保持隐藏，直到从回收站恢复',
			'confirm.confirm': '删除',
			'confirm.cancel': '取消',
			'confirm.purge.title': '永久删除会话？',
			'confirm.purge.description': '将永久删除「{title}」的日志、工作区登记和投影缓存，预计释放 {size}。此操作无法撤销。',
			'confirm.purge.description.all': '将永久删除 {count} 个已停止会话，预计释放 {size}。{skipped} 个运行中或待恢复会话会被安全保留。',
			'confirm.purge.acknowledge': '我已知晓：永久删除后无法恢复',
			'confirm.purge.confirm': '永久删除',
			'toast.deleted': '已移入回收站',
			'toast.restored': '已恢复会话',
			'toast.purged': '已永久删除 {count} 个会话',
			'toast.purge.partial': '已删除 {count} 个，另有 {skipped} 个被安全跳过',
			'toast.purge.none': '未删除：{skipped} 个会话仍在运行或等待安全恢复',
			'toast.settings': '清理策略已更新',
			'toast.failed': '操作失败，请重试',
		}
		const en = {
			'entry.label': 'Trash',
			'entry.label.count': 'Trash, {count} pending sessions',
			'panel.title': 'Session Trash',
			'panel.note.auto': 'Deleted sessions are hidden and restorable until dsh web shuts down, then permanently removed.',
			'panel.note.keep': 'Deleted sessions stay hidden and restorable until you restore them or re-enable shutdown purge.',
			'panel.sessions': 'Sessions',
			'panel.trash': 'In trash',
			'panel.empty.sessions': 'No sessions to delete',
			'panel.empty.trash': 'Trash is empty',
			'panel.delete': 'Delete',
			'panel.restore': 'Restore',
			'panel.purge': 'Delete permanently',
			'panel.purge.retry': 'Retry cleanup',
			'panel.empty.action': 'Empty trash',
			'panel.size.unknown': 'Size unknown',
			'panel.state.pending': 'safe transaction pending',
			'panel.state.purging': 'physical cleanup pending',
			'menu.delete': 'Delete this session',
			'panel.current': 'current',
			'panel.running': 'running',
			'panel.subagent': 'subagent',
			'panel.local': 'Local only',
			'settings.purge.title': 'Purge permanently on shutdown',
			'settings.purge.description': 'Remove logs, workspace records, and projection cache on shutdown',
			'confirm.title': 'Delete session?',
			'confirm.description.auto': 'Deleting "{title}" hides it from the list and search immediately. You can restore it until dsh web shuts down; after a normal shutdown all records are permanently removed.',
			'confirm.description.keep': 'Deleting "{title}" hides it from the list and search while keeping it in the trash until you restore it or re-enable shutdown purge.',
			'confirm.description.current': 'This is the current session: the view returns to a new session while this one may keep running in the background.',
			'confirm.acknowledge.auto': 'I understand: after a normal dsh web shutdown this session cannot be recovered',
			'confirm.acknowledge.keep': 'I understand: this session stays hidden until restored from the trash',
			'confirm.confirm': 'Delete',
			'confirm.cancel': 'Cancel',
			'confirm.purge.title': 'Permanently delete sessions?',
			'confirm.purge.description': 'Permanently remove the log, workspace record, and projection cache for "{title}", freeing about {size}. This cannot be undone.',
			'confirm.purge.description.all': 'Permanently remove {count} stopped sessions, freeing about {size}. {skipped} running or recovery-pending sessions will be kept safely.',
			'confirm.purge.acknowledge': 'I understand: permanently deleted sessions cannot be restored',
			'confirm.purge.confirm': 'Delete permanently',
			'toast.deleted': 'Moved to trash',
			'toast.restored': 'Session restored',
			'toast.purged': 'Permanently deleted {count} sessions',
			'toast.purge.partial': 'Deleted {count}; safely skipped {skipped}',
			'toast.purge.none': 'Nothing deleted: {skipped} sessions are running or recovery-pending',
			'toast.settings': 'Purge policy updated',
			'toast.failed': 'Operation failed, please retry',
		}

		// ------------------------------------------------------------------
		// Helpers
		// ------------------------------------------------------------------
		const interpolate = (text, params) => {
			if (!params) return text
			return text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match))
		}
		const basenameOf = (cwd) => {
			if (!cwd) return ''
			const trimmed = cwd.replace(/[\\/]+$/, '')
			const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
			return index >= 0 ? trimmed.slice(index + 1) : trimmed
		}
		const callApi = async (path, payload) => {
			const response = await fetch(
				path,
				payload === undefined
					? { method: 'GET' }
					: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
			)
			const data = await response.json().catch(() => ({}))
			if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
			return data
		}
		const errorMessage = (error) => {
			if (error && typeof error.message === 'string' && error.message) return error.message
			return String(error || 'unknown error')
		}
		const formatBytes = (bytes, unknownLabel) => {
			if (!Number.isFinite(bytes) || bytes < 0) return unknownLabel
			if (bytes < 1024) return `${bytes} B`
			const units = ['KB', 'MB', 'GB', 'TB']
			let value = bytes / 1024
			let unit = 0
			while (value >= 1024 && unit < units.length - 1) {
				value /= 1024
				unit += 1
			}
			return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`
		}
		const useSessionsSnapshot = (ctx) => {
			const store = ctx.sessions && ctx.sessions.list
			const subscribe = React.useCallback((callback) => (store ? store.subscribe(callback) : () => {}), [store])
			const getSnapshot = React.useCallback(() => (store ? store.getSnapshot() : { ids: [], byId: {}, current: undefined }), [store])
			return React.useSyncExternalStore(subscribe, getSnapshot)
		}

		// ------------------------------------------------------------------
		// Styles (theme tokens with graceful fallbacks)
		// ------------------------------------------------------------------
		const styles = {
			panel: {
				position: 'fixed',
				zIndex: 60,
				width: 'min(368px, calc(100vw - 16px))',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 6,
				padding: 10,
				borderRadius: 10,
				background: 'var(--dsw-alias-surface-raised, #ffffff)',
				color: 'var(--dsw-alias-label-primary, #1f2328)',
				border: '1px solid var(--dsw-alias-divider, rgba(127,127,127,0.2))',
				boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
				fontSize: 13,
				lineHeight: 1.4,
			},
			header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
			title: { fontWeight: 600, fontSize: 14 },
			close: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary, #6b7280)', cursor: 'pointer', padding: 2, display: 'inline-flex', borderRadius: 4 },
			note: { color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 12, marginBottom: 2 },
			sectionLabel: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 },
			sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
			list: { display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 168 },
			row: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			rowMain: { flex: 1, minWidth: 0 },
			rowTitle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			rowMeta: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, display: 'flex', gap: 6 },
			rowActions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
			badge: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)' },
			badgeWarn: { color: 'var(--dsw-alias-state-warning-primary, #d97706)' },
			badgeError: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
			countBadge: { position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'var(--dsw-alias-state-error-primary, #e5484d)', fontSize: 9, fontWeight: 700, pointerEvents: 'none' },
			settingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			settingText: { flex: 1, minWidth: 0 },
			settingTitle: { fontSize: 12, fontWeight: 600 },
			settingDescription: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11 },
			empty: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 12, padding: '4px 6px' },
			foot: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, marginTop: 2, borderTop: '1px solid var(--dsw-alias-divider, rgba(127,127,127,0.16))', paddingTop: 6 },
		}

		// ------------------------------------------------------------------
		// Panel
		// ------------------------------------------------------------------
		function TrashEntry(props) {
			const ctx = props.ctx
			const t = props.t
			const wide = props.wide
			const list = useSessionsSnapshot(ctx)
			const [open, setOpen] = React.useState(false)
			const [trash, setTrash] = React.useState([])
			const [settings, setSettings] = React.useState({ purgeOnShutdown: true })
			const [busy, setBusy] = React.useState(false)
			const [target, setTarget] = React.useState(null)
			const [purgeTarget, setPurgeTarget] = React.useState(null)
			const [acknowledged, setAcknowledged] = React.useState(false)
			const [toast, setToast] = React.useState(null)
			const anchorRef = React.useRef(null)
			const [panelPos, setPanelPos] = React.useState(null)

			const refresh = React.useCallback(async () => {
				try {
					const data = await callApi('/session-trash/list')
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					if (typeof data.settings?.purgeOnShutdown === 'boolean') setSettings(data.settings)
				} catch {
					// Keep the last known state when a background refresh fails.
				}
			}, [])

			React.useEffect(() => {
				refresh()
				window.addEventListener('focus', refresh)
				return () => window.removeEventListener('focus', refresh)
			}, [refresh])

			React.useEffect(() => {
				if (!open) return undefined
				const timer = window.setInterval(refresh, 5000)
				return () => window.clearInterval(timer)
			}, [open, refresh])

			const toggle = () => {
				setOpen((value) => {
					const next = !value
					if (next) {
						refresh()
						const rect = anchorRef.current && anchorRef.current.getBoundingClientRect()
						if (rect) {
							const left = Math.max(8, Math.min(rect.left, window.innerWidth - 376))
							setPanelPos({ left, bottom: window.innerHeight - rect.top + 6 })
						}
					}
					return next
				})
			}

			React.useEffect(() => {
				if (!open) return undefined
				const onKey = (event) => {
					if (event.key === 'Escape') setOpen(false)
				}
				window.addEventListener('keydown', onKey)
				return () => window.removeEventListener('keydown', onKey)
			}, [open])

			React.useEffect(() => {
				let pendingMenuSession = null
				let pendingMenuTrigger = null

				const rememberSessionMenu = (event) => {
					const button = event.target instanceof Element ? event.target.closest('button[aria-label]') : null
					const row = button && button.closest('[role="treeitem"][draggable="true"]')
					if (!row || !row.contains(button)) return

					const titleNode = row.querySelector('span:not(:empty)')
					const title = titleNode && titleNode.textContent ? titleNode.textContent.trim() : ''
					const matches = list.ids
						.map((id) => list.byId[id])
						.filter((summary) => summary && rowLabel(summary) === title)

					// Ambiguous titles are left to the trash panel, where ids stay explicit.
					pendingMenuSession = matches.length === 1 ? matches[0] : null
					pendingMenuTrigger = pendingMenuSession ? button : null
				}

				const enhanceMenus = () => {
					if (!pendingMenuSession) return
					for (const menu of document.querySelectorAll('[role="menu"]')) {
						if (menu.querySelector('[data-session-trash-menu-item]')) continue
						const items = [...menu.querySelectorAll('button[role="menuitem"]')]
						const archiveItem = items.find((item) => ['归档会话', 'Archive session'].includes(item.textContent.trim()))
						if (!archiveItem || !archiveItem.parentElement || !archiveItem.parentElement.parentElement) continue

						const summary = pendingMenuSession
						const trigger = pendingMenuTrigger
						const wrapper = archiveItem.parentElement.cloneNode(false)
						const item = archiveItem.cloneNode(true)
						item.dataset.sessionTrashMenuItem = ''
						item.setAttribute('aria-label', t('menu.delete'))
						item.style.color = 'var(--dsw-alias-state-error-primary, #e5484d)'

						const spans = item.querySelectorAll('span')
						const label = spans[spans.length - 1]
						if (label) label.textContent = t('menu.delete')
						const trashIcon = anchorRef.current && anchorRef.current.querySelector('svg')
						const oldIcon = item.querySelector('svg')
						if (trashIcon && oldIcon) oldIcon.replaceWith(trashIcon.cloneNode(true))

						item.addEventListener('click', (event) => {
							event.preventDefault()
							event.stopPropagation()
							setAcknowledged(false)
							setTarget(summary)
							if (trigger && document.contains(trigger)) trigger.click()
						})
						wrapper.appendChild(item)
						archiveItem.parentElement.parentElement.appendChild(wrapper)
					}
				}

				document.addEventListener('click', rememberSessionMenu, true)
				const observer = new MutationObserver(enhanceMenus)
				observer.observe(document.body, { childList: true, subtree: true })
				return () => {
					document.removeEventListener('click', rememberSessionMenu, true)
					observer.disconnect()
				}
			}, [list, t])

			const doDelete = async () => {
				if (!target) return
				setBusy(true)
				try {
					const data = await callApi('/session-trash/delete', { sessionId: target.id })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					setToast({ key: Date.now(), text: t('toast.deleted'), kind: 'ok' })
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
					setTarget(null)
					setAcknowledged(false)
				}
			}

			const doRestore = async (sessionId) => {
				setBusy(true)
				try {
					const data = await callApi('/session-trash/restore', { sessionId })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					setToast({ key: Date.now(), text: t('toast.restored'), kind: 'ok' })
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const requestPurge = (entries, title, all = false) => {
				if (!Array.isArray(entries) || entries.length === 0) return
				setTarget(null)
				setAcknowledged(false)
				setPurgeTarget({ entries, title, all })
			}

			const doPurge = async () => {
				if (!purgeTarget) return
				setBusy(true)
				try {
					const data = await callApi('/session-trash/purge', { sessionIds: purgeTarget.entries.map((entry) => entry.sessionId) })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					const count = Array.isArray(data.purged) ? data.purged.length : 0
					const skipped = (Array.isArray(data.blocked) ? data.blocked.length : 0) + (Array.isArray(data.failed) ? data.failed.length : 0)
					const text = count === 0
						? t('toast.purge.none', { skipped })
						: skipped > 0
							? t('toast.purge.partial', { count, skipped })
							: t('toast.purged', { count })
					setToast({ key: Date.now(), text, kind: skipped > 0 ? 'error' : 'ok' })
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
					setPurgeTarget(null)
					setAcknowledged(false)
				}
			}

			const updatePurgePolicy = async (purgeOnShutdown) => {
				setBusy(true)
				try {
					const data = await callApi('/session-trash/settings', { purgeOnShutdown })
					if (typeof data.settings?.purgeOnShutdown === 'boolean') setSettings(data.settings)
					setToast({ key: Date.now(), text: t('toast.settings'), kind: 'ok' })
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const trashIds = React.useMemo(() => new Set(trash.map((entry) => entry.sessionId)), [trash])
			const rows = list.ids
				.map((id) => list.byId[id])
				.filter((summary) => summary && !summary.blank && !trashIds.has(summary.id))

			const trashRows = trash.map((entry) => ({
				entry,
				summary: list.byId[entry.sessionId],
			}))
			const purgeableEntries = trash.filter((entry) => entry.canPurge)
			const knownTrashSizeCount = trash.filter((entry) => Number.isFinite(entry.sizeBytes)).length
			const knownTrashBytes = trash.reduce((total, entry) => total + (Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : 0), 0)
			const purgeBytes = purgeTarget
				? purgeTarget.entries.reduce((total, entry) => total + (Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : 0), 0)
				: 0
			const purgeKnownSizeCount = purgeTarget ? purgeTarget.entries.filter((entry) => Number.isFinite(entry.sizeBytes)).length : 0
			const purgeSkipped = purgeTarget && purgeTarget.all ? trash.length - purgeTarget.entries.length : 0

			const metaOf = (summary) => {
				const parts = []
				const workspace = basenameOf(summary.cwd)
				if (workspace) parts.push({ text: workspace, style: styles.badge })
				if (summary.origin === 'subagent') parts.push({ text: t('panel.subagent'), style: styles.badgeWarn })
				if (summary.running) parts.push({ text: t('panel.running'), style: styles.badgeWarn })
				if (summary.id === list.current) parts.push({ text: t('panel.current'), style: styles.badgeError })
				return parts
			}

			const rowLabel = (summary) => (summary && summary.displayTitle ? summary.displayTitle : summary && summary.title ? summary.title : summary ? summary.id : undefined)

			const panel = open
				? ReactDOM.createPortal(
						React.createElement(
							'div',
							{ style: { ...styles.panel, left: panelPos ? panelPos.left : 16, bottom: panelPos ? panelPos.bottom : 56, maxHeight: Math.min(520, window.innerHeight - 96), overflowY: 'auto' }, role: 'dialog', 'aria-label': t('panel.title') },
							React.createElement(
								'div',
								{ style: styles.header },
								React.createElement('span', { style: styles.title }, t('panel.title')),
								React.createElement(
									'button',
									{ type: 'button', style: styles.close, 'aria-label': t('panel.title'), onClick: () => setOpen(false) },
									React.createElement(IconCloseOutline16, null),
								),
							),
							React.createElement('div', { style: styles.note }, t(settings.purgeOnShutdown ? 'panel.note.auto' : 'panel.note.keep')),
							React.createElement(
								'label',
								{ style: styles.settingRow },
								React.createElement('input', {
									type: 'checkbox',
									role: 'switch',
									checked: settings.purgeOnShutdown,
									disabled: busy,
									onChange: (event) => updatePurgePolicy(event.target.checked),
								}),
								React.createElement(
									'div',
									{ style: styles.settingText },
									React.createElement('div', { style: styles.settingTitle }, t('settings.purge.title')),
									React.createElement('div', { style: styles.settingDescription }, t('settings.purge.description')),
								),
							),
							React.createElement('div', { style: styles.sectionLabel }, `${t('panel.sessions')} (${rows.length})`),
							rows.length === 0
								? React.createElement('div', { style: styles.empty }, t('panel.empty.sessions'))
								: React.createElement(
										'div',
										{ style: styles.list },
										rows.map((summary) =>
											React.createElement(
												'div',
												{ key: summary.id, style: styles.row },
												React.createElement(
													'div',
													{ style: styles.rowMain },
													React.createElement('div', { style: styles.rowTitle, title: rowLabel(summary) }, rowLabel(summary)),
													React.createElement(
														'div',
														{ style: styles.rowMeta },
														metaOf(summary).map((part, index) => React.createElement('span', { key: index, style: part.style }, part.text)),
													),
												),
												React.createElement(Button, {
													variant: 'ghost',
													size: 'sm',
													disabled: busy,
													'aria-label': t('panel.delete'),
													style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
													onClick: () => {
														setAcknowledged(false)
														setTarget(summary)
													},
													children: t('panel.delete'),
												}),
											),
										),
								  ),
							React.createElement(
								'div',
								{ style: styles.sectionHeader },
								React.createElement(
									'div',
									{ style: styles.sectionLabel },
									`${t('panel.trash')} (${trashRows.length} · ${formatBytes(knownTrashSizeCount > 0 ? knownTrashBytes : undefined, t('panel.size.unknown'))})`,
								),
								React.createElement(Button, {
									variant: 'ghost',
									size: 'sm',
									disabled: busy || purgeableEntries.length === 0,
									style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
									onClick: () => requestPurge(purgeableEntries, undefined, true),
									children: t('panel.empty.action'),
								}),
							),
							trashRows.length === 0
								? React.createElement('div', { style: styles.empty }, t('panel.empty.trash'))
								: React.createElement(
										'div',
										{ style: styles.list },
										trashRows.map(({ entry, summary }) =>
											React.createElement(
												'div',
												{ key: entry.sessionId, style: styles.row },
												React.createElement(
													'div',
													{ style: styles.rowMain },
													React.createElement('div', { style: styles.rowTitle, title: entry.sessionId }, rowLabel(summary) || entry.sessionId),
													React.createElement(
														'div',
												{ style: styles.rowMeta },
												React.createElement('span', { style: styles.badge }, new Date(entry.archivedAt).toLocaleString()),
												React.createElement('span', { style: styles.badge }, formatBytes(entry.sizeBytes, t('panel.size.unknown'))),
												entry.live && React.createElement('span', { style: styles.badgeWarn }, t('panel.running')),
												entry.state === 'pending' && React.createElement('span', { style: styles.badgeWarn }, t('panel.state.pending')),
												entry.state === 'purging' && React.createElement('span', { style: styles.badgeError }, t('panel.state.purging')),
											),
										),
										React.createElement(
											'div',
											{ style: styles.rowActions },
											React.createElement(Button, {
												variant: 'ghost',
												size: 'sm',
												disabled: busy || entry.canRestore === false,
												'aria-label': `${t('panel.restore')}: ${rowLabel(summary) || entry.sessionId}`,
												onClick: () => doRestore(entry.sessionId),
												children: t('panel.restore'),
											}),
											React.createElement(Button, {
												variant: 'ghost',
												size: 'sm',
												disabled: busy || !entry.canPurge,
												'aria-label': `${t(entry.state === 'purging' ? 'panel.purge.retry' : 'panel.purge')}: ${rowLabel(summary) || entry.sessionId}`,
												style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
												onClick: () => requestPurge([entry], rowLabel(summary) || entry.sessionId),
												children: t(entry.state === 'purging' ? 'panel.purge.retry' : 'panel.purge'),
											}),
										),
											),
										),
								  ),
							React.createElement('div', { style: styles.foot }, t('panel.local')),
						),
						document.body,
				  )
				: null

			return React.createElement(
				'div',
				{ ref: anchorRef, style: { position: 'relative' } },
				React.createElement(
					Tooltip,
					{ label: trash.length > 0 ? t('entry.label.count', { count: trash.length }) : t('entry.label'), delayMs: 500, disabled: wide },
					React.createElement(Button, {
						variant: 'ghost',
						size: 'sm',
						icon: React.createElement(IconTrashOutline16, null),
						'aria-label': trash.length > 0 ? t('entry.label.count', { count: trash.length }) : t('entry.label'),
						'aria-expanded': open,
						onClick: toggle,
						children: wide ? `${t('entry.label')}${trash.length > 0 ? ` (${trash.length})` : ''}` : null,
					}),
				),
				!wide && trash.length > 0 && React.createElement('span', { style: styles.countBadge, 'aria-hidden': true }, trash.length > 99 ? '99+' : String(trash.length)),
				panel,
				target !== null &&
					React.createElement(RiskConfirmation, {
						open: true,
						title: t('confirm.title'),
						description: t(settings.purgeOnShutdown ? 'confirm.description.auto' : 'confirm.description.keep', { title: rowLabel(target) }) + (target.id === list.current ? ` ${t('confirm.description.current')}` : ''),
						acknowledgeLabel: t(settings.purgeOnShutdown ? 'confirm.acknowledge.auto' : 'confirm.acknowledge.keep'),
						cancelLabel: t('confirm.cancel'),
						confirmLabel: t('confirm.confirm'),
						acknowledged,
						disabled: busy,
						onAcknowledgedChange: setAcknowledged,
						onCancel: () => {
							setTarget(null)
							setAcknowledged(false)
						},
						onConfirm: doDelete,
					}),
				purgeTarget !== null &&
					React.createElement(RiskConfirmation, {
						open: true,
						title: t('confirm.purge.title'),
						description: purgeTarget.all
							? t('confirm.purge.description.all', {
									count: purgeTarget.entries.length,
									size: formatBytes(purgeKnownSizeCount > 0 ? purgeBytes : undefined, t('panel.size.unknown')),
									skipped: purgeSkipped,
							  })
							: t('confirm.purge.description', {
									title: purgeTarget.title,
									size: formatBytes(purgeKnownSizeCount > 0 ? purgeBytes : undefined, t('panel.size.unknown')),
							  }),
						acknowledgeLabel: t('confirm.purge.acknowledge'),
						cancelLabel: t('confirm.cancel'),
						confirmLabel: t('confirm.purge.confirm'),
						acknowledged,
						disabled: busy,
						onAcknowledgedChange: setAcknowledged,
						onCancel: () => {
							setPurgeTarget(null)
							setAcknowledged(false)
						},
						onConfirm: doPurge,
					}),
				toast !== null &&
					React.createElement(Toast, {
						key: toast.key,
						text: toast.text,
						icon: toast.kind === 'error' ? React.createElement(IconWarningOutline16, null) : undefined,
						onDone: () => setToast(null),
					}),
			)
		}

		// ------------------------------------------------------------------
		// Plugin (supported sidebar slot only)
		// ------------------------------------------------------------------
		const inject = ['slots', 'sessions', 'workspaces', 'locale']
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-trash: dictionaries')
			ctx.slots.inject('sidebar.footer.action', () =>
				ctx.slots.register(
					{ name: 'sidebar.footer.action', id: 'session-trash', order: 100, locale: NS },
					(props) => React.createElement(TrashEntry, { ...props, ctx }),
				),
			)
		}


		exports.apply = apply
		exports.inject = inject
		return module.exports
	},
})
