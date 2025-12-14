# API Service 技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 服务概述

YYC3 API Service 是YYC3 AI Family平台的核心API服务，提供用户认证、RESTful API接口、数据验证等核心功能。

### 基本信息

- **服务名称**: YYC3 API Service
- **端口**: 6600 (生产) / 3000 (开发)
- **技术栈**: Node.js 18+ | Express.js | JWT | Redis
- **主文件**: `server.js`
- **环境配置**: `.env.example`

## 🏗️ 核心功能

### 主要特性

- **用户认证与授权**: JWT令牌管理
- **RESTful API**: 标准化API接口
- **数据验证**: 请求数据验证与响应格式化
- **错误处理**: 统一错误处理机制
- **健康检查**: 服务状态监控
- **中间件支持**: 日志、验证、限流等

### 关键端点

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/health` | GET | 服务健康检查 | ❌ |
| `/api/auth/login` | POST | 用户登录 | ❌ |
| `/api/auth/logout` | POST | 用户登出 | ✅ |
| `/api/users` | GET | 用户列表 | ✅ |
| `/api/users/:id` | GET | 用户详情 | ✅ |
| `/api/data` | POST | 数据处理 | ✅ |

## 📁 文件结构

```
api/
├── 📄 server.js              # 主服务文件
├── 📄 package.json           # 依赖配置
├── 📄 .env.example           # 环境变量示例
├── 📁 middleware/            # 中间件目录
│   └── 📄 validation.js      # 数据验证中间件
├── 📁 logs/                  # 日志目录
└── 📄 status.js              # 状态检查
```

## 🔧 配置说明

### 环境变量

```bash
# 服务端口
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yyc3_dev
DB_USER=root
DB_PASSWORD=

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# 邮件服务配置
MAIL_SERVICE_URL=https://mail.0379.email
LLM_SERVICE_URL=https://llm.0379.email
ADMIN_SERVICE_URL=https://admin.0379.email
```

## 🔌 API接口文档

### 认证接口

#### 用户登录

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

### 用户管理接口

#### 获取用户列表

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
        "status": "active",
        "created_at": "2025-12-08T06:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

## 🔒 安全特性

### JWT认证

```javascript
// JWT配置示例
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '24h',
  algorithm: 'HS256',
  issuer: 'yyc3-api-service',
  audience: 'yyc3-users'
};
```

### API限流

```javascript
// 限流配置
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每IP最多100个请求
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
```

## 📊 监控与日志

### 健康检查

访问 `/health` 端点获取服务状态：

```json
{
  "status": "ok",
  "service": "yyc3-api-service",
  "port": 6600,
  "timestamp": "2025-12-08T06:00:00.000Z",
  "uptime": 86400,
  "version": "3.0.0"
}
```

### 日志格式

```json
{
  "timestamp": "2025-12-08T06:00:00.000Z",
  "level": "INFO",
  "service": "api-service",
  "message": "User login successful",
  "data": {
    "user_id": 123,
    "ip": "192.168.1.100",
    "method": "POST",
    "endpoint": "/api/auth/login"
  }
}
```

## 🚀 部署指南

### 开发环境启动

```bash
cd /Users/yanyu/www/yyc3-22/app/api
npm install
cp .env.example .env
# 编辑 .env 文件配置
npm start
```

### 生产环境部署

```bash
# 使用 PM2 管理进程
pm2 start server.js --name "yyc3-api-service" --port 6600

# 或使用 Docker
docker build -t yyc3-api-service .
docker run -p 6600:6600 yyc3-api-service
```

## 🧪 测试

### 单元测试示例

```javascript
const request = require('supertest');
const app = require('./server');

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

## 🔗 相关链接

- **主服务文档**: `[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)`
- **API参考文档**: `[../API_REFERENCE.md](../API_REFERENCE.md)`
- **管理后台**: `admin/`
- **LLM服务**: `llm/`
- **邮件服务**: `mail/`
- **共享模块**: `shared/`

## 📞 技术支持

- **问题反馈**: <dev@0379.email>
- **在线文档**: `https://docs.0379.email`

---

<div align="center">

**[⬆️ 回到顶部](#api-service-技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🚀

</div>
