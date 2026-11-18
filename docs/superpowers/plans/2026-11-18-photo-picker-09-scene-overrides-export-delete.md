# 场景标签人工修正、导出场景字段、删除项目

> 状态：已实现。版本仍为 0.4.0，未发布。

## 1. 人工场景标签

- 新表 `photo_scene_overrides`：
  - `photo_id` PK、`project_id`、`scenes_json`、`primary_scene`、`source='human'`、`updated_at`
- 复核查询与图墙场景筛选优先使用人工覆盖，其次 AI assessment
- 单图页「编辑场景」：
  - 勾选 1–3 个场景
  - 指定主场景
  - 保存 / 取消 / 恢复 AI 标签
- 清空全部场景会删除人工覆盖
- API：`PATCH /photo-picker/api/projects/:id/photos/:pid/scenes`

## 2. 导出 manifest

- `manifest.csv` 新增 `scenes`、`primary_scene`
- `manifest.json` items 新增 `scenes` 数组、`primaryScene`
- 使用人工覆盖后的有效标签
- 源文件仍然只读

## 3. 删除项目

- `DELETE /photo-picker/api/projects/:id`
- 只删除项目工作区（db/thumbs/previews/grids/logs）和注册表条目
- 源照片目录只读，不受影响
- 运行中的项目拒绝删除，需先暂停/取消
- 项目卡片右上角增加垃圾桶图标（悬停/聚焦显示），带浏览器确认框

## 测试

- 人工覆盖优先于 AI，清空后回退
- 场景筛选/单图详情使用覆盖
- export manifest 场景字段
- 删除项目移除工作区、保留源照片
- HTTP PATCH scenes / DELETE project
- `npm test` 119/119

## 非目标

- 不做全量场景分类阶段
- 不写入源照片 EXIF/XMP
- 不做批量修改场景标签（单图即可）
- 不自动删除测试项目
