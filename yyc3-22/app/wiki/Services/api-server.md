# API Server 文档

## 服务概述

API Server 是系统的核心服务之一，提供RESTful API接口，负责处理客户端的请求，包括用户认证、邮件管理、系统配置等功能。

## 技术栈

- **框架**: Node.js + Express
- **数据库**: MongoDB
- **缓存**: Redis
- **认证**: JWT

## 安装和配置

### 环境要求

- Node.js 14.x 或更高版本
- MongoDB 4.x 或更高版本
- Redis 6.x 或更高版本

### 配置文件

配置文件位于 `config/config.js`，主要配置项包括：

```javascript
module.exports = {
  port: 3000,
  mongo: {
    url: 'mongodb://localhost:27017/email-system',
    options: {}
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: ''
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '24h'
  }
};
```

## API 端点

### 认证相关

#### POST /api/auth/login

用户登录接口

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123456",
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

#### POST /api/auth/logout

用户登出接口

### 邮件管理

#### GET /api/mails

获取邮件列表

**查询参数**:

- `page`: 页码，默认1
- `limit`: 每页数量，默认20
- `status`: 状态筛选（已读、未读等）
- `search`: 搜索关键词

**响应**:

```json
{
  "data": [
    {
      "id": "123",
      "subject": "邮件主题",
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "content": "邮件内容",
      "status": "unread",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### GET /api/mails/:id

获取单个邮件详情

#### POST /api/mails

发送新邮件

**请求体**:

```json
{
  "to": "recipient@example.com",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "邮件主题",
  "content": "邮件内容",
  "attachments": [
    {
      "filename": "文件.txt",
      "content": "文件内容"
    }
  ]
}
```

#### PUT /api/mails/:id

更新邮件信息

#### DELETE /api/mails/:id

删除邮件

## 错误处理

API 返回的错误格式统一为：

```json
{
  "error": "错误代码",
  "message": "错误描述"
}
```

常见错误代码：

- `INVALID_CREDENTIALS`: 认证失败
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 数据验证失败
- `INTERNAL_ERROR`: 内部服务器错误

## 部署

请参考 [PM2 部署](../Deployment/PM2.md) 或 [Docker 部署](../Deployment/Docker.md) 文档。

## 监控和日志

日志文件位于 `logs/` 目录，包含访问日志和错误日志。可以通过环境变量配置日志级别。
