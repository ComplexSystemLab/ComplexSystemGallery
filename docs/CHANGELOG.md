# 开发日志 / 变更记录（Changelog）

本文档记录 ComplexSystemGallery 的重要变更。格式参考 Keep a Changelog，但以“便于维护”为优先。

## [Unreleased]

### Changed

- 将前端栈从 React 迁移为 Vue 3，并以 `main-ui` 作为工作台壳、`viewport-2d-kit` 作为项目概览视口基础层。
- 重写项目浏览页为单工作区工作台：左侧项目树、中间 2D 概览、右侧 demo 预览与固定链接同步。
- 将项目注册从 React 渲染函数改为纯数据注册表，集中维护标题、说明、分类、标签和 `demoUrl`。
- 将开发端口固定为 `127.0.0.1:4173`，预览端口固定为 `127.0.0.1:4174`，避免多项目工作区冲突。

### Fixed

- 修复 graph_algorithms_js demo 对外网 CDN `p5.min.js` 的硬依赖，改为在 `predev`/`prebuild` 中同步本地 vendor 资源。
- 修复内嵌 block_connectivity demo 在受限网络环境下报 `window.p5 is not a constructor` 的问题。
- 修复 `project.txt` 目录“过早判定为叶子”的问题：当目录存在可识别子项目时不再截断，避免像 `grid_evoluation/《自然规律支配偶然性》_js` 这类节点无法进入子项。
- 修复“几乎所有叶子都显示未接入 Demo”的体验问题：为叶子项目增加 HTML 入口自动发现与 `/projects-src/` 静态挂载，未手工注册也可直接预览。

## [0.1.0] - 2026-01-02

### Added

- 新增产品文档体系：
  - `docs/PRD.md`（产品需求文档）
  - `docs/USER_MANUAL.md`（产品用户手册）
  - `docs/CHANGELOG.md`（开发日志/变更记录）

### Changed

- 更新 `docs/README.md`：补齐文档目录索引。
- 更新根目录 `README.md`：补充“文档入口”与产品定位说明。
- 更新 `docs/DEVELOPER_GUIDE.md`：补充文档维护流程与变更记录要求。

