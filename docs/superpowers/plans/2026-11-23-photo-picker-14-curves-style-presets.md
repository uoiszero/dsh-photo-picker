# Plan 14：曲线调整与样片风格模板

状态：已实现，未发版（2026-11-23）

## 目标

- 单图增加 RGB 主曲线、红/绿/蓝通道曲线和亮度曲线
- 提供 7 个内置曲线预设
- 从 1–5 张样片提取全局风格曲线，可选一次图片模型分析
- 模板全局保存，应用模板不调用模型

## 实现

- 162 个测试、typecheck、build、check:ui、verify 均通过

- `plugin/src/shared/curves.js`：控制点归一化、单调三次插值、256 级 LUT、SVG path
- `plugin/src/host/recipe.js`：可选 `curves` 字段；非恒等曲线参与签名
- `plugin/src/host/edit.js`：RAW RGB LUT；预览先缩放再映射
- `plugin/src/client/curve-presets.js`：柔和/强对比、提亮阴影、压暗高光、哑光褪色、暖色胶片、冷青电影
- `plugin/src/client/index.tsx`：正方形 SVG 曲线编辑器、拖动时 4×4 网格、空白处按下新建并拖动、预设缩略图、模板应用/删除、全部照片提取入口；单图右栏按「基础 / 曲线 / 预设 / 信息」分组，一次只显示一个工具
- `plugin/src/host/style-extract.js`：样片 CDF、contact sheet、AI JSON 解析、语义参数合并
- `plugin/src/host/style-presets.js`：`$DSH_HOME/storages/photo-picker/style-presets.json`
- API：`GET/POST /photo-picker/api/style-presets`、`DELETE /photo-picker/api/style-presets/:id`、`POST /photo-picker/api/projects/:id/photos/:pid/edit-thumb`

## 约束

- AI 只参与提取阶段，失败回退本地 CDF；模板文件不保存样片路径/原图
- 应用模板不调用模型
- 内置预设只改 curves，不覆盖裁剪/旋转/曝光/锐化/饱和度
- 修改曲线必须改变 `recipeSignature`
