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
		const { Button, Modal, RiskConfirmation, Toast, Tooltip, IconTrashOutline16, IconCloseOutline16, IconWarningOutline16 } = primitives

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
			'panel.empty.search': '没有匹配的会话',
			'panel.search': '搜索会话或 ID',
			'panel.delete': '删除',
			'panel.restore': '恢复',
			'panel.purge': '永久删除',
			'panel.purge.retry': '重试清理',
			'panel.empty.action': '清空回收站',
			'panel.size.unknown': '大小未知',
			'panel.size.missing': '工件已不存在',
			'panel.size.partial': '至少 {size}',
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
			'confirm.preview.loading': '正在检查子代理后代…',
			'confirm.preview.failed': '无法检查子代理后代；为保证安全，本次只能删除当前会话。',
			'confirm.option.current': '仅删除当前会话',
			'confirm.option.current.detail': '子代理后代保持不变（默认）',
			'confirm.option.cascade': '同时删除 {count} 个子代理后代',
			'confirm.option.cascade.detail': '共 {total} 个会话作为一批移入回收站，可整批撤销或恢复',
			'confirm.option.running': '其中 {count} 个仍在运行，移入回收站后可能继续在后台执行。',
			'confirm.option.skipped': '另有 {count} 个已归档或已在回收站的后代保持不变。',
			'confirm.acknowledge.auto': '我已知晓：正常关闭 dsh web 后该会话将无法恢复',
			'confirm.acknowledge.keep': '我已知晓：该会话将保持隐藏，直到从回收站恢复',
			'confirm.acknowledge.batch.auto': '我已知晓：正常关闭 dsh web 后整批会话将无法恢复',
			'confirm.acknowledge.batch.keep': '我已知晓：整批会话将保持隐藏，直到从回收站恢复',
			'confirm.confirm': '删除',
			'confirm.cancel': '取消',
			'confirm.purge.title': '永久删除会话？',
			'confirm.purge.description': '将永久删除「{title}」的日志、工作区登记和投影缓存，预计释放 {size}。此操作无法撤销。',
			'confirm.purge.description.all': '将永久删除 {count} 个已停止会话，预计释放 {size}。{skipped} 个运行中或待恢复会话会被安全保留。',
			'confirm.purge.acknowledge': '我已知晓：永久删除后无法恢复',
			'confirm.purge.confirm': '永久删除',
			'toast.deleted': '已移入回收站',
			'toast.undo': '撤销',
			'toast.undo.description': '会话已移入回收站',
			'toast.undo.description.batch': '{count} 个会话已作为一批移入回收站',
			'toast.restored': '已恢复会话',
			'toast.restored.batch': '已整批恢复 {count} 个会话',
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
			'panel.empty.search': 'No matching sessions',
			'panel.search': 'Search sessions or IDs',
			'panel.delete': 'Delete',
			'panel.restore': 'Restore',
			'panel.purge': 'Delete permanently',
			'panel.purge.retry': 'Retry cleanup',
			'panel.empty.action': 'Empty trash',
			'panel.size.unknown': 'Size unknown',
			'panel.size.missing': 'Artifact already absent',
			'panel.size.partial': 'at least {size}',
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
			'confirm.preview.loading': 'Checking subagent descendants…',
			'confirm.preview.failed': 'Subagent descendants could not be checked. For safety, only this session can be deleted.',
			'confirm.option.current': 'Delete only this session',
			'confirm.option.current.detail': 'Keep all subagent descendants (default)',
			'confirm.option.cascade': 'Also delete {count} subagent descendants',
			'confirm.option.cascade.detail': 'Move {total} sessions to trash as one batch, with batch undo and restore',
			'confirm.option.running': '{count} descendants are still running and may continue in the background after being moved to trash.',
			'confirm.option.skipped': '{count} descendants already archived or in trash will stay unchanged.',
			'confirm.acknowledge.auto': 'I understand: after a normal dsh web shutdown this session cannot be recovered',
			'confirm.acknowledge.keep': 'I understand: this session stays hidden until restored from the trash',
			'confirm.acknowledge.batch.auto': 'I understand: after a normal dsh web shutdown this batch cannot be recovered',
			'confirm.acknowledge.batch.keep': 'I understand: this batch stays hidden until restored from the trash',
			'confirm.confirm': 'Delete',
			'confirm.cancel': 'Cancel',
			'confirm.purge.title': 'Permanently delete sessions?',
			'confirm.purge.description': 'Permanently remove the log, workspace record, and projection cache for "{title}", freeing about {size}. This cannot be undone.',
			'confirm.purge.description.all': 'Permanently remove {count} stopped sessions, freeing about {size}. {skipped} running or recovery-pending sessions will be kept safely.',
			'confirm.purge.acknowledge': 'I understand: permanently deleted sessions cannot be restored',
			'confirm.purge.confirm': 'Delete permanently',
			'toast.deleted': 'Moved to trash',
			'toast.undo': 'Undo',
			'toast.undo.description': 'Session moved to trash',
			'toast.undo.description.batch': '{count} sessions moved to trash as one batch',
			'toast.restored': 'Session restored',
			'toast.restored.batch': 'Restored a batch of {count} sessions',
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
		const TRASH_CHANNEL = 'dsh-session-trash:v1'
		const useSessionsSnapshot = (ctx) => {
			const store = ctx.sessions && ctx.sessions.list
			const subscribe = React.useCallback((callback) => (store ? store.subscribe(callback) : () => {}), [store])
			const getSnapshot = React.useCallback(() => (store ? store.getSnapshot() : { ids: [], byId: {}, current: undefined }), [store])
			return React.useSyncExternalStore(subscribe, getSnapshot)
		}
		function UndoToast({ sequence, text, actionLabel, disabled, onUndo, onDone }) {
			const onDoneRef = React.useRef(onDone)
			onDoneRef.current = onDone
			React.useEffect(() => {
				const timer = window.setTimeout(() => onDoneRef.current(), 7000)
				return () => window.clearTimeout(timer)
			}, [sequence])
			return ReactDOM.createPortal(
				React.createElement(
					'div',
					{ style: styles.undoToast, role: 'status', 'aria-live': 'polite', 'data-session-trash-toast': '' },
					React.createElement('span', { style: styles.undoText }, text),
					React.createElement(
						'button',
						{ type: 'button', style: styles.undoButton, disabled, onClick: onUndo },
						actionLabel,
					),
				),
				document.body,
			)
		}

		function DeleteConfirmation({
			title,
			description,
			preview,
			previewLoading,
			previewError,
			cascade,
			onCascadeChange,
			acknowledgeLabel,
			cancelLabel,
			confirmLabel,
			acknowledged,
			disabled,
			onAcknowledgedChange,
			onCancel,
			onConfirm,
			t,
		}) {
			const eligibleCount = preview?.eligibleDescendantCount ?? 0
			const skippedCount = (preview?.alreadyArchivedCount ?? 0) + (preview?.alreadyTrashedCount ?? 0)
			const options = eligibleCount > 0
				? React.createElement(
						'div',
						{ style: styles.deleteOptions },
						React.createElement(
							'label',
							{ style: styles.deleteOption },
							React.createElement('input', {
								type: 'radio',
								name: 'session-trash-delete-scope',
								checked: !cascade,
								disabled,
								onChange: () => onCascadeChange(false),
							}),
							React.createElement(
								'div',
								{ style: styles.deleteOptionText },
								React.createElement('div', { style: styles.deleteOptionTitle }, t('confirm.option.current')),
								React.createElement('div', { style: styles.deleteOptionDescription }, t('confirm.option.current.detail')),
							),
						),
						React.createElement(
							'label',
							{ style: styles.deleteOption },
							React.createElement('input', {
								type: 'radio',
								name: 'session-trash-delete-scope',
								checked: cascade,
								disabled,
								onChange: () => onCascadeChange(true),
							}),
							React.createElement(
								'div',
								{ style: styles.deleteOptionText },
								React.createElement('div', { style: styles.deleteOptionTitle }, t('confirm.option.cascade', { count: eligibleCount })),
								React.createElement('div', { style: styles.deleteOptionDescription }, t('confirm.option.cascade.detail', { total: 1 + eligibleCount })),
							),
						),
				  )
				: null

			return React.createElement(
				Modal,
				{
					open: true,
					title,
					description,
					closeLabel: cancelLabel,
					onClose: onCancel,
					footer: React.createElement(
						React.Fragment,
						null,
						React.createElement(Button, { variant: 'outline', disabled, onClick: onCancel, children: cancelLabel }),
						React.createElement(Button, { variant: 'primary', disabled: disabled || previewLoading || !acknowledged, onClick: onConfirm, children: confirmLabel }),
					),
				},
				React.createElement(
					'div',
					{ style: styles.confirmBody },
					previewLoading && React.createElement('div', { style: styles.previewNote }, t('confirm.preview.loading')),
					previewError && React.createElement('div', { style: styles.previewError }, t('confirm.preview.failed')),
					options,
					preview?.runningDescendantCount > 0 && React.createElement('div', { style: styles.previewNote }, t('confirm.option.running', { count: preview.runningDescendantCount })),
					skippedCount > 0 && React.createElement('div', { style: styles.previewNote }, t('confirm.option.skipped', { count: skippedCount })),
					React.createElement(
						'label',
						{ style: styles.acknowledgement },
						React.createElement('input', {
							type: 'checkbox',
							checked: acknowledged,
							disabled: disabled || previewLoading,
							onChange: (event) => onAcknowledgedChange(event.currentTarget.checked),
						}),
						React.createElement('span', null, acknowledgeLabel),
					),
				),
			)
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
				background: 'var(--dsw-specific-menu, var(--dsw-alias-bg-layer-3, #ffffff))',
				color: 'var(--dsw-alias-label-primary, #1f2328)',
				border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2))',
				boxShadow: 'var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.2))',
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
			badgeWarn: { color: 'var(--dsw-alias-state-warn-primary, #d97706)' },
			badgeError: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
			countBadge: { position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'var(--dsw-alias-state-error-primary, #e5484d)', fontSize: 9, fontWeight: 700, pointerEvents: 'none' },
			undoToast: { position: 'fixed', zIndex: 1000, top: 24, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 10, color: 'var(--dsw-static-neutral-bluish-00, #ffffff)', background: 'var(--dsw-alias-toast-bg, #353638)', border: '1px solid var(--dsw-alias-border-inverted2, rgba(255,255,255,0.08))', boxShadow: 'var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.24))', fontSize: 13 },
			undoText: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			undoButton: { flexShrink: 0, border: 'none', padding: '3px 7px', borderRadius: 5, color: 'var(--dsw-static-neutral-bluish-00, #ffffff)', background: 'rgba(255,255,255,0.12)', font: 'inherit', fontWeight: 700, cursor: 'pointer' },
			settingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			settingText: { flex: 1, minWidth: 0 },
			settingTitle: { fontSize: 12, fontWeight: 600 },
			settingDescription: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11 },
			searchInput: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2))', borderRadius: 8, outline: 'none', padding: '7px 9px', color: 'var(--dsw-alias-label-primary, #1f2328)', background: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,0.06))', font: 'inherit' },
			confirmBody: { display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--dsw-alias-label-primary, #1f2328)' },
			deleteOptions: { display: 'flex', flexDirection: 'column', gap: 6 },
			deleteOption: { display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2))', background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))', cursor: 'pointer' },
			deleteOptionText: { flex: 1, minWidth: 0 },
			deleteOptionTitle: { fontSize: 13, fontWeight: 600 },
			deleteOptionDescription: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 12, marginTop: 2 },
			previewNote: { color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 12 },
			previewError: { color: 'var(--dsw-alias-state-warn-primary, #d97706)', fontSize: 12 },
			acknowledgement: { display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 4, fontSize: 12 },
			empty: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 12, padding: '4px 6px' },
			foot: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, marginTop: 2, borderTop: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.16))', paddingTop: 6 },
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
			const [cascadeDelete, setCascadeDelete] = React.useState(false)
			const [toast, setToast] = React.useState(null)
			const [undo, setUndo] = React.useState(null)
			const [filter, setFilter] = React.useState('')
			const anchorRef = React.useRef(null)
			const channelRef = React.useRef(null)
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
				const onVisibilityChange = () => {
					if (document.visibilityState === 'visible') refresh()
				}
				window.addEventListener('focus', refresh)
				document.addEventListener('visibilitychange', onVisibilityChange)
				return () => {
					window.removeEventListener('focus', refresh)
					document.removeEventListener('visibilitychange', onVisibilityChange)
				}
			}, [refresh])

			React.useEffect(() => {
				if (!open) return undefined
				const timer = window.setInterval(refresh, 30000)
				return () => window.clearInterval(timer)
			}, [open, refresh])

			React.useEffect(() => {
				if (typeof window.BroadcastChannel !== 'function') return undefined
				const channel = new window.BroadcastChannel(TRASH_CHANNEL)
				channelRef.current = channel
				channel.addEventListener('message', refresh)
				return () => {
					channel.removeEventListener('message', refresh)
					channel.close()
					if (channelRef.current === channel) channelRef.current = null
				}
			}, [refresh])

			const publishChange = React.useCallback(() => {
				try {
					channelRef.current?.postMessage({ type: 'changed', at: Date.now() })
				} catch {
					// Focus/visibility refresh and low-frequency polling remain as fallbacks.
				}
			}, [])

			const requestDelete = React.useCallback((summary) => {
				if (!summary?.id) return
				setAcknowledged(false)
				setCascadeDelete(false)
				setTarget({ summary, preview: null, previewLoading: true, previewError: null })
				callApi('/session-trash/preview', { sessionId: summary.id }).then(
					(preview) => setTarget((current) => current?.summary.id === summary.id ? { ...current, preview, previewLoading: false } : current),
					(error) => setTarget((current) => current?.summary.id === summary.id ? { ...current, previewLoading: false, previewError: errorMessage(error) } : current),
				)
			}, [])

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
							requestDelete(summary)
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
			}, [list, requestDelete, t])

			const doDelete = async () => {
				if (!target) return
				setBusy(true)
				try {
					const data = await callApi('/session-trash/delete', {
						sessionId: target.summary.id,
						cascade: cascadeDelete && (target.preview?.eligibleDescendantCount ?? 0) > 0,
					})
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					setToast(null)
					const count = Array.isArray(data.deleted) && data.deleted.length > 0 ? data.deleted.length : 1
					setUndo({
						key: Date.now(),
						sessionId: target.summary.id,
						text: count > 1 ? t('toast.undo.description.batch', { count }) : t('toast.undo.description'),
					})
					publishChange()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
					refresh()
				} finally {
					setBusy(false)
					setTarget(null)
					setCascadeDelete(false)
					setAcknowledged(false)
				}
			}

			const doRestore = async (sessionId) => {
				setBusy(true)
				try {
					const data = await callApi('/session-trash/restore', { sessionId })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					const restored = Array.isArray(data.restored) && data.restored.length > 0 ? data.restored : [sessionId]
					const restoredIds = new Set(restored)
					setUndo((current) => (current && restoredIds.has(current.sessionId) ? null : current))
					setToast({ key: Date.now(), text: restored.length > 1 ? t('toast.restored.batch', { count: restored.length }) : t('toast.restored'), kind: 'ok' })
					publishChange()
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
					const purgedIds = new Set(Array.isArray(data.purged) ? data.purged : [])
					setUndo((current) => (current && purgedIds.has(current.sessionId) ? null : current))
					const count = Array.isArray(data.purged) ? data.purged.length : 0
					const skipped = (Array.isArray(data.blocked) ? data.blocked.length : 0) + (Array.isArray(data.failed) ? data.failed.length : 0)
					const text = count === 0
						? t('toast.purge.none', { skipped })
						: skipped > 0
							? t('toast.purge.partial', { count, skipped })
							: t('toast.purged', { count })
					setToast({ key: Date.now(), text, kind: skipped > 0 ? 'error' : 'ok' })
					publishChange()
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
					publishChange()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const rowLabel = (summary) => (summary && summary.displayTitle ? summary.displayTitle : summary && summary.title ? summary.title : summary ? summary.id : undefined)
			const filterNeedle = filter.trim().toLocaleLowerCase()
			const matchesFilter = (...values) => !filterNeedle || values.some((value) => value && String(value).toLocaleLowerCase().includes(filterNeedle))
			const trashIds = React.useMemo(() => new Set(trash.map((entry) => entry.sessionId)), [trash])
			const rows = list.ids
				.map((id) => list.byId[id])
				.filter((summary) => summary && !summary.blank && !trashIds.has(summary.id))
				.filter((summary) => matchesFilter(rowLabel(summary), summary.id, basenameOf(summary.cwd)))

			const trashRows = trash
				.map((entry) => ({ entry, summary: list.byId[entry.sessionId] }))
				.sort((left, right) => right.entry.archivedAt - left.entry.archivedAt)
				.filter(({ entry, summary }) => matchesFilter(rowLabel(summary), entry.sessionId, basenameOf(summary?.cwd)))
			const purgeableEntries = trash.filter((entry) => entry.canPurge)
			const knownTrashSizeCount = trashRows.filter(({ entry }) => Number.isFinite(entry.sizeBytes)).length
			const knownTrashBytes = trashRows.reduce((total, { entry }) => total + (Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : 0), 0)
			const trashSizeLabel = trashRows.length === 0
				? formatBytes(0, t('panel.size.unknown'))
				: knownTrashSizeCount === trashRows.length
					? formatBytes(knownTrashBytes, t('panel.size.unknown'))
					: knownTrashSizeCount > 0
						? t('panel.size.partial', { size: formatBytes(knownTrashBytes, t('panel.size.unknown')) })
						: t('panel.size.unknown')
			const purgeBytes = purgeTarget
				? purgeTarget.entries.reduce((total, entry) => total + (Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : 0), 0)
				: 0
			const purgeKnownSizeCount = purgeTarget ? purgeTarget.entries.filter((entry) => Number.isFinite(entry.sizeBytes)).length : 0
			const purgeSizeLabel = purgeTarget && purgeKnownSizeCount === purgeTarget.entries.length
				? formatBytes(purgeBytes, t('panel.size.unknown'))
				: purgeKnownSizeCount > 0
					? t('panel.size.partial', { size: formatBytes(purgeBytes, t('panel.size.unknown')) })
					: t('panel.size.unknown')
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

			const panel = open
				? ReactDOM.createPortal(
						React.createElement(
							'div',
							{ style: { ...styles.panel, left: panelPos ? panelPos.left : 16, bottom: panelPos ? panelPos.bottom : 56, maxHeight: Math.min(520, window.innerHeight - 96), overflowY: 'auto' }, role: 'dialog', 'aria-label': t('panel.title'), 'data-session-trash-panel': '' },
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
							React.createElement('input', {
								type: 'search',
								value: filter,
								placeholder: t('panel.search'),
								'aria-label': t('panel.search'),
								style: styles.searchInput,
								onChange: (event) => setFilter(event.target.value),
							}),
							React.createElement('div', { style: styles.sectionLabel }, `${t('panel.sessions')} (${rows.length})`),
							rows.length === 0
								? React.createElement('div', { style: styles.empty }, t(filterNeedle ? 'panel.empty.search' : 'panel.empty.sessions'))
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
												requestDelete(summary)
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
									`${t('panel.trash')} (${trashRows.length} · ${trashSizeLabel})`,
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
								? React.createElement('div', { style: styles.empty }, t(filterNeedle ? 'panel.empty.search' : 'panel.empty.trash'))
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
										React.createElement('span', { style: styles.badge }, entry.artifactMissing ? t('panel.size.missing') : formatBytes(entry.sizeBytes, t('panel.size.unknown'))),
													entry.batchSize > 1 && React.createElement('span', { style: styles.badgeWarn }, `×${entry.batchSize}`),
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
											children: entry.batchSize > 1 ? `${t('panel.restore')} ×${entry.batchSize}` : t('panel.restore'),
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
					React.createElement(DeleteConfirmation, {
						title: t('confirm.title'),
						description: t(settings.purgeOnShutdown ? 'confirm.description.auto' : 'confirm.description.keep', { title: rowLabel(target.summary) }) + (target.summary.id === list.current ? ` ${t('confirm.description.current')}` : ''),
						preview: target.preview,
						previewLoading: target.previewLoading,
						previewError: target.previewError,
						cascade: cascadeDelete,
						onCascadeChange: (value) => {
							setCascadeDelete(value)
							setAcknowledged(false)
						},
						acknowledgeLabel: t(cascadeDelete
							? settings.purgeOnShutdown ? 'confirm.acknowledge.batch.auto' : 'confirm.acknowledge.batch.keep'
							: settings.purgeOnShutdown ? 'confirm.acknowledge.auto' : 'confirm.acknowledge.keep'),
						cancelLabel: t('confirm.cancel'),
						confirmLabel: t('confirm.confirm'),
						acknowledged,
						disabled: busy,
						onAcknowledgedChange: setAcknowledged,
						onCancel: () => {
							setTarget(null)
							setCascadeDelete(false)
							setAcknowledged(false)
						},
						onConfirm: doDelete,
						t,
					}),
				purgeTarget !== null &&
					React.createElement(RiskConfirmation, {
						open: true,
						title: t('confirm.purge.title'),
						description: purgeTarget.all
							? t('confirm.purge.description.all', {
									count: purgeTarget.entries.length,
									size: purgeSizeLabel,
									skipped: purgeSkipped,
							  })
							: t('confirm.purge.description', {
									title: purgeTarget.title,
									size: purgeSizeLabel,
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
				undo !== null &&
					React.createElement(UndoToast, {
						sequence: undo.key,
						text: undo.text,
						actionLabel: t('toast.undo'),
						disabled: busy,
						onUndo: () => {
							const sessionId = undo.sessionId
							setUndo(null)
							doRestore(sessionId)
						},
						onDone: () => setUndo(null),
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
