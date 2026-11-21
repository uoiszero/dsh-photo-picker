# AI 运行记录与跨项目照片墙（Plan 13）

> 状态：已实现，尚未发布。版本暂保持 0.6.0；下一版发布时更新版本号与 Release 说明。

## 目标

- 每个项目保留阶段级 AI 运行记录：grid / rank / score。
- 新增跨项目照片墙，支持项目多选、场景标签、判定筛选，以及筛选结果/选中照片导出。
- 不新增全局中央数据库，不引入自定义标签表。

## AI 运行记录

- `stage_runs` 新增：
  - `model_route`、`model_id`、`prompt_version`
  - `tokens_in`、`tokens_out`、`call_count`、`error_code`
- 旧项目库通过 `ensureStageRunColumns` 自动迁移。
- 三个 AI 阶段在结束时写入模型、token、调用次数、费用和状态。
- 阶段异常由 `markStageFailed` 收尾为 `failed`。
- 新接口：`GET /photo-picker/api/projects/:id/ai-runs?limit=&offset=`
- 项目详情增加「AI 运行记录」折叠区，支持加载更多。

## 跨项目照片墙

- `listReviewPhotos` 支持 `scenes[]` / `verdicts[]`，同类 OR、跨类 AND。
- `global-wall.js` 逐项目库查询并合并；响应包含 `projectId` / `projectName` / `projectUpdatedAt`。
- 新接口：`GET /photo-picker/api/photos?projects=&scenes=&verdicts=&sort=&limit=&offset=`
- 项目多选：0 个 = 全部；多个之间 OR。
- Workbench 顶部新增「项目 / 全部照片」切换。
- 照片墙支持搜索条件、勾选、轻量 lightbox 和加载更多。

## 跨项目导出

- 新接口：
  - `POST /photo-picker/api/photos/export/preview`
  - `POST /photo-picker/api/photos/export/run`
- 筛选结果或显式 `items` 二选一。
- 默认按项目分目录：`<dest>/<project>-<id6>/<bucket>/<relPath>`；也支持平铺。
- 复用原导出源校验、修图渲染和复制/硬链接。
- 写单一 `manifest.json` / `manifest.csv`，包含 project 字段。
- v1 不写入项目级 `exports` 历史，避免另建中央数据库。

## 测试

- `plugin/test/global-wall.test.js`
- `plugin/test/global-export.test.js`
- `plugin/test/stage-runs.test.js`
- `plugin/test/pipeline.test.js` 新增 AI 阶段字段断言
- `npm test` 137/137
- UI 冒烟：双项目照片墙、多选项目、场景筛选、导出预览、项目 AI 记录
