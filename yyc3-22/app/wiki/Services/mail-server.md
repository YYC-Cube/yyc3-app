# Mail Server 文档

## 服务概述

Mail Server 是系统的核心邮件处理服务，负责与外部邮件服务器进行通信，处理邮件的发送和接收，支持SMTP、POP3、IMAP等邮件协议，并提供邮件过滤、转发、规则处理等功能。

## 技术栈

- **框架**: Node.js + Nodemailer
- **协议支持**: SMTP, POP3, IMAP
- **数据库**: MongoDB (存储邮件)
- **消息队列**: RabbitMQ (异步处理)
- **缓存**: Redis

## 核心功能

### 邮件发送

- SMTP 服务集成
- 批量邮件发送
- 邮件模板支持
- 附件处理
- 发送状态跟踪
- 失败重试机制

### 邮件接收

- POP3/IMAP 协议支持
- 多账户管理
- 新邮件监控和通知
- 邮件内容解析
- 附件下载和存储

### 邮件处理

- 邮件规则引擎
- 自动过滤（垃圾邮件、病毒）
- 自动分类和归档
- 邮件转发
- 自动回复

### 安全功能

- SPF, DKIM, DMARC 支持
- TLS 加密
- 防垃圾邮件过滤
- 病毒扫描

## 安装和配置

### 环境要求

- Node.js 14.x 或更高版本
- MongoDB 4.x 或更高版本
- RabbitMQ 3.x 或更高版本
- Redis 6.x 或更高版本

### 配置文件

配置文件位于 `config/config.js`：

```javascript
module.exports = {
  port: 3003,
  
  // SMTP 发送配置
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'username',
      pass: 'password'
    },
    pool: true,
    maxConnections: 5,
    rateLimit: 100 // 每分钟最大发送量
  },
  
  // 接收服务配置
  receive: {
    enablePop3: true,
    enableImap: true,
    pop3Port: 110,
    imapPort: 143,
    sslPort: 993
  },
  
  // 存储配置
  storage: {
    mongo: {
      url: 'mongodb://localhost:27017/email-system',
      options: {}
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    attachments: {
      directory: '/path/to/attachments',
      maxSize: '25MB'
    }
  },
  
  // 消息队列
  queue: {
    url: 'amqp://localhost',
    sendQueue: 'mail-send',
    receiveQueue: 'mail-receive'
  },
  
  // 安全配置
  security: {
    spf: true,
    dkim: {
      enable: true,
      keyPath: '/path/to/private-key.pem',
      domainName: 'example.com',
      selector: 'default'
    },
    dmarc: true,
    virusScan: {
      enable: true,
      clamavPath: '/usr/bin/clamdscan'
    }
  }
};
```

## API 接口

### 邮件 发送

#### POST /api/mail/send

发送邮件

**请求体**:

```json
{
  "from": "sender@example.com",
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "邮件主题",
  "text": "纯文本内容",
  "html": "<p>HTML内容</p>",
  "attachments": [
    {
      "filename": "报告.pdf",
      "path": "/path/to/report.pdf"
    }
  ],
  "options": {
    "priority": "high",
    "trackOpens": true,
    "trackClicks": true
  }
}
```

**响应**:

```json
{
  "message_id": "<unique-message-id@example.com>",
  "status": "queued",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 邮件接收管理

#### POST /api/mail/accounts

添加邮件接收账户

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "type": "imap",
  "server": "imap.example.com",
  "port": 993,
  "ssl": true,
  "syncInterval": 300 // 同步间隔（秒）
}
```

#### GET /api/mail/accounts

获取已配置的邮件账户列表

#### DELETE /api/mail/accounts/:id

删除邮件接收账户

### 邮件规则

#### POST /api/mail/rules

创建邮件处理规则

**请求体**:

```json
{
  "name": "工作邮件规则",
  "conditions": [
    {
      "field": "from",
      "operator": "contains",
      "value": "@work.com"
    }
  ],
  "actions": [
    {
      "type": "move",
      "folder": "工作"
    },
    {
      "type": "mark_as_read"
    }
  ],
  "active": true
}
```

## 部署

请参考 [PM2 部署](../Deployment/PM2.md) 或 [Docker 部署](../Deployment/Docker.md) 文档。

## 监控和日志

- 发送队列监控
- 接收服务状态监控
- 邮件处理统计
- 失败邮件跟踪
- 详细的操作日志

## 性能优化

- 使用连接池管理SMTP连接
- 实现邮件发送速率限制
- 优化邮件存储和检索
- 使用消息队列进行异步处理
- 对大型附件进行流式处理
