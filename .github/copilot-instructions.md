# Copilot 指南（ComplexSystemGallery）

## 项目大图景
- 这是一个 Vite + React + TypeScript 的“项目画廊”站点，项目树数据来自生成文件 `public/projects-tree.json`。
- 项目树不是手写：由 `scripts/build-project-tree.mjs` 扫描同级仓库 `../ComplexSystemLab/ComplexSystemLab/Projects` 生成。
- 叶子项目判定规则：目录内存在 `project.txt`（脚本会据此输出 `{ type: "project" }` 节点）。
- 前端核心入口：`src/main.tsx` 渲染 `<Router />`，而 `src/Router.tsx` 目前为空，需要按产品形态实现路由/布局。

## 关键工作流（必须知道）
- 安装依赖：`pnpm install`。
- 开发：`pnpm dev`（会先运行 `pnpm gen:tree` 生成项目树）。
- 构建：`pnpm build`（等价于 `tsc -b && vite build`，构建前会 `pnpm gen:tree`）。
- 代码检查：`pnpm lint`。

## 项目特定约定
- 项目树扫描默认依赖同级 `ComplexSystemLab`，缺失会导致 `pnpm dev` 报“找不到目录”。
- 忽略目录规则：`node_modules/dist/build/__pycache__/.git/.idea` 及所有以 `.` 开头的目录（见脚本）。
- 项目树排序使用 `zh-Hans-CN` 的 `localeCompare`。

## 组件与数据流示例
- `scripts/build-project-tree.mjs` → 生成 `public/projects-tree.json` → 前端读取后渲染。
- `src/components/ProjectTree.tsx` 通过 `onSelectProject(projectPath)` 向上通知选中项。

## 文档与变更要求
- 文档集中在 `docs/`，每次新增/改动/修复后需要更新相关文档并在 `docs/CHANGELOG.md` 追加记录。

## Python 注释规范（适用于本仓库内 Python 文件）
- 只添加文档注释与必要的行内说明注释，不改动代码逻辑与实现。
- 类、方法、函数、字段必须补全简体中文文档注释，使用 Google Python 风格的文档字符串；字段标题保持英文（如 Args、Returns、Methods、Warnings、Examples）。
- 文档注释必须使用以下格式（单独三引号占行，内容为中文）：
	"""
	注释内容
	"""
- 除专有名词、变量名、术语等不适合翻译的内容外，其余描述统一使用中文。
- 对关键逻辑或重要代码段落补充必要的中文行内注释说明。
