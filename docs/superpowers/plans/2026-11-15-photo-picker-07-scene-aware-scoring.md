# 按照片内容自适应评分（Scene-aware Scoring）

> 状态：已实现（2026-11-15）。取代项目级题材先验。

## 目标

出门拍摄常混合风景、人像、建筑、街拍；不再要求创建项目时选题材，而是由单张精评在评分时判断画面内容，并按主场景调整评分重点。

## 边界

- 只对进入单张精评的候选照片做场景判断；被本地过滤或网格粗筛淘汰的照片不调用模型
- 不增加 AI 调用次数：场景判断与评分在同一次调用完成
- 不做全库 `scene_classify` 阶段；需要时另开计划

## 场景

`portrait` 人像、`landscape` 风光、`architecture` 建筑、`street` 街拍、`event` 活动/纪实、`flower` 花/植物、`wildlife` 动物、`sculpture` 雕塑/展品、`other` 仅兜底。

- 多标签，1–3 个
- `primary_scene` 决定评分重点，但六维评分保持完整
- 活动中的单人瞬间允许 `["portrait","event"]`

## 实现

### Host

- `prompts.js`：`PROMPT_VERSION` → `v5`；删除 `THEME_HINTS`；网格提示词不再假设题材；单张提示词先判断场景再评分
- `parse.js`：解析 `scenes` / `primary_scene`，支持中英文别名；缺失/非法不导致评分失败
- `db.js`：`assessments.scenes_json`、`primary_scene`；旧库 `ALTER TABLE` 迁移
- `pipeline.js`：场景字段随 assessment 落库；评分 `maxTokens` 提升到 400
- `review.js`：图墙/单图返回 `scenes`、`primaryScene`
- `service.js`：提示词预览不再注入题材
- `tools.js`：移除 `theme` 参数

### Client

- 新建项目、设置抽屉移除题材字段与请求字段
- 单图复核显示场景 chips
- 新增场景 i18n
- `projects.theme` 保留旧库兼容，不再参与提示词

## 兼容与费用

- 旧 v4 assessment 保留；打开旧项目不报错，场景为空
- v5 后显式重跑单张精评会给缺少 v5 结果的照片重新计费
- 场景缺失时评分仍成功，只是不显示标签

## 测试

- 解析英文/中文场景、去重、截断、缺失/非法回退
- 提示词版本 v5，网格提示词不含题材先验
- score 流水线落库 scenes
- review 返回 scenes
- 旧库迁移可重复执行
- `npm test` 112/112；`npm run verify`、`npm run check:ui`

## 图墙标签与筛选

- 图墙缩略图左下角显示 `scenes` 标签（最多 3 个，` · ` 连接）
- 复核工具栏增加场景筛选；`scene=portrait` 等参数由 review API 过滤
- 标签只做 UI 展示，不写入源照片

## v7 真实回归（2026-11-16）

16 张真实照片、10 张进入精评，累计三轮测试费用约 ¥0.12。v7 结果：花→flower、动物→wildlife、博物馆雕塑→sculpture；演出场景出现 event 次级标签；`other` 不再吞掉花/动物/雕塑。剩余问题：演出照片主标签仍是 portrait，灯塔多出 street 次级标签，6 张被网格淘汰的照片没有场景标签。

## 非目标

- 全量原图分类
- 按场景重新拼网格
- 按场景筛选 UI
- 自动重评分旧项目
