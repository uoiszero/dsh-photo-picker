# 模型路由选择（Plan 11）

> 状态：已实现。版本仍为 0.5.0，未发布。

## 目标

让项目可以在不同 DSH LLM provider route 之间切换，同时保持默认
`deepseek-official / deepseek-flash` 不变。

## 实现

- 新 API：`GET /photo-picker/api/model-routes`
  - 通过 `ctx.llm.listProviders()` + `listModels()` 返回可用的图片模型路由
- 项目设置：
  - 新增 `modelRoute` 选择
  - 切换 route 后重新加载该 route 的模型列表
  - 保存时同时提交 `modelRoute` / `modelId`
- `PATCH /projects/:id`：
  - 校验 route 可用、模型存在、模型接受图片输入
  - 写回 `projects.model_route`
- 默认值不变：`deepseek-official / deepseek-flash`

## Qwen 兼容

- 模型拒绝 `reasoningEffort: off` 时自动省略并重试
- score 输出上限从 400 提升到 1200，避免带思考模型 JSON 截断
- Qwen4-Max 作为可选路线，不作为默认

## 测试

- HTTP model-routes 路由
- i18n modelRoute 文案
- 手动/API 切换 route 后项目详情正确返回
- `npm test` 123/123
