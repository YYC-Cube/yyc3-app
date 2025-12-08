# API 文档

## API 概述

0379.email 提供 RESTful API 接口，支持邮件服务、用户管理、AI 功能等核心业务。

## 基础信息

- **Base URL**: `https://api.0379.email`
- **API 版本**: `v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证

### 获取访问令牌

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### 使用访问令牌

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 用户管理 API

### 用户注册

```http
POST /api/v1/users/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure-password",
  "name": "User Name"
}
```

### 获取用户信息

```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

### 更新用户信息

```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

## 邮件服务 API

### 发送邮件

```http
POST /api/v1/mail/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "content": "邮件内容",
  "type": "html",
  "template": "welcome",
  "variables": {
    "name": "用户名",
    "company": "公司名"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "messageId": "msg-12345",
    "status": "sent",
    "sentAt": "2024-11-10T10:30:00Z"
  }
}
```

### 批量发送邮件

```http
POST /api/v1/mail/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipients": [
    {"email": "user1@example.com", "name": "User 1"},
    {"email": "user2@example.com", "name": "User 2"}
  ],
  "subject": "批量邮件",
  "content": "批量邮件内容",
  "template": "newsletter"
}
```

### 获取邮件状态

```http
GET /api/v1/mail/{messageId}/status
Authorization: Bearer {token}
```

### 邮件模板管理

```http
GET /api/v1/mail/templates
Authorization: Bearer {token}
```

```http
POST /api/v1/mail/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "welcome",
  "subject": "欢迎邮件",
  "content": "<h1>欢迎 {{name}}</h1>",
  "variables": ["name"]
}
```

## AI 服务 API

### 文本生成

```http
POST /api/v1/ai/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "写一封感谢邮件",
  "model": "gpt-3.5-turbo",
  "maxTokens": 500,
  "temperature": 0.7
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "text": "生成的文本内容...",
    "usage": {
      "promptTokens": 20,
      "completionTokens": 150,
      "totalTokens": 170
    }
  }
}
```

### 邮件内容优化

```http
POST /api/v1/ai/optimize-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "邮件主题",
  "content": "邮件草稿",
  "tone": "professional",
  "language": "zh-CN"
}
```

### 智能回复建议

```http
POST /api/v1/ai/suggest-reply
Authorization: Bearer {token}
Content-Type: application/json

{
  "originalEmail": "原始邮件内容",
  "context": "商务沟通"
}
```

## Wiki 服务 API

### 获取文档列表

```http
GET /api/v1/wiki/documents
Authorization: Bearer {token}
```

### 获取文档内容

```http
GET /api/v1/wiki/documents/{documentId}
Authorization: Bearer {token}
```

### 创建文档

```http
POST /api/v1/wiki/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "文档标题",
  "content": "# 文档内容\n\n这是文档内容...",
  "category": "技术文档",
  "tags": ["api", "文档"]
}
```

### 搜索文档

```http
GET /api/v1/wiki/search?q=搜索关键词&category=技术文档
Authorization: Bearer {token}
```

## 管理面板 API

### 系统统计

```http
GET /api/v1/admin/stats
Authorization: Bearer {admin-token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 850,
      "new": 50
    },
    "emails": {
      "sent": 50000,
      "delivered": 48500,
      "failed": 1500
    },
    "system": {
      "uptime": 2592000,
      "cpu": 45.2,
      "memory": 68.5,
      "disk": 78.9
    }
  }
}
```

### 用户管理

```http
GET /api/v1/admin/users?page=1&limit=20
Authorization: Bearer {admin-token}
```

```http
PUT /api/v1/admin/users/{userId}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "role": "admin",
  "status": "active"
}
```

### 系统配置

```http
GET /api/v1/admin/config
Authorization: Bearer {admin-token}
```

```http
PUT /api/v1/admin/config
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "emailSettings": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "dailyLimit": 1000
  },
  "aiSettings": {
    "defaultModel": "gpt-3.5-turbo",
    "maxTokens": 2000
  }
}
```

## 错误处理

### 标准错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

## 限制说明

### 请求频率限制

- **免费用户**: 100 请求/小时
- **付费用户**: 1000 请求/小时
- **企业用户**: 10000 请求/小时

### 数据限制

- **邮件发送**: 单次最多 100 个收件人
- **文件上传**: 最大 10MB
- **API 响应**: 最大 1MB

### 配额管理

```http
GET /api/v1/quota
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "requests": {
      "used": 45,
      "limit": 1000,
      "resetAt": "2024-11-10T11:00:00Z"
    },
    "emails": {
      "sent": 150,
      "limit": 10000,
      "resetAt": "2024-11-11T00:00:00Z"
    }
  }
}
```

## Webhook

### 配置 Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["email.sent", "email.delivered", "email.failed"],
  "secret": "webhook-secret"
}
```

### Webhook 事件

#### 邮件发送事件

```json
{
  "event": "email.sent",
  "data": {
    "messageId": "msg-12345",
    "to": "recipient@example.com",
    "subject": "邮件主题",
    "sentAt": "2024-11-10T10:30:00Z"
  }
}
```

#### 邮件送达事件

```json
{
  "event": "email.delivered",
  "data": {
    "messageId": "msg-12345",
    "deliveredAt": "2024-11-10T10:31:00Z"
  }
}
```

## SDK 和工具

### Node.js SDK

```bash
npm install 0379-email-sdk
```

```javascript
const { EmailAPI } = require('0379-email-sdk');

const client = new EmailAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.0379.email'
});

// 发送邮件
await client.mail.send({
  to: 'user@example.com',
  subject: 'Hello',
  content: 'World'
});
```

### Python SDK

```bash
pip install 0379-email-sdk
```

```python
from email_0379 import EmailClient

client = EmailClient(api_key='your-api-key')

# 发送邮件
client.mail.send(
    to='user@example.com',
    subject='Hello',
    content='World'
)
```

### CLI 工具

```bash
npm install -g 0379-email-cli

# 配置
0379-email config set --api-key your-api-key

# 发送邮件
0379-email mail send --to user@example.com --subject "Hello" --content "World"
```

## 支持

- **API 文档**: <https://docs.0379.email>
- **GitHub**: <https://github.com/your-org/0379.email>
- **支持邮箱**: <support@0379.email>
- **状态页面**: <https://status.0379.email>

---

*API 版本：v1.0.0*
*最后更新：2024-11-10*
