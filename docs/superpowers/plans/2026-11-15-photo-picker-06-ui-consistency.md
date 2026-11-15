# UI 统筹整改（Plan 6）

> 从“按页面零散修补”转为统一设计系统。每个 Phase 单独 PR；完成后在下方清单打勾。

**目标：** 所有页面共用同一套 Button / Tab / Form / Card / State / Modal 原语；颜色、圆角、间距、控件高度来自 token；`index.tsx` 不再新增内联视觉样式。

**非目标：** 不恢复 Plan 3 SMB，不修改 Host/API/DB，不引入 UI 框架，不提交真实照片截图。

## 设计规则

- 页面返回：左上 `BackButton`
- 弹窗/抽屉关闭：右上 `CloseButton`
- 主操作：操作区右侧 `pp-button-primary`
- 次操作：`pp-button`
- 危险操作：`pp-button-danger`
- 表单：`Field` + `Input/Select`，统一高度 34px（紧凑 30px）、圆角 8px
- 状态色：使用 `--pp-status-keep/maybe/reject`，禁止散落硬编码
- 所有可见文案走 zh/en 词典

## 文件

- `plugin/src/client/ui.tsx`：原语组件
- `plugin/src/client/theme.js`：token 与组件样式
- `plugin/src/client/index.tsx`：页面组合
- `scripts/check-ui.mjs`：内联样式/状态色基线门禁
- `plugin/assets/screenshots/`：合成 fixture 截图

## Phase 清单

- [x] **Phase 1：token、UI 原语、基线门禁**
  - token 加入 `.pp-page`
  - 新增 `ui.tsx`（Button/Back/Close/Segmented/Field/Input/Select/StateCard/Toolbar/ActionBar/Section）
  - 状态色改用 `--pp-status-*`
  - 新增 `npm run check:ui`（当前只报告，37 条迁移警告）
- [x] **Phase 2：壳层、项目列表、新建项目**
- [x] **Phase 3：项目详情（摘要/阶段/历史/操作区）**
- [x] **Phase 4：复核（工具栏/图墙/单图/组对比）**
- [x] **Phase 5：导出/设置/校准/Toast**
- [x] **Phase 6：窄屏、深色主题、可访问性**
- [ ] **Phase 7：check:ui 强门禁、截图、文档**

## 验收门禁

每个 Phase：

```bash
npm test
npm run typecheck
npm run build:client
npm run verify
npm run check:ui
```

最终还要补：1440 / 1024 / 720 / 480 与 light/dark 截图、键盘 Tab 流程、CI 四个 job 全绿。

## 已知基线（Phase 1 开始时）

- Phase 1 开始时 27 处 `style={btn}`；Phase 2 后降到 24 处，Phase 3 后降到 19 处，Phase 5 后降到 **0 处内联 btn**；Phase 6 增加 aria 标签、480px 规则和语义色混合，剩余 check:ui 警告仅为 theme 里的 danger fallback 色
- 1 个 legacy `btn` 常量
- 主题中仍有少量 danger fallback 色值（非状态色 token）
- 两套空状态：`pp-empty` 与 `pp-state`，Phase 2 合并
- 多套操作区：`.pp-actions` / `.pp-modal-foot` / 内联 footer，Phase 3–5 统一
