# 0379.email 项目

> 言传千行代码，语枢万物智能

## 📋 项目概述

0379.email 是一个基于微服务架构的企业级邮件服务平台，集成了AI/LLM服务、管理面板、Wiki系统等综合功能。项目采用现代化技术栈，提供高性能、安全可靠的邮件服务解决方案。

## 🏗️ 系统架构

### 微服务架构

- **API 服务** (3000端口) - RESTful API 网关
- **管理面板** (3001端口) - 系统管理界面
- **AI/LLM 服务** (3002端口) - 智能化语言模型服务
- **邮件服务** (3003端口) - 邮件处理和发送
- **Wiki 服务** (3004端口) - 知识管理系统

### 数据存储

- **Redis** (6379端口) - 缓存和会话存储
- **MongoDB** (27017端口) - 文档数据库
- **PostgreSQL** (5432端口) - 关系型数据库

### 基础设施

- **Nginx** (80/443端口) - Web服务器和负载均衡
- **Prometheus** (9090端口) - 监控数据收集
- **Grafana** (3001端口) - 监控面板可视化
- **FRP** (7000端口) - 内网穿透服务

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Docker 24+
- Docker Compose 2.0+
- OpenSSL 3.0+

### 安装和配置

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd 0379.email
   ```

2. **初始化设置**

   ```bash
   make setup
   make setup-security
   ```

3. **配置环境变量**

   ```bash
   cp configs/environments/.env.example configs/environments/.env
   # 根据需要修改配置文件
   ```

4. **启动开发环境**

   ```bash
   make dev
   ```

5. **访问服务**
   - 主站点: <http://localhost>
   - 管理面板: <http://localhost:3001>
   - API文档: <http://localhost:3000/docs>

## 📖 文档结构

### 项目文档

- [项目架构](docs/architecture/system-design.md) - 系统架构设计
- [部署指南](docs/deployment/production.md) - 生产环境部署
- [API文档](docs/api/openapi.yaml) - RESTful API规范
- [安全指南](docs/security/security.md) - 安全配置和最佳实践

### 服务文档

- [Mail服务文档](docs/services/mail-service.md)
- [LLM服务文档](docs/services/llm-service.md)
- [监控指南](docs/operations/monitoring.md)
- [故障排除](docs/operations/troubleshooting.md)

## 🔧 开发指南

### 开发环境设置

```bash
# 安装依赖
make install

# 启动开发服务
make dev

# 查看日志
make logs

# 运行测试
make test

# 代码检查
make lint
```

### 代码规范

- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 Git 提交规范
- 编写单元测试和集成测试
- 代码审查和合并策略

## 🛡️ 安全配置

### 密钥管理

- SSH密钥存储在 `keys/ssh/` 目录
- SSL证书存储在 `keys/certificates/` 目录
- 服务密钥存储在 `keys/secrets/` 目录

### 安全最佳实践

- 定期轮换密钥和证书
- 实施最小权限原则
- 启用安全监控和日志记录
- 定期进行安全审计

## 📊 监控和运维

### 监控指标

- 服务可用性和性能指标
- 系统资源使用情况
- 应用错误率和响应时间
- 安全事件和访问日志

### 备份策略

- 自动化数据库备份
- 配置文件版本控制
- 日志文件归档管理
- 灾难恢复计划

## 🚀 部署

### 开发环境

```bash
make dev          # 启动开发环境
make dev-stop     # 停止开发环境
make dev-restart   # 重启开发环境
```

### 生产环境

```bash
make prod-start    # 启动生产环境
make prod-stop     # 停止生产环境
make deploy        # 部署到生产环境
make deploy-check  # 检查部署状态
```

## 🔄 CI/CD

### GitHub Actions

- **持续集成**: 代码检查和测试
- **持续部署**: 自动化部署流程
- **安全扫描**: 漏洞检测和依赖检查
- **质量检查**: 代码质量分析

### 分支策略

- `main` - 生产环境分支
- `develop` - 开发环境分支
- `feature/*` - 功能开发分支

## 🔧 配置管理

### 环境配置

- 开发环境: `configs/environments/.env.development`
- 测试环境: `configs/environments/.env.staging`
- 生产环境: `configs/environments/.env.production`

### Docker配置

- 开发环境: `docker-compose.dev.yml`
- 生产环境: `docker-compose.prod.yml`
- 安全配置: `docker-compose.secure.yml`

## 🤝 贡献指南

### 开发流程

1. Fork 项目仓库
2. 创建功能分支
3. 开发和测试
4. 提交 Pull Request
5. 代码审查和合并

### 代码规范

- 遵循项目编码规范
- 编写完整的测试用例
- 更新相关文档
- 确保向后兼容性

## 📞 支持和联系

### 技术支持

- **文档**: [项目Wiki](docs/wiki/Home.md)
- **问题反馈**: [GitHub Issues](https://github.com/your-org/0379.email/issues)
- **安全报告**: <security@0379.email>

### 社区

- **项目主页**: <https://0379.email>
- **开发者社区**: <https://community.0379.email>
- **更新日志**: [CHANGELOG.md](CHANGELOG.md)

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🎯 项目状态

- ✅ 基础架构设计
- ✅ 核心服务实现
- ✅ 安全配置完善
- ✅ 监控系统集成
- 🚧 文档完善中
- 🚘 测试覆盖优化
- 🚌 性能优化中

---

**项目版本**: v1.0.0
**最后更新**: 2024-11-10
**维护团队**: 0379.email 开发团队

- **API服务** (端口: 3000): 提供核心业务API接口
- **Admin服务** (端口: 3001): 管理后台接口
- **LLM服务** (端口: 3002): 大型语言模型集成服务
- **Mail服务** (端口: 3003): 邮件发送服务
- **MongoDB** (端口: 27017): 数据库服务
- **Nginx** (端口: 80/443): 反向代理服务

## 项目结构

```

/www
├── app/                   # 应用代码目录
│   ├── api/               # API服务
│   ├── admin/             # Admin服务
│   ├── llm/               # LLM服务
│   ├── mail/              # Mail服务
│   ├── shared/            # 共享模块
│   ├── docs/              # 文档
│   ├── scripts/           # 脚本文件
│   ├── Dockerfile         # 应用Docker构建文件
│   └── package.json       # 项目依赖
├── nginx/                 # Nginx配置
├── .github/workflows/     # CI/CD配置
├── docker-compose.yml     # Docker Compose配置
├── docker-compose.dev.yml # 开发环境Docker Compose配置
└── README.md              # 项目文档
```

## 环境要求

- Node.js v18+
- npm v8+
- Docker v20+
- Docker Compose v2+
- Git

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/app-platform.git
cd app-platform
```

### 2. 环境配置

创建环境变量文件：

```bash
# 生产环境
cp app/.env.example app/.env.production

# 开发环境
cp app/.env.example app/.env.development

# 测试环境
cp app/.env.example app/.env.staging
```

编辑环境变量文件，设置必要的配置参数：

```
# 数据库配置
DB_URI=mongodb://localhost:27017/app

# 安全配置
API_KEY=your_api_key
JWT_SECRET=your_jwt_secret

# 服务配置
SERVICE_NAME=api
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 3. 使用Docker Compose启动（推荐）

#### 开发环境

```bash
# 使用开发配置启动所有服务
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 生产环境

```bash
# 构建并启动生产环境服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

### 4. 传统方式启动

#### 安装依赖

```bash
cd app
npm install
```

#### 启动单个服务

```bash
# 启动API服务
cd app/api
node server.js

# 启动Admin服务
cd app/admin
node server.js

# 其他服务类似...
```

## 部署指南

### 使用部署脚本

```bash
# 查看帮助
app/scripts/deploy.sh --help

# 部署所有服务到开发环境
app/scripts/deploy.sh

# 部署特定服务到生产环境
app/scripts/deploy.sh -e production -s api -s admin

# 重启所有服务
app/scripts/deploy.sh -a restart
```

### 自动化部署

本项目使用GitHub Actions实现自动化CI/CD流程：

- 代码推送到`develop`分支自动部署到测试环境
- 代码推送到`main`/`master`分支自动部署到生产环境
- 支持手动触发特定环境和服务的部署

## 开发指南

### 代码风格

项目遵循ESLint和Prettier配置的代码风格规范：

```bash
# 检查代码风格
cd app
npm run lint

# 自动格式化代码
cd app
npm run format
```

### 开发工具

推荐使用VSCode配合以下插件：

- ESLint
- Prettier
- Docker
- GitLens

### 扩展开发

添加新服务的步骤：

1. 创建服务目录：`mkdir app/newservice`
2. 创建服务入口文件：`app/newservice/server.js`
3. 添加路由和业务逻辑
4. 在`docker-compose.yml`中添加服务配置
5. 更新部署脚本支持新服务

## 文档

- [API文档](http://localhost:3000/docs)
- [性能优化指南](app/docs/performance-optimization.md)
- [代码风格指南](app/docs/code-style-guide.md)
- [日志与错误处理指南](app/docs/logging-error-handling-guide.md)

## 故障排除

### 常见问题

1. **服务无法启动**：检查端口是否被占用，日志文件位于`app/logs/`目录
2. **数据库连接失败**：检查MongoDB服务状态和连接字符串
3. **权限错误**：确保部署脚本有执行权限，运行`chmod +x app/scripts/deploy.sh`

### 查看日志

```bash
# 查看API服务日志
docker-compose logs -f api

# 查看所有服务日志
docker-compose logs -f

# 查看特定服务的错误日志
cat app/logs/api.err.log
```

## 许可证

[MIT](LICENSE)
