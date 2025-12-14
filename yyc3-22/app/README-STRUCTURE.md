# 📁 YYC3 项目结构说明文档

## 🎯 项目概述

YYC3 是一个多服务架构的应用平台，采用微服务设计模式，包含多个独立但相互协作的服务模块。本文档详细描述了项目的整体结构、各个服务的职责和目录组织。

## 🏗️ 项目整体结构

```
app/
├── admin/              # 管理后台服务
├── api/                # API 网关服务
├── llm/                # 大语言模型服务
├── mail/               # 邮件服务
├── redis/              # Redis 服务
├── config/             # 全局配置文件
├── docker-compose.yml  # Docker 编排配置
└── shared/             # 共享组件和工具
```

## 📦 服务模块说明

### 1. Admin 服务 (`/services/admin/`)

**职责**: 提供系统管理后台，包括用户管理、权限控制、系统监控等功能。

**技术栈**: Node.js, Express, TypeScript, Redis

**目录结构**:

```
src/
├── config/             # 配置文件
│   ├── env.ts          # 环境变量配置
│   └── redis.ts        # Redis 配置
├── controllers/        # 控制器层
├── middleware/         # 中间件
├── models/             # 数据模型
├── routes/             # 路由定义
├── services/           # 业务逻辑层
├── utils/              # 工具函数
│   └── logger.ts       # 日志工具
└── validators/         # 数据验证
```

### 2. API 服务 (`/services/api/`)

**职责**: 作为系统的 API 网关，处理客户端请求并路由到相应的服务模块。

**技术栈**: Node.js, Express, TypeScript, PostgreSQL, Redis

**目录结构**:

```
src/
├── config/             # 配置文件
│   ├── database.ts     # 数据库配置
│   ├── env.ts          # 环境变量配置
│   ├── redis.ts        # Redis 配置
│   └── security.ts     # 安全配置
├── controllers/        # 控制器层
├── middleware/         # 中间件
├── models/             # 数据模型
├── routes/             # 路由定义
├── services/           # 业务逻辑层
├── utils/              # 工具函数
└── validators/         # 数据验证
```

### 3. LLM 服务 (`/services/llm/`)

**职责**: 提供大语言模型相关功能，包括文本生成、对话系统等。

**技术栈**: Node.js, Express, TypeScript, Redis

**目录结构**:

```
src/
├── config/             # 配置文件
│   ├── env.ts          # 环境变量配置
│   └── redis.ts        # Redis 配置
├── controllers/        # 控制器层
├── middleware/         # 中间件
├── models/             # 数据模型
├── routes/             # 路由定义
│   ├── health.ts       # 健康检查路由
│   └── llm.ts          # LLM 功能路由
├── services/           # 业务逻辑层
├── utils/              # 工具函数
│   └── logger.ts       # 日志工具
└── validators/         # 数据验证
```

### 4. Mail 服务 (`/services/mail/`)

**职责**: 提供邮件发送和管理功能，支持多种邮件模板和发送方式。

**技术栈**: Node.js, TypeScript, PostgreSQL, Redis, React (前端)

**目录结构**:

```
packages/
├── api/                # API 服务
│   └── src/
│       ├── config/     # 配置文件
│       ├── controllers/ # 控制器层
│       ├── middlewares/ # 中间件
│       ├── models/     # 数据模型
│       ├── routes/     # 路由定义
│       └── utils/      # 工具函数
└── web/                # Web 前端
```

### 5. Redis 服务 (`/services/redis/`)

**职责**: 提供 Redis 缓存和消息队列服务，支持主从复制和哨兵模式。

**技术栈**: Redis, Docker

**目录结构**:

```
├── config/             # 配置文件
│   ├── redis-base.conf # 基础配置
│   ├── redis-dev.conf  # 开发环境配置
│   ├── redis-prod.conf # 生产环境配置
│   └── sentinel.conf   # 哨兵配置
├── docker-compose.yml  # Docker 编排配置
├── scripts/            # 运维脚本
└── src/                # Redis 管理服务
```

## 🎛️ 配置管理

### 环境变量配置

所有服务都遵循统一的环境变量配置模式，使用 Zod 进行验证，确保配置的安全性和一致性。

**统一配置文件位置**:
- 环境变量配置: `src/config/env.ts`
- Redis 配置: `src/config/redis.ts`
- 数据库配置: `src/config/database.ts` (如适用)
- 安全配置: `src/config/security.ts` (如适用)

### Docker 编排

项目使用 Docker Compose 进行服务编排，支持开发和生产环境的快速部署。

**主要配置文件**:
- `docker-compose.yml`: 主配置文件
- `docker-compose.blue.yml`: 蓝绿部署配置（蓝色环境）
- `docker-compose.green.yml`: 蓝绿部署配置（绿色环境）

## 📚 文档管理

项目文档采用分层管理，每个服务模块都有自己的文档目录，同时在根目录提供全局文档。

**文档结构**:
```
├── docs/               # 全局文档
├── admin/docs/         # 管理后台文档
├── api/docs/           # API 网关文档
└── redis/docs/         # Redis 服务文档
```

## 🔄 开发工作流

### 代码规范

- 语言: TypeScript (除 Redis 服务部分组件外)
- 编码规范: ESLint + Prettier
- 提交规范: Conventional Commits

### 部署流程

1. 本地开发: 使用 Docker Compose 启动开发环境
2. 测试环境: 自动部署到测试服务器
3. 生产环境: 采用蓝绿部署策略，确保零 downtime

## 🛡️ 安全措施

- 所有服务使用 HTTPS 协议
- API 请求进行身份验证和授权
- 输入数据严格验证
- 敏感信息加密存储
- 定期安全审计

## 📊 监控与日志

- 系统监控: 集成 Prometheus 和 Grafana
- 日志管理: 统一日志格式，支持日志聚合和分析
- 错误追踪: 实时错误监控和告警

## 🤝 团队协作

- Git 工作流: Git Flow
- CI/CD: GitHub Actions 自动构建和测试
- 代码审查: 强制代码审查制度

## 📈 性能优化

- 缓存策略: Redis 缓存热点数据
- 数据库优化: 索引优化和查询优化
- 负载均衡: 支持水平扩展
- 异步处理: 关键任务异步执行

## 🚀 快速开始

### 本地开发环境搭建

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d admin api
```

### 服务访问地址

| 服务 | 访问地址 |
|------|----------|
| Admin | http://localhost:3001 |
| API | http://localhost:3000 |
| LLM | http://localhost:3002 |
| Mail | http://localhost:3003 |
| Redis | redis://localhost:6379 |

## 📝 版本控制

项目遵循 Semantic Versioning (SemVer) 规范：
- MAJOR: 不兼容的 API 变更
- MINOR: 向后兼容的功能添加
- PATCH: 向后兼容的 bug 修复

## 🔮 未来规划

- 服务网格集成
- 无服务器架构迁移
- 更多 AI 功能集成
- 国际化支持

---

**保持代码健康，稳步前行！** 🌹
