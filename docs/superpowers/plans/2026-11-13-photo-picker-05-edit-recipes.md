# 可移植修图配方（Plan 5）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让单张精评在现有 `keep / maybe / reject` 之外，再输出一份**结构化、可验证、与软件无关**的修图配方；插件用内置 sharp 引擎预览并导出修好的 JPEG 副本，源文件永远只读。

**Architecture:** 模型在 `score` 阶段额外返回 `edit_recipe`（裁剪、旋转、曝光、对比、饱和度、锐化）。Host 把配方校验后存进 `assessments.recipe_json`；新增 `recipe.js`（纯函数）和 `edit.js`（sharp 渲染 + 缓存）；单图页通过新的媒体路由预览，导出对话框可选“应用修图建议”，输出到独立 bucket 并写进 manifest。

**Tech Stack:** `node:sqlite`、`sharp`、`node:fs`、`node:test`、React/TSX。

---

## 范围与非目标

**本计划实现：**

- 配方 schema v1：`crop`、`rotate`、`exposureEv`、`contrast`、`saturation`、`sharpen`。
- 模型 `score` 提示词 v2，解析失败或没有配方时保持原有评分行为。
- `assessments.recipe_json` 持久化与旧库迁移。
- sharp 渲染器：自动方向 → 旋转 → 裁剪 → 曝光/对比/饱和/锐化 → JPEG。
- 单图页“查看修图效果”预览。
- 导出可选 `edit: 'recipe'`，生成 JPEG 副本，manifest 记录配方与引擎。
- 单元测试、验收脚本、CI、文档。

**本计划不做：**

- 不做 Photoshop `.atn`（没有 PS 环境，格式闭源且不可 CI 验证）。
- 不做 RawTherapee `.pp3`、darktable XMP、GIMP 脚本适配器；它们是后续 Plan 6 的可选后端。
- 不做 RAW 显影、局部蒙版、污点修复、生成式填充。
- 不覆盖人工编辑后的像素；只从源图重新渲染。
- HEIC/RAW 走现有 `decodeToJpeg` 平台回退，v1 的编辑副本最长边为 1200px，不保留原始分辨率；需要 RAW 显影余量时后续接 RawTherapee。

**兼容性：**

- 旧项目已有 `prompt_version='v1'` 的 assessments，没有 `recipe_json`，单图页显示“无结构化修图建议”。
- 新的评分使用提示词 v2；用户对旧项目重跑单张精评才会生成配方，并产生新的模型调用费用。
- `edit:'recipe'` 只是新增导出选项，默认 `none` 完全保持现有行为。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `plugin/src/host/recipe.js` | 新建。配方校验、裁剪像素换算、签名、恒等判断 |
| `plugin/src/host/edit.js` | 新建。sharp 渲染、缓存、JPEG 输出 |
| `plugin/src/host/db.js` | 修改。`assessments.recipe_json` 列 + 旧库迁移 |
| `plugin/src/host/prompts.js` | 修改。提示词 v2，要求输出 `edit_recipe` |
| `plugin/src/host/parse.js` | 修改。解析并校验 `edit_recipe` |
| `plugin/src/host/pipeline.js` | 修改。把 recipe 写进 assessment |
| `plugin/src/host/review.js` | 修改。详情返回 `editRecipe` |
| `plugin/src/host/export.js` | 修改。`edit: 'recipe'` 导出 JPEG、manifest 字段 |
| `plugin/src/host/service.js` | 修改。`editedFile()` 与导出参数透传 |
| `plugin/src/host/http.js` | 修改。`/media/edit/:project/:photo` 路由 |
| `plugin/src/host/tools.js` | 修改。`photo_picker_export` 增加 `edit` |
| `plugin/src/client/index.tsx` | 修改。单图配方卡片 + 导出开关 |
| `plugin/src/client/locales.js` | 修改。中英词条 |
| `plugin/test/recipe.test.js` | 新建 |
| `plugin/test/edit.test.js` | 新建 |
| `plugin/test/*.test.js` | 修改相关断言 |
| `scripts/acceptance-phase5.mjs` | 新建 |
| `package.json` / `.github/workflows/*.yml` | 修改。新增 acceptance:5 |
| `README.md` / `AGENTS.md` / spec | 修改。路线图与 schema 说明 |

---

## Task 1：配方纯函数

**Files:**
- Create: `plugin/src/host/recipe.js`
- Test: `plugin/test/recipe.test.js`

- [ ] **Step 1：先写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cropPixels, isIdentityRecipe, normalizeRecipe, recipeSignature,
} from '../src/host/recipe.js'

test('normalizeRecipe returns null for missing or identity recipes', () => {
  assert.equal(normalizeRecipe(undefined), null)
  assert.equal(normalizeRecipe({}), null)
  assert.equal(normalizeRecipe({
    version: 1,
    crop: { left: 0, top: 0, width: 1, height: 1 },
    rotate: 0, exposureEv: 0, contrast: 0, saturation: 0, sharpen: 0,
  }), null)
})

test('normalizeRecipe clamps values and accepts cropped recipes', () => {
  const recipe = normalizeRecipe({
    version: 1,
    crop: { left: -1, top: 0.98, width: 2, height: 0.4 },
    rotate: 99, exposureEv: -9, contrast: 3, saturation: -3, sharpen: 9,
  })
  assert.ok(recipe)
  assert.equal(recipe.crop.left, 0)
  assert.equal(recipe.crop.top, 0.98)
  assert.equal(recipe.crop.width, 0.02)
  assert.equal(recipe.crop.height, 0.02)
  assert.equal(recipe.rotate, 5)
  assert.equal(recipe.exposureEv, -2)
  assert.equal(recipe.contrast, 1)
  assert.equal(recipe.saturation, -1)
  assert.equal(recipe.sharpen, 2)
})

test('normalizeRecipe accepts Chinese aliases used by the model', () => {
  const recipe = normalizeRecipe({
    裁剪: { 左: 0.1, 上: 0.1, 宽: 0.8, 高: 0.8 },
    旋转: 1.5,
    曝光: 0.3,
    对比度: 0.1,
    饱和度: 0.1,
    锐化: 0.2,
  })
  assert.ok(recipe)
  assert.equal(recipe.crop.left, 0.1)
  assert.equal(recipe.rotate, 1.5)
  assert.equal(recipe.exposureEv, 0.3)
})

test('cropPixels converts normalized crop to pixels', () => {
  const recipe = normalizeRecipe({
    crop: { left: 0.25, top: 0.1, width: 0.5, height: 0.8 },
  })
  assert.deepEqual(cropPixels(recipe, 1600, 1000), { left: 400, top: 100, width: 800, height: 800 })
  assert.deepEqual(cropPixels(recipe, 10, 10), { left: 3, top: 1, width: 5, height: 8 })
})

test('recipeSignature is stable across key order', () => {
  const a = normalizeRecipe({ crop: { left: 0.1, top: 0.2, width: 0.6, height: 0.7 }, exposureEv: 0.2 })
  const b = normalizeRecipe({ exposureEv: 0.2, crop: { height: 0.7, width: 0.6, top: 0.2, left: 0.1 } })
  assert.equal(recipeSignature(a), recipeSignature(b))
  assert.equal(recipeSignature(a).length, 12)
})

test('isIdentityRecipe is true for the default recipe', () => {
  assert.equal(isIdentityRecipe({ crop: { left: 0, top: 0, width: 1, height: 1 }, rotate: 0, exposureEv: 0, contrast: 0, saturation: 0, sharpen: 0 }), true)
})
```

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/recipe.test.js`
Expected: FAIL with `Cannot find module '../src/host/recipe.js'`.

- [ ] **Step 3：实现 recipe.js**

```js
import { createHash } from 'node:crypto'

export const RECIPE_VERSION = 1
export const RECIPE_ENGINE = 'sharp-v1'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const number = value => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
const round4 = value => Math.round(value * 10_000) / 10_000
const read = (object, ...keys) => {
  if (object === null || typeof object !== 'object') return undefined
  for (const key of keys) {
    if (object[key] !== undefined) return object[key]
  }
  return undefined
}

export function isIdentityRecipe(recipe) {
  if (recipe === null || recipe === undefined) return true
  const crop = recipe.crop ?? { left: 0, top: 0, width: 1, height: 1 }
  return Math.abs(crop.left) < 1e-6
    && Math.abs(crop.top) < 1e-6
    && Math.abs(crop.width - 1) < 1e-6
    && Math.abs(crop.height - 1) < 1e-6
    && Math.abs(recipe.rotate ?? 0) < 1e-6
    && Math.abs(recipe.exposureEv ?? 0) < 1e-6
    && Math.abs(recipe.contrast ?? 0) < 1e-6
    && Math.abs(recipe.saturation ?? 0) < 1e-6
    && Math.abs(recipe.sharpen ?? 0) < 1e-6
}

/** 缺失/恒等/坏数据返回 null；合法配方返回规范化对象。 */
export function normalizeRecipe(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null
  const version = number(input.version) ?? RECIPE_VERSION
  if (version !== RECIPE_VERSION) return null

  const cropRaw = read(input, 'crop', '裁剪') ?? {}
  const left = clamp(number(read(cropRaw, 'left', 'x', '左')) ?? 0, 0, 0.95)
  const top = clamp(number(read(cropRaw, 'top', 'y', '上')) ?? 0, 0, 0.95)
  const width = clamp(number(read(cropRaw, 'width', 'w', '宽')) ?? 1, 0.05, 1 - left)
  const height = clamp(number(read(cropRaw, 'height', 'h', '高')) ?? 1, 0.05, 1 - top)
  const crop = {
    left: round4(left),
    top: round4(top),
    width: round4(width),
    height: round4(height),
  }

  const recipe = {
    version: RECIPE_VERSION,
    crop,
    rotate: round4(clamp(number(read(input, 'rotate', '旋转')) ?? 0, -5, 5)),
    exposureEv: round4(clamp(number(read(input, 'exposureEv', 'exposure', '曝光')) ?? 0, -2, 2)),
    contrast: round4(clamp(number(read(input, 'contrast', '对比度')) ?? 0, -1, 1)),
    saturation: round4(clamp(number(read(input, 'saturation', '饱和度')) ?? 0, -1, 1)),
    sharpen: round4(clamp(number(read(input, 'sharpen', 'sharpening', '锐化')) ?? 0, 0, 2)),
  }
  return isIdentityRecipe(recipe) ? null : recipe
}

/** 裁剪坐标按“旋转后的画布”归一化。 */
export function cropPixels(recipe, width, height) {
  const crop = recipe?.crop ?? { left: 0, top: 0, width: 1, height: 1 }
  const left = Math.min(width - 1, Math.max(0, Math.round(crop.left * width)))
  const top = Math.min(height - 1, Math.max(0, Math.round(crop.top * height)))
  return {
    left,
    top,
    width: Math.max(1, Math.min(width - left, Math.round(crop.width * width))),
    height: Math.max(1, Math.min(height - top, Math.round(crop.height * height))),
  }
}

export function recipeSignature(recipe) {
  const canonical = JSON.stringify([
    RECIPE_ENGINE,
    recipe.version,
    recipe.crop.left, recipe.crop.top, recipe.crop.width, recipe.crop.height,
    recipe.rotate, recipe.exposureEv, recipe.contrast, recipe.saturation, recipe.sharpen,
  ])
  return createHash('sha256').update(canonical).digest('hex').slice(0, 12)
}
```

- [ ] **Step 4：运行测试**

Run: `node --test plugin/test/recipe.test.js`
Expected: PASS.

- [ ] **Step 5：提交**

```bash
git add plugin/src/host/recipe.js plugin/test/recipe.test.js
git commit -m "feat: add edit recipe normalization"
```

---

## Task 2：sharp 渲染器与缓存

**Files:**
- Create: `plugin/src/host/edit.js`
- Test: `plugin/test/edit.test.js`

- [ ] **Step 1：先写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { normalizeRecipe } from '../src/host/recipe.js'
import { renderEditedBuffer, renderEditedFile } from '../src/host/edit.js'

test('renderEditedBuffer crops and encodes JPEG', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-edit-'))
  const source = path.join(dir, 'source.jpg')
  await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#336699' } }).jpeg().toFile(source)
  const recipe = normalizeRecipe({ crop: { left: 0.25, top: 0.1, width: 0.5, height: 0.8 } })
  const output = await renderEditedBuffer({ sourcePath: source, recipe })
  const meta = await sharp(output).metadata()
  assert.equal(meta.format, 'jpeg')
  assert.equal(meta.width, 800)
  assert.equal(meta.height, 800)
  rmSync(dir, { recursive: true, force: true })
})

test('renderEditedFile caches by recipe signature and leaves source untouched', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-edit-'))
  const source = path.join(dir, 'source.jpg')
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#8899aa' } }).jpeg().toFile(source)
  const before = statSync(source)
  const recipe = normalizeRecipe({ exposureEv: 0.5, saturation: 0.1 })
  const cache = path.join(dir, 'edits', 'photo.jpg')
  const first = await renderEditedFile({ sourcePath: source, recipe, cachePath: cache })
  const second = await renderEditedFile({ sourcePath: source, recipe, cachePath: cache })
  assert.equal(first.cached, false)
  assert.equal(second.cached, true)
  assert.equal(statSync(source).mtimeMs, before.mtimeMs)
  assert.equal(statSync(source).size, before.size)
  rmSync(dir, { recursive: true, force: true })
})
```

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/edit.test.js`
Expected: FAIL with missing module.

- [ ] **Step 3：实现 edit.js**

```js
import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import sharp from 'sharp'
import { decodeToJpeg } from './images.js'
import { RECIPE_ENGINE, cropPixels } from './recipe.js'

export { RECIPE_ENGINE as EDIT_ENGINE }

async function readableInput(sourcePath) {
  try {
    await sharp(sourcePath).metadata()
    return sourcePath
  } catch {
    // HEIC/RAW 等 sharp 读不了的格式，交给平台层转成 1200px JPEG。
    return decodeToJpeg(sourcePath)
  }
}

export async function renderEditedBuffer({ sourcePath, recipe }) {
  if (recipe === null || recipe === undefined) {
    const error = new Error('edit recipe is required')
    error.code = 'BAD_RECIPE'
    throw error
  }

  const input = await readableInput(sourcePath)
  let rotated = sharp(input).autoOrient()
  if (Math.abs(recipe.rotate) > 1e-6) {
    rotated = rotated.rotate(recipe.rotate, { background: { r: 0, g: 0, b: 0, alpha: 1 } })
  }
  const stage = await rotated.toBuffer({ resolveWithObject: true })
  const crop = cropPixels(recipe, stage.info.width, stage.info.height)

  let output = sharp(stage.data).extract(crop)
  if (Math.abs(recipe.exposureEv) > 1e-6) {
    output = output.linear(2 ** recipe.exposureEv, 0)
  }
  if (Math.abs(recipe.contrast) > 1e-6) {
    output = output.linear(1 + recipe.contrast, -128 * recipe.contrast)
  }
  if (Math.abs(recipe.saturation) > 1e-6) {
    output = output.modulate({ saturation: Math.max(0, 1 + recipe.saturation) })
  }
  if (recipe.sharpen > 0.01) {
    output = output.sharpen({ sigma: 0.5 + recipe.sharpen })
  }
  return output.jpeg({ quality: 92 }).toBuffer()
}

export async function renderEditedFile({ sourcePath, recipe, cachePath }) {
  try {
    await access(cachePath)
    return { path: cachePath, cached: true }
  } catch {
    // cache miss
  }
  const buffer = await renderEditedBuffer({ sourcePath, recipe })
  await mkdir(path.dirname(cachePath), { recursive: true })
  const temporary = `${cachePath}.${process.pid}.${nanoid(6)}.tmp`
  try {
    await writeFile(temporary, buffer)
    await rename(temporary, cachePath)
  } finally {
    await rm(temporary, { force: true })
  }
  return { path: cachePath, cached: false }
}
```

- [ ] **Step 4：运行测试**

Run: `node --test plugin/test/edit.test.js`
Expected: PASS. If `statSync(source).mtimeMs` differs, the renderer is writing to the wrong path; debug before continuing.

- [ ] **Step 5：提交**

```bash
git add plugin/src/host/edit.js plugin/test/edit.test.js
git commit -m "feat: render edit recipes with sharp"
```

---

## Task 3：数据库列与迁移

**Files:**
- Modify: `plugin/src/host/db.js`
- Modify: `plugin/test/db.test.js`

- [ ] **Step 1：先写失败测试**

在 `plugin/test/db.test.js` 追加：

```js
import { DatabaseSync } from 'node:sqlite'
import { ensureAssessmentRecipeColumn } from '../src/host/db.js'

test('openDb migrates an assessments table without recipe_json', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-db-migrate-'))
  const database = new DatabaseSync(path.join(dir, 'old.sqlite'))
  database.exec('CREATE TABLE assessments (id TEXT PRIMARY KEY)')
  ensureAssessmentRecipeColumn(database)
  const columns = database.prepare('PRAGMA table_info(assessments)').all().map(row => row.name)
  assert.ok(columns.includes('recipe_json'))
  database.close()
  rmSync(dir, { recursive: true, force: true })
})
```

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/db.test.js`
Expected: FAIL with missing export.

- [ ] **Step 3：修改 db.js**

在 `assessments` 的 `CREATE TABLE` 中加一列：

```sql
  post_processing_json TEXT,
  recipe_json TEXT,
```

在 `openDb` 之前加：

```js
/** 旧项目库没有 recipe_json；CREATE TABLE IF NOT EXISTS 不会补列，必须显式迁移。 */
export function ensureAssessmentRecipeColumn(db) {
  const columns = db.prepare('PRAGMA table_info(assessments)').all().map(row => row.name)
  if (!columns.includes('recipe_json')) {
    db.exec('ALTER TABLE assessments ADD COLUMN recipe_json TEXT')
  }
}
```

在 `openDb` 里 `db.exec(SCHEMA)` 之后、返回之前调用：

```js
  ensureAssessmentRecipeColumn(db)
```

- [ ] **Step 4：运行测试**

Run: `node --test plugin/test/db.test.js`
Expected: PASS，且原有 schema 测试也通过。

- [ ] **Step 5：提交**

```bash
git add plugin/src/host/db.js plugin/test/db.test.js
git commit -m "feat: persist edit recipes in assessments"
```

---

## Task 4：提示词 v2 与解析

**Files:**
- Modify: `plugin/src/host/prompts.js`
- Modify: `plugin/src/host/parse.js`
- Modify: `plugin/test/parse.test.js`
- Modify: `plugin/test/pipeline.test.js`（如果断言了提示词版本或调用次数）

- [ ] **Step 1：先写失败测试**

在 `plugin/test/parse.test.js` 追加：

```js
test('parseScore accepts an optional edit_recipe', () => {
  const parsed = parseScore(JSON.stringify({
    score: 8.2,
    dimensions: { composition: 8, light: 7, color: 8, technique: 9, post_potential: 8, moment: 7 },
    verdict: 'keep',
    post_processing: ['crop_right', 'exposure_+0.3'],
    edit_recipe: {
      version: 1,
      crop: { left: 0.1, top: 0.05, width: 0.8, height: 0.9 },
      rotate: 1.2,
      exposureEv: 0.3,
      contrast: 0.1,
      saturation: 0.05,
      sharpen: 0.2,
    },
    reason: '主体清晰',
  }))
  assert.equal(parsed.recipe.crop.left, 0.1)
  assert.equal(parsed.recipe.rotate, 1.2)
})

test('parseScore ignores an invalid edit_recipe without failing the score', () => {
  const parsed = parseScore(JSON.stringify({
    score: 7,
    dimensions: { composition: 7, light: 7, color: 7, technique: 7, post_potential: 7, moment: 7 },
    verdict: 'maybe',
    edit_recipe: { version: 99, crop: 'bad' },
  }))
  assert.equal(parsed.recipe, null)
  assert.equal(parsed.verdict, 'maybe')
})
```

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/parse.test.js`
Expected: FAIL because `recipe` is undefined.

- [ ] **Step 3：修改 prompts.js**

把 `PROMPT_VERSION` 改为 `v2`：

```js
export const PROMPT_VERSION = 'v2'
```

在 `scoreUserPrompt` 的 JSON 示例中增加 `edit_recipe`，并把说明改成：

```js
    '如果确实有可执行的后期建议，再额外给出 edit_recipe（与软件无关的参数）：',
    '{"crop":{"left":0,"top":0,"width":1,"height":1},"rotate":0,',
    '"exposureEv":0,"contrast":0,"saturation":0,"sharpen":0}。',
    'crop 是 0–1 的归一化坐标，按“先旋转校正后的画布”计算；rotate 单位是度（-5–5）；',
    'exposureEv 是曝光补偿（-2–2）；contrast/saturation 是 -1–1；sharpen 是 0–2。',
    '没有明确可执行的调整时，省略 edit_recipe 或返回全 0/全画布。',
```

完整示例保留原有字段，并追加：

```json
"edit_recipe":{"crop":{"left":0.04,"top":0.02,"width":0.9,"height":0.94},"rotate":0.8,"exposureEv":0.2,"contrast":0.08,"saturation":0.04,"sharpen":0.2}
```

- [ ] **Step 4：修改 parse.js**

顶部导入：

```js
import { normalizeRecipe } from './recipe.js'
```

`parseScore` 返回对象里加：

```js
    editRecipe: normalizeRecipe(
      pickObject(value.edit_recipe, value.editRecipe, value['修图配方'], value['修图建议参数']),
    ),
```

同时实现 `pickObject`：

```js
function pickObject(...values) {
  return values.find(value => value !== null && typeof value === 'object' && !Array.isArray(value))
}
```

（如果 `parse.js` 已有类似 helper，直接复用，不要重复定义。）

- [ ] **Step 5：运行测试**

Run: `node --test plugin/test/parse.test.js && npm test`
Expected: PASS。若旧测试断言 `PROMPT_VERSION === 'v1'`，把它改为 `v2`，DB 中手工插入的测试 fixture 可以继续使用 `v1`，它们只验证读取兼容性。

- [ ] **Step 6：提交**

```bash
git add plugin/src/host/prompts.js plugin/src/host/parse.js plugin/test/parse.test.js plugin/test/pipeline.test.js
git commit -m "feat: ask the model for portable edit recipes"
```

---

## Task 5：流水线持久化与复核返回

**Files:**
- Modify: `plugin/src/host/pipeline.js`
- Modify: `plugin/src/host/review.js`
- Modify: `plugin/test/pipeline.test.js`
- Modify: `plugin/test/review.test.js`

- [ ] **Step 1：先写失败测试**

在 `plugin/test/pipeline.test.js` 的评分测试假返回里加：

```js
edit_recipe: {
  version: 1,
  crop: { left: 0.1, top: 0.1, width: 0.8, height: 0.8 },
  rotate: 0,
  exposureEv: 0.2,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
},
```

断言：

```js
const row = db.prepare("SELECT recipe_json FROM assessments WHERE stage = 'single' LIMIT 1").get()
assert.ok(row.recipe_json)
assert.equal(JSON.parse(row.recipe_json).crop.left, 0.1)
```

在 `plugin/test/review.test.js` 的 photo detail 断言中加：

```js
assert.ok(detail.editRecipe)
assert.equal(detail.editRecipe.crop.left, 0.1)
```

再加一条“v1/v2 同时存在时取最新”的回归测试：

```js
test('getPhotoDetail uses the latest single assessment', () => {
  const insert = (id, promptVersion, createdAt, recipe, score) => db.prepare(`
    INSERT INTO assessments (id, project_id, target_kind, target_id, stage,
      prompt_version, score, verdict, recipe_json, created_at)
    VALUES (?, 'p1', 'photo', 'm1', 'single', ?, ?, 'maybe', ?, ?)
  `).run(id, promptVersion, score, recipe === null ? null : JSON.stringify(recipe), createdAt)
  insert('a-v1', 'v1', 1, null, 6)
  insert('a-v2', 'v2', 2, { crop: { left: 0.2, top: 0, width: 0.5, height: 1 } }, 8)
  const detail = getPhotoDetail(db, 'p1', 'm1')
  assert.equal(detail.score, 8)
  assert.equal(detail.editRecipe.crop.left, 0.2)
})
```

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/pipeline.test.js plugin/test/review.test.js`
Expected: FAIL：`recipe_json` 没有写入，`editRecipe` 不存在。

- [ ] **Step 3：修改 pipeline.js**

`insertAssessment` 参数列表加 `recipe`，SQL 加列：

```js
function insertAssessment(db, projectId, {
  targetKind, targetId, stage, modelId, modelRoute, score, verdict,
  dimensions, postProcessing, recipe, reason, raw, tokensIn, tokensOut, costCny,
}) {
```

```sql
    prompt_version, score, verdict, dimensions_json, post_processing_json, recipe_json,
    reason, raw_json,
```

```js
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

```js
    postProcessing === undefined ? null : JSON.stringify(postProcessing),
    recipe === undefined || recipe === null ? null : JSON.stringify(recipe),
```

在 `runScoreStage` 的 assessment 写入里加：

```js
        recipe: result.editRecipe,
```

- [ ] **Step 4：修改 review.js**

`BASE_FROM` 改成“最新一条单张 assessment”，避免 v1/v2 同时存在时产生重复行：

```js
const BASE_FROM = `
  FROM photos p
  LEFT JOIN decisions d ON d.photo_id = p.id AND d.source = 'human'
  LEFT JOIN decisions ai_d ON ai_d.photo_id = p.id AND ai_d.source = 'ai'
  LEFT JOIN assessments a ON a.id = (
    SELECT id FROM assessments latest
    WHERE latest.target_id = p.id
      AND latest.target_kind = 'photo'
      AND latest.stage = 'single'
    ORDER BY latest.created_at DESC, latest.id DESC
    LIMIT 1
  )
  WHERE p.project_id = ? AND p.thumb_path IS NOT NULL
`
```

`getPhotoDetail` 的 SELECT 加：

```sql
           a.recipe_json,
```

`toReviewPhoto` 加：

```js
    editRecipe: parseJson(row.recipe_json),
```

- [ ] **Step 5：运行测试**

Run: `node --test plugin/test/pipeline.test.js plugin/test/review.test.js && npm test`
Expected: PASS。

- [ ] **Step 6：提交**

```bash
git add plugin/src/host/pipeline.js plugin/src/host/review.js plugin/test/pipeline.test.js plugin/test/review.test.js
git commit -m "feat: store and return edit recipes"
```

---

## Task 6：单图修图预览路由

**Files:**
- Modify: `plugin/src/host/service.js`
- Modify: `plugin/src/host/http.js`
- Modify: `plugin/test/http.test.js`

- [ ] **Step 1：先写失败测试**

在 `plugin/test/http.test.js` 的假 service 里加：

```js
async editedFile() { return '/tmp/edited.jpg' }
```

新增路由测试：请求 `/photo-picker/media/edit/p1/m1`，断言 `creator` 被调用、状态 200、`content-type` 为 `image/jpeg`。如果测试 fixture 没有真实文件，可在临时目录写一个 1×1 JPEG；参考现有 thumb 测试的假文件方式。

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/http.test.js`
Expected: FAIL with 404.

- [ ] **Step 3：service.js 增加 editedFile**

导入：

```js
import { renderEditedFile } from './edit.js'
import { normalizeRecipe, recipeSignature } from './recipe.js'
```

新增方法：

```js
  async editedFile(id, photoId) {
    const { db } = await this.store.open(id)
    const row = db.prepare(`
      SELECT p.rel_path, a.recipe_json
      FROM photos p
      LEFT JOIN assessments a ON a.target_id = p.id
        AND a.target_kind = 'photo' AND a.stage = 'single'
      WHERE p.id = ? AND p.project_id = ?
      ORDER BY a.created_at DESC LIMIT 1
    `).get(photoId, id)
    if (row === undefined || row.recipe_json === null) return undefined
    let raw
    try { raw = JSON.parse(row.recipe_json) } catch { return undefined }
    const recipe = normalizeRecipe(raw)
    if (recipe === null) return undefined
    const { project } = await this.store.open(id)
    const sourcePath = fromPortablePath(project.sourcePath, row.rel_path)
    const cachePath = path.join(
      project.workspaceDir, 'edits',
      `${photoId}-${recipeSignature(recipe)}.jpg`,
    )
    try {
      const rendered = await renderEditedFile({ sourcePath, recipe, cachePath })
      return rendered.path
    } catch {
      return undefined
    }
  }
```

- [ ] **Step 4：http.js 增加媒体路由**

在 preview/thumb 路由旁边加：

```js
      const editMatch = pathname.match(/^\/photo-picker\/media\/edit\/([^/]+)\/([^/]+)$/)
      if (editMatch !== null) {
        const file = await service.editedFile(editMatch[1], editMatch[2])
        if (file === undefined) {
          return send(res, 404, { error: { code: 'NOT_FOUND', message: 'edited preview not found' } })
        }
        res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=3600' })
        createReadStream(file).pipe(res)
        return
      }
```

- [ ] **Step 5：运行测试**

Run: `node --test plugin/test/http.test.js && npm test`
Expected: PASS。

- [ ] **Step 6：提交**

```bash
git add plugin/src/host/service.js plugin/src/host/http.js plugin/test/http.test.js
git commit -m "feat: serve edited photo previews"
```

---

## Task 7：导出修图副本

**Files:**
- Modify: `plugin/src/host/export.js`
- Modify: `plugin/test/export.test.js`

- [ ] **Step 1：先写失败测试**

在 `plugin/test/export.test.js` 新增：

```js
test('runExport applies recipes as JPEG copies and records the edit in the manifest', async () => {
  const { base, source, dest, db } = setup()
  db.prepare(`UPDATE assessments SET recipe_json = ? WHERE id = 'aa'`).run(JSON.stringify({
    version: 1,
    crop: { left: 0.1, top: 0.1, width: 0.8, height: 0.8 },
    rotate: 0, exposureEv: 0.2, contrast: 0, saturation: 0, sharpen: 0,
  }))
  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  const result = await runExport({ db, project, dest, edit: 'recipe', mode: 'copy', buckets: ['keep'] })
  assert.equal(result.mode, 'copy')
  assert.ok(result.editedCount >= 1)
  const edited = result.items.find(item => item.edited === true)
  assert.ok(edited)
  assert.ok(edited.destPath.endsWith('.jpg'))
  const manifest = JSON.parse(readFileSync(path.join(dest, 'manifest.json'), 'utf8'))
  assert.ok(manifest.items.some(item => item.edited === true && item.editEngine === 'sharp-v1'))
  rmSync(base, { recursive: true, force: true })
})
```

测试 fixture 的 `a.jpg` 是文本伪文件；编辑导出需要真实 JPEG。`setup()` 里把 `a.jpg` 改成 sharp 生成的 200×150 JPEG，并更新 `size_bytes` 为实际大小。其他测试读取的是字节长度，请保持 fixture 一致。

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/export.test.js`
Expected: FAIL：未知 `edit` 选项，或没有 `editedCount`。

- [ ] **Step 3：修改 export.js**

导入：

```js
import { renderEditedBuffer } from './edit.js'
import { normalizeRecipe } from './recipe.js'
```

`normalizeOptions` 的完整替换版本：

```js
const EDIT_MODES = ['none', 'recipe']

function normalizeOptions({ dest, buckets = ['keep', 'maybe'], mode = 'hardlink', layout = 'mirror', edit = 'none' } = {}) {
  if (typeof dest !== 'string' || dest.trim() === '') throw httpError('dest is required', 'BAD_DEST')
  if (!path.isAbsolute(dest)) throw httpError(`dest must be an absolute path: ${dest}`, 'BAD_DEST')
  const resolved = path.resolve(dest)
  const bucketList = [...new Set(Array.isArray(buckets) ? buckets : [])].filter(bucket => BUCKETS.includes(bucket))
  if (bucketList.length === 0) throw httpError('buckets must include keep, maybe or reject', 'BAD_BUCKETS')
  if (!EDIT_MODES.includes(edit)) throw httpError(`unsupported edit mode: ${edit}`, 'BAD_EDIT')
  if (!MODES.includes(mode)) throw httpError(`unsupported mode: ${mode}`, 'BAD_MODE')
  if (!LAYOUTS.includes(layout)) throw httpError(`unsupported layout: ${layout}`, 'BAD_LAYOUT')
  if (edit === 'recipe') mode = 'copy'
  return { dest: resolved, buckets: bucketList, mode, layout, edit }
}
```

`selectPhotos` 的 SELECT 增加 `a.recipe_json`，并把 assessment join 改成“最新一条”：

```sql
    LEFT JOIN assessments a ON a.id = (
      SELECT id FROM assessments latest
      WHERE latest.target_id = p.id
        AND latest.target_kind = 'photo'
        AND latest.stage = 'single'
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    )
```

加 helper：

```js
function recipeOf(item) {
  if (item.recipe_json === null || item.recipe_json === undefined) return null
  try { return normalizeRecipe(JSON.parse(item.recipe_json)) } catch { return null }
}
```

`targetPathFor` 的完整替换版本：

```js
function targetPathFor(item, options, usedFlat, edited = false) {
  let relative = options.layout === 'flat' ? path.basename(item.rel_path) : item.rel_path
  if (edited) {
    const extension = path.extname(relative)
    relative = `${relative.slice(0, extension === '' ? relative.length : -extension.length)}.jpg`
  }
  let target = path.join(options.dest, item.verdict, relative)
  if (options.layout === 'flat' && usedFlat.has(target)) {
    const extension = path.extname(relative)
    const name = path.basename(relative, extension)
    target = path.join(path.dirname(target), `${name}__${sha8(item.rel_path)}${extension}`)
  }
  if (options.layout === 'flat') usedFlat.add(target)
  return target
}
```

`runExport`：

- `items` 继续来自 `selectPhotos`。
- 在循环里，如果 `options.edit === 'recipe'` 且 `recipeOf(item) !== null`：

```js
      const recipe = recipeOf(item)
      const buffer = await renderEditedBuffer({ sourcePath, recipe })
      const target = targetPathFor(item, options, usedFlat, true)
      const existing = await fileSize(target)
      if (existing === buffer.length) {
        skipped.push({ relPath: item.rel_path, destPath: target })
        counts[item.verdict] += 1
        manifestItems.push({
          ...item, destPath: target, action: 'skipped',
          edited: true, editEngine: 'sharp-v1', editRecipe: recipe,
        })
        continue
      }
      if (existing !== undefined) {
        failures.push({ relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
        continue
      }
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, buffer)
      counts[item.verdict] += 1
      editedCount += 1
      manifestItems.push({
        ...item, destPath: target, action: 'written',
        edited: true, editEngine: 'sharp-v1', editRecipe: recipe,
      })
      continue
```

- 无 recipe 时按原逻辑复制（`options.edit==='recipe'` 也走原有 copy 分支），manifest 标记 `edited:false`。
- `let editedCount = 0`。
- JSON manifest 的 `items` 加 `edited`、`editEngine`、`editRecipe`。
- CSV header 改为：

```js
  const csvHeader = 'rel_path,bucket,verdict,ai_score,group_id,reason,edited,edit_engine,dest_path\n'
```

行里加 `item.edited ? 'true' : 'false'` 和 `item.editEngine ?? ''`。

- 返回值加 `mode: options.mode`、`editedCount`、`items: manifestItems`（测试需要；已有返回值没有 items，补上即可）。

`previewExport` 的关键改动：

```js
export async function previewExport({ db, project, dest, buckets, mode, layout, edit }) {
  const options = normalizeOptions({ dest, buckets, mode, layout, edit })
  assertDestOutsideSource(project, options.dest)
  const items = selectedForBuckets(selectPhotos(db, project.id), options.buckets)
  const counts = Object.fromEntries(options.buckets.map(bucket => [bucket, 0]))
  const usedFlat = new Set()
  let editedCount = 0
  let totalBytes = 0
  const conflicts = []
  for (const item of items) {
    counts[item.verdict] += 1
    const sourcePath = path.join(sourceOf(project), item.rel_path)
    const size = await fileSize(sourcePath)
    if (size === undefined) {
      conflicts.push({ relPath: item.rel_path, reason: 'source_missing' })
      continue
    }
    totalBytes += size
    if (options.edit === 'recipe' && recipeOf(item) !== null) editedCount += 1
    if (options.edit === 'recipe') continue
    const target = targetPathFor(item, options, usedFlat)
    const existing = await fileSize(target)
    if (existing !== undefined && existing !== size) {
      conflicts.push({ relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
    }
  }
  return {
    dest: options.dest, buckets: options.buckets, mode: options.mode,
    layout: options.layout, edit: options.edit, counts, total: items.length,
    totalBytes, editedCount, skippedExisting: 0,
    conflictCount: conflicts.length, conflicts: conflicts.slice(0, 20),
  }
}
```

编辑模式不做目标大小比较（执行阶段渲染后再判断），只保留 source missing 检查。

- [ ] **Step 4：运行测试**

Run: `node --test plugin/test/export.test.js && npm test`
Expected: PASS。旧导出断言若写死 manifest CSV 列数，需要同步更新。

- [ ] **Step 5：提交**

```bash
git add plugin/src/host/export.js plugin/test/export.test.js
git commit -m "feat: export edited JPEG copies"
```

---

## Task 8：工具与 HTTP 参数

**Files:**
- Modify: `plugin/src/host/tools.js`
- Modify: `plugin/src/host/service.js`
- Modify: `plugin/src/host/http.js`
- Modify: `plugin/test/tools.test.js`
- Modify: `plugin/test/http.test.js`

- [ ] **Step 1：先写失败测试**

工具测试调用：

```js
await tool.execute({
  action: 'preview', project: 'demo', dest: '/tmp/out',
  buckets: ['keep'], mode: 'copy', edit: 'recipe',
})
assert.deepEqual(calls[0][1], {
  dest: '/tmp/out', buckets: ['keep'], mode: 'copy', layout: undefined, edit: 'recipe',
})
```

HTTP 测试的 export body 加 `edit: 'recipe'`，断言 service 收到同样参数。

- [ ] **Step 2：运行失败测试**

Run: `node --test plugin/test/tools.test.js plugin/test/http.test.js`
Expected: FAIL，edit 被忽略。

- [ ] **Step 3：修改 tools.js**

参数加：

```js
      edit: {
        type: 'string',
        enum: ['none', 'recipe'],
        description: 'none 导出原文件；recipe 用 sharp 应用修图建议并输出 JPEG 副本（默认 none）',
      },
```

options 加 `edit: args.edit`。

- [ ] **Step 4：修改 service.js/http.js**

`service.exportPreview/exportRun` 继续 `{ ...options }`，无需改；HTTP 的 export body 已经透传，确认 `edit` 没被白名单过滤。若 HTTP 有显式字段列表，补上 `edit: body.edit`。

- [ ] **Step 5：运行测试**

Run: `node --test plugin/test/tools.test.js plugin/test/http.test.js && npm test`
Expected: PASS。

- [ ] **Step 6：提交**

```bash
git add plugin/src/host/tools.js plugin/src/host/service.js plugin/src/host/http.js plugin/test/tools.test.js plugin/test/http.test.js
git commit -m "feat: expose edit recipe export option"
```

---

## Task 9：单图配方预览与导出开关

**Files:**
- Modify: `plugin/src/client/index.tsx`
- Modify: `plugin/src/client/locales.js`
- Test: `plugin/test/i18n.test.js`（覆盖新增 key）

- [ ] **Step 1：加词条**

`locales.js` 的中文和英文各加：

```js
  editRecipe: '修图建议',
  editNoRecipe: '这张照片没有结构化修图建议；重跑单张精评可生成。',
  editPreview: '查看修图效果',
  editOriginal: '查看原图',
  editCrop: '裁剪',
  editRotate: '校正',
  editExposure: '曝光',
  editContrast: '对比',
  editSaturation: '饱和',
  editSharpen: '锐化',
  editExport: '应用修图建议（输出 JPEG 副本）',
  editExportHint: '应用修图时强制复制，源文件不会修改；没有配方的照片保持原样复制。',
```

英文对应：

```js
  editRecipe: 'Edit recipe',
  editNoRecipe: 'No structured edit recipe for this photo; re-run single scoring to generate one.',
  editPreview: 'Show edited preview',
  editOriginal: 'Show original',
  editCrop: 'Crop',
  editRotate: 'Straighten',
  editExposure: 'Exposure',
  editContrast: 'Contrast',
  editSaturation: 'Saturation',
  editSharpen: 'Sharpen',
  editExport: 'Apply edit recipes (JPEG copies)',
  editExportHint: 'Applying edits forces copy mode; source files are never modified. Photos without a recipe are copied unchanged.',
```

- [ ] **Step 2：单图页加预览**

在 `PhotoSingle` 组件里加本地 state：

```tsx
  const [showEdited, setShowEdited] = useState(false)
```

图片 src 改为：

```tsx
          <img
            src={showEdited
              ? `/photo-picker/media/edit/${projectId}/${photoId}?v=${version}`
              : `${detail.previewUrl}?v=${version}`}
            alt={detail.relPath}
          />
```

在右侧信息卡里加：

```tsx
          {detail.editRecipe !== null && detail.editRecipe !== undefined ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pp-section-title">{t('editRecipe')}</span>
                <button type="button" style={btn} onClick={() => setShowEdited(value => !value)}>
                  {showEdited ? t('editOriginal') : t('editPreview')}
                </button>
              </div>
              <div className="pp-chips">
                <span className="pp-chip">{t('editCrop')} {Math.round(detail.editRecipe.crop.width * 100)}%</span>
                <span className="pp-chip">{t('editRotate')} {detail.editRecipe.rotate}°</span>
                <span className="pp-chip">{t('editExposure')} {detail.editRecipe.exposureEv > 0 ? '+' : ''}{detail.editRecipe.exposureEv} EV</span>
                <span className="pp-chip">{t('editContrast')} {detail.editRecipe.contrast}</span>
                <span className="pp-chip">{t('editSaturation')} {detail.editRecipe.saturation}</span>
                <span className="pp-chip">{t('editSharpen')} {detail.editRecipe.sharpen}</span>
              </div>
            </div>
          ) : (
            <div className="pp-muted">{t('editNoRecipe')}</div>
          )}
```

- [ ] **Step 3：导出对话框加开关**

在 `ExportDialog` 加：

```tsx
  const [applyEdits, setApplyEdits] = useState(false)
```

把 `edit` 加入每次 preview/run 的 body：

```tsx
        body: JSON.stringify({ dest, buckets, mode: applyEdits ? 'copy' : mode, edit: applyEdits ? 'recipe' : 'none' }),
```

在分桶/方式那一行下面加：

```tsx
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={applyEdits}
            onChange={event => setApplyEdits(event.target.checked)}
          />
          {t('editExport')}
        </label>
        {applyEdits && <div className="pp-callout">{t('editExportHint')}</div>}
```

预览结果显示 `editedCount`：

```tsx
            {preview.editedCount > 0 && <div>{t('editExport')}: {preview.editedCount}</div>}
```

- [ ] **Step 4：构建与测试**

Run: `npm test && npm run typecheck && npm run build:client`
Expected: PASS；`plugin/dist/client.js` 有改动并提交。

- [ ] **Step 5：提交**

```bash
git add plugin/src/client/index.tsx plugin/src/client/locales.js plugin/dist/client.js
git commit -m "feat: preview and export edit recipes from the workbench"
```

---

## Task 10：验收脚本、CI 与文档

**Files:**
- Create: `scripts/acceptance-phase5.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/2026-11-04-photo-picker-workbench-design.md`

- [ ] **Step 1：写 acceptance:5**

基于 `scripts/acceptance-phase2.mjs`，假 LLM 的评分返回加：

```js
edit_recipe: {
  version: 1,
  crop: { left: 0.1, top: 0.1, width: 0.8, height: 0.8 },
  rotate: 0, exposureEv: 0.2, contrast: 0, saturation: 0, sharpen: 0,
},
```

跑完 scan/preprocess/grid/rank/score 后：

```js
const detail = getPhotoDetail(db, project.id, photo.id)
assert.ok(detail.editRecipe)
const sourcePath = path.join(project.sourcePath, photo.rel_path)
const before = createHash('sha256').update(readFileSync(sourcePath)).digest('hex')
const edited = await renderEditedFile({
  sourcePath,
  recipe: detail.editRecipe,
  cachePath: path.join(project.workspaceDir, 'edits', `${photo.id}-accept.jpg`),
})
assert.ok(existsSync(edited.path))
const meta = await sharp(edited.path).metadata()
assert.equal(meta.format, 'jpeg')
const after = createHash('sha256').update(readFileSync(sourcePath)).digest('hex')
assert.equal(after, before)

const dest = path.join(base, 'export-edited')
const result = await runExport({
  db, project, dest, edit: 'recipe', mode: 'copy', buckets: ['keep'],
})
assert.ok(result.editedCount >= 1)
assert.ok(result.items.some(item => item.edited === true))
console.log('PASS', { edited: result.editedCount })
```

注意 `photo` 必须来自 `listReviewPhotos(db, project.id, { verdict: 'keep' })` 的第一张，不要猜 ID；导出后会包含该照片。

- [ ] **Step 2：加 npm script**

`package.json`：

```json
    "acceptance:5": "node scripts/acceptance-phase5.mjs"
```

`verify` 末尾加 `&& npm run acceptance:5`；CI 的 `acceptance` job、macOS job、release job 都加 `npm run acceptance:5`。

- [ ] **Step 3：文档**

README：

- “后续计划”第 1 条改成：

```markdown
1. **更精确的修图建议（可移植配方）**
   当前只给白名单代码。计划让模型输出裁剪/校正/曝光/对比/饱和度/锐化的结构化参数，用内置 sharp 引擎生成预览与 JPEG 副本；没有 Photoshop 也能用。RawTherapee/GIMP 适配器后续再加。
```

- “文档”列表加 Plan 5。
- “已知限制”说明：v1 只做全局调整，不做局部蒙版/修复/RAW 显影。

AGENTS：

- `真实模型调用` 旁的测试命令加 `acceptance:5`。
- 已知坑加：“配方裁剪坐标按旋转后的画布归一化；不要把原始坐标直接喂给 sharp extract。”
- 发布前用 `npm run verify`（已含 acceptance:5）。

spec：

- 8.4 增加 `edit_recipe` 输出说明。
- 9.2 单图增加“修图建议”卡片。
- 11 导出增加 `edit: recipe` 选项与 manifest 字段。
- 15.2 验收加 phase 5。

- [ ] **Step 4：运行全量验证**

Run: `npm run verify`
Expected: 全部 PASS；`check:release`、`check:hygiene`、acceptance 1/2/4/5。

- [ ] **Step 5：提交**

```bash
git add scripts/acceptance-phase5.mjs package.json .github/workflows/ci.yml .github/workflows/release.yml README.md AGENTS.md docs/superpowers/specs/2026-11-04-photo-picker-workbench-design.md
git commit -m "test: cover edit recipe rendering and export"
```

---

## 自检

- [ ] 配方缺失/非法时，评分仍能成功，只是没有修图建议。
- [ ] 旧库升级后 `recipe_json` 列存在，旧行读取为 `null`。
- [ ] 所有渲染都从源图重新读取，源文件大小/mtime/sha256 不变。
- [ ] 裁剪坐标按旋转后画布解释，单元测试覆盖像素换算。
- [ ] `edit:'recipe'` 强制 copy，绝不 hardlink 编辑后的新文件；无配方的照片按原文件复制。
- [ ] manifest 同时有 `edited`、`editEngine`、`editRecipe`；CSV 和 JSON 字段一致。
- [ ] 所有新增界面文案有 zh/en 词条，`i18n` 测试通过。
- [ ] `acceptance:5` 在 ubuntu、macOS、release workflow 中运行。
- [ ] README 路线图不再承诺 PS Actions，明确 v1 使用 sharp，RawTherapee/GIMP 是后续适配器。

## 风险与后续

- **旋转 + 裁剪的坐标语义**是最大的几何风险；本计划明确为“旋转后的画布”，如果模型经常按原图给坐标，后续可加 `cropFrame: 'original' | 'rotated'` 并做矩阵换算。
- **prompt v2 会让旧项目重跑评分产生新调用**；UI 里会显示“无结构化修图建议”，用户知情后再重跑。
- **sharp 的线性对比/曝光是近似**，不是 Lightroom 级色彩科学；v1 的目标是可用、可测、可解释，精度提升留给 RawTherapee/darktable 适配器。
- **局部修图**不在 v1：如果以后需要蒙版、修复、局部提亮，优先接 GIMP 批处理，而不是扩展 sharp 配方。
