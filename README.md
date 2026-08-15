# dsh-session-trash

> DeepSeek Harness（DSH）Web GUI 的会话回收站插件：删除后可恢复，并可选择是否在正常关闭 `dsh web` 时永久清除日志、注册表条目与投影缓存。

**A session trash bin for the DSH web GUI with restorable soft-delete and a configurable shutdown purge policy.**

## 语义 Semantics

| 操作 | 效果 |
| --- | --- |
| **删除（Delete）** | 在会话行 `…` 菜单中选择「删除当前会话」，或从侧边栏底部的回收站面板选择会话，并完成二次确认。会话立即从所有分组和搜索中隐藏（走官方归档机制，所有打开的标签页同步隐藏）；日志暂时原样保存在磁盘上。 |
| **恢复（Restore）** | 可从回收站面板一键恢复，会话原样回到原分组位置；异常退出后重启仍可恢复。 |
| **关闭 `dsh web`** | 默认同步硬删除日志、Workspace 登记和投影缓存；关闭「关闭时永久清理」后，仅保留隐藏状态与回收站清单。 |
| **进程崩溃 / 强杀** | 什么都不丢：会话保持隐藏，删除清单在下次启动时自动加载。 |

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
- `lib/index.js`（host）：**声明 `inject`**，注册 list/delete/restore/settings 路由，分别持久化回收站清单和清理策略，并在真实 DSH 关停阶段按策略执行硬删除；
- `lib/client.js`（browser，由 `scripts/build-client.mjs` 生成）：通过官方支持的 `sidebar.footer.action` slot 注册「回收站」按钮与面板；同时观察官方语义化的 session-row/menu DOM，在菜单弹出时追加「删除当前会话」，并复用同一个 `RiskConfirmation` 流程。它不复制、替换或再次注册官方 Workspace UI；
- 关停清理同时理解 DSH 的真实顺序：`SIGINT/SIGTERM → fiber.dispose() → process.exit()`。插件先记录关停信号，在自己的 disposer 中同步提交删除，并保留 `exit` fallback。

关键设计（详见 [DESIGN.md](DESIGN.md)）：

- **隐藏复用官方归档**：`workspaceRegistry.archiveSession()` → 官方机制保证分组视图 + 搜索全部隐藏，且 `host/archived-sessions-changed` 帧自动同步所有标签页；
- **恢复走注册表自己的写路径**：`registry.enqueueOperation()` + `registry.setState()` 写入不含该 id 的归档集 → 域写入触发 `domain/changed` → api-proxy 自动向所有客户端推送新归档集，会话即时回归；
- **关停顺序感知**：识别 DSH 的 `SIGINT/SIGTERM → fiber.dispose() → process.exit()` 顺序，在 disposer 中按策略清理，`exit` 仅作为强制退出 fallback；
- **崩溃安全清单**：`storages/session-trash.json` 记录待删除项，异常退出时数据零丢失。
- **独立策略文件**：`storages/session-trash-settings.json` 保存 `purgeOnShutdown`，不迁移、不改写现有删除清单。

## 已验证 Validated

- `scripts/selftest.mjs`：workspace.json / session_projcache.json 手术逻辑、原子写、路径越界防护（夹具测试）；
- `scripts/hostflow.test.mjs`：mock cordis 上下文下的完整生命周期——删除 → 清单落盘 → 恢复 → 再删除 → 进程退出硬清除（含缓存行清理与清单移除）；
- `scripts/settingsflow.test.mjs`：关闭关停清理后，验证日志、Workspace 登记和回收站清单全部保留；
- `scripts/clientbundle.test.mjs`：防回归检查，保证发布 bundle 不再嵌入或禁用官方 Workspace，也不会注册 `workspace` locale；
- **实机验证**：三点菜单注入 ✓、二次确认 ✓、数量徽标 ✓、清理策略开关 ✓、官方 Workspace 与本插件并存且控制台无错误 ✓。

### 手动验收清单

1. 打开任一标题唯一的会话行 `…` 菜单，出现「删除当前会话」；侧边栏底部同时存在「回收站」按钮；
2. 点「删除当前会话」或面板中的「删除」→ 出现确认框，必须勾选确认才能点最终「删除」；
3. 确认后该会话从侧边栏与搜索中消失，面板「回收站中」出现该会话；
4. 点「恢复」→ 会话回到原分组位置，历史记录完整；
5. 关闭「关闭时永久清理」后重启：回收站内容仍存在并可恢复；
6. 重新开启该策略，正常关闭 `dsh web`（Ctrl+C）后重启：待删除会话彻底消失。

## 已知限制 Known limitations

- **不级联删除子代理会话**：删除父会话后，其子代理（subagent）的会话日志仍保留在磁盘（DSH 官方归档同样不处理子代理）。如需级联删除请提 issue。
- **不清理全文搜索索引**：若你自行启用了 `session-query-sqlite` 的持久 FTS 库（默认关闭），其索引行不会被清除（无公开删除 API）。
- **硬删除只在正常关闭时执行**：`taskkill /F`、断电等异常退出不会删文件（数据安全优先），下次启动后会话仍隐藏、可恢复。
- **当前会话也可删除**：删除正在使用的会话后界面回到新会话，该会话可能继续在后台运行；永久清理仍取决于关停策略。
- 会话行 `…` 菜单没有官方第三方扩展点。本插件通过 `role=treeitem/menu/menuitem` 等语义 DOM 做非侵入增强，不依赖随机 CSS 类；若 DSH 将来改变这些语义结构，菜单入口会安全失效，左下角回收站仍可使用。
- 为避免同名会话映射到错误 id，标题重复时不向三点菜单注入删除项，请改用回收站面板按完整列表操作。

## 兼容性 Compatibility

- 针对 DSH `0.1.0-rc.x`（web profile）设计与测试；依赖 `dsh-workspace` 的 `enqueueOperation/setState` 内部方法签名、`host/archived-sessions-changed` 广播机制，以及 host 插件 `inject` 服务名（`webServer`/`workspaceRegistry`/`sessionPersistence`/`sessions`）。DSH 升级若改动这些内部实现，请及时反馈。

## Roadmap

- [ ] 「立即永久删除」按钮（不等关闭）
- [ ] 级联删除子代理会话
- [ ] 删除前磁盘占用统计
- [x] 回收站面板开关（关闭硬删除、只归档）
- [ ] 把浏览器 fork 升级为「slot 子菜单」类官方扩展点（若上游提供）

## License

[MIT](LICENSE)
