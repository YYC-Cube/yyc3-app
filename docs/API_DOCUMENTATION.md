# 0379.email 平台 API 文档

## 📖 API 概述

0379.email 平台提供完整的 RESTful API，支持用户管理、系统配置、AI对话、邮件发送等功能。所有API遵循REST设计原则，使用JSON格式进行数据交换。

## 🔗 API 基础信息

### 服务地址
- **本地开发**: `http://localhost:3000`
- **Nginx代理**: `http://localhost:8000/api/`
- **外网访问**: `api.0379.email:5001`

### 认证方式
- **认证类型**: JWT Token
- **Header名称**: `Authorization`
- **Token格式**: `Bearer <jwt_token>`

### 通用响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

## 🏥 健康检查 API

### 系统健康检查
检查API服务运行状态。

```http
GET /health
```

**响应示例:**
```json
{
  "status": "ok",
  "service": "0379.email Production API",
  "version": "1.0.0",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

**状态码:**
- `200 OK`: 服务正常
- `503 Service Unavailable`: 服务不可用

## 👤 用户管理 API

### 用户注册
创建新用户账号。

```http
POST /api/users/register
```

**请求参数:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "测试用户",
  "role": "user"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "测试用户",
    "role": "user",
    "created_at": "2025-11-10T12:00:00.000Z"
  }
}
```

### 用户登录
用户身份验证。

```http
POST /api/users/login
```

**请求参数:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "测试用户",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 获取用户信息
获取当前用户的详细信息。

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "测试用户",
    "role": "user",
    "is_active": true,
    "created_at": "2025-11-10T12:00:00.000Z",
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

### 更新用户信息
更新当前用户的个人信息。

```http
PUT /api/users/profile
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "full_name": "新的用户名",
  "email": "newemail@example.com"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "newemail@example.com",
    "full_name": "新的用户名",
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

### 获取用户列表
获取所有用户列表（需要管理员权限）。

```http
GET /api/users
Authorization: Bearer <admin_token>
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `role`: 角色过滤
- `is_active`: 是否激活过滤

**响应示例:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "测试用户",
        "role": "user",
        "is_active": true,
        "created_at": "2025-11-10T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

## ⚙️ 系统配置 API

### 获取系统配置
获取系统配置信息。

```http
GET /api/config
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "app_name": "0379.email 多项目协同智能平台",
    "app_version": "1.0.0",
    "environment": "production",
    "features": {
      "ai_service": true,
      "mail_service": true,
      "monitoring": true
    },
    "limits": {
      "max_upload_size": "100MB",
      "session_timeout": 3600
    }
  }
}
```

### 更新系统配置
更新系统配置（需要管理员权限）。

```http
PUT /api/config
Authorization: Bearer <admin_token>
```

**请求参数:**
```json
{
  "app_name": "新的应用名称",
  "max_upload_size": "200MB",
  "maintenance_mode": false
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "系统配置更新成功",
  "data": {
    "app_name": "新的应用名称",
    "max_upload_size": "200MB",
    "maintenance_mode": false,
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

## 🤖 AI 服务 API

### AI 对话
与AI服务进行对话。

```http
POST /api/ai/chat
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "message": "你好，请介绍一下0379.email平台",
  "context": "system_description",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "response": "0379.email是一个多项目协同智能平台...",
    "model": "gpt-3.5-turbo",
    "tokens_used": 150,
    "response_time": 1.2,
    "session_id": "session_123456"
  }
}
```

### 文本生成
生成指定类型的文本内容。

```http
POST /api/ai/generate
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "type": "email",
  "prompt": "为用户注册确认生成邮件内容",
  "parameters": {
    "username": "testuser",
    "app_name": "0379.email"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "generated_text": "亲爱的testuser，欢迎注册0379.email平台...",
    "type": "email",
    "tokens_used": 80,
    "generation_time": 0.8
  }
}
```

### 获取AI服务状态
获取AI服务的运行状态。

```http
GET /api/ai/status
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "service_status": "healthy",
    "model_available": true,
    "redis_connected": true,
    "active_sessions": 5,
    "total_requests": 1000,
    "average_response_time": 1.1
  }
}
```

## 📧 邮件服务 API

### 发送邮件
发送邮件到指定收件人。

```http
POST /api/mail/send
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "to": "recipient@example.com",
  "subject": "测试邮件",
  "content": "这是一封测试邮件内容",
  "type": "html",
  "template": "welcome",
  "template_data": {
    "username": "testuser",
    "app_name": "0379.email"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "邮件发送成功",
  "data": {
    "message_id": "msg_123456",
    "status": "sent",
    "sent_at": "2025-11-10T12:00:00.000Z"
  }
}
```

### 验证邮箱
验证邮箱地址的有效性。

```http
POST /api/mail/validate
Authorization: Bearer <token>
```

**请求参数:**
```json
{
  "email": "test@example.com"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "email": "test@example.com",
    "is_valid": true,
    "domain": "example.com",
    "mx_records": ["mail.example.com"],
    "suggestions": []
  }
}
```

### 获取邮件模板列表
获取可用的邮件模板。

```http
GET /api/mail/templates
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "welcome",
        "description": "用户欢迎邮件",
        "variables": ["username", "app_name"]
      },
      {
        "name": "reset_password",
        "description": "密码重置邮件",
        "variables": ["username", "reset_link"]
      }
    ]
  }
}
```

### 获取邮件发送状态
查询邮件发送状态。

```http
GET /api/mail/status/{message_id}
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_123456",
    "status": "delivered",
    "sent_at": "2025-11-10T12:00:00.000Z",
    "delivered_at": "2025-11-10T12:00:05.000Z",
    "opens": 1,
    "clicks": 0
  }
}
```

## 📊 系统统计 API

### 获取系统统计
获取系统运行统计信息。

```http
GET /api/stats/system
Authorization: Bearer <admin_token>
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "uptime": 86400,
    "total_users": 100,
    "active_users": 25,
    "total_requests": 10000,
    "error_rate": 0.01,
    "average_response_time": 150,
    "memory_usage": {
      "used": "512MB",
      "total": "2GB",
      "percentage": 25
    },
    "cpu_usage": 15.5,
    "disk_usage": {
      "used": "10GB",
      "total": "100GB",
      "percentage": 10
    }
  }
}
```

### 获取API统计
获取API调用统计信息。

```http
GET /api/stats/api
Authorization: Bearer <admin_token>
```

**查询参数:**
- `start_date`: 开始日期
- `end_date`: 结束日期
- `endpoint`: 端点过滤

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total_requests": 5000,
    "successful_requests": 4950,
    "failed_requests": 50,
    "top_endpoints": [
      {
        "endpoint": "/api/users/login",
        "requests": 1000,
        "average_response_time": 120
      }
    ],
    "error_distribution": {
      "400": 30,
      "401": 15,
      "500": 5
    }
  }
}
```

## 🔒 权限管理

### 权限级别
- **guest**: 游客权限，只能访问公开API
- **user**: 普通用户权限，可以访问基本功能
- **admin**: 管理员权限，可以访问所有功能

### 权限控制
每个API都有相应的权限要求，未授权访问将返回401状态码。

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未授权访问，需要有效的认证令牌"
  }
}
```

## 🚨 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| SUCCESS | 200 | 操作成功 |
| CREATED | 201 | 资源创建成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| METHOD_NOT_ALLOWED | 405 | 请求方法不允许 |
| CONFLICT | 409 | 资源冲突 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

## 📝 使用示例

### JavaScript 客户端示例
```javascript
// 用户登录
async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.data.token);
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 发送邮件
async function sendEmail(to, subject, content, token) {
  try {
    const response = await fetch('http://localhost:3000/api/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to, subject, content })
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('发送邮件失败:', error);
    throw error;
  }
}
```

### Python 客户端示例
```python
import requests
import json

class APIClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        response = requests.post(
            f'{self.base_url}/api/users/login',
            json={'username': username, 'password': password}
        )
        data = response.json()

        if data['success']:
            self.token = data['data']['token']
            return data['data']
        else:
            raise Exception(data['error']['message'])

    def send_email(self, to, subject, content):
        if not self.token:
            raise Exception('需要先登录')

        response = requests.post(
            f'{self.base_url}/api/mail/send',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            },
            json={'to': to, 'subject': subject, 'content': content}
        )
        data = response.json()

        if data['success']:
            return data['data']
        else:
            raise Exception(data['error']['message'])

# 使用示例
client = APIClient()
user_data = client.login('testuser', 'password123')
email_result = client.send_email('test@example.com', '测试邮件', '邮件内容')
print(f"邮件发送成功: {email_result['message_id']}")
```

## 🔄 版本更新

### API 版本控制
- 当前版本: `v1.0.0`
- 版本策略: 语义化版本控制
- 向后兼容: 保证同一大版本内的向后兼容性

### 更新通知
- 新版本发布将通过系统通知告知用户
- 重大变更将提前发布公告
- 废弃API将继续支持6个月

---

**API文档版本**: v1.0.0
**更新时间**: 2025年11月10日
**文档状态**: 🎉 最新版本