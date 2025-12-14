# YYC3 Redis 组件 - Redis缓存服务

---

## 文档信息

- **文档版本**: 2.0.0
- **创建日期**: 2024-01-15
- **最后更新**: 2024-01-15
- **作者**: YYC3 Development Team
- **审核人**: YYC3 Architecture Team

---

## 文档目的

本文档旨在提供YYC3 Redis组件的全面使用指南，包括系统架构、部署方式、配置说明、安全规范、运维管理等信息，帮助开发人员、运维人员和系统管理员快速部署和管理Redis缓存服务。

## 适用范围

本文档适用于以下人员：

- 系统开发人员：了解Redis组件的架构和集成方式
- 运维人员：负责Redis服务的部署、监控和维护
- 系统管理员：管理Redis服务的配置和安全策略

---

> 💾 YYC3 AI Family 专业Redis缓存服务 - 高性能、高可用的缓存管理和数据处理平台

[![YYC3 Rdeis](https://img.shields.io/badge/YYC3-Rdeis%20Service-red.svg)](https://github.com/YYC-Cube/yyc3-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v2.0.0-orange.svg)](https://github.com/YYC-Cube/yyc3-app/releases)

## 📋 项目概述

YYC3 Rdeis组件是YYC3 AI Family统一平台的核心缓存服务层，基于Redis构建，提供高性能、高可用的缓存管理、会话存储、实时数据处理等功能。该组件采用现代化的缓存架构设计，支持集群部署、数据持久化、安全认证等企业级特性。

> 言传千行代码，语枢万物智能

### 🏗️ 系统架构

```
YYC3 Rdeis 缓存服务架构
├── 💾 Redis Cluster (6379/6606)     # Redis缓存集群
├── 🔌 API Gateway (3000)          # Redis管理API
├── 🛡️ Security Layer              # 安全认证层
├── 📊 Monitoring System          # 监控系统
└── 🔧 Management Tools           # 运维管理工具
```

## 仓库地址

- API 仓库：`git@github.com:YYC-Cube/yyc3-rediops-api.git`

## 文档

- `docs/NAS-DEPLOY.md` — NAS 部署规划与上线方案
- `docs/API-COMPOSE.md` — API 与 Redis 编排（Compose）使用指南

## 一键编排（可选）

- 准备：复制 `config/.env.example` 为 `config/.env` 并按需修改端口/密码
- 开发联调：`docker compose -f config/docker-compose.yml up -d redis-dev api-dev`
- 生产演练：`docker compose -f config/docker-compose.yml up -d redis-prod api-prod`
- 停止：`docker compose -f config/docker-compose.yml stop api-dev api-prod`
- 日志：`docker compose -f config/docker-compose.yml logs -f api-dev`

## 变量说明（Compose 与容器）

- Compose 插值：读取 `Shell 环境` 与 `config/.env`；不读取 `env_file:`。
- 容器内环境：由 `env_file: ../.env.local` 注入给容器运行时。
- 建议：`REDIS_PROD_PASSWORD` 在 `config/.env` 与 `../.env.local` 保持一致。

## 热重载快速指南（api-dev）

- 前提：`api/package.json` 已配置 `scripts.dev` 为 `nodemon index.js`（已完成）。
- 启动：`api-dev` 在 Compose 中使用 `npm run dev`，代码变更将自动重启。
- 查看日志：`docker compose -f config/docker-compose.yml logs -f api-dev`
- 快速验证：`curl http://localhost:${API_DEV_PORT-默认3000}/status` 期待 `redis: ok`。
- 关闭热重载：将 Compose 中 `api-dev` 的 `command` 改为 `node index.js` 或使用 `npm run start`。
- 忽略变更：`api/nodemon.json` 已忽略 `node_modules/**`、`logs/**`、`.git/**`、`*.log`，可按需扩展。
  本仓库用于统一管理 Redis 开发与生产环境的配置与运维脚本，提供一套标准化的目录结构、启动/停止命令、健康检查与安全规范。

> 说明：`api/` 为独立的 Node API 项目，此次规范化不涉及该目录的代码调整。

## 目录结构

- `config/` Redis 配置与 `docker-compose.yml`
  - `redis-base.conf` 通用基础配置（容器内路径：`/etc/redis/redis-base.conf`）
  - `redis-dev.conf` 开发环境配置
  - `redis-prod.conf` 生产环境配置（强密码、禁用高危命令、持久化、内存策略）
  - `docker-compose.yml` 开发/生产容器编排
- `scripts/` 运维脚本（详见 `docs/SCRIPTS.md`）
  - `redis-manager.sh` 统一管理启动/停止/状态/健康检查
  - `check-redis-prod.sh` 部署前安全校验
  - `start-redis-dev.sh` 本地快速启动
  - `start-redis-docker.sh` Docker 启动入口
  - `sync-redis-config.sh` 配置同步与备份
- `logs/` 日志目录（`dev/`、`prod/`）
- `docs/` 文档
  - `REDIS.md` 配置说明
  - `OPS.md` 运维与部署规范
  - `ENV.md` 环境变量规范
  - `SECURITY.md` 安全策略（极简/强校验切换与 ACL 示例）
  - `NAS-DEPLOY.md` NAS 部署规划与上线方案

## 初始化

- 准备目录（如缺失）：
  - `mkdir -p scripts logs/dev logs/prod`
- 初始化环境变量：
  - `cp .env.example .env.local`
  - （可选）`source .env.local` —— 管理脚本已自动加载 `.env.local`，未提供则回退 `.env.example`

## 前置条件

- macOS（本地调试），已安装：Docker / Docker Compose、Bash、`redis-cli`
- 生产容器镜像：`redis:alpine`（入口 `docker-entrypoint.sh`，命令传入配置路径）

## 快速开始

- 开发（Docker）：
  - `bash scripts/redis-manager.sh start --mode docker --env dev`
  - `bash scripts/redis-manager.sh status`
  - `bash scripts/redis-manager.sh health --env dev`
- 生产（Docker）：
  - 严格校验：`bash scripts/check-redis-prod.sh`
  - 本地调试放宽：`ALLOW_WEAK_PROD=1 bash scripts/check-redis-prod.sh`
  - 启动：`bash scripts/redis-manager.sh start --mode docker --env prod`
  - 健康（带认证）：`REDIS_PROD_PASSWORD=redis_yyc3 bash scripts/redis-manager.sh health --env prod`

## 健康检查与端口

- 生产容器：宿主 `6380` → 容器 `6379`
- 开发容器：宿主 `6381` → 容器 `6380`（示例）
- Compose 健康检查：`CMD-SHELL redis-cli -a "$REDIS_PROD_PASSWORD" -p 6379 ping`
- `redis-manager.sh` 在主机与容器两侧执行 PING，并输出内存信息

## 安全规范（生产）

- 默认极简安全（本地推荐）：`protected-mode yes`、`requirepass`、保留 `CONFIG`，不启用 ACL 与命令禁用，`.env.local` 建议 `ALLOW_WEAK_PROD=1`
- 可切换强校验（更严格）：禁用 `FLUSHALL`、`FLUSHDB`，将 `.env.local` 设为 `ALLOW_WEAK_PROD=0` 后执行严格校验脚本：`bash scripts/check-redis-prod.sh`
- 切换指引：修改 `config/redis-prod.conf` 增加/移除 `rename-command` 行并重启容器；详见 `docs/SECURITY.md`

## 持久化与数据目录

- 目录：`dir /data`（容器内路径）
- RDB 文件名：`dbfilename dump-prod.rdb`
- AOF 文件名：`appendfilename "appendonly-prod.aof"`
- 推荐：`stop-writes-on-bgsave-error yes`、`aof-load-truncated yes`

## 内存策略

- 示例：`maxmemory 8gb`（本地环境）
- 策略：`maxmemory-policy volatile-lru`
- 按机器资源与负载调整，并复核健康输出

## 常用运维命令

- 查看日志：`docker logs --tail 200 redis-prod`
- 检查容器：`docker inspect redis-prod`
- 容器内快速内存测试：`redis-server --test-memory 8192`

## 参考文档

- `docs/REDIS.md` 配置细节与模块兼容性
- `docs/OPS.md` 运维流程与故障排查
- `docs/ENV.md` 环境变量规范
- `docs/SCRIPTS.md` 脚本用法详解

## 范围说明

- 本次标准化不涉及 `api/` 目录的代码与文档调整；其依赖与说明见 `api/README.md`。

> 言启象限，语枢智能

---

## 🧩 Redis 数据库基础概念

- Redis 默认支持 16个逻辑数据库，编号从 0 到 15
- 每个数据库是隔离的，但共享同一个 Redis 实例
- 默认连接的是 0号数据库
- 切换数据库不会影响连接，只改变当前操作的上下文

---

## 🛠️ 1. 命令行方式设置与切换

```bash
# 登录 Redis（默认连接数据库 0）
redis-cli -a your_password

# 切换到数据库 1
SELECT 1

# 设置键值
SET mykey "hello"

# 查看当前数据库编号
INFO keyspace

```

> ✅ 推荐在脚本中显式使用 SELECT，避免默认连接误操作
---

## ⚙️ 2. Redis 配置文件设置（redis.conf）

```plaintext
# 设置数据库数量（默认16）
databases 16

# 设置默认数据库（连接后仍需 SELECT）
# Redis 不支持直接设置默认数据库编号，但客户端可自动切换

```

> ✅ 修改后需重启 Redis 服务：redis-server redis.conf
---

## 🧪 3. SpringBoot 中设置 Redis 数据库

```yaml
# application.yml 示例
spring:
  redis:
    host: localhost
    port:6379
    password: your_password
    database: 2  # 使用第2号数据库

```

> ✅ Spring 会自动连接并切换到指定数据库，无需手动 SELECT
---

## 🧬 4. Python 中设置 Redis 数据库（redis-py）

```python
import redis

r = redis.StrictRedis(
    host='localhost',
    port=6379,
    password='your_password',
    db=3  # 使用第3号数据库
)

r.set('mykey', 'hello')
print(r.get('mykey'))

```

> ✅ db 参数决定连接的数据库编号
---

## 🧠 延伸建议

|场景|推荐做法|
|-|-|
|多项目共享 Redis 实例|每个项目使用不同数据库编号（如 0~3）|
|数据隔离与清理|使用 FLUSHDB 清空当前数据库，FLUSHALL 清空所有|
|Redis Desktop Manager|可视化工具支持切换数据库与查看数据结构|
|Redis Cluster 环境|不支持多数据库，仅使用数据库 0|

---

Redis 初始化脚本、CI/CD 清理与注入逻辑，以及 Mac 上的数据库匹配与操作指导
---

## ✅ 1. Redis 初始化脚本：init-redis.ts

这个脚本会连接 Redis，清空指定数据库，注入推荐引擎相关的测试数据。

```plaintext
// init-redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 3, // 使用第3号数据库
});

async function initRedis() {
  console.log('🧹 清空 Redis 数据库...');
  await redis.flushdb();

  console.log('📥 注入测试数据...');
  await redis.set('score_weights:v1:click', '0.6');
  await redis.set('score_weights:v1:favorite', '0.9');
  await redis.set('user:u1:actions', JSON.stringify(['click:doc_1', 'favorite:doc_2']));
  await redis.set('user:u2:actions', JSON.stringify(['search:AI tutorial', 'click:doc_1']));
  await redis.set('feedback:doc_1', JSON.stringify(['u1:positive', 'u2:positive']));
  await redis.set('feedback:doc_2', JSON.stringify(['u2:negative']));

  console.log('✅ Redis 初始化完成');
  await redis.quit();
}

initRedis().catch(console.error);

```

---

## 🔁 2. CI/CD 联动：GitHub Actions 自动清理并注入 Redis 测试数据

### 📁 .github/workflows/init-redis.yml

```yaml
name: Init Redis

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  redis-init:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run Redis Init Script
        run: npx ts-node init-redis.ts
        env:
          REDIS_PASSWORD: ${{ secrets.REDIS_PASSWORD }}

```

> ✅ 推荐将 Redis 密码存储为 GitHub Secret：REDIS_PASSWORD
---

## 🍎 3. Mac 上 Redis 操作指导（匹配当前数据库）

### 🧰 安装与启动 Redis

```bash
brew install redis
brew services start redis

```

### 🧪 清空当前数据库（默认是 0）

```bash
redis-cli FLUSHDB

```

### 🔄 切换数据库（如使用数据库 3）

```bash
redis-cli
SELECT 3
FLUSHDB
SET test_key "hello"
GET test_key

```

### 🧠 查看当前数据库状态

```bash
INFO keyspace

```

输出示例：

```plaintext
# Keyspace
db3:keys=6,expires=0,avg_ttl=0

```

---

## 🧠 延伸建议

|场景|推荐做法|
|-|-|
|多环境隔离|每个环境使用不同 Redis 数据库编号（如 dev=3, test=4）|
|推荐引擎缓存结构|使用 score_weights:{version}:{type} 命名规范|
|用户行为缓存|使用 user:{id}:actions 结构，便于分析与推荐|
|CI/CD 注入一致性|Redis 与 MySQL 同步注入测试数据，保持联动|
