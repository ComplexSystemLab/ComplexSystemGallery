# AI Agent 入口

本文件是所有 AI 编码工具的通用入口（工具中立）。

## 身份与写边界（本文件适用范围）

- **本文件适用根**：`/Users/ethan/CoreFiles/ProjectsFile/ComplexSystemGallery`（绝对路径，唯一）。多根工作区里其他根的指令文件不适用于本根。
- **根清单真源**：`ComplexSystemGallery.code-workspace`（VSCode 为真源）；工作区增删根后须同步本节，勿凭记忆改。
- **本根可写**：本仓库根目录内的全部内容（源码、`docs/`、配置）；以及下列对应笔记区。
- **对应笔记区**：（无挂载；如需登记，先在该 `.code-workspace` 里加根，再同步本节）
- **只读依赖（挂载但不可写）**：
  - ComplexSystemLab → `/Users/ethan/CoreFiles/ProjectsFile/ComplexSystemLab`
- **禁止写入**：任何未在本节列出的兄弟根；禁止按文档正文出现频次推断归属。
- **归属判据**：笔记项目的工程仓库以其 `_docs-mirror/<仓库名>/` 目录名为准，远程一律取 `git config --get remote.origin.url`（UHW 唯一总设计 §9.16）。

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
