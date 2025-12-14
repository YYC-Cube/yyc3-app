# 🚀 🚀 YYC³邮件平台 - API架构设计文档

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 技术文档
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YYC-Cube/yyc3-app.git

## 📋 架构概述

**设计原则**: RESTful API + GraphQL  
**技术栈**: Express.js + TypeScript + OpenAPI 3.0  
**认证授权**: JWT + RBAC  
**性能策略**: HTTP/2 + 缓存 + 限流

### 🎯 核心架构理念

1. **RESTful设计**: 遵循REST约束，面向资源
2. **版本控制**: URL版本控制和Header版本控制
3. **状态码标准**: 统一的状态码体系
4. **错误处理**: 结构化错误响应
5. **文档驱动**: OpenAPI 3.0规范
6. **安全第一**: 多层安全防护

## 🏗️ 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                               │
│  Web App  │  Mobile App  │  Desktop  │  第三方集成           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  负载均衡   │  │    限流     │  │   认证     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     业务服务层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  邮件服务   │  │  AI分析服务  │  │ 统计分析服务│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  用户服务   │  │ 通知服务    │  │  系统服务   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     数据访问层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │    Redis    │  │  文件存储   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 API版本控制策略

### 版本控制方案

#### 1. URL版本控制 (推荐)
```
GET /api/v1/users/123/emails
GET /api/v2/users/123/emails
```

#### 2. Header版本控制
```
GET /api/users/123/emails
API-Version: v1

GET /api/users/123/emails
API-Version: v2
```

### 版本生命周期管理
```yaml
version_management:
  current_stable: "v1"
  supported_versions: ["v1", "v1.1"]
  deprecated_versions: []
  sunset_versions: []
  
  migration_policy:
    grace_period_days: 180
    deprecation_notice_days: 90
    sunset_notice_days: 30
```

## 📡 核心API设计

### 1. 用户管理API

#### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "user@example.com",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "status": "active",
      "emailVerified": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  },
  "message": "用户注册成功",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

#### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "rememberMe": false,
  "deviceInfo": {
    "deviceId": "device_123",
    "platform": "web",
    "browser": "Chrome 120"
  }
}
```

#### 用户信息管理
```http
# 获取用户信息
GET /api/v1/users/profile
Authorization: Bearer {access_token}

# 更新用户信息
PUT /api/v1/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "timezone": "Asia/Shanghai"
}

# 更新密码
PUT /api/v1/users/password
Authorization: Bearer {access_token}

{
  "currentPassword": "old_password",
  "newPassword": "new_secure_password"
}
```

### 2. 邮件管理API

#### 发送邮件
```http
POST /api/v1/emails/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "邮件主题",
  "body": "邮件正文",
  "bodyHtml": "<p>HTML邮件内容</p>",
  "isHtml": true,
  "priority": "normal",
  "category": "general",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ],
  "scheduleAt": "2024-01-15T14:00:00Z",
  "tracking": {
    "openTracking": true,
    "clickTracking": true
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456789",
    "status": "queued",
    "sentAt": null,
    "estimatedDeliveryTime": "2024-01-15T14:02:00Z",
    "recipients": {
      "to": ["recipient@example.com"],
      "sent": ["recipient@example.com"],
      "failed": []
    }
  },
  "message": "邮件已加入发送队列",
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

#### 获取邮件列表
```http
GET /api/v1/emails?page=1&limit=20&status=sent&category=general&sort=createdAt:desc
Authorization: Bearer {access_token}
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `status`: 邮件状态筛选
- `category`: 邮件分类筛选
- `senderId`: 发送者筛选
- `startDate`: 开始日期筛选
- `endDate`: 结束日期筛选
- `sort`: 排序字段 (格式: field:asc|desc)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "uuid",
        "subject": "邮件主题",
        "senderEmail": "sender@example.com",
        "recipients": {
          "to": ["recipient@example.com"],
          "cc": [],
          "bcc": []
        },
        "status": "sent",
        "category": "general",
        "priority": "normal",
        "sentAt": "2024-01-15T14:00:00Z",
        "deliveredAt": "2024-01-15T14:01:00Z",
        "readAt": "2024-01-15T14:05:00Z",
        "hasAttachments": true,
        "attachmentCount": 2,
        "createdAt": "2024-01-15T14:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "status": "sent",
      "category": "general"
    }
  },
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

#### 邮件详情
```http
GET /api/v1/emails/{emailId}
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messageId": "msg_123456789",
    "subject": "邮件主题",
    "senderEmail": "sender@example.com",
    "senderId": "user_uuid",
    "recipients": {
      "to": ["recipient@example.com"],
      "cc": ["cc@example.com"],
      "bcc": []
    },
    "body": "邮件正文",
    "bodyHtml": "<p>HTML邮件内容</p>",
    "isHtml": true,
    "status": "read",
    "category": "general",
    "priority": "normal",
    "sentAt": "2024-01-15T14:00:00Z",
    "deliveredAt": "2024-01-15T14:01:00Z",
    "readAt": "2024-01-15T14:05:00Z",
    "attachments": [
      {
        "id": "attachment_uuid",
        "filename": "document.pdf",
        "originalName": "document.pdf",
        "mimeType": "application/pdf",
        "fileSize": 1024000,
        "downloadUrl": "/api/v1/emails/123/attachments/456/download",
        "createdAt": "2024-01-15T14:00:00Z"
      }
    ],
    "headers": [
      {
        "name": "X-Mailgun-Sending-Ip",
        "value": "1.2.3.4"
      }
    ],
    "analysis": {
      "classification": "important",
      "confidenceScore": 0.95,
      "sentiment": "neutral",
      "spamProbability": 0.02
    },
    "tracking": {
      "opens": 1,
      "uniqueOpens": 1,
      "clicks": 2,
      "uniqueClicks": 1
    }
  },
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

### 3. AI智能分析API

#### 邮件智能分析
```http
POST /api/v1/ai/analyze-email
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "emailId": "uuid",
  "analyzeTypes": ["classification", "sentiment", "spamDetection", "keyInformation"],
  "options": {
    "language": "zh-CN",
    "includeReplySuggestions": true,
    "includeSummary": true
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "emailId": "uuid",
    "analysis": {
      "classification": {
        "type": "important",
        "confidence": 0.95,
        "reasoning": "包含紧急关键词和明确行动要求"
      },
      "sentiment": {
        "type": "positive",
        "score": 0.7,
        "confidence": 0.88
      },
      "spamDetection": {
        "isSpam": false,
        "probability": 0.02,
        "factors": {
          "suspiciousLinks": 0,
          "spamWords": 0,
          "senderReputation": "high"
        }
      },
      "keyInformation": {
        "dates": ["2024-01-20", "2024-01-25"],
        "people": ["张三", "李四"],
        "locations": ["北京", "上海"],
        "actions": ["会议", "报告"],
        "amounts": ["50000元"]
      },
      "summary": {
        "brief": "关于下季度业务规划的邮件",
        "keywords": ["业务规划", "会议", "报告"],
        "importance": "high",
        "urgency": "medium"
      },
      "replySuggestions": [
        {
          "text": "好的，我会准时参加下周的会议",
          "tone": "formal",
          "confidence": 0.85
        },
        {
          "text": "感谢您的邮件，我会尽快安排相关工作",
          "tone": "casual",
          "confidence": 0.75
        }
      ]
    },
    "processingTime": 1250,
    "modelVersion": "gpt-4-turbo-v2",
    "createdAt": "2024-01-15T14:00:00Z"
  },
  "message": "邮件分析完成",
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

#### 批量分析
```http
POST /api/v1/ai/batch-analyze
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "emailIds": ["uuid1", "uuid2", "uuid3"],
  "analyzeTypes": ["classification", "sentiment"],
  "priority": "normal",
  "callbackUrl": "https://your-app.com/webhooks/batch-analysis-complete"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "batchId": "batch_123456789",
    "status": "processing",
    "totalEmails": 3,
    "processedEmails": 0,
    "failedEmails": 0,
    "estimatedCompletionTime": "2024-01-15T14:05:00Z",
    "progress": 0,
    "callbackUrl": "https://your-app.com/webhooks/batch-analysis-complete"
  },
  "message": "批量分析任务已提交",
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

### 4. 统计分析API

#### 邮件统计概览
```http
GET /api/v1/analytics/overview?period=30days&userId=uuid
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "period": "30days",
    "summary": {
      "totalSent": 1250,
      "totalDelivered": 1200,
      "totalRead": 950,
      "totalFailed": 50,
      "deliveryRate": 0.96,
      "openRate": 0.79,
      "clickRate": 0.23
    },
    "trends": {
      "sentEmails": [
        {
          "date": "2024-01-15",
          "count": 45,
          "rate": 0.98
        }
      ],
      "deliveryRate": [
        {
          "date": "2024-01-15",
          "rate": 0.96
        }
      ],
      "openRate": [
        {
          "date": "2024-01-15",
          "rate": 0.79
        }
      ]
    },
    "categories": {
      "general": {
        "sent": 500,
        "delivered": 480,
        "read": 380,
        "deliveryRate": 0.96,
        "openRate": 0.79
      },
      "marketing": {
        "sent": 750,
        "delivered": 720,
        "read": 570,
        "deliveryRate": 0.96,
        "openRate": 0.79
      }
    },
    "topRecipients": [
      {
        "email": "user1@example.com",
        "sentCount": 45,
        "openCount": 38,
        "openRate": 0.84
      }
    ]
  },
  "timestamp": "2024-01-15T14:00:00Z",
  "requestId": "req_123456789"
}
```

#### 邮件性能分析
```http
GET /api/v1/analytics/performance?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
Authorization: Bearer {access_token}
```

### 5. 系统管理API

#### 系统状态检查
```http
GET /api/v1/system/health
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T14:00:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 12,
        "connections": {
          "active": 15,
          "idle": 5,
          "max": 100
        }
      },
      "redis": {
        "status": "healthy",
        "responseTime": 3,
        "memory": {
          "used": "45MB",
          "max": "512MB",
          "percentage": 8.8
        }
      },
      "emailService": {
        "status": "healthy",
        "queueSize": 25,
        "averageProcessingTime": 1200
      },
      "aiService": {
        "status": "healthy",
        "averageResponseTime": 1500,
        "modelVersion": "gpt-4-turbo-v2"
      }
    },
    "uptime": 86400,
    "version": "1.0.0"
  }
}
```

## 🔐 认证与授权

### JWT Token结构

#### Access Token (JWT)
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-123"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "user",
    "permissions": [
      "email:read",
      "email:send",
      "email:delete"
    ],
    "iat": 1705315200,
    "exp": 1705318800,
    "iss": "0379.email-platform",
    "aud": "0379.email-client"
  }
}
```

#### Refresh Token
```json
{
  "sub": "user-uuid",
  "tokenFamily": "token-family-uuid",
  "iat": 1705315200,
  "exp": 1707907200,
  "iss": "0379.email-platform",
  "aud": "0379.email-platform"
}
```

### 权限系统

#### RBAC (基于角色的访问控制)
```typescript
// 权限定义
const PERMISSIONS = {
  // 用户管理
  'user:read': '查看用户信息',
  'user:write': '编辑用户信息',
  'user:delete': '删除用户',
  'user:manage': '管理用户账户',
  
  // 邮件操作
  'email:read': '查看邮件',
  'email:send': '发送邮件',
  'email:delete': '删除邮件',
  'email:bulk': '批量操作邮件',
  'email:export': '导出邮件',
  
  // 管理员权限
  'admin:users': '管理用户',
  'admin:system': '系统管理',
  'admin:analytics': '查看系统统计',
  'admin:logs': '查看系统日志',
  
  // AI服务
  'ai:analyze': '使用AI分析',
  'ai:batch': '批量AI分析'
} as const;

// 角色定义
const ROLES = {
  guest: {
    description: '访客',
    permissions: []
  },
  user: {
    description: '普通用户',
    permissions: [
      'user:read',
      'user:write',
      'email:read',
      'email:send',
      'ai:analyze'
    ]
  },
  manager: {
    description: '管理者',
    permissions: [
      'user:read',
      'user:write',
      'email:read',
      'email:send',
      'email:delete',
      'email:bulk',
      'email:export',
      'ai:analyze',
      'ai:batch',
      'admin:analytics'
    ]
  },
  admin: {
    description: '管理员',
    permissions: [
      'user:read',
      'user:write',
      'user:delete',
      'user:manage',
      'email:read',
      'email:send',
      'email:delete',
      'email:bulk',
      'email:export',
      'ai:analyze',
      'ai:batch',
      'admin:users',
      'admin:system',
      'admin:analytics',
      'admin:logs'
    ]
  }
} as const;
```

### 中间件实现

#### 认证中间件
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';

export class AuthMiddleware {
  constructor(private redis: Redis) {}

  /**
   * JWT认证中间件
   */
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: '缺少访问令牌'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 验证JWT
      const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY!) as any;
      
      // 检查用户状态
      const userCacheKey = `user:${decoded.sub}`;
      const userExists = await this.redis.exists(userCacheKey);
      
      if (!userExists) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: '用户账户已被禁用'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 验证令牌黑名单
      const tokenBlacklistKey = `blacklist:${token}`;
      const isBlacklisted = await this.redis.exists(tokenBlacklistKey);
      
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_REVOKED',
            message: '令牌已被撤销'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 绑定用户信息到请求
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '无效的访问令牌'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      next(error);
    }
  };

  /**
   * 权限检查中间件
   */
  authorize = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: '用户未认证'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const userPermissions = user.permissions || [];
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足',
            details: {
              required: requiredPermissions,
              userPermissions
            }
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    };
  };

  /**
   * 角色检查中间件
   */
  requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: '用户未认证'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: '角色权限不足',
            details: {
              required: allowedRoles,
              userRole: user.role
            }
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    };
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return req.cookies?.access_token || null;
  }
}
```

## 🚦 速率限制与防护

### 速率限制策略

#### 基于用户的限流
```typescript
// config/rateLimiting.ts
export const rateLimitingConfig = {
  // 全局限制
  global: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 1000次请求
    message: '请求过于频繁，请稍后重试'
  },
  
  // 认证相关接口
  auth: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 10次登录尝试
    skipSuccessfulRequests: true,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  
  // 邮件发送
  emailSend: {
    windowMs: 60 * 1000, // 1分钟
    max: 100, // 100封邮件/分钟
    message: '邮件发送频率过高，请降低发送频率'
  },
  
  // AI分析
  aiAnalysis: {
    windowMs: 60 * 1000, // 1分钟
    max: 20, // 20次分析/分钟
    message: 'AI分析频率过高，请稍后重试'
  },
  
  // 批量操作
  bulkOperation: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5, // 5次批量操作/小时
    message: '批量操作频率过高，请稍后重试'
  },
  
  // 文件下载
  fileDownload: {
    windowMs: 60 * 1000, // 1分钟
    max: 50, // 50次下载/分钟
    message: '文件下载频率过高，请稍后重试'
  }
};
```

#### 限流中间件实现
```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

export class RateLimitMiddleware {
  constructor(private redis: Redis) {}

  /**
   * 创建Redis存储的限流中间件
   */
  createLimiter(config: any) {
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => this.redis.call(...args),
      }),
      windowMs: config.windowMs,
      max: config.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        timestamp: new Date().toISOString()
      },
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      keyGenerator: (req) => {
        // 基于用户ID限流，未登录用户基于IP
        return req.user?.sub || req.ip;
      }
    });
  }

  /**
   * 分布式限流 - 滑动窗口
   */
  slidingWindowLimit = (windowSize: number, maxRequests: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = `rate_limit:${req.user?.sub || req.ip}`;
      const now = Date.now();
      const windowStart = now - windowSize;

      try {
        // 使用Redis的有序集合实现滑动窗口
        const pipeline = this.redis.pipeline();
        
        // 清理窗口外的记录
        pipeline.zremrangebyscore(key, 0, windowStart);
        
        // 获取当前窗口内的请求数
        pipeline.zcard(key);
        
        // 如果还没超过限制，添加当前请求
        pipeline.zadd(key, now, now);
        
        // 设置过期时间
        pipeline.expire(key, Math.ceil(windowSize / 1000));
        
        const results = await pipeline.exec();
        const currentRequests = results[1][1] as number;

        if (currentRequests >= maxRequests) {
          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: '请求频率过高，请稍后重试',
              retryAfter: Math.ceil(windowSize / 1000)
            },
            timestamp: new Date().toISOString()
          });
          return;
        }

        next();
      } catch (error) {
        // Redis错误时降级到本地限制
        next();
      }
    };
  };
}
```

## 🔍 API文档规范

### OpenAPI 3.0 规范示例

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: YYC³邮件平台API
  description: |
    专业的邮件发送与管理平台API
    
    ## 功能特性
    - 🚀 高性能邮件发送
    - 🤖 AI智能分析
    - 📊 实时统计分析
    - 🔒 企业级安全
    
    ## 认证方式
    使用JWT Bearer Token进行认证：
    ```
    Authorization: Bearer {access_token}
    ```
    
    ## 错误处理
    所有API都返回统一格式的错误响应：
    ```json
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "错误描述",
        "details": {}
      },
      "timestamp": "2024-01-15T14:00:00Z",
      "requestId": "req_123456789"
    }
    ```
    
  version: "1.0.0"
  contact:
    name: API支持团队
    email: api-support@0379.email
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.0379.email/v1
    description: 生产环境
  - url: https://staging-api.0379.email/v1
    description: 测试环境
  - url: http://localhost:3000/v1
    description: 开发环境

security:
  - bearerAuth: []

paths:
  /auth/register:
    post:
      tags:
        - 认证
      summary: 用户注册
      description: 创建新的用户账户
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
            examples:
              basic:
                summary: 基础注册
                value:
                  username: "user@example.com"
                  email: "user@example.com"
                  password: "secure_password"
                  firstName: "John"
                  lastName: "Doe"
      responses:
        '201':
          description: 注册成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegisterResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/ValidationError'

  /emails/send:
    post:
      tags:
        - 邮件管理
      summary: 发送邮件
      description: |
        发送新的邮件
        
        ### 限制条件
        - 单次最多100个收件人
        - 附件总大小不超过25MB
        - 发送频率限制：100封/分钟
        
        ### 支持的功能
        - 定时发送
        - 附件支持
        - 打开跟踪
        - 点击跟踪
        - 分类标记
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendEmailRequest'
            examples:
              basic:
                summary: 基础邮件发送
                value:
                  to: ["recipient@example.com"]
                  subject: "测试邮件"
                  body: "这是一封测试邮件"
                  isHtml: false
              withAttachments:
                summary: 带附件的邮件
                value:
                  to: ["recipient@example.com"]
                  subject: "带附件的邮件"
                  bodyHtml: "<h1>HTML邮件</h1><p>包含附件</p>"
                  isHtml: true
                  attachments:
                    - filename: "document.pdf"
                      content: "base64_content"
                      mimeType: "application/pdf"
              scheduled:
                summary: 定时发送邮件
                value:
                  to: ["recipient@example.com"]
                  subject: "定时邮件"
                  body: "定时发送的邮件"
                  scheduleAt: "2024-01-15T16:00:00Z"
      responses:
        '200':
          description: 邮件发送成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SendEmailResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '413':
          description: 请求体过大
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                success: false
                error:
                  code: 'PAYLOAD_TOO_LARGE'
                  message: '请求数据超过限制'
                timestamp: '2024-01-15T14:00:00Z'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT访问令牌

  schemas:
    RegisterRequest:
      type: object
      required:
        - username
        - email
        - password
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 50
          pattern: '^[a-zA-Z0-9_-]+$'
          description: 用户名，只能包含字母、数字、下划线和连字符
          example: "john_doe"
        email:
          type: string
          format: email
          description: 邮箱地址
          example: "john@example.com"
        password:
          type: string
          minLength: 8
          maxLength: 128
          description: 密码，至少8位字符
          example: "secure_password_123"
        firstName:
          type: string
          maxLength: 100
          description: 名字
          example: "John"
        lastName:
          type: string
          maxLength: 100
          description: 姓氏
          example: "Doe"

    RegisterResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            user:
              $ref: '#/components/schemas/User'
            tokens:
              $ref: '#/components/schemas/TokenPair'
        message:
          type: string
          example: "用户注册成功"
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        username:
          type: string
          example: "john_doe"
        email:
          type: string
          format: email
          example: "john@example.com"
        firstName:
          type: string
          example: "John"
        lastName:
          type: string
          example: "Doe"
        role:
          type: string
          enum: [admin, manager, user, guest]
          example: "user"
        status:
          type: string
          enum: [active, inactive, suspended, pending]
          example: "active"
        emailVerified:
          type: boolean
          example: false
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    TokenPair:
      type: object
      properties:
        accessToken:
          type: string
          description: JWT访问令牌
        refreshToken:
          type: string
          description: JWT刷新令牌
        expiresIn:
          type: integer
          description: 访问令牌有效期（秒）
          example: 3600
        tokenType:
          type: string
          example: "Bearer"

    SendEmailRequest:
      type: object
      required:
        - to
        - subject
        - body
      properties:
        to:
          type: array
          items:
            type: string
            format: email
          minItems: 1
          maxItems: 100
          description: 主要收件人列表
          example: ["recipient1@example.com", "recipient2@example.com"]
        cc:
          type: array
          items:
            type: string
            format: email
          maxItems: 50
          description: 抄送收件人列表
          example: ["cc@example.com"]
        bcc:
          type: array
          items:
            type: string
            format: email
          maxItems: 50
          description: 密送收件人列表
        subject:
          type: string
          maxLength: 500
          description: 邮件主题
          example: "重要通知"
        body:
          type: string
          minLength: 1
          description: 邮件正文（纯文本）
          example: "这是一封重要通知邮件"
        bodyHtml:
          type: string
          description: 邮件正文（HTML格式）
          example: "<h1>重要通知</h1><p>这是一封HTML格式的邮件</p>"
        isHtml:
          type: boolean
          default: false
          description: 是否为HTML格式邮件
        priority:
          type: string
          enum: [low, normal, high, urgent]
          default: normal
          description: 邮件优先级
        category:
          type: string
          enum: [general, notification, marketing, transactional, system]
          default: general
          description: 邮件分类
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/Attachment'
          maxItems: 10
          description: 邮件附件列表
        scheduleAt:
          type: string
          format: date-time
          description: 定时发送时间（UTC时间）
        tracking:
          $ref: '#/components/schemas/EmailTracking'

    Attachment:
      type: object
      required:
        - filename
        - content
        - mimeType
      properties:
        filename:
          type: string
          maxLength: 255
          description: 文件名
          example: "document.pdf"
        content:
          type: string
          description: 文件内容（Base64编码）
          example: "JVBERi0xLjQKJcfs..."
        mimeType:
          type: string
          description: MIME类型
          example: "application/pdf"
        size:
          type: integer
          description: 文件大小（字节）
          example: 1024000

    EmailTracking:
      type: object
      properties:
        openTracking:
          type: boolean
          default: true
          description: 是否跟踪邮件打开
        clickTracking:
          type: boolean
          default: true
          description: 是否跟踪链接点击
        unsubscribeLink:
          type: boolean
          default: true
          description: 是否包含退订链接

  responses:
    BadRequest:
      description: 请求参数错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: 'BAD_REQUEST'
              message: '请求参数错误'
              details:
                field: 'email'
                message: '邮箱格式不正确'
            timestamp: '2024-01-15T14:00:00Z'

    Unauthorized:
      description: 未认证或认证失败
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: 'UNAUTHORIZED'
              message: '认证失败或令牌已过期'
            timestamp: '2024-01-15T14:00:00Z'

    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: 'NOT_FOUND'
              message: '请求的资源不存在'
            timestamp: '2024-01-15T14:00:00Z'

    RateLimitExceeded:
      description: 请求频率超限
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: 'RATE_LIMIT_EXCEEDED'
              message: '请求过于频繁，请稍后重试'
              retryAfter: 60
            timestamp: '2024-01-15T14:00:00Z'

    ValidationError:
      description: 数据验证失败
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: 'VALIDATION_ERROR'
              message: '数据验证失败'
              details:
                field: 'password'
                message: '密码长度至少8位'
            timestamp: '2024-01-15T14:00:00Z'
```

## 📈 性能优化策略

### 1. 缓存策略

#### 多层缓存架构
```typescript
// 缓存策略配置
interface CacheStrategy {
  // L1: 应用内存缓存
  l1: {
    maxSize: number; // 最大缓存条目数
    ttl: number; // 默认过期时间
    strategy: 'LRU' | 'LFU';
  };
  
  // L2: Redis缓存
  l2: {
    host: string;
    port: number;
    ttl: number;
    cluster: boolean;
  };
  
  // L3: CDN缓存
  l3: {
    enabled: boolean;
    cdnProvider: 'cloudflare' | 'aws_cloudfront';
  };
}

// 缓存配置
export const CACHE_CONFIG: CacheStrategy = {
  l1: {
    maxSize: 1000,
    ttl: 300, // 5分钟
    strategy: 'LRU'
  },
  l2: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ttl: 1800, // 30分钟
    cluster: true
  },
  l3: {
    enabled: true,
    cdnProvider: 'cloudflare'
  }
};

// 缓存服务实现
export class CacheService {
  constructor(
    private memoryCache: NodeCache,
    private redis: Redis,
    private cdnService: CDNService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // L1 缓存检查
    const l1Value = this.memoryCache.get<T>(key);
    if (l1Value) {
      this.logCacheHit('L1', key);
      return l1Value;
    }

    // L2 缓存检查
    const l2Value = await this.redis.get(key);
    if (l2Value) {
      const parsed = JSON.parse(l2Value);
      // 回填L1缓存
      this.memoryCache.set(key, parsed, 300);
      this.logCacheHit('L2', key);
      return parsed;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const finalTtl = ttl || CACHE_CONFIG.l2.ttl;
    
    // 设置L1缓存
    this.memoryCache.set(key, value, 300);
    
    // 设置L2缓存
    await this.redis.setex(key, finalTtl, JSON.stringify(value));
    
    this.logCacheSet(key, finalTtl);
  }

  async invalidate(pattern: string): Promise<void> {
    // 删除L1缓存
    const l1Keys = this.memoryCache.keys();
    const keysToDelete = l1Keys.filter(key => key.includes(pattern));
    keysToDelete.forEach(key => this.memoryCache.del(key));
    
    // 删除L2缓存
    const l2Keys = await this.redis.keys(`*${pattern}*`);
    if (l2Keys.length > 0) {
      await this.redis.del(...l2Keys);
    }
    
    this.logCacheInvalidate(pattern, l1Keys.length + l2Keys.length);
  }
}
```

### 2. 数据库查询优化

#### 查询优化策略
```sql
-- 1. 优化邮件列表查询
-- 使用索引覆盖查询
CREATE INDEX CONCURRENTLY idx_emails_list_covering 
ON emails(sender_id, status, created_at DESC, id, subject, recipient_count)
INCLUDE (category, priority, has_attachments);

-- 2. 优化统计分析查询
-- 使用物化视图预计算
CREATE MATERIALIZED VIEW email_stats_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    sender_id,
    category,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'read') as read_count,
    AVG(CASE WHEN status = 'delivered' AND delivered_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) END) as avg_delivery_time
FROM emails 
GROUP BY DATE_TRUNC('day', created_at), sender_id, category;

-- 3. 分区优化
-- 按月份分区
CREATE TABLE emails_2024_01 PARTITION OF emails 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 4. 全文搜索索引
CREATE INDEX idx_emails_content_search 
ON emails USING gin(to_tsvector('english', subject || ' ' || COALESCE(body, '')));

-- 5. 复合查询优化
-- 使用子查询避免重复计算
CREATE OR REPLACE FUNCTION get_email_stats(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
    total_sent BIGINT,
    delivery_rate NUMERIC,
    open_rate NUMERIC,
    category_breakdown JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            DATE(created_at) as stat_date,
            COUNT(*) as sent_count,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
            COUNT(*) FILTER (WHERE status = 'read') as read_count
        FROM emails 
        WHERE sender_id = user_uuid 
          AND created_at::DATE BETWEEN start_date AND end_date
        GROUP BY DATE(created_at)
    ),
    category_stats AS (
        SELECT 
            category,
            COUNT(*) as count
        FROM emails 
        WHERE sender_id = user_uuid 
          AND created_at::DATE BETWEEN start_date AND end_date
        GROUP BY category
    )
    SELECT 
        COALESCE(SUM(ds.sent_count), 0) as total_sent,
        CASE 
            WHEN SUM(ds.sent_count) > 0 
            THEN ROUND((SUM(ds.delivered_count)::NUMERIC / SUM(ds.sent_count)) * 100, 2)
            ELSE 0 
        END as delivery_rate,
        CASE 
            WHEN SUM(ds.delivered_count) > 0 
            THEN ROUND((SUM(ds.read_count)::NUMERIC / SUM(ds.delivered_count)) * 100, 2)
            ELSE 0 
        END as open_rate,
        COALESCE(
            json_object_agg(cs.category, cs.count),
            '{}'::json
        ) as category_breakdown
    FROM daily_stats ds
    CROSS JOIN category_stats cs;
END;
$$ LANGUAGE plpgsql;
```

### 3. API性能优化

#### 响应压缩
```typescript
// 中间件配置
import compression from 'compression';
import helmet from 'helmet';

const PERFORMANCE_CONFIG = {
  compression: {
    level: 6, // 压缩级别
    threshold: 1024, // 压缩阈值（1KB）
    filter: (req: Request, res: Response) => {
      // 只压缩文本内容
      return /json|text|javascript|css/.test(res.getHeader('Content-Type') as string);
    }
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  http2: {
    enabled: true,
    allowHTTP1: true
  }
};
```

#### 连接池配置
```typescript
// 数据库连接池
const dbPoolConfig = {
  // PostgreSQL 连接池
  postgres: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  },
  
  // Redis 连接池
  redis: {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxLoadingTimeout: 3000,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    commandTimeout: 3000
  }
};
```

## 🔍 监控与调试

### API监控指标

#### 关键指标定义
```typescript
interface APIMetrics {
  // 性能指标
  performance: {
    responseTime: number; // 响应时间 (ms)
    throughput: number; // 吞吐量 (requests/second)
    errorRate: number; // 错误率 (%)
    availability: number; // 可用性 (%)
  };
  
  // 业务指标
  business: {
    emailSent: number; // 邮件发送数
    emailDelivered: number; // 邮件投递成功数
    emailRead: number; // 邮件打开数
    aiAnalysisCount: number; // AI分析次数
  };
  
  // 资源指标
  resource: {
    cpuUsage: number; // CPU使用率 (%)
    memoryUsage: number; // 内存使用率 (%)
    dbConnections: number; // 数据库连接数
    redisConnections: number; // Redis连接数
  };
}

// Prometheus指标配置
const METRICS_CONFIG = {
  // 请求指标
  requestDuration: new Histogram({
    name: 'api_request_duration_seconds',
    help: 'API请求响应时间',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  requestTotal: new Counter({
    name: 'api_requests_total',
    help: 'API请求总数',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  // 错误指标
  errorTotal: new Counter({
    name: 'api_errors_total',
    help: 'API错误总数',
    labelNames: ['error_type', 'method', 'route']
  }),
  
  // 业务指标
  emailSent: new Counter({
    name: 'emails_sent_total',
    help: '邮件发送总数',
    labelNames: ['category', 'priority']
  }),
  
  emailDeliveryTime: new Summary({
    name: 'email_delivery_duration_seconds',
    help: '邮件投递时间',
    labelNames: ['category']
  }),
  
  // 系统指标
  dbConnections: new Gauge({
    name: 'db_connections_active',
    help: '数据库活跃连接数',
    labelNames: ['database']
  }),
  
  memoryUsage: new Gauge({
    name: 'memory_usage_bytes',
    help: '内存使用量',
    labelNames: ['type']
  })
};
```

#### 监控中间件
```typescript
// middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

export class MonitoringMiddleware {
  constructor(private metrics: MetricsService) {}

  /**
   * 请求性能监控
   */
  performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    
    // 响应拦截器
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 记录指标
      MonitoringMiddleware.metrics.recordRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );
      
      return originalSend.call(this, data);
    };
    
    next();
  };

  /**
   * 错误监控
   */
  errorMonitor = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // 记录错误指标
    this.metrics.recordError(
      err.name || 'UnknownError',
      req.method,
      req.route?.path || req.path,
      err.message
    );
    
    // 发送告警
    if (this.shouldAlert(err)) {
      this.sendAlert({
        severity: this.getAlertSeverity(err),
        message: err.message,
        context: {
          method: req.method,
          path: req.path,
          userId: req.user?.sub,
          stack: err.stack
        }
      });
    }
    
    next(err);
  };

  private shouldAlert(error: Error): boolean {
    // 仅对严重错误发送告警
    const criticalErrors = [
      'DatabaseConnectionError',
      'ExternalServiceUnavailable',
      'AuthenticationFailure',
      'RateLimitExceeded'
    ];
    
    return criticalErrors.includes(error.name || '');
  }

  private getAlertSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const errorSeverity: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'DatabaseConnectionError': 'critical',
      'ExternalServiceUnavailable': 'high',
      'AuthenticationFailure': 'medium',
      'RateLimitExceeded': 'low'
    };
    
    return errorSeverity[error.name || ''] || 'medium';
  }
}
```

## 🔧 部署配置

### Docker容器化

#### 多阶段构建
```dockerfile
# Dockerfile.api
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装pnpm
RUN npm install -g pnpm

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/index.js"]
```

#### Kubernetes部署
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 0379.email-api
  namespace: yyc3-platform
  labels:
    app: yyc3-mail-api
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: yyc3-mail-api
  template:
    metadata:
      labels:
        app: yyc3-mail-api
        version: v1
    spec:
      containers:
      - name: api
        image: 0379.email-api:v1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: yyc3-mail-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: yyc3-mail-secrets
              key: redis-url
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: app-config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: app-config
        configMap:
          name: yyc3-mail-config
---
apiVersion: v1
kind: Service
metadata:
  name: yyc3-mail-api-service
  namespace: yyc3-platform
spec:
  selector:
    app: yyc3-mail-api
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: yyc3-mail-api-ingress
  namespace: yyc3-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.0379.email
    secretName: yyc3-mail-api-tls
  rules:
  - host: api.0379.email
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: yyc3-mail-api-service
            port:
              number: 80
```

---

## 📋 总结

API架构设计是系统的核心基础设施。通过RESTful设计、完善的认证授权机制、性能优化和监控体系，确保系统能够稳定高效地为用户提供邮件服务。

**设计亮点**:
- ✅ 遵循RESTful设计原则
- ✅ 完善的JWT认证和RBAC权限系统
- ✅ 多层缓存和性能优化策略
- ✅ 全面的监控和告警体系
- ✅ Kubernetes原生部署支持
- ✅ OpenAPI 3.0规范文档

**持续优化**:
- 🔄 性能监控和调优
- 🔄 API版本兼容性管理
- 🔄 错误率监控和分析
- 🔄 容量规划和高可用性

保持代码健康，稳步前行！ 🌹