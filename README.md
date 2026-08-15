# dsh-session-trash

> DeepSeek Harness（DSH）Web GUI 的会话回收站插件：删除会话后，在 `dsh web` 关闭之前都可以恢复；`dsh web` 一旦关闭，被删除的会话记录会被**永久清除**（日志、注册表条目、投影缓存一并删除）。

**A session trash bin for the DSH web GUI: soft-delete a session (restorable while `dsh web` is running); when `dsh web` shuts down, trashed sessions are permanently purged — log files, workspace registry entries and projection-cache rows all removed.**

## 语义 Semantics

| 操作 | 效果 |
| --- | --- |
| **删除（Delete）** | 在会话行 `…` 菜单中选择「删除当前会话」，或从侧边栏底部的回收站面板选择会话，并完成二次确认。会话立即从所有分组和搜索中隐藏（走官方归档机制，所有打开的标签页同步隐藏）；日志暂时原样保存在磁盘上。 |
| **恢复（Restore）** | `dsh web` 进程存活期间，可从回收站面板一键恢复，会话原样回到原分组位置。 |
| **关闭 `dsh web`** | 进程退出时同步执行硬删除：删除会话日志目录、从 `storages/workspace.json` 移除记账与归档条目、从 `storages/session_projcache.json` 删除该会话的标题/统计等缓存行。删除清单同步清理。 |
| **进程崩溃 / 强杀** | 什么都不丢：会话保持隐藏（归档是持久化的），删除清单在下次启动时自动加载，仍可恢复。只有**正常关闭**才会提交永久删除。 |

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
- `lib/index.js`（host）：**声明 `inject`**（fiber 上下文的 `ctx.get` 只能读到已声明注入的服务——这是本插件踩过的最深的坑），注册 3 个 HTTP 路由（`/session-trash/list|delete|restore`），维护内存回收站 + 磁盘删除清单，并在真实 DSH 关停阶段执行硬删除；
- `lib/client.js`（browser，由 `scripts/build-client.mjs` 生成）：通过官方支持的 `sidebar.footer.action` slot 注册「回收站」按钮与面板；同时观察官方语义化的 session-row/menu DOM，在菜单弹出时追加「删除当前会话」，并复用同一个 `RiskConfirmation` 流程。它不复制、替换或再次注册官方 Workspace UI；
- 关停清理同时理解 DSH 的真实顺序：`SIGINT/SIGTERM → fiber.dispose() → process.exit()`。插件先记录关停信号，在自己的 disposer 中同步提交删除，并保留 `exit` fallback。

关键设计（详见 [DESIGN.md](DESIGN.md)）：

- **隐藏复用官方归档**：`workspaceRegistry.archiveSession()` → 官方机制保证分组视图 + 搜索全部隐藏，且 `host/archived-sessions-changed` 帧自动同步所有标签页；
- **恢复走注册表自己的写路径**：`registry.enqueueOperation()` + `registry.setState()` 写入不含该 id 的归档集 → 域写入触发 `domain/changed` → api-proxy 自动向所有客户端推送新归档集，会话即时回归；
- **硬删除放在 `process.on('exit')`**：此时事件循环已排空、会话日志已 flush 完毕、域写链已静止，用同步 fs 原子改文件最安全；
- **崩溃安全清单**：`storages/session-trash.json` 记录待删除项，异常退出时数据零丢失。

## 已验证 Validated

- `scripts/selftest.mjs`：workspace.json / session_projcache.json 手术逻辑、原子写、路径越界防护（夹具测试）；
- `scripts/hostflow.test.mjs`：mock cordis 上下文下的完整生命周期——删除 → 清单落盘 → 恢复 → 再删除 → 进程退出硬清除（含缓存行清理与清单移除）；
- `scripts/clientbundle.test.mjs`：防回归检查，保证发布 bundle 不再嵌入或禁用官方 Workspace，也不会注册 `workspace` locale；
- **实机验证**：host 服务注入 ✓、路由 200/400/404 ✓、`workspace.json` 归档集与删除清单落盘/清理 ✓、恢复即时生效 ✓、官方 Workspace 与本插件并存 ✓。

仍待真实浏览器 UI 验收（三点菜单样式与面板位置）——安装后请按下面的清单手动验收，遇到问题在 GitHub 提 issue。

### 手动验收清单

1. 打开任一标题唯一的会话行 `…` 菜单，出现「删除当前会话」；侧边栏底部同时存在「回收站」按钮；
2. 点「删除当前会话」或面板中的「删除」→ 出现确认框，必须勾选确认才能点最终「删除」；
3. 确认后该会话从侧边栏与搜索中消失，面板「回收站中」出现该会话；
4. 点「恢复」→ 会话回到原分组位置，历史记录完整；
5. 再删除一个会话，**正常关闭** `dsh web`（Ctrl+C）后重启：该会话彻底消失；
6. 检查 `~/.dsh/storages/session-trash.json` 已不存在。

## 已知限制 Known limitations

- **不级联删除子代理会话**：删除父会话后，其子代理（subagent）的会话日志仍保留在磁盘（DSH 官方归档同样不处理子代理）。如需级联删除请提 issue。
- **不清理全文搜索索引**：若你自行启用了 `session-query-sqlite` 的持久 FTS 库（默认关闭），其索引行不会被清除（无公开删除 API）。
- **硬删除只在正常关闭时执行**：`taskkill /F`、断电等异常退出不会删文件（数据安全优先），下次启动后会话仍隐藏、可恢复。
- **当前会话也可删除**：删除正在使用的会话后界面回到新会话，该会话在后台继续运行，直到关闭时被清理（确认框中有提示）。
- 会话行 `…` 菜单没有官方第三方扩展点。本插件通过 `role=treeitem/menu/menuitem` 等语义 DOM 做非侵入增强，不依赖随机 CSS 类；若 DSH 将来改变这些语义结构，菜单入口会安全失效，左下角回收站仍可使用。
- 为避免同名会话映射到错误 id，标题重复时不向三点菜单注入删除项，请改用回收站面板按完整列表操作。

## 兼容性 Compatibility

- 针对 DSH `0.1.0-rc.x`（web profile）设计与测试；依赖 `dsh-workspace` 的 `enqueueOperation/setState` 内部方法签名、`host/archived-sessions-changed` 广播机制，以及 host 插件 `inject` 服务名（`webServer`/`workspaceRegistry`/`sessionPersistence`/`sessions`）。DSH 升级若改动这些内部实现，请及时反馈。

## Roadmap

- [ ] 「立即永久删除」按钮（不等关闭）
- [ ] 级联删除子代理会话
- [ ] 删除前磁盘占用统计
- [ ] 设置页开关（关闭硬删除、只归档）
- [ ] 把浏览器 fork 升级为「slot 子菜单」类官方扩展点（若上游提供）

## License

[MIT](LICENSE)
