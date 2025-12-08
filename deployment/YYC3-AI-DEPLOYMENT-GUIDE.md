# YYC3-AI 应用完整部署指南

## 🎯 项目概述

**项目名称**: YYC3-AI-Call (AI通话助手)
**项目URL**: https://v0-yyc3-ai-call.vercel.app/
**项目类型**: 全栈AI应用 (Vercel部署)
**技术栈分析**: React/Vue + Node.js + AI API + 数据库

---

## 📋 部署架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        生产环境架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 CDN/负载均衡                                              │
│      │                                                      │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┐             │
│  │ 前端A  │ 前端B  │ 前端C  │ 前端D  │ 前端E  │ 管理后台 │             │
│  └───────┴───────┴───────┴───────┴───────┴───────┘             │
│      │                                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API网关                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│      │                                                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ 用户服务     │ AI对话服务    │ 通话服务     │ 分析服务     │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│      │                                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    数据层                               │ │
│  │  PostgreSQL  Redis  MongoDB  MinIO(文件存储)           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 第一阶段：本地开发环境部署

### 1. 环境准备

#### 系统要求
```bash
# 开发机配置 (YYC3-22)
- CPU: 4核心以上
- 内存: 8GB以上
- 存储: 100GB以上
- 网络: 稳定的互联网连接
- 系统: macOS/Linux/Windows with WSL2
```

#### 必需软件安装
```bash
# 1. Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Git
sudo apt-get install git

# 3. Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. 数据库工具
# PostgreSQL 15+
sudo apt-get install postgresql postgresql-contrib

# Redis
sudo apt-get install redis-server

# 5. 代码编辑器
# VS Code + 必要插件
```

### 2. 项目克隆与初始化

```bash
# 1. 创建项目目录
cd /Users/yanyu/www/deployments
mkdir yyc3-ai-call
cd yyc3-ai-call

# 2. 初始化项目结构
mkdir -p {frontend,backend,docs,scripts,configs,docker}

# 3. 创建前端项目 (假设是React)
cd frontend
npx create-react-app . --template typescript
# 或者如果是Vue
# npm create vue@latest .

# 4. 创建后端项目
cd ../backend
mkdir {src,tests,docs}
npm init -y
npm install express cors helmet morgan dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
```

### 3. 配置文件创建

#### 后端配置 (`backend/.env`)
```bash
# 服务器配置
NODE_ENV=development
PORT=3001
HOST=localhost

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_ai_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI API配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件存储配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 外部服务配置
WEBHOOK_URL=http://localhost:3001/webhooks
NOTIFICATION_SERVICE_URL=http://localhost:3002/notifications
```

#### 前端配置 (`frontend/.env`)
```bash
# API配置
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001

# 应用配置
REACT_APP_NAME=YYC3-AI-Call
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development

# 功能开关
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_MOCK=false
```

### 4. Docker本地开发环境

#### `docker-compose.dev.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres-dev
    environment:
      POSTGRES_DB: yyc3_ai_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - yyc3-network

  redis:
    image: redis:7-alpine
    container_name: yyc3-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - yyc3-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: yyc3-backend-dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    networks:
      - yyc3-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: yyc3-frontend-dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    networks:
      - yyc3-network

volumes:
  postgres_data:
  redis_data:

networks:
  yyc3-network:
    driver: bridge
```

### 5. 启动本地开发环境

```bash
# 1. 启动数据库服务
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 2. 初始化数据库
./scripts/init-database.sh

# 3. 启动后端服务
cd backend
npm run dev

# 4. 启动前端服务 (新终端)
cd frontend
npm start
```

---

## 🔧 第二阶段：功能开发与测试

### 1. 后端API开发

#### `backend/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API路由
setupRoutes(app);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 YYC3-AI Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

#### API路由结构
```typescript
// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth';
import aiCallRoutes from './ai-call';
import userRoutes from './user';
import analyticsRoutes from './analytics';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ai-call', aiCallRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
```

### 2. 前端应用开发

#### 主要组件结构
```typescript
// frontend/src/components/AICallInterface.tsx
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AICallInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 连接WebSocket
    const socket: Socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to AI server');
    });

    socket.on('ai-response', (response) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: response.message,
        sender: 'ai',
        timestamp: new Date()
      }]);
      setIsLoading(false);
    });

    return () => socket.close();
  }, []);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-call/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-call-interface">
      <div className="connection-status">
        {isConnected ? '🟢 已连接' : '🔴 连接中...'}
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender}`}
          >
            <div className="content">{message.content}</div>
            <div className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && <div className="typing-indicator">AI正在思考...</div>}
      </div>

      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
```

### 3. 数据库设计

#### 用户表
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### AI对话记录表
```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL, -- 'user' or 'ai'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 第三阶段：生产环境部署

### 1. 云服务器部署架构

#### 服务器配置规划
```
生产服务器集群:
├── yyc3-121 (阿里云) - 主应用服务器
├── yyc3-121-backup (阿里云:2222) - 备份服务器
├── yyc3-45 (NAS) - 数据存储服务器
└── yyc3-22 (开发机) - 测试/预发布服务器
```

### 2. 生产环境配置

#### `docker-compose.prod.yml`
```yaml
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
      - frontend
      - backend
    networks:
      - yyc3-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres
    environment:
      POSTGRES_DB: yyc3_ai_prod
      POSTGRES_USER: yyc3_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - yyc3-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: yyc3-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - yyc3-network
    restart: unless-stopped

  backend:
    image: yyc3-ai/backend:latest
    container_name: yyc3-backend
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - yyc3-network
    restart: unless-stopped
    deploy:
      replicas: 2

  frontend:
    image: yyc3-ai/frontend:latest
    container_name: yyc3-frontend
    environment:
      - REACT_APP_API_URL=https://api.yyc3-ai.com
    networks:
      - yyc3-network
    restart: unless-stopped
    deploy:
      replicas: 2

volumes:
  postgres_data:
  redis_data:
  static_files:

networks:
  yyc3-network:
    driver: bridge
```

### 3. CI/CD部署流水线

#### GitHub Actions配置 (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Run tests
        run: |
          cd frontend && npm test -- --coverage --watchAll=false
          cd ../backend && npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: yyc3-ai/backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: yyc3-ai/frontend:latest

      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/yyc3-ai
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

### 4. 域名和SSL配置

#### Nginx配置 (`nginx/nginx.conf`)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name yyc3-ai.com www.yyc3-ai.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS配置
    server {
        listen 443 ssl http2;
        server_name yyc3-ai.com www.yyc3-ai.com;

        # SSL证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API代理
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket支持
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 前端静态文件
        location / {
            root /var/www/static;
            try_files $uri $uri/ /index.html;
        }

        # 文件上传大小限制
        client_max_body_size 10M;
    }
}
```

---

## 📱 第四阶段：多端构建与分发

### 1. 移动端构建

#### React Native配置
```bash
# 1. 安装React Native CLI
npm install -g @react-native-community/cli

# 2. 创建React Native项目
npx react-native init Yyc3AiMobile --template react-native-template-typescript

# 3. 移动端配置
cd Yyc3AiMobile
npm install @react-navigation/native @react-navigation/stack
npm install axios socket.io-client
```

#### 移动端部署脚本
```bash
#!/bin/bash
# scripts/build-mobile.sh

echo "🚀 开始移动端构建..."

# Android构建
cd android
./gradlew assembleRelease
echo "✅ Android APK构建完成: android/app/build/outputs/apk/release/app-release.apk"

# iOS构建 (在macOS上)
cd ../ios
xcodebuild -workspace Yyc3AiMobile.xcworkspace -scheme Yyc3AiMobile -configuration Release -destination generic/platform=iOS -archivePath Yyc3AiMobile.xcarchive archive
echo "✅ iOS Archive构建完成"

echo "🎉 移动端构建完成!"
```

### 2. 桌面端构建

#### Electron配置
```bash
# 1. 安装Electron
npm install --save-dev electron electron-builder

# 2. Electron主进程配置
// public/electron.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.whenReady().then(createWindow);
```

#### 桌面端构建脚本
```bash
#!/bin/bash
# scripts/build-desktop.sh

echo "🚀 开始桌面端构建..."

# 构建React应用
npm run build

# 使用electron-builder打包
npm run electron-pack

echo "✅ 桌面端构建完成!"
echo "📦 安装包位置: dist/"
```

### 3. 小程序端构建

#### 微信小程序配置
```json
// miniprogram/app.json
{
  "pages": [
    "pages/index/index",
    "pages/chat/chat",
    "pages/profile/profile"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "YYC3 AI助手",
    "navigationBarTextStyle": "black"
  },
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  }
}
```

---

## 👥 第五阶段：单位内部测试部署

### 1. 测试环境搭建

#### 测试服务器配置 (`docker-compose.test.yml`)
```yaml
version: '3.8'

services:
  test-frontend:
    image: yyc3-ai/frontend:test
    container_name: yyc3-test-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://test-api.yyc3-local.com:3001
      - REACT_APP_ENV=test
    networks:
      - test-network

  test-backend:
    image: yyc3-ai/backend:test
    container_name: yyc3-test-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=test
      - DB_HOST=test-postgres
      - REDIS_HOST=test-redis
    depends_on:
      - test-postgres
      - test-redis
    networks:
      - test-network

  test-postgres:
    image: postgres:15-alpine
    container_name: yyc3-test-postgres
    environment:
      POSTGRES_DB: yyc3_ai_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    volumes:
      - test_postgres_data:/var/lib/postgresql/data
      - ./test-data:/docker-entrypoint-initdb.d
    networks:
      - test-network

  test-redis:
    image: redis:7-alpine
    container_name: yyc3-test-redis
    volumes:
      - test_redis_data:/data
    networks:
      - test-network

volumes:
  test_postgres_data:
  test_redis_data:

networks:
  test-network:
    driver: bridge
```

### 2. 测试数据初始化

#### 测试数据脚本 (`scripts/init-test-data.sh`)
```bash
#!/bin/bash

echo "🔄 初始化测试数据..."

# 创建测试用户
docker exec yyc3-test-postgres psql -U test_user -d yyc3_ai_test << EOF
-- 创建测试用户
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('test_admin', 'admin@yyc3.com', '\$2b\$10\$hashed_password', '测试管理员', 'admin'),
('test_user1', 'user1@yyc3.com', '\$2b\$10\$hashed_password', '测试用户1', 'user'),
('test_user2', 'user2@yyc3.com', '\$2b\$10\$hashed_password', '测试用户2', 'user');

-- 创建测试对话
INSERT INTO ai_conversations (user_id, title, context) VALUES
((SELECT id FROM users WHERE username='test_user1'), '测试对话1', '{"topic": "测试", "language": "zh-CN"}'),
((SELECT id FROM users WHERE username='test_user2'), '测试对话2', '{"topic": "AI助手", "language": "zh-CN"}');

-- 创建测试消息
INSERT INTO ai_messages (conversation_id, content, sender, metadata)
SELECT
    conv.id,
    '这是一条测试消息',
    'user',
    '{"test": true}'
FROM ai_conversations conv
WHERE conv.title LIKE '测试%';
EOF

echo "✅ 测试数据初始化完成!"
```

### 3. 测试部署脚本

#### 自动化测试部署 (`scripts/deploy-test.sh`)
```bash
#!/bin/bash

set -e

echo "🚀 开始部署测试环境..."

# 1. 拉取最新代码
git pull origin main

# 2. 构建测试镜像
echo "📦 构建测试镜像..."
docker build -t yyc3-ai/frontend:test ./frontend
docker build -t yyc3-ai/backend:test ./backend

# 3. 停止旧容器
echo "🔄 停止旧容器..."
docker-compose -f docker-compose.test.yml down

# 4. 启动新容器
echo "🔄 启动新容器..."
docker-compose -f docker-compose.test.yml up -d

# 5. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 6. 初始化测试数据
echo "📊 初始化测试数据..."
./scripts/init-test-data.sh

# 7. 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    exit 1
fi

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
    exit 1
fi

echo "🎉 测试环境部署完成!"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:3001"
```

### 4. 单位测试指南

#### 测试用户手册 (`docs/USER_TESTING_GUIDE.md`)
```markdown
# YYC3-AI 单位内部测试指南

## 🎯 测试目标
1. 功能完整性测试
2. 性能压力测试
3. 用户体验测试
4. 安全性测试

## 👥 测试用户分配

### 测试用户1: 管理员
- **用户名**: test_admin
- **密码**: TestAdmin123!
- **权限**: 管理员权限，可以查看所有数据和配置

### 测试用户2: 普通用户
- **用户名**: test_user1
- **密码**: TestUser123!
- **权限**: 普通用户权限，只能使用基本功能

### 测试用户3: 普通用户
- **用户名**: test_user2
- **密码**: TestUser123!
- **权限**: 普通用户权限

## 📋 测试清单

### 基础功能测试
- [ ] 用户登录/登出
- [ ] AI对话功能
- [ ] 历史记录查看
- [ ] 个人资料管理

### 性能测试
- [ ] 并发用户测试 (10个用户同时在线)
- [ ] 长时间使用测试 (连续使用2小时)
- [ ] 大文件上传测试
- [ ] 网络断开重连测试

### 兼容性测试
- [ ] Chrome浏览器
- [ ] Firefox浏览器
- [ ] Safari浏览器
- [ ] 移动端浏览器

### 安全性测试
- [ ] 密码强度验证
- [ ] 会话超时测试
- [ ] 输入验证测试
- [ ] XSS防护测试

## 🐛 问题反馈

### 反馈方式
1. 在线反馈表单
2. 测试群聊报告
3. 邮件反馈: support@yyc3.com

### 反馈内容模板
```
问题描述:
重现步骤:
预期结果:
实际结果:
环境信息:
严重程度: [低/中/高/紧急]
```

## 📊 测试数据收集

系统会自动收集:
- 用户操作日志
- 性能指标数据
- 错误日志信息
- 使用统计数据
```

---

## 🔧 第六阶段：监控与维护

### 1. 监控系统搭建

#### Prometheus配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'yyc3-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'

  - job_name: 'yyc3-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

alerting:
  alertmanagers:
    - static_configs:
      - targets:
        - alertmanager:9093
```

### 2. 日志管理系统

#### ELK Stack配置
```yaml
# logging/docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/var/log/app
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### 3. 备份策略

#### 自动备份脚本 (`scripts/backup.sh`)
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/yyc3-ai"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 开始备份..."

# 数据库备份
docker exec yyc3-postgres pg_dump -U yyc3_admin yyc3_ai_prod > "$BACKUP_DIR/db_backup_$DATE.sql"

# 文件备份
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" ./uploads

# 配置备份
cp -r ./configs "$BACKUP_DIR/configs_backup_$DATE"

echo "✅ 备份完成: $BACKUP_DIR"

# 清理旧备份 (保留7天)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -type d -name "configs_backup_*" -mtime +7 -exec rm -rf {} +
```

---

## 📚 完整部署命令总结

### 本地开发
```bash
# 1. 克隆项目
git clone <repository-url>
cd yyc3-ai-call

# 2. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d
npm run dev:backend
npm run dev:frontend
```

### 生产部署
```bash
# 1. 构建镜像
docker build -t yyc3-ai/backend:latest ./backend
docker build -t yyc3-ai/frontend:latest ./frontend

# 2. 部署生产环境
docker-compose -f docker-compose.prod.yml up -d

# 3. 配置SSL和域名
./scripts/setup-ssl.sh
./scripts/configure-domain.sh
```

### 测试部署
```bash
# 快速部署测试环境
./scripts/deploy-test.sh
```

### 监控维护
```bash
# 启动监控系统
docker-compose -f docker-compose.monitoring.yml up -d

# 执行备份
./scripts/backup.sh

# 查看日志
docker logs yyc3-backend -f
```

---

**部署时间**: 2025-11-12
**文档版本**: v1.0
**维护团队**: YYC3开发团队