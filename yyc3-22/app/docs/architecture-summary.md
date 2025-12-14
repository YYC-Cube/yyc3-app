# 🔖 YYC3 App 组件架构文档

> 📋 **文档版本**: v2.1.0 | **更新时间**: 2024-11-20 | **维护团队**: YYC3 AI Family

**团队名称**：YanYuCloudCube

「YYC³ 技术文档标准化系列」

*斜体英文标语*

## 📋 项目概述

YYC3 App组件是YYC3 AI Family统一平台的核心应用层，采用微服务架构设计，提供4个主要的企业级服务。该组件通过标准化接口、统一监控、容器化部署等技术手段，实现了高可用、可扩展的企业级服务架构。

## 🏗️ 主机与域名结构

### 服务器配置
- **生产服务器**: root@8.152.195.33 (yyc3-33)
- **开发服务器**: root@8.152.195.33 (yyc3-33)
- **NAS服务器**: YYC@192.168.3.45 (yyc3-45)
- **主域名**: 0379.email
- **扩展域名**: 0379.love

### 子域名服务映射
| 服务名称 | 子域名 | 内部端口 | 外部端口 | 状态 |
|---------|--------|----------|----------|------|
| API服务器 | api.0379.email | 3000 | 6600 | ✅ 运行中 |
| 管理控制台 | admin.0379.email | 3001 | 6601 | ✅ 运行中 |
| LLM/AI服务 | llm.0379.email | 3002 | 6602 | ✅ 运行中 |
| 邮件服务 | mail.0379.email | 3003 | 6603 | ✅ 运行中 |

### TLS证书配置
- **证书路径**: /etc/letsencrypt/live/0379.email/
- **公钥文件**: fullchain.pem
- **私钥文件**: privkey.pem
- **证书提供商**: Let's Encrypt
- **自动续期**: 支持自动证书续期

## 二、服务监听与反向代理

| 服务名       | 监听地址       | Nginx 代理端口 | 配置文件路径                                         |
| ------------ | -------------- | -------------- | ---------------------------------------------------- |
| api-server   | 127.0.0.1:3000 | 443            | /etc/nginx/sites-available/api.0379.email.ssl.conf   |
| mail-server  | 127.0.0.1:3003 | 443            | /etc/nginx/sites-available/mail.0379.email.ssl.conf  |
| llm-server   | 127.0.0.1:3002 | 443            | /etc/nginx/sites-available/llm.0379.email.ssl.conf   |
| admin-server | 127.0.0.1:3001 | 443            | /etc/nginx/sites-available/admin.0379.email.ssl.conf |

## 三、接口模块化与复用

- 所有服务挂载 /api 路径，包含标准接口：
  - /api/hello
  - /api/status
  - /api/version
  - /api/metrics
  - /api/healthcheck
- 接口逻辑模块：/Users/yanyu/www/yyc3-22/app/shared/status.js
- Swagger 文档模块：/Users/yanyu/www/yyc3-22/app/shared/docs.js
- Swagger JSON 文件：每服务生成 swagger.json
- Postman 集合：每服务生成 postman_collection.zip

## 四、部署与守护方式

- PM2 守护配置：/Users/yanyu/www/yyc3-22/app/ecosystem.config.js
- 自动部署脚本：/Users/yanyu/www/yyc3-22/app/deploy.sh
- systemd 定时探针任务：每服务写入 /var/log/<name>-health.log

## 五、容器化与集群部署

- Docker Compose 模板：/Users/yanyu/www/yyc3-22/app/docker-compose.yml
- Helm Chart 模板路径：/Users/yanyu/www/yyc3-22/app/helm/
  - 包含：Chart.yaml, values.yaml, deployment.yaml, service.yaml, ingress.yaml
  - TLS Secret 挂载：yyc3-tls-secret
- Helm Chart 包：yyc3-services-1.0.1.tgz
- Helm 脚本：uninstall.sh, rollback.sh, push-helm.sh

## 六、CI/CD 与版本发布

- GitHub Actions：.github/workflows/deploy.yml
- GitLab CI：.gitlab-ci.yml
- Helm Chart 发布：
  - GitHub Pages：<https://yyc3.github.io/YanYuCloudCube>
  - OCI 仓库：oci://ghcr.io/yyc3/yyc3-services
- ChartMuseum 配置：.helm/chartmuseum.yaml

## 七、健康检查与监控

- 所有服务支持 /api/healthcheck 接口
- 探针脚本：healthcheck/ping.sh
- 一键初始化脚本：scripts/init.sh
- 支持环境变量配置、TLS 设置、Nginx 配置和 PM2 服务管理

---

## 📄 文档标尾 (Footer)

「YYC³ 技术文档标准化系列」

*斜体英文标语*
