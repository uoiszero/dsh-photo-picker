# 手动裁剪（Plan 12）

> 状态：已实现。版本仍为 0.5.0，未发布。

## 目标

在单图「修图建议」中加入可交互裁剪，不依赖 AI crop。

## 实现

- 纯几何模块 `plugin/src/client/crop.js`
  - 自由裁剪
  - 预设 4:3 / 5:4 / 1:1 / 16:9 / 16:10 / 3:2
  - 长短边切换
  - 比例锁定、拖拽、clamp 边界
- 单图大图 overlay：
  - 暗色遮罩、边框、8 个把手
  - Pointer Events，鼠标/触屏可用
  - 拖动内部移动，拖动边/角调整
- 裁剪模式：
  - `裁剪图片` 进入
  - `自由` / 比例 / `切换长短边`
  - `重置裁剪` / `取消裁剪` / `完成`
  - 保存复用现有 recipe PATCH
- 全画幅预览：
  - 复用 `edit-preview`，请求 crop 全画幅
  - 保留当前旋转/调色，使用自然尺寸做比例换算
- 人工微裁：
  - `normalizeRecipe(input, { allowMicroCrop: true })`
  - AI 仍过滤 <18% 微裁；人工裁剪保留
  - 覆盖 review / editedFile / export
- 默认模型不受影响，继续 DeepSeek 4.1 Flash

## 测试

- crop 几何单测：比例、交换、移动、拖拽、clamp、最小尺寸
- 人工微裁保留、AI 微裁过滤
- UI 冒烟：16:9 → 9:16 → 保存 → 回读 recipe
- `npm test` 132/132
