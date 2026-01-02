# 产品需求文档（PRD）— ComplexSystemGallery

> 版本：v0.1
>
> 更新日期：2026-01-02

## 1. 背景与目标

ComplexSystemGallery 是一个基于 **Vite + React + TypeScript** 的“项目画廊”站点，用于把同级仓库 **ComplexSystemLab**（默认路径：`../ComplexSystemLab/ComplexSystemLab/Projects`）中的项目，以“项目树”的方式组织、导航和展示。

核心目标：

- 自动扫描 Projects 目录结构，生成可被前端消费的项目树数据。
- 通过 UI（项目树 + 项目页）快速定位某个项目并展示其内容。
- 为后续持续添加 Demo、实验项目、算法可视化等内容提供一个稳定的承载层。

## 2. 术语

- **Lab**：ComplexSystemLab 仓库。
- **Projects 根目录**：Lab 中用于承载各项目的根目录（默认：`ComplexSystemLab/Projects`）。
- **叶子项目**：在某目录下存在 `project.txt` 的项目目录；此目录被视为可点击的一个项目节点。
- **项目树**：由脚本扫描生成的树状结构，输出为 `public/projects-tree.json`。
- **已注册项目**：在 Gallery 代码内显式提供渲染入口（例如 `src/projects/*`）的项目。

## 3. 用户画像与使用场景

### 3.1 用户画像

- **普通用户/浏览者**：想快速查看某个项目 Demo 的效果。
- **项目作者/维护者**：频繁添加/调整 Projects 中内容，需要 Gallery 自动反映变更。
- **开发者**：需要在 Gallery 中为某项目补充“项目页渲染逻辑”。

### 3.2 核心场景

1. 打开站点，浏览左侧项目树。
2. 搜索/展开树节点，定位到某个项目。
3. 点击项目，进入项目页：
   - 若项目已注册：展示项目页 UI（可能含 iframe、React 交互组件等）。
   - 若项目未注册：展示“未实现/未展示”的提示。
4. 给 Lab 新增一个项目目录并添加 `project.txt`。
5. 启动/构建 Gallery，自动重新生成项目树并在页面里可见。

## 4. 范围（Scope）

### 4.1 In Scope（本期必须）

- 启动与构建前自动生成项目树（`predev`/`prebuild`）。
- 项目树数据落盘为 `public/projects-tree.json`，前端加载并渲染。
- 项目树支持文件夹/项目两种节点。
- 支持忽略常见无关目录（`node_modules`、`.git` 等）。
- 提供开发者文档、用户手册、开发日志与 PRD。

### 4.2 Out of Scope（本期不做/可选）

- 复杂的权限/登录系统。
- 在线编辑/管理项目元信息。
- 项目树的实时监听（文件变更自动重跑 gen:tree）。

## 5. 功能需求（Functional Requirements）

### FR-01 项目树生成

- **输入**：Lab Projects 目录结构。
- **处理规则**：
  - 默认扫描路径：`../ComplexSystemLab/ComplexSystemLab/Projects`（可通过修改脚本适配）。
  - 忽略目录：`node_modules/dist/build/__pycache__/.git/.idea` 与所有以`.`开头的目录。
  - 若目录包含 `project.txt`：生成 `type: "project"` 节点。
  - 否则：生成 `type: "folder"` 节点并递归扫描子目录。
- **输出**：`public/projects-tree.json`。

验收标准：

- 执行 `pnpm gen:tree` 后 `public/projects-tree.json` 被更新。
- 新增/删除项目目录可反映在 JSON 中。

### FR-02 前端渲染项目树

- 前端读取 `public/projects-tree.json` 并渲染为树形导航。
- 可展开/折叠文件夹节点。
- 点击叶子项目节点后，触发项目页展示。

验收标准：

- 页面可见树结构，并能正确触发选择。

### FR-03 项目页渲染与注册机制

- Gallery 内部可以对项目路径进行“注册”，为该项目提供标题与渲染函数。
- 对于未注册项目：
  - 仍可在树中显示（是否显示由开关控制）。
  - 点击后显示“未实现/未展示”提示。

相关实现参考：

- `src/projects/projectRegistry.ts`：项目注册入口与过滤逻辑。

验收标准：

- 已注册项目可显示自定义渲染内容。
- 未注册项目点击后有明确提示。

### FR-04 文档体系

- `docs/PRD.md`：产品需求文档。
- `docs/USER_MANUAL.md`：产品用户手册。
- `docs/CHANGELOG.md`：开发日志/变更记录。
- 更新：
  - `docs/DEVELOPER_GUIDE.md`
  - `docs/README.md`
  - 根目录 `README.md`

验收标准：

- 文档可被目录索引到，结构清晰。

## 6. 非功能需求（Non-functional Requirements）

- **可维护性**：脚本/前端逻辑清晰，文档齐全。
- **可移植性**：默认依赖同级 Lab，但允许通过改脚本或环境变量方式适配（可选增强）。
- **性能**：项目树生成应能应对中等规模目录（数千节点）且在可接受时间内完成。
- **可靠性**：Projects 根目录不存在时，错误信息清晰，可指引解决。

## 7. 风险与对策

- 风险：Lab 不在默认同级路径，导致 `gen:tree` 失败。
  - 对策：文档中明确路径假设与修改方式。
- 风险：项目数增大，树渲染性能下降。
  - 对策：后续可加入搜索、虚拟列表等优化（不在本期）。

## 8. 里程碑（建议）

- M1：文档补齐（PRD/用户手册/开发日志）
- M2：路由/布局完善（当前 `src/Router.tsx` 仍需实现/确认）
- M3：更多项目页注册与 Demo 承载方式沉淀（iframe/React component 规范化）

