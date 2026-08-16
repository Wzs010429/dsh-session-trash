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
			'panel.note.shutdown': '删除的会话会立即隐藏并可恢复；正常关闭 dsh web 时永久清理。',
			'panel.note.days': '删除的会话至少保留 {days} 天；到期后自动清理，运行中会话会被安全跳过。',
			'panel.note.keep': '删除的会话会立即隐藏并持续保留，直到恢复或修改保留策略。',
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
			'panel.export': '导出备份',
			'panel.exported': '已导出',
			'panel.export.required': '需先导出',
			'panel.expiry.shutdown': '关闭时清理',
			'panel.expiry.forever': '不会自动清理',
			'panel.expiry.expired': '已到期，等待安全清理',
			'panel.expiry.remaining': '{time}后清理',
			'panel.time.days': '{count}天',
			'panel.time.hours': '{count}小时',
			'panel.time.minutes': '{count}分钟',
			'panel.empty.action': '清空回收站',
			'panel.select.all': '全选当前结果',
			'panel.selected': '已选 {count} 项',
			'panel.bulk.restore': '批量恢复',
			'panel.bulk.export': '批量导出',
			'panel.bulk.purge': '批量永久删除',
			'panel.filter.all': '全部状态',
			'panel.filter.stopped': '已停止',
			'panel.filter.running': '运行中',
			'panel.filter.expired': '已到期',
			'panel.filter.unknown': '大小未知',
			'panel.filter.failed': '清理失败',
			'panel.sort.newest': '最近删除',
			'panel.sort.oldest': '最早删除',
			'panel.sort.size': '占用最大',
			'panel.sort.expiry': '最先到期',
			'panel.sort.name': '按名称',
			'panel.stats.sessions': '{count} 个会话',
			'panel.stats.running': '{count} 个运行中',
			'panel.stats.expired': '{count} 个到期',
			'panel.stats.size': '占用 {size}',
			'panel.space.title': '空间管理',
			'panel.space.warning': '已达到空间提醒阈值，请检查占用最大的会话。',
			'panel.space.largest': '占用最大的会话',
			'panel.space.expired': '清理已到期会话',
			'panel.space.stopped': '清理所有已停止会话',
			'panel.space.none': '当前没有可安全清理的会话',
			'panel.history.title': '最近操作',
			'panel.history.empty': '暂无操作记录',
			'panel.history.clear': '清除记录',
			'panel.history.delete': '移入回收站',
			'panel.history.restore': '恢复',
			'panel.history.export': '导出',
			'panel.history.purge': '永久删除',
			'panel.history.auto-purge': '自动清理',
			'panel.history.shutdown-purge': '关停清理',
			'panel.history.settings': '修改设置',
			'panel.diagnostics.copy': '复制诊断信息',
			'panel.diagnostics.ok': '兼容性检查通过',
			'panel.diagnostics.problem': '检测到 Harness 兼容性问题：{issues}',
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
			'settings.retention.title': '自动清理策略',
			'settings.retention.description': '到期后删除日志、工作区登记和投影缓存',
			'settings.retention.shutdown': '关闭时清理',
			'settings.retention.7': '保留 7 天',
			'settings.retention.30': '保留 30 天',
			'settings.retention.forever': '永久保留',
			'settings.export.title': '永久删除前必须导出',
			'settings.export.description': '未生成备份包的会话不能自动或手动永久删除',
			'settings.space.title': '空间提醒阈值',
			'settings.space.description': '只提醒，不会提前删除未到期会话',
			'settings.space.off': '关闭提醒',
			'confirm.title': '删除会话？',
			'confirm.description.auto': '删除「{title}」后，该会话会立即从列表与搜索中隐藏。在关闭 dsh web 之前可以恢复；正常关闭后，其全部记录将被永久删除。',
			'confirm.description.keep': '删除「{title}」后，该会话会立即从列表与搜索中隐藏，并保留在回收站中，直到你恢复它或修改保留策略。',
			'confirm.description.days': '删除「{title}」后，该会话会立即从列表与搜索中隐藏，并至少保留 {days} 天；到期后将自动永久清理。',
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
			'confirm.acknowledge.days': '我已知晓：保留 {days} 天后该会话将自动永久清理',
			'confirm.acknowledge.batch.auto': '我已知晓：正常关闭 dsh web 后整批会话将无法恢复',
			'confirm.acknowledge.batch.keep': '我已知晓：整批会话将保持隐藏，直到从回收站恢复',
			'confirm.acknowledge.batch.days': '我已知晓：保留 {days} 天后整批会话将自动永久清理',
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
			'toast.retention.purged': '策略已更新，并清理了 {count} 个已到期会话',
			'toast.exported': '备份包已开始下载',
			'toast.copied': '诊断信息已复制',
			'toast.history.cleared': '操作记录已清除',
			'toast.failed': '操作失败，请重试',
		}
		const en = {
			'entry.label': 'Trash',
			'entry.label.count': 'Trash, {count} pending sessions',
			'panel.title': 'Session Trash',
			'panel.note.shutdown': 'Deleted sessions are hidden and restorable until dsh web shuts down, then permanently removed.',
			'panel.note.days': 'Deleted sessions are kept for at least {days} days, then cleaned automatically; running sessions are skipped safely.',
			'panel.note.keep': 'Deleted sessions stay hidden and restorable until you restore them or change the retention policy.',
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
			'panel.export': 'Export backup',
			'panel.exported': 'exported',
			'panel.export.required': 'export required',
			'panel.expiry.shutdown': 'cleaned on shutdown',
			'panel.expiry.forever': 'kept forever',
			'panel.expiry.expired': 'expired; waiting for safe cleanup',
			'panel.expiry.remaining': 'cleans in {time}',
			'panel.time.days': '{count}d',
			'panel.time.hours': '{count}h',
			'panel.time.minutes': '{count}m',
			'panel.empty.action': 'Empty trash',
			'panel.select.all': 'Select current results',
			'panel.selected': '{count} selected',
			'panel.bulk.restore': 'Restore selected',
			'panel.bulk.export': 'Export selected',
			'panel.bulk.purge': 'Delete selected',
			'panel.filter.all': 'All states',
			'panel.filter.stopped': 'Stopped',
			'panel.filter.running': 'Running',
			'panel.filter.expired': 'Expired',
			'panel.filter.unknown': 'Unknown size',
			'panel.filter.failed': 'Cleanup failed',
			'panel.sort.newest': 'Newest deleted',
			'panel.sort.oldest': 'Oldest deleted',
			'panel.sort.size': 'Largest first',
			'panel.sort.expiry': 'Expires first',
			'panel.sort.name': 'Name',
			'panel.stats.sessions': '{count} sessions',
			'panel.stats.running': '{count} running',
			'panel.stats.expired': '{count} expired',
			'panel.stats.size': '{size} used',
			'panel.space.title': 'Storage management',
			'panel.space.warning': 'The warning threshold is reached. Review the largest sessions.',
			'panel.space.largest': 'Largest sessions',
			'panel.space.expired': 'Clean expired sessions',
			'panel.space.stopped': 'Clean all stopped sessions',
			'panel.space.none': 'No sessions can be cleaned safely',
			'panel.history.title': 'Recent activity',
			'panel.history.empty': 'No activity yet',
			'panel.history.clear': 'Clear history',
			'panel.history.delete': 'Moved to trash',
			'panel.history.restore': 'Restored',
			'panel.history.export': 'Exported',
			'panel.history.purge': 'Permanently deleted',
			'panel.history.auto-purge': 'Automatic cleanup',
			'panel.history.shutdown-purge': 'Shutdown cleanup',
			'panel.history.settings': 'Settings changed',
			'panel.diagnostics.copy': 'Copy diagnostics',
			'panel.diagnostics.ok': 'Compatibility checks passed',
			'panel.diagnostics.problem': 'Harness compatibility issue: {issues}',
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
			'settings.retention.title': 'Automatic cleanup',
			'settings.retention.description': 'Remove logs, workspace records, and projection cache when due',
			'settings.retention.shutdown': 'On shutdown',
			'settings.retention.7': 'Keep 7 days',
			'settings.retention.30': 'Keep 30 days',
			'settings.retention.forever': 'Keep forever',
			'settings.export.title': 'Require export before deletion',
			'settings.export.description': 'Sessions without a backup cannot be deleted automatically or manually',
			'settings.space.title': 'Storage warning threshold',
			'settings.space.description': 'Warning only; unexpired sessions are never deleted early',
			'settings.space.off': 'No warning',
			'confirm.title': 'Delete session?',
			'confirm.description.auto': 'Deleting "{title}" hides it from the list and search immediately. You can restore it until dsh web shuts down; after a normal shutdown all records are permanently removed.',
			'confirm.description.keep': 'Deleting "{title}" hides it from the list and search while keeping it in the trash until you restore it or change the retention policy.',
			'confirm.description.days': 'Deleting "{title}" hides it from the list and search and keeps it for at least {days} days, after which it is cleaned permanently.',
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
			'confirm.acknowledge.days': 'I understand: this session is cleaned permanently after {days} days',
			'confirm.acknowledge.batch.auto': 'I understand: after a normal dsh web shutdown this batch cannot be recovered',
			'confirm.acknowledge.batch.keep': 'I understand: this batch stays hidden until restored from the trash',
			'confirm.acknowledge.batch.days': 'I understand: this batch is cleaned permanently after {days} days',
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
			'toast.retention.purged': 'Policy updated and {count} expired sessions cleaned',
			'toast.exported': 'Backup download started',
			'toast.copied': 'Diagnostics copied',
			'toast.history.cleared': 'Activity cleared',
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
		const downloadExport = async (sessionIds) => {
			const response = await fetch('/session-trash/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionIds }),
			})
			if (!response.ok) {
				const data = await response.json().catch(() => ({}))
				throw new Error(data.error || `HTTP ${response.status}`)
			}
			const blob = await response.blob()
			const disposition = response.headers.get('Content-Disposition') || ''
			const match = disposition.match(/filename="?([^";]+)"?/i)
			const url = URL.createObjectURL(blob)
			const anchor = document.createElement('a')
			anchor.href = url
			anchor.download = match ? match[1] : 'dsh-session-trash-export.zip'
			document.body.appendChild(anchor)
			anchor.click()
			anchor.remove()
			window.setTimeout(() => URL.revokeObjectURL(url), 30000)
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
		const formatRemaining = (expiresAt, now, t) => {
			const remaining = expiresAt - now
			if (remaining <= 0) return t('panel.expiry.expired')
			const minutes = Math.max(1, Math.ceil(remaining / 60000))
			if (minutes >= 1440) return t('panel.expiry.remaining', { time: t('panel.time.days', { count: Math.floor(minutes / 1440) }) })
			if (minutes >= 60) return t('panel.expiry.remaining', { time: t('panel.time.hours', { count: Math.floor(minutes / 60) }) })
			return t('panel.expiry.remaining', { time: t('panel.time.minutes', { count: minutes }) })
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
				zIndex: 2147483001,
				width: 'min(520px, calc(100vw - 16px))',
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
			list: { display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 210 },
			row: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			rowMain: { flex: 1, minWidth: 0 },
			rowTitle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			rowMeta: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, display: 'flex', flexWrap: 'wrap', gap: 6 },
			rowActions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2, flexShrink: 0 },
			badge: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)' },
			badgeWarn: { color: 'var(--dsw-alias-state-warn-primary, #d97706)' },
			badgeError: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
			countBadge: { position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'var(--dsw-alias-state-error-primary, #e5484d)', fontSize: 9, fontWeight: 700, pointerEvents: 'none' },
			undoToast: { position: 'fixed', zIndex: 2147483002, top: 24, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 10, color: 'var(--dsw-static-neutral-bluish-00, #ffffff)', background: 'var(--dsw-alias-toast-bg, #353638)', border: '1px solid var(--dsw-alias-border-inverted2, rgba(255,255,255,0.08))', boxShadow: 'var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.24))', fontSize: 13 },
			undoText: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			undoButton: { flexShrink: 0, border: 'none', padding: '3px 7px', borderRadius: 5, color: 'var(--dsw-static-neutral-bluish-00, #ffffff)', background: 'rgba(255,255,255,0.12)', font: 'inherit', fontWeight: 700, cursor: 'pointer' },
			settingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			settingText: { flex: 1, minWidth: 0 },
			settingTitle: { fontSize: 12, fontWeight: 600 },
			settingDescription: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11 },
			settingSelect: { flexShrink: 0, maxWidth: 132, border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2))', borderRadius: 7, padding: '5px 7px', color: 'var(--dsw-alias-label-primary, #1f2328)', background: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,0.06))', font: 'inherit', fontSize: 12 },
			searchInput: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2))', borderRadius: 8, outline: 'none', padding: '7px 9px', color: 'var(--dsw-alias-label-primary, #1f2328)', background: 'var(--dsw-alias-bg-module-platform, rgba(127,127,127,0.06))', font: 'inherit' },
			controlRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
			stats: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4 },
			stat: { padding: '5px 6px', borderRadius: 6, textAlign: 'center', color: 'var(--dsw-alias-label-secondary, #6b7280)', background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))', fontSize: 11 },
			bannerOk: { padding: '6px 8px', borderRadius: 6, color: 'var(--dsw-alias-state-success-primary, #15803d)', background: 'rgba(34,197,94,0.08)', fontSize: 11 },
			bannerWarn: { padding: '6px 8px', borderRadius: 6, color: 'var(--dsw-alias-state-warn-primary, #d97706)', background: 'rgba(245,158,11,0.10)', fontSize: 11 },
			bulkBar: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, padding: '5px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			details: { border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.16))', borderRadius: 7, padding: '5px 7px' },
			detailsSummary: { cursor: 'pointer', fontSize: 12, fontWeight: 600 },
			detailsBody: { display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 },
			historyRow: { display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--dsw-alias-label-secondary, #6b7280)', fontSize: 11 },
			checkbox: { flexShrink: 0 },
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
			const [settings, setSettings] = React.useState({ retentionDays: 0, requireExportBeforePurge: false, spaceWarningBytes: null })
			const [stats, setStats] = React.useState({ count: 0, liveCount: 0, expiredCount: 0, knownBytes: 0, unknownSizeCount: 0 })
			const [diagnostics, setDiagnostics] = React.useState(null)
			const [history, setHistory] = React.useState([])
			const [busy, setBusy] = React.useState(false)
			const [target, setTarget] = React.useState(null)
			const [purgeTarget, setPurgeTarget] = React.useState(null)
			const [acknowledged, setAcknowledged] = React.useState(false)
			const [cascadeDelete, setCascadeDelete] = React.useState(false)
			const [toast, setToast] = React.useState(null)
			const [undo, setUndo] = React.useState(null)
			const [filter, setFilter] = React.useState('')
			const [statusFilter, setStatusFilter] = React.useState('all')
			const [sortBy, setSortBy] = React.useState('newest')
			const [selected, setSelected] = React.useState(() => new Set())
			const [clock, setClock] = React.useState(Date.now())
			const anchorRef = React.useRef(null)
			const channelRef = React.useRef(null)
			const [panelPos, setPanelPos] = React.useState(null)

			const refresh = React.useCallback(async () => {
				try {
					const data = await callApi('/session-trash/list')
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					if (data.stats) setStats(data.stats)
					if (data.settings && (data.settings.retentionDays === null || [0, 7, 30].includes(data.settings.retentionDays))) setSettings(data.settings)
				} catch {
					// Keep the last known state when a background refresh fails.
				}
			}, [])

			const refreshDetails = React.useCallback(async () => {
				const [diagnosticData, historyData] = await Promise.all([
					callApi('/session-trash/diagnostics').catch(() => null),
					callApi('/session-trash/history').catch(() => ({ events: [] })),
				])
				if (diagnosticData) setDiagnostics(diagnosticData)
				setHistory(Array.isArray(historyData.events) ? historyData.events : [])
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
				if (!open) return undefined
				refreshDetails()
				setClock(Date.now())
				const timer = window.setInterval(() => setClock(Date.now()), 60000)
				return () => window.clearInterval(timer)
			}, [open, refreshDetails])

			React.useEffect(() => {
				const available = new Set(trash.map((entry) => entry.sessionId))
				setSelected((current) => new Set([...current].filter((id) => available.has(id))))
			}, [trash])

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
						refreshDetails()
						const rect = anchorRef.current && anchorRef.current.getBoundingClientRect()
						if (rect) {
							const left = Math.max(8, Math.min(rect.left, window.innerWidth - 528))
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
					refresh()
					refreshDetails()
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

			const doRestore = async (value) => {
				const sessionIds = Array.isArray(value) ? value : [value]
				setBusy(true)
				try {
					const data = await callApi('/session-trash/restore', { sessionIds })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					const restored = Array.isArray(data.restored) && data.restored.length > 0 ? data.restored : sessionIds
					const restoredIds = new Set(restored)
					setUndo((current) => (current && restoredIds.has(current.sessionId) ? null : current))
					setSelected((current) => new Set([...current].filter((id) => !restoredIds.has(id))))
					setToast({ key: Date.now(), text: restored.length > 1 ? t('toast.restored.batch', { count: restored.length }) : t('toast.restored'), kind: 'ok' })
					publishChange()
					refresh()
					refreshDetails()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const doExport = async (entries) => {
				const sessionIds = entries.map((entry) => entry.sessionId)
				if (sessionIds.length === 0) return
				setBusy(true)
				try {
					await downloadExport(sessionIds)
					setToast({ key: Date.now(), text: t('toast.exported'), kind: 'ok' })
					await refresh()
					refreshDetails()
					publishChange()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const requestPurge = (entries, title, all = false, skipped = 0) => {
				if (!Array.isArray(entries) || entries.length === 0) return
				setTarget(null)
				setAcknowledged(false)
				setPurgeTarget({ entries, title, all, skipped })
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
					refresh()
					refreshDetails()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
					setPurgeTarget(null)
					setAcknowledged(false)
				}
			}

			const updateSettings = async (patch) => {
				setBusy(true)
				try {
					const data = await callApi('/session-trash/settings', patch)
					if (data.settings && (data.settings.retentionDays === null || [0, 7, 30].includes(data.settings.retentionDays))) setSettings(data.settings)
					if (Array.isArray(data.trash)) setTrash(data.trash)
					if (data.stats) setStats(data.stats)
					const purged = Array.isArray(data.autoPurged) ? data.autoPurged.length : 0
					setToast({ key: Date.now(), text: purged > 0 ? t('toast.retention.purged', { count: purged }) : t('toast.settings'), kind: 'ok' })
					publishChange()
					refreshDetails()
				} catch (error) {
					setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })
				} finally {
					setBusy(false)
				}
			}

			const copyDiagnostics = async () => {
				const data = diagnostics || await callApi('/session-trash/diagnostics')
				await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
				setToast({ key: Date.now(), text: t('toast.copied'), kind: 'ok' })
			}

			const clearHistory = async () => {
				setBusy(true)
				try {
					const data = await callApi('/session-trash/history', { action: 'clear' })
					setHistory(Array.isArray(data.events) ? data.events : [])
					setToast({ key: Date.now(), text: t('toast.history.cleared'), kind: 'ok' })
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
				.filter((summary) => summary.origin !== 'subagent' || (summary.parentId && list.byId[summary.parentId]))
				.filter((summary) => matchesFilter(rowLabel(summary), summary.id, basenameOf(summary.cwd)))

			const statusMatches = (entry) => statusFilter === 'all'
				|| (statusFilter === 'stopped' && !entry.live)
				|| (statusFilter === 'running' && entry.live)
				|| (statusFilter === 'expired' && entry.expired)
				|| (statusFilter === 'unknown' && !Number.isFinite(entry.sizeBytes))
				|| (statusFilter === 'failed' && Boolean(entry.lastPurgeError))
			const compareTrashRows = (left, right) => {
				if (sortBy === 'oldest') return left.entry.archivedAt - right.entry.archivedAt
				if (sortBy === 'size') return (right.entry.sizeBytes ?? -1) - (left.entry.sizeBytes ?? -1)
				if (sortBy === 'expiry') return (left.entry.expiresAt ?? Number.MAX_SAFE_INTEGER) - (right.entry.expiresAt ?? Number.MAX_SAFE_INTEGER)
				if (sortBy === 'name') return String(rowLabel(left.summary) || left.entry.sessionId).localeCompare(String(rowLabel(right.summary) || right.entry.sessionId))
				return right.entry.archivedAt - left.entry.archivedAt
			}
			const trashRows = trash
				.map((entry) => ({ entry, summary: list.byId[entry.sessionId] }))
				.filter(({ entry, summary }) => matchesFilter(rowLabel(summary), entry.sessionId, basenameOf(summary?.cwd)))
				.filter(({ entry }) => statusMatches(entry))
				.sort(compareTrashRows)
			const purgeableEntries = trash.filter((entry) => entry.canPurge)
			const selectedEntries = trash.filter((entry) => selected.has(entry.sessionId))
			const selectedPurgeable = selectedEntries.filter((entry) => entry.canPurge)
			const selectedExportable = selectedEntries.filter((entry) => entry.canExport)
			const selectedRestorable = selectedEntries.filter((entry) => entry.canRestore)
			const expiredPurgeable = trash.filter((entry) => entry.expired && entry.canPurge)
			const stoppedPurgeable = trash.filter((entry) => !entry.live && entry.canPurge)
			const largestEntries = [...trash].filter((entry) => Number.isFinite(entry.sizeBytes)).sort((left, right) => right.sizeBytes - left.sizeBytes).slice(0, 3)
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
			const purgeSkipped = purgeTarget && purgeTarget.all ? purgeTarget.skipped : 0
			const retentionDays = settings.retentionDays === null || [0, 7, 30].includes(settings.retentionDays) ? settings.retentionDays : 0
			const retentionKind = retentionDays === null ? 'keep' : retentionDays === 0 ? 'auto' : 'days'
			const panelNoteKey = retentionDays === null ? 'panel.note.keep' : retentionDays === 0 ? 'panel.note.shutdown' : 'panel.note.days'
			const expiryLabel = (entry) => entry.expiresAt
				? formatRemaining(entry.expiresAt, clock, t)
				: retentionDays === null ? t('panel.expiry.forever') : t('panel.expiry.shutdown')
			const historyLabel = (event) => t(`panel.history.${event.type}`)

			const metaOf = (summary) => {
				const parts = []
				const workspace = basenameOf(summary.cwd)
				if (workspace) parts.push({ text: workspace, style: styles.badge })
				if (summary.origin === 'subagent') parts.push({ text: t('panel.subagent'), style: styles.badgeWarn })
				if (summary.running) parts.push({ text: t('panel.running'), style: styles.badgeWarn })
				if (summary.id === list.current) parts.push({ text: t('panel.current'), style: styles.badgeError })
				return parts
			}

			const panel = open && target === null && purgeTarget === null
				? ReactDOM.createPortal(
						React.createElement(
							'div',
							{ style: { ...styles.panel, left: panelPos ? panelPos.left : 16, bottom: panelPos ? panelPos.bottom : 56, maxHeight: Math.min(720, window.innerHeight - 96), overflowY: 'auto' }, role: 'dialog', 'aria-label': t('panel.title'), 'data-session-trash-panel': '' },
							React.createElement(
								'div',
								{ style: styles.header },
								React.createElement('span', { style: styles.title }, t('panel.title')),
								React.createElement(
									'div',
									{ style: styles.rowActions },
									React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy, onClick: () => copyDiagnostics().catch((error) => setToast({ key: Date.now(), text: `${t('toast.failed')}: ${errorMessage(error)}`, kind: 'error' })), children: t('panel.diagnostics.copy') }),
									React.createElement('button', { type: 'button', style: styles.close, 'aria-label': t('panel.title'), onClick: () => setOpen(false) }, React.createElement(IconCloseOutline16, null)),
								),
							),
							React.createElement('div', { style: styles.note }, t(panelNoteKey, { days: retentionDays })),
							diagnostics && React.createElement('div', { style: diagnostics.compatible ? styles.bannerOk : styles.bannerWarn }, diagnostics.compatible ? t('panel.diagnostics.ok') : t('panel.diagnostics.problem', { issues: diagnostics.issues.join(', ') })),
							stats.spaceWarningExceeded && React.createElement('div', { style: styles.bannerWarn }, t('panel.space.warning')),
							React.createElement(
								'div',
								{ style: styles.stats },
								React.createElement('div', { style: styles.stat }, t('panel.stats.sessions', { count: stats.count ?? trash.length })),
								React.createElement('div', { style: styles.stat }, t('panel.stats.running', { count: stats.liveCount ?? 0 })),
								React.createElement('div', { style: styles.stat }, t('panel.stats.expired', { count: stats.expiredCount ?? 0 })),
								React.createElement('div', { style: styles.stat }, t('panel.stats.size', { size: formatBytes(stats.knownBytes ?? 0, t('panel.size.unknown')) })),
							),
							React.createElement(
								'div',
								{ style: styles.settingRow },
								React.createElement(
									'div',
									{ style: styles.settingText },
									React.createElement('div', { style: styles.settingTitle }, t('settings.retention.title')),
									React.createElement('div', { style: styles.settingDescription }, t('settings.retention.description')),
								),
								React.createElement(
									'select',
									{
										value: retentionDays === null ? 'forever' : String(retentionDays),
										disabled: busy,
										'aria-label': t('settings.retention.title'),
										style: styles.settingSelect,
									onChange: (event) => updateSettings({ retentionDays: event.target.value === 'forever' ? null : Number(event.target.value) }),
									},
									React.createElement('option', { value: '0' }, t('settings.retention.shutdown')),
									React.createElement('option', { value: '7' }, t('settings.retention.7')),
									React.createElement('option', { value: '30' }, t('settings.retention.30')),
									React.createElement('option', { value: 'forever' }, t('settings.retention.forever')),
								),
							),
							React.createElement(
								'label',
								{ style: styles.settingRow },
								React.createElement('input', { type: 'checkbox', checked: settings.requireExportBeforePurge === true, disabled: busy, onChange: (event) => updateSettings({ requireExportBeforePurge: event.currentTarget.checked }) }),
								React.createElement('div', { style: styles.settingText }, React.createElement('div', { style: styles.settingTitle }, t('settings.export.title')), React.createElement('div', { style: styles.settingDescription }, t('settings.export.description'))),
							),
							React.createElement(
								'div',
								{ style: styles.settingRow },
								React.createElement('div', { style: styles.settingText }, React.createElement('div', { style: styles.settingTitle }, t('settings.space.title')), React.createElement('div', { style: styles.settingDescription }, t('settings.space.description'))),
								React.createElement(
									'select',
									{ value: settings.spaceWarningBytes === null ? 'off' : String(settings.spaceWarningBytes), disabled: busy, style: styles.settingSelect, 'aria-label': t('settings.space.title'), onChange: (event) => updateSettings({ spaceWarningBytes: event.target.value === 'off' ? null : Number(event.target.value) }) },
									React.createElement('option', { value: 'off' }, t('settings.space.off')),
									React.createElement('option', { value: String(1024 ** 3) }, '1 GB'),
									React.createElement('option', { value: String(5 * 1024 ** 3) }, '5 GB'),
									React.createElement('option', { value: String(10 * 1024 ** 3) }, '10 GB'),
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
							React.createElement(
								'div',
								{ style: styles.controlRow },
								React.createElement('select', { value: statusFilter, style: styles.settingSelect, 'aria-label': t('panel.filter.all'), onChange: (event) => setStatusFilter(event.target.value) }, ['all', 'stopped', 'running', 'expired', 'unknown', 'failed'].map((value) => React.createElement('option', { key: value, value }, t(`panel.filter.${value}`)))),
								React.createElement('select', { value: sortBy, style: styles.settingSelect, 'aria-label': t('panel.sort.newest'), onChange: (event) => setSortBy(event.target.value) }, ['newest', 'oldest', 'size', 'expiry', 'name'].map((value) => React.createElement('option', { key: value, value }, t(`panel.sort.${value}`)))),
							),
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
								React.createElement(
									'div',
									{ style: styles.rowActions },
									React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || trashRows.length === 0, onClick: () => setSelected((current) => trashRows.every(({ entry }) => current.has(entry.sessionId)) ? new Set([...current].filter((id) => !trashRows.some(({ entry }) => entry.sessionId === id))) : new Set([...current, ...trashRows.map(({ entry }) => entry.sessionId)])), children: t('panel.select.all') }),
									React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || purgeableEntries.length === 0, style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' }, onClick: () => requestPurge(purgeableEntries, undefined, true, trash.length - purgeableEntries.length), children: t('panel.empty.action') }),
								),
							),
							selectedEntries.length > 0 && React.createElement(
								'div',
								{ style: styles.bulkBar },
								React.createElement('span', { style: styles.settingText }, t('panel.selected', { count: selectedEntries.length })),
								React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || selectedRestorable.length === 0, onClick: () => doRestore(selectedRestorable.map((entry) => entry.sessionId)), children: t('panel.bulk.restore') }),
								React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || selectedExportable.length === 0, onClick: () => doExport(selectedExportable), children: t('panel.bulk.export') }),
								React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || selectedPurgeable.length === 0, style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' }, onClick: () => requestPurge(selectedPurgeable, undefined, true), children: t('panel.bulk.purge') }),
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
												React.createElement('input', { type: 'checkbox', style: styles.checkbox, checked: selected.has(entry.sessionId), 'aria-label': `${t('panel.selected', { count: 1 })}: ${rowLabel(summary) || entry.sessionId}`, onChange: (event) => setSelected((current) => { const next = new Set(current); if (event.currentTarget.checked) next.add(entry.sessionId); else next.delete(entry.sessionId); return next }) }),
												React.createElement(
													'div',
													{ style: styles.rowMain },
													React.createElement('div', { style: styles.rowTitle, title: entry.sessionId }, rowLabel(summary) || entry.sessionId),
													React.createElement(
														'div',
												{ style: styles.rowMeta },
													React.createElement('span', { style: styles.badge }, new Date(entry.archivedAt).toLocaleString()),
						React.createElement('span', { style: styles.badge }, entry.artifactMissing ? t('panel.size.missing') : formatBytes(entry.sizeBytes, t('panel.size.unknown'))),
						React.createElement('span', { style: entry.expired ? styles.badgeWarn : styles.badge }, expiryLabel(entry)),
											entry.batchSize > 1 && React.createElement('span', { style: styles.badgeWarn }, `×${entry.batchSize}`),
										entry.live && React.createElement('span', { style: styles.badgeWarn }, t('panel.running')),
										entry.exportedAt && React.createElement('span', { style: styles.badge }, t('panel.exported')),
										entry.needsExport && React.createElement('span', { style: styles.badgeWarn }, t('panel.export.required')),
										entry.state === 'pending' && React.createElement('span', { style: styles.badgeWarn }, t('panel.state.pending')),
										entry.state === 'purging' && React.createElement('span', { style: styles.badgeError }, t('panel.state.purging')),
										entry.lastPurgeError && React.createElement('span', { style: styles.badgeError, title: entry.lastPurgeError }, t('panel.filter.failed')),
											),
										),
										React.createElement(
											'div',
											{ style: styles.rowActions },
											React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || !entry.canExport, 'aria-label': `${t('panel.export')}: ${rowLabel(summary) || entry.sessionId}`, onClick: () => doExport([entry]), children: t('panel.export') }),
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
							React.createElement(
								'details',
								{ style: styles.details },
								React.createElement('summary', { style: styles.detailsSummary }, t('panel.space.title')),
								React.createElement(
									'div',
									{ style: styles.detailsBody },
									stats.spaceWarningExceeded && React.createElement('div', { style: styles.bannerWarn }, t('panel.space.warning')),
									React.createElement('div', { style: styles.settingTitle }, t('panel.space.largest')),
									largestEntries.length === 0
										? React.createElement('div', { style: styles.empty }, t('panel.space.none'))
										: largestEntries.map((entry) => React.createElement('div', { key: entry.sessionId, style: styles.historyRow }, React.createElement('span', { style: styles.rowTitle }, rowLabel(list.byId[entry.sessionId]) || entry.sessionId), React.createElement('span', null, formatBytes(entry.sizeBytes, t('panel.size.unknown'))))),
									React.createElement(
										'div',
										{ style: styles.bulkBar },
										React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || expiredPurgeable.length === 0, onClick: () => requestPurge(expiredPurgeable, undefined, true), children: t('panel.space.expired') }),
										React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || stoppedPurgeable.length === 0, style: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' }, onClick: () => requestPurge(stoppedPurgeable, undefined, true), children: t('panel.space.stopped') }),
									),
								),
							),
							React.createElement(
								'details',
								{ style: styles.details },
								React.createElement('summary', { style: styles.detailsSummary }, t('panel.history.title')),
								React.createElement(
									'div',
									{ style: styles.detailsBody },
									history.length === 0
										? React.createElement('div', { style: styles.empty }, t('panel.history.empty'))
										: history.slice(0, 10).map((event) => React.createElement('div', { key: event.id, style: styles.historyRow }, React.createElement('span', null, `${historyLabel(event)} · ${(event.sessionIds || []).length}`), React.createElement('span', null, new Date(event.timestamp).toLocaleString()))),
									React.createElement(Button, { variant: 'ghost', size: 'sm', disabled: busy || history.length === 0, onClick: clearHistory, children: t('panel.history.clear') }),
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
						description: t(`confirm.description.${retentionKind}`, { title: rowLabel(target.summary), days: retentionDays }) + (target.summary.id === list.current ? ` ${t('confirm.description.current')}` : ''),
						preview: target.preview,
						previewLoading: target.previewLoading,
						previewError: target.previewError,
						cascade: cascadeDelete,
						onCascadeChange: (value) => {
							setCascadeDelete(value)
							setAcknowledged(false)
						},
						acknowledgeLabel: t(cascadeDelete ? `confirm.acknowledge.batch.${retentionKind}` : `confirm.acknowledge.${retentionKind}`, { days: retentionDays }),
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
