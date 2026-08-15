# 设计文档：DSH 会话删除插件（dsh-session-trash）

> 目标：在 DSH Web GUI 中提供崩溃安全的会话回收站——软删除可恢复、显示工件占用，并可在运行期或正常关停时安全物理清理。

## 一、可行性结论

**可行。** 需求与 DSH 现有机制高度契合，实现可以完全建立在官方 seam 之上，不需要修改 DSH 本体：

| 需求 | 官方机制 | 结论 |
| --- | --- | --- |
| 前端新增删除入口 | `sidebar.footer.action` slot（稳定入口）+ 基于 `role=treeitem/menu/menuitem` 的会话菜单语义 DOM 增强 + 官方 `Modal`/`RiskConfirmation`/`Toast` 原语 | ✅ |
| 二次确认 | 删除使用 `Modal` 显式选择单项/级联范围并勾选确认；永久清理使用 `RiskConfirmation` | ✅ |
| 子代理级联 | 读取持久化 `header.parentSession`/`origin`，严格沿连续 `origin: subagent` 链预览；默认只删当前会话，普通 fork 截断传播 | ✅ |
| 删除后立即隐藏 | `workspaceRegistry.archiveSession()`——官方归档：分组视图**和搜索**全部隐藏（`sessionVisible` 过滤），`host/archived-sessions-changed` 帧自动同步所有标签页 | ✅ |
| 运行期间可恢复 | 注册表**无公开 unarchive API**；通过注册表自身的 `enqueueOperation()` + `setState()` 写回不含该 id 的归档集，域写入自动触发 `domain/changed` → api-proxy 广播帧 → 即时回归（已在源码确认 `dsh-host-apiproxy` 的 domain/changed 监听器会推送完整归档快照） | ✅（依赖内部方法签名） |
| 运行期永久删除 | 仅允许未加载会话；Workspace 经 `detachSession()`/`setState()` 清理，投影缓存经其 domain table 清理，避免内存态覆盖带外 JSON 修改 | ✅（依赖内部方法签名） |
| 删除前占用预览 | 对受 sessions-root 路径守卫保护的会话工件目录做短时缓存统计；符号链接不递归跟随。API 定位失败后扫描标准两级布局，明确区分已确认不存在（`0 B`）与不可判定（大小未知） | ✅ |
| 关闭后物理删除 | DSH **没有任何会话删除 API**；插件识别 `SIGINT/SIGTERM`，在 Cordis dispose 阶段按 `purgeOnShutdown` 策略同步执行文件手术，`process.on('exit')` 作为强制退出 fallback | ✅ |
| 删除缓存文本 | 投影缓存同样无逐出 API；运行期隐藏后搜索/列表均不可达（会话行仅留在隐藏列表 store 中）；退出时从 `session_projcache.json` 删除该 id 的整行（title/stat/goal 等） | ✅ |
| 数据安全 | v3 清单使用 `pending → committed → purging`，并为级联条目记录共享 `batchId`：未提交项不物理删除，已开始物理删除项不再提供虚假恢复，失败项幂等重试 | ✅ |

## 二、需求设计是否合理

**合理。** 默认仍是「回收站 + 关停提交」模型；`v0.6.0` 增加受保护的显式立即清理：

1. **运行期软删除**：用户删除的瞬间不需要做任何破坏性 IO；隐藏走官方归档，所有标签页立即一致；
2. **关停硬删除**：DSH 收到关停信号后先 dispose 整棵插件树，再调用 `process.exit()`；插件在自身 disposer 中提交「删文件 + 改注册表 + 清缓存」，避免 `exit` 监听器先被 Cordis 清理而永远不执行；
3. **崩溃安全**：清单持久化让强杀/断电场景退化为「隐藏但可恢复」，与用户「关闭即删」的期望只在**安全方向**上偏离。
4. **显式立即清理**：仅对不在 session service 中的冷会话开放；先把清单推进到 `purging`，再删工件并通过运行时 domain 写路径清 metadata，最后移除清单行。
5. **无工件收敛**：只有完整读取 sessions 根目录并确认无同 id 目录时才写入 `artifactMissing`；该状态允许执行 metadata-only 清理。权限错误等不可判定场景仍保留清单。

### v3 清单状态机

| 状态 | 含义 | 可恢复 | 可物理清理 |
| --- | --- | --- | --- |
| `pending` | 清单已落盘，官方归档尚未完成或提交写入失败 | ✅ | ❌ |
| `committed` | 会话已归档，工件完整保留 | ✅ | ✅（仅冷会话） |
| `purging` | 物理删除已开始，工件或 metadata 可能已部分移除 | ❌ | ✅（幂等重试） |

级联批次在归档任一成员前先把全部独立条目以 `pending` 一次落盘；只有每个成员都归档成功后，才把整批转为 `committed` 并再次原子写入。因此进程在批次中间崩溃时，重启后所有成员仍只能恢复、不能物理清理。任意条目的恢复操作都会恢复该 `batchId` 下仍存在的全部条目。

值得指出的三个设计代价（已写入 README「已知限制」）：

- **级联不等于停止执行**：DSH 中子代理是带 `parentSession` 血缘的独立会话；归档只隐藏会话，运行中的后代可能继续在后台执行，确认框会明确显示数量；
- **依赖内部 seam**：`enqueueOperation`/`setState` 是 `WorkspaceRegistry` 原型上的内部方法（非公开 API），DSH 升级可能改名——已注明版本兼容要求；
- **无官方 UI 菜单注入点**：会话行的 `…` 菜单是内置组件硬编码的（rename/fork/archive 三件）。稳定入口仍是侧边栏回收站；三点菜单使用语义 DOM 桥接，标题重复或上游语义结构变化时安全退回面板，不 fork 整个 Workspace bundle。

## 三、关键调研事实（实现依据）

### 1. 插件形态
- 第三方插件 = bundle 组合包：`package.json` 声明 `"dsh": {"bundle": {"patch": "./cordis.patch.yml"}, "client": {"platform": "web", "inject": [...]}}`，`exports` 提供 `.`（host）与 `./client`（browser）；`cordis.patch.yml` 用 `- insert:` 把插件行注入组合；安装命令 `dsh plugin --profile web add <path>`（写入 profile 的 dependencies + bundles）。
- client bundle 契约：`window.__ModuleLoader__.load({ id: '<包名>', factory: (require) => {...} })`，`require` 从 shell 冻结模块表解析 `react`、`react-dom`、`@deepseek-ai/dsh-client-ui-primitives` 等 → **无需任何构建工具**，手写即可（本仓库 `lib/client.js` 即如此）。

### 2. 软删除
- 侧边栏分组视图与搜索都通过 `archivedSessionIds` 过滤（`dsh-client-ui-workspace` 的 `sessionVisible`/`deriveSearchResults`），归档即可全隐藏；
- 归档持久化在 `workspace` 存储域（`storages/workspace.json` → `global.archivedSessionIds`），写域事件链：`domain.global.set → domain/changed → api-proxy 广播 host/archived-sessions-changed`（`dsh-host-apiproxy` 源码 `host` 帧队列）；
- 恢复：`registry.enqueueOperation(async () => registry.setState({...state, archivedSessionIds: 过滤后}))`——写链串行、内存态与持久态一致、事件自动广播。

### 3. 硬删除
- 会话工件：`$DSH_HOME/sessions/<--cwd变形-->/<session-id>/session.jsonl.zstd`（`sessionPersistence.locate()` 返回绝对路径，删除时记录，退出时复用）；
- 注册表清理：`workspace.json` 中 `tables.workspaces.*.sessionIds` 与 `global.archivedSessionIds` 两处移除（即使不移除，重启后缺失 header 的 id 也会被惰性过滤——但显式清理保证无残留、无告警）；
- 缓存清理：`session_projcache.json` 的 `tables.sessions.<id>` 整行删除（缓存行带 `identity` 校验，孤儿行本会被丢弃，显式删除是为了满足「缓存文本不可访问」的硬要求）；
- 查询层结论：`session.list` 只读 `sessionPersistence.list()`（磁盘目录扫描），删文件后会话**静默消失**，不产生幽灵条目；默认无 sqlite FTS 落盘；
- 退出时序：SIGINT/SIGTERM → 标记关停 → fiber dispose（插件同步清理）→ `process.exit`；若 dispose 未完成而被强制退出，`exit` 监听器执行同一幂等清理函数。

### 4. 通信
- 内置 `workspace.*` RPC 映射表写死、不可扩展；动态插件的 `harness.handle/host.call` 只服务于运行时 cordis 包。**已发布插件用自定义 HTTP 路由**：`ctx.webServer.register({ kind: 'exact', path, handler })`（返回 disposer），client 端同源 `fetch`。

## 四、文件地图

| 文件 | 职责 |
| --- | --- |
| `cordis.patch.yml` | bundle patch：把插件行注入 profile 组合 |
| `lib/index.js` | host：list/preview/delete/restore/settings/purge 路由、v3 批次事务清单、子代理血缘、占用统计、运行期与关停清理；导出纯函数供测试 |
| `lib/client.js` | browser：`sidebar.footer.action` 入口按钮 + 回收站面板（body portal）+ 单项/级联 Modal + 永久清理 RiskConfirmation + Toast；不 fork 官方 Workspace |
| `scripts/cascadeflow.test.mjs` | mock ctx 端到端：血缘预览→批次失败回滚→批次提交→从任意成员整批恢复 |
| `scripts/selftest.mjs` | 夹具级单测：JSON 手术、原子写、路径越界防护 |
| `scripts/hostflow.test.mjs` | mock ctx 端到端：删除→清单→恢复→再删→exit 硬清除 |
| `scripts/purgeflow.test.mjs` | mock ctx 端到端：大小预览→运行中保护→冷会话立即清理→运行时 metadata 同步 |
| `scripts/orphanflow.test.mjs` | mock ctx 端到端：缺失工件确认→`0 B`→metadata-only 清理 |

## 五、风险与缓解

| 风险 | 缓解 |
| --- | --- |
| DSH 升级改动内部方法名 | 版本钉住；README 注明；恢复失败仅返回 500，不影响归档状态 |
| 硬删除时文件被占用（Windows） | `rmSync` 逐项 try/catch，失败项留在清单，下次关闭重试；永远向「保留数据」方向降级 |
| 运行期直接改 JSON 被内存态覆盖 | 立即清理不直接改 Workspace/投影缓存 JSON；分别通过现有 runtime domain 对象写入 |
| 物理删除中途崩溃后误恢复 | 删除任何工件前先持久化 `purging`；该状态禁用恢复，只允许幂等重试清理 |
| 插件损坏导致 web 无法启动 | 行级回滚：从 profile `package.json` 移除 bundles/dependencies 条目即可恢复 |
| 多标签页一致性 | 会话显隐仍走官方广播帧；插件面板状态用 `BroadcastChannel` 发送失效通知，各标签页收到后从 host API 重新读取权威清单，并保留焦点/可见性刷新和 30 秒轮询兜底 |
| 主题或第三方皮肤切换后对比度失效 | 不读取固定颜色模式；所有表面、边框、文字、状态和阴影走 Harness 的 `--dsw-*` 设计变量，由 `body[data-ds-dark-theme]` 与皮肤覆写自动接管 |
