# 📬 mailbox/relay — 多项目联动治理

本项目已接入 autodo 多项目联动治理体系。

## 信箱结构

```
docs/mailbox/relay/
  registry.md       ← 本项目的治理身份证
  dependencies.md   ← 依赖了谁（上游清单）
  support.md        ← 被谁依赖（下游清单）
  updates/          ← 更新类信件（支持建议）
    inbox/          ← 来自上游的更新通知
    outbox/         ← 发给下游的更新通知
  feedback/         ← 反馈类信件（依赖反馈）
    inbox/          ← 来自下游的反馈
    outbox/         ← 发给上游的反馈
  archive/          ← 过时信件归档（不纳入 git）
```

## 本项目的信箱角色

- 上游依赖：见 `dependencies.md`
- 下游客户：见 `support.md`

## 如何使用

### 查信
打开 `updates/inbox/` 和 `feedback/inbox/`，看是否有新 `.md` 文件。

### 写信
在对应功能目录创建 `{peerProjectId}/{peerProjectId}-{YYYYMMDDHHmmss}.md` 文件（先建子文件夹）。文件名带时间戳，多封信不互相覆盖。

### 投递（自助）
写完信后默认直接复制到对方项目对应 inbox 目录（见 `.ai-instructions.md`），无需等待统一投递。

### 统一投递 / 归档
需要时由「多项目联动治理体系智能体」执行：`autodo-app/scripts/governance_backend` 下的 CLI（bootstrap / deliver / archive）或 `pnpm run mailbox:api` 后端。

## AI Agent 指引

AI Agent 请参见 `.ai-instructions.md`。
