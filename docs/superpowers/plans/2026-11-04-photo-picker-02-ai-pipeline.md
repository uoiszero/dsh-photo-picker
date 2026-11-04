# 照片工作台 · 计划 2：AI 批量流水线

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把预处理后的候选照片，通过「网格粗筛 → 组内排序 → 单张精评」收敛成 keep / maybe / reject，全程带预算、并发、重试、暂停与断点续跑，并在工作台面板里显示进度与费用。

**Architecture:** 新增 6 个 Host 模块（费用、LLM 一次性调用、提示词、解析、单图渲染、网格拼图）与 1 个编排模块（`pipeline.js`），后者按阶段读写 `photos / groups / grids / assessments / decisions / stage_runs`。Host 服务把 `grid / rank / score` 接进现有 `startStage`，通过 SSE 推送进度与费用，agent 工具复用同一入口。Client 面板增加阶段按钮、费用与检查点摘要。

**Tech Stack:** Node 22、`node:sqlite`、`sharp`（拼网格/单图）、`exifr`（已有）、`ctx.llm`（`stream()` + `usage` chunk）、`ctx.attachments.saveImage()`。

---

## 实现状态（2026-11-04）

- Task 1–8 已实现：费用、LLM 调用、提示词/解析、网格拼图、三阶段流水线、服务/HTTP/工具接入、面板费用与检查点。
- Task 9 已完成 mock LLM 端到端验收（`npm run acceptance:2`，120 夹具 → 5 格 → 选 10 → 排序淘汰 9 → 精评 1 张 keep，模拟总费用 ¥0.0108）。
- **真实模型小样已完成**（2026-11-04，本机照片文件夹随机 16 张（路径略；复制到 `/tmp/pp-real-sample`））：
  - 网格粗筛 1 次调用、1.08s、¥0.001184，16 张中选 12、落选 4；
  - 单张精评 12 次调用、3.2s、¥0.017848（12/12 成功，6×6.8 maybe、6×5.8 reject）；
  - 项目累计 ¥0.054512（预算 ¥1）；重跑精评 0 次调用、费用不变。
- 小样暴露并修复的三个真实问题：
  1. 默认 `reasoningEffort: high` 会把 `maxTokens: 256` 全耗在思维链上，正文为空（`finish: max-tokens`）→ 工具类调用统一传 `reasoningEffort: 'off'`；
  2. 模型会用中文键名或扁平六维返回评分 → 提示词补显式 JSON 结构，解析器兼容中英文键名与扁平维度；
  3. 评分失败被误标 `scored` 导致无法重试 → 失败标 `score_failed`，重试目标包含 `score_failed` 与「scored 但无评分记录」。
- 未在真实照片样本覆盖：组内排序（16 张无连拍组，0 次调用），由 mock 用例覆盖分块排序与 >12 张保留 2 张。

---

## 范围与依据

**依据文档：** [设计 spec](../specs/2026-11-04-photo-picker-workbench-design.md)（下称 spec）。本期覆盖 spec 的 8.3（网格粗筛）、8.4（组内排序 + 单张精评）、8.5（校准留到 Plan 4）、8.6（费用/并发/重试/预算/离峰）、8.7（AI 阶段断点续跑）、9.2 的数据接口、10.1 的 `run_stage` 扩展、15.2 的第 3–5 条。

**本期不做：** 网络源（SMB/NFS、断线恢复，顺延 Plan 3）、复核三视图交互与批量撤销（Plan 4）、导出与校准报告（Plan 4）。**原因**：网络源需要真实挂载环境才能验收，而 AI 流水线可以在本机用 mock LLM + 夹具完全验证，先把可验证的主链路跑通。

**对齐 Plan 1 的实现事实：**
- 预处理存活状态是 `ok`（不是 spec 里的 `candidate`）；本期把 `ok` 视为候选，不改状态机，避免回归 Plan 1 测试。
- `thumbs/<photoId>.webp` 已存在（384px），网格拼图直接用它，不再解码原图。
- `decisions.photo_id` 是主键，人类判定优先于 AI（spec 7.7）。
- 项目状态在 `getProjectDetail` 里每次重读，阶段可直接更新 `projects.status`。

---

## 已验证的 DSH 接口（2026-11-04）

```js
// 一次性调用：把本地图片变成附件引用，再随 user message 发送
const ref = await ctx.attachments.saveImage({ data: jpegBytes, mediaType: 'image/jpeg' })
for await (const chunk of ctx.llm.stream({
  provider: 'deepseek-official',
  model: 'deepseek-flash',
  system: '...',
  messages: [{ role: 'user', content: [{ type: 'text', text: '...' }, { type: 'image', attachment: ref }] }],
  temperature: 0,
  maxTokens: 256,
  signal,
})) {
  // chunk.type: 'text-delta' | 'usage' | 'finish' | ...
}
```

- `usage` chunk 是 `{ inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens? }`，计数互斥（cached 单独算）。
- `finish` 的 `reason.kind` 为 `stop` / `max-tokens` / `aborted` / `error`；`aborted`/`error` 带 `failure: { message, code, status?, providerRetryAfterMs? }`。
- 模型能力检查：`await ctx.llm.listModels('deepseek-official')` 返回条目含 `inputModalities`（`'text' | 'image'`）；不含 `image` 时禁止启动 AI 阶段并返回 `MODEL_NO_IMAGE_INPUT`。
- `ctx.attachments.saveImage` 输入 `{ data: Uint8Array, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }`。

---

## 文件结构

```
plugin/src/host/
├── cost.js          # 价格、usage→成本、流水线预估、高峰判断
├── llm.js           # completeText()：一次性调用 + 超时/重试/退避 + usage
├── prompts.js       # 网格粗筛 / 组内排序 / 单张精评 提示词 v1
├── parse.js         # 三种模型的返回解析与校验（含坏 JSON 兜底）
├── model-image.js   # 单图 1300px JPEG 渲染（供精评附件）
├── grid.js          # 分组感知打包、网格渲染（sharp + SVG 编号）、缓存 key
└── pipeline.js      # runGridStage / runRankStage / runScoreStage + mapLimit

plugin/test/
├── cost.test.js
├── llm.test.js
├── parse.test.js
├── grid.test.js
└── pipeline.test.js
```

---

## Task 1：费用模型与预估

**Files:** Create `plugin/src/host/cost.js`; Test `plugin/test/cost.test.js`

- [ ] **Step 1: 写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { costOfUsage, estimatePipeline, isPeakHour } from '../src/host/cost.js'

test('costOfUsage prices off-peak input/output/cache', () => {
  // 1M 输入 = 1 元；1M 输出 = 4 元；1M 缓存读 = 0.02 元
  assert.equal(costOfUsage({ inputTokens: 1_000_000, outputTokens: 0 }, { peak: false }), 1)
  assert.equal(costOfUsage({ inputTokens: 0, outputTokens: 1_000_000 }, { peak: false }), 4)
  assert.equal(costOfUsage({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }, { peak: false }), 0.02)
  assert.equal(costOfUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, { peak: true }), 10)
})

test('isPeakHour matches the weekday windows', () => {
  // 2026-11-04 是周三（Asia/Shanghai 由进程本地时区决定）
  assert.equal(isPeakHour(new Date(2026, 10, 4, 10, 0)), true)
  assert.equal(isPeakHour(new Date(2026, 10, 4, 13, 0)), false)
  assert.equal(isPeakHour(new Date(2026, 10, 4, 15, 0)), true)
  assert.equal(isPeakHour(new Date(2026, 10, 7, 10, 0)), false) // 周六
})

test('estimatePipeline scales with candidate and group counts', () => {
  const estimate = estimatePipeline({ candidates: 1600, rankGroups: 10, singlePhotos: 120 })
  // 网格 100 次、排序 10 次、精评 120 次
  assert.equal(estimate.calls.grid, 100)
  assert.equal(estimate.calls.rank, 10)
  assert.equal(estimate.calls.single, 120)
  assert.ok(estimate.costCny > 0)
  assert.ok(estimate.costPeakCny > estimate.costCny)
})
```

- [ ] **Step 2: 运行测试确认失败**：`node --test plugin/test/cost.test.js` → FAIL（模块不存在）

- [ ] **Step 3: 写实现**

```js
export const PRICES = { inputPerM: 1, outputPerM: 4, cacheReadPerM: 0.02 }
export const PEAK_MULTIPLIER = 2

export function isPeakHour(date) {
  const day = date.getDay() // 0 周日 … 6 周六
  if (day === 0 || day === 6) return false
  const hour = date.getHours() + date.getMinutes() / 60
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

export function costOfUsage(usage, { peak = false } = {}) {
  const input = (usage.inputTokens ?? 0) / 1e6 * PRICES.inputPerM
  const cacheRead = (usage.cacheReadTokens ?? 0) / 1e6 * PRICES.cacheReadPerM
  const cacheWrite = (usage.cacheWriteTokens ?? 0) / 1e6 * PRICES.inputPerM
  const output = (usage.outputTokens ?? 0) / 1e6 * PRICES.outputPerM
  const total = input + cacheRead + cacheWrite + output
  return peak ? total * PEAK_MULTIPLIER : total
}

export function estimatePipeline({ candidates, rankGroups = 0, singlePhotos = 0 }) {
  const calls = {
    grid: Math.ceil(candidates / 16),
    rank: rankGroups,
    single: singlePhotos,
  }
  const usage = {
    inputTokens: calls.grid * 1100 + calls.rank * 1300 + calls.single * 1100,
    outputTokens: calls.grid * 80 + calls.rank * 120 + calls.single * 200,
  }
  const costCny = costOfUsage(usage, { peak: false })
  return { calls, usage, costCny, costPeakCny: costOfUsage(usage, { peak: true }) }
}
```

- [ ] **Step 4: 运行测试确认通过** → PASS
- [ ] **Step 5: 提交** `git commit -m "feat: add AI cost model and pipeline estimate"`

---

## Task 2：LLM 一次性调用 + 重试

**Files:** Create `plugin/src/host/llm.js`; Test `plugin/test/llm.test.js`

- [ ] **Step 1: 写失败测试**（用 fake `llm.stream`，注入 `sleep`/`now`，不联网）

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { completeText } from '../src/host/llm.js'

function fakeLlm(script) {
  const calls = []
  return {
    calls,
    async *stream(options) {
      calls.push(options)
      const step = script.shift()
      if (step.failure !== undefined) {
        yield { type: 'finish', reason: { kind: 'error', failure: step.failure } }
        return
      }
      yield { type: 'text-delta', index: 0, text: step.text }
      yield { type: 'usage', usage: step.usage ?? { inputTokens: 10, outputTokens: 5 } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}

test('completeText collects text and usage', async () => {
  const llm = fakeLlm([{ text: '{"score":8}' }])
  const result = await completeText({ llm, provider: 'p', model: 'm', system: 's', prompt: 'u', sleep: async () => {} })
  assert.equal(result.text, '{"score":8}')
  assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 5 })
  assert.equal(llm.calls[0].messages[0].content[0].text, 'u')
})

test('completeText retries 5xx and succeeds', async () => {
  const sleeps = []
  const llm = fakeLlm([
    { failure: { message: 'upstream 502', code: 'HTTP_5XX', status: 502 } },
    { text: 'ok' },
  ])
  const result = await completeText({ llm, provider: 'p', model: 'm', prompt: 'u', sleep: async ms => { sleeps.push(ms) } })
  assert.equal(result.text, 'ok')
  assert.equal(result.attempts, 2)
  assert.deepEqual(sleeps, [1000])
})

test('completeText surfaces non-retryable failures with the provider code', async () => {
  const llm = fakeLlm([{ failure: { message: 'bad key', code: 'AUTH', status: 401 } }])
  await assert.rejects(
    completeText({ llm, provider: 'p', model: 'm', prompt: 'u', sleep: async () => {} }),
    error => error.code === 'AUTH' && error.retryable === false,
  )
})

test('completeText aborts on timeout', async () => {
  const llm = { stream() { return { [Symbol.asyncIterator]() { return { next: () => new Promise(() => {}) } } } } }
  await assert.rejects(
    completeText({ llm, provider: 'p', model: 'm', prompt: 'u', timeoutMs: 5, sleep: async () => {} }),
    error => error.code === 'LLM_TIMEOUT',
  )
})
```

- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**：`completeText({llm, provider, model, system, prompt, image?, temperature=0, maxTokens=256, timeoutMs=120_000, maxAttempts=3, sleep=realSleep, signal})`
  - 每次尝试用 `AbortController` 派生超时；合并外部 signal。
  - 收集 `text-delta`，记录 `usage`，检查 `finish.reason.kind`：`error`/`aborted` 抛 `LlmCallError`。
  - 可重试：`status === 429`、`status >= 500`、`code === 'LLM_TIMEOUT'`；退避 `1000 * 2^(attempt-1)`，有 `providerRetryAfterMs` 时优先。
  - 3 次仍失败抛最后一次错误，带 `attempts`。
  - 导出 `LlmCallError extends Error`（字段 `code`、`status`、`retryable`、`providerRetryAfterMs`）。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 3：提示词与解析

**Files:** Create `plugin/src/host/prompts.js`, `plugin/src/host/parse.js`; Test `plugin/test/parse.test.js`

- [ ] **Step 1: 写失败测试**：覆盖
  - `parseGridSelection('["A1","B2"]', ['A1','B2','C3'])` → `{ codes: ['A1','B2'], parsed: true }`
  - 带 markdown 围栏 / 前后解释文字 / 正则兜底 `选出 A1 和 C3` → `['A1','C3']`
  - 越界编号被丢弃；重复去重；空结果 `parsed:false`
  - `parseScore('```json\n{"score":8.2,"dimensions":{...},"verdict":"keep","post_processing":["crop_right","unknown_code"],"reason":"..."}\n```')` → 六维齐全、未知代码被剔除、reason 截断 120 字、score 夹到 0–10
  - `parseScore('not json')` 抛 `code === 'BAD_MODEL_JSON'`
  - `parseRank('{"order":["A","C","B"],"best":"A","reason":"x"}')` → 校验 best ∈ order
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**
  - `prompts.js` 导出 `PROMPT_VERSION = 'v1'`、`GRID_SYSTEM`、`gridUserPrompt({count, cols, rows, theme})`、`RANK_SYSTEM`、`rankUserPrompt()`, `SCORE_SYSTEM`、`scoreUserPrompt({theme})`，正文用 spec 18.2 的文案；主题追加一行对应题材提示（人像/风光/活动/混合）。
  - `parse.js`：`extractJson(text)`（去围栏、截取首个 `{`/`[` 到匹配结尾）；`parseGridSelection(text, validCodes)`；`parseRank(text, labels)`；`parseScore(text)`；`POST_PROCESSING_CODES`（spec 18.3 白名单）；`normalizeReason(text, max=120)`。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 4：单图渲染与网格拼图

**Files:** Create `plugin/src/host/model-image.js`, `plugin/src/host/grid.js`; Test `plugin/test/grid.test.js`

- [ ] **Step 1: 写失败测试**
  - `packCells(photos, {cols:4, rows:4})`：40 张分 3 格；同 `group_id` 连续且不被拆开；最后一格不足 16 张
  - `renderGrid({ cells, thumbs, tmpDir })`：输出 JPEG 且 `width===1280 && height===960`；`cellMap` 的键是 `A1..D4` 行优先；同一 `cacheKey` 第二次渲染返回 `cached: true`
  - `renderPhotoForModel(buffer)`：长边 ≤1300，返回 `{ data, mediaType: 'image/jpeg' }`
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**
  - `packCells()`：按 `(taken_at, rel_path)` 排序后，先按组聚合（组内保持时间序），组不跨格（组 > 16 时才拆），未分组单张填空；返回 `[{ seq, cells: [photo...] }]`。
  - `renderGrid()`：底图 1280×960 中性灰 `{r:128,g:128,b:128}`；每格 `sharp(thumb).resize(320,240,{fit:'contain',background:gray})` 合成到 (col*320,row*240)；SVG 叠加编号 `A1`…`D4`（白色描边黑字，`font-family` 用系统栈）+ 1px 分隔线；`jpeg({quality:90, chromaSubsampling:'4:4:4'})`；写入 `grids/<cacheKey>.jpg`，`cacheKey = sha1(JSON([photoIds, cellW, cellH, 'v1', 'q90']))`；返回 `{ path, cellMap, bytes, cached }`。
  - `renderPhotoForModel(buffer)`：`sharp(buffer).rotate().resize({width:1300,height:1300,fit:'inside',withoutEnlargement:true}).jpeg({quality:85})`。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 5：网格粗筛阶段

**Files:** Create `plugin/src/host/pipeline.js`（本任务先写 `runGridStage` 与 `mapLimit`）; Test `plugin/test/pipeline.test.js`

- [ ] **Step 1: 写失败测试**（mock LLM 返回 `["A1","B2"]` + 一条坏 JSON）
  - 两张选中照片 `state='grid_selected'`，其余 `grid_rejected` 且写入 `decisions(source='ai', verdict='reject')`
  - `grids` 表每格一行，`cell_map_json` 与照片一致，`tokens_in/out` 与 `cost_cny` 落库
  - 坏 JSON 网格：重试一次（追加「只返回 JSON 数组」），仍失败则该网格 `parse_failed`，格内照片全部 `grid_error` 且**没有** reject 决策
  - 预算触顶：`budgetCny` 很小时阶段 `paused`，`stage_runs.cursor` 非空，已花费 ≤ 预算 + 单次调用成本
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**
  - `mapLimit(items, limit, fn)`：并发池，异常原样抛出。
  - `runGridStage({ db, projectId, project, workspaceDir, llm, signal, onEvent, now })`：
    1. 候选 = `state='ok' AND thumb_path IS NOT NULL ORDER BY COALESCE(taken_at,mtime_ms), rel_path`。
    2. `packCells` → 每格渲染（先查 `grids` 同 `image_path` 是否已有选中结果，有则直接复用，实现幂等续跑）。
    3. 并发 `project.concurrency` 调 `completeText`，`cellMap` 转编号提示词；`parseGridSelection` 失败用 `GRID_RETRY_USER` 再试一次。
    4. 写 `grids`（status/selected_cells/tokens/cost）、`photos.state`、`decisions(source='ai')`；累计费用，达到预算 → `stage_runs.status='paused'`、`cursor=seq` 并返回 `{ paused: true }`。
    5. 每格完成发 `onEvent({ stage:'grid', done, total, costCny, seq })`。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 6：组内排序 + 单张精评

**Files:** Modify `plugin/src/host/pipeline.js`; Test `plugin/test/pipeline.test.js`（追加用例）

- [ ] **Step 1: 写失败测试**
  - `runRankStage`：构造一个 4 张入选的组，mock 返回 `{"order":["A","C","B","D"],"best":"A"}` → `assessments(target_kind='group', stage='rank')` 落库，A 保留，其余写 AI reject；>12 张入选保留前 2
  - `runScoreStage`：mock 返回不同 score；`score >= 7.5` → keep、`6.0–7.5` → maybe、其余 reject；坏 JSON 重试一次后记 `errors` 且默认 maybe；阈值从 `project.thresholdKeep/thresholdMaybe` 读取
  - 人工决策存在时不被 AI 覆盖
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**
  - `runRankStage`：目标 = 组内 `grid_selected` 数 ≥ 3 的组；每批 ≤ 6 张分块，先取每块第一再对块冠军排序；幂等键 `(group, rank, modelId, promptVersion)`。
  - `runScoreStage`：目标 = 排名胜者 + 入选数 <3 的组的全部入选 + 未分组入选 + `grid_error`；每张 `renderPhotoForModel`（源文件→JPEG）→ `attachments.saveImage` → `completeText`；`parseScore` 失败重试一次，再失败写 `errors` + `decisions(ai, maybe)`。
  - 两个阶段都复用预算/暂停/游标逻辑。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 7：服务、HTTP、SSE 与工具接入

**Files:** Modify `plugin/src/host/service.js`, `plugin/src/host/http.js`, `plugin/src/host/tools.js`; Test `plugin/test/http.test.js`（追加）

- [ ] **Step 1: 写失败测试**（stub service）
  - `POST /photo-picker/api/projects/:id/actions {action:'start', stage:'grid'}` → 调用 `startStage(id,'grid',{action:'start'})`
  - `GET /photo-picker/api/projects/:id/checkpoints` → `service.checkpoints(id)`
  - 未知 stage → 400 + `error.code === 'BAD_STAGE'`
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 写实现**
  - `service.startStage(id, stage, { action })`：支持 `scan/preprocess/grid/rank/score`；AI 阶段启动前检查 `ctx.llm.listModels(project.modelRoute)` 含 `image`，否则抛 `MODEL_NO_IMAGE_INPUT`。
  - 运行态 `Map<projectId, { stage, controller }>`；`pause` → `controller.abort()`；`resume` → 从游标重跑同一阶段；`cancel` → abort + `cancelled`。
  - `getProjectDetail` 增加 `cost: { spentCny }` 与 `ai: { hasImageModel, lastError }`。
  - `checkpoints(id)`：从 `stage_runs` 取最近每阶段一条，附抽样照片（每阶段最多 24 个 id）。
  - `tools.js` 的 `stage` 枚举扩展；`photo_picker` 增加 `action:'run_stage'` 的 pause/resume 支持。
- [ ] **Step 4: 运行测试确认通过**
- [ ] **Step 5: 提交**

---

## Task 8：面板进度、费用与检查点

**Files:** Modify `plugin/src/client/index.tsx`; 构建 `plugin/dist/client.js`

- [ ] **Step 1: 实现**
  - 项目详情顶部：`已花费 ¥x / 预算 ¥y`、当前阶段进度条（来自 SSE `costCny`/`done`/`total`）、`grid/rank/score` 三个按钮。
  - 阶段完成时刷新，显示每阶段检查点卡片：阶段名、状态、统计、费用、抽样缩略图（最多 8 张）。
  - 无图片模型时禁用 AI 按钮并显示提示。
- [ ] **Step 2: 构建并检查**：`npm run build:client && node --check plugin/dist/client.js`
- [ ] **Step 3: 在 Chrome 里验收**：点侧栏「照片工作台」→ 项目 → 跑 `grid`（mock 或真实照片样本）→ 看到进度、费用与检查点。
- [ ] **Step 4: 提交**

---

## Task 9：验收

**Files:** Modify `scripts/acceptance-phase1.mjs`（改名/复制为 `scripts/acceptance-phase2.mjs`）

- [ ] **Step 1: mock LLM 端到端**：`scripts/acceptance-phase2.mjs` 用 fake llm 跑 120 张夹具 → 断言 grid 调用 8 次、选中数 >0、rank/score 决策齐全、`spentCny > 0`。
- [ ] **Step 2: 真实照片样本**（可选，需要用户确认费用）：用 16 张真实照片跑一次网格粗筛，检查返回是否合理、费用是否 < ¥0.01。
- [ ] **Step 3: 全量**：`npm test && npm run acceptance:1 && npm run acceptance:2`
- [ ] **Step 4: 提交** `test: add phase 2 AI pipeline acceptance`

---

## 计划 2 完成定义

- `photo_picker` 的 `run_stage` 支持 `grid / rank / score`，面板能启动、暂停、看进度与费用。
- 网格粗筛：每格恰好 1 次调用；解析失败的照片进入复核队列（`grid_error`），不消失；预算触顶在 ≤ 预算 + 一次调用处暂停。
- 精评：坏 JSON 自动重试；人工判定不被 AI 覆盖。
- 断点续跑：已完成的网格/照片跳过，不重复计费。
- `npm test` 全绿；`npm run acceptance:2` 输出 PASS。

## 后续里程碑

- **计划 3（网络源）**：SMB/NFS 连接、挂载轮询、健康检查、断线暂停/续跑、建项目前校验与传输预估。
- **计划 4（复核与交付）**：图墙/单图/组对比、批量与撤销、检查点交互、导出（硬链接/manifest/dry-run）、校准报告、`photo_picker_review` / `photo_picker_export`。
