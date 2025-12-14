/**
 * @file YYC3 App 组件快速开始指南
 * @description YYC3 AI Family平台核心应用组件的快速部署和使用指南
 * @author YYC Team
 * @version 3.0.0
 * @created 2024-12-08
 * @updated 2024-12-08
 */

# 🔖 YYC3 App 组件快速开始指南

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 📋 概述

本指南将帮助您快速部署和启动YYC3 App组件的4个核心服务：API服务器、管理控制台、LLM服务、邮件服务。

## 🚀 快速部署

### 1. 环境准备

```bash
# 检查Node.js版本 (需要18+)
node --version

# 检查Redis服务
redis-cli ping

# 安装项目依赖
npm install
```

### 2. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env.local

# 编辑配置文件
vim .env.local
```

### 3. 启动所有服务

```bash
# 开发环境启动
npm run dev

# 生产环境启动
npm run start

# 或使用PM2管理
npm run pm2:start
```

## 🔧 单独服务启动

### API服务器 (端口3000)

```bash
cd services/api
npm start
# 访问: http://localhost:3000
```

### 管理控制台 (端口3001)

```bash
cd services/admin
npm start
# 访问: http://localhost:3001
```

### LLM/AI服务 (端口3002)

```bash
cd services/llm
npm start
# 访问: http://localhost:3002
```

### 邮件服务 (端口3003)

```bash
cd services/mail
npm start
# 访问: http://localhost:3003
```

## 🔍 健康检查

### 检查所有服务状态

```bash
# 使用统一健康检查脚本
./scripts/check-env.sh

# 或分别检查各服务健康状态
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# 或使用PM2监控
npm run pm2:status
```

### 验证服务集成

```bash
# 验证API服务
curl http://localhost:3000/api/status

# 验证管理控制台
curl http://localhost:3001/api/status

# 验证LLM服务
curl http://localhost:3002/api/models

# 验证邮件服务
curl http://localhost:3003/api/templates
```

## 🐳 Docker部署

### 使用Docker Compose

```bash
# 构建和启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 单独服务Docker部署

```bash
# API服务
docker run -d --name api-service -p 3000:3000 yyc3-app

# 管理控制台
docker run -d --name admin-service -p 3001:3001 yyc3-admin

# LLM服务
docker run -d --name llm-service -p 3002:3002 yyc3-llm

# 邮件服务
docker run -d --name mail-service -p 3003:3003 yyc3-mail
```

## ☁️ 生产部署

### 1. 服务器部署

```bash
# 上传代码到服务器
scp -r app/ root@your-server:/opt/yyc3-app/

# 登录服务器
ssh root@your-server

# 安装依赖
cd /opt/yyc3-app
npm install --production

# 启动服务
pm2 start ecosystem.config.js

# 配置Nginx
./scripts/setup-nginx.sh
```

### 2. 域名和SSL配置

- 确保 `api.0379.email`、`admin.0379.email`、`llm.0379.email`、`mail.0379.email` 指向服务器
- 配置SSL证书 (推荐使用Let's Encrypt)
- 更新Nginx配置文件

### 3. 监控和日志

```bash
# PM2监控
npm run pm2:monit

# 查看实时日志
npm run pm2:logs

# 重启服务
npm run pm2:restart
```

## 🔗 服务集成验证

### 1. 服务间通信测试

```bash
# 测试API服务调用
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json"

# 测试管理控制台API
curl http://localhost:3001/api/dashboard/data

# 测试LLM服务调用
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello YYC3"}'

# 测试邮件服务
curl -X POST http://localhost:3003/api/send \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test"}'
```

### 2. 缓存集成测试

```bash
# 测试Redis连接
redis-cli ping

# 测试缓存功能
curl http://localhost:6606/api/stats
```

## 📊 性能监控

### 实时监控

```bash
# 系统资源监控
top

# 服务资源监控
pm2 monit

# 网络连接监控
netstat -tulpn | grep :300
```

### 性能基准

- **API响应时间**: < 200ms
- **并发连接数**: 1000+
- **内存使用**: < 512MB/服务
- **CPU使用**: < 50%

## 🛠️ 开发调试

### 开发模式

```bash
# 热重载开发
npm run dev

# 调试模式
npm run debug

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### API文档

- **API服务文档**: <http://localhost:3000/swagger>
- **管理控制台文档**: <http://localhost:3001/docs>
- **LLM服务文档**: <http://localhost:3002/docs>
- **邮件服务文档**: <http://localhost:3003/docs>

## 🔧 常见问题

### 端口冲突

```bash
# 查找占用端口的进程
lsof -i :3000

# 终止占用进程
kill -9 <PID>
```

### Redis连接失败

```bash
# 检查Redis服务状态
systemctl status redis

# 重启Redis服务
systemctl restart redis
```

### 服务启动失败

```bash
# 查看详细错误日志
pm2 logs api
pm2 logs admin
pm2 logs llm
pm2 logs mail
```

## 📞 技术支持

### 文档资源

- [完整项目文档](../PROJECT_DOCUMENTATION.md)
- [架构详细说明](docs/architecture-summary.md)
- [API接口文档](docs/services/)
- [部署运维指南](docs/deployment/)

### 联系方式

- **技术支持**: <dev@0379.email>
- **问题反馈**: <https://github.com/YYC-Cube/yyc3-app/issues>
- **在线文档**: <https://docs.0379.email>

---

## 🎉 成功部署

如果您看到所有服务都正常运行，恭喜您已经成功部署了YYC3 App组件！

**下一步**:

1. 配置域名解析
2. 设置SSL证书
3. 配置监控告警
4. 开始使用YYC3企业服务

---

## 📄 文档标尾 (Footer)

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
