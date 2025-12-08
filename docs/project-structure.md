# 0379.email 项目目录结构

## 项目概览

该项目是一个多服务平台架构，包含核心应用（app）和邮件服务（email）两个主要模块，以及相关的配置和支持组件。本文档提供完整的目录结构参考，便于开发和运维人员了解整个项目架构。

## 1. app 目录结构（核心应用）

```
www/app/
├── 0379.email 团队 Onboarding 指南_标准版.md
├── 0379.email 团队 Onboarding 指南_执行报告.md
├── 0379.email 团队 Onboarding 指南.md
├── admin/                # 管理后台服务
│   ├── package.json
│   ├── server.js
│   └── swagger.json
├── api/                  # API 服务
│   ├── app.py
│   ├── middleware/
│   │   └── validation.js
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── status.js
├── COMMIT_CONVENTION.md  # Git 提交规范
├── deploy.sh             # 部署脚本
├── docker-compose.yml    # Docker 编排配置
├── Dockerfile            # Docker 构建文件
├── docs/                 # 项目文档
│   ├── architecture-review-report.md
│   ├── architecture-summary.md
│   ├── changelog-diff.html
│   ├── changelog-diff.md
│   ├── changelog.css
│   ├── changelog.html
│   ├── changelog.json
│   ├── changes.en.txt
│   ├── changes.zh.txt
│   ├── code-style-guide.md
│   ├── deployment/       # 部署相关文档
│   │   ├── ci-cd.md
│   │   ├── cloud-nas-sync.md
│   │   ├── docker-deployment.md
│   │   ├── helm-deployment.md
│   │   └── pm2-deployment.md
│   ├── helm-versioning.md
│   ├── index.html
│   ├── logging-error-handling-guide.md
│   ├── performance-optimization.md
│   ├── releases.md
│   ├── security/         # 安全相关文档
│   │   ├── healthcheck.md
│   │   └── tls-configuration.md
│   ├── service-mesh-gateway-config-center-migration.md
│   ├── service-mesh-usage-guide.md
│   ├── services/         # 服务文档
│   │   ├── admin-server.md
│   │   ├── api-server.md
│   │   ├── llm-server.md
│   │   └── mail-server.md
│   └── versions.json
├── ecosystem.config.js   # PM2 配置
├── etc/                  # 系统配置
│   ├── nginx/            # Nginx 配置
│   │   ├── nginx.conf
│   │   ├── sites-available/
│   │   │   ├── admin.0379.email.ssl.conf
│   │   │   ├── api.0379.email.ssl.conf
│   │   │   ├── llm.0379.email.ssl.conf
│   │   │   └── mail.0379.email.ssl.conf
│   │   └── snippets/
│   │       └── upstream-healthcheck.conf
│   └── systemd/          # Systemd 服务配置
│       └── system/
│           ├── admin-healthcheck.service
│           ├── admin-healthcheck.timer
│           ├── api-healthcheck.service
│           ├── api-healthcheck.timer
│           ├── api-server.service
│           ├── llm-healthcheck.service
│           ├── llm-healthcheck.timer
│           ├── mail-healthcheck.service
│           ├── mail-healthcheck.timer
│           ├── yyc-healthcheck.service
│           └── yyc-healthcheck.timer
├── gen-changelog-json.sh # 生成更新日志脚本
├── gitlab-release.sh     # GitLab 发布脚本
├── healthcheck/          # 健康检查
│   ├── api.healthcheck.md
│   └── ping.sh
├── helm/                 # Helm 部署配置
│   ├── Chart.yaml
│   ├── chartmuseum.yaml
│   ├── README.md
│   ├── templates/
│   │   ├── deployment.yaml
│   │   ├── ingress.yaml
│   │   └── service.yaml
│   └── values.yaml
├── html/                 # HTML 服务
│   ├── server.js
│   └── status.js
├── init-folders.sh       # 初始化目录脚本
├── jest.config.js        # Jest 配置
├── llm/                  # 大语言模型服务
│   ├── server.js
│   └── swagger.json
├── llm.0379.email        # LLM 服务配置文件
├── logs/                 # 日志目录
│   └── deploy.log
├── mail/                 # 邮件服务
│   ├── html/
│   │   ├── server.js
│   │   └── swagger.json
│   ├── logs/
│   └── server.js
├── mail.0379.email       # 邮件服务配置文件
├── mnt/                  # 挂载目录
│   └── data/
│       ├── server.js
│       ├── wiki/
│       │   ├── Releases.md
│       │   └── wiki/
│       └── www/
│           └── email/
│               └── ecosystem.config.js
├── next.config.js        # Next.js 配置
├── nginx-https-setup.sh  # Nginx HTTPS 设置脚本
├── package.json          # 项目依赖
├── push-chartmuseum.sh   # 推送 Chart 到 ChartMuseum 脚本
├── push-ghpages.sh       # 推送文档到 GitHub Pages 脚本
├── push-helm.sh          # 推送 Helm Chart 脚本
├── README_ARCHITECTURE.md # 架构说明文档
├── README.md             # 项目说明文档
├── rollback.sh           # 回滚脚本
├── scripts/              # 工具脚本集合
│   ├── backup-to-nas.sh
│   ├── check-env.sh
│   ├── compare-changelog.sh
│   ├── deploy-multi.sh
│   ├── deploy-to-aliyun.sh
│   ├── deploy-to-cloud.sh
│   ├── deploy.sh
│   ├── ecs-init.sh
│   ├── gen-changelog-diff.sh
│   ├── generate-keys-linux.sh
│   ├── generate-keys-macos.sh
│   ├── generate-keys-windows.ps1
│   ├── generate-mesh-config.js
│   ├── init.sh
│   ├── multi-machine-coordination.md
│   ├── nas-setup.sh
│   ├── push-helm.sh
│   ├── README-keys.md
│   ├── README.md
│   ├── release.sh
│   ├── service-mesh-start.js
│   ├── setup-nginx.sh
│   ├── setup-ssh-keys.sh
│   ├── ssh_config_example
│   ├── ssh_push_key.sh
│   ├── start-services.sh
│   ├── start.sh
│   ├── sync-config.sh
│   ├── sync-to-nas.sh
│   ├── sync-with-cloud.sh
│   ├── update-changelog.sh
│   └── version-bump.sh
├── search.html           # 搜索页面
├── shared/               # 共享模块
│   ├── cache/
│   │   └── index.js
│   ├── config-center/
│   │   └── index.js
│   ├── docs.js
│   ├── errorHandler.js
│   ├── gateway/
│   │   ├── enhanced-gateway.js
│   │   └── index.js
│   ├── logger.js
│   ├── logging/
│   │   └── logger-aggregator.js
│   ├── messaging/
│   │   └── index.js
│   ├── monitoring/
│   │   └── index.js
│   ├── redis/
│   │   ├── client.js
│   │   ├── config.js
│   │   ├── index.js
│   │   └── security.js
│   ├── service-discovery/
│   │   └── index.js
│   ├── service-mesh/
│   │   ├── envoy-config-generator.js
│   │   ├── integration-example.js
│   │   └── service-mesh-manager.js
│   ├── status/
│   │   └── index.js
│   ├── status.js
│   └── validation/
│       ├── index.js
│       └── zod-schemas.js
├── tests/                # 测试目录
│   ├── setup.ts
│   ├── setupAfterEnv.ts
│   └── unit/
│       └── utils.test.ts
├── uninstall.sh          # 卸载脚本
└── wiki/                 # 项目 Wiki
    ├── Advanced-Features.md
    ├── Configuration.md
    ├── Deployment/
    │   ├── Docker.md
    │   ├── Helm.md
    │   └── PM2.md
    ├── Docs/
    │   ├── api-reference.md
    │   └── user-guide.md
    ├── Home.md
    ├── README.md
    ├── Releases.md
    ├── Security/
    │   └── security.md
    └── Services/
        ├── admin-server.md
        ├── api-server.md
        ├── llm-server.md
        └── mail-server.md
```

## 2. email 目录结构（邮件服务）

```
www/email/
├── admin/          # 管理后台
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── analytics/      # 分析服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── api/            # API 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── cloud/          # 云服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── data/           # 数据服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── db/             # 数据库服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── dev/            # 开发环境
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── doc/            # 文档服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── files/          # 文件服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── frp/            # FRP 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── git/            # Git 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── html/           # 主 HTML 服务
│   └── index.html
├── llm/            # 大语言模型服务
│   ├── .env.example
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── mail/           # 邮件服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── media/          # 媒体服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── monitor/        # 监控服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── nas/            # NAS 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── nettrack/       # 网络跟踪服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── php/            # PHP 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── plex/           # Plex 媒体服务器
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── spns/           # SPNS 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── vpn/            # VPN 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── web/            # Web 服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
├── www/            # 主网站服务
│   ├── html/
│   │   └── index.html
│   └── logs/
│       ├── access.log
│       └── error.log
└── yyc/            # YYC 个人服务
    ├── html/
    │   └── index.html
    └── logs/
        ├── access.log
        └── error.log
```

## 3. 项目架构特点

### 3.1 app 模块特点

- **多服务架构**：包含 admin、api、llm、mail 等多个微服务
- **完善的文档体系**：包含架构文档、部署文档、安全文档等
- **自动化运维**：提供丰富的脚本支持部署、备份、同步等操作
- **服务网格**：实现了基于 Envoy 的服务网格功能
- **健康检查**：集成了系统级健康检查机制
- **容器化支持**：提供 Docker 和 Helm 部署配置

### 3.2 email 模块特点

- **子域名服务集群**：每个子目录对应一个子域名服务
- **统一的目录结构**：每个服务都包含 html 和 logs 两个子目录
- **独立的日志管理**：每个服务都有独立的访问日志和错误日志

## 4. 服务间关系

- **app**：核心应用模块，包含业务逻辑和主要服务
- **email**：邮件服务模块，提供各种子域名服务的前端页面和日志
- **共享组件**：通过 shared-lib 实现模块间代码共享
- **部署协调**：使用 deploy-to-server.sh 脚本协调多模块部署

## 5. 配置文件管理

- **环境配置**：使用 .env 文件管理环境变量
- **服务配置**：每个服务都有自己的配置文件
- **系统配置**：在 etc 目录下管理 Nginx 和 Systemd 配置
- **密钥管理**：通过 scripts 目录下的密钥生成脚本管理

## 6. 日志管理

- **应用日志**：各服务独立的日志目录
- **系统日志**：通过 Systemd 服务管理的日志
- **访问日志**：Nginx 访问日志
- **错误日志**：详细的错误跟踪日志

保持目录结构清晰，便于项目维护和扩展！ 🌹
