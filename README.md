# dsh-session-trash

> DeepSeek Harness（DSH）Web GUI 的崩溃安全会话回收站：删除后可立即撤销、可选级联子代理后代、支持关闭时/7 天/30 天/永久保留策略，并适配跨标签页同步与原生浅色/深色主题。

**A crash-safe session trash bin for the DSH web GUI with undo, cross-tab sync, artifact-size preview, and guarded permanent purge.**

## 语义 Semantics

| 操作 | 效果 |
| --- | --- |
| **删除（Delete）** | 在会话行 `…` 菜单中选择「删除当前会话」，或从侧边栏底部的回收站面板选择会话，并完成二次确认。检测到子代理后代时可选择仅删除当前会话（默认）或整批移入回收站；普通 fork、原本已归档/已在回收站的后代不受影响。 |
| **撤销 / 恢复（Undo / Restore）** | 删除后 7 秒内可在顶部提示中一键撤销；之后仍可从回收站面板恢复。级联批次会整批撤销/恢复，异常退出后重启仍可恢复。 |
| **多标签页（Cross-tab）** | 删除、撤销、恢复、永久清理和策略修改通过 `BroadcastChannel` 即时刷新其他 Harness 标签页，并保留焦点/可见性刷新和低频轮询兜底。 |
| **查找（Search）** | 回收站面板可按标题、完整 session ID 或工作区名过滤；回收站条目固定按最近删除优先排列。 |
| **永久删除（Purge）** | 回收站逐项显示当前磁盘占用快照；已确认不存在的工件显示「工件已不存在」并按 `0 B` 计，仍可清理 Workspace/投影缓存和回收站清单。可永久删除单项或清空所有已停止会话；仍被 Harness 加载的会话会被安全跳过。 |
| **自动清理（Retention）** | 可选择「关闭时清理」（默认）、「保留 7 天」、「保留 30 天」或「永久保留」。有限保留期在运行时每小时检查，并在正常关闭时再次清理真正到期的条目；运行中的条目在运行期安全跳过。 |
| **进程崩溃 / 强杀** | 三阶段清单记录 `pending → committed → purging`；未提交的删除永不进入物理清理，已经开始物理清理的条目不会错误地提供恢复。 |

## 安装 Install

```sh
git clone https://github.com/Wzs010429/dsh-session-trash
dsh plugin --profile web add ./dsh-session-trash
# 重启 dsh web
```

安装后，会话行 `…` 菜单会出现「删除当前会话」，侧边栏底部也会出现「回收站」按钮。卸载（回滚）：

```sh
dsh plugin --profile web remove @dsh-external/dsh-session-trash
# 或手工编辑 ~/.dsh/profiles/web/package.json：
#   从 dsh.profile.bundles 和 dependencies 中移除本包，然后重启 dsh web
```

## 工作原理 How it works

插件是标准的 DSH bundle 插件（与官方皮肤插件同构）：

- `cordis.patch.yml`：保留原版 `ui-workspace`，只把本插件行插入 profile 组合；
- `lib/index.js`（host）：**声明 `inject`**，注册 list/preview/delete/restore/settings/purge 路由，按 Harness 的连续 `origin: subagent` 血缘计算后代，维护批次事务、磁盘占用缓存和保留策略；有限保留期每小时筛选到期项，正常关停时再次精确筛选；会话 API 无法定位工件时，再以路径守卫扫描标准 sessions 布局，区分「确认不存在」与「读取失败」；
- `lib/client.js`（browser，由 `scripts/build-client.mjs` 生成）：通过官方支持的 `sidebar.footer.action` slot 注册「回收站」按钮与面板；同时观察官方语义化的 session-row/menu DOM，在菜单弹出时追加「删除当前会话」；删除确认会先预览子代理后代，并默认选择「仅删除当前会话」。删除成功后显示 7 秒单项/整批撤销入口，并向其他标签页广播状态变化。面板和提示仅使用 Harness 原生 `--dsw-*` 主题变量，自动跟随浅色、深色和第三方皮肤；
- 关停清理同时理解 DSH 的真实顺序：`SIGINT/SIGTERM → fiber.dispose() → process.exit()`。插件先记录关停信号，在自己的 disposer 中同步提交删除，并保留 `exit` fallback。

关键设计（详见 [DESIGN.md](DESIGN.md)）：

- **隐藏复用官方归档**：`workspaceRegistry.archiveSession()` → 官方机制保证分组视图 + 搜索全部隐藏，且 `host/archived-sessions-changed` 帧自动同步所有标签页；
- **恢复走注册表自己的写路径**：`registry.enqueueOperation()` + `registry.setState()` 写入不含该 id 的归档集 → 域写入触发 `domain/changed` → api-proxy 自动向所有客户端推送新归档集，会话即时回归；
- **关停顺序感知**：识别 DSH 的 `SIGINT/SIGTERM → fiber.dispose() → process.exit()` 顺序，在 disposer 中按策略清理，`exit` 仅作为强制退出 fallback；
- **崩溃安全事务**：软删除前先持久化 `pending`，归档成功后转为 `committed`；物理删除前先持久化 `purging`，任何中断都向保留或可重试方向退化；
- **可选子代理级联**：严格沿 Harness 官方的连续 `origin: subagent` 血缘计算后代，普通 fork 截断传播；默认关闭级联，选择级联后每个会话仍保留独立清单行，并用共享 `batchId` 支持整批撤销/恢复；
- **孤儿摘要过滤**：父会话物理清理后，Harness 的内存目录可能短暂保留历史子代理摘要；面板不会把这类无父会话、无持久化工件的摘要误列为可删除会话；
- **可配置保留期**：设置文件使用 `retentionDays: 0 | 7 | 30 | null`；旧版 `purgeOnShutdown` 自动映射为关闭时清理/永久保留。7/30 天策略只提交到期条目，未到期条目在重启后继续可恢复；
- **运行时永久清理**：仅允许清理未加载会话；Workspace 通过 `detachSession`/`setState`、投影缓存通过其 domain table 删除，避免直接改 JSON 后被内存态覆盖；
- **即时撤销与跨标签页同步**：软删除后提供 7 秒一键撤销；`BroadcastChannel` 只发送“状态已变化”信号，其他标签页仍从 host API 重新读取权威清单；
- **缺失工件可收敛**：只有在受路径守卫保护的 sessions 扫描明确确认目录不存在后，才持久化 `artifactMissing`；此时大小为 `0 B`，物理阶段成为 metadata-only 清理。读取失败仍保持「大小未知」并禁止误提交；
- **原生主题适配**：Harness 通过 `body[data-ds-dark-theme]` 切换设计变量；插件使用 `--dsw-specific-menu`、`--dsw-alias-bg-*`、`--dsw-alias-border-*`、`--dsw-alias-toast-bg` 和 `--dsw-shadow-*`，不硬编码浅色表面；
- **独立策略文件**：`storages/session-trash-settings.json` 保存 `retentionDays`，旧版布尔设置读取时自动兼容，不改写现有删除清单。

## 已验证 Validated

- `scripts/selftest.mjs`：workspace.json / session_projcache.json 手术逻辑、原子写、路径越界防护（夹具测试）；
- `scripts/hostflow.test.mjs`：mock cordis 上下文下的完整生命周期——删除 → 清单落盘 → 恢复 → 再删除 → 进程退出硬清除（含缓存行清理与清单移除）；
- `scripts/settingsflow.test.mjs`：关闭关停清理后，验证日志、Workspace 登记和回收站清单全部保留；
- `scripts/purgeflow.test.mjs`：验证大小预览、运行中保护、冷会话立即清理以及运行时 Workspace/投影缓存同步；
- `scripts/orphanflow.test.mjs`：验证无工件清单在启动时收敛为 `artifactMissing`、显示 `0 B`，并完成 metadata-only 清理；
- `scripts/cascadeflow.test.mjs`：验证子代理后代预览、普通 fork 截断、已归档后代排除、批次失败回滚、批次提交和从任意条目整批恢复；
- `scripts/retentionflow.test.mjs`：验证 7 天策略在关停时仅清理已满 7 天的日志、Workspace 登记和投影缓存，未到期条目保持完整可恢复；
- `scripts/clientbundle.test.mjs`：防回归检查，保证发布 bundle 包含撤销与跨标签页同步，同时不嵌入或禁用官方 Workspace，也不会注册 `workspace` locale；
- **实机验证**：三点菜单注入 ✓、双层风险确认 ✓、数量徽标 ✓、大小预览 ✓、永久删除/清空入口 ✓、运行中保护 ✓、官方 Workspace 与本插件并存且控制台无错误 ✓。

### 手动验收清单

1. 打开任一标题唯一的会话行 `…` 菜单，出现「删除当前会话」；侧边栏底部同时存在「回收站」按钮；
2. 点「删除当前会话」或面板中的「删除」→ 出现确认框，必须勾选确认才能点最终「删除」；
3. 确认后该会话从侧边栏与搜索中消失，顶部出现「撤销」；点「撤销」后会话立即回到原位置；
4. 若会话存在子代理后代，确认框默认选中「仅删除当前会话」；切换为级联后，应显示纳入批次、仍在运行和被安全排除的数量；
5. 不点撤销时，面板「回收站中」出现该会话；批次条目显示批次数量，从任意一项点「恢复」都应完整恢复剩余批次；
6. 同时打开两个 Harness 标签页，在其中一个执行删除或恢复，另一个标签页的回收站数量应即时更新；
7. 在设置中分别选择「浅色」和「深色」，回收站面板、行状态、危险按钮和撤销提示都应保持清晰可读；
8. 在搜索框输入标题、工作区名或 session ID，两个列表只显示匹配项；回收站始终以最近删除的会话在前；
9. 回收站显示每项占用或明确的「工件已不存在」；点「永久删除」或「清空回收站」→ 出现独立强确认，运行中会话不会进入清理；
10. 依次选择「关闭时清理 / 保留 7 天 / 保留 30 天 / 永久保留」，确认提示文案和设置持久化一致；有限保留期只清理真正到期的条目。

## 已知限制 Known limitations

- **级联不会停止正在运行的子代理**：软删除只改变可见性；确认框会显示仍在运行的后代数量，它们可能继续在后台执行。运行中的条目仍不能立即永久删除，只能恢复、等待停止或交给正常关停清理。
- **不清理全文搜索索引**：若你自行启用了 `session-query-sqlite` 的持久 FTS 库（默认关闭），其索引行不会被清除（无公开删除 API）。
- **立即永久删除只处理未加载会话**：若会话仍在 Harness 的 session service 中，即使当前没有生成内容也会被安全跳过；重启后可再清理，或交给正常关停清理。
- **大小是当前快照**：工件目录仍可能被后台写入；面板会定期重测。只有 sessions 根目录不可读或路径无法安全判定时才显示「大小未知」，这种条目不会被当作无工件提交。
- **异常退出不会启动新的硬删除**：`taskkill /F`、断电不会把 `committed` 条目推进到 `purging`；已进入 `purging` 的项目会在下次清理时幂等重试。
- **当前会话也可删除**：删除正在使用的会话后界面回到新会话，该会话可能继续在后台运行；永久清理仍取决于关停策略。
- 会话行 `…` 菜单没有官方第三方扩展点。本插件通过 `role=treeitem/menu/menuitem` 等语义 DOM 做非侵入增强，不依赖随机 CSS 类；若 DSH 将来改变这些语义结构，菜单入口会安全失效，左下角回收站仍可使用。
- 为避免同名会话映射到错误 id，标题重复时不向三点菜单注入删除项，请改用回收站面板按完整列表操作。

## 兼容性 Compatibility

- 针对 DSH `0.1.0-rc.x`（web profile）设计与测试；依赖 `dsh-workspace` 的 `enqueueOperation/setState` 内部方法签名、`host/archived-sessions-changed` 广播机制，以及 host 插件 `inject` 服务名（`webServer`/`workspaceRegistry`/`sessionPersistence`/`sessions`）。DSH 升级若改动这些内部实现，请及时反馈。

## Roadmap

- [x] 「立即永久删除」与「清空回收站」（带运行中保护）
- [x] 可选级联删除子代理会话（普通 fork 截断、整批撤销/恢复）
- [x] 删除前磁盘占用统计
- [x] 回收站面板开关（关闭硬删除、只归档）
- [x] 删除后一键撤销与跨标签页即时同步
- [x] 缺失工件的 `0 B` 判定与 metadata-only 清理
- [x] Harness 原生浅色/深色主题变量适配
- [x] 按标题 / ID / 工作区搜索并按最近删除排序
- [x] 关闭时 / 7 天 / 30 天 / 永久保留策略
- [ ] 把浏览器 fork 升级为「slot 子菜单」类官方扩展点（若上游提供）

## License

[MIT](LICENSE)
