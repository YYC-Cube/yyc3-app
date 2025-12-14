# 🔖 YYC3 根目录标准化规范

> 📋 **文档版本**: v1.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

**团队名称**：YanYuCloudCube

「YYC³ 技术文档标准化系列」

## *斜体英文标语*

## 📖 标准化概述

本文档定义了YYC3项目根目录的标准化结构规范，旨在提高项目可维护性、开发效率和部署标准化水平。

## 🏗️ 标准化根目录结构

app/
├── 📄 README.md                          # 项目主要说明文档
├── 📄 package.json                       # 项目依赖配置
├── 📄 docker-compose.yml                # Docker编排配置
├── 📄 Dockerfile                         # Docker镜像配置
├── 📄 .gitignore                         # Git忽略文件配置
├── 📄 .gitlab-ci.yml                     # GitLab CI/CD配置
├── 📄 .eslintrc.json                     # ESLint代码检查配置
├── 📄 .prettierrc.json                   # Prettier代码格式化配置
│
├── 📁 config/                            # 配置文件目录
│   ├── 📁 environments/                  # 环境配置
│   │   ├── 📄 .env.production.example     # 生产环境配置模板
│   │   ├── 📄 .env.development.example    # 开发环境配置模板
│   │   ├── 📄 .env.example               # 原环境配置模板
│   │   └── 📄 .env copy.example           # 备份环境配置模板
│   ├── 📁 services/                       # 服务配置
│   │   ├── 📄 api-service.json           # API服务配置
│   │   ├── 📄 admin-service.json         # 管理后台配置
│   │   ├── 📄 llm-service.json            # LLM服务配置
│   │   ├── 📄 mail-service.json           # 邮件服务配置
│   │   └── 📄 redis-service.json          # Redis服务配置
│   ├── 📁 deployments/                    # 部署配置
│   │   ├── 📄 llm.0379.email              # LLM服务域名配置
│   │   └── 📄 mail.0379.email             # 邮件服务域名配置
│   ├── 📄 jest.config.js                  # 测试配置
│   ├── 📄 next.config.js                  # Next.js配置
│   └── 📄 ecosystem.config.js             # PM2进程管理配置
│
├── 📁 services/                          # 微服务目录
│   ├── 📁 admin/                          # 管理后台服务 (端口 4001)
│   ├── 📁 api/                            # API服务 (端口 4000)
│   ├── 📁 llm/                            # AI大语言模型服务 (端口 4002)
│   ├── 📁 mail/                           # 邮件服务 (端口 4003)
│   ├── 📁 redis/                          # Redis缓存服务 (端口 3006)
│   ├── 📁 shared/                         # 共享模块库
│   └── 📁 html/                           # 静态资源 (已清理)
│
├── 📁 infrastructure/                    # 基础设施目录
│   ├── 📁 helm/                           # Kubernetes部署配置
│   ├── 📁 Frp/                            # 内网穿透配置
│   ├── 📁 scripts/                        # 部署和工具脚本
│   ├── 📁 healthcheck/                    # 健康检查脚本
│   └── 📁 etc/                            # 系统配置文件
│
├── 📁 development/                       # 开发相关目录
│   ├── 📁 docs/                           # 项目文档
│   ├── 📁 tests/                          # 测试文件
│   ├── 📁 public/                         # 静态资源和前端文件
│   └── 📁 .github/                        # GitHub Actions工作流
│
├── 📁 logs/                              # 日志目录
└── 📁 uploads/                           # 上传文件目录

## 📁 核心目录说明

### 1. 配置管理 (config/)

统一管理所有配置文件，按用途分类存放：

#### 环境配置 (environments/)

- `.env.production.example` - 生产环境完整配置模板
- `.env.development.example` - 开发环境完整配置模板
- `.env.example` - 基础环境配置模板
- `.env copy.example` - 配置备份文件

#### 服务配置 (services/)

- `api-service.json` - API服务详细配置
- `admin-service.json` - 管理后台配置
- `llm-service.json` - LLM服务配置
- `mail-service.json` - 邮件服务配置
- `redis-service.json` - Redis服务配置

#### 部署配置 (deployments/)

- 特定域名配置文件
- 环境变量部署配置
- 基础设施配置

### 2. 微服务目录 (services/)

每个微服务的独立目录，遵循标准化结构：

- `admin/` - 管理后台服务
- `api/` - 核心API服务
- `llm/` - AI大语言模型服务
- `mail/` - 邮件发送服务
- `redis/` - Redis缓存服务
- `shared/` - 共享组件库

### 3. 基础设施目录 (infrastructure/)

#### 容器化配置

- `docker-compose.yml` - Docker编排配置
- `Dockerfile` - 镜像构建配置

#### Kubernetes配置

- `helm/` - Helm Charts配置
- 部署模板和参数配置

#### 部署脚本

- `scripts/` - 所有部署相关脚本
- `healthcheck/` - 健康检查脚本
- `etc/` - 系统配置文件

### 4. 开发目录 (development/)

#### 文档和测试

- `docs/` - 项目技术文档
- `tests/` - 测试文件和配置
- `.github/` - CI/CD工作流配置

#### 前端资源

- `public/` - 静态资源、前端文件
- 图片、CSS、JavaScript文件

## 🔧 文件命名规范

### 配置文件命名

- 环境配置：`.env.{environment}.example`
- 服务配置：`{service-name}-service.json`
- 脚本文件：`kebab-case.sh`
- 文档文件：`KEBAB_CASE.md`

### 目录命名规范

- 使用小写字母和连字符
- 复数形式：`configs`, `scripts`, `services`
- 功能性命名：`infrastructure`, `development`

## 🚀 部署标准化

### 环境变量管理

```bash
# 生产环境
cp config/environments/.env.production.example .env.production

# 开发环境
cp config/environments/.env.development.example .env.development
```

### 服务配置管理

```bash
# 使用JSON配置文件
node --service-config config/services/api-service.json

# 或使用环境变量
export YYC3_API_CONFIG_PATH=config/services/api-service.json
```

### 脚本执行

```bash
# 部署脚本
./scripts/deploy.sh

# 健康检查
./healthcheck/check-all.sh

# 回滚操作
./scripts/rollback.sh
```

## 📊 端口分配标准

| 服务 | 开发端口 | 生产端口 | 配置文件 |
|------|----------|----------|----------|
| API服务 | 3000 | 6600 | `api-service.json` |
| 管理后台 | 3001 | 6601 | `admin-service.json` |
| LLM服务 | 3002 | 6602 | `llm-service.json` |
| 邮件服务 | 3003 | 6603 | `mail-service.json` |
| Redis服务 | 3004 | 6606 | `redis-service.json` |

## 🔒 安全配置规范

### 环境变量安全

- 敏感配置使用环境变量
- 配置文件中只包含模板和占位符
- 生产环境配置不提交到版本控制

### 权限管理

- 脚本文件设置适当权限：`chmod +x scripts/*.sh`
- 配置文件限制读取权限：`chmod 600 config/environments/.env*`
- 日志目录可写权限：`chmod 755 logs/`

## 🧪 测试配置

### 单元测试

```bash
# 使用统一测试配置
npm test --config=config/jest.config.js

# 生成覆盖率报告
npm run test:coverage
```

### 集成测试

```bash
# 启动测试环境
npm run test:integration

# 使用测试数据库
export DB_NAME=yyc3_test
```

## 📈 监控和日志

### 日志配置

- 统一日志格式：JSON
- 日志级别：DEBUG, INFO, WARN, ERROR
- 日志轮转：按日期和大小

### 监控配置

- 健康检查端点：`/health`
- 性能指标：`/metrics`
- 服务发现：Consul/Etcd

## 🔗 相关文档

- **架构标准化规范**: `[ARCHITECTURE_STANDARDIZATION.md](./ARCHITECTURE_STANDARDIZATION.md)`
- **技术文档**: `[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)`
- **API参考**: `[API_REFERENCE.md](./API_REFERENCE.md)`
- **标准化总结**: `[STANDARDIZATION_SUMMARY.md](./STANDARDIZATION_SUMMARY.md)`

## 🛠️ 维护指南

### 定期维护任务

1. **配置文件更新**：定期检查并更新配置模板
2. **依赖升级**：定期升级package.json中的依赖
3. **文档同步**：保持文档与代码同步
4. **安全检查**：定期进行安全漏洞扫描

### 添加新服务

1. 在`services/`目录下创建服务目录
2. 在`config/services/`下添加服务配置
3. 更新端口分配表
4. 添加对应的健康检查脚本
5. 更新相关文档

### 配置变更流程

1. 修改对应的配置模板文件
2. 测试配置变更
3. 更新环境变量文档
4. 通知相关团队配置变更
5. 部署到测试环境验证

## 📞 技术支持

- **配置问题**: <config@0379.email>
- **部署问题**: <deploy@0379.email>
- **架构问题**: <arch@0379.email>
- **紧急支持**: <emergency@0379.email>

---

## 📄 文档标尾 (Footer)

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
