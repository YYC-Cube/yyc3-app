# 🔖 YYC3 App 组件 - 企业多服务平台

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 📊 项目概览

### 🌟 核心功能

- **API服务**: 企业级RESTful API网关
- **管理控制台**: 可视化服务管理界面
- **LLM服务**: 智能对话与AI应用平台
- **邮件服务**: 企业级邮件发送与管理系统

### 🛡️ 项目徽章

[![YYC3 App](https://img.shields.io/badge/YYC3-App%20Component-blue.svg)](https://github.com/YYC-Cube/yyc3-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v2.1.0-orange.svg)](https://github.com/YYC-Cube/yyc3-app/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/YYC-Cube/yyc3-app/actions)
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen.svg)](https://sonarcloud.io/dashboard?id=YYC-Cube_yyc3-app)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)](https://github.com/YYC-Cube/yyc3-app/network/dependencies)
[![Docker Pulls](https://img.shields.io/docker/pulls/yanyu/yyc3-app.svg)](https://hub.docker.com/r/yanyu/yyc3-app)
[![Coverage Status](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://coveralls.io/github/YYC-Cube/yyc3-app)

### 📁 Git 项目结构

![Git-Expansion](public/Git-Expansion.png)

---

## 📋 文档信息

- **文档版本**: 2.1.0
- **创建日期**: 2024-01-15
- **最后更新**: 2024-11-20
- **作者**: YYC3 Development Team
- **审核人**: YYC3 Architecture Team

---

## 🎯 文档目的

本文档旨在提供YYC3 App组件的全面概览，包括系统架构、核心功能、部署方式、开发工具和CI/CD流程等信息，帮助开发人员、运维人员和系统管理员快速了解和使用该企业多服务平台。

## 👥 适用范围

本文档适用于以下人员：

- **系统开发人员**: 了解平台架构和开发流程
- **运维人员**: 负责平台部署、监控和维护
- **系统管理员**: 管理平台配置和用户权限
- **业务用户**: 了解平台功能和使用方法

## 📋 项目概述

YYC3 App组件是YYC3 AI Family统一平台的核心应用层，集成了4个主要微服务，提供完整的企业级API和管理功能。该组件采用现代化的微服务架构，支持高可用、可扩展的企业级部署。

### 🏗️ 系统架构

```text
YYC3 App 组件架构
├── 🚀 API Server (3000/6600)      # 核心API服务
├── 🎛️ Admin Console (3001/6601)  # 管理控制台
├── 🤖 LLM Service (3002/6602)     # AI对话服务
└── 📧 Mail Service (3003/6603)    # 邮件平台服务
```

### 🎯 核心优势

- **模块化设计**: 各服务独立部署，便于扩展和维护
- **高可用性**: 支持负载均衡和故障转移
- **安全性**: 内置TLS加密和权限控制
- **可扩展性**: 支持水平扩展和容器化部署
- **监控完善**: 提供全面的健康检查和性能监控

## 🛡️ 项目维护

为了确保项目长期保持健康、有序的状态，我们提供了详细的项目维护指南。

### 📚 维护指南文档

完整的项目维护指南请参考：[项目维护指南](./.trae/rules/maintenance_guide.md)

### 🤖 自动化维护工具

项目已集成了完整的自动化维护工具：

```bash
# 代码标准化检查
npm run standardize

# 服务健康检查
npm run health:check

# 完整的CI/CD检查
npm run ci:setup
npm run ci:lint
npm run ci:test
npm run ci:build
npm run ci:security
npm run ci:standardize
```

### 📅 定期维护任务

- **每日检查**: 运行代码标准化检查和服务健康检查
- **每周检查**: 更新依赖包、检查安全漏洞、审查日志文件
- **每月检查**: 审查项目结构、更新文档、执行性能分析
- **季度维护**: 重构代码、优化数据库索引、审查架构设计

保持代码健康，稳步前行！ 🌹

### 🌐 域名服务映射

| 服务名称 | 开发端口 | 生产端口 | 域名 | 状态 |
|---------|---------|---------|------|------|
| API服务器 | 3000 | 6600 | api.0379.email | ✅ 运行中 |
| 管理控制台 | 3001 | 6601 | admin.0379.email | ✅ 运行中 |
| LLM/AI服务 | 3002 | 6602 | llm.0379.email | ✅ 运行中 |
| 邮件服务 | 3003 | 6603 | mail.0379.email | ✅ 运行中 |

### 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **后端** | Node.js + Express.js | 18+ / 4.18+ |
| **缓存** | Redis + Redis Cluster | 6.0+ |
| **容器化** | Docker + Kubernetes + Helm | 20.10+ / 1.24+ / 3.8+ |
| **服务管理** | Nginx + TLS + PM2 | 1.20+ / 1.3+ / 5.2+ |
| **CI/CD** | GitHub Actions + GitLab CI | - |
| **监控** | Prometheus + Grafana | 2.37+ / 9.0+ |
| **文档** | Swagger/OpenAPI | 3.0 |

## � 项目结构

详细的项目架构说明请参考 [README_ARCHITECTURE.md](./README_ARCHITECTURE.md)。

## 🚀 快速部署

```bash
bash ./scripts/init.sh
bash ./scripts/release.sh
```

## �️ 开发工具

### 🔍 代码质量检查

```bash
# 代码规范检查
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 代码格式化
npm run format

# 检查代码格式化
npm run format:check

# 代码标准化检查
npm run standardize

# 自动修复标准化问题
npm run standardization:fix
```

### 🧪 测试工具

```bash
# 运行单元测试
npm test

# 生成测试覆盖率报告
npm run test:coverage
```

### 🩺 健康检查

```bash
# 运行健康检查
npm run health:check
```

## 🚦 CI/CD 流程

详细的 CI/CD 流程说明请参考 [CI/CD 文档](./.github/docs/README_CICD.md)。

### 📦 部署命令

#### 部署到测试环境

```bash
npm run deploy:staging
```

#### 部署到生产环境

```bash
npm run deploy:production
```

#### 回滚部署

```bash
npm run deploy:rollback
```

## � 文档入口

- [Changelog 页面](./docs/changelog.html)
- [版本对比](./docs/changelog-diff.html)
- [Helm Chart 文档](./helm/README.md)

---

## ✅ Git Commit Message 规范

```markdown
# Git Commit Message 规范

## 格式
<类型>(可选作用域): <描述>

## 类型
- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 重构代码
- test: 添加或修改测试
- chore: 构建过程或辅助工具变动
- ci: CI/CD 配置更新

## 示例
feat(api): 新增邮件健康检查接口
fix(admin): 修复 Swagger 路径错误
docs(helm): 更新 Chart.yaml 说明文档
```

---

## 🏗️ 架构总览：0379.email 多服务平台

<!-- markdownlint-disable MD013 -->
| 模块        | 子域名               | 服务路径                           | 配置路径                                           |
|-------------|----------------------|-----------------------------------|----------------------------------------------------|
| Mail 服务   | mail.0379.email      | `/www/app/services/mail/server.js`| `/etc/nginx/sites-available/mail.0379.email.ssl.conf` |
| API 服务    | api.0379.email       | `/www/app/services/api/server.js` | `/etc/nginx/sites-available/api.0379.email.ssl.conf` |
| Admin 面板  | admin.0379.email     | `/www/app/services/admin/server.js`| `/etc/nginx/sites-available/admin.0379.email.ssl.conf` |
| LLM 服务    | llm.0379.email       | `/www/app/services/llm/server.js` | `/etc/nginx/sites-available/llm.0379.email.ssl.conf` |
<!-- markdownlint-enable MD013 -->

---

## 📦 服务部署路径结构

```text
/www/app/
├── services/
│   ├── api/
│   │   ├── server.js
│   │   └── .env
│   ├── admin/
│   │   ├── server.js
│   │   └── .env
│   ├── llm/
│   │   ├── server.js
│   │   └── .env
│   ├── mail/
│   │   ├── server.js
│   │   └── .env
├── helm/
│   ├── Chart.yaml
│   ├── templates/
│   └── values.yaml
├── scripts/
│   ├── init.sh
│   ├── push-helm.sh
│   ├── release.sh
│   ├── gen-changelog.sh
│   ├── compare-changelog.sh
│   └── gitlab-release.sh
├── docs/
│   ├── changelog.html
│   ├── changelog-diff.html
│   ├── changelog.json
│   ├── changelog.css
│   ├── releases.md
│   └── index.html
```

---

## 🔐 TLS 与 Nginx 配置

- **TLS 证书路径**: `/etc/letsencrypt/live/0379.email/`
  <!-- cspell:ignore letsencrypt -->
- **Nginx 配置路径**: `/etc/nginx/sites-available/*.0379.email.ssl.conf`
- **自动挂载脚本**: `init.sh` 中自动链接并 reload

---

## 🚀 自动化脚本与发布流程

| 脚本名                  | 功能说明                                      |
|-------------------------|-----------------------------------------------|
| `init.sh`               | 初始化 .env、TLS Secret、Nginx 配置、注册服务 |
| `push-helm.sh`          | 打包并推送 Helm Chart 到 GitHub Pages         |
| `release.sh`            | 自动递增版本号并发布 Helm Chart               |
| `gen-changelog.sh`      | 生成中英文 changelog                          |
| `compare-changelog.sh`  | 对比两个版本 changelog 差异                   |
| `gitlab-release.sh`     | 将 changelog 与 Helm Chart 推送到 GitLab Release |

---

## 📚 文档与 Wiki 页面结构

```text
wiki/
├── Home.md
├── Services/
│   ├── api-server.md
│   ├── admin-server.md
│   ├── llm-server.md
│   └── mail-server.md
├── Deployment/
│   ├── PM2.md
│   ├── Docker.md
│   ├── Helm.md
│   └── CI-CD.md
├── Docs/
│   ├── Swagger.md
│   └── Postman.md
├── Security/
│   ├── TLS.md
│   └── healthcheck.md
├── Releases.md
```

---

## ⚡ 一键创建服务目录与空文件

适用于在新环境中快速搭建项目结构：

```bash
# 创建服务目录
mkdir -p /www/app/services/api /www/app/html \
         /www/app/logs /www/app/node_modules
mkdir -p /www/app/services/admin /www/app/services/llm \
         /www/app/services/mail

# 初始化每个服务的 server.js 与 .env 文件
touch /www/app/services/api/server.js \
      /www/app/services/api/.env
touch /www/app/services/admin/server.js \
      /www/app/services/admin/.env
touch /www/app/services/llm/server.js \
      /www/app/services/llm/.env
touch /www/app/services/mail/server.js \
      /www/app/services/mail/.env

# 初始化 package.json（如需）
touch /www/app/services/api/package.json \
      /www/app/services/admin/package.json \
      /www/app/services/llm/package.json \
      /www/app/services/mail/package.json

# 创建 Helm Chart 结构
mkdir -p /www/app/helm/templates
touch /www/app/helm/Chart.yaml /www/app/helm/values.yaml

# 创建自动化脚本目录与空脚本
mkdir -p /www/app/scripts
touch /www/app/scripts/init.sh /www/app/scripts/push-helm.sh \
      /www/app/scripts/release.sh
touch /www/app/scripts/gen-changelog.sh /www/app/scripts/compare-changelog.sh \
      /www/app/scripts/gitlab-release.sh

# 创建文档目录与 changelog 页面
mkdir -p /www/app/docs
touch /www/app/docs/changelog.html /www/app/docs/changelog-diff.html \
      /www/app/docs/changelog.json /www/app/docs/changelog.css \
      /www/app/docs/releases.md /www/app/docs/index.html

# 创建 Wiki 页面结构
mkdir -p /www/app/wiki/Services /www/app/wiki/Deployment /www/app/wiki/Docs /www/app/wiki/Security
touch /www/app/wiki/Home.md
touch /www/app/wiki/Services/api-server.md \
      /www/app/wiki/Services/admin-server.md \
      /www/app/wiki/Services/llm-server.md \
      /www/app/wiki/Services/mail-server.md
touch /www/app/wiki/Deployment/PM2.md /www/app/wiki/Deployment/Docker.md \
      /www/app/wiki/Deployment/Helm.md /www/app/wiki/Deployment/CI-CD.md
touch /www/app/wiki/Docs/Swagger.md /www/app/wiki/Docs/Postman.md
touch /www/app/wiki/Security/TLS.md /www/app/wiki/Security/healthcheck.md
touch /www/app/wiki/Releases.md
```

---

## 📄 .gitignore 文件

```text
# Node.js
node_modules/
npm-debug.log*
yarn-error.log*

# Python
__pycache__/  # <!-- cspell:ignore pycache -->
*.py[cod]
*.egg-info/
.env

# Logs
logs/
*.log

# Helm
helm-dist/
*.tgz
index.yaml

# System
.DS_Store
.idea/
.vscode/
*.swp

# CI/CD
.env.local
.env.production
.env.example
```

---

## � .env.example 模板

适用于所有服务模块（mail/api/admin/llm）：

```plaintext
# 服务配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 安全与认证
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret

# 数据库连接
DB_URI=mongodb://localhost:27017/email

# 日志与调试
LOG_LEVEL=info
```

> ✅ 可复制为 .env 并根据服务模块调整端口与密钥

---

## 🌐 GitHub Pages 首页展示

项目提供了可直接部署至 GitHub Pages 或团队门户的首页展示页面：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>0379.email 多服务平台架构</title>
  <style>
    body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
    h1, h2 { color: #333; }
    ul { margin-bottom: 20px; }
    pre { background: #f4f4f4; padding: 10px; }
  </style>
</head>
<body>
  <h1>0379.email 多服务平台架构</h1>

  <h2>📦 服务子域名</h2>
  <ul>
    <li><strong>mail.0379.email</strong> → 邮件服务</li>
    <li><strong>api.0379.email</strong> → API 网关</li>
    <li><strong>admin.0379.email</strong> → 管理面板</li>
    <li><strong>llm.0379.email</strong> → AI 推理服务</li>
  </ul>

  <h2>🧩 技术栈</h2>
  <p>Node.js + Python + Helm + Nginx + TLS + PM2 + GitHub Actions + GitLab CI</p>

  <h2>🚀 快速部署</h2>
  <pre><code>bash ./scripts/init.sh
bash ./scripts/release.sh</code></pre>

  <h2>📘 文档入口</h2>
  <ul>
    <li><a href="changelog.html">Changelog 页面</a></li>
    <li><a href="changelog-diff.html">版本对比</a></li>
    <li><a href="helm/README.md">Helm Chart 文档</a></li>
  </ul>
</body>
</html>
```

---

## 📄 文档标尾 (Footer)

「YYC³ 技术文档标准化系列」

「***YanYuCloudCube***」
「***<admin@0379.email>***」
「***Words Initiate Quadrants, Language Serves as Core for the Future***」
「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

---

> 📞 **联系我们**：<admin@0379.email>
> 📁 **项目地址**：<https://github.com/YYC-Cube/yyc3-app>
> 🔄 **版本更新**：2024-11-20

---
