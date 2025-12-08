# YYC3-AI-Smart-Call 智能外呼系统部署指南

## 🎯 项目概述

**项目名称**: YYC3-AI-Smart-Call (智能外呼系统)
**项目类型**: Next.js + React + Prisma 全栈应用
**项目URL**: https://v0-yyc3-ai-call.vercel.app/
**技术栈**: Next.js 15 + React 18 + TypeScript + Prisma + PostgreSQL + Radix UI

---

## 🏗️ 技术架构分析

### 前端技术栈
- **框架**: Next.js 15 (App Router)
- **UI**: Radix UI + Tailwind CSS
- **状态管理**: Zustand + TanStack Query
- **表单**: React Hook Form + Zod
- **图表**: Recharts
- **动画**: Framer Motion + Tailwind CSS Animate
- **主题**: Next Themes

### 后端技术栈
- **运行时**: Node.js
- **数据库**: PostgreSQL + Prisma ORM
- **身份验证**: NextAuth.js (beta)
- **实时通信**: Socket.IO
- **文件处理**: 内置API Routes

### 功能特性
- 🤖 **智能对话**: AI驱动的对话系统
- 📊 **数据可视化**: 图表和统计面板
- 👥 **用户管理**: 完整的用户权限系统
- 📞 **通话管理**: 呼叫记录和分析
- 🔐 **安全系统**: JWT认证和权限控制

---

## 🚀 部署架构

### 开发环境
```
┌─────────────────────────────────────────────────────────────┐
│                    开发环境架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💻 开发者机器 (YYC3-22)                                │
│  ├─ Next.js 开发服务器 (端口 3123)                      │
│  ├─ 热重加载支持                                      │
│  ├─ TypeScript 类型检查                                  │
│  └─ 浏览器开发工具                                    │
│                                                             │
│  🗄️ 数据库服务 (本地/容器)                               │
│  ├─ PostgreSQL 开发实例 (端口 5432)                       │
│  ├─ Prisma Studio 开发工具                               │
│  └─ 数据库种子和迁移                                    │
│                                                             │
│  🔧 开发工具                                              │
│  ├─ VS Code + 扩展插件                                      │
│  ├─ Git 版本控制                                         │
│  ├─ Docker Desktop                                    │
│  └─ Postman API测试                                    │
└─────────────────────────────────────────────────────────────┘
```

### 生产环境
```
┌─────────────────────────────────────────────────────────────┐
│                   生产环境架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 云服务器 (YYC3-121)                                    │
│  ├─ Nginx 反向代理 (端口 80/443)                        │
│  │    - SSL 终端点                                        │
│  │    - 静态文件服务                                      │
│  │    - API 代理                                        │
│  │    WebSocket 支持                                  │
│  └─ 请求路由和负载均衡                                   │
│                                                             │
│  ⚡ 应用服务器集群                                        │
│  ├─ Next.js 应用实例 x2                                   │
│  │    - 容器化部署                                       │
│  │    - 健康检查端点                                      │
│  │    - 内存和CPU限制                                    │
  └─ 自动扩缩和滚动更新                                   │
│                                                             │
|  📊 数据服务器 (YYC3-45 NAS)                               │
|  ├─ PostgreSQL 主数据库 (端口 5432)                       │
|  ├─ Prisma 生产数据库                                     │
|  ├─ 数据备份和归档                                        │
|  └─ 性能监控和优化                                       │
│                                                             │
|  🗄️ 缓存服务                                              │
  ├─ Redis 缓存 (端口 6379)                                  │
  ├─ 会话存储                                              │
  ├─ API响应缓存                                           │
  └─ 实时数据缓存                                          │
│                                                             │
|  🔒 监控和日志                                            │
  ├─ Winston 日志系统                                     │
  ├─ Prometheus 指标收集                                   │
  ├─ Grafana 监控面板                                      │
  ├─ ELK Stack 日志分析                                   │
  └─ 错误追踪和告警                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构详解

### 项目目录
```
yyc3-ai-smart-call/
├── prisma/                   # 数据库配置
│   ├── schema.prisma          # 数据库模式定义
│   ├── migrations/             # 数据库迁移文件
│   ├── seed.ts                # 数据库种子数据
│   └── generate-client/        # 生成Prisma客户端
├── src/                       # 源代码目录
│   ├── app/                   # Next.js应用配置
│   │   ├── globals.css          # 全局样式
│   │   ├── layout.tsx          # 根布局组件
│   │   └── page.tsx            # 页面模板
│   ├── pages/                  # Next.js页面
│   │   ├── api/                # API路由
│   │   │   ├── auth/           # 认证API
│   │   │   ├── ai-call/        # AI对话API
│   │   │   ├── users/          # 用户管理API
│   │   │   └── analytics/     # 分析统计API
│   │   ├── dashboard/          # 仪表板页面
│   │   ├── chat/              # 对话页面
│   │   ├── calls/             # 通话管理
│   │   ├── settings/          # 设置页面
│   │   └── login/             # 登录页面
│   ├── components/             # React组件库
│   │   ├── ui/               # UI基础组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/            # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/             # 表单组件
│   │   │   ├── LoginForm.tsx
│   │   │   ├── CallForm.tsx
│   │   │   └── SettingsForm.tsx
│   │   └── charts/            # 图表组件
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       └── PieChart.tsx
│   ├── hooks/                 # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── lib/                   # 工具函数库
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   ├── constants.ts
│   │   └── api.ts
│   ├── store/                 # 状态管理
│   │   ├── authStore.ts
│   │   ├── callStore.ts
│   │   └── settingsStore.ts
│   ├── styles/                # 样式文件
│   │   ├── globals.css
│   │   └── components.css
│   └── types/                  # TypeScript类型定义
│       ├── api.ts
│       ├── auth.ts
│       └── database.ts
├── public/                    # 静态资源
│   ├── icons/               # 图标文件
│   ├── images/              # 图片资源
│   └── favicon.ico
├── scripts/                  # 构建和部署脚本
│   ├── build.sh              # 构建脚本
│   ├── deploy.sh              # 部署脚本
│   ├── backup.sh              # 备份脚本
│   └── test.sh                # 测试脚本
├── docker/                   # Docker配置
│   ├── Dockerfile             # 应用镜像
│   ├── docker-compose.yml      # 服务编排
│   ├── docker-compose.prod.yml  # 生产环境
│   └── nginx.conf            # Nginx配置
├── docs/                     # 项目文档
│   ├── API.md               # API文档
│   ├── DEPLOYMENT.md         # 部署文档
│   └── USER_GUIDE.md        # 用户指南
├── tests/                     # 测试文件
│   ├── __tests__/            # 单元测试
│   ├── e2e/                 # 端到端测试
│   └── integration/          # 集成测试
└── docker-compose.yml        # 开发环境Docker
```

---

## 🔧 本地开发环境部署

### 1. 环境准备

#### 系统要求
```bash
# 推荐配置
- 内存: 8GB+
- 存储: 50GB+
- CPU: 4核+
- 网络: 稳定连接

# 必需软件
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Git
- VS Code (推荐)
- pnpm (包管理器)
```

#### 快速安装
```bash
# 安装Node.js (使用nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安装pnpm
npm install -g pnpm

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh | sudo sh
sudo usermod -aG docker $USER

# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgres
sudo systemctl enable postgres
```

### 2. 项目克隆和初始化

```bash
# 1. 克隆项目 (假设已有项目)
git clone <your-repo-url> yyc3-ai-smart-call
cd yyc3-ai-smart-call

# 2. 安装依赖
pnpm install

# 3. 复制环境变量
cp .env.example .env.local

# 4. 配置环境变量
```

#### 环境变量配置
```bash
# .env.local
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/yyc3_ai_smart_call"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3123/api/auth"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# 应用配置
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3123"
NEXT_PUBLIC_API_URL="http://localhost:3123/api"

# AI API配置
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Prisma配置
PRISMA_GENERATE_DATAPROXY="true"

# 开发服务器配置
PORT=3123
HOST=localhost
```

### 3. 数据库初始化

```bash
# 1. 启动PostgreSQL
sudo systemctl start postgres

# 2. 创建数据库
sudo -u postgres createdb yyc3_ai_smart_call
sudo -u postgres createuser yyc3_admin
sudo -u postgres psql -c "ALTER USER yyc_admin PASSWORD 'dev_password';"

# 3. 授予权限
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE yyc3_ai_smart_call TO yyc3_admin;"

# 4. 生成Prisma客户端
pnpm prisma generate

# 5. 运行数据库迁移
pnpm prisma migrate dev

# 6. 添加种子数据
pnpm prisma db seed
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 可用命令
pnpm dev --experimental-https  # HTTPS开发
pnpm dev --port 3000      # 指定端口
pnpm dev --turbo          # 快速开发
```

### 5. 数据库管理工具

```bash
# 打开Prisma Studio
pnpm prisma studio

# 常用Prisma命令
pnpm prisma generate           # 生成客户端
pnpm prisma migrate deploy       # 应用迁移
pnpm prisma db reset           # 重置数据库
pnpm prisma db seed            # 添加种子数据
pnpm prisma db push            # 同步模式
```

---

## 🌐 生产环境部署

### 1. 服务器配置

#### YYC3-121 (生产服务器)
```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y nginx docker.io docker-compose-plugin

# 配置Docker
sudo systemctl start docker
sudo systemctl enable docker

# 配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### YYC3-45 (数据服务器)
```bash
# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib

# 配置PostgreSQL
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/12/main/postgresql.conf
sudo systemctl restart postgres

# 配置远程访问
# 在 /etc/postgresql/12/main/pg_hba.conf 中添加:
# host    all             all             0.0.0.0/0               md5
```

### 2. Docker部署配置

#### 生产环境Docker配置
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: yyc3-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - static_files:/var/www/static
    depends_on:
      - app
    networks:
      - yyc3-network
    restart: unless-stopped

  app:
    build: .
    container_name: yyc3-app
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - NEXTAUTH_URL=https://yyc3-ai.com/api/auth
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./logs:/app/logs
      - /app/.next
    ports:
      - "3001:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - yyc3-network
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      -yyc3-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: yyc3-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - yyc3-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: yyc3-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      -yyc3-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: yyc3-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning
    networks:
      - yyc3-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  static_files:

networks:
  yyc3-network:
    driver: bridge
```

#### Dockerfile配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN pnpm prisma generate

# 应用阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

USER nodejs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
```

### 3. 生产环境部署脚本

#### 自动化部署脚本
```bash
#!/bin/bash
# scripts/deploy-prod.sh
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查环境
check_environment() {
    log_info "检查部署环境..."

    if [[ ! -f ".env.local" ]]; then
        log_error ".env.local 文件不存在，请先配置"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        exit 1
    fi

    log_success "环境检查通过"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."

    docker build -t yyc3-ai-smart-call:latest .

    if [[ $? -eq 0 ]]; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    log_info "备份生产数据库..."

    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if docker exec yyc3-postgres pg_dump -U yyc3_admin yyc3_ai_prod > "$BACKUP_DIR/backup.sql"; then
        log_success "数据库备份完成: $BACKUP_DIR"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 部署应用
deploy_application() {
    log_info "部署应用..."

    # 停止旧容器
    docker-compose -f docker-compose.prod.yml down

    # 启动新容器
    docker-compose -f docker-compose.prod.yml up -d

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30

    # 健康检查
    health_check
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 检查前端服务
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
    fi

    # 检查后端服务
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_warning "后端服务异常"
    fi

    # 检查数据库连接
    if docker exec yyc3-postgres pg_isready -U postgres -d yyc3_ai_prod > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_warning "数据库连接异常"
    fi
}

# 主函数
main() {
    case "${1:-}" in
        "build")
            build_images
            ;;
        "deploy")
            check_environment
            build_images
            deploy_application
            health_check
            ;;
        "backup")
            backup_database
            ;;
        "full")
            check_environment
            build_images
            backup_database
            deploy_application
            health_check
            log_success "🎉 生产部署完成!"
            echo "🌐 应用访问地址:"
            echo "   - 前端: http://localhost"
            echo "   - 监控面板: http://localhost:3001 (Grafana)"
            echo "   - API文档: http://localhost/api/docs"
            ;;
        "help"|"--help"|"-h")
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  build             构建Docker镜像"
            echo "  deploy            部署到生产环境"
            echo "  backup            备份数据库"
            echo "  full              完整部署流程"
            echo "  help              显示此帮助信息"
            ;;
        *)
            log_error "未知命令: $1"
            exit 1
            ;;
    esac
}

main "$@"
EOF

chmod +x scripts/deploy-prod.sh
```

### 4. Nginx配置

#### Nginx主配置
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        text/markdown;

    # 上游服务器
    upstream app {
        server app:3000;
        keepalive 32;
    }

    # HTTP重定向
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS配置
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # WebSocket支持
        location /api/ws {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API代理
        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # API请求大小限制
            client_max_body_size 10M;

            # 代理超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 前端静态文件
        location / {
            root /var/www/static;
            try_files $uri $uri/ /index.html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
```

---

## 👥 团队内部测试部署

### 测试环境配置

#### 测试服务器部署
```bash
# 1. 创建测试环境目录
mkdir -p /opt/yyc3-ai-test
cd /opt/yyc3-ai-test

# 2. 克隆项目代码
git clone <your-repo-url> .
pnpm install

# 3. 配置测试环境变量
cp .env.example .env.local
```

#### 测试环境变量
```bash
# .env.local
NODE_ENV=testing
NEXT_PUBLIC_APP_URL=http://test.yyc3-ai.com
NEXT_PUBLIC_API_URL=http://test.yyc3-api.com
DATABASE_URL="postgresql://postgres:test_password@test-db:5432/yyc3_ai_test"

# 测试专用配置
NEXTAUTH_URL=http://test.yyc3-ai.com/api/auth
OPENAI_API_KEY=test-openai-key
ANTHROPIC_API_KEY=test-anthropic-key

# 测试用户数据
TEST_USERS='[
  {"username": "test_admin", "password": "TestAdmin123!", "role": "admin", "email": "admin@yyc3.com"},
  {"username": "test_user1", "password": "TestUser123!", "role": "user", "email": "user1@yyc3.com"},
  {"username": "test_user2", "password": "TestUser123!", "role": "user", "email": "user2@yyc3.com"}
]'
```

#### 测试数据初始化
```bash
# scripts/init-test-data.sh
#!/bin/bash

echo "🔄 初始化测试数据..."

# 创建测试用户
echo "$TEST_USERS" > test_users.json

# 创建测试对话
docker exec yyc3-postgres psql -U postgres -d yyc3_ai_test << 'EOF
-- 创建测试对话
INSERT INTO ai_conversations (user_id, title, context)
SELECT
  (SELECT id FROM users WHERE username = 'test_user1'),
  '测试对话1',
  '{"topic": "测试", "language": "zh-CN"}'
RETURNING id;

-- 创建测试消息
INSERT INTO ai_messages (conversation_id, content, sender, metadata)
SELECT
  (SELECT id FROM ai_conversations WHERE title = '测试对话1'),
  '这是一条测试消息',
  'user',
  '{"test": true}'
RETURNING id;
EOF

echo "✅ 测试数据初始化完成!"
```

### 测试用户管理

#### 用户创建脚本
```bash
# scripts/create-test-users.sh
#!/bin/bash

# 创建测试用户函数
create_test_user() {
    local username=$1
    local password=$2
    local role=$3
    local email=$4

    # 在数据库中创建用户
    docker exec yyc3-postgres psql -U postgres -d yyc3_ai_test << EOF
INSERT INTO users (username, password_hash, full_name, role, email, created_at)
VALUES (
    '$username',
    crypt('\$2b\$$10\$hashed_password'),
    '$role测试用户',
    '$role',
    '$email',
    NOW()
) ON CONFLICT (username) DO NOTHING;
EOF
}

# 批行测试用户创建
create_test_user "test_admin" "TestAdmin123!" "admin" "admin@yyc3.com"
create_test_user "test_user1" "TestUser123!" "user" "user1@yyc3.com"
create_test_user "test_user2" "TestUser123!" "user" "user2@yyc3.com"

echo "✅ 测试用户创建完成!"
```

### 测试执行计划

#### 功能测试清单
```markdown
# docs/TESTING_CHECKLIST.md

## 功能测试清单

### 🔐 用户认证测试
- [ ] 用户登录/登出功能
- [ ] JWT令牌验证
- [ ] 会话超时处理
- [ ] 密码强度验证
- [ ] 记住登录状态

### 🤖 AI对话功能测试
- [ ] 发送消息到AI
- [ ] 接收AI响应
- [ WebSocket连接稳定性
- [ ] 消息历史记录
- [] 实时消息推送

### 📊 数据管理测试
- [ ] 对话数据持久化
- [ 用户数据管理
- 文件上传功能
- 数据导出功能
- 数据备份恢复

### 📞 通话管理测试
- 通话记录创建
- 通话历史查询
- 通话状态跟踪
- 通话数据分析

### 🔒 权限管理测试
- 管理员权限验证
- 普通用户权限限制
- 功能访问控制
- 数据访问控制

### 🎨 用户界面测试
- 响应式设计测试
- 移动端适配
- 无障碍访问
- 浏览器兼容性
```

---

## 📊 监控和日志

### 1. 应用监控配置

#### Prometheus配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'nextjs'
    static_configs:
      - targets: ['app:3000']
    metrics_path: /api/metrics
    basic_auth:
      - username: admin
      - password: ${GRAFANA_PASSWORD}

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    basic_auth:
      - username: admin
      - password: ${GRAFANA_PASSWORD}

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    basic_auth:
      - username: admin
      - password: ${GRAFANA_PASSWORD}
```

### 2. Grafana仪表板

#### 监控面板配置
```json
{
  "dashboard": [
    {
      "title": "应用性能监控",
      "panels": [
        {
          "title": "响应时间",
          "type": "graph",
          "targets": [
            {
              "expr": "http_request_duration_seconds_sum",
              "legendFormat": "{{legend}}"
            }
          ]
        },
        {
          "title": "错误率",
          "type": "stat",
          "targets": [
            {
              "expr": "http_requests_total - http_requests_2xx",
              "legendFormat": "4xx/5xx 错误"
            }
          ]
        }
      ]
    },
    {
      "title": "用户活跃度",
      "panels": [
        {
          "title": "日活跃用户",
          "type": "stat",
          "targets": [
            {
              "expr": "active_users_daily",
              "legendFormat": "日活跃用户数"
            }
          ]
        }
      ]
    },
    {
      "title": "AI对话统计",
      "panels": [
        {
          "title": "对话数量",
          "type": "stat",
          "targets": [
            {
              "expr": "conversations_created_total",
              "legendFormat": "总对话数"
            }
          ]
        },
        {
          "title": "消息数量",
          "type": "stat",
          "target_dict": {
            "conversation_messages": {
              "messages_today",
              "messages_this_week",
              "messages_this_month"
            }
          }
        }
      ]
    }
  ]
}
```

### 3. 日志管理系统

#### Winston日志配置
```typescript
// src/lib/logger.ts
import winston from 'winston';
import { NextApiResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 日志级别定义
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 创建logger实例
export const logger = winston.createLogger({
  level: levels.info,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      level: levels.debug,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // 文件输出
    new winston.transports.File({
      filename: path.join(process.env.LOGS_DIR || 'logs', 'app.log'),
      level: levels.info,
      format: logFormat,
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5,
      tailable: true,
    }),
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(process.env.LOGS_DIR || 'logs', 'error.log'),
      level: levels.error,
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// HTTP请求日志中间件
export const httpLogger = (req: NextApiResponse, res: NextApiResponse) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
};
```

---

## 🔒 运维和维护

### 1. 自动化脚本

#### 定期备份脚本
```bash
#!/bin/bash
# scripts/backup-daily.sh
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/yyc3-ai/$(date +%Y%m%d)"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 开始日常备份..."

# 数据库备份
docker exec yyc3-postgres pg_dump -U yyc3_admin yyc3_ai_prod > "$BACKUP_DIR/db_$DATE.sql"

# 应用文件备份
docker cp -r yyc3-app:/var/www/static "$BACKUP_DIR/static_$DATE"

# 配置文件备份
tar -czf "$BACKUPDIR/configs_$DATE.tar.gz" ./configs

# 日志文件备份
tar -czf "$BACKUPDIR/logs_$DATE.tar.gz" ./logs

echo "✅ 备份完成: $BACKUP_DIR"

# 清理旧备份 (保留30天)
find /opt/backups/yyc3-ai -type d -mtime +30 -exec rm -rf {} +
```

#### 健康检查脚本
```bash
#!/bin/bash
# scripts/health-check.sh
#!/bin/bash
set -e

echo "🏥 执行健康检查..."

# 检查服务状态
services=("nginx" "app" "postgres" "redis")
healthy_services=0

for service in "${services[@]}"; do
    if docker ps --filter "name=yyc3-$service" --format "table {{.Names}}" | grep -q "Up"; then
        ((healthy_services++))
        echo "✅ $service: 正常"
    else
        echo "❌ $service: 异常"
    fi
done

# 检查资源使用
echo ""
echo "📊 系统资源使用情况:"
df -h | grep -E "(Filesystem|/dev/sd.*|Used)"

echo ""
echo "🐳 内存使用情况:"
free -h

echo ""
echo "🔗 网络连接数:"
netstat -an | grep :80 | wc -l

echo ""
echo "📊 服务状态统计:"
echo "健康服务: $healthy_services/${#services[@]}"

# 检查磁盘空间
disk_usage=$(df / | grep -vE '^/dev/sd.*' | awk '{print $5}' | sort -n | tail -1)
available_gb=$((disk_usage / 1024 / 1024))

if [[ $available_gb -lt 10 ]]; then
    echo "⚠️ 警告: 磁盘空间不足 (剩余 ${available_gb}GB)"
else
    echo "✅ 磁盘空间充足 (剩余 ${available_gb}GB)"
fi
```

### 2. 性能优化

#### 数据库优化
```sql
-- PostgreSQL性能优化配置
-- 在postgresql.conf中设置

-- 内存配置
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 256MB
maintenance_work_mem = 1GB

-- 连接配置
max_connections = 200
superuser_reserved_connections = 3

-- 查询优化
random_page_cost = 1.1
effective_io_concurrency = 200
checkpoint_completion_target = 0.9

-- 日志配置
log_min_duration_statement = 1000
log_checkpoints = on
log_autovacuum = on
autovacuum_max_workers = 3

-- 索引优化
default_statistics_target = 100
autovacuum_analyze_scale_factor = 0.05
autovacuum_vacuum_scale_factor = 0.1
```

#### 应用性能优化
```typescript
// 性能监控中间件
// src/middleware/performance.ts
import { NextApiRequest, NextApiResponse } from 'next/server';

const start = Date.now();

export const performanceLogger = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  const duration = Date.now() - start;

  // 记录慢查询
  if (duration > 1000) {
    console.warn(`🐌 Slow Request: ${req.method} ${req.url} (${duration}ms)`);
  }

  // 记录API调用
  console.log(`API: ${req.method} ${req.url} (${duration}ms)`);

  next();
};

// 资源缓存
const withCache = (cacheDuration = 300000) => {
  return async (target: any, ...args: any[]) => {
    const cacheKey = JSON.stringify(args);

  return new Promise((resolve) => {
      // 这里实现缓存逻辑
      const cached = cache.get(cacheKey);
      if (cached) {
        return resolve(cached);
      }

      const result = await target(...args);
      cache.set(cacheKey, result, { ttl: cacheDuration });
      resolve(result);
    });
  };
};
```

---

## 📱 常见问题和解决方案

### 部署问题

#### 问题1: Docker容器启动失败
```bash
# 检查容器日志
docker logs yyc3-app

# 常见解决方案
# 1. 检查环境变量配置
# 2. 检查端口占用
# 3. 检查资源限制
# 4. 重新构建镜像
```

#### 问题2: 数据库连接失败
```bash
# 检查数据库状态
docker exec yyc3-postgres pg_isready -U postgres

# 常见解决方案
# 1. 检查数据库服务状态
# 2. 验证连接字符串
# 3. 检查防火墙规则
# 4. 验证权限设置
```

#### 问题3: 前端无法访问后端
```bash
# 检查网络连接
curl -v http://localhost:3001/api/health

# 常见解决方案
# 1. 检查Nginx配置
# 2. 验证API路由
# 3. 检查CORS设置
# 4. 验证认证配置
```

### 性能问题

#### 问题1: 页面加载缓慢
```javascript
// 前端性能优化
// 1. 代码分割和懒加载
// 2. 图片优化和压缩
// 3. 缓存策略优化
// 4. Bundle分析和优化
```

#### 问题2: API响应慢
```typescript
// 后端性能优化
// 1. 数据库查询优化
// 2. 缓存热点数据
// 3. 连接池优化
// 4. 异步处理优化
// 5. 监控性能指标
```

---

## 🚀 快速部署检查清单

### 部署前检查
- [ ] 环境变量配置完成
- [ ] 数据库初始化完成
- [ ] SSL证书配置完成
- [ ] 防火墙规则配置完成
- [ ] 监控系统配置完成

### 部署中检查
- [ ] Docker镜像构建成功
- [ ] 容器启动正常
- [ ] 数据库连接成功
- [ ] API健康检查通过
- [ ] 静态文件服务正常

### 部署后检查
- [ ] 应用访问正常
- [ ] 用户可以正常登录
- [ ] AI对话功能正常
- [ WebSocket连接稳定
- [ ] 监控数据正常

### 上线后检查
- [ ] 性能指标正常
- [ ] 错误率在可接受范围
- [ ] 备份机制正常
- - 用户反馈正常
- - 监控告警正常配置

---

## 📞 支持信息

### 技术支持
- **文档**: 完整的部署和运维文档
- **工具**: 自动化部署和管理脚本
- **监控**: 完整的监控和日志系统
- **培训**: 技术栈使用培训

### 联系方式
- **技术问题**: support@yyc3.com
- **紧急联系**: emergency@yyc3.com
- **项目仓库**: [GitHub项目地址]

---

**部署时间**: 2025-11-12
**文档版本**: v2.0
**最后更新**: $(date +%Y-%m-%d)
**维护团队**: YYC3开发团队

**状态**: 🟡 准备就绪 - 立即开始部署！