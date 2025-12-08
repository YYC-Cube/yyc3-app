# 安全策略指南

本指南定义三种安全模式，适配不同的部署场景：默认采用增强安全模式（平衡安全性与可用性），可按需切换为极简安全（仅用于本地开发）或完全安全（生产部署）。

## 策略概览

- **增强安全模式**（默认推荐，平衡安全与运维便利性）
  - 启用 `requirepass` 与 `protected-mode yes`。
  - 重命名/禁用敏感命令：`CONFIG`、`DEBUG`、`MODULE`、`SLAVEOF/REPLICAOF`。
  - 禁用危险命令：`FLUSHALL`、`FLUSHDB`。
  - 配置：默认 `ENABLE_ENHANCED_SECURITY=1`。
  
- **极简安全模式**（仅用于本地开发调试）
  - 仅启用 `requirepass` 与 `protected-mode yes`。
  - 保留所有命令，不进行命令重命名或禁用。
  - 配置：`.env.local` 设置 `ALLOW_WEAK_PROD=1`。
  
- **完全安全模式**（生产环境强制要求）
  - 包含增强安全模式的所有措施。
  - 强制使用 ACL 进行细粒度权限控制。
  - 禁用弱校验：`.env.local` 设置 `ALLOW_WEAK_PROD=0`。
  - 必须通过完整的安全校验脚本检查。

## 1. 极简安全模式（仅开发环境）

- 配置文件关键项（`config/redis-prod.conf`）：
  - `protected-mode yes`
  - `requirepass <你的密码>`（示例：`redis_yyc3`）
  - 保留所有命令，不进行重命名或禁用
- 环境配置：
  - `.env.local` 设置：
    - `REDIS_PROD_PASSWORD=redis_yyc3`
    - `ALLOW_WEAK_PROD=1`（启用弱校验）
    - `ENABLE_ENHANCED_SECURITY=0`（禁用增强安全检查）
- 适用场景：仅用于本地开发调试，不允许用于任何生产环境

## 2. 增强安全模式（默认推荐）

- 配置文件关键项（`config/redis-prod.conf`）：

```
# 安全：增强版基线配置
protected-mode yes
requirepass <强密码>
# 禁用危险命令
rename-command FLUSHALL ""
rename-command FLUSHDB ""
# 重命名敏感命令
rename-command CONFIG "config_protected"
rename-command DEBUG ""
rename-command SLAVEOF ""
rename-command REPLICAOF ""
rename-command MODULE ""
```

- 环境配置：
  - `.env.local` 设置：
    - `REDIS_PROD_PASSWORD=<与配置文件一致的强密码>`
    - `ENABLE_ENHANCED_SECURITY=1`（启用增强安全检查）
- 校验与启动：
  - 安全校验：`bash scripts/check-redis-prod.sh`
  - 启动服务：`bash scripts/redis-manager.sh start --mode docker --env prod`

## 3. 完全安全模式（生产环境）

- 配置：包含增强安全模式的所有配置
- 额外的 ACL 配置：

```
# 生产环境 ACL 配置示例
acl setuser readonly on >readonly_password ~* +@read -@write -config*
aclsave
```

- 环境配置：
  - `.env.local` 设置：
    - `REDIS_PROD_PASSWORD=<强密码>`
    - `ALLOW_WEAK_PROD=0`（禁用弱校验）
    - `ENABLE_ENHANCED_SECURITY=1`（强制增强安全检查）
- 强制安全校验：
  - 运行：`ALLOW_WEAK_PROD=0 ENABLE_ENHANCED_SECURITY=1 bash scripts/check-redis-prod.sh`
- 生产部署：
  - 必须绑定特定内网 IP，不能使用 `bind 0.0.0.0`
  - 必须配置防火墙规则限制访问
  - 定期轮换密码和更新配置

## ACL（可选进阶）

- 在极简或强校验模式下，如需限制敏感子命令（例如 `CONFIG SET`），可使用 ACL：
  - 添加只读用户：`acl setuser readonly on >password ~* +@read -@write -config|set`
  - 添加读写但限制配置的用户：`acl setuser writer on >password ~* +@read +@write -config|set`
- 使用说明：
  - 创建用户后，客户端以 `redis://user:password@host:port` 连接。
  - ACL 规则需结合业务角色分配，谨慎操作。

## 风险与注意

- 本地极简安全不适合公网场景；如需公网直连，至少启用强校验并配置防火墙规则或隧道。
- 变更密码需同步：配置文件（`requirepass`）、`.env.local`（`REDIS_PROD_PASSWORD`）、Compose 健康检查。
- 禁用 `CONFIG` 可能导致部分模块或工具初始化失败；推荐保留 `CONFIG`，用 ACL 管理子命令。

## 关联文档

- `docs/ENV.md` 环境变量规范
- `docs/OPS.md` 运维与部署规范
- `docs/REDIS.md` 配置说明（持久化/内存策略）
