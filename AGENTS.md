# AGENTS.md

给在这个仓库里工作的 AI agent 的说明。**先读 README.md 和 docs/ 下的 spec/计划**，再动代码。

## 项目是什么

`photo-picker` 是一个 DSH（DeepSeek Harness）插件 bundle：Host 侧（ESM JavaScript，Cordis 服务）负责照片扫描、本地预处理、AI 分层筛选、复核数据、校准与导出；Client 侧（React + TSX，esbuild 打包）是左侧栏「照片工作台」页面。所有状态在一个项目 SQLite 里，agent 工具 `photo_picker` / `photo_picker_export` 与面板共享同一个服务。

- 版本：`0.0.1`
- 平台：macOS（`sips`、`osascript`、`open`）；Node 22.23+（`node:sqlite`）
- 文档：`docs/superpowers/specs/`（设计）、`docs/superpowers/plans/`（执行计划与状态）

## 快速命令

```bash
npm install              # 依赖（sharp/exifr/nanoid/esbuild）
npm test                 # 全部 node:test（71 个）
npm run build:client     # plugin/src/client -> plugin/dist/client.js
npm run fixtures         # /tmp/pp-fixtures（120 张测试图）
npm run acceptance:1     # 本机扫描/预处理
npm run acceptance:2     # AI 流水线端到端（mock LLM，零费用）
npm run acceptance:4     # 复核/改判/导出/源零写入
```

改客户端后必须 `npm run build:client` 并提交 `plugin/dist/client.js`；Host 侧普通 JS 不需要编译。

## DSH 环境注意事项

- 必须在**创造者模式**会话里安装/验证插件（需要 `plugin_manager`、`cordis_inspect_*`、Chrome DevTools MCP）。
- 安装只走 `plugin_manager action=install_bundle target=<abs>/plugin`，**不要手写 profile 的 `package.json` / `cordis.patch.yml`，不要直接改 `$DSH_HOME`**。
- 本 profile 的 HMR `root: []`（不监听模块源码）：
  - 改 Host 代码后需要 `plugin_manager set_plugin` 对 `include:photo-picker` 做一次 **disable → enable**，或重启 DSH；
  - 改 Client 代码后重新 build，刷新页面即可；Client 模块图在 Host 启动时缓存 `dsh.client`，**首次新增 client 半必须重启**。
  - 本会话里已验证可用的热重载方式就是 disable/enable 插件。
- 本地 HTTP 只绑定 loopback；不要新增对外监听或鉴权绕过。

## 真实模型调用会花钱

- 所有测试、`acceptance:1/2/4` 都使用 mock/fixture，**不会**调用真实模型。
- 不要擅自对真实照片跑 AI 阶段；需要真实调用（验证提示词、模型行为、费用）时先让用户确认，并优先用小样本（16 张约 ¥0.05）。
- 一次性工具类调用必须传 `reasoningEffort: 'off'`（否则思维链会吃掉 `maxTokens`，返回空文本）；评分提示词要给显式 JSON 结构，解析器兼容中英文键名。

## 工程约定

- **Host**：`plugin/src/host/*.js`，ESM，无 TypeScript；SQLite schema 集中在 `db.js`，新增表/列用 `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` 并保持向后兼容（项目库在用户目录，不能重建）。
- **Client**：`plugin/src/client/index.tsx` + `locales.js`；Theme 用 `--dsw-alias-*` token，不要硬编码浅色/深色。
- **测试**：`plugin/test/*.test.js`，用 `node:test` + `node:assert/strict`；纯函数优先单测，流水线用 fake LLM（参考 `pipeline.test.js` / `acceptance-phase2.mjs`）。
- **不要引入网络依赖到测试**；新功能要有对应测试或验收脚本。
- 提交信息沿用 `feat:` / `fix:` / `docs:` / `test:` / `chore:`。
- 不要把个人照片、真实路径清单、API Key 或数据库提交进仓库。

## 数据与状态

- 项目工作区：`~/Pictures/PhotoPicker/<项目>/`（`db.sqlite`、`thumbs/`、`previews/`、`grids/`、`logs/`）。源目录只读。
- 照片状态：`ok`、`unreadable`、`filtered_dup/blur/exposure/small`、`grid_selected`、`grid_rejected`、`grid_error`、`scored`、`score_failed`。
- **判定优先级**：`decisions(source='human')` > `decisions(source='ai')` > `assessments(score/verdict)` > `'maybe'`。任何 AI 写入都不得覆盖 human。
- 阶段：`scan → preprocess → grid → rank → score`；`orchestrator.js` 负责自动串联，`stage_pause=1` 时每阶段结束停止；预算暂停 / 取消（abort）也会停。
- **启动阶段前必须重读 `projects` 行**（`service.freshProject`），不能用 `ProjectStore` 打开时的快照，否则设置（阈值/预算/stagePause/model）不会生效。
- 幂等：扫描 upsert；AI 结果按 `(target_kind,target_id,stage,model_id,prompt_version)` 去重；重跑只补缺。

## 本地化（i18n）

- 界面语言**跟随浏览器**（`navigator.languages` 首个 zh/en，否则 en），主屏右上角「中 / EN」按钮可覆盖，存 `localStorage['photoPicker.lang']`；项目设置抽屉不放语言项。
- 所有可见文案走 `plugin/src/client/locales.js` 的 `t()`；**枚举也必须本地化**（`done`→已完成、`filtered_blur`→模糊、`keep/maybe/reject`→保留/待定/弃用），不要直接渲染内部枚举。
- 新增键必须同时加到 zh/en；`plugin/test/i18n.test.js` 会检查源码里每个 `t('key')` 与枚举键是否齐全。
- 面向模型/开发者的内容（工具描述、错误码、日志、manifest 字段）保持英文/原样，不参与界面本地化。

## 已知坑（都踩过）

- `sharp` 预编译版**不能读 HEIC**（缺 libde265）：HEIC/RAW 必须先 `sips` 转 JPEG；`sharp` 原生 `text` 输入不可用，网格编号用 **SVG overlay**。
- `exifr` 在 Node ESM 下只有 default 导出：用 `import exifr from 'exifr'`，不要 `import * as exifr`。
- `deriveImage` 必须用**原图尺寸**（含 EXIF 旋转），不能用缩放后的缓冲尺寸，否则全部被判 `filtered_small`。
- 缩略图 URL 带 `?v=<project.updatedAt>`，阶段完成后强制重取；没有缩略图的照片（重复/未处理）要显示占位而不是坏图。
- 导出必须排除 `grid_rejected`/`filtered_*`；dry-run 与执行使用同一套判定 SQL。
- 网格打包是**分组感知**的，实际格数可能大于 `ceil(候选/16)`，测试不要假设等于该值。
- 组对比每页 6 张；`groupDetail` 的成员按分数降序，名次从 1 开始。

## 发布

- 版本号在两处：根 `package.json` 与 `plugin/package.json`（以及 `package-lock.json` 的根 packages 条目）。
- 发布前：`npm test`、`npm run acceptance:1 && npm run acceptance:2 && npm run acceptance:4`、`npm run build:client`，确认 `git status` 干净。
- 仓库默认分支 `main`；推送到 GitHub 前确认 remote 与可见性，不要在公开仓库里放个人照片/路径清单。
- 设计文档与计划随代码一起维护；实现偏离 spec 时在对应 plan 里写「实现状态/偏差」。
