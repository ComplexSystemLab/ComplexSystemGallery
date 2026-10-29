# ComplexSystemGallery 项目指令（canonical）

> 本文件是本项目 AI 指令的唯一正文源；`CLAUDE.md`、`.github/copilot-instructions.md` 为薄转发壳。
> 详细多根工作区导航见同目录 `WORKSPACE_GUIDE.md`。

## 身份与写边界（本文件适用范围）

- **本文件适用根**：`/Users/ethan/CoreFiles/ProjectsFile/ComplexSystemGallery`（绝对路径，唯一）。多根工作区里其他根的指令文件不适用于本根。
- **根清单真源**：`ComplexSystemGallery.code-workspace`（VSCode 为真源）；工作区增删根后须同步本节，勿凭记忆改。
- **本根可写**：本仓库根目录内的全部内容（源码、`docs/`、配置）；以及下列对应笔记区。
- **对应笔记区（可写）**：
  - 笔记：复杂系统科学探索展览馆（本仓落点） → `/Users/ethan/Library/Mobile Documents/iCloud~md~obsidian/Documents/Engs_notebook/Projects/复杂系统科学探索展览馆`
- **依赖（同联合体成员，可直接改；默认改不改见 UHW AGENTS.md §0 · 4.5）**：
  - ComplexSystemLab → `/Users/ethan/CoreFiles/ProjectsFile/ComplexSystemLab`
  - 笔记：复杂系统科学探索（所属工作区 CSL，UHW 态势指针所在） → `/Users/ethan/Library/Mobile Documents/iCloud~md~obsidian/Documents/CS_notebook`
- **禁止写入**：任何未在本节列出的兄弟根；禁止按文档正文出现频次推断归属。
- **归属判据**：笔记项目的工程仓库以其 `_docs-mirror/<仓库名>/` 目录名为准，远程一律取 `git config --get remote.origin.url`（UHW 唯一总设计 §9.16）。

## 联合体态势（UHW）

本仓是 **UHW 联合体**（`union-hub-workspace`）工作区 **CSL 复杂系统实验室** 的成员。

**开工前先读**所属工作区笔记区的 `CS_notebook/_uhw-view/README.md`，顺指针读
`union-hub-workspace/index/工作区/ComplexSystemLab.md`，即得：CSL 成员 · 我消费谁 · 谁消费我 · 关联工作区协同动态。

- **同组直接联动**：对端是本工作区 folder，或在本视图的依赖边 / 依赖族 / 联合项目成员集内 → **直接改**（本仓 + 受影响组员仓一次改完、同轮验证），**不发信**。
- **邮箱仅兜底**（白名单四类）：① 对端不在本联合体 ② 对端当前不可写 ③ 事件性通告（只需知晓）④ 决策请求（回决策席）。
- 判据全文：`design/design-全链联动架构-20261008-001 · UHW 唯一总设计.md` **§十**。

## 驻场联络

本项目正在接受 main-ui 项目组驻场联络（v0.6.0 世代联合改造）。

- 驻场办公区：`docs/main-ui-liaison/`（任务书 + 台账）
- 主记录：`../main-ui/docs/HOST_JOINT_RETROFIT_0.6.0.md`
- 集成指南：`../main-ui/docs/HOST_INTEGRATION_GUIDE.md`

## 项目概况

- 名称：ComplexSystemGallery（p5 复杂系统画廊）
- 技术栈：p5 + viewport-2d-kit
- main-ui 依赖：^0.6.0
- 构建：`vue-tsc -b && vite build`

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

## main-ui 驻场联络

本项目正在接受 main-ui 项目组驻场联络。详见根目录 `AGENTS.md` 与 `docs/main-ui-liaison/`。
