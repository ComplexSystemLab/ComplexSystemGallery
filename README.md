# ComplexSystemGallery

一个基于 **Vite + Vue 3 + TypeScript** 的“项目画廊”工作台。

它会在启动/构建前从同级仓库 **ComplexSystemLab** 的 `Projects/` 目录扫描项目结构，并生成 `public/projects-tree.json`，然后在网页里以“项目树”方式进行导航与展示。

当前界面以 `main-ui` 作为工作台壳，使用 `viewport-2d-kit` 承载中间的项目概览视口，右侧展示已注册项目的 live demo iframe。

> 说明：本仓库默认假设 `ComplexSystemGallery` 与 `ComplexSystemLab` 在同一个父目录下（脚本会去 `../ComplexSystemLab/ComplexSystemLab/Projects` 查找）。

## 文档入口（必读）

所有文档在 `docs/`：

- `docs/README.md`：文档目录
- `docs/PRD.md`：产品需求文档
- `docs/USER_MANUAL.md`：产品用户手册
- `docs/DEVELOPER_GUIDE.md`：开发者手册
- `docs/CHANGELOG.md`：开发日志 / 变更记录

> 维护要求：每一次新增/改动/修复，在完成校验后都需要同步更新相关文档，并在 `docs/CHANGELOG.md` 追加记录。

## 主要特性

- 自动生成项目树（`public/projects-tree.json`）
- 基于 `main-ui` 的单工作区项目浏览器
- 左侧项目树导航、中间 2D 概览视口、右侧 demo 预览
- 通过 `src/projects/projectRegistry.ts` 以数据方式注册可预览项目
- 对 graph_algorithms_js demo 自动同步本地 `p5.min.js`，避免依赖外网 CDN
- 支持按文件夹层级组织项目
- 以 `project.txt` 作为“叶子项目”的判定标记（见 `scripts/build-project-tree.mjs`）

## 快速开始

### 1) 安装依赖（pnpm）

本项目 `package.json` 脚本默认使用 pnpm（例如 `predev`/`prebuild` 会调用 `pnpm gen:tree`），建议直接使用 pnpm。

```powershell
pnpm install
```

### 2) 启动开发服务器

```powershell
pnpm dev
```

启动时会自动执行一次项目树生成：

- `pnpm build:deps` → 构建 `../main-ui` 和 `../viewport-2d-kit`
- `pnpm sync:demo-vendor` → 同步 `public/vendor/p5.min.js`
- `pnpm gen:tree` → `scripts/build-project-tree.mjs` → 输出到 `public/projects-tree.json`

默认开发地址：`http://127.0.0.1:4173/`

### 3) 构建与预览

```powershell
pnpm build
pnpm preview
```

默认预览地址：`http://127.0.0.1:4174/`

## 常用脚本

- `pnpm gen:tree`：生成/更新 `public/projects-tree.json`
- `pnpm build:deps`：预构建 `main-ui` 与 `viewport-2d-kit`
- `pnpm sync:demo-vendor`：同步本地 `p5.min.js` 到 `public/vendor/`
- `pnpm dev`：开发模式（启动前自动 `gen:tree`）
- `pnpm build`：TypeScript 构建（`tsc -b`）+ Vite 构建（构建前自动 `gen:tree`）
- `pnpm lint`：ESLint 检查
- `pnpm preview`：本地预览构建产物

## 项目树生成逻辑（重要）

代码在 `scripts/build-project-tree.mjs`：

- 扫描目录：`../ComplexSystemLab/ComplexSystemLab/Projects`
- 忽略目录：`node_modules/dist/build/__pycache__/.git/.idea`，以及所有以 `.` 开头的目录
- **如果目录包含 `project.txt`，则视为一个叶子项目**
- 输出 JSON：`public/projects-tree.json`

如果你本地没有 `ComplexSystemLab` 或路径不符合假设，会看到类似：

- `找不到目录: ...ComplexSystemLab/ComplexSystemLab/Projects`

可选处理方式：

1. 把 `ComplexSystemLab` 放到与本仓库同级目录；或
2. 修改 `scripts/build-project-tree.mjs` 里的扫描根路径。

## 代码结构（摘要）

- `src/main.ts`：Vue 应用入口
- `src/App.vue`：挂载 `main-ui` 工作台壳
- `src/runtime/createGalleryRuntime.ts`：注册 Gallery 工作区与编辑器
- `src/workbench/GalleryWorkbenchEditor.vue`：主项目浏览器，组合项目树、视口和 demo 预览
- `src/components/ProjectTreeNodeItem.vue`：递归树节点组件
- `src/projects/projectRegistry.ts`：项目注册表（标题、demoUrl、说明、标签）
- `public/vendor/p5.min.js`：graph_algorithms_js demos 使用的本地 p5 资源
- `src/types/projectTree.ts`：项目树节点类型
- `public/projects-tree.json`：项目树数据（由脚本生成）

## 常见问题（FAQ）

### Q1：运行 `pnpm dev` 报“找不到目录 …Projects”

A：`gen:tree` 依赖同级仓库 `ComplexSystemLab`。请确保目录结构符合脚本假设，或修改脚本路径。

### Q2：页面空白或无法导航

A：当前版本使用单工作区的 Vue3 工作台，不再依赖旧的 React 路由文件。如果页面异常，优先检查：

1. `pnpm build:deps` 是否成功构建 `main-ui` 和 `viewport-2d-kit`
2. `pnpm sync:demo-vendor` 是否生成了 `public/vendor/p5.min.js`
3. 本地是否有其他 Vite 项目占用 4173；当前仓库已固定 `strictPort`，端口冲突会直接报错
