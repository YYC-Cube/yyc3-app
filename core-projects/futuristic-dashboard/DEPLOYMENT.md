# 部署指南

本文档提供星云操作系统的详细部署说明。

## 环境要求

- Node.js 18.17 或更高版本
- npm 9.0 或更高版本（或 yarn/pnpm）
- 支持的操作系统：Linux、macOS、Windows

## 环境变量配置

### 1. 创建环境变量文件

复制 `.env.example` 文件为 `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. 配置必要的环境变量

编辑 `.env.local` 文件，至少配置以下变量：

\`\`\`env
# 应用基础配置
NEXT_PUBLIC_APP_NAME=星云操作系统
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# 功能开关
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
\`\`\`

### 3. 生产环境额外配置

生产环境需要配置以下安全相关变量：

\`\`\`env
# 认证密钥（必须修改）
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret

# 数据库连接
DATABASE_URL=your-production-database-url

# 其他服务配置...
\`\`\`

## 部署方式

### 方式一：Vercel 部署（推荐）

Vercel 是 Next.js 的官方部署平台，提供最佳性能和开发体验。

#### 步骤：

1. 安装 Vercel CLI:
\`\`\`bash
npm install -g vercel
\`\`\`

2. 登录 Vercel:
\`\`\`bash
vercel login
\`\`\`

3. 部署项目:
\`\`\`bash
vercel
\`\`\`

4. 生产部署:
\`\`\`bash
vercel --prod
\`\`\`

#### 配置环境变量：

在 Vercel Dashboard 中配置环境变量：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加所需的环境变量
4. 重新部署项目

### 方式二：Docker 部署

使用 Docker 容器化部署应用。

#### 1. 创建 Dockerfile

\`\`\`dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
\`\`\`

#### 2. 创建 docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
    restart: unless-stopped

  # 可选：添加数据库服务
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_DB: nebula_system
  #     POSTGRES_USER: postgres
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   restart: unless-stopped

# volumes:
#   postgres_data:
\`\`\`

#### 3. 构建和运行

\`\`\`bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
\`\`\`

### 方式三：传统服务器部署

在 VPS 或云服务器上部署。

#### 1. 安装 Node.js

\`\`\`bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
\`\`\`

#### 2. 克隆项目

\`\`\`bash
git clone https://github.com/yourusername/nebula-system.git
cd nebula-system
\`\`\`

#### 3. 安装依赖

\`\`\`bash
npm ci
\`\`\`

#### 4. 配置环境变量

\`\`\`bash
cp .env.example .env.local
# 编辑 .env.local 文件
nano .env.local
\`\`\`

#### 5. 构建项目

\`\`\`bash
npm run build
\`\`\`

#### 6. 使用 PM2 运行

\`\`\`bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "nebula-system" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs nebula-system
\`\`\`

#### 7. 配置 Nginx 反向代理

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

#### 8. 配置 SSL（使用 Let's Encrypt）

\`\`\`bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
\`\`\`

## 性能优化

### 1. 启用缓存

在 `next.config.mjs` 中配置缓存：

\`\`\`javascript
const nextConfig = {
  // 启用 SWC 压缩
  swcMinify: true,
  
  // 图片优化
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 启用 Gzip 压缩
  compress: true,
}
\`\`\`

### 2. CDN 配置

使用 CDN 加速静态资源：

\`\`\`javascript
const nextConfig = {
  assetPrefix: process.env.CDN_URL || '',
}
\`\`\`

### 3. 数据库连接池

配置数据库连接池以提高性能：

\`\`\`env
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
\`\`\`

## 监控和日志

### 1. 应用监控

推荐使用以下监控工具：
- Vercel Analytics（Vercel 部署）
- New Relic
- Datadog
- Sentry（错误追踪）

### 2. 日志管理

配置日志输出：

\`\`\`env
LOG_LEVEL=info
LOG_FORMAT=json
\`\`\`

使用 PM2 查看日志：

\`\`\`bash
pm2 logs nebula-system --lines 100
\`\`\`

## 备份策略

### 1. 数据库备份

\`\`\`bash
# PostgreSQL 备份
pg_dump -U postgres nebula_system > backup_$(date +%Y%m%d).sql

# 自动备份脚本
0 2 * * * /path/to/backup-script.sh
\`\`\`

### 2. 文件备份

\`\`\`bash
# 使用 rsync 备份
rsync -avz /app/uploads /backup/uploads_$(date +%Y%m%d)
\`\`\`

## 安全检查清单

- [ ] 修改所有默认密钥和密码
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 启用速率限制
- [ ] 定期更新依赖
- [ ] 配置 CORS 策略
- [ ] 启用 CSP（内容安全策略）
- [ ] 定期备份数据
- [ ] 监控异常访问
- [ ] 配置日志审计

## 故障排查

### 常见问题

1. **应用无法启动**
   - 检查 Node.js 版本
   - 验证环境变量配置
   - 查看错误日志

2. **性能问题**
   - 检查数据库连接
   - 优化查询语句
   - 启用缓存

3. **内存泄漏**
   - 使用 Node.js 内存分析工具
   - 检查事件监听器
   - 优化大数据处理

### 日志查看

\`\`\`bash
# PM2 日志
pm2 logs nebula-system

# Docker 日志
docker-compose logs -f app

# 系统日志
tail -f /var/log/nginx/error.log
\`\`\`

## 更新和维护

### 更新应用

\`\`\`bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm ci

# 重新构建
npm run build

# 重启应用
pm2 restart nebula-system
\`\`\`

### 数据库迁移

\`\`\`bash
# 运行迁移脚本
npm run migrate

# 回滚迁移
npm run migrate:rollback
\`\`\`

## 扩展部署

### 负载均衡

使用 Nginx 配置负载均衡：

\`\`\`nginx
upstream nebula_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://nebula_backend;
    }
}
\`\`\`

### 水平扩展

使用 PM2 集群模式：

\`\`\`bash
pm2 start npm --name "nebula-system" -i max -- start
\`\`\`

---

如有部署问题，请查看项目文档或联系技术支持。
