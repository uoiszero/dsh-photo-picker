# 照片工作台 · 计划 1：骨架与本机预处理

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 安装一个可用的 DSH 插件骨架，并完成「选择本机照片文件夹 → 建项目 → 扫描 → 本地预处理（去重/技术过滤/分组/缩略图）」这条可验证的链路，为后续网络源、AI 粗筛和复核界面铺路。

**Architecture:** 一个 `dsh-photo-picker` bundle（Host 服务 + 后续 Client 面板）。Host 用 `node:sqlite` 每个项目一个数据库，项目注册表放在 `$DSH_HOME/storages/photo-picker/registry.json`；图片处理用 `sharp`（HEIC/RAW 回退 `sips`）；Host 通过 `ctx.webServer` 暴露本机 HTTP API，通过 `ctx.tools` 注册 `photo_picker` 工具。Client 用 React + esbuild 打成 DSH 的 `window.__ModuleLoader__` 格式。

**Tech Stack:** Node 22（`node:sqlite`）、`sharp`、`exifr`、`nanoid`、React（由 DSH 浏览器模块表提供）、esbuild、`node:test`。

---

## 范围与依据

**依据文档：** [设计 spec](../specs/2026-11-04-photo-picker-workbench-design.md)（下称 spec）。本计划覆盖 spec 的 3、5、6.2、7、8.1–8.2、9.1、9.6、10.1（部分）、15.1–15.2（部分）、17 阶段 1；网络源、AI 流水线、复核界面、导出与校准在后续计划。

**本期先不做：** 建项目前的文件数/格式/大小预估与确认页（spec 6.4 的估算部分）。Plan 1 建项目只校验「路径存在、是目录、可读」，数量与格式分布等扫描完成后再展示；预估留到 Plan 2 与费用预估一起做。

---

## 执行前提（Handoff）

1. **必须在创造者模式会话里执行**。确认工具表里有 `plugin_manager`、`cordis_inspect_list`、`cordis_inspect_query`；当前工作目录是 `dsh-photo-picker`。
2. **先读 spec**，至少读第 3、5、6、7、8、9、15 节。
3. **安装/切换插件需要用户批准**：`plugin_manager` 的每次调用都会走审批；不要绕过。
4. **不要手写 profile 的 `package.json` / `cordis.patch.yml`**，不要 `$DSH_HOME` 下建包，不要跑 pnpm 到 profile 目录；安装只走 `plugin_manager install_bundle`。
5. **环境事实**（已核对）：Node v22.23.4，`node:sqlite` 可用（有 ExperimentalWarning 可忽略）；`sharp` 0.35.5 / libvips 8.18.7；`sharp` **不能**直接解 HEIC（缺 libde265），HEIC/RAW 必须走 `sips`；`sips` 可用；DSH Web 在 `http://127.0.0.1:3080`。
6. **本项目还没有 git 仓库**。Task 1 先 `git init`，之后每个 Task 结束都提交一次。
7. 约定：Host 侧源码是普通 ESM JavaScript（不编译）；Client 是 TSX，用 esbuild 打包到 `plugin/dist/client.js` 并提交；测试用 `node --test`，测试文件放在 `plugin/test/`。

---

## 文件结构

```
dsh-photo-picker
├── package.json                     # 根开发依赖：sharp/exifr/nanoid/esbuild；npm scripts
├── .gitignore
├── docs/superpowers/…               # 已有 spec（不要动）
├── scripts/
│   ├── build-client.mjs             # esbuild 打包 client + loader 包装
│   ├── make-fixtures.mjs            # 生成验收用图片
│   └── acceptance-phase1.mjs        # 无头验收脚本
└── plugin/
    ├── package.json                 # bundle 清单（dsh.bundle / 后续 dsh.client）
    ├── cordis.patch.yml             # 插入 photo-picker 行
    ├── index.js                     # 默认导出 Host Service
    ├── icon.svg
    ├── locale/{zh,en}.json
    ├── src/host/
    │   ├── service.js               # PhotoPickerService（ctx.photoPicker）
    │   ├── paths.js                 # DSH_HOME / 默认工作区 / slug
    │   ├── db.js                    # SQLite schema + openDb
    │   ├── registry.js              # registry.json 读写
    │   ├── projects.js              # ProjectStore 建/列/取/改
    │   ├── source.js                # PhotoSource 接口 + LocalSource
    │   ├── scan.js                  # L0 扫描
    │   ├── images.js                # 解码/缩略图/指标/dHash
    │   └── preprocess.js            # L1 去重/过滤/分组
    ├── src/client/                  # Task 8 才创建
    ├── dist/client.js               # Task 8 构建产物
    └── test/*.test.js
```

---

## Task 1：Bundle 骨架、安装与激活验证

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `plugin/package.json`
- Create: `plugin/cordis.patch.yml`
- Create: `plugin/index.js`
- Create: `plugin/src/host/service.js`
- Create: `plugin/locale/zh.json`
- Create: `plugin/locale/en.json`
- Create: `plugin/icon.svg`

- [ ] **Step 1: 写根 `package.json` 与 `.gitignore`**

`package.json`：

```json
{
  "name": "photo-picker-workbench",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test plugin/test/*.test.js",
    "build:client": "node scripts/build-client.mjs",
    "fixtures": "node scripts/make-fixtures.mjs",
    "acceptance:1": "node scripts/acceptance-phase1.mjs"
  }
}
```

`.gitignore`：

```
node_modules/
.superpowers/
*.log
.DS_Store
```

- [ ] **Step 2: 写 bundle 清单与 Host 入口**

`plugin/package.json`：

```json
{
  "name": "dsh-photo-picker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  },
  "files": [
    "index.js",
    "src",
    "cordis.patch.yml",
    "locale/*.json",
    "icon.svg"
  ],
  "dependencies": {
    "sharp": "^0.35.0",
    "exifr": "^7.1.3",
    "nanoid": "^5.0.0"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" }
  }
}
```

`plugin/cordis.patch.yml`：

```yaml
- insert:
    - id: photo-picker
      name: dsh-photo-picker
```

`plugin/index.js`：

```js
export { PhotoPickerService as default } from './src/host/service.js'
```

`plugin/src/host/service.js`（Task 1 只做服务占位，后续 Task 往里加方法）：

```js
import { Service } from '@deepseek-ai/cordis'

/** 照片工作台的 Host 服务；Client 与 agent 工具共用这一份状态。 */
export class PhotoPickerService extends Service {
  static inject = ['tools', 'webServer', 'llm', 'attachments']

  constructor(ctx) {
    super(ctx, 'photoPicker')
    this.ctx = ctx
  }
}
```

- [ ] **Step 3: 写显示元数据与图标**

`plugin/locale/zh.json`：

```json
{
  "meta": {
    "title": "照片工作台",
    "description": "扫描照片、AI 粗筛与精评，导出精选结果。"
  }
}
```

`plugin/locale/en.json`：

```json
{
  "meta": {
    "title": "Photo Picker",
    "description": "Scan a photo folder, triage with AI, review and export the keepers."
  }
}
```

`plugin/icon.svg`（光圈图形，够用即可）：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#111820"/>
  <circle cx="32" cy="32" r="18" fill="none" stroke="#7ee2a8" stroke-width="3"/>
  <path d="M32 14 L43 26 L37 39 L25 39 L19 26 Z" fill="#7ee2a8" fill-opacity="0.85"/>
  <circle cx="32" cy="32" r="6" fill="#111820"/>
</svg>
```

- [ ] **Step 4: 安装依赖并初始化仓库**

```bash
cd dsh-photo-picker
git init
npm install sharp exifr nanoid
npm install -D esbuild
```

Expected: `npm` 成功；`node_modules/sharp` 可解析；`git init` 成功。

验证：

```bash
node -e "const s=require('sharp'); console.log(s.versions.sharp, s.versions.vips)"
```

Expected: 打印 `0.35.5 8.18.7`（版本号可能略新）。

- [ ] **Step 5: 安装 bundle 并验证激活**

调用 `plugin_manager`：

```json
{ "action": "install_bundle", "target": "dsh-photo-picker/plugin" }
```

（按工具实际参数名调用；需要用户批准。）

Expected: 返回 `application: "applied"`。若返回 `restart-required`，请用户重启 DSH Web 后重开会话，再用 `plugin_manager list_plugins` 确认 `photo-picker` 行是启用状态。

再用 `cordis_inspect_query` 查询 `Config.listConfigs`（`name` 过滤 `dsh-photo-picker`），确认：
- 包被解析到 `plugin/` 目录；
- locale 的 `meta.title` 是“照片工作台”。

- [ ] **Step 6: 提交**

```bash
git add .gitignore package.json plugin
git commit -m "feat: scaffold dsh-photo-picker host bundle"
```

---

## Task 2：SQLite schema 与打开/关闭

**Files:**
- Create: `plugin/src/host/db.js`
- Test: `plugin/test/db.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/db.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'

test('openDb creates the full schema in WAL mode', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-db-'))
  const db = openDb(dir)
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all().map(row => row.name)
  for (const table of [
    'projects', 'photos', 'groups', 'grids', 'stage_runs', 'assessments',
    'decisions', 'exports', 'errors', 'mounts', 'calibration_reports',
  ]) {
    assert.ok(tables.includes(table), `missing table ${table}`)
  }
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal')
  db.close()
  rmSync(dir, { recursive: true, force: true })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/db.test.js
```

Expected: FAIL，`Cannot find module .../db.js`。

- [ ] **Step 3: 写实现**

`plugin/src/host/db.js`：

```js
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_dir TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_path TEXT NOT NULL,
  mount_point TEXT,
  source_readonly INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'mixed',
  model_route TEXT NOT NULL DEFAULT 'deepseek-official',
  model_id TEXT NOT NULL DEFAULT 'deepseek-flash',
  budget_cny REAL NOT NULL DEFAULT 30,
  concurrency INTEGER NOT NULL DEFAULT 8,
  offpeak_only INTEGER NOT NULL DEFAULT 0,
  grid_cols INTEGER NOT NULL DEFAULT 4,
  grid_rows INTEGER NOT NULL DEFAULT 4,
  threshold_keep REAL NOT NULL DEFAULT 7.5,
  threshold_maybe REAL NOT NULL DEFAULT 6.0,
  stage_pause INTEGER NOT NULL DEFAULT 0,
  group_burst_seconds REAL NOT NULL DEFAULT 2,
  group_burst_hamming INTEGER NOT NULL DEFAULT 12,
  group_scene_seconds REAL NOT NULL DEFAULT 60,
  group_scene_hamming INTEGER NOT NULL DEFAULT 6,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'created',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rel_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  mtime_ms INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'other',
  width INTEGER,
  height INTEGER,
  orientation INTEGER,
  taken_at INTEGER,
  camera TEXT,
  lens TEXT,
  sha256 TEXT,
  dhash TEXT,
  blur_score REAL,
  clip_low REAL,
  clip_high REAL,
  group_id TEXT,
  thumb_path TEXT,
  preview_path TEXT,
  state TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (project_id, rel_path)
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  representative_photo_id TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  ended_at INTEGER
);

CREATE TABLE IF NOT EXISTS grids (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  cols INTEGER NOT NULL,
  rows INTEGER NOT NULL,
  image_path TEXT,
  cell_map_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_cells_json TEXT,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cny REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cursor TEXT,
  stats_json TEXT,
  cost_cny REAL NOT NULL DEFAULT 0,
  error TEXT,
  started_at INTEGER,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  model_route TEXT,
  model_id TEXT,
  prompt_version TEXT,
  score REAL,
  verdict TEXT,
  dimensions_json TEXT,
  post_processing_json TEXT,
  reason TEXT,
  raw_json TEXT,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cny REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL,
  note TEXT,
  source TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dest TEXT NOT NULL,
  mode TEXT NOT NULL,
  buckets_json TEXT,
  counts_json TEXT,
  manifest_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS errors (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT,
  photo_id TEXT,
  code TEXT,
  message TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mounts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  mount_point TEXT,
  auto_mounted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_seen_at INTEGER
);

CREATE TABLE IF NOT EXISTS calibration_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sample_size INTEGER NOT NULL,
  metrics_json TEXT,
  suggested_threshold REAL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_project_state ON photos(project_id, state);
CREATE INDEX IF NOT EXISTS idx_photos_project_group ON photos(project_id, group_id);
CREATE INDEX IF NOT EXISTS idx_photos_project_taken ON photos(project_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_stage_runs_project ON stage_runs(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_assess_target ON assessments(target_kind, target_id);
`

/** 打开（必要时创建）一个项目数据库。 */
export function openDb(workspaceDir) {
  mkdirSync(workspaceDir, { recursive: true })
  const db = new DatabaseSync(path.join(workspaceDir, 'db.sqlite'))
  db.exec('PRAGMA journal_mode=WAL;')
  db.exec('PRAGMA foreign_keys=ON;')
  db.exec(SCHEMA)
  return db
}

/** 关闭数据库；重复关闭不报错。 */
export function closeDb(db) {
  try {
    db.close()
  } catch {
    // already closed
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/db.test.js
```

Expected: PASS，1 test。

- [ ] **Step 5: 提交**

```bash
git add plugin/src/host/db.js plugin/test/db.test.js
git commit -m "feat: add project sqlite schema"
```

---

## Task 3：路径约定、项目注册表与建项目

**Files:**
- Create: `plugin/src/host/paths.js`
- Create: `plugin/src/host/registry.js`
- Create: `plugin/src/host/projects.js`
- Test: `plugin/test/projects.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/projects.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../src/host/projects.js'

function fixture() {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-proj-'))
  const photos = path.join(base, 'photos')
  const dsh = path.join(base, 'dsh')
  mkdirSync(photos, { recursive: true })
  writeFileSync(path.join(photos, 'a.jpg'), '')
  return { base, photos, dsh }
}

test('createProject validates the source and persists a registry entry', async () => {
  const { base, photos, dsh } = fixture()
  const store = new ProjectStore({ dshHome: dsh, workspaceRoot: path.join(base, 'work') })
  const created = await store.create({
    source: { kind: 'local', path: photos },
    name: '测试项目',
    theme: 'mixed',
    budgetCny: 12,
  })
  assert.match(created.id, /^[A-Za-z0-9_-]{8,}$/)
  assert.equal(created.name, '测试项目')
  assert.equal(created.budgetCny, 12)
  assert.ok(created.workspaceDir.startsWith(path.join(base, 'work')))
  const listed = await store.list()
  assert.equal(listed.length, 1)
  assert.equal(listed[0].id, created.id)
  rmSync(base, { recursive: true, force: true })
})

test('createProject rejects a missing path and leaves no registry entry', async () => {
  const { base, dsh } = fixture()
  const store = new ProjectStore({ dshHome: dsh, workspaceRoot: path.join(base, 'work') })
  await assert.rejects(
    store.create({ source: { kind: 'local', path: path.join(base, 'nope') } }),
    /source path does not exist/,
  )
  assert.equal((await store.list()).length, 0)
  rmSync(base, { recursive: true, force: true })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/projects.test.js
```

Expected: FAIL，`Cannot find module .../projects.js`。

- [ ] **Step 3: 写实现**

`plugin/src/host/paths.js`：

```js
import os from 'node:os'
import path from 'node:path'

/** DSH home；web profile 启动时也会注入 DSH_HOME。 */
export function dshHome() {
  return process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
}

/** 工作台自己的存储目录（注册表、将来的全局缓存）。 */
export function workbenchStoreDir() {
  return path.join(dshHome(), 'storages', 'photo-picker')
}

/** 默认的项目工作区根目录。 */
export function defaultWorkspaceRoot() {
  return path.join(os.homedir(), 'Pictures', 'PhotoPicker')
}

/** 文件名安全化，用于默认项目目录。 */
export function slugify(name) {
  const slug = String(name).trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug.length > 0 ? slug : 'photo-project'
}
```

`plugin/src/host/registry.js`：

```js
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { workbenchStoreDir } from './paths.js'

const EMPTY = { version: 1, projects: [] }

export function registryPath() {
  return path.join(workbenchStoreDir(), 'registry.json')
}

export function readRegistry(file = registryPath()) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.projects)) {
      return structuredClone(EMPTY)
    }
    return parsed
  } catch (error) {
    if (error?.code === 'ENOENT') return structuredClone(EMPTY)
    throw error
  }
}

export function writeRegistry(value, file = registryPath()) {
  mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8')
  renameSync(tmp, file)
}
```

`plugin/src/host/projects.js`：

```js
import { access, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { closeDb, openDb } from './db.js'
import { defaultWorkspaceRoot, slugify } from './paths.js'
import { readRegistry, writeRegistry } from './registry.js'

function toProject(row) {
  return {
    id: row.id,
    name: row.name,
    workspaceDir: row.workspace_dir,
    sourceKind: row.source_kind,
    sourcePath: row.source_path,
    mountPoint: row.mount_point ?? null,
    sourceReadonly: row.source_readonly === 1,
    theme: row.theme,
    modelRoute: row.model_route,
    modelId: row.model_id,
    budgetCny: row.budget_cny,
    concurrency: row.concurrency,
    offpeakOnly: row.offpeak_only === 1,
    gridCols: row.grid_cols,
    gridRows: row.grid_rows,
    thresholdKeep: row.threshold_keep,
    thresholdMaybe: row.threshold_maybe,
    stagePause: row.stage_pause === 1,
    groupBurstSeconds: row.group_burst_seconds,
    groupBurstHamming: row.group_burst_hamming,
    groupSceneSeconds: row.group_scene_seconds,
    groupSceneHamming: row.group_scene_hamming,
    promptVersion: row.prompt_version,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** 项目注册表 + 每个项目 SQLite 句柄的惰性缓存。 */
export class ProjectStore {
  constructor({ dshHome, workspaceRoot = defaultWorkspaceRoot() } = {}) {
    this.dshHome = dshHome
    this.workspaceRoot = workspaceRoot
    this.handles = new Map()
  }

  registryFile() {
    return this.dshHome === undefined
      ? undefined
      : path.join(this.dshHome, 'storages', 'photo-picker', 'registry.json')
  }

  async list() {
    const registry = readRegistry(this.registryFile())
    return [...registry.projects].sort((a, b) => b.createdAt - a.createdAt)
  }

  async create({ source, name, theme = 'mixed', budgetCny = 30, workspaceDir } = {}) {
    if (source?.kind !== 'local') throw new Error('only local sources are supported in plan 1')
    const sourcePath = path.resolve(String(source.path))
    let sourceStat
    try {
      sourceStat = await stat(sourcePath)
    } catch {
      throw new Error(`source path does not exist: ${sourcePath}`)
    }
    if (!sourceStat.isDirectory()) throw new Error(`source path is not a directory: ${sourcePath}`)
    await access(sourcePath)

    const projectName = (name ?? path.basename(sourcePath)).trim() || path.basename(sourcePath)
    const id = nanoid()
    const workspace = workspaceDir === undefined
      ? await this.uniqueWorkspace(projectName)
      : path.resolve(workspaceDir)

    await mkdir(workspace, { recursive: true })
    for (const dir of ['thumbs', 'previews', 'grids', 'logs']) {
      await mkdir(path.join(workspace, dir), { recursive: true })
    }

    const db = openDb(workspace)
    const now = Date.now()
    try {
      db.prepare(`
        INSERT INTO projects (
          id, name, workspace_dir, source_kind, source_path, theme,
          budget_cny, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, projectName, workspace, 'local', sourcePath, theme, budgetCny, now, now)
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      const registry = readRegistry(this.registryFile())
      registry.projects.push({
        id,
        name: projectName,
        workspaceDir: workspace,
        sourceKind: 'local',
        sourcePath,
        createdAt: now,
      })
      writeRegistry(registry, this.registryFile())
      this.handles.set(id, { db, project: toProject(row) })
      return toProject(row)
    } catch (error) {
      closeDb(db)
      throw error
    }
  }

  async uniqueWorkspace(name) {
    const base = path.join(this.workspaceRoot, slugify(name))
    for (let i = 1; i < 1000; i++) {
      const candidate = i === 1 ? base : `${base}-${i}`
      try {
        await stat(candidate)
      } catch {
        return candidate
      }
    }
    throw new Error('cannot allocate a workspace directory')
  }

  async open(id) {
    const cached = this.handles.get(id)
    if (cached !== undefined) return cached
    const registry = readRegistry(this.registryFile())
    const entry = registry.projects.find(project => project.id === id)
    if (entry === undefined) throw new Error(`unknown project: ${id}`)
    const db = openDb(entry.workspaceDir)
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (row === undefined) throw new Error(`project database is missing row: ${id}`)
    const handle = { db, project: toProject(row) }
    this.handles.set(id, handle)
    return handle
  }

  async get(id) {
    const { project } = await this.open(id)
    return project
  }

  close(id) {
    const cached = this.handles.get(id)
    if (cached === undefined) return
    closeDb(cached.db)
    this.handles.delete(id)
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/projects.test.js
```

Expected: PASS，2 tests。

- [ ] **Step 5: 提交**

```bash
git add plugin/src/host/paths.js plugin/src/host/registry.js plugin/src/host/projects.js plugin/test/projects.test.js
git commit -m "feat: create projects with a local source and registry"
```

---

## Task 4：本机照片源与 L0 扫描

**Files:**
- Create: `plugin/src/host/source.js`
- Create: `plugin/src/host/scan.js`
- Test: `plugin/test/scan.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/scan.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import { LocalSource } from '../src/host/source.js'
import { scanProject } from '../src/host/scan.js'

test('scan indexes supported files and skips hidden entries', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-scan-'))
  mkdirSync(path.join(base, '.hidden'))
  mkdirSync(path.join(base, 'sub'))
  writeFileSync(path.join(base, 'a.jpg'), 'x')
  writeFileSync(path.join(base, 'b.JPEG'), 'x')
  writeFileSync(path.join(base, 'note.txt'), 'x')
  writeFileSync(path.join(base, '.DS_Store'), 'x')
  writeFileSync(path.join(base, 'sub', 'c.heic'), 'x')
  const db = openDb(path.join(base, 'db'))
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'p', ?, 'local', ?, 0, 0)`).run(path.join(base, 'db'), base)

  const stats = await scanProject({ db, projectId: 'p1', source: new LocalSource(base) })
  const rows = db.prepare('SELECT rel_path, format FROM photos ORDER BY rel_path').all()
  assert.deepEqual(rows.map(row => row.rel_path), ['a.jpg', 'b.JPEG', 'sub/c.heic'])
  assert.equal(stats.photos, 3)
  assert.equal(stats.skipped, 1)
  db.close()
  rmSync(base, { recursive: true, force: true })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/scan.test.js
```

Expected: FAIL，`Cannot find module .../source.js`。

- [ ] **Step 3: 写实现**

`plugin/src/host/source.js`：

```js
import { createReadStream } from 'node:fs'
import { access, opendir, stat } from 'node:fs/promises'
import path from 'node:path'

const FORMATS = new Map([
  ['.jpg', 'jpeg'], ['.jpeg', 'jpeg'], ['.jpe', 'jpeg'],
  ['.png', 'png'], ['.webp', 'webp'],
  ['.heic', 'heic'], ['.heif', 'heic'], ['.avif', 'heic'],
  ['.dng', 'raw'], ['.cr2', 'raw'], ['.cr3', 'raw'], ['.nef', 'raw'],
  ['.arw', 'raw'], ['.raf', 'raw'], ['.orf', 'raw'], ['.rw2', 'raw'],
])

/** 扩展名 → 内部格式名；不支持返回 undefined。 */
export function formatOf(filePath) {
  return FORMATS.get(path.extname(filePath).toLowerCase())
}

/** 本机目录照片源：只读，不跟随符号链接。 */
export class LocalSource {
  constructor(root) {
    this.kind = 'local'
    this.root = path.resolve(root)
  }

  async health() {
    try {
      await access(this.root)
      return true
    } catch {
      return false
    }
  }

  async stat(relPath) {
    return stat(path.join(this.root, relPath))
  }

  openRead(relPath) {
    return createReadStream(this.absolute(relPath))
  }

  absolute(relPath) {
    return path.join(this.root, relPath)
  }

  async has(relPath) {
    try {
      await stat(this.absolute(relPath))
      return true
    } catch {
      return false
    }
  }

  /** 递归列出所有普通文件；`format` 为 undefined 表示不是支持的图片。 */
  async *walk() {
    const stack = ['']
    while (stack.length > 0) {
      const rel = stack.pop()
      const dir = await opendir(this.absolute(rel))
      for await (const entry of dir) {
        if (entry.name.startsWith('.')) continue
        const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          stack.push(childRel)
          continue
        }
        if (!entry.isFile()) continue
        yield { relPath: childRel, format: formatOf(entry.name) }
      }
    }
  }
}
```

`plugin/src/host/scan.js`：

```js
import { nanoid } from 'nanoid'
import * as exifr from 'exifr'

const EXIF_FIELDS = [
  'DateTimeOriginal', 'CreateDate', 'Make', 'Model', 'LensModel',
  'Orientation', 'ExifImageWidth', 'ExifImageHeight',
]

function toMs(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/** L0 扫描：把源目录里的照片写进 photos 表（不读取像素）。 */
export async function scanProject({ db, projectId, source, onProgress = () => {} }) {
  const stageId = nanoid()
  const now = Date.now()
  db.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
              VALUES (?, ?, 'scan', 'running', ?)`).run(stageId, projectId, now)

  const insert = db.prepare(`
    INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms, format,
                        width, height, orientation, taken_at, camera, lens, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?)
    ON CONFLICT(project_id, rel_path) DO UPDATE SET
      size_bytes = excluded.size_bytes,
      mtime_ms = excluded.mtime_ms,
      format = excluded.format,
      width = COALESCE(excluded.width, photos.width),
      height = COALESCE(excluded.height, photos.height),
      orientation = COALESCE(excluded.orientation, photos.orientation),
      taken_at = COALESCE(excluded.taken_at, photos.taken_at),
      camera = COALESCE(excluded.camera, photos.camera),
      lens = COALESCE(excluded.lens, photos.lens)
  `)

  let photos = 0
  let skipped = 0
  let errors = 0
  for await (const item of source.walk()) {
    if (item.format === undefined) {
      skipped += 1
      continue
    }
    try {
      const info = await source.stat(item.relPath)
      let exif = {}
      try {
        exif = await exifr.parse(source.absolute(item.relPath), { pick: EXIF_FIELDS }) ?? {}
      } catch {
        exif = {}
      }
      const width = exif.ExifImageWidth ?? exif.ImageWidth ?? null
      const height = exif.ExifImageHeight ?? exif.ImageHeight ?? null
      insert.run(
        nanoid(), projectId, item.relPath, info.size, info.mtimeMs, item.format,
        width, height, exif.Orientation ?? null,
        toMs(exif.DateTimeOriginal ?? exif.CreateDate),
        exif.Make ?? null, exif.Model ?? exif.LensModel ?? null, Date.now(),
      )
      photos += 1
      onProgress({ stage: 'scan', done: photos, total: null, relPath: item.relPath })
    } catch (error) {
      errors += 1
      db.prepare(`INSERT INTO errors (id, project_id, stage, code, message, created_at)
                  VALUES (?, ?, 'scan', 'SCAN_ITEM_FAILED', ?, ?)`)
        .run(nanoid(), projectId, String(error?.message ?? error), Date.now())
    }
  }

  const finished = Date.now()
  const stats = { photos, skipped, errors, durationMs: finished - now }
  db.prepare(`UPDATE stage_runs SET status = 'done', stats_json = ?, finished_at = ?
              WHERE id = ?`).run(JSON.stringify(stats), finished, stageId)
  db.prepare(`UPDATE projects SET status = 'scanned', updated_at = ? WHERE id = ?`)
    .run(finished, projectId)
  return stats
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/scan.test.js
```

Expected: PASS（3 张照片，1 个非照片文件被跳过）。

- [ ] **Step 5: 提交**

```bash
git add plugin/src/host/source.js plugin/src/host/scan.js plugin/test/scan.test.js
git commit -m "feat: scan local photo folders"
```

---

## Task 5：图像派生（解码、缩略图、模糊/曝光指标、dHash）

**Files:**
- Create: `plugin/src/host/images.js`
- Test: `plugin/test/images.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/images.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { deriveImage, hammingHex } from '../src/host/images.js'

async function makeImage(file, width, height, color) {
  await sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toFile(file)
}

test('deriveImage returns a webp thumb, dhash and metrics', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-img-'))
  const file = path.join(dir, 'a.jpg')
  await makeImage(file, 1200, 800, '#8899aa')
  const derived = await deriveImage(file)
  assert.equal(derived.width, 1200)
  assert.equal(derived.height, 800)
  assert.equal(derived.dhash.length, 16)
  assert.ok(derived.thumb.length > 0)
  assert.ok(Number.isFinite(derived.blurScore))
  assert.ok(derived.clipLow >= 0 && derived.clipLow <= 1)
  rmSync(dir, { recursive: true, force: true })
})

test('dhash is stable for the same pixels and hammingHex counts differences', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-img-'))
  const a = path.join(dir, 'a.jpg')
  const b = path.join(dir, 'b.jpg')
  await makeImage(a, 800, 600, '#334455')
  await makeImage(b, 800, 600, '#334455')
  const da = await deriveImage(a)
  const db = await deriveImage(b)
  assert.equal(da.dhash, db.dhash)
  assert.equal(hammingHex(da.dhash, db.dhash), 0)
  rmSync(dir, { recursive: true, force: true })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/images.test.js
```

Expected: FAIL，`Cannot find module .../images.js`。

- [ ] **Step 3: 写实现**

`plugin/src/host/images.js`：

```js
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const execFileAsync = promisify(execFile)

const THUMB_EDGE = 384
const METRIC_EDGE = 800
const DECODE_EDGE = 1200

/** HEIC/RAW 用 macOS 的 sips 转出临时 JPEG；失败抛错由调用方记为 unreadable。 */
async function sipsToJpeg(filePath) {
  const dir = await mkdtemp(path.join(tmpdir(), 'pp-sips-'))
  const out = path.join(dir, 'preview.jpg')
  try {
    await execFileAsync(
      'sips',
      ['-s', 'format', 'jpeg', '--resampleWidth', '1600', filePath, '--out', out],
      { timeout: 120_000 },
    )
    return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }) }
  } catch (error) {
    await rm(dir, { recursive: true, force: true })
    throw error
  }
}

/** 解码到长边 1200 的 JPEG 缓冲；HEIC/RAW 自动回退 sips。 */
export async function decodeToJpeg(filePath) {
  try {
    return await sharp(filePath)
      .rotate()
      .resize({ width: DECODE_EDGE, height: DECODE_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer()
  } catch (error) {
    const converted = await sipsToJpeg(filePath)
    try {
      return await sharp(converted.path)
        .rotate()
        .resize({ width: DECODE_EDGE, height: DECODE_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 92 })
        .toBuffer()
    } finally {
      await converted.cleanup()
    }
  }
}

/** 64 位 dHash，十六进制字符串。 */
export function dhashFromGray(gray, width, height) {
  let bits = 0n
  let index = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const left = gray[y * width + x]
      const right = gray[y * width + x + 1]
      if (left > right) bits |= 1n << BigInt(index)
      index += 1
    }
  }
  return bits.toString(16).padStart(16, '0')
}

/** 两个十六进制 dHash 的汉明距离。 */
export function hammingHex(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`)
  let count = 0
  while (x > 0n) {
    count += Number(x & 1n)
    x >>= 1n
  }
  return count
}

function laplacianVariance(gray, width, height) {
  if (width < 3 || height < 3) return 0
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x]
      const value = 4 * center
        - gray[(y - 1) * width + x] - gray[(y + 1) * width + x]
        - gray[y * width + x - 1] - gray[y * width + x + 1]
      sum += value
      sumSq += value * value
      n += 1
    }
  }
  if (n === 0) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

/** 从一张原图派生缩略图、尺寸、模糊分数、曝光裁剪比例与 dHash。 */
export async function deriveImage(filePath) {
  const jpeg = await decodeToJpeg(filePath)
  const base = sharp(jpeg)
  const metadata = await base.metadata()

  const thumb = await sharp(jpeg)
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()

  const metric = await sharp(jpeg)
    .resize({ width: METRIC_EDGE, height: METRIC_EDGE, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const gray = metric.data
  const { width, height } = metric.info
  let low = 0
  let high = 0
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] <= 5) low += 1
    else if (gray[i] >= 250) high += 1
  }

  const dhashGray = await sharp(jpeg)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer()

  return {
    thumb,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    blurScore: laplacianVariance(gray, width, height),
    clipLow: low / gray.length,
    clipHigh: high / gray.length,
    dhash: dhashFromGray(dhashGray, 9, 8),
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/images.test.js
```

Expected: PASS，2 tests。

- [ ] **Step 5: 提交**

```bash
git add plugin/src/host/images.js plugin/test/images.test.js
git commit -m "feat: derive thumbnails, blur/exposure metrics and dhash"
```

---

## Task 6：L1 预处理（去重、过滤、分组、缩略图落盘）

**Files:**
- Create: `plugin/src/host/preprocess.js`
- Test: `plugin/test/preprocess.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/preprocess.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { openDb } from '../src/host/db.js'
import { LocalSource } from '../src/host/source.js'
import { scanProject } from '../src/host/scan.js'
import { preprocessProject } from '../src/host/preprocess.js'

async function gradient(file, width, height, from, to, direction = 'horizontal', quality = 90) {
  const dx = direction === 'vertical' ? 0 : 1
  const dy = direction === 'horizontal' ? 0 : 1
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="${dx}" y2="${dy}">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/></svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality }).toFile(file)
}

async function solid(file, width, height, color) {
  await sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg({ quality: 90 }).toFile(file)
}

test('preprocess dedupes, filters and groups similar frames', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-pre-'))
  const photos = path.join(base, 'photos')
  const workspace = path.join(base, 'work')
  mkdirSync(photos, { recursive: true })
  mkdirSync(workspace, { recursive: true })

  // a.jpg 与 a-dup.jpg 字节相同；pair-1/2 像素相同但质量不同（sha 不同、dHash 相同）。
  await gradient(path.join(photos, 'a.jpg'), 2000, 1500, '#ff0000', '#0000ff')
  copyFileSync(path.join(photos, 'a.jpg'), path.join(photos, 'a-dup.jpg'))
  await solid(path.join(photos, 'white.jpg'), 2000, 1500, '#ffffff')
  await gradient(path.join(photos, 'small.jpg'), 800, 600, '#00ff00', '#0000ff', 'vertical')
  await gradient(path.join(photos, 'pair-1.jpg'), 2000, 1500, '#227755', '#882244', 'diagonal', 92)
  await gradient(path.join(photos, 'pair-2.jpg'), 2000, 1500, '#227755', '#882244', 'diagonal', 80)

  const db = openDb(workspace)
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'p', ?, 'local', ?, 0, 0)`).run(workspace, photos)

  const source = new LocalSource(photos)
  await scanProject({ db, projectId: 'p1', source })
  const stats = await preprocessProject({ db, projectId: 'p1', sourceRoot: photos, workspaceDir: workspace })

  const counts = Object.fromEntries(
    db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state').all('p1')
      .map(row => [row.state, row.n]),
  )
  assert.equal(counts.filtered_dup, 1)
  assert.equal(counts.filtered_small, 1)
  assert.equal(counts.filtered_exposure, 1)
  assert.ok(counts.ok >= 2)
  assert.ok(stats.groups >= 1)

  const grouped = db.prepare("SELECT COUNT(*) AS n FROM photos WHERE group_id IS NOT NULL").get()
  assert.ok(grouped.n >= 2)
  const thumb = db.prepare("SELECT thumb_path FROM photos WHERE state = 'ok' LIMIT 1").get()
  assert.match(thumb.thumb_path, /^thumbs\/.+\.webp$/)
  db.close()
  rmSync(base, { recursive: true, force: true })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/preprocess.test.js
```

Expected: FAIL，`Cannot find module .../preprocess.js`。

- [ ] **Step 3: 写实现**

`plugin/src/host/preprocess.js`：

```js
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { deriveImage, hammingHex } from './images.js'

const MIN_PIXELS = 2_000_000
const BLUR_MIN = 40
const MAX_GROUP_WINDOW_SECONDS = 120

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(filePath)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')))
  })
}

class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i)
    this.rank = new Array(size).fill(0)
  }
  find(x) {
    let root = x
    while (this.parent[root] !== root) root = this.parent[root]
    while (this.parent[x] !== x) {
      const next = this.parent[x]
      this.parent[x] = root
      x = next
    }
    return root
  }
  union(a, b) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra === rb) return
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra
    } else {
      this.parent[rb] = ra
      this.rank[ra] += 1
    }
  }
}

function recordError(db, projectId, code, message) {
  db.prepare(`INSERT INTO errors (id, project_id, stage, code, message, created_at)
              VALUES (?, ?, 'preprocess', ?, ?, ?)`)
    .run(nanoid(), projectId, code, message, Date.now())
}

/** L1 预处理：精确去重 → 解码派生 → 技术过滤 → 分组。 */
export async function preprocessProject({
  db, projectId, sourceRoot, workspaceDir,
  onProgress = () => {}, blurMin = BLUR_MIN, blurPercentile = 0.05,
}) {
  const stageId = nanoid()
  const startedAt = Date.now()
  db.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
              VALUES (?, ?, 'preprocess', 'running', ?)`).run(stageId, projectId, startedAt)

  const seen = new Map()
  for (const row of db.prepare('SELECT id, sha256 FROM photos WHERE project_id = ? AND sha256 IS NOT NULL').all(projectId)) {
    if (row.sha256 !== null) seen.set(row.sha256, row.id)
  }

  const pending = db.prepare(`
    SELECT id, rel_path FROM photos
    WHERE project_id = ? AND state = 'ok' AND dhash IS NULL
    ORDER BY rel_path
  `).all(projectId)

  let done = 0
  for (const row of pending) {
    const absolute = path.join(sourceRoot, row.rel_path)
    try {
      const sha = await sha256File(absolute)
      const duplicateOf = seen.get(sha)
      if (duplicateOf !== undefined) {
        db.prepare("UPDATE photos SET sha256 = ?, state = 'filtered_dup' WHERE id = ?").run(sha, row.id)
        done += 1
        onProgress({ stage: 'preprocess', phase: 'derive', done, total: pending.length })
        continue
      }
      seen.set(sha, row.id)
      const derived = await deriveImage(absolute)
      const thumbRel = `thumbs/${row.id}.webp`
      await writeFile(path.join(workspaceDir, thumbRel), derived.thumb)
      db.prepare(`
        UPDATE photos SET sha256 = ?, width = ?, height = ?, dhash = ?, blur_score = ?,
          clip_low = ?, clip_high = ?, thumb_path = ?
        WHERE id = ?
      `).run(sha, derived.width, derived.height, derived.dhash, derived.blurScore,
        derived.clipLow, derived.clipHigh, thumbRel, row.id)
    } catch (error) {
      const message = String(error?.message ?? error)
      db.prepare("UPDATE photos SET state = 'unreadable', error = ? WHERE id = ?").run(message, row.id)
      recordError(db, projectId, 'IMAGE_DECODE_FAILED', `${row.rel_path}: ${message}`)
    }
    done += 1
    onProgress({ stage: 'preprocess', phase: 'derive', done, total: pending.length })
  }

  const scored = db.prepare(`
    SELECT id, width, height, blur_score, clip_low, clip_high FROM photos
    WHERE project_id = ? AND state = 'ok' AND dhash IS NOT NULL
  `).all(projectId)
  const sortedScores = scored.map(row => row.blur_score).sort((a, b) => a - b)
  const p5 = sortedScores[Math.floor(sortedScores.length * blurPercentile)] ?? 0

  for (const row of scored) {
    const pixels = (row.width ?? 0) * (row.height ?? 0)
    let state = 'ok'
    if (pixels < MIN_PIXELS) state = 'filtered_small'
    else if ((row.clip_high ?? 0) > 0.4 || (row.clip_low ?? 0) > 0.6) state = 'filtered_exposure'
    else if (p5 > 0 && row.blur_score < blurMin && row.blur_score <= p5) state = 'filtered_blur'
    if (state !== 'ok') db.prepare('UPDATE photos SET state = ? WHERE id = ?').run(state, row.id)
  }

  db.prepare('DELETE FROM groups WHERE project_id = ?').run(projectId)
  db.prepare('UPDATE photos SET group_id = NULL WHERE project_id = ?').run(projectId)

  const survivors = db.prepare(`
    SELECT id, rel_path, taken_at, mtime_ms, dhash, blur_score FROM photos
    WHERE project_id = ? AND state = 'ok'
    ORDER BY COALESCE(taken_at, mtime_ms) ASC, rel_path ASC
  `).all(projectId)

  const uf = new UnionFind(survivors.length)
  const timeOf = row => Number(row.taken_at ?? row.mtime_ms ?? 0)
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      const seconds = Math.abs(timeOf(survivors[j]) - timeOf(survivors[i])) / 1000
      if (seconds > MAX_GROUP_WINDOW_SECONDS) break
      const distance = hammingHex(survivors[i].dhash, survivors[j].dhash)
      const burst = seconds <= 2 && distance <= 12
      const scene = seconds <= 60 && distance <= 6
      if (burst || scene) uf.union(i, j)
    }
  }

  const buckets = new Map()
  survivors.forEach((row, index) => {
    const root = uf.find(index)
    const bucket = buckets.get(root) ?? []
    bucket.push({ ...row, index })
    buckets.set(root, bucket)
  })

  let groups = 0
  for (const members of buckets.values()) {
    if (members.length < 2) continue
    groups += 1
    const groupId = nanoid()
    const times = members.map(timeOf)
    const representative = [...members].sort((a, b) => (b.blur_score ?? 0) - (a.blur_score ?? 0))[0]
    const kind = Math.max(...times) - Math.min(...times) <= 2000 ? 'burst' : 'scene'
    db.prepare(`INSERT INTO groups (id, project_id, kind, representative_photo_id, size, started_at, ended_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(groupId, projectId, kind, representative.id, members.length, Math.min(...times), Math.max(...times))
    const update = db.prepare('UPDATE photos SET group_id = ? WHERE id = ?')
    for (const member of members) update.run(groupId, member.id)
  }

  const counts = Object.fromEntries(
    db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
      .all(projectId).map(row => [row.state, row.n]),
  )
  const finishedAt = Date.now()
  const stats = { counts, groups, durationMs: finishedAt - startedAt }
  db.prepare(`UPDATE stage_runs SET status = 'done', stats_json = ?, finished_at = ?
              WHERE id = ?`).run(JSON.stringify(stats), finishedAt, stageId)
  db.prepare(`UPDATE projects SET status = 'preprocessed', updated_at = ? WHERE id = ?`)
    .run(finishedAt, projectId)
  return stats
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/preprocess.test.js
```

Expected: PASS。若白图没有触发 `filtered_exposure`，检查 `clipHigh` 是否 > 0.4（纯白图应该接近 1）；若 `pair-1/2` 没成组，打印两者的 dHash 与时间差，确认差异 ≤ 6。

- [ ] **Step 5: 提交**

```bash
git add plugin/src/host/preprocess.js plugin/test/preprocess.test.js
git commit -m "feat: dedupe, filter and group photos locally"
```

---

## Task 7：Host 服务方法 + 本机 HTTP API

**Files:**
- Modify: `plugin/src/host/service.js`
- Create: `plugin/src/host/http.js`
- Test: `plugin/test/http.test.js`

- [ ] **Step 1: 写失败测试（用 stub service 测路由，不启动 DSH）**

`plugin/test/http.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHttpHandler } from '../src/host/http.js'

function stub() {
  return {
    events: { on() {}, off() {} },
    async listProjects() { return [{ id: 'p1', name: 'demo' }] },
    async createProject(body) { return { id: 'p2', name: body.name } },
    async getProjectDetail(id) { return { id, counts: {} } },
    async listPhotos() { return [] },
    async startStage(id, stage) { return { started: stage } },
    async listDir() { return [{ name: 'Pictures', path: '/Users/x/Pictures' }] },
    async chooseFolder() { return '/Users/x/Pictures' },
    async thumbFile() { return undefined },
  }
}

async function withServer(run) {
  const server = createServer(createHttpHandler(stub()))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    await run(origin)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('health and project routes answer JSON', async () => {
  await withServer(async origin => {
    const health = await fetch(`${origin}/photo-picker/api/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { ok: true })

    const list = await fetch(`${origin}/photo-picker/api/projects`)
    assert.deepEqual(await list.json(), [{ id: 'p1', name: 'demo' }])

    const created = await fetch(`${origin}/photo-picker/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new' }),
    })
    assert.equal(created.status, 201)
    assert.deepEqual(await created.json(), { id: 'p2', name: 'new' })
  })
})

test('unknown route returns a structured 404', async () => {
  await withServer(async origin => {
    const response = await fetch(`${origin}/photo-picker/nope`)
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.code, 'NOT_FOUND')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/http.test.js
```

Expected: FAIL，`Cannot find module .../http.js`。

- [ ] **Step 3: 写 `http.js`**

```js
import { createReadStream } from 'node:fs'

const BODY_LIMIT = 1024 * 1024

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > BODY_LIMIT) {
      const error = new Error('request body too large')
      error.statusCode = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function streamSse(service, req, res, projectId) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  const sendEvent = event => {
    if (event.projectId !== projectId) return
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  service.events.on('event', sendEvent)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000)
  req.on('close', () => {
    clearInterval(heartbeat)
    service.events.off('event', sendEvent)
  })
}

/** 本机 HTTP 路由；Host 服务在构造时把它挂到 `/photo-picker` 前缀。 */
export function createHttpHandler(service) {
  return async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://local')
      const pathname = decodeURIComponent(url.pathname)

      if (pathname === '/photo-picker/api/health') return send(res, 200, { ok: true })

      if (pathname === '/photo-picker/api/projects' && req.method === 'GET') {
        return send(res, 200, await service.listProjects())
      }
      if (pathname === '/photo-picker/api/projects' && req.method === 'POST') {
        return send(res, 201, await service.createProject(await readJson(req)))
      }

      const projectMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)$/)
      if (projectMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.getProjectDetail(projectMatch[1]))
      }

      const photosMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/photos$/)
      if (photosMatch !== null && req.method === 'GET') {
        return send(res, 200, await service.listPhotos(photosMatch[1], {
          state: url.searchParams.get('state') ?? undefined,
          limit: Number(url.searchParams.get('limit') ?? 60),
          offset: Number(url.searchParams.get('offset') ?? 0),
        }))
      }

      const actionsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/actions$/)
      if (actionsMatch !== null && req.method === 'POST') {
        const body = await readJson(req)
        return send(res, 200, await service.startStage(actionsMatch[1], body.stage))
      }

      const eventsMatch = pathname.match(/^\/photo-picker\/api\/projects\/([^/]+)\/events$/)
      if (eventsMatch !== null && req.method === 'GET') {
        return streamSse(service, req, res, eventsMatch[1])
      }

      if (pathname === '/photo-picker/api/fs/list') {
        return send(res, 200, await service.listDir(url.searchParams.get('path') ?? undefined))
      }
      if (pathname === '/photo-picker/api/fs/choose' && req.method === 'POST') {
        return send(res, 200, { path: await service.chooseFolder() })
      }

      const thumbMatch = pathname.match(/^\/photo-picker\/media\/thumb\/([^/]+)\/([^/]+)$/)
      if (thumbMatch !== null) {
        const file = await service.thumbFile(thumbMatch[1], thumbMatch[2])
        if (file === undefined) {
          return send(res, 404, { error: { code: 'NOT_FOUND', message: 'thumbnail not found' } })
        }
        res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'private, max-age=86400' })
        createReadStream(file).pipe(res)
        return
      }

      return send(res, 404, { error: { code: 'NOT_FOUND', message: pathname } })
    } catch (error) {
      return send(res, error?.statusCode ?? 500, {
        error: { code: error?.code ?? 'INTERNAL', message: String(error?.message ?? error) },
      })
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test plugin/test/http.test.js
```

Expected: PASS，2 tests。

- [ ] **Step 5: 实现服务方法（不注册工具，工具在 Task 9）**

`plugin/src/host/service.js` 替换为：

```js
import { Service } from '@deepseek-ai/cordis'
import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHttpHandler } from './http.js'
import { dshHome } from './paths.js'
import { ProjectStore } from './projects.js'
import { preprocessProject } from './preprocess.js'
import { scanProject } from './scan.js'
import { LocalSource } from './source.js'

const execFileAsync = promisify(execFile)

/** 照片工作台的 Host 服务；Client 与 agent 工具共用这一份状态。 */
export class PhotoPickerService extends Service {
  static inject = ['tools', 'webServer']

  constructor(ctx) {
    super(ctx, 'photoPicker')
    this.ctx = ctx
    this.store = new ProjectStore({ dshHome: dshHome() })
    this.events = new EventEmitter()
    this.running = new Map()
    ctx.effect(
      () => ctx.webServer.register({
        kind: 'prefix',
        path: '/photo-picker',
        handler: createHttpHandler(this),
      }),
      'photo-picker.http',
    )
  }

  async listProjects() {
    const entries = await this.store.list()
    return Promise.all(entries.map(entry => this.getProjectDetail(entry.id)))
  }

  async createProject(input) {
    const project = await this.store.create(input)
    return this.getProjectDetail(project.id)
  }

  async resolveProject(ref) {
    if (this.store.handles.has(ref)) return ref
    const entries = await this.store.list()
    const match = entries.find(entry => entry.name === ref || entry.id === ref)
    if (match === undefined) throw new Error(`unknown project: ${ref}`)
    return match.id
  }

  async getProjectDetail(id) {
    const { db, project } = await this.store.open(id)
    const counts = Object.fromEntries(
      db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
        .all(id).map(row => [row.state, row.n]),
    )
    const stages = db.prepare(`
      SELECT stage, status, stats_json, started_at, finished_at FROM stage_runs
      WHERE project_id = ? ORDER BY started_at DESC LIMIT 8
    `).all(id).map(row => {
      let stats = null
      try { stats = row.stats_json === null ? null : JSON.parse(row.stats_json) } catch { stats = null }
      return { stage: row.stage, status: row.status, stats, startedAt: row.started_at, finishedAt: row.finished_at }
    })
    return { ...project, counts, stages, running: this.running.get(id) ?? null }
  }

  async listPhotos(id, { state, limit = 60, offset = 0 } = {}) {
    const { db } = await this.store.open(id)
    const clauses = ['project_id = ?']
    const params = [id]
    if (state !== undefined) {
      clauses.push('state = ?')
      params.push(state)
    }
    const rows = db.prepare(`
      SELECT id, rel_path, state, width, height, blur_score, dhash, group_id FROM photos
      WHERE ${clauses.join(' AND ')}
      ORDER BY rel_path LIMIT ? OFFSET ?
    `).all(...params, limit, offset)
    return rows.map(row => ({
      id: row.id,
      relPath: row.rel_path,
      state: row.state,
      width: row.width,
      height: row.height,
      blurScore: row.blur_score,
      groupId: row.group_id,
      thumbUrl: `/photo-picker/media/thumb/${id}/${row.id}`,
    }))
  }

  async thumbFile(id, photoId) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare('SELECT thumb_path FROM photos WHERE id = ? AND project_id = ?').get(photoId, id)
    if (row === undefined || row.thumb_path === null) return undefined
    return path.join(project.workspaceDir, row.thumb_path)
  }

  async startStage(id, stage) {
    if (stage !== 'scan' && stage !== 'preprocess') throw new Error(`unsupported stage: ${stage}`)
    if (this.running.has(id)) throw new Error(`a stage is already running for project ${id}`)
    const { db, project } = await this.store.open(id)
    const source = new LocalSource(project.sourcePath)
    const onProgress = progress => this.events.emit('event', { projectId: id, ...progress })
    const task = stage === 'scan'
      ? scanProject({ db, projectId: id, source, onProgress })
      : preprocessProject({
          db,
          projectId: id,
          sourceRoot: project.sourcePath,
          workspaceDir: project.workspaceDir,
          onProgress,
        })
    this.running.set(id, stage)
    task
      .then(() => this.events.emit('event', { projectId: id, stage, done: true }))
      .catch(error => this.events.emit('event', { projectId: id, stage, error: String(error?.message ?? error) }))
      .finally(() => this.running.delete(id))
    return { started: stage }
  }

  async chooseFolder() {
    const { stdout } = await execFileAsync(
      'osascript',
      ['-e', 'POSIX path of (choose folder)'],
      { timeout: 120_000 },
    )
    const selected = stdout.trim()
    if (selected === '') throw new Error('no folder selected')
    return selected
  }

  async listDir(dir) {
    const target = dir === undefined || dir === '' ? os.homedir() : path.resolve(dir)
    const entries = await readdir(target, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => ({ name: entry.name, path: path.join(target, entry.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
```

- [ ] **Step 6: 运行全部单测**

```bash
npm test
```

Expected: db / projects / scan / images / preprocess / http 六个测试文件全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add plugin/src/host/service.js plugin/src/host/http.js plugin/test/http.test.js
git commit -m "feat: expose photo picker http api"
```

---

## Task 8：客户端外壳（加载器按钮 + 全屏面板 + 建项目 + 进度 + 缩略图）

**Files:**
- Create: `scripts/build-client.mjs`
- Create: `plugin/src/client/index.tsx`
- Modify: `plugin/package.json`
- Create: `plugin/dist/client.js`（构建产物，提交）

- [ ] **Step 1: 写构建脚本**

`scripts/build-client.mjs`：

```js
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'

const result = await build({
  entryPoints: ['plugin/src/client/index.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  external: ['react', 'react-dom'],
  logLevel: 'warning',
})

const code = result.outputFiles[0].text
const wrapped = `window.__ModuleLoader__.load({
  id: 'dsh-photo-picker',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
${code}
    return module.exports;
  },
});
`

await mkdir('plugin/dist', { recursive: true })
await writeFile('plugin/dist/client.js', wrapped)
console.log('built plugin/dist/client.js')
```

- [ ] **Step 2: 写客户端源码**

> 入口先用 spec 9.1 的备选方案：composer dock 按钮（`conversation.composer.dock`）+ 全屏面板（`shell.overlay`）。侧栏“照片工作台”入口留到 Plan 3 的 UI 收尾再评估，避免 Plan 1 依赖侧栏插槽的细节。

`plugin/src/client/index.tsx`（首版只做「列表 / 建项目 / 扫描 / 预处理 / 缩略图」）：

```tsx
import React, { useEffect, useState, useSyncExternalStore } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'

const zh = {
  open: '照片工作台',
  title: '照片工作台',
  close: '关闭',
  newProject: '新建项目',
  folder: '照片文件夹',
  choose: '用系统对话框选择',
  browse: '浏览',
  up: '上一级',
  name: '项目名',
  theme: '题材',
  budget: '预算（元）',
  create: '创建项目',
  creating: '创建中…',
  projects: '项目',
  scan: '开始扫描',
  preprocess: '开始预处理',
  photos: '照片',
  running: '运行中',
  empty: '还没有项目，先选择照片文件夹。',
  error: '出错',
  loading: '加载中…',
}

const en = {
  open: 'Photo Picker',
  title: 'Photo Picker',
  close: 'Close',
  newProject: 'New project',
  folder: 'Photo folder',
  choose: 'Choose with system dialog',
  browse: 'Browse',
  up: 'Up',
  name: 'Project name',
  theme: 'Theme',
  budget: 'Budget (CNY)',
  create: 'Create project',
  creating: 'Creating…',
  projects: 'Projects',
  scan: 'Scan',
  preprocess: 'Preprocess',
  photos: 'Photos',
  running: 'Running',
  empty: 'No projects yet. Pick a photo folder first.',
  error: 'Error',
  loading: 'Loading…',
}

let open = false
const listeners = new Set<() => void>()
function setOpen(value: boolean) {
  open = value
  for (const listener of listeners) listener()
}
function useOpen() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    throw new Error(body?.error?.message ?? response.statusText)
  }
  return response.json()
}

function Launcher({ t }: { t: (key: string) => string }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        border: '1px solid #3a4050', borderRadius: 8, background: '#1a1f2a',
        color: '#e8eaf0', padding: '4px 10px', fontSize: 12, cursor: 'pointer',
      }}
    >
      {t('open')}
    </button>
  )
}

function CreateForm({ t, onCreated }: { t: (key: string) => string; onCreated: (id: string) => void }) {
  const [folder, setFolder] = useState('')
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([])
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('mixed')
  const [budget, setBudget] = useState('30')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const browse = async (path: string) => {
    try {
      setDirs(await api(`/photo-picker/api/fs/list?path=${encodeURIComponent(path)}`))
      setFolder(path)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  const choose = async () => {
    try {
      const result = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setFolder(result.path)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const project = await api('/photo-picker/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          source: { kind: 'local', path: folder },
          name: name === '' ? undefined : name,
          theme,
          budgetCny: Number(budget) || 30,
        }),
      })
      onCreated(project.id)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('folder')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={folder}
            onChange={event => setFolder(event.target.value)}
            placeholder="/Users/…/Pictures"
            style={{ flex: 1, background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }}
          />
          <button type="button" onClick={choose}>{t('choose')}</button>
          <button type="button" onClick={() => browse(folder)}>{t('browse')}</button>
        </div>
      </label>
      {dirs.length > 0 && (
        <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #2a2f3a', borderRadius: 6 }}>
          {dirs.map(dir => (
            <div
              key={dir.path}
              onClick={() => browse(dir.path)}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
            >
              {dir.name}
            </div>
          ))}
        </div>
      )}
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('name')}</span>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="2024 婚礼" style={{ background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }} />
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('theme')}</span>
          <select value={theme} onChange={event => setTheme(event.target.value)}>
            <option value="mixed">混合</option>
            <option value="portrait">人像</option>
            <option value="landscape">风光</option>
            <option value="event">活动</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('budget')}</span>
          <input value={budget} onChange={event => setBudget(event.target.value)} style={{ width: 80, background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }} />
        </label>
      </div>
      <button type="button" disabled={busy || folder === ''} onClick={create}>
        {busy ? t('creating') : t('create')}
      </button>
      {error !== null && <div style={{ color: '#ff8a80', fontSize: 12 }}>{error}</div>}
    </div>
  )
}

function ProjectDetail({ t, id }: { t: (key: string) => string; id: string }) {
  const [detail, setDetail] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setDetail(await api(`/photo-picker/api/projects/${id}`))
      setPhotos(await api(`/photo-picker/api/projects/${id}/photos?limit=24`))
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  useEffect(() => {
    refresh()
    const events = new EventSource(`/photo-picker/api/projects/${id}/events`)
    events.onmessage = message => {
      const event = JSON.parse(message.data)
      setProgress(event)
      if (event.done === true) refresh()
    }
    return () => events.close()
  }, [id])

  const run = async (stage: string) => {
    try {
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ stage }),
      })
    } catch (cause) {
      setError(String(cause))
    }
  }

  if (detail === null) return <div style={{ fontSize: 12, color: '#9aa3b5' }}>{t('loading')}</div>

  const counts = detail.counts ?? {}
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <strong>{detail.name}</strong>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{detail.sourcePath}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9aa3b5' }}>{detail.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
        {Object.entries(counts).map(([state, count]) => (
          <span key={state} style={{ background: '#1a1f2a', borderRadius: 5, padding: '2px 8px' }}>
            {state}: {String(count)}
          </span>
        ))}
        {detail.running !== null && <span style={{ color: '#7ee2a8' }}>{t('running')}: {detail.running}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => run('scan')}>{t('scan')}</button>
        <button type="button" onClick={() => run('preprocess')}>{t('preprocess')}</button>
      </div>
      {progress !== null && (
        <div style={{ fontSize: 12, color: '#9aa3b5' }}>
          {progress.stage} {progress.done ?? 0}/{progress.total ?? '?'} {progress.error ?? ''}
        </div>
      )}
      {error !== null && <div style={{ color: '#ff8a80', fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
        {photos.map(photo => (
          <img key={photo.id} src={photo.thumbUrl} alt={photo.relPath} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, background: '#1a1f2a' }} />
        ))}
      </div>
    </div>
  )
}

function Workbench({ t }: { t: (key: string) => string }) {
  const isOpen = useOpen()
  const [projects, setProjects] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    api('/photo-picker/api/projects').then(setProjects).catch(cause => setError(String(cause)))
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.72)', zIndex: 9000, display: 'grid', placeItems: 'center', pointerEvents: 'auto' }}>
      <div style={{ width: 'min(980px, 92vw)', maxHeight: '88vh', overflow: 'auto', background: '#12161f', color: '#e8eaf0', border: '1px solid #2a2f3a', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <strong style={{ fontSize: 16 }}>{t('title')}</strong>
          <button type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>{t('close')}</button>
        </div>
        {error !== null && <div style={{ color: '#ff8a80', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {selected !== null ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setSelected(null)}>{t('projects')}</button>
            <ProjectDetail t={t} id={selected} />
          </div>
        ) : creating ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setCreating(false)}>{t('projects')}</button>
            <CreateForm t={t} onCreated={id => { setCreating(false); setSelected(id); api('/photo-picker/api/projects').then(setProjects).catch(() => {}) }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setCreating(true)}>{t('newProject')}</button>
            {projects.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9aa3b5' }}>{t('empty')}</div>
            ) : projects.map(project => (
              <button type="button" key={project.id} onClick={() => setSelected(project.id)} style={{ textAlign: 'left', padding: 10 }}>
                {project.name} · {project.sourcePath}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Panel({ t }: { t: (key: string) => string }) {
  return <Workbench t={t} />
}

export const inject = ['slots', 'locale']

export function apply(ctx: any) {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'photo-picker.locale')
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'photo-picker-launcher', order: 60 },
    () => <Launcher t={t} />,
  ))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'photo-picker-panel', order: 60 },
    () => <Panel t={t} />,
  ))
}
```

- [ ] **Step 3: 更新 `plugin/package.json`（加 client 出口与注入）**

把 `exports`、`files`、`dsh` 三个字段改成下面这样（这是**字段片段**，不是独立 JSON；保留 `name`/`version`/`private`/`type`/`dependencies` 原样，拼成合法 JSON）：

```json
  "exports": {
    ".": "./index.js",
    "./client": "./dist/client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": [
    "index.js",
    "src",
    "dist",
    "cordis.patch.yml",
    "locale/*.json",
    "icon.svg"
  ],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-locale"
      ]
    }
  }
```

- [ ] **Step 4: 构建并检查产物**

```bash
npm run build:client
node --check plugin/dist/client.js
head -5 plugin/dist/client.js
```

Expected: `built plugin/dist/client.js`；`node --check` 无输出；文件开头是 `window.__ModuleLoader__.load({`。

- [ ] **Step 5: 重新安装并验证界面**

先 `plugin_manager` 再次 `install_bundle`（同 target）。Expected: `application: applied`；如果返回 `restart-required`，请用户重启 DSH Web 并重开会话。若安装器因为“同名包已安装”拒绝覆盖，先用 `remove_bundle` 移除旧 bundle，再 `install_bundle` 重装（两次都需要用户批准）。

然后用 Chrome DevTools MCP：
1. `navigate_page` 到 `http://127.0.0.1:3080`；
2. `take_snapshot`，在输入框附近找到“照片工作台”按钮；
3. 点击，`take_screenshot` 确认面板出现；
4. 点“新建项目”，用系统对话框或手填一个真实照片目录，创建；
5. 点“开始扫描”“开始预处理”，观察进度与缩略图。

Expected: 面板可见、可关闭、能建项目、能看到状态计数与缩略图。若按钮不在 composer dock，改用 `cordis_inspect_query` 查 `Slots.listSubTree` 找到 `conversation.composer.dock` / `shell.overlay` 的实际注册参数后修正。若浏览器控制不可用，至少用 `cordis_inspect_query` 确认 Client 模块与两个插槽注册已加载，并在交付说明里写明“视觉验收未做”。

- [ ] **Step 6: 提交**

```bash
git add scripts/build-client.mjs plugin/src/client plugin/dist/client.js plugin/package.json
git commit -m "feat: add photo picker web panel"
```

---

## Task 9：Agent 工具 `photo_picker`（v1）

**Files:**
- Create: `plugin/src/host/tools.js`
- Modify: `plugin/src/host/service.js`（注册工具）
- Test: `plugin/test/tools.test.js`

- [ ] **Step 1: 写失败测试**

`plugin/test/tools.test.js`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createPhotoPickerTool } from '../src/host/tools.js'

test('photo_picker list returns a JSON string result', async () => {
  const tool = createPhotoPickerTool({
    async listProjects() { return [{ id: 'p1', name: 'demo' }] },
  })
  const value = await tool.execute({ action: 'list' }, {})
  assert.equal(typeof value.result, 'string')
  assert.deepEqual(JSON.parse(value.result), [{ id: 'p1', name: 'demo' }])
})

test('photo_picker run_stage starts a stage', async () => {
  const started = []
  const tool = createPhotoPickerTool({
    async resolveProject(ref) { assert.equal(ref, 'demo'); return 'p1' },
    async startStage(id, stage) { started.push([id, stage]); return { started: stage } },
  })
  const value = await tool.execute({ action: 'run_stage', project: 'demo', stage: 'scan' }, {})
  assert.deepEqual(started, [['p1', 'scan']])
  assert.deepEqual(JSON.parse(value.result), { started: 'scan' })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test plugin/test/tools.test.js
```

Expected: FAIL，`Cannot find module .../tools.js`。

- [ ] **Step 3: 写工具实现**

`plugin/src/host/tools.js`：

```js
import { defineTool } from '@deepseek-ai/dsh-tools'

/** 给 agent 的 v1 工具：建/列/查项目，跑扫描与预处理。 */
export function createPhotoPickerTool(service) {
  return defineTool({
    name: 'photo_picker',
    description:
      '管理照片工作台项目：创建本地照片项目、列出或查看项目、运行扫描（scan）或本地预处理（preprocess）。'
      + '创建项目时 source 必填；不知道照片目录就先问用户，不要默认当前目录。',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['create', 'list', 'get', 'run_stage', 'status'],
        description: 'create / list / get / run_stage / status',
      },
      project: { type: 'string', description: '项目 id 或名称（get / run_stage / status 必填）' },
      source: {
        type: 'object',
        description: 'create 必填：本机照片目录',
        properties: {
          kind: { type: 'string', required: true, enum: ['local'] },
          path: { type: 'string', required: true },
        },
      },
      name: { type: 'string', description: '项目名；省略时取文件夹名' },
      theme: { type: 'string', enum: ['portrait', 'landscape', 'event', 'mixed'] },
      budgetCny: { type: 'number' },
      stage: { type: 'string', enum: ['scan', 'preprocess'] },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          result: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.result }],
    },
    async execute(args) {
      let payload
      switch (args.action) {
        case 'create':
          payload = await service.createProject({
            source: args.source,
            name: args.name,
            theme: args.theme,
            budgetCny: args.budgetCny,
          })
          break
        case 'list':
          payload = await service.listProjects()
          break
        case 'get':
        case 'status':
          payload = await service.getProjectDetail(await service.resolveProject(args.project))
          break
        case 'run_stage':
          payload = await service.startStage(
            await service.resolveProject(args.project),
            args.stage,
          )
          break
        default:
          throw new Error(`unsupported action: ${args.action}`)
      }
      return { result: JSON.stringify(payload) }
    },
  })
}
```

- [ ] **Step 4: 在服务里注册工具**

在 `plugin/src/host/service.js` 的 import 区加：

```js
import { createPhotoPickerTool } from './tools.js'
```

在构造函数里、`webServer.register` 的 `ctx.effect` 后面加：

```js
    ctx.effect(() => ctx.tools.register(createPhotoPickerTool(this)), 'photo-picker.tool')
```

- [ ] **Step 5: 运行全部测试**

```bash
npm test
```

Expected: 7 个测试文件全部 PASS。

- [ ] **Step 6: 重新安装并验证工具**

再次 `install_bundle`（或按需重启）。然后用 `cordis_inspect_query` 查 `Tool`，确认 `photo_picker` 在工具表里。

在对话里让 agent 调用一次：

> 用 photo_picker 列出项目。

Expected: 返回项目 JSON；没有项目时返回空数组。

- [ ] **Step 7: 提交**

```bash
git add plugin/src/host/tools.js plugin/src/host/service.js plugin/test/tools.test.js
git commit -m "feat: add photo_picker agent tool"
```

---

## Task 10：验收（无头 + 界面 + 恢复）

**Files:**
- Create: `scripts/make-fixtures.mjs`
- Create: `scripts/acceptance-phase1.mjs`

- [ ] **Step 1: 写 fixture 生成脚本**

`scripts/make-fixtures.mjs`：

```js
import sharp from 'sharp'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.argv[2] ?? '/tmp/pp-fixtures'
await rm(root, { recursive: true, force: true })
await mkdir(root, { recursive: true })

function noise(width, height, seed) {
  const data = Buffer.allocUnsafe(width * height * 3)
  let state = seed >>> 0
  for (let i = 0; i < data.length; i += 3) {
    state = (state * 1664525 + 1013904223) >>> 0
    data[i] = state & 0xff
    data[i + 1] = (state >>> 8) & 0xff
    data[i + 2] = (state >>> 16) & 0xff
  }
  return sharp(data, { raw: { width, height, channels: 3 } })
}

const noisy = (file, width, height, seed) =>
  noise(width, height, seed).jpeg({ quality: 90 }).toFile(file)

for (let i = 0; i < 40; i++) await noisy(path.join(root, `u-${String(i).padStart(2, '0')}.jpg`), 2000, 1500, i + 1)
for (let i = 0; i < 20; i++) await copyFile(path.join(root, `u-${String(i).padStart(2, '0')}.jpg`), path.join(root, `d-${String(i).padStart(2, '0')}.jpg`))
for (let i = 0; i < 20; i++) {
  // 每张白图带一个位置不同的黑点：字节不同（不去重），但仍是过曝图。
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1500">
    <rect width="2000" height="1500" fill="#ffffff"/>
    <rect x="${10 + i * 60}" y="10" width="12" height="12" fill="#000000"/>
  </svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(root, `w-${String(i).padStart(2, '0')}.jpg`))
}
for (let i = 0; i < 20; i++) await noisy(path.join(root, `s-${String(i).padStart(2, '0')}.jpg`), 800, 600, 1000 + i)
for (let i = 0; i < 20; i++) await noisy(path.join(root, `p-${String(i).padStart(2, '0')}.jpg`), 2000, 1500, 2000 + i)

console.log(JSON.stringify({ root, photos: 120 }))
```

生成：

```bash
npm run fixtures
```

Expected: `{"root":"/tmp/pp-fixtures","photos":120}`。

- [ ] **Step 2: 写无头验收脚本**

`scripts/acceptance-phase1.mjs`：

```js
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../plugin/src/host/projects.js'
import { LocalSource } from '../plugin/src/host/source.js'
import { scanProject } from '../plugin/src/host/scan.js'
import { preprocessProject } from '../plugin/src/host/preprocess.js'

const sourcePath = process.argv[2] ?? '/tmp/pp-fixtures'
const base = mkdtempSync(path.join(tmpdir(), 'pp-accept-'))
const store = new ProjectStore({
  dshHome: path.join(base, 'dsh'),
  workspaceRoot: path.join(base, 'work'),
})

const project = await store.create({ source: { kind: 'local', path: sourcePath }, name: 'acceptance' })
const { db } = await store.open(project.id)
const source = new LocalSource(project.sourcePath)

const scan = await scanProject({ db, projectId: project.id, source })
console.log('scan', scan)
assert.equal(scan.photos, 120)
assert.equal(scan.skipped, 0)

const pre = await preprocessProject({
  db,
  projectId: project.id,
  sourceRoot: project.sourcePath,
  workspaceDir: project.workspaceDir,
})
console.log('preprocess', pre)

const counts = Object.fromEntries(
  db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
    .all(project.id).map(row => [row.state, row.n]),
)
console.log('counts', counts)
assert.equal(counts.filtered_dup, 20)
assert.equal(counts.filtered_small, 20)
assert.equal(counts.filtered_exposure, 20)
assert.ok(counts.ok >= 20, `expected survivors, got ${JSON.stringify(counts)}`)

const thumbs = db.prepare("SELECT COUNT(*) AS n FROM photos WHERE thumb_path IS NOT NULL").get().n
assert.ok(thumbs > 0)
console.log('PASS', { workspace: project.workspaceDir, counts, groups: pre.groups })
```

运行：

```bash
npm run acceptance:1
```

Expected: 打印 `PASS`，且 `filtered_dup=20`、`filtered_small=20`、`filtered_exposure=20`、`ok>=20`。

- [ ] **Step 3: 界面验收**

1. Chrome 打开 `http://127.0.0.1:3080`，点“照片工作台”；
2. 新建项目，文件夹填 `/tmp/pp-fixtures`（或用系统对话框选它）；
3. 点“开始扫描”，等状态变成 `scanned`；
4. 点“开始预处理”，等状态变成 `preprocessed`；
5. 确认缩略图墙出现、状态计数与无头脚本一致；
6. 在预处理进行中强杀 DSH Web 进程，重启后再点“开始预处理”，确认已处理的照片不会重复处理（`dhash IS NULL` 过滤 + 幂等）。

Expected: 界面显示计数与缩略图；重启后能继续/补齐，不重复处理并已处理的照片。

- [ ] **Step 4: 全量测试**

```bash
npm test
npm run acceptance:1
git status --short
```

Expected: 测试全 PASS；验收脚本 PASS；工作区只有预期改动。

- [ ] **Step 5: 提交**

```bash
git add scripts/make-fixtures.mjs scripts/acceptance-phase1.mjs
git commit -m "test: add phase 1 acceptance fixtures and script"
```

---

## 计划 1 完成定义

- `photo_picker` 工具能在创造者模式里创建本机项目、跑扫描与预处理。
- Web UI 有“照片工作台”入口、空态选择文件夹、项目列表、扫描/预处理按钮、状态计数与缩略图。
- `npm test` 全绿；`npm run acceptance:1` 输出 PASS。
- 源目录只读（扫描/预处理前后 `mtime` 不变）。
- 预处理中断后重启能续跑，不重复处理已完成项。

---

## 后续里程碑（Plan 1 验收后细化）

> 这三份计划会在前一份验收通过后再写成同规格的详细计划。原因：DSH 的插槽 props、工具 schema 细节和真实 SMB 行为必须以创造者模式里的实测为准，现在写死会返工。

**计划 2：网络源 + AI 批量流水线**
- SMB/NFS 连接（`open` + `/Volumes` 轮询）、健康检查、断线暂停/续跑。
- 预算/并发/重试/离峰限制；费用预估。
- 网格拼图（sharp 合成 + SVG 编号）、粗筛提示词、解析容错、`grid_rejected → reject`。
- 组内排序、单张精评、结构化 JSON 校验、`decisions` 写入。
- 检查点数据与 SSE 进度、暂停/取消。

**计划 3：复核界面 + 导出 + 校准 + 工具收尾**
- 图墙（筛选/排序/多选/撤销）、单图过片（维度条/后期建议/EXIF）、组内对比。
- 检查点卡片、设置抽屉、导出对话框（硬链接/复制/manifest/dry-run）。
- 校准模式（80 张盲评、一致率、建议阈值）。
- `photo_picker_review` / `photo_picker_export` 工具。
- 全量验收：真实 1 万张、网络断线恢复、导出源零写入校验。

