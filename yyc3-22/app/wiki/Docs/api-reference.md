# API 参考文档

## 概述

本文档提供了邮件系统的API接口规范，包括认证、邮件管理、用户管理等功能接口的详细说明。所有API接口均遵循RESTful设计原则，使用JSON格式进行数据交换。

## 认证方式

### JWT认证

所有API接口（除登录接口外）均需要在请求头中提供有效的JWT令牌：

```http
Authorization: Bearer {your-jwt-token}
```

### 登录接口

```http
POST /api/auth/login
```

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**响应：**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

## 邮件管理API

### 获取邮件列表

```http
GET /api/mail?folder=inbox&page=1&limit=20&sort=desc
```

**查询参数：**

- `folder`: 文件夹名称（inbox, sent, draft, trash）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `sort`: 排序方式（asc, desc，默认desc）
- `search`: 搜索关键词（可选）

**响应：**

```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "emails": [
    {
      "id": "mail123",
      "subject": "会议通知",
      "from": {
        "email": "sender@example.com",
        "name": "张三"
      },
      "to": [
        {
          "email": "user@example.com",
          "name": "John Doe"
        }
      ],
      "cc": [],
      "bcc": [],
      "body": "<p>请参加明天的会议</p>",
      "html": true,
      "attachments": [
        {
          "id": "att001",
          "filename": "会议议程.docx",
          "size": 20480,
          "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
      ],
      "read": false,
      "starred": true,
      "folder": "inbox",
      "created_at": "2023-06-10T10:30:00Z",
      "updated_at": "2023-06-10T10:30:00Z"
    },
    ...
  ]
}
```

### 获取单封邮件

```http
GET /api/mail/{mailId}
```

**响应：**

```json
{
  "id": "mail123",
  "subject": "会议通知",
  "from": {
    "email": "sender@example.com",
    "name": "张三"
  },
  "to": [
    {
      "email": "user@example.com",
      "name": "John Doe"
    }
  ],
  "cc": [],
  "bcc": [],
  "body": "<p>请参加明天的会议</p>",
  "html": true,
  "attachments": [
    {
      "id": "att001",
      "filename": "会议议程.docx",
      "size": 20480,
      "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
  ],
  "read": false,
  "starred": true,
  "folder": "inbox",
  "created_at": "2023-06-10T10:30:00Z",
  "updated_at": "2023-06-10T10:30:00Z"
}
```

### 发送邮件

```http
POST /api/mail/send
```

**请求体：**

```json
{
  "subject": "回复：会议通知",
  "to": [
    {
      "email": "sender@example.com",
      "name": "张三"
    }
  ],
  "cc": [],
  "bcc": [],
  "body": "<p>我会准时参加。</p>",
  "html": true,
  "attachments": [
    {
      "file_id": "uploaded-file-id"
    }
  ],
  "reply_to": "mail123",
  "draft_id": null
}
```

**响应：**

```json
{
  "id": "mail456",
  "status": "sent",
  "message_id": "<1234567890@example.com>",
  "created_at": "2023-06-11T08:15:00Z"
}
```

### 保存草稿

```http
POST /api/mail/draft
```

**请求体：**

```json
{
  "id": "draft789", // 可选，更新现有草稿时提供
  "subject": "会议通知",
  "to": [
    {
      "email": "attendee@example.com",
      "name": "参会者"
    }
  ],
  "cc": [],
  "bcc": [],
  "body": "<p>会议将于明天下午2点举行</p>",
  "html": true,
  "attachments": [
    {
      "file_id": "uploaded-file-id"
    }
  ]
}
```

**响应：**

```json
{
  "id": "draft789",
  "status": "saved",
  "updated_at": "2023-06-10T15:45:00Z"
}
```

### 删除邮件

```http
DELETE /api/mail/{mailId}
```

**响应：**

```json
{
  "status": "success",
  "message": "邮件已删除"
}
```

### 批量操作邮件

```http
POST /api/mail/batch
```

**请求体：**

```json
{
  "ids": ["mail123", "mail456", "mail789"],
  "action": "move", // move, mark_as_read, mark_as_unread, star, unstar, delete
  "target_folder": "archive" // 当action为move时需要
}
```

**响应：**

```json
{
  "status": "success",
  "processed": 3,
  "failed": 0,
  "message": "批量操作完成"
}
```

## 用户管理API

### 获取用户信息

```http
GET /api/users/me
```

**响应：**

```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatars/user123.jpg",
  "role": "user",
  "settings": {
    "theme": "light",
    "notifications": true,
    "signature": "Regards, John"
  },
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-06-10T12:00:00Z"
}
```

### 更新用户信息

```http
PUT /api/users/me
```

**请求体：**

```json
{
  "name": "John Smith",
  "settings": {
    "theme": "dark",
    "notifications": false,
    "signature": "Best regards, John Smith"
  }
}
```

**响应：**

```json
{
  "status": "success",
  "message": "用户信息已更新"
}
```

### 修改密码

```http
POST /api/users/change-password
```

**请求体：**

```json
{
  "current_password": "old-password",
  "new_password": "new-secure-password",
  "confirm_password": "new-secure-password"
}
```

**响应：**

```json
{
  "status": "success",
  "message": "密码已成功修改"
}
```

### 上传头像

```http
POST /api/users/avatar
```

**请求体：**

Form-data:

- `avatar`: 文件（PNG, JPEG, GIF格式，最大5MB）

**响应：**

```json
{
  "status": "success",
  "avatar_url": "https://example.com/avatars/user123_new.jpg"
}
```

## 联系人管理API

### 获取联系人列表

```http
GET /api/contacts?page=1&limit=50&search=john
```

**查询参数：**

- `page`: 页码（默认1）
- `limit`: 每页数量（默认50）
- `search`: 搜索关键词（可选）

**响应：**

```json
{
  "total": 120,
  "page": 1,
  "limit": 50,
  "contacts": [
    {
      "id": "contact123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "13800138000",
      "company": "Example Inc",
      "notes": "重要客户",
      "created_at": "2023-03-10T09:00:00Z",
      "updated_at": "2023-04-15T14:30:00Z"
    },
    ...
  ]
}
```

### 添加联系人

```http
POST /api/contacts
```

**请求体：**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "13900139000",
  "company": "ABC Corp",
  "notes": "新同事"
}
```

**响应：**

```json
{
  "id": "contact456",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "13900139000",
  "company": "ABC Corp",
  "notes": "新同事",
  "created_at": "2023-06-11T10:20:00Z"
}
```

### 更新联系人

```http
PUT /api/contacts/{contactId}
```

**请求体：**

```json
{
  "name": "Jane Johnson",
  "phone": "13700137000",
  "notes": "已更改姓名"
}
```

**响应：**

```json
{
  "status": "success",
  "message": "联系人信息已更新"
}
```

### 删除联系人

```http
DELETE /api/contacts/{contactId}
```

**响应：**

```json
{
  "status": "success",
  "message": "联系人已删除"
}
```

## 文件上传API

### 上传附件

```http
POST /api/upload/attachment
```

**请求体：**

Form-data:

- `file`: 文件（支持多种格式，最大50MB）

**响应：**

```json
{
  "id": "file789",
  "filename": "document.pdf",
  "size": 1024000,
  "content_type": "application/pdf",
  "uploaded_at": "2023-06-11T11:30:00Z"
}
```

## 错误响应格式

所有API错误均返回统一的错误响应格式：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式无效"
      }
    ]
  }
}
```

### 常见错误代码

- `AUTH_REQUIRED`: 需要认证
- `INVALID_TOKEN`: 无效的令牌
- `PERMISSION_DENIED`: 权限不足
- `VALIDATION_ERROR`: 输入验证失败
- `RESOURCE_NOT_FOUND`: 资源不存在
- `SERVER_ERROR`: 服务器内部错误
- `RATE_LIMIT_EXCEEDED`: 请求频率超限

## 速率限制

API实施速率限制以防止滥用：

- 常规用户：每分钟60次请求
- 管理员：每分钟120次请求
- 登录接口：每分钟10次请求（防止暴力破解）

超出限制时，将返回429状态码和以下响应：

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超过限制，请稍后再试",
    "retry_after": 60
  }
}
```

## API版本控制

当前API版本为v1，通过URL路径进行版本控制：

```
/api/v1/...
```

将来的API版本将通过更新URL路径中的版本号来提供。
