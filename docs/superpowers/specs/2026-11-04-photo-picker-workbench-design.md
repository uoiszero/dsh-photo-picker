# 照片工作台（Photo Picker Workbench）设计

- **状态**：待评审（v1 设计稿）
- **日期**：2026-11-04
- **仓库**：`dsh-photo-picker`（DSH 插件 bundle，尚未公开发布）
- **目标读者**：实现者（未来的创造者模式会话）、项目所有者
- **决策来源**：与所有者的分节讨论（形态、复核流程、自动化节奏、网络路径、输出方式）

---

## 0. 一句话

在 DeepSeek Harness 里做一个照片工作台：选一个照片文件夹（本机或网络共享），自动完成「预处理 → 网格粗筛 → 单张精评」，把几万张收敛到几百上千张候选，再在图墙 / 单图 / 组对比里人工复核，最后把 keep / maybe 硬链接导出到新目录。AI 负责缩小范围，最终决定权在用户。

### 0.1 术语

- **扫描候选（candidate）**：通过扫描与本地预处理、进入 AI 粗筛的照片。
- **入选**：被网格粗筛选中的照片。
- **候选集（shortlist）**：单张精评后进入人工复核的 keep + maybe。
- **组**：连拍或同场景的照片集合。
- **检查点**：阶段结束时的统计与抽样快照，默认可回看但不阻塞。

---

## 1. 背景与目标

### 1.1 背景

- 所有者有**数万张**（1 万–5 万）照片需要筛选，现有流程靠人眼逐张过，耗时且容易疲劳。
- DeepSeek V4.1 Flash（模型 id `deepseek-flash`）在本机路由上支持图片输入、1M 上下文，单张图片有像素预算（约缩到长边 1300 等效像素），适合「网格图粗筛 + 单图精评」的分层策略。
- 所有者要求成品是 **DSH 创造者模式插件**（工作台长在 Harness Web UI 里），而不是独立应用；AI 批量判断由插件执行，agent 负责调度、抽检与解释（方案 3）。

### 1.2 成功标准

1. 5 万张照片从建项目到产出候选集，**全程无人值守**（可在夜间跑完）；中途不需要人工干预，除非预算触顶、网络中断，或用户主动开启“阶段间暂停”。
2. 离峰时段总 API 成本控制在 **20 元人民币以内**（默认预算上限 30 元，可调）。
3. 人工复核 1500 张候选的时间不超过 **60 分钟**，且三个视图之间决策状态一致。
4. 导出的 keep / maybe 目录可直接使用，**源目录零写入**，可反复重跑。
5. 断网、崩溃、预算触顶、模型返回坏 JSON 都不会丢进度，恢复后从断点继续。
6. 提示词/AI 判断可校准：用 80 张盲评对照，得到一致率与建议阈值，再决定全量阈值。

### 1.3 关键约束

- 只支持 macOS（所有者本机）；Windows 不作一等公民。
- 源目录只读；工作区数据库与缩略图只放本地磁盘。
- 网络路径支持：已挂载的 SMB/NFS 网络盘、未挂载的 SMB/NFS 共享。云盘/对象存储本期不做。
- 模型调用走 DSH 的 LLM 路由（`ctx.llm`），复用 DSH 的凭据与计费；不在插件内保存 API Key。

---

## 2. 非目标

- 不做云盘 / 对象存储 / WebDAV / S3。
- 不做 RAW 显影、任何像素编辑（调色、裁剪执行、旋转落盘）。
- 不做人脸识别、人物分组、客户交付与分享。
- 不做视频、Live Photo 动态部分。
- 不写 Lightroom / Capture One catalog，不写 XMP（后续可扩展）。
- 不做多人协作、权限体系、远程 Web 多用户。
- 不做 Windows 一等支持（路径选择器、挂载流程均按 macOS 设计）。
- 不把工作台做成通用图片管理器（只服务「筛选出片」这一个目标）。

---

## 3. 形态与集成

### 3.1 交付物

一个可安装进当前 DSH Web profile 的插件包 `dsh-photo-picker`，包含：

| 部件 | 类型 | 职责 |
|---|---|---|
| Host 插件 | Cordis Host 插件 | 项目、扫描、预处理、分组、拼网格、AI 批量调用、预算与限流、断点续跑、导出、本地 HTTP API |
| Client 插件 | Web UI 插件（React） | 全屏工作台面板、图墙 / 单图 / 组对比、检查点、设置、导出对话框；通过 Host HTTP API 读写状态 |
| Agent 工具 | Host 工具插件 | `photo_picker`、`photo_picker_review`、`photo_picker_export` 三个工具，给 agent 调度与解释 |

### 3.2 建立方式

- 用**创造者模式**会话开发：在 `photo-picker` 工作区里写 bundle，用 `plugin_manager action=install_bundle` 安装进当前 profile，用 `cordis_inspect_query` 验证注册，用已连接的 Chrome 在 Harness Web UI 里验收。
- 当前会话不是创造者模式（工具集中无 `plugin_manager` / `cordis_inspect_*`）；开工时需新开创造者模式会话，工作目录不变。
- 安装后影响该 profile 的所有会话，重启后仍存在。

### 3.3 依赖的 DSH 能力（均已核对可用）

- `ctx.llm`：请求模型，图片以 `ImageBlock` 形式携带；请求会经过附件服务归一化并按路由缩放。
- `ctx.attachments`：把本地生成的网格图/预览图变成可发送的图片附件。
- `ctx.webServer.register()`：注册命名 HTTP 路由，给前端供缩略图、大图和 JSON API；`registerUpgrade` 不用于本期。
- `node:sqlite`（Node 22.23 内置）：持久化，避免引入原生 SQLite 依赖。
- `sharp`：本地解码、缩放、灰度/直方图、网格拼图（实测 0.35.5 / libvips 8.18.7；预编译版不含 HEVC 解码，不能直接读 HEIC）。
- `exifr`：纯 JS EXIF 解析；`nanoid`：id 生成。
- `sips`：HEIC/RAW → JPEG 的**必需**路径（macOS 自带；实测 6016² HEIC 转 1600px JPEG 约 0.4s）。
- `osascript`：本机原生文件夹选择对话框（best-effort，需要图形会话与自动化权限）。
- `open` + `/Volumes` 轮询：未挂载 SMB/NFS 的 macOS 原生连接方式。

---

## 4. 用户流程

### 4.1 首次建项目（必须先选文件夹）

1. 用户从侧栏打开「照片工作台」，空状态第一屏就是 **选择照片文件夹**，不会默认当前目录。
2. 用户选本机目录，或网络位置（已挂载卷 / 输入 `smb://...`）。
3. 工作台校验路径并统计：文件数、格式分布、总大小、预计耗时/费用。
4. 用户设定：项目名（默认取目录名）、题材模板（人像/风光/活动/混合，默认混合）、预算上限（默认 30 元）、是否只在离峰时段跑。
5. 建项目成功后，面板显示阶段流水线；用户可以「开始」，也可以先在对话里让 agent 操作。

### 4.2 自动跑 + 检查点

- 依次执行：扫描 → 预处理 → 网格粗筛 → 精评。每个阶段结束生成检查点并**默认自动进入下一阶段**；设置里可开“阶段间暂停”，开了才逐段停下。
- 检查点可随时回看：展示统计与抽样；可继续（仅在开启“阶段间暂停”时需要）、抽样看、调阈值/提示词、回退重跑本阶段。
- 粗筛后可选「先试跑 80 张校准」：随机抽样跑完整流程，用户盲评，得到一致率与建议阈值。

### 4.3 人工复核

- 图墙（默认）→ 双击进单图 → G 进组对比；三个视图共享决策。
- 快捷键：`J/K` 前后、`P` keep、`X` reject、`M` maybe、`Space` 图墙、`G` 组对比、`Esc` 收起面板。
- 支持批量选择与撤销。

### 4.4 导出

- 导出对话框选择目标目录（仅本机路径）、分桶（默认 keep + maybe，可选 reject）、硬链接/复制、命名策略。
- 先 dry-run 汇总，确认后执行，写 manifest。

---

## 5. 架构

### 5.1 组件与依赖方向

```
┌────────────────────────────────────────────────────────────┐
│ Harness Web UI                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Client 插件：照片工作台面板（shell.overlay）          │  │
│  │  - 图墙 / 单图 / 组对比 / 检查点 / 设置 / 导出        │  │
│  │  - 只通过 Host HTTP API 读写状态，不直接碰磁盘        │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────┘
                           │ HTTP（loopback）+ SSE
┌──────────────────────────▼─────────────────────────────────┐
│ Host 插件 dsh-photo-picker                                  │
│  - PhotoPickerService（ctx.photoPicker）                    │
│  - PhotoSource：Local / Smb（挂载点上的普通 fs）            │
│  - Pipeline：Scan → Preprocess → Grid → Score → Export      │
│  - AI：ctx.llm + ctx.attachments；预算/并发/重试/续跑       │
│  - Storage：node:sqlite + 本地缩略图/预览/网格图            │
│  - HTTP API + 静态媒体路由                                  │
│  - Agent 工具：photo_picker / _review / _export             │
└────────────────────────────────────────────────────────────┘
```

### 5.2 关键设计原则

- **单一事实来源**：所有状态在 Host 的 SQLite；Client 和 agent 工具都读写同一服务，不做两份缓存。
- **流水线可恢复**：每个阶段有游标；AI 结果按幂等键落库，重跑只补缺。
- **源目录只读**：扫描/读取不改源文件；导出只写用户选择的目标目录。
- **网络透明**：`PhotoSource` 接口隔离本地与网络；流水线只看到 `list / stat / openRead / health`。
- **不静默丢图**：任何过滤或解析失败都记为明确状态，可在面板筛出并复核。

### 5.3 本地 HTTP API（loopback）

| 路由 | 用途 |
|---|---|
| `GET /photo-picker/api/projects` | 项目列表 |
| `POST /photo-picker/api/projects` | 建项目（含 source 校验） |
| `GET /photo-picker/api/projects/:id` | 项目详情 + 阶段状态 + 费用 |
| `PATCH /photo-picker/api/projects/:id` | 改设置（题材/阈值/预算/并发） |
| `POST /photo-picker/api/projects/:id/actions` | `start` / `pause` / `resume` / `rerun_stage` / `cancel` |
| `GET /photo-picker/api/projects/:id/photos` | 分页 + 筛选 + 排序（图墙数据） |
| `GET /photo-picker/api/projects/:id/photos/:pid` | 单张详情（AI 维度、EXIF、建议、理由） |
| `GET /photo-picker/api/projects/:id/groups/:gid` | 组内成员与排名 |
| `POST /photo-picker/api/projects/:id/decisions` | 批量/单张改判 |
| `GET /photo-picker/api/projects/:id/checkpoints` | 检查点数据 |
| `POST /photo-picker/api/projects/:id/calibration` | 启动校准 |
| `POST /photo-picker/api/projects/:id/export/preview` | dry-run |
| `POST /photo-picker/api/projects/:id/export/run` | 执行导出 |
| `GET /photo-picker/api/fs/list?path=` | 目录浏览（选择器） |
| `POST /photo-picker/api/fs/choose` | 调 `osascript` 原生选文件夹 |
| `POST /photo-picker/api/fs/connect` | 连接 SMB/NFS（open + 轮询挂载） |
| `GET /photo-picker/api/events` | SSE：阶段进度、费用、错误、检查点 |

所有 API 只监听 loopback；不鉴权（与 DSH Web 同机），但拒绝非本机来源的写操作。

### 5.4 媒体路由

- `GET /photo-picker/media/thumb/:photoId`：384px 长边 WebP q75，图墙与网格拼装共用。
- `GET /photo-picker/media/preview/:photoId`：最长边 1600px JPEG q85，单图/组对比用，首次请求时生成并缓存。
- `GET /photo-picker/media/grid/:gridId`：网格图（调试与检查点抽样）。
- 响应带 ETag 与长缓存；文件不存在返回 404 并在面板显示占位。

### 5.5 工作区布局

- 默认工作区：`~/Pictures/PhotoPicker/<项目 slug>/`，建项目时可改；始终在本地磁盘。
- 目录内容：`db.sqlite`、`thumbs/`、`previews/`、`grids/`、`logs/`、`exports/`（仅当用户选择默认导出位置时使用）。
- 源目录与网络盘只读：工作区绝不建在源目录或网络盘里（若用户选了源目录内的路径，拒绝并提示）。
- 删除项目：默认只删本地工作区（二次确认，列出将删除的内容），源目录与已导出结果永不受影响。

---

## 6. 照片源与路径选择

### 6.1 选择入口

- 工作台空状态第一屏：三个 tab —— **本机**（目录树 + “用 macOS 对话框选择” + 最近使用）、**网络位置**（已挂载卷 + “连接 SMB…”）、**最近项目**。
- 对话里：`photo_picker` 的 `create` 动作 `source` 为必填；缺失时返回结构化错误 `NEED_SOURCE`，提示 agent 先询问用户“照片在哪个文件夹？本机还是网络共享？”。**绝不默认当前目录。**

### 6.2 本机路径

- 目录树通过 `GET /api/fs/list?path=` 浏览；隐藏目录默认不显示，可切换。
- “用 macOS 对话框选择”：Host 执行 `osascript -e 'choose folder'`，返回 POSIX 路径；超时 120s；失败（无图形会话/无自动化权限）回退为手工输入路径并给出提示。
- 手工输入支持 `~/` 展开、相对路径拒绝、规范化后显示真实路径。

### 6.3 网络路径

**已挂载网络盘**：列出 `/Volumes/*` 中非系统卷，标注文件系统类型与容量；选中后按本地路径处理。

**未挂载 SMB/NFS**：
1. 用户输入 `smb://[user@]server/share` 或 `nfs://server/export`。
2. Host 调 `open "smb://..."` 让 Finder 弹出系统登录框；用户完成登录。
3. Host 轮询 `/Volumes`，匹配到新挂载点后记录 `mountPoint`；若 90s 内未出现，返回 `MOUNT_TIMEOUT` 并提示手动挂载。
4. 挂载点解析结果写入 `projects.source.mountPoint`；后续读写都走该路径。
5. **密码不落库、不写日志、不拼进持久化 URL**；由系统 Keychain 管理。无人值守场景要求共享已挂载或 Keychain 已记住凭据。

**卸载**：不自动卸载（避免影响 Finder 里其它正在使用的应用）；设置里提供“断开网络盘”动作，执行前确认无进行中阶段。`mounts.auto_mounted` 只记录连接是否由工作台发起，用于展示。

### 6.4 路径校验（建项目前）

- 路径存在、是目录、可读。
- 递归列出全部文件名并 `stat`（不解码），统计数量、格式分布、总大小；文件数超过 10 万时降级为抽样估算并明确标注“估算”。
- 不支持的文件不阻断，但计入“其他文件”。
- 估算：预计扫描时长、预处理时长、传输量（网络源）、网格/精评次数与费用。
- 校验结果作为确认页展示，用户确认后才写库。

### 6.5 网络源的特殊处理

- **数据库、缩略图、预览、网格图只放本地工作区**，绝不放网络盘（SQLite over SMB 会损坏）。
- **传输策略**：网络源默认整文件流式读取后本地生成缩略图与指标；HEIC/RAW 先尝试抽取内嵌预览（`sips` 或 EXIF 缩略图），抽不到再整文件读取。项目确认页给出“预计传输量”警告。
- **断线**：读写抛 `ENOENT`/`EIO`/`ETIMEDOUT` 时，阶段进入 `paused`，记录 `network_lost`，面板提示“网络断开，已暂停”；每 15s 健康检查（stat 根目录），恢复后从游标续跑；连续 5 次健康检查失败才把阶段标 `failed`。
- **只读挂载**：记录 `readOnly` 标志；导出目标若落在同一网络盘上，给出“跨盘复制会较慢”的提示。

---

## 7. 数据模型

SQLite（WAL 模式），库文件位于项目工作区。所有时间戳为 Unix ms。

### 7.1 projects

| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | nanoid |
| name | TEXT | 项目名 |
| workspace_dir | TEXT | 本地工作区绝对路径 |
| source_kind | TEXT | `local` / `smb` / `nfs` |
| source_path | TEXT | 规范化路径或 URL（不含密码） |
| mount_point | TEXT NULL | SMB/NFS 挂载点 |
| source_readonly | INTEGER | 0/1 |
| theme | TEXT | `portrait` / `landscape` / `event` / `mixed`（默认 mixed） |
| model_route | TEXT | 默认 `deepseek-official` |
| model_id | TEXT | 默认 `deepseek-flash` |
| budget_cny | REAL | 默认 30 |
| concurrency | INTEGER | 默认 8，范围 1–16 |
| offpeak_only | INTEGER | 默认 0 |
| grid_cols / grid_rows | INTEGER | 默认 4 / 4 |
| threshold_keep / threshold_maybe | REAL | 默认 7.5 / 6.0 |
| stage_pause | INTEGER | 阶段间暂停，默认 0 |
| group_burst_seconds / group_burst_hamming | REAL / INTEGER | 连拍分组，默认 2s / 12 |
| group_scene_seconds / group_scene_hamming | REAL / INTEGER | 场景分组，默认 60s / 6 |
| prompt_version | TEXT | 默认 `v1` |
| status | TEXT | `created` / `scanning` / `scanned` / `preprocessing` / `preprocessed` / `gridding` / `gridded` / `scoring` / `scored` / `reviewing` / `exporting` / `done` / `paused` / `failed` |
| created_at / updated_at | INTEGER | |

### 7.2 photos

| 字段 | 说明 |
|---|---|
| id TEXT PK | nanoid |
| project_id TEXT | |
| rel_path TEXT | 相对源根目录，POSIX 分隔 |
| size_bytes INTEGER | |
| mtime_ms INTEGER | |
| format TEXT | `jpeg` / `png` / `webp` / `heic` / `raw` / `other` |
| width / height INTEGER | 解码后（含 EXIF 旋转） |
| orientation INTEGER | EXIF 原始方向 |
| taken_at INTEGER NULL | EXIF DateTimeOriginal |
| camera / lens TEXT NULL | 机型、镜头 |
| sha256 TEXT | 精确去重 |
| dhash TEXT | 64-bit 十六进制 |
| blur_score REAL | 拉普拉斯方差（归一化后） |
| clip_low / clip_high REAL | 亮度 ≤5 / ≥250 的像素占比 |
| group_id TEXT NULL | |
| thumb_path / preview_path TEXT NULL | 相对工作区 |
| state TEXT | `ok` / `unreadable` / `filtered_dup` / `filtered_blur` / `filtered_exposure` / `filtered_small` / `candidate` / `grid_selected` / `grid_rejected` / `grid_error` / `scored` |
| error TEXT NULL | |
| created_at INTEGER | |

唯一约束：`(project_id, rel_path)`。

### 7.3 groups

| 字段 | 说明 |
|---|---|
| id TEXT PK | |
| project_id TEXT | |
| kind TEXT | `burst` / `scene` |
| representative_photo_id TEXT | 技术最优（blur_score 最高） |
| size INTEGER | |
| started_at / ended_at INTEGER | 拍摄时间范围 |

### 7.4 grids

| 字段 | 说明 |
|---|---|
| id TEXT PK | |
| project_id TEXT | |
| seq INTEGER | 第几张网格 |
| cols / rows INTEGER | |
| image_path TEXT | 网格图相对路径 |
| cell_map_json TEXT | `{"A1": photoId, ...}` |
| status TEXT | `pending` / `selected` / `parse_failed` |
| selected_cells_json TEXT NULL | 模型返回的格子 |
| tokens_in / tokens_out INTEGER | |
| cost_cny REAL | |
| created_at INTEGER | |

### 7.5 stage_runs

| 字段 | 说明 |
|---|---|
| id TEXT PK | |
| project_id TEXT | |
| stage TEXT | `scan` / `preprocess` / `grid` / `rank` / `score` / `export` |
| status TEXT | `pending` / `running` / `paused` / `done` / `failed` / `cancelled` |
| cursor TEXT NULL | 续跑游标（如最后处理的 rel_path 或 seq） |
| stats_json TEXT | 计数、耗时、错误数 |
| cost_cny REAL | 本阶段累计 |
| error TEXT NULL | |
| started_at / finished_at INTEGER | |

### 7.6 assessments

| 字段 | 说明 |
|---|---|
| id TEXT PK | |
| project_id TEXT | |
| target_kind TEXT | `photo` / `group` |
| target_id TEXT | photoId 或 groupId |
| stage TEXT | `grid` / `rank` / `single` |
| model_route / model_id TEXT | |
| prompt_version TEXT | |
| score REAL NULL | 0–10（组排序时为空） |
| verdict TEXT NULL | `keep` / `maybe` / `reject` |
| dimensions_json TEXT NULL | 六维分数 |
| post_processing_json TEXT NULL | 建议数组 |
| reason TEXT NULL | 中文一句话，≤120 字 |
| raw_json TEXT | 原始返回，便于排查 |
| tokens_in / tokens_out INTEGER | |
| cost_cny REAL | |
| created_at INTEGER | |

幂等键：`(target_kind, target_id, stage, model_id, prompt_version)`。

### 7.7 decisions

| 字段 | 说明 |
|---|---|
| photo_id TEXT PK | |
| project_id TEXT | |
| verdict TEXT | `keep` / `maybe` / `reject` |
| note TEXT NULL | |
| source TEXT | `human` / `ai` |
| updated_at INTEGER | |

**最终判定规则**：存在 `source=human` 的记录则以其为准；否则取 AI 建议。网格落选的照片在粗筛阶段就写入 AI `reject`，默认不进复核队列（面板可切换“显示 AI 落选”查看）。只有 `grid_error`、精评失败等没有有效 AI 建议的照片才默认 `maybe`，进入人工复核。

### 7.8 exports / errors / mounts

- `exports`：id、project_id、dest、mode（hardlink/copy）、buckets_json、counts_json、manifest_path、status、created_at。
- `errors`：id、project_id、stage、photo_id NULL、code、message、created_at。
- `mounts`：id、url（不含密码）、mount_point、auto_mounted、status、last_seen_at。
- `calibration_reports`：id、project_id、sample_size、metrics_json（精确率/召回率/F1/一致率/阈值曲线）、suggested_threshold、created_at。

---

## 8. 流水线

### 8.1 L0 扫描

- 递归遍历源目录；跳过隐藏文件、`.DS_Store`、工作台自身目录（若工作区在源内）。
- 不跟随符号链接（避免环）；可配置。
- 每个文件读 EXIF（`exifr`）：拍摄时间、机型、镜头、方向。
- 单文件失败记 `errors`，继续；扫描结束给统计（文件数、格式分布、总大小、不可读数量）。

### 8.2 L1 本地预处理（零 API）

1. **精确去重**：流式计算 sha256；同哈希保留 `taken_at` 最早（无则路径字典序最小）的一张，其余 `filtered_dup`。
2. **解码**：JPEG/PNG/WebP 用 `sharp`；HEIC/RAW 一律先用 `sips -s format jpeg --resampleWidth 1600` 转临时 JPEG 再交给 sharp；其它异常再回退 sips。HEIC 不能靠 sharp 直读（预编译版缺 libde265，已实测报错）。
3. **单次解码派生**：每张图只解码一次到长边 1200 的缓冲，同时派生 384px 缩略图与 800px 灰度指标图，避免重复解码。
4. **指标**：
   - 宽高、EXIF 旋转后的实际尺寸；小于 200 万像素记 `filtered_small`。
   - `dhash`：9×8 灰度差分，64-bit。
   - `blur_score`：长边缩到 800 的灰度图上算拉普拉斯方差，除以尺寸归一化。
   - `clip_low` / `clip_high`：8-bit 灰度亮度 ≤5 / ≥250 的占比。
5. **技术过滤**（阈值均可在设置中改）：
   - 模糊：`blur_score < 40` 且位于本批最低 5% → `filtered_blur`。
   - 曝光：`clip_high > 0.4` 或 `clip_low > 0.6` → `filtered_exposure`。
   - 过小：< 200 万像素 → `filtered_small`。
   - 被过滤的照片**保留记录**，可在面板按状态查看，不静默删除。
6. **分组**（union-find，仅对 `ok` 照片）：
   - 连拍组：同机型 + `|Δt| ≤ 2s` + dHash 汉明距离 ≤ 12。
   - 同场景组：`|Δt| ≤ 60s` + 汉明距离 ≤ 6。
   - 每组选代表：`blur_score` 最高者。
   - 分组的时间窗与汉明阈值可在项目设置里调整（默认见上）。
7. 状态置为 `candidate`。

### 8.3 L2 网格粗筛

- 把候选按顺序切分为网格（默认 4×4 = 16 张）；**分组感知打包**：同组成员尽量连续放在同一格或相邻格，组不跨网格（除非单组超过 16 张）。
- 渲染：每格 320×240，用 `contain` 完整显示、**不裁切**（留白用中性灰），避免裁切影响构图判断；整图 1280×960，JPEG q90、`chromaSubsampling: 4:4:4`（保证编号文字清晰）；每格左上角叠加编号 `A1`–`D4`（可选附文件名后 4 位），编号顺序行优先。标签与分隔线用**一张 SVG 叠加**：sharp 预编译版的原生 `text` 输入不可用（实测输出空白），而 SVG 文本渲染已验证可用。网格不满 16 格时最后一格留空，提示词按实际张数替换。网格图按 `(cell_map, cell_size, label_style, encoder)` 哈希缓存，参数变化才重建；实测本机合成 + 编码约 170ms/张、约 290KB。
- 调用（每网格 1 次）：
  - system：摄影编辑助手，只输出 JSON。
  - user：网格图 + 提示词。
  - 参数：`temperature` 默认 0（如路由支持），`maxTokens` 256，超时 120s。
- 提示词 v1（完整版见 18.2）。
- 解析：
  1. 优先 `JSON.parse` 数组；失败用正则提取 `[A-D][1-4]` 形式的编号。
  2. 去重、丢弃越界编号。
  3. 空结果 → 用“必须选出至少 1 个”强化提示重试 1 次。
  4. 仍失败 → 该网格状态 `parse_failed`，网格内照片全部置 `grid_error`，**保留在人工复核队列**（默认 maybe，理由“网格解析失败”）。
- 命中照片置 `grid_selected`，其余 `grid_rejected`；`grid_rejected` 同时写入 `decisions(verdict=reject, source=ai)`。

### 8.4 L3 精评

**3a 组内排序（rank）**
- 对象：**入选网格数 ≥ 3** 的组（“入选数”指该组成员中被网格粗筛选中的张数）。
- 每次最多 6 张图（按网格入选顺序）；超过 6 张时分块排序：先取每块第一，再对块冠军做一次最终排序。
- 提示词：给出组内照片，要求返回 `{"order":["A","C","B"],"best":"A","reason":"..."}`。
- 每组默认保留 **1 张**（`best`）；组内入选张数 > 12 时保留前 2 张。组内非胜出者写 `decisions(verdict=reject, source=ai)`，不进复核队列。
- 结果存 `assessments(target_kind=group, stage=rank)`。

**3b 单张精评（single）**
- 对象：组内胜出者 + 入选数 <3 的组的全部入选照片 + 未分组且入选网格的照片 + `grid_error` 照片。
- 每张 1 次调用；图片按路由预算缩放（长边 ≤1300）。
- 输出固定 JSON（完整提示词见 18.2）：
  ```json
  {
    "score": 8.2,
    "dimensions": {
      "composition": 8, "light": 7, "color": 8,
      "technique": 9, "post_potential": 7, "moment": 6
    },
    "verdict": "keep",
    "post_processing": ["crop_right", "straighten_+1.5", "exposure_+0.3"],
    "reason": "主体清晰，侧光有层次，右侧可裁掉杂物"
  }
  ```
- 校验：`score` 数值 0–10；`verdict` ∈ keep/maybe/reject；`dimensions` 六键齐全（缺失补 `null` 并记警告）；`reason` 提示词要求 ≤60 字，入库超过 120 字截断；`post_processing` 仅接受白名单代码（未知代码保留在 raw，不展示）。
- 解析失败 → 重试 1 次（追加“只返回合法 JSON”）；再失败记 `errors`，该照片默认 `maybe`。

**3c 收敛**
- `keep`：`score ≥ threshold_keep`（默认 7.5）。
- `maybe`：`threshold_maybe ≤ score < threshold_keep`（默认 6.0–7.5）。
- `reject`：其余。
- AI 结果写入 `decisions(source=ai)`；人工改判写 `source=human` 覆盖。

### 8.5 校准模式

- 入口：粗筛检查点里的“先试跑校准”，或建项目时勾选。
- 抽样：按时间分层随机抽 80 张（覆盖不同拍摄时段与组），跑完整 L1–L3；照片总数不足 80 时全量。
- 面板进入盲评：只显示照片，不显示 AI 分数；用户逐张标 keep/maybe/reject。
- 揭示后计算：
  - keep 的精确率 / 召回率 / F1（以人工为准）。
  - 人工与 AI 的一致率（三分类）。
  - 分数与人工 keep 的阈值曲线，给出 F1 最大的阈值建议。
- 报告存 `calibration_reports`（见 7.8），可一键应用建议阈值。

### 8.6 费用、并发、限流、预算

- **价格假设**（本机 cost-meter 表）：离峰输入 1 元/M、输出 4 元/M；高峰（工作日 9:00–12:00、14:00–18:00）单价 ×2；每张图片最多约 1024 个视觉 token。
- **预估公式**（建项目/检查点展示）：
  - 网格调用数 ≈ 候选数 / 16；单次输入 ≈ 1100 token，输出 ≈ 80。
  - 组排序调用数 ≈ 含 ≥3 张入选的组数；单次输入 ≈ 1300，输出 ≈ 120。
  - 单张调用数 ≈ 组内胜出数 + 未分组入选数；单次输入 ≈ 1100，输出 ≈ 200。
  - 成本 = 输入/1e6×1 + 输出/1e6×4（高峰 ×2）。
  - 参考量级（5 万张、预处理保留 25%、粗筛选 30%）：输入约 4–5M token、输出约 0.6M token，离峰约 **5–10 元**，高峰约 10–20 元。
- **并发**：默认 8，范围 1–16；每个调用独占一个槽位。
- **重试**：429/5xx/超时 → 指数退避 1s、2s、4s（尊重 `Retry-After`），最多 3 次；连续 10 次失败暂停阶段并提示。
- **预算**：按响应 usage 实时累计（含缓存 token 按实际返回计）；达到 `budget_cny` 时暂停，弹检查点“预算已用完”；可提高预算继续。
- **离峰**：`offpeak_only=1` 时，高峰时段不发起新调用，面板显示下一次可跑时间；进行中的阶段在高峰到来前完成当前批后暂停。
- **全局串行**：同一时间只运行一个项目的 AI 阶段，其他项目排队，避免并发叠加触发限流；可在设置里放宽。

### 8.7 断点续跑

- 阶段开始写 `stage_runs`，每完成一个工作单元更新 `cursor` 并批量提交（每 20 条或 2s）。
- 进程重启后：`status=running` 的阶段重置为 `paused`，面板提示“上次中断，是否继续”；继续时从 `cursor` 之后开始。
- AI 结果幂等：已存在相同幂等键的 assessment 直接跳过，不重复计费。

---

## 9. 工作台界面

### 9.1 外壳

- **入口（2026-11-04 修订）**：左侧栏固定菜单项「照片工作台」（`sidebar.panellist`），点击后在右侧主区域打开工作台页面（`main` keyed slot）；与「自动化任务」「上下文洞察」同一种模式。不再使用全屏浮层或输入框旁的按钮。
- 页面占满主区域，标题行 + 960px 内容列，容器与控件继承 DSH 主题 token（`--dsw-alias-*`）。
- 顶部项目栏：项目名、源路径徽标（本机 / SMB / NFS + 路径 hover 显示）、阶段芯片、候选计数、已花费/预算、暂停/继续、设置。
- 阶段芯片点击可看该阶段统计与检查点。
- 主操作是「自动跑（扫描→精评）」按钮，放在最前；单个阶段收进「单步运行」下拉菜单，避免一排按钮抢注意力。
- 自动跑结束必须有明确提示：完成/暂停/失败时在右下角弹出可关闭的 toast（含完成的阶段链或下一阶段），不依赖用户盯进度条。

### 9.2 三个视图

**A 图墙（默认）**
- 虚拟滚动网格，缩略图 384px，角标 AI 分数 + keep/maybe/reject 色带；人工改判后显示人工标记。
- 筛选：全部 / AI keep / AI maybe / AI reject / 已改判 / 未分组 / 解析失败 / 技术过滤。
- 排序：AI 分数、拍摄时间、分组、路径。
- 多选 + 批量 keep/maybe/reject；撤销（最近 20 步）。
- 双击进单图；`G` 进组对比（有组时）。

**B 单图过片**
- 大图（1600px，可缩放平移）；右侧：AI 分数、六维条形、后期建议 chips、EXIF、理由；底部胶片条显示相邻照片。
- 操作：`J/K` 前后、`P/X/M` 判定、`Space` 回图墙；显示“第 n / 总候选”。
- 后期建议代码本地化显示（`crop_right` → “向右裁剪”等）。

**C 组内对比**
- 同组 2–6 张并排（超过 6 张分页）；AI 排名角标；组信息（连拍/同场景、时间跨度、张数）。
- 操作：`1–6` 选一张、`Enter` 确认本组、`X` 全组弃、`←/→` 换组。

### 9.3 检查点

- 每个阶段结束生成检查点卡片（图墙顶部 + 阶段芯片红点）；默认不阻塞、自动进入下一阶段，开启“阶段间暂停”后才停在检查点。
- 内容：阶段统计（处理数、去重数、成组数、过滤数、错误数、耗时、费用）、20–30 张抽样、以及操作：**继续**、**抽样看看**（开单图/组对比浏览抽样）、**调阈值/提示词**（打开设置并提示影响范围）、**回退重跑本阶段**。
- 粗筛检查点额外展示“入选网格 vs 落选网格”各 3 张并排，供判断模型是否偏移。
- 精评检查点额外展示分数直方图与最高/最低/阈值附近样本。
- 回退重跑：删除该阶段及之后的 `assessments` 与阶段统计（保留更早阶段），按新参数重跑；若后续阶段正在运行，先暂停或取消再回退。

### 9.4 设置抽屉

- 题材模板、模型（默认 `deepseek-flash`，检测是否支持图片输入，否则禁用并提示）、并发、预算、网格规格、keep/maybe 阈值、分组时间窗与汉明阈值、阶段间暂停、提示词版本（可查看当前模板全文）、离峰开关、断开网络盘动作。
- 修改提示词或阈值后，标注“影响后续阶段”，提供“重跑受影响阶段”按钮。
- 网络源额外显示连接状态、挂载点、重连按钮。

### 9.5 导出对话框

- 目标目录：仅本机路径；可用 `osascript` 选择。
- 分桶：keep / maybe / reject（默认前两个）。
- 模式：硬链接（默认）/ 复制。
- 命名：保留相对目录结构（默认）/ 平铺（冲突加 `__<hash8>` 后缀）。
- dry-run 汇总：张数、总大小、冲突数、目标是否同盘（决定链接/复制）。
- 执行后显示 manifest 路径与“在 Finder 中显示”按钮。

### 9.6 空态、加载、错误

- 无项目：选择照片文件夹（第 6 节）。
- 阶段运行中：进度条 + 速率 + 预计剩余 + 费用滚动；可暂停。
- 无候选：说明原因（阈值过严 / 技术过滤 / 网格全落选），给“一键放宽阈值重跑”。
- 错误横幅：显示错误码、影响范围、重试按钮；不可恢复错误给“导出错误清单”。

### 9.7 性能

- 图墙虚拟滚动，只渲染可视区 ± 2 行；缩略图懒加载 + `loading="lazy"`。
- 5000 张候选滚动 60fps；首屏 < 1s（本地缓存命中）。
- 面板打开时预取当前项目状态与第一页照片；SSE 增量更新。
- 缩略图 384px WebP；大图按需生成 1600px。

### 9.8 本地化与主题

- **（2026-11-04 修订）界面语言跟随浏览器**：读取 `navigator.languages`，取第一个 zh / en 作为界面语言，其余回退 en；**不依赖 DSH 的语言设置**。
- **主屏右上角提供「中 / EN」切换按钮**（按钮显示目标语言）：点击后写入 `localStorage` 并即时重渲染（无需刷新）；语言是全局偏好，不放在单个项目的设置抽屉里。
- 文案集中在一个 client 词典模块（zh/en 两套），缺失键回退 en 再回退键名。
- 状态、判定、统计键等**枚举值也必须本地化**（如 `done`→已完成、`filtered_blur`→模糊、`keep`→保留），不得把内部枚举直接显示给用户。
- 容器与控件继承 DSH 主题 token；照片区域允许深色背景。

---

## 10. Agent 工具

### 10.1 `photo_picker`

| 参数 | 说明 |
|---|---|
| action | `create` / `list` / `get` / `update_settings` / `run_stage` / `status` / `pause` / `cancel` |
| project | 项目 id 或名称（除 create/list 外必填） |
| source | create 必填：`{kind:"local"|"smb"|"nfs", path}` 或 `{kind:"smb", url}` |
| stage | run_stage 必填：`scan` / `preprocess` / `grid` / `rank` / `score` |
| settings | update_settings 可选：题材、预算、并发、网格规格、阈值、分组阈值、阶段间暂停、离峰 |

返回：项目摘要（计数、阶段状态、费用）、校验结果或结构化错误（`NEED_SOURCE`、`PATH_NOT_FOUND`、`MOUNT_TIMEOUT`、`BUDGET_EXCEEDED`）。

### 10.2 `photo_picker_review`

| 参数 | 说明 |
|---|---|
| action | `stats` / `sample` / `query` / `decide` / `explain` |
| project | 必填 |
| filter | query 用：状态、AI 判定、人工判定、组、分数区间 |
| limit | sample ≤ 6，query ≤ 50（超出截断并说明） |
| photoIds | decide/explain 用 |
| verdict | decide 用：keep / maybe / reject |

返回有界：`sample` 带最多 6 张缩略图 + 分数；`query` 表格化；`stats` 聚合数字 + 直方图桶；`explain` 返回维度分、理由、技术指标、所在组与同类排名。

### 10.3 `photo_picker_export`

| 参数 | 说明 |
|---|---|
| action | `preview` / `run` / `status` |
| project | 必填 |
| dest | preview/run 必填（本机绝对路径） |
| buckets | 默认 `["keep","maybe"]` |
| mode | `hardlink` / `copy` |

返回：dry-run 汇总或执行结果（数量、manifest 路径、失败清单）。

### 10.4 典型对话

- “帮我筛 `~/Pictures/2024婚礼`，预算 30 元” → 缺路径先问；建项目 → 自动跑扫描/预处理/粗筛/精评，阶段结束汇报统计；需要时暂停或回退。
- “先试跑 80 张校准” → 启动校准，提示到面板盲评。
- “为什么 keep 只有 300 张？” → stats + 阈值附近样本 + 建议。
- “这 20 张都改成 keep” → `decide`，面板同步。
- “导出 keep 到移动硬盘” → `preview` 汇总，确认后 `run`。

### 10.5 工具设计约束

- 每个工具动作不超过 8 个；参数用 enum 约束；错误返回结构化 code + 下一步建议。
- 输出有界、可继续查询；不返回全量行、不返回路径清单。
- 不把图片 base64 塞进工具结果；需要看图的动作走附件引用。

---

## 11. 导出

- **默认硬链接**：同盘 `fs.link`；跨盘（`EXDEV`）自动回退复制并校验字节数；失败逐条记录。
- **目录结构**：默认保留相对源目录结构；平铺模式重名加 `__<sha8>`。
- **分桶**：`keep/`、`maybe/`；`reject/` 仅在勾选时导出。
- **manifest**：`manifest.csv`（rel_path, decision, ai_score, group, post_processing, reason）+ `manifest.json`（结构化全量）。
- **源零写入**：导出前抽样 20 个文件记录 size+mtime+sha256，导出后校验不变；任何源写入视为 bug。
- **幂等**：重复导出到同一目标时，已存在且大小一致的文件跳过；不一致时给出冲突清单，不静默覆盖。
- **目标校验**：目标目录必须存在或可创建、可写、非源目录子目录；拒绝导出到源目录。

---

## 12. 错误处理与恢复

| 场景 | 处理 |
|---|---|
| 坏文件 / 解码失败 | 记 `unreadable` + 错误清单，继续 |
| 路径不存在 / 权限不足 | 建项目阶段直接失败并说明；运行中失败则暂停 |
| 网络断线 | 阶段 `paused`，每 15s 健康检查，恢复后续跑；连续 5 次失败标 `failed` |
| 模型 429 / 5xx | 退避重试 3 次；`Retry-After` 优先；连续 10 次失败暂停阶段 |
| 返回坏 JSON | 重试 1 次；仍失败记错误，照片默认 maybe，不丢失 |
| 预算触顶 | 暂停 + 检查点；可提高预算继续 |
| 进程崩溃/重启 | 阶段重置为 paused，游标续跑；AI 结果幂等 |
| 磁盘满 | 暂停并提示；不删任何已有数据 |
| SQLite 损坏 | 启动时 `PRAGMA integrity_check`；失败则把库改名为 `.corrupt-<ts>` 并提示重建（保留缩略图） |
| 源盘被拔掉 | 同网络断线处理（暂停 + 健康检查） |

---

## 13. 安全与隐私

- 照片仅在被评估时以图片形式发送到 DeepSeek API；不上传源文件、EXIF 全量或数据库。
- API Key 由 DSH 凭据提供，插件不读取、不记录、不落库；日志脱敏。
- SMB/NFS 密码交给系统 Keychain；DB 只存不含密码的 URL。
- 本地 HTTP 只监听 127.0.0.1；拒绝非 loopback 的写操作。
- 源目录只读；导出目标由用户显式选择。
- 日志不含路径全量（只记项目内相对路径与 photoId）。
- 插件安装会改变 profile 全局配置：安装前向用户说明，撤销用 `plugin_manager` 移除。

---

## 14. 性能与规模目标

| 指标 | 目标 |
|---|---|
| 扫描 5 万条目（本机） | ≤ 2 分钟 |
| 预处理（本机，8 并发） | ≥ 300 张/分钟 |
| 网格渲染 | ≤ 200 ms/张网格 |
| 网络源首轮传输 | 建项目时给出预估值；支持暂停续跑 |
| 图墙 5000 张滚动 | 60fps |
| 面板首屏 | < 1s（热缓存） |
| 强杀恢复 | 重启后 1s 内显示断点 |

---

## 15. 测试与验收

### 15.1 测试层次

- **单元**：sha256/dHash、模糊与曝光指标、分组算法、网格布局与编号映射、提示词返回解析（含坏 JSON）、阈值收敛、导出命名与冲突、状态机与幂等键、路径规范化。
- **集成**：用夹具图片（精确重复、连拍变体、虚焦、过曝、HEIC、RAW、旋转、极小图）跑完整流水线；用 mock LLM 返回固定 JSON 并注入 429/坏 JSON/断线。
- **UI**：组件测试（图墙虚拟滚动、三视图状态共享、批量撤销、检查点渲染）。
- **人工**：真实拍摄 80 张校准；真实 1 万张跑通；用 Chrome DevTools MCP 截图验收面板。

### 15.2 验收标准

1. 建项目：本地路径、已挂载网络盘、未挂载 SMB 三类均可选；校验失败给明确原因；不产生半截项目。
2. 1 万张夹具：扫描 + 预处理后去重、成组、过滤计数与预期一致；强杀进程重启后续跑不重复处理、不重复计费。
3. 网格粗筛：每网格恰好 1 次调用；编号映射正确；解析失败的照片进入复核队列而非消失。
4. 精评：坏 JSON 自动重试；最终 JSON 校验通过；人工判定覆盖 AI。
5. 预算：预算 1 元、预估 5 元时，在 ≤1.05 元处暂停。
6. 复核：三个视图决策一致；批量操作可撤销；筛选/排序正确。
7. 导出：500 张硬链接成功；manifest 与决策一致；源文件 size/mtime/sha256 不变。
8. 网络：处理中断开共享 → 30s 内暂停；重连后从断点续跑。
9. 校准：输出 keep 精确率/召回率/F1、一致率、建议阈值。
10. 安全：日志与 DB 中无 API Key、无 SMB 密码。

---

## 16. 风险与对策

| 风险 | 对策 |
|---|---|
| Flash 的审美判断不稳定 | 校准模式、阈值可调、人工覆盖、提示词版本化、先用真实 80 张试跑 |
| 网络源吞吐低（5 万张 × 数 MB） | 建项目给传输预估；HEIC/RAW 优先内嵌预览；断点续跑；建议离峰跑 |
| HEIC/RAW 解码差异 | sharp 优先、sips 回退、失败明确标记；夹具覆盖 |
| DSH 插件 API 变化 | 只依赖文档化 seam（ctx.llm/attachments/webServer/storage/tools/slots）；包保持小而清晰 |
| 沙箱与工作区外读写 | Host 插件用 Node fs 直接读源（只读）；导出写用户目录；实现时验证 DSH 策略 |
| 模型路由不具备图片输入 | 启动时检查 `inputModalities` 含 image，否则禁用并提示切换模型 |
| SQLite 在网络盘损坏 | 库与缓存强制本地；网络盘只读源 |
| 大规模缩略图占磁盘 | 384px WebP + 按需预览；设置里提供清理缓存 |

---

## 17. 实施阶段（后续展开为计划）

1. **骨架**：bundle（package.json、patch、locale、icon）+ Host 服务 + SQLite + 建项目流程（先选文件夹）+ 路径选择（本机）+ 扫描/预处理 + 空态面板。
2. **网络源**：SMB 连接/挂载/健康检查/断线暂停恢复 + 校验与预估。
3. **AI 流水线**：网格粗筛 + 组排序 + 单张精评 + 预算/并发/重试 + 检查点 + 费用预估。
4. **复核界面**：图墙 / 单图 / 组对比 + 批量与撤销 + 快捷键 + SSE 进度。
5. **导出与校准**：硬链接/复制、manifest、dry-run + 校准模式与报告。
6. **收尾**：三个 agent 工具打磨、测试、文档、在创造者模式里安装并用 Chrome 验收。

每个阶段结束都应能在 Harness Web UI 里看到可验证的效果，不积压到最后。

---

## 18. 附录

### 18.1 环境事实（2026-11-04 核对）

- Node v22.23.4；`node:sqlite` 可用（实验特性，启动有 warning，可接受）。
- `deepseek-flash` = DeepSeek-V4.1-Flash：输入模态含 image，上下文 1,048,576。
- 本机 cost-meter 价格表：离峰输入 1 元/M、缓存命中 0.02 元/M、输出 4 元/M；高峰 ×2。
- 单张图片视觉 token 上限约 1024；图片会按路由缩到约 1300 长边等效。
- `sharp` 在 web profile 的 node_modules 中可解析；macOS `sips` 可读 HEIC。
- 当前会话不是创造者模式；实现需在新会话中进行。

### 18.2 提示词 v1（初稿，实现时可迭代）

**网格粗筛**

```
你是一位有经验的摄影编辑。下面是一张由 16 张照片拼成的网格图（4 列 × 4 行），
每格左上角有编号 A1–D4，编号按行优先排列。

请选出构图有重点、光影有层次、主体清晰、值得进入下一轮的照片，
目标大约选出 30%。如果同一场景/连拍有多张相似照片，只选其中最好的一张。

只返回一个 JSON 数组，元素是格子编号字符串，例如 ["A1","B3","C2"]。
不要输出任何解释。
```

**组内排序**

```
这些是同一场景或连拍的照片，按 A、B、C… 排列。
请按“值得保留”的程度排序，并指出最好的一张。

只返回 JSON：{"order":["A","C","B"],"best":"A","reason":"一句话理由"}
```

**单张精评**

```
你是一位有经验的摄影编辑。请从六个维度评价这张照片（0–10 分）：
构图 composition、光影 light、色彩 color、技术质量 technique、
后期潜力 post_potential、瞬间与叙事 moment。

然后给出：总分 score（0–10，保留一位小数）、建议 verdict（keep / maybe / reject）、
后期建议 post_processing（可多选，代码如 crop_left/crop_right/straighten_+1.5/
exposure_+0.3/white_balance/warm/cool）、一句中文理由 reason（不超过 60 字）。

只返回 JSON，不要输出其它内容。
```

### 18.3 后期建议代码白名单（v1）

`crop_left` `crop_right` `crop_top` `crop_bottom` `straighten_+X` `straighten_-X` `exposure_+X` `exposure_-X` `white_balance` `warm` `cool` `shadow_lift` `highlight_recover` `contrast_+X` `saturation_+X` `denoise` `sharpen`。

### 18.4 默认值汇总

| 项 | 默认 |
|---|---|
| 模型 | `deepseek-official / deepseek-flash` |
| 预算 | 30 元 |
| 并发 | 8 |
| 网格 | 4×4 |
| keep / maybe 阈值 | 7.5 / 6.0 |
| 每组保留 | 1 张（组内 >12 张入选时 2 张） |
| 导出分桶 | keep + maybe |
| 导出模式 | 硬链接，跨盘回退复制 |
| 离峰开关 | 关（提示高峰单价 ×2） |
| 阶段间暂停 | 关（默认自动继续） |
| 分组阈值 | 连拍 2s / 汉明 ≤12；场景 60s / 汉明 ≤6 |
| 网络盘自动卸载 | 关（只提供手动“断开网络盘”） |
| 题材 | 混合 |
