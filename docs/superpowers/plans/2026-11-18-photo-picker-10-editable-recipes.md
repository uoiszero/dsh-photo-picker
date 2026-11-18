# 可微调修图建议（Plan 10）

> 状态：已实现。版本仍为 0.4.0，未发布。

## 目标

把 AI 的结构化修图配方从只读建议变成可微调、可回退、可导出的个人配方，同时保留 AI 配方作为基线。

## 已实现

- 新表 `photo_recipe_overrides`（photo_id PK、project_id、recipe_json、source、updated_at）
- 有效配方优先级：
  `photo_recipe_overrides` > `assessments.recipe_json` > 无
- 单图页「修图建议」卡片：
  - `AI 建议` / `我的调整` badge
  - 滑杆直接放在「修图建议」下方，无弹窗
  - 曝光、对比度、饱和度、锐化、旋转滑杆；拖动改草稿并请求临时预览，点击保存才写库
  - 裁剪只读（沿用 AI 建议）
  - 保存 / 恢复 AI 建议
- API：
  `PATCH /photo-picker/api/projects/:id/photos/:pid/recipe`
  - 合法 recipe 保存人工覆盖
  - `recipe: null` 删除覆盖
  - 缺 body / 非法版本 / 未知照片返回结构化错误
- 预览 `/media/edit/...` 和导出都使用有效配方
- manifest.json item 新增 `editSource`（human / ai / null）
- 保存成功后自动切到「修图」预览；拖动时也实时更新临时预览

## 测试

- 人工配方优先、清空后回退 AI
- 非法版本 / 未知照片
- HTTP PATCH recipe
- export manifest `editSource`
- UI 冒烟：合成项目内微调曝光、保存、恢复 AI
- `npm test` 121/121

## 非目标

- 不做拖拽裁剪
- 不新增温度/色调/高光/阴影
- 不做局部蒙版/污点修复/RAW 显影
- 不做批量应用
