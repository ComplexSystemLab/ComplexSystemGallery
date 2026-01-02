# 开发者手册（ComplexSystemGallery）

本文件面向维护者，描述运行方式、工程结构、项目树生成机制，以及常见维护流程。

## 0. 你需要知道的“核心机制”

- 项目树数据文件是 `public/projects-tree.json`
- 它不是手写的，而是由脚本 `scripts/build-project-tree.mjs` 生成
- **脚本默认会扫描同级仓库 `ComplexSystemLab` 的 `ComplexSystemLab/Projects`**
- 判定“叶子项目”的标准：目录下存在 `project.txt`
- `package.json` 的 `predev`/`prebuild` 会在启动/构建前自动执行 `pnpm gen:tree`

## 0.1 文档体系与维护要求（重要）

本仓库的文档统一放在 `docs/`：

- `docs/README.md`：文档目录索引
- `docs/PRD.md`：产品需求文档（产品目标、范围、功能/非功能需求、里程碑）
- `docs/USER_MANUAL.md`：产品用户手册（面向使用者的使用说明与 FAQ）
- `docs/CHANGELOG.md`：开发日志/变更记录（每次改动需要追加一条）

维护规范（请严格遵循）：

- 每一次 **新增功能 / 改动功能 / 修复错误**：
  1. 代码改动完成后，先通过构建/校验（例如 `pnpm lint`、`pnpm build`）。
  2. 同步更新相关文档（本手册、用户手册、PRD 视情况）。
  3. **务必**在 `docs/CHANGELOG.md` 追加变更记录。

## 1. 环境与依赖

- Node.js（版本以你的 Vite/TypeScript 组合可用为准）
- 包管理器：推荐 pnpm（因为脚本里调用了 `pnpm gen:tree`）

安装依赖：

```powershell
pnpm install
```

## 2. 常用脚本与工作流

### 2.1 开发

```powershell
pnpm dev
```

等价流程：

1. `predev`：`pnpm gen:tree`（生成 `public/projects-tree.json`）
2. `dev`：`vite`

### 2.2 构建

```powershell
pnpm build
```

等价流程：

1. `prebuild`：`pnpm gen:tree`
2. `build`：`tsc -b && vite build`

### 2.3 预览

```powershell
pnpm preview
```

### 2.4 代码检查

```powershell
pnpm lint
```

## 3. 工程结构与模块职责

> 以下是从当前仓库结构推断出的职责划分（以实际代码为准）。

- `src/main.tsx`
  - React 应用入口，渲染 `<Router />`
- `src/Router.tsx`
  - 顶层路由/布局容器（**当前文件为空**，需要你实现）
- `src/components/ProjectTree.tsx`
  - 项目树 UI 组件
  - 通过 `onSelectProject(projectPath)` 向外通知选中项目
  - 用 `selectedPath` 高亮当前选中项
- `src/types/projectTree.ts`
  - 项目树节点类型（如 `ProjectTreeNode`）
- `public/projects-tree.json`
  - 由 `gen:tree` 生成的项目树数据

## 4. 项目树生成脚本（build-project-tree）

脚本：`scripts/build-project-tree.mjs`

关键行为：

- `LAB_PROJECTS_ROOT` 默认指向：
  - `../ComplexSystemLab/ComplexSystemLab/Projects`
- 忽略目录：
  - `node_modules`、`dist`、`build`、`__pycache__`、`.git`、`.idea` 以及以 `.` 开头的目录
- 遍历方式：
  - 目录中存在 `project.txt` → 输出为 `{ type: "project", name, path }`
  - 否则继续递归子目录 → 输出为 `{ type: "folder", name, path, children }`
- 排序：按 `zh-Hans-CN` 进行 `localeCompare`

### 4.1 如何让某个目录出现在项目树中？

- 把该目录放在被扫描的 Projects 根目录下（默认是 Lab 的 Projects）
- 想让它成为“可点击的项目叶子”：在该目录里创建 `project.txt`

### 4.2 如果你的目录布局不同

如果你没有使用 `ComplexSystemLab/ComplexSystemLab/Projects` 这个路径，可以：

- 修改 `scripts/build-project-tree.mjs` 的 `LAB_PROJECTS_ROOT`
- 或者把路径改为从环境变量读取（可选增强：比如 `PROJECTS_ROOT`）

## 5. 路由/页面层的集成方式（建议）

由于 `src/Router.tsx` 当前为空，这里给出推荐的实现思路，方便后续扩展：

- 启动时 fetch `public/projects-tree.json`
- 渲染 `ProjectTree` 作为侧边栏
- 当用户选择某个 `projectPath`：
  - 方式 A：用 URL hash（`#/path`）或 query（`?project=...`）保存状态
  - 方式 B：使用 `react-router`（需要额外引入依赖）
- 主内容区：
  - 最简单：展示一个“占位页/说明页”，或把某些 known demo（如 `public/demos/*`）用 `<iframe>` 嵌入

> 备注：仓库里存在 `public/demos/graph_algorithms_js/*`，很适合先用 iframe 打通一个端到端的展示闭环。

## 6. 常见问题排查

### 6.1 `pnpm dev` 报错：找不到目录（ComplexSystemLab/Projects）

原因：`gen:tree` 找不到 `LAB_PROJECTS_ROOT`。

处理：

- 确认 `ComplexSystemLab` 与本仓库同级
- 或者修改脚本路径

### 6.2 修改 Lab 项目目录后，页面的项目树不更新

可能原因：

- 没有重新运行 `pnpm gen:tree`
- `pnpm dev` 正在运行但没触发重新生成（默认只在启动时跑一次）

处理：

- 手动执行 `pnpm gen:tree`
- 刷新页面

## 7. 低风险增强建议（可选）

- 让 `LAB_PROJECTS_ROOT` 支持环境变量覆盖
- 给 `gen:tree` 增加 `--root` 参数
- 在前端提供“重新生成/刷新项目树”的按钮（开发模式下）
