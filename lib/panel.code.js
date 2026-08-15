		// ------------------------------------------------------------------
		// Trash panel (sidebar footer entry) — source fragment, stitched into
		// lib/client.js by scripts/merge-client.mjs.
		// ------------------------------------------------------------------
		const NS = 'session-trash'
		const zh = {
			'entry.label': '回收站',
			'panel.title': '会话回收站',
			'panel.note': '删除的会话会立即从列表中隐藏；在 dsh web 关闭前可恢复，关闭后将被永久删除。',
			'panel.sessions': '会话',
			'panel.trash': '回收站中',
			'panel.empty.sessions': '没有可删除的会话',
			'panel.empty.trash': '回收站是空的',
			'panel.delete': '删除',
			'panel.restore': '恢复',
			'panel.current': '当前',
			'panel.running': '运行中',
			'panel.subagent': '子代理',
			'panel.local': '仅本机生效',
			'confirm.title': '删除会话？',
			'confirm.description': '删除「{title}」后，该会话会立即从列表与搜索中隐藏。在关闭 dsh web 之前，你可以在回收站中恢复它；一旦 dsh web 关闭，该会话的全部记录将被永久删除，无法找回。',
			'confirm.description.current': '这是当前正在使用的会话：删除后界面会回到新会话，该会话仍在后台运行，直到 dsh web 关闭时被清理。',
			'confirm.acknowledge': '我已知晓：dsh web 关闭后该会话将无法恢复',
			'confirm.confirm': '删除',
			'confirm.cancel': '取消',
			'toast.deleted': '已移入回收站',
			'toast.restored': '已恢复会话',
			'toast.failed': '操作失败，请重试',
		}
		const en = {
			'entry.label': 'Trash',
			'panel.title': 'Session Trash',
			'panel.note': 'Deleted sessions are hidden from the list immediately. They can be restored until dsh web shuts down, after which they are permanently removed.',
			'panel.sessions': 'Sessions',
			'panel.trash': 'In trash',
			'panel.empty.sessions': 'No sessions to delete',
			'panel.empty.trash': 'Trash is empty',
			'panel.delete': 'Delete',
			'panel.restore': 'Restore',
			'panel.current': 'current',
			'panel.running': 'running',
			'panel.subagent': 'subagent',
			'panel.local': 'Local only',
			'confirm.title': 'Delete session?',
			'confirm.description': 'Deleting "{title}" hides it from the list and search immediately. You can restore it from the trash until dsh web shuts down; once it shuts down, all records of this session are permanently deleted and cannot be recovered.',
			'confirm.description.current': 'This is the session you are currently using: after deletion the view returns to a new session while this one keeps running in the background until dsh web shuts down.',
			'confirm.acknowledge': 'I understand: after dsh web shuts down this session cannot be recovered',
			'confirm.confirm': 'Delete',
			'confirm.cancel': 'Cancel',
			'toast.deleted': 'Moved to trash',
			'toast.restored': 'Session restored',
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
			const response = await fetch(path, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: payload === undefined ? '{}' : JSON.stringify(payload),
			})
			const data = await response.json().catch(() => ({}))
			if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
			return data
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
				width: 320,
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
			list: { display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 168 },
			row: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 6, background: 'var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06))' },
			rowMain: { flex: 1, minWidth: 0 },
			rowTitle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
			rowMeta: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)', fontSize: 11, display: 'flex', gap: 6 },
			badge: { color: 'var(--dsw-alias-label-tertiary, #9ca3af)' },
			badgeWarn: { color: 'var(--dsw-alias-state-warning-primary, #d97706)' },
			badgeError: { color: 'var(--dsw-alias-state-error-primary, #e5484d)' },
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
			const [busy, setBusy] = React.useState(false)
			const [target, setTarget] = React.useState(null)
			const [acknowledged, setAcknowledged] = React.useState(false)
			const [toast, setToast] = React.useState(null)
			const anchorRef = React.useRef(null)
			const [panelPos, setPanelPos] = React.useState(null)

			const refresh = React.useCallback(async () => {
				try {
					const data = await callApi('/session-trash/list')
					setTrash(Array.isArray(data.trash) ? data.trash : [])
				} catch {
					setTrash([])
				}
			}, [])

			const toggle = () => {
				setOpen((value) => {
					const next = !value
					if (next) {
						refresh()
						const rect = anchorRef.current && anchorRef.current.getBoundingClientRect()
						if (rect) {
							const left = Math.max(8, Math.min(rect.left, window.innerWidth - 328))
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

			const doDelete = async () => {
				if (!target) return
				setBusy(true)
				try {
					const data = await callApi('/session-trash/delete', { sessionId: target.id })
					setTrash(Array.isArray(data.trash) ? data.trash : [])
					setToast({ key: Date.now(), text: t('toast.deleted'), kind: 'ok' })
				} catch {
					setToast({ key: Date.now(), text: t('toast.failed'), kind: 'error' })
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
				} catch {
					setToast({ key: Date.now(), text: t('toast.failed'), kind: 'error' })
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
							React.createElement('div', { style: styles.note }, t('panel.note')),
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
							React.createElement('div', { style: styles.sectionLabel }, `${t('panel.trash')} (${trashRows.length})`),
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
													),
												),
												React.createElement(Button, {
													variant: 'ghost',
													size: 'sm',
													disabled: busy,
													'aria-label': t('panel.restore'),
													onClick: () => doRestore(entry.sessionId),
													children: t('panel.restore'),
												}),
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
					{ label: t('entry.label'), delayMs: 500, disabled: wide },
					React.createElement(Button, {
						variant: 'ghost',
						size: 'sm',
						icon: React.createElement(IconTrashOutline16, null),
						'aria-label': t('entry.label'),
						'aria-expanded': open,
						onClick: toggle,
						children: wide ? t('entry.label') : null,
					}),
				),
				panel,
				target !== null &&
					React.createElement(RiskConfirmation, {
						open: true,
						title: t('confirm.title'),
						description: t('confirm.description', { title: rowLabel(target) }) + (target.id === list.current ? ` ${t('confirm.description.current')}` : ''),
						acknowledgeLabel: t('confirm.acknowledge'),
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
		// Plugin (panel + forked browser)
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
			// Forked workspace browser (stock bundle + "delete" menu item).
			workspaceFork.apply(ctx)
		}
