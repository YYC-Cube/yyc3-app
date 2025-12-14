/**
 * @file YYC3 App 组件技术文档
 * @description YYC3 AI Family平台核心应用组件的完整技术文档
 * @author YYC Team
 * @version 3.0.0
 * @created 2024-12-08
 * @updated 2024-12-08
 */

# 🔖 YYC3 App 组件技术文档

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 📖 项目概述

YYC3 App 组件是YYC3 AI Family平台的核心应用组件，提供微服务架构的完整解决方案，包括API服务、管理后台、AI大语言模型服务、邮件服务等核心功能模块。

### 基本信息

- **项目名称**: YYC3 App Component
- **版本**: 3.0.0
- **技术栈**: Node.js 18+ | Express.js | Redis | Docker | Kubernetes
- **架构模式**: 微服务架构
- **部署环境**: 生产环境 (YYC3-33) | 开发环境 (YYC3-33)
- **代码仓库**: `https://github.com/YYC-Cube/yyc3-app.git`

## 🏗️ 系统架构

### 微服务架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Service   │    │  Admin Console  │    │   LLM Service   │
│     (6600)      │    │     (6601)      │    │     (6602)      │
│                 │    │                 │    │                 │
│ • 用户认证      │    │ • 系统管理      │    │ • AI对话        │
│ • RESTful API   │    │ • 权限控制      │    │ • 文本处理      │
│ • 数据验证      │    │ • 监控面板      │    │ • 模型推理      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mail Service  │    │  Shared Modules │    │ External APIs   │
│     (6603)      │    │                 │    │                 │
│                 │    │ • 缓存管理      │    │ • 第三方集成    │
│ • 邮件发送      │    │ • 日志系统      │    │ • Webhook       │
│ • 队列处理      │    │ • 配置中心      │    │ • 数据同步      │
│ • 模板引擎      │    │ • 服务发现      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心组件

| 组件 | 端口 | 功能描述 | 技术栈 |
|------|------|----------|--------|
| **API Service** | 6600 | 核心API服务，用户认证、数据接口 | Node.js + Express |
| **Admin Console** | 6601 | 管理后台，系统配置、权限管理 | Node.js + Express |
| **LLM Service** | 6602 | AI大语言模型服务，智能对话 | Node.js + Python |
| **Mail Service** | 6603 | 邮件服务，发送通知、模板渲染 | Node.js + Nodemailer |
| **Shared Cache** | 6606 | Redis缓存服务，会话存储 | Redis 7.0 |
| **Gateway** | - | API网关，路由、负载均衡 | Nginx + Envoy |

## 📁 项目结构详解

### 目录树结构

```
app/
├── 📁 api/                    # API服务模块
│   ├── 📄 server.js          # API服务主文件
│   ├── 📄 middleware/        # 中间件
│   │   └── validation.js     # 数据验证中间件
│   └── 📄 package.json       # 依赖配置
├── 📁 admin/                 # 管理后台模块
│   ├── 📄 server.js          # 管理后台主文件
│   └── 📄 swagger.json       # API文档
├── 📁 llm/                   # AI大语言模型服务
│   ├── 📄 server.js          # LLM服务主文件
│   ├── 📄 main.py            # Python AI核心
│   └── 📄 requirements.txt   # Python依赖
├── 📁 mail/                  # 邮件服务模块
│   ├── 📄 server.js          # 邮件服务主文件
│   ├── 📁 html/              # 邮件模板
│   └── 📁 queue/             # 邮件队列
├── 📁 shared/                # 共享模块
│   ├── 📁 cache/             # 缓存管理
│   ├── 📁 config-center/     # 配置中心
│   ├── 📁 gateway/           # API网关
│   ├── 📁 logger.js          # 日志系统
│   ├── 📁 redis/             # Redis客户端
│   └── 📁 service-mesh/      # 服务网格
├── 📁 docs/                  # 项目文档
│   ├── 📄 architecture-summary.md
│   ├── 📁 deployment/        # 部署文档
│   ├── 📁 security/          # 安全文档
│   └── 📁 services/          # 服务文档
├── 📁 scripts/               # 自动化脚本
│   ├── 📄 deploy.sh          # 部署脚本
│   ├── 📄 backup-to-nas.sh   # 备份脚本
│   └── 📄 service-mesh-start.js
├── 📁 tests/                 # 测试文件
│   ├── 📄 unit/              # 单元测试
│   └── 📄 setup.ts           # 测试配置
├── 📁 helm/                  # Kubernetes部署
│   ├── 📄 Chart.yaml         # Helm图表
│   ├── 📄 values.yaml        # 配置值
│   └── 📁 templates/         # K8s模板
├── 📁 .github/               # GitHub Actions
│   └── 📁 workflows/         # CI/CD工作流
├── 📁 etc/                   # 系统配置
│   ├── 📁 nginx/             # Nginx配置
│   └── 📁 systemd/           # 系统服务
└── 📄 package.json           # 主项目配置
```

### 核心文件说明

#### 1. API服务 (`api/server.js`)

```javascript
// API服务核心功能
• 用户认证与授权 (JWT)
• RESTful API接口
• 请求验证与响应格式化
• 错误处理与日志记录
• 健康检查端点
```

**主要端点**:

- `GET /health` - 服务健康检查
- `POST /api/auth/login` - 用户登录
- `GET /api/users` - 用户管理
- `POST /api/data` - 数据处理接口

#### 2. 管理后台 (`admin/server.js`)

```javascript
// 管理后台核心功能
• 系统监控仪表板
• 用户权限管理
• 配置参数管理
• 日志查看与分析
• 性能监控
```

**主要功能**:

- 用户角色管理 (Admin/User/Guest)
- 系统配置管理
- 服务状态监控
- 数据统计报表

#### 3. LLM服务 (`llm/server.js` + `main.py`)

```javascript
// AI服务核心功能
• 大语言模型集成
• 智能对话处理
• 文本分析与生成
• 多模型支持
```

**支持的AI模型**:

- OpenAI GPT系列
- Anthropic Claude
- 本地部署模型
- 自定义模型接口

#### 4. 邮件服务 (`mail/server.js`)

```javascript
// 邮件服务核心功能
• 邮件发送与队列管理
• HTML模板渲染
• 批量邮件处理
• 发送状态跟踪
```

**邮件提供商支持**:

- SMTP (通用)
- SendGrid
- AWS SES
- 阿里云邮件推送

## 🚀 部署配置

### 环境变量配置

#### 开发环境 (.env.development)

```bash
# 服务端口配置
API_PORT=3000
ADMIN_PORT=3001
LLM_PORT=3002
MAIL_PORT=3003

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yyc3_dev
DB_USER=root
DB_PASSWORD=

# AI服务配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### 生产环境 (.env.production)

```bash
# 生产服务端口 (对应外部端口)
API_PORT=6600
ADMIN_PORT=6601
LLM_PORT=6602
MAIL_PORT=6603

# 生产Redis配置
REDIS_HOST=redis.0379.email
REDIS_PORT=6606
REDIS_PASSWORD=prod_redis_password

# 生产数据库配置
DB_HOST=mysql.internal
DB_PORT=3306
DB_NAME=yyc3_prod
DB_USER=prod_user
DB_PASSWORD=prod_secure_password

# 生产AI服务配置
OPENAI_API_KEY=prod_openai_key
ANTHROPIC_API_KEY=prod_anthropic_key

# 生产邮件配置
SMTP_HOST=smtp.yyc3.com
SMTP_PORT=465
SMTP_USER=noreply@yyc3.com
SMTP_PASSWORD=prod_mail_password
```

### Docker部署

#### Docker Compose配置

```yaml
version: '3.8'
services:
  api-service:
    build: .
    ports:
      - "6600:6600"
    environment:
      - NODE_ENV=production
      - API_PORT=6600
    depends_on:
      - redis
      - mysql
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  admin-service:
    build: .
    ports:
      - "6601:6601"
    environment:
      - NODE_ENV=production
      - ADMIN_PORT=6601
    depends_on:
      - redis
    restart: unless-stopped

  llm-service:
    build: .
    ports:
      - "6602:6602"
    environment:
      - NODE_ENV=production
      - LLM_PORT=6602
    volumes:
      - ./llm/models:/app/models
    restart: unless-stopped

  mail-service:
    build: .
    ports:
      - "6603:6603"
    environment:
      - NODE_ENV=production
      - MAIL_PORT=6603
    volumes:
      - ./mail/templates:/app/templates
      - ./mail/queue:/app/queue
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6606:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    ports:
      - "6607:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=secure_root_password
      - MYSQL_DATABASE=yyc3_prod
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  redis_data:
  mysql_data:
```

### Kubernetes部署

#### Helm Chart配置 (`helm/values.yaml`)

```yaml
# YYC3 App Helm配置
replicaCount: 3

image:
  repository: yyc3/app
  tag: "v3.0.0"
  pullPolicy: Always

service:
  type: ClusterIP
  ports:
    api: 6600
    admin: 6601
    llm: 6602
    mail: 6603

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.0379.email
      paths:
        - path: /
          pathType: Prefix
    - host: admin.0379.email
      paths:
        - path: /
          pathType: Prefix
    - host: llm.0379.email
      paths:
        - path: /
          pathType: Prefix
    - host: mail.0379.email
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## 🔧 API接口文档

### API服务接口

#### 认证接口

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user_password"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### 用户管理接口

```http
GET /api/users
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@0379.email",
        "role": "admin",
        "status": "active"
      },
      {
        "id": 2,
        "email": "user@0379.email",
        "role": "user",
        "status": "active"
      }
    ],
    "total": 2
  }
}
```

### LLM服务接口

#### AI对话接口

```http
POST /api/llm/chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "你好，请介绍一下YYC3平台",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000
}

Response:
{
  "success": true,
  "data": {
    "response": "YYC3是一个功能强大的AI平台...",
    "model": "gpt-3.5-turbo",
    "tokens_used": 256,
    "cost": 0.000256
  }
}
```

### 邮件服务接口

#### 发送邮件接口

```http
POST /api/mail/send
Content-Type: application/json
Authorization: Bearer {token}

{
  "to": ["recipient@example.com"],
  "subject": "YYC3平台通知",
  "template": "welcome",
  "data": {
    "name": "张三",
    "app_name": "YYC3"
  },
  "type": "html"
}

Response:
{
  "success": true,
  "data": {
    "message_id": "msg_123456789",
    "status": "queued",
    "recipients": 1
  }
}
```

## 📊 监控与日志

### 健康检查

每个服务都提供健康检查端点：

```bash
# API服务健康检查
curl https://api.0379.email/health

# 管理后台健康检查
curl https://admin.0379.email/health

# LLM服务健康检查
curl https://llm.0379.email/health

# 邮件服务健康检查
curl https://mail.0379.email/health
```

**预期响应格式**:

```json
{
  "status": "ok",
  "service": "service-name",
  "port": 6600,
  "timestamp": "2025-12-08T06:00:00.000Z",
  "uptime": 86400,
  "version": "3.0.0"
}
```

### 日志管理

#### 日志级别

- **ERROR**: 系统错误、异常
- **WARN**: 警告信息、性能问题
- **INFO**: 一般信息、状态变更
- **DEBUG**: 调试信息、详细跟踪

#### 日志格式

```json
{
  "timestamp": "2025-12-08T06:00:00.000Z",
  "level": "INFO",
  "service": "api-service",
  "message": "User login successful",
  "data": {
    "user_id": 123,
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

#### 日志轮转配置

```bash
# /etc/logrotate.d/yyc3-app
/var/log/yyc3/app/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 yyc3 yyc3
    postrotate
        systemctl reload yyc3-app
    endscript
}
```

### 性能监控

#### Prometheus指标

```javascript
// API服务指标示例
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});
```

#### Grafana仪表板

- 请求响应时间
- 错误率统计
- 活跃连接数
- 内存和CPU使用率
- 数据库连接池状态

## 🔒 安全配置

### SSL/TLS配置

#### Nginx SSL配置

```nginx
server {
    listen 443 ssl http2;
    server_name api.0379.email;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/0379.email/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/0379.email/privkey.pem;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # 安全头配置
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:6600;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### JWT认证配置

```javascript
// JWT配置
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '24h',
  algorithm: 'HS256',
  issuer: 'yyc3-app',
  audience: 'yyc3-users'
};

// 中间件验证
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_CONFIG.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}
```

### API限流配置

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

## 🧪 测试配置

### 单元测试

```javascript
// tests/unit/api.test.js
const request = require('supertest');
const app = require('../api/server');

describe('API Service', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/auth/login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(response.body).toHaveProperty('data.token');
  });
});
```

### 集成测试

```javascript
// tests/integration/services.test.js
describe('Service Integration', () => {
  test('API Service connects to Redis', async () => {
    const redis = require('../shared/redis');
    await redis.connect();
    expect(redis.status).toBe('connected');
  });

  test('LLM Service processes chat request', async () => {
    const response = await request(app)
      .post('/api/llm/chat')
      .send({
        message: 'Hello',
        model: 'gpt-3.5-turbo'
      })
      .expect(200);

    expect(response.body.data).toHaveProperty('response');
  });
});
```

### 测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 📋 CI/CD配置

### GitHub Actions工作流

#### CI配置 (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

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
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

#### CD配置 (`.github/workflows/cd.yml`)

```yaml
name: CD Pipeline

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.ref_name }}

    - name: Deploy to Kubernetes
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        helm upgrade --install yyc3-app ./helm \
          --namespace yyc3 \
          --create-namespace \
          --set image.tag=${{ github.ref_name }}
```

## 🔄 版本管理

### 版本控制策略

- **主版本**: 重大架构变更、不兼容的API变更
- **次版本**: 新功能添加、向后兼容的API变更
- **修订版本**: Bug修复、性能优化、文档更新

### 发布流程

1. **开发分支** → 功能开发测试
2. **主分支** → 代码审查、集成测试
3. **发布标签** → 创建版本标签 `v3.0.0`
4. **自动化部署** → CI/CD管道自动部署
5. **版本文档** → 更新CHANGELOG和API文档

### 版本回滚

```bash
# Helm回滚到上一个版本
helm rollback yyc3-app 1 --namespace yyc3

# Git回滚到指定标签
git checkout v2.9.0
helm upgrade --install yyc3-app ./helm \
  --namespace yyc3 \
  --set image.tag=v2.9.0
```

## 📞 技术支持

### 联系方式

- **技术支持**: <dev@0379.email>
- **紧急联系**: 系统告警通知
- **文档更新**: GitHub Wiki

### 相关链接

- **项目仓库**: <https://github.com/YYC-Cube/yyc3-app>
- **API文档**: <https://api.0379.email/docs>

- **管理后台**: <https://admin.0379.email>

### 故障排查

#### 常见问题

1. **服务无法启动**
   - 检查端口占用: `netstat -tlnp | grep 6600`
   - 查看服务日志: `journalctl -u yyc3-app -f`
   - 验证配置文件: `node -c server.js`

2. **数据库连接失败**
   - 检查网络连接: `telnet db_host 3306`
   - 验证认证信息: 确认用户名密码正确
   - 检查防火墙规则: 确保端口开放

3. **Redis连接超时**
   - 检查Redis服务: `systemctl status redis`
   - 验证连接配置: 确认host和port正确
   - 检查内存使用: `redis-cli info memory`

---

## 📄 文档标尾 (Footer)

「YYC³ 技术文档标准化系列」

*斜体英文标语*
