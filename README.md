# ComplexSystemGallery

一个基于 **Vite + React + TypeScript** 的“项目画廊”站点。

它会在启动/构建前从同级仓库 **ComplexSystemLab** 的 `Projects/` 目录扫描项目结构，并生成 `public/projects-tree.json`，然后在网页里以“项目树”方式进行导航与展示。

> 说明：本仓库默认假设 `ComplexSystemGallery` 与 `ComplexSystemLab` 在同一个父目录下（脚本会去 `../ComplexSystemLab/ComplexSystemLab/Projects` 查找）。

## 主要特性

- 自动生成项目树（`public/projects-tree.json`）
- 左侧/页面内项目树导航（`src/components/ProjectTree.tsx`）
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

- `pnpm gen:tree` → `scripts/build-project-tree.mjs` → 输出到 `public/projects-tree.json`

### 3) 构建与预览

```powershell
pnpm build
pnpm preview
```

## 常用脚本

- `pnpm gen:tree`：生成/更新 `public/projects-tree.json`
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
2. 修改 `scripts/build-project-tree.mjs` 里的 `LAB_PROJECTS_ROOT` 指向你的实际路径。

## 代码结构（摘要）

- `src/main.tsx`：应用入口（渲染 `Router`）
- `src/Router.tsx`：顶层路由组件（当前文件为空，需要按你的产品形态实现路由/布局）
- `src/components/ProjectTree.tsx`：项目树 UI
- `src/types/projectTree.ts`：项目树节点类型
- `public/projects-tree.json`：项目树数据（由脚本生成）

## 开发者文档

更详细的维护说明见：

- `docs/DEVELOPER_GUIDE.md`

## 常见问题（FAQ）

### Q1：运行 `pnpm dev` 报“找不到目录 …Projects”

A：`gen:tree` 依赖同级仓库 `ComplexSystemLab`。请确保目录结构符合脚本假设，或修改脚本路径。

### Q2：页面空白或无法导航

A：当前 `src/Router.tsx` 文件为空。你需要实现路由/布局，把项目树与项目内容渲染出来。
