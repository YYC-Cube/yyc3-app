# 系统配置指南

## 配置概述

0379.email邮件系统使用分层配置管理策略，包括环境变量、配置文件和数据库配置三种方式。本指南详细说明系统各组件的配置选项、默认值和最佳实践。

## 配置层级

系统配置按以下优先级从高到低应用：

1. **环境变量** - 运行时设置，覆盖其他所有配置
2. **本地配置文件** - 项目目录下的`config/local.js`，开发环境使用
3. **默认配置文件** - 项目目录下的`config/default.js`，包含基础默认值

## 全局环境变量

以下环境变量适用于所有服务组件：

| 环境变量 | 描述 | 默认值 | 必须 |
|---------|------|-------|------|
| `NODE_ENV` | 运行环境 | `development` | 否 |
| `LOG_LEVEL` | 日志级别 | `info` | 否 |
| `PORT` | 服务端口 | 各服务默认端口 | 否 |
| `API_PREFIX` | API路径前缀 | `/api` | 否 |
| `JWT_SECRET` | JWT签名密钥 | - | 是 |
| `JWT_EXPIRES_IN` | JWT过期时间 | `24h` | 否 |
| `REDIS_URL` | Redis连接字符串 | `redis://localhost:6379` | 否 |
| `MONGO_URL` | MongoDB连接字符串 | `mongodb://localhost:27017/email_system` | 是 |
| `RABBITMQ_URL` | RabbitMQ连接字符串 | `amqp://localhost` | 否 |

## 各服务配置文件

### 1. API Server 配置

配置文件路径：`api-server/config/default.js`

```javascript
module.exports = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    timeout: 30000
  },
  security: {
    cors: {
      origin: ['*'], // 生产环境应配置具体域名
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 每IP限制
    }
  },
  email: {
    defaultFrom: 'no-reply@0379.email',
    maxRecipients: 1000,
    maxAttachmentSize: 25 * 1024 * 1024 // 25MB
  },
  cache: {
    ttl: 3600 // 缓存过期时间（秒）
  }
};
```

### 2. Admin Server 配置

配置文件路径：`admin-server/config/default.js`

```javascript
module.exports = {
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  api: {
    baseUrl: 'http://localhost:3000/api', // API服务地址
    timeout: 5000
  },
  security: {
    sessionSecret: 'admin-session-secret',
    sessionTimeout: 3600000, // 1小时
    allowedOrigins: ['http://localhost:3001']
  },
  dashboard: {
    refreshInterval: 60000, // 自动刷新间隔（毫秒）
    maxRecordsPerPage: 100
  }
};
```

### 3. Mail Server 配置

配置文件路径：`mail-server/config/default.js`

```javascript
module.exports = {
  server: {
    port: 3003,
    host: '0.0.0.0'
  },
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
    maxMessages: 100
  },
  queue: {
    concurrency: 10,
    retryAttempts: 3,
    retryDelay: 30000 // 重试间隔（毫秒）
  },
  tracking: {
    enabled: true,
    pixelUrl: '/track/open'
  },
  bounce: {
    enabled: true,
    email: 'bounce@0379.email',
    processorInterval: 300000 // 5分钟检查一次
  }
};
```

### 4. LLM Server 配置

配置文件路径：`llm-server/config/default.js`

```javascript
module.exports = {
  server: {
    port: 3002,
    host: '0.0.0.0'
  },
  model: {
    provider: 'openai', // 'openai', 'anthropic', 'local'
    apiKey: 'your-api-key',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  },
  cache: {
    enabled: true,
    ttl: 86400 // 24小时
  },
  rateLimit: {
    requestsPerMinute: 60,
    concurrentRequests: 5
  },
  features: {
    contentGeneration: true,
    spamDetection: true,
    summarization: true,
    languageDetection: true
  }
};
```

## 数据库配置

### MongoDB 连接配置

所有服务共享同一个MongoDB数据库，但使用不同的集合。数据库连接字符串格式：

```
mongodb://username:password@hostname:port/database?options
```

### 数据库集合

- **users** - 用户信息
- **emails** - 邮件存储
- **templates** - 邮件模板
- **contacts** - 联系人信息
- **queues** - 发送队列
- **logs** - 系统日志
- **settings** - 系统设置

## 环境特定配置

### 开发环境

创建`config/local.js`文件覆盖默认配置：

```javascript
module.exports = {
  server: {
    port: 3000
  },
  security: {
    cors: {
      origin: ['*']
    }
  },
  database: {
    url: 'mongodb://localhost:27017/email_dev'
  }
};
```

### 生产环境

使用环境变量配置生产环境：

```bash
NODE_ENV=production
LOG_LEVEL=error
PORT=8080
MONGO_URL=mongodb://user:pass@mongo.example.com:27017/email_prod
REDIS_URL=redis://redis.example.com:6379
JWT_SECRET=your-secure-secret-key
```

## Docker环境变量

使用Docker Compose时，在`.env`文件中设置环境变量：

```dotenv
# .env file
MONGO_URL=mongodb://mongo:27017/email_system
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
```

## 配置管理最佳实践

1. **环境变量优先级**：敏感信息（如API密钥、数据库密码）应通过环境变量设置，而不是硬编码在配置文件中

2. **配置分离**：开发、测试和生产环境使用不同的配置文件

3. **配置验证**：启动时验证必要的配置项是否存在

4. **密钥管理**：使用密钥管理服务（如AWS Secrets Manager、HashiCorp Vault）存储敏感配置

5. **配置文档**：为所有自定义配置项提供文档说明

## 动态配置更新

系统支持在运行时更新部分配置，无需重启服务：

1. **通过API更新**：管理员可以通过管理面板的API更新系统设置

2. **配置热加载**：修改配置文件后，可以使用以下命令触发配置热加载：

```bash
# 热加载配置
curl -X POST http://localhost:3000/api/config/reload
```

## 配置备份与恢复

### 备份配置

```bash
# 备份配置文件
tar -czf config_backup.tar.gz ./config

# 备份数据库设置
docker exec -it mongodb mongodump --db email_system --collection settings --out /backup
```

### 恢复配置

```bash
# 恢复配置文件
tar -xzf config_backup.tar.gz -C ./

# 恢复数据库设置
docker exec -it mongodb mongorestore --db email_system --collection settings /backup/email_system/settings.bson
```

## 配置监控

系统提供配置监控端点，用于检查当前生效的配置：

```bash
# 查看API Server配置
curl http://localhost:3000/api/config

# 查看Admin Server配置
curl http://localhost:3001/api/config
```

## 常见配置问题

### 1. 数据库连接失败

- 检查MongoDB服务是否运行
- 验证连接字符串格式和凭据
- 确认网络连接和防火墙设置

### 2. 邮件发送失败

- 验证SMTP配置是否正确
- 检查SMTP服务器限制和配额
- 查看队列状态和错误日志

### 3. 认证问题

- 确认JWT_SECRET环境变量已设置
- 检查JWT过期时间配置
- 验证用户权限设置

### 4. 性能问题

- 调整连接池大小
- 优化Redis缓存配置
- 增加队列并发数

## 自定义配置扩展

系统支持通过插件机制扩展配置：

1. 在`config/plugins`目录下创建配置文件
2. 文件命名格式：`plugin-name.js`
3. 配置将自动合并到主配置中

示例插件配置：

```javascript
// config/plugins/custom-analytics.js
module.exports = {
  analytics: {
    enabled: true,
    provider: 'custom',
    endpoint: 'https://analytics.example.com/api'
  }
};
```

## 配置迁移

当系统升级时，配置格式可能发生变化。使用以下步骤迁移配置：

1. 备份当前配置
2. 运行配置迁移脚本：

```bash
node scripts/migrate-config.js --from=1.0.0 --to=2.0.0
```

3. 验证新配置是否正确加载

---

*最后更新时间：2024-01-15*
