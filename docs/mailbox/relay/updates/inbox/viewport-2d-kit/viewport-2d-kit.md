# delivered support letter: viewport-2d-kit -> complex-system-gallery

## Delivery Metadata

- relation: `support`
- source_project: `viewport-2d-kit`
- target_project: `complex-system-gallery`
- source_path: `/Users/ethan/CoreFiles/ProjectsFile/viewport-2d-kit/docs/mailbox/relay/updates/outbox/complex-system-gallery/complex-system-gallery.md`
- delivered_at: `2026-08-28T07:24:52+00:00`
- content_hash: `0b112495500d6ff219efc96a9e7e6e60135097d0f11737e293825e87091516b5`

## Letter Content

# support advice (out-down): viewport-2d-kit -> complex-system-gallery

## Context

`viewport-2d-kit` supports `complex-system-gallery` because `complex-system-gallery` depends on `viewport-2d-kit`.

## Adaptation Advice

**viewport-2d-kit 已发布 pixi 内核化（方案 B 定稿，2026-08-26）。** 架构对齐
V3D（three.js 内核 + 薄壳）：渲染/交互/功能全部由 pixi.js 内核（`PixiViewport`）
唯一承载，V2D 对外只是能放进 main-ui 标签页的薄连接器（`ViewportMainUiEditor`）。

对 complex-system-gallery 的影响（复杂系统可视化 / 图谱 surface）：

1. 若使用 `viewport-2d-kit/main-ui` 的 `ViewportMainUiEditor`：注册契约不变，升级依赖即自动获得 pixi 渲染。
2. 若直接使用 `viewport-2d-kit/vue`（CSS transform 层）：该路径为历史兼容层，新 surface 请迁移到
   `viewport-2d-kit/pixi` 的 `PixiViewportCanvas`（Vue）或 `viewport-2d-kit/react-pixi` 的 `PixiViewportReact`（React）。
3. 业务内容一律向 `PixiViewport.world` 容器添加世界坐标 Graphics/Sprite，相机由内核唯一管理。
4. 新依赖：`pixi.js@^8` 为 peerDependency，需自行安装。

## Suggested Steps

- Required change: 升级 `viewport-2d-kit` 依赖；`pixi.js` 加入依赖。
- Compatibility note: 连接器 payload 契约不变；`Viewport2DCanvas` 保留但不再扩展。
- Validation command: `pnpm typecheck && pnpm build`；浏览器验证画布平移/缩放/渲染无报错。
- Deadline or release note: 无强制截止；建议随依赖升级窗口切换。

