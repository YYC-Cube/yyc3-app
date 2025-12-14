# 🔖 YYC3 App API 参考文档

> 📋 **API版本**: v3.0.0 | **更新时间**: 2025-12-08 | **基础URL**: <https://api.0379.email>

**团队名称**：YanYuCloudCube

「YYC³ 技术文档标准化系列」

*斜体英文标语*

## 📖 API概述

YYC3 App API提供完整的RESTful接口，支持用户认证、数据管理、AI服务集成、邮件发送等核心功能。

### 基本信息

- **基础URL**: `https://api.0379.email`
- **API版本**: `v3.0.0`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8
- **HTTP方法**: GET, POST, PUT, DELETE, PATCH

### 请求头格式

```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
User-Agent: YYC3-App/3.0.0
Accept: application/json
```

## 🔐 认证接口

### 用户登录

```http
POST /api/auth/login
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "user_password",
  "remember_me": false
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "status": "active",
      "last_login": "2025-12-08T06:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z"
    },
    "expires_in": 86400
  }
}
```

**错误响应**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "邮箱或密码错误",
    "details": null
  }
}
```

### 刷新令牌

```http
POST /api/auth/refresh
```

**请求体**:

```json
{
  "refresh_token": "refresh_token_here"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expires_in": 86400
  }
}
```

### 用户注册

```http
POST /api/auth/register
```

**请求体**:

```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "username": "newuser",
  "full_name": "New User"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 124,
      "email": "newuser@example.com",
      "username": "newuser",
      "role": "user",
      "status": "pending_verification",
      "created_at": "2025-12-08T06:00:00.000Z"
    },
    "verification_required": true
  }
}
```

### 用户登出

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "message": "登出成功"
}
```

## 👥 用户管理接口

### 获取用户列表

```http
GET /api/users?page=1&limit=20&role=all&status=all&search=
Authorization: Bearer {token}
```

**查询参数**:

- `page` (int): 页码，默认1
- `limit` (int): 每页数量，默认20，最大100
- `role` (string): 角色筛选 (all|admin|user|guest)
- `status` (string): 状态筛选 (all|active|inactive|pending)
- `search` (string): 搜索关键词

**响应**:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@0379.email",
        "username": "admin",
        "full_name": "Administrator",
        "role": "admin",
        "status": "active",
        "last_login": "2025-12-08T05:30:00.000Z",
        "created_at": "2025-01-01T00:00:00.000Z",
        "profile": {
          "avatar": "https://cdn.0379.email/avatars/admin.jpg",
          "phone": "+86 138 0013 8000",
          "department": "IT部门"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### 获取用户详情

```http
GET /api/users/{user_id}
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "username": "username",
      "full_name": "User Name",
      "role": "user",
      "status": "active",
      "profile": {
        "avatar": "https://cdn.0379.email/avatars/user123.jpg",
        "phone": "+86 138 0013 8001",
        "department": "产品部",
        "position": "产品经理",
        "bio": "负责产品规划和管理"
      },
      "preferences": {
        "language": "zh-CN",
        "timezone": "Asia/Shanghai",
        "notifications": {
          "email": true,
          "sms": false,
          "push": true
        }
      },
      "stats": {
        "login_count": 256,
        "last_login": "2025-12-08T05:30:00.000Z",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    }
  }
}
```

### 更新用户信息

```http
PUT /api/users/{user_id}
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "full_name": "Updated Name",
  "profile": {
    "phone": "+86 138 0013 8002",
    "department": "技术部",
    "position": "高级工程师",
    "bio": "负责系统架构设计"
  },
  "preferences": {
    "language": "en-US",
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    }
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "full_name": "Updated Name",
      "profile": {
        "phone": "+86 138 0013 8002",
        "department": "技术部",
        "position": "高级工程师",
        "bio": "负责系统架构设计"
      },
      "preferences": {
        "language": "en-US",
        "timezone": "UTC",
        "notifications": {
          "email": true,
          "sms": true,
          "push": false
        }
      },
      "updated_at": "2025-12-08T06:00:00.000Z"
    }
  }
}
```

### 删除用户

```http
DELETE /api/users/{user_id}
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "message": "用户删除成功"
}
```

## 🤖 AI服务接口

### AI对话

```http
POST /api/ai/chat
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "message": "你好，请介绍一下YYC3平台的特点",
  "conversation_id": "conv_123456789",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false,
  "context": {
    "user_role": "developer",
    "project": "YYC3平台"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_123456789",
    "message_id": "msg_987654321",
    "response": "YYC3平台是一个功能强大的AI智能平台...",
    "model": "gpt-3.5-turbo",
    "usage": {
      "prompt_tokens": 156,
      "completion_tokens": 342,
      "total_tokens": 498,
      "cost": 0.000996
    },
    "metadata": {
      "response_time": 1.23,
      "server": "ai-cluster-01",
      "cached": false
    }
  }
}
```

### 流式AI对话

```http
POST /api/ai/chat/stream
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "message": "写一个Python函数来处理数据",
  "conversation_id": "conv_123456789",
  "model": "gpt-4",
  "stream": true
}
```

**响应** (Server-Sent Events):

```
data: {"type": "start", "conversation_id": "conv_123456789"}

data: {"type": "token", "content": "当然"}

data: {"type": "token", "content": "，"}

data: {"type": "token", "content": "我"}

data: {"type": "token", "content": "可以"}

data: {"type": "token", "content": "为"}

data: {"type": "token", "content": "您"}

data: {"type": "token", "content": "编写"}

data: {"type": "token", "content": "一"}

data: {"type": "token", "content": "个"}

data: {"type": "end", "usage": {"prompt_tokens": 25, "completion_tokens": 150, "total_tokens": 175}}
```

### 获取对话历史

```http
GET /api/ai/conversations/{conversation_id}?page=1&limit=20
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv_123456789",
      "title": "Python编程问题",
      "model": "gpt-3.5-turbo",
      "created_at": "2025-12-08T05:00:00.000Z",
      "updated_at": "2025-12-08T06:00:00.000Z",
      "message_count": 15
    },
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "写一个Python函数来处理数据",
        "timestamp": "2025-12-08T05:30:00.000Z"
      },
      {
        "id": "msg_2",
        "role": "assistant",
        "content": "当然，我可以为您编写一个Python函数...",
        "timestamp": "2025-12-08T05:30:01.500Z",
        "usage": {
          "prompt_tokens": 25,
          "completion_tokens": 150,
          "total_tokens": 175
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

### 文本分析

```http
POST /api/ai/analyze
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "text": "YYC3是一个创新的AI智能平台，为企业提供全方位的人工智能解决方案。",
  "analysis_types": ["sentiment", "keywords", "entities", "language"],
  "options": {
    "language": "zh-CN",
    "detailed": true
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "text_id": "analysis_123456789",
    "analysis": {
      "sentiment": {
        "score": 0.85,
        "label": "positive",
        "confidence": 0.92
      },
      "keywords": [
        {
          "word": "YYC3",
          "score": 0.95,
          "frequency": 1
        },
        {
          "word": "AI智能平台",
          "score": 0.88,
          "frequency": 1
        },
        {
          "word": "人工智能解决方案",
          "score": 0.82,
          "frequency": 1
        }
      ],
      "entities": [
        {
          "text": "YYC3",
          "type": "ORGANIZATION",
          "confidence": 0.89
        }
      ],
      "language": {
        "detected": "zh-CN",
        "confidence": 0.98
      }
    },
    "metadata": {
      "text_length": 45,
      "word_count": 12,
      "processing_time": 0.156
    }
  }
}
```

## 📧 邮件服务接口

### 发送邮件

```http
POST /api/mail/send
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "to": ["recipient@example.com", "user2@example.com"],
  "cc": ["manager@example.com"],
  "bcc": ["admin@example.com"],
  "subject": "YYC3平台使用通知",
  "template": "welcome",
  "data": {
    "name": "张三",
    "app_name": "YYC3",
    "login_url": "https://app.0379.email/login"
  },
  "type": "html",
  "priority": "normal",
  "track_opens": true,
  "track_clicks": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123def456",
    "status": "queued",
    "recipients": {
      "to": 2,
      "cc": 1,
      "bcc": 1,
      "total": 4
    },
    "scheduled_at": "2025-12-08T06:00:00.000Z",
    "estimated_delivery": "2025-12-08T06:00:30.000Z"
  }
}
```

### 发送自定义内容邮件

```http
POST /api/mail/send-custom
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "to": ["user@example.com"],
  "subject": "自定义邮件内容",
  "html_content": "<h1>欢迎使用YYC3</h1><p>这是一个<strong>自定义</strong>邮件。</p>",
  "text_content": "欢迎使用YYC3\n\n这是一个自定义邮件。",
  "attachments": [
    {
      "name": "user-guide.pdf",
      "url": "https://cdn.0379.email/docs/user-guide.pdf",
      "type": "application/pdf"
    }
  ],
  "reply_to": "support@0379.email"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "message_id": "msg_custom789",
    "status": "sent",
    "recipients": 1,
    "attachments": 1,
    "sent_at": "2025-12-08T06:00:00.000Z"
  }
}
```

### 获取邮件状态

```http
GET /api/mail/{message_id}/status
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123def456",
    "status": "delivered",
    "recipients": [
      {
        "email": "recipient@example.com",
        "status": "delivered",
        "delivered_at": "2025-12-08T06:00:45.000Z",
        "opened": true,
        "opened_at": "2025-12-08T06:15:30.000Z",
        "clicks": 2
      }
    ],
    "events": [
      {
        "event": "queued",
        "timestamp": "2025-12-08T06:00:00.000Z"
      },
      {
        "event": "sent",
        "timestamp": "2025-12-08T06:00:05.000Z"
      },
      {
        "event": "delivered",
        "timestamp": "2025-12-08T06:00:45.000Z"
      },
      {
        "event": "opened",
        "timestamp": "2025-12-08T06:15:30.000Z"
      }
    ]
  }
}
```

### 获取邮件模板列表

```http
GET /api/mail/templates?page=1&limit=20&category=all
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "welcome",
        "name": "欢迎邮件",
        "category": "user",
        "description": "新用户注册欢迎邮件",
        "variables": ["name", "app_name", "login_url"],
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-12-01T10:00:00.000Z"
      },
      {
        "id": "password_reset",
        "name": "密码重置",
        "category": "security",
        "description": "用户密码重置邮件",
        "variables": ["name", "reset_url", "expiry_time"],
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-11-15T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

## 📊 系统状态接口

### 系统健康检查

```http
GET /health
```

**响应**:

```json
{
  "status": "ok",
  "service": "yyc3-api-service",
  "port": 6600,
  "timestamp": "2025-12-08T06:00:00.000Z",
  "uptime": 86400,
  "version": "3.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time": 12,
      "connection_pool": {
        "active": 5,
        "idle": 15,
        "total": 20
      }
    },
    "redis": {
      "status": "healthy",
      "response_time": 3,
      "memory_usage": "45%"
    },
    "ai_service": {
      "status": "healthy",
      "models_available": ["gpt-3.5-turbo", "gpt-4", "claude-2"],
      "queue_length": 0
    },
    "mail_service": {
      "status": "healthy",
      "smtp_connected": true,
      "queue_length": 5
    }
  }
}
```

### 系统指标

```http
GET /api/status/metrics
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-08T06:00:00.000Z",
    "uptime": 86400,
    "requests": {
      "total_24h": 15420,
      "total_1h": 642,
      "avg_response_time_1h": 145,
      "error_rate_1h": 0.012
    },
    "users": {
      "total": 1250,
      "active_24h": 342,
      "new_today": 18
    },
    "ai_usage": {
      "total_requests_24h": 2156,
      "total_tokens_24h": 154200,
      "avg_response_time": 1230,
      "cost_24h": 2.34
    },
    "mail_usage": {
      "sent_24h": 856,
      "delivered_24h": 842,
      "opened_24h": 623,
      "click_rate": 0.145
    },
    "system": {
      "cpu_usage": 45.6,
      "memory_usage": 67.8,
      "disk_usage": 34.2,
      "network_io": {
        "bytes_in": 1024000,
        "bytes_out": 2048000
      }
    }
  }
}
```

### 服务依赖状态

```http
GET /api/status/dependencies
Authorization: Bearer {token}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-08T06:00:00.000Z",
    "dependencies": [
      {
        "name": "MySQL Database",
        "type": "database",
        "status": "healthy",
        "response_time": 12,
        "url": "mysql.internal:3306",
        "version": "8.0.32",
        "last_check": "2025-12-08T05:59:58.000Z"
      },
      {
        "name": "Redis Cache",
        "type": "cache",
        "status": "healthy",
        "response_time": 3,
        "url": "redis.internal:6379",
        "version": "7.0.8",
        "last_check": "2025-12-08T05:59:59.000Z"
      },
      {
        "name": "OpenAI API",
        "type": "external_api",
        "status": "healthy",
        "response_time": 450,
        "url": "https://api.openai.com",
        "rate_limit": {
          "remaining": 4950,
          "reset_time": "2025-12-08T06:01:00.000Z"
        },
        "last_check": "2025-12-08T05:59:57.000Z"
      },
      {
        "name": "SMTP Server",
        "type": "mail_server",
        "status": "healthy",
        "response_time": 156,
        "url": "smtp.0379.email:587",
        "last_check": "2025-12-08T05:59:56.000Z"
      }
    ]
  }
}
```

## 🔍 错误处理

### 标准错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {
      "field": "具体错误字段",
      "value": "错误值"
    },
    "request_id": "req_123456789",
    "timestamp": "2025-12-08T06:00:00.000Z"
  }
}
```

### 常见错误代码

| 错误代码 | HTTP状态码 | 描述 | 解决方案 |
|----------|------------|------|----------|
| `INVALID_REQUEST` | 400 | 请求格式错误 | 检查请求体格式 |
| `UNAUTHORIZED` | 401 | 未授权访问 | 提供有效的JWT token |
| `FORBIDDEN` | 403 | 权限不足 | 联系管理员分配权限 |
| `NOT_FOUND` | 404 | 资源不存在 | 检查资源ID是否正确 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 | 降低请求频率 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 稍后重试或联系技术支持 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 | 稍后重试 |
| `VALIDATION_ERROR` | 422 | 数据验证失败 | 检查输入数据格式 |

### 认证相关错误

| 错误代码 | 描述 |
|----------|------|
| `INVALID_CREDENTIALS` | 邮箱或密码错误 |
| `TOKEN_EXPIRED` | JWT token已过期 |
| `TOKEN_INVALID` | JWT token无效 |
| `USER_NOT_FOUND` | 用户不存在 |
| `USER_INACTIVE` | 用户账户已禁用 |
| `EMAIL_NOT_VERIFIED` | 邮箱未验证 |

### 业务逻辑错误

| 错误代码 | 描述 |
|----------|------|
| `EMAIL_ALREADY_EXISTS` | 邮箱已存在 |
| `WEAK_PASSWORD` | 密码强度不足 |
| `INSUFFICIENT_BALANCE` | 余额不足 |
| `QUOTA_EXCEEDED` | 配额已用完 |
| `MODEL_NOT_AVAILABLE` | AI模型不可用 |
| `CONTENT_POLICY_VIOLATION` | 内容违反政策 |

## 📝 代码示例

### JavaScript/Node.js

```javascript
// 用户认证示例
const axios = require('axios');

class YYC3API {
  constructor(baseURL = 'https://api.0379.email') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email,
        password
      });

      this.token = response.data.data.token;
      return response.data;
    } catch (error) {
      throw new Error(`登录失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getUsers(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/api/users`, {
        params: { page, limit },
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`获取用户列表失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async sendAIChat(message, conversationId = null) {
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/chat`, {
        message,
        conversation_id: conversationId,
        model: 'gpt-3.5-turbo'
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`AI对话失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// 使用示例
const api = new YYC3API();

async function example() {
  // 登录
  const loginResult = await api.login('user@example.com', 'password');
  console.log('登录成功:', loginResult.data.user.username);

  // 获取用户列表
  const users = await api.getUsers(1, 10);
  console.log('用户列表:', users.data.users);

  // AI对话
  const chatResult = await api.sendAIChat('你好，请介绍一下YYC3平台');
  console.log('AI回复:', chatResult.data.response);
}

example().catch(console.error);
```

### Python

```python
import requests
import json

class YYC3API:
    def __init__(self, base_url='https://api.0379.email'):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()

    def login(self, email, password):
        try:
            response = self.session.post(
                f'{self.base_url}/api/auth/login',
                json={
                    'email': email,
                    'password': password
                }
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data['data']['token']
                return data
            else:
                raise Exception(f'登录失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'登录请求失败: {str(e)}')

    def get_users(self, page=1, limit=20):
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            params = {'page': page, 'limit': limit}

            response = self.session.get(
                f'{self.base_url}/api/users',
                headers=headers,
                params=params
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'获取用户列表失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'获取用户列表请求失败: {str(e)}')

    def send_ai_chat(self, message, conversation_id=None):
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            data = {
                'message': message,
                'model': 'gpt-3.5-turbo'
            }

            if conversation_id:
                data['conversation_id'] = conversation_id

            response = self.session.post(
                f'{self.base_url}/api/ai/chat',
                headers=headers,
                json=data
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'AI对话失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'AI对话请求失败: {str(e)}')

# 使用示例
def example():
    api = YYC3API()

    # 登录
    login_result = api.login('user@example.com', 'password')
    print(f'登录成功: {login_result["data"]["user"]["username"]}')

    # 获取用户列表
    users = api.get_users(1, 10)
    print(f'用户列表: {len(users["data"]["users"]} 个用户')

    # AI对话
    chat_result = api.send_ai_chat('你好，请介绍一下YYC3平台')
    print(f'AI回复: {chat_result["data"]["response"]}')

if __name__ == '__main__':
    example()
```

### cURL

```bash
# 用户登录
curl -X POST https://api.0379.email/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# 获取用户列表
curl -X GET "https://api.0379.email/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# AI对话
curl -X POST https://api.0379.email/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "你好，请介绍一下YYC3平台",
    "model": "gpt-3.5-turbo"
  }'

# 发送邮件
curl -X POST https://api.0379.email/api/mail/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "测试邮件",
    "template": "welcome",
    "data": {
      "name": "张三",
      "app_name": "YYC3"
    }
  }'
```

## 🔄 版本变更

### v3.0.0 (2025-12-08)

**新增功能**:

- ✨ 新增AI对话流式响应
- ✨ 新增文本分析API
- ✨ 新增邮件模板管理
- ✨ 新增系统依赖状态监控

**改进优化**:

- 🔧 优化API响应时间，平均减少15%
- 🔧 增强错误处理和日志记录
- 🔧 改进JWT token刷新机制
- 🔧 扩展用户管理功能

**安全问题**:

- 🔒 加强API限流保护
- 🔒 增加请求签名验证
- 🔒 改进敏感数据加密

**兼容性**:

- ✅ 向后兼容v2.x API
- ⚠️ 部分字段格式变更
- ❌ 移除废弃的v1.x接口

### v2.9.0 (2025-11-15)

**新增功能**:

- ✨ 新增批量邮件发送
- ✨ 新增用户角色管理
- ✨ 新增API使用统计

**改进优化**:

- 🔧 优化AI模型响应速度
- 🔧 增加缓存机制
- 🔧 改进数据库查询性能

---

## 📞 技术支持

- **API文档**: <https://api.0379.email/docs>
- **Swagger UI**: <https://api.0379.email/swagger>
- **技术支持**: <dev@0379.email>
- **问题反馈**: <https://github.com/YYC-Cube/yyc3-app/issues>

---

## 📄 文档标尾 (Footer)

「YYC³ 技术文档标准化系列」

*斜体英文标语*
