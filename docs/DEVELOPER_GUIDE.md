# 开发者手册（ComplexSystemGallery）

本文件面向维护者，描述运行方式、工程结构、项目树生成机制，以及常见维护流程。

## 0. 你需要知道的“核心机制”

- 项目树数据文件是 `public/projects-tree.json`
- 它不是手写的，而是由脚本 `scripts/build-project-tree.mjs` 生成
- **脚本默认会扫描同级仓库 `ComplexSystemLab` 的 `ComplexSystemLab/Projects`**
- 判定“叶子项目”的标准：目录下存在 `project.txt`
- 前端运行时是 Vue 3，但工作台壳来自 `main-ui`，中间概览视口来自 `viewport-2d-kit`
- `package.json` 的 `predev`/`prebuild` 会在启动/构建前自动执行：
  - `pnpm build:deps`
  - `pnpm sync:demo-vendor`
  - `pnpm gen:tree`
- graph_algorithms_js demo 不再依赖外网 CDN，而是使用 `public/vendor/p5.min.js`

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

1. `predev`：`pnpm build:deps && pnpm sync:demo-vendor && pnpm gen:tree`
2. `dev`：`vite`

默认地址：`http://127.0.0.1:4173/`

### 2.2 构建

```powershell
pnpm build
```

等价流程：

1. `prebuild`：`pnpm build:deps && pnpm sync:demo-vendor && pnpm gen:tree`
2. `build`：`vue-tsc -b && vite build`

### 2.3 预览

```powershell
pnpm preview
```

默认地址：`http://127.0.0.1:4174/`

### 2.4 代码检查

```powershell
pnpm lint
```

### 2.5 基础包与 Demo 资源同步

```powershell
pnpm build:deps
pnpm sync:demo-vendor
```

- `build:deps` 会预构建 `../main-ui` 与 `../viewport-2d-kit`
- `sync:demo-vendor` 会把 `node_modules/p5/lib/p5.min.js` 复制到 `public/vendor/p5.min.js`

## 3. 工程结构与模块职责

当前职责划分如下：

- `src/main.ts`
  - Vue 应用入口
- `src/App.vue`
  - 挂载 `MainUiProvider` 和 `WorkbenchShell`
- `src/runtime/createGalleryRuntime.ts`
  - 注册 Gallery 工作区、默认编辑器与设置编辑器
  - 注册命令（刷新项目树 / 回到总览 / 重置布局）与 `Cmd/Ctrl+R` 快捷键
  - 注册菜单栏入口与 Gallery 设置项（`gallery.showUnregisteredProjects`、`gallery.treeExpandDepth`）
- `src/workbench/GalleryWorkbenchEditor.vue`
  - 主项目浏览器
  - 左侧树、中央 2D 概览、右侧 demo 预览都在这里组合
  - 消费 `main-ui` 设置项并响应命令事件（刷新 / 回到总览）
- `src/workbench/GallerySettingsEditor.vue`
  - Gallery 设置面板，包装 `main-ui` 的 `SettingsEditor` 组件
- `src/components/ProjectTreeNodeItem.vue`
  - 递归项目树节点组件
  - 支持通过 `expand-depth` 控制默认展开层级
- `src/projects/projectRegistry.ts`
  - 项目注册表：维护标题、分类、标签、说明和 `demoUrl`
  - `filterProjectTreeForGallery` 支持按“是否展示未注册项目”动态过滤
- `src/types/projectTree.ts`
  - 项目树节点类型
- `scripts/build-project-tree.mjs`
  - 从 Lab 扫描 `Projects` 并生成 `public/projects-tree.json`
- `scripts/sync-demo-vendor.mjs`
  - 同步本地 `p5.min.js` 到 `public/vendor/`
- `public/projects-tree.json`
  - 由 `gen:tree` 生成的项目树数据
- `public/vendor/p5.min.js`
  - graph_algorithms_js demo 使用的本地 p5 运行时

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

## 5. 当前页面结构与扩展方式

当前前端不再使用单独的 React 路由页面，而是使用一个单编辑器的 Vue3 工作台：

1. 左侧：项目树与目录统计信息
2. 中间：由 `Viewport2D` 渲染的项目概览视口
3. 右侧：项目说明、标签和 live demo iframe

当前 URL 约定：

- `/`：总览态
- `/project?path=...`：某个已选择项目的固定链接

如果需要接入新项目：

1. 确认 Lab 目录里存在 `project.txt`
2. 让 `pnpm gen:tree` 能扫描到该目录
3. 在 `src/projects/projectRegistry.ts` 中补充：
   - `projectPath`
   - `title`
   - `description`
   - `category`
   - `badges`
   - `demoUrl`（如果可预览）

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

### 6.3 graph_algorithms_js demo 打不开或报 `window.p5 is not a constructor`

原因：本地 `p5.min.js` 没有同步到 `public/vendor/`。

处理：

- 先执行 `pnpm install`
- 再执行 `pnpm sync:demo-vendor`
- 重启 `pnpm dev`

### 6.4 浏览器打开的不是本仓库页面

原因：同工作区内其他 Vite 项目可能占用了默认端口。

当前仓库已固定：

- 开发：`127.0.0.1:4173`
- 预览：`127.0.0.1:4174`

如果仍然冲突，Vite 会因为 `strictPort` 直接报错，此时先释放端口再启动。

## 7. 低风险增强建议（可选）

- 让 `LAB_PROJECTS_ROOT` 支持环境变量覆盖
- 给 `gen:tree` 增加 `--root` 参数
- 在前端提供“重新生成/刷新项目树”的按钮（开发模式下）
