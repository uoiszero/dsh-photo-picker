# 照片墙分页与虚拟化

> 状态：Phase 1（分页/无限滚动）已完成；Phase 2（行虚拟化）待做。

## 背景

原图墙固定请求 200 张且没有分页，超过 200 张的照片无法访问。API 已支持 `limit/offset` 并返回 `total`，问题集中在客户端数据层和渲染。

## 目标

- 图墙可访问全部照片，显示真实总数
- 滚动到底自动加载下一页
- 保留筛选、排序、场景筛选、选择、批量改判、撤销
- 单图返回保持滚动位置
- 大项目只渲染可视行

## Phase 1：分页/无限滚动（已完成）

- `PAGE_SIZE = 200`，继续使用现有 `GET /photos?limit&offset`
- `items / total / nextOffset / hasMore / loading / loadingMore`
- `IntersectionObserver` 以 `.pp-page` 为滚动 root，`rootMargin: 400px`
- 追加结果按 id 去重
- 筛选/排序/场景变化重置并滚回图墙
- 判定/撤销本地更新，不重置分页
- `version` 变化时刷新已加载范围
- 单图导航到已加载末尾时先加载下一页
- 错误显示 + 重试
- 分页 API/HTTP 测试

**实测**：珠海长隆项目 531 张，初始 200 → 滚到底 400 → 再滚到底 531。

## Phase 2：行虚拟化（待做）

- 计算列数/行高，只渲染可视行 + overscan
- `ResizeObserver` 处理宽度变化
- `scroll` + `requestAnimationFrame` 节流
- 保留 tile 标签、复选框、选中态
- 纯计算抽到 `virtual.js` 并加 node:test

## 边界

- 空项目/不足一页/正好整页
- 追加时照片数变化，按 id 去重
- 快速切换筛选，旧请求不得覆盖新结果
- 筛选变化清空选择
- 滚动 root 是 `.pp-page`，不是 window
- 图片无缩略图/无场景时既有占位与标签逻辑不变

## 验收命令

```bash
npm test
npm run typecheck
npm run build:client
npm run verify
npm run check:ui
```

## 非目标

- 不改后端 schema
- 不做 keyset pagination
- 不引入外部虚拟列表依赖
- 不改筛选/评分/导出逻辑
