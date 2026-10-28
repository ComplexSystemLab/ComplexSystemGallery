# AI Agent 入口

本文件是所有 AI 编码工具的通用入口（工具中立）。

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
