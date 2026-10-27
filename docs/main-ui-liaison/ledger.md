# 驻场台账 — ComplexSystemGallery

## 批次进度

| 批次 | 内容 | 状态 | 日期 |
|------|------|------|------|
| 0 | 全四批次 + 抽检 + 驻场四步补齐 | ✅ 完成 | 2026-09-01 |
| 1 | A7 族：viewport-2d-kit → @main-ui/view-canvas 迁移 | ✅ 完成 | 2026-10-15 |

## 待办

（无）

## 工作日志

### 2026-10-15
- **A7 族迁移完成**：`GalleryWorkbenchEditor.vue` 导入改 `ViewportBusinessCanvasShell` → `ViewportCanvasShell`（来自新官方模板 `@main-ui/view-canvas`）；package.json 删悬空 `@main-ui/viewport-2d-kit: workspace:*`、加 `@main-ui/view-canvas`，`main-ui` 升 `^0.7.0`；两处文档文字（模板注释 + runtime 描述）同步更新。
- **验证**：`rm -rf node_modules && pnpm install` fresh install 成功；`vue-tsc -b && vite build` 全绿；`pnpm-lock.yaml` 中 `viewport-2d-kit` 引用 = 0。**根除悬空声明导致的构建依赖残留问题**。

### 2026-09-01
- 驻场四步补齐（此前全四批次 + 抽检已在 2026-08 完成）
- p5 桥接模式（ExternalEngineApi）已验证，成为后续 yeegames 复用范本
- 抽检构建链全绿（vue-tsc -b 零错误 + vite build 1.32s）
