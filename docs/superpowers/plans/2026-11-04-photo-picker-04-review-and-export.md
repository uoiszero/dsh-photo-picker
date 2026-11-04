# 照片工作台 · 计划 4：复核、改判与导出

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让 AI 产出的 keep / maybe / reject 真正可用：面板里能看图墙、筛选取舍、批量改判与撤销、看单图详情，并把选定分桶硬链接/复制导出到新目录（manifest + dry-run + 源零写入）。

**Architecture:** Host 新增 `review.js`（用统一 SQL 解析最终判定：人类优先于 AI）与 `export.js`（dry-run、硬链接/复制、manifest、源零写入校验）；服务暴露复核/导出 API 与 `photo_picker_export` 工具；Client 把项目详情升级为「阶段 + 图墙 + 单图 + 导出」工作台。

**Tech Stack:** `node:sqlite`、`sharp`（1600px 预览按需生成）、`node:fs`（link/copyFile/manifest）。

---

## 实现状态（2026-11-04）

- Task 1–6 已实现：复核查询（人类 > AI 决策 > 评分 > 默认）、1600px 预览、决策/详情/分组/统计 API、导出 dry-run 与执行、`photo_picker_export` 工具、图墙 / 单图 / 导出对话框。
- Task 7 已通过：`npm run acceptance:4`（120 夹具 mock 流水线 → 复核 → 改判 → 导出 → 源哈希不变 → 重跑跳过）。
- 真实项目验收（`真实样本-16`，12 张已评分）：
  - 图墙 12 张、分数角标 6.8/5.8、判定色带、筛选与排序正常；
  - 单图 1600px 预览、六维条形、理由与后期建议 chips、J/K/P/M/X 快捷键；
  - 批量「保留」写入 2 条人类决策，「撤销」恢复为自动判定；
  - 导出 dry-run `keep 0 · maybe 6 · 88.3 MB · 同盘`，执行后 `/tmp/pp-export-ui/maybe/` 6 个硬链接 + `manifest.csv/json`。
- 实现中发现并修复：最终判定必须读取 `decisions(source='ai')`（否则 `grid_rejected` 与过滤照片会被当成默认 `maybe` 导出）；导出只统计可复核状态；撤销需要「删除人类决策」语义（`verdict='auto'`）。
### 组对比与校准（2026-11-04 追加）

- **组对比**：单图按 `G` 或按钮进入；每次 6 张分页（超过 6 张时翻页），显示 AI 排名/分数与人工标记；`1–6` 选片、`Enter` 确认本组（选中 keep、其余 reject）、`X` 全组弃用、`←/→` 换组、`Space` 返回。实测夹具 59 张的组：6/页、10 页，确认后写入 59 条人类决策（58 reject + 1 keep），随后可用 API `verdict=auto` 清除。
- **校准**：`GET /calibration/sample` 按拍摄时间分层抽样（盲评样本不含 AI 分数/判定）；逐张标 keep/maybe/reject 后 `POST /calibration` 计算 keep 精确率/召回率/F1、三分类一致率、0–10 阈值曲线与建议 keep/maybe 阈值，报告落 `calibration_reports`；「应用建议阈值」通过 `PATCH /projects/:id` 写入。
- 真实项目实测：12 张盲评（全标 keep）→ F1 0 / 一致率 0% / 建议 keep ≥ 5.8；应用后阈值变为 5.8 / 4.3（随后恢复默认 7.5 / 6）。
- **与 spec 的偏差**：校准复用项目里**已评分**的照片，而不是重新跑一遍 L1–L3 再抽样（等价于测阈值，但不会重复计费）；已在计划中记录。
- **设置抽屉（2026-11-04 完成）**：右侧抽屉包含题材、模型（图片输入检测，text-only 模型禁选）、并发、预算、网格列/行、keep/maybe 阈值、连拍/同场景时间窗与汉明距离、阶段间暂停、离峰开关、提示词全文（v1）、重跑预处理/网格粗筛/组内排序/单张精评；保存走 `PATCH /projects/:id`，阈值/分组/提示词下方标注影响范围。`GET /prompt` 返回提示词全文，`GET /models` 返回带 `inputModalities` 的模型目录。
  - 离峰开关已在服务端生效：高峰时段启动 AI 阶段返回 `OFFPEAK_BLOCKED`（409）。
  - 阶段间暂停目前只持久化设置；因为阶段由用户逐个触发，还没有“自动续跑”的编排器，等后续自动流水线时再消费该开关。
### 小收尾（2026-11-04 完成）

- **导出「在 Finder 中显示」**：`POST /fs/reveal { path }`（目录 `open`，文件 `open -R`；只接受本机绝对路径，缺失返回 404），导出结果里新增按钮。
- **图墙排序补齐**：分数高→低、低→高、按分组、拍摄时间、路径。
- **自动串联**：`POST /actions { action: 'run_all' }` 顺序跑 scan → preprocess → grid → rank → score（新建 `orchestrator.js`，含单元测试）。`stage_pause=1` 时每阶段结束停止并报告下一阶段；预算暂停、取消（abort）同样会停止；面板显示「自动跑完成/已暂停 + 完成的阶段链」。
  - 顺带修复：阶段启动原先读 `ProjectStore` 缓存的旧项目快照，改设置后（stagePause/预算/阈值/模型）不生效；现在每次启动前重读 `projects` 行。
- 实测：真实项目自动跑（已全部处理完）→ 0 次 API 调用完成五阶段；临时开启 stagePause 后自动跑只执行 scan 即停（状态 `scanned`，报告下一阶段 preprocess），随后恢复默认。
- 仍未做：图墙虚拟滚动（大数据量）、组对比“按分数重排”视图。


覆盖 spec 7.7（最终判定规则）、9.2（图墙 / 单图）、9.5（导出对话框）、10.2/10.3（复核与导出工具）、11（导出）、15.2 第 6–7 条。本期不做：组对比视图（后续补）、校准报告（后续补）、网络源（Plan 3）。

**已定实现事实：**
- 照片状态：`ok` / `grid_selected` / `grid_rejected` / `grid_error` / `scored` / `score_failed` / `filtered_*` / `unreadable`。
- `decisions.source='human'` 覆盖 AI；没有人类判定时用 AI 判定；都没有时视为 `maybe`。
- 现有 `thumbs/<id>.webp`（384px）用于图墙；预览图按需生成 `previews/<id>.jpg`（1600px）。

## 统一判定 SQL（review.js）

```sql
SELECT p.id, p.rel_path, p.state, p.taken_at, p.width, p.height, p.group_id,
       d.verdict AS human_verdict,
       a.score, a.verdict AS ai_verdict, a.reason, a.dimensions_json,
       a.post_processing_json,
       COALESCE(d.verdict, a.verdict, 'maybe') AS verdict
FROM photos p
LEFT JOIN decisions d ON d.photo_id = p.id AND d.source = 'human'
LEFT JOIN assessments a ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
WHERE p.project_id = ? AND p.thumb_path IS NOT NULL
```

过滤：`verdict`、`scope`（`review` = 排除 `grid_rejected`/`filtered_*`；`all`）、`group`、`state`、`score_min/max`。排序：`score`（默认降序）、`taken_at`、`rel_path`。

---

## Task 1：`review.js` + 复核 API

**Files:** Create `plugin/src/host/review.js`; Test `plugin/test/review.test.js`

- [ ] `listReviewPhotos(db, projectId, opts)` → `{ items, total }`，含 `score/aiVerdict/humanVerdict/verdict/reason/dimensions/postProcessing/takenAt/groupId/thumbUrl/previewUrl`。
- [ ] `getPhotoDetail(db, projectId, photoId)` → 单张详情 + 同组排名。
- [ ] `setHumanDecisions(db, projectId, photoIds, verdict)` → upsert `source='human'`；返回受影响的 `{ photoId, verdict }`。
- [ ] `projectStats(db, projectId)` → 最终判定计数、分数直方图（0–10 分十档）、状态计数。
- [ ] 测试：人类覆盖 AI；无判定默认 maybe；筛选/排序正确；批量改判只写 human。

## Task 2：1600px 预览路由

**Files:** Modify `plugin/src/host/images.js`（加 `renderPreview`）; `plugin/src/host/http.js`（`/media/preview/:pid/:photoId`）; Test `plugin/test/http.test.js`

- [ ] `renderPreview(filePath, cachePath)`：已有缓存直接返回；否则 `sharp.rotate().resize(1600 inside).jpeg({quality:85})` 写缓存；HEIC/RAW 复用 `sips` 回退。
- [ ] 路由返回 `image/jpeg`，`cache-control: private, max-age=86400`；缺失 404。
- [ ] 测试：生成后尺寸 ≤1600，二次请求命中缓存。

## Task 3：决策、详情、分组、统计 API

**Files:** Modify `plugin/src/host/service.js`, `plugin/src/host/http.js`; Test `plugin/test/http.test.js`

- [ ] 服务方法：`listReviewPhotos` / `photoDetail` / `setDecisions` / `stats` / `groupDetail`。
- [ ] 路由：`GET /photos?scope&verdict&sort&limit&offset`、`GET /photos/:pid`、`POST /decisions`、`GET /stats`、`GET /groups/:gid`。
- [ ] 测试：stub 服务下路由形状与 400（未知 verdict）。

## Task 4：导出（dry-run / 执行 / manifest / 源零写入）

**Files:** Create `plugin/src/host/export.js`; Test `plugin/test/export.test.js`

- [ ] `previewExport({ db, project, dest, buckets, mode })`：目标校验（绝对路径、不在源内、可写）、张数/字节、冲突、同盘判断、抽样。
- [ ] `runExport(...)`：按判定选片；`keep/`、`maybe/`、可选 `reject/`；保留相对目录结构（默认）或平铺；硬链接失败（EXDEV）回退复制；已存在且大小一致跳过；写 `manifest.csv` + `manifest.json`；导出前采样 20 个源文件校验 size/mtime/sha256 不变，变了抛 `SOURCE_MODIFIED`。
- [ ] 测试：400 张硬链接/复制计数与 manifest 一致；重跑跳过；源文件校验不变；拒绝导出到源目录。

## Task 5：导出 API + `photo_picker_export` 工具

**Files:** Modify `service.js`, `http.js`, `tools.js`; Test `plugin/test/http.test.js`, `plugin/test/tools.test.js`

- [ ] `POST /export/preview`、`POST /export/run`。
- [ ] 工具 `photo_picker_export`：`action=preview|run|status`，`project`、`dest`、`buckets`、`mode`；返回 JSON 字符串。
- [ ] 测试：preview 返回汇总；未知工具动作报错。

## Task 6：客户端复核工作台

**Files:** Modify `plugin/src/client/index.tsx`; 构建 `plugin/dist/client.js`

- [ ] 项目详情分两区：**阶段**（现有按钮/费用/检查点）+ **复核**（图墙/单图）。
- [ ] 图墙：筛选 chips（全部 / keep / maybe / reject / 未判定 / 解析失败）、排序（分数/时间/路径）、缩略图叠加分数与判定色带、多选、批量 keep/maybe/reject、撤销最近 20 步。
- [ ] 单图：1600px 预览、分数与六维条形、后期建议 chips、理由、EXIF 尺寸；`J/K` 前后、`P/X/M` 判定、`Space` 回图墙。
- [ ] 导出对话框：目标目录（手填/系统对话框）、分桶、模式、dry-run 汇总、执行、manifest 路径。
- [ ] 构建并语法检查；Chrome 验收。

## Task 7：验收

**Files:** Create `scripts/acceptance-phase4.mjs`

- [ ] 用现有 16 张真实项目数据 + 临时目标目录：预览断言 counts；执行导出 400 张夹具；manifest 与判定一致；源文件 size/mtime/sha256 不变；重跑跳过。
- [ ] `npm test` 全绿；`npm run acceptance:4` PASS。

## 计划完成定义

- 图墙/单图能看 AI 分数、理由、后期建议，能批量改判且刷新后保留；撤销可用。
- 导出 dry-run 与执行一致；keep/maybe 目录结构正确；manifest 齐全；源目录零写入。
- `photo_picker_export` 可在对话里完成 preview → run。
