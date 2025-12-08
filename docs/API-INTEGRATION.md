# API服务联动配置指南

本文档描述如何在 `/Users/yanyu/www/redis-config` 和 `/Users/yanyu/www/app` 两个项目之间实现API联动和数据共享。

## 1. 架构概述

![API联动架构](https://example.com/api-integration-architecture.svg)

- **redis-config**: 负责Redis服务器管理和基础API服务
- **app**: 主应用服务，包含业务逻辑
- **共享组件**: 通过shared-lib目录实现代码复用
- **Redis**: 作为两个服务之间的数据交换中心

## 2. 环境变量同步

### 2.1 关键环境变量

两个项目必须共享以下关键环境变量：

```bash
# Redis连接参数 (两个项目必须一致)
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=redis_yyc3

# API通信参数
API_VERSION=v1
LOG_LEVEL=info
```

### 2.2 同步工具

使用提供的同步脚本来保持环境变量一致性：

```bash
bash /Users/yanyu/www/scripts/sync-api-settings.sh
```

该脚本会：

- 同步两个项目的环境变量文件
- 确保Redis密码一致
- 创建必要的符号链接
- 更新Redis配置文件
- 验证配置正确性

## 3. 共享库集成

### 3.1 Redis客户端共享

两个项目应使用相同的Redis客户端实现，通过符号链接引用：

```javascript
// 在app项目中
const redisClient = require('shared-redis-client');

// 在redis-config/api项目中
const redisClient = require('shared-redis-client');
```

### 3.2 共享库路径

共享库位于：`/Users/yanyu/www/shared-lib/redis-client`

## 4. API联动机制

### 4.1 通过Redis的发布/订阅机制

两个服务可以通过Redis的发布/订阅功能实现实时通信：

```javascript
// 在app项目中 - 发布消息
const client = redisClient.getClient();
await client.publish('api:events', JSON.stringify({
  type: 'user_created',
  userId: '12345',
  timestamp: Date.now()
}));

// 在redis-config/api项目中 - 订阅消息
const client = redisClient.getClient();
const subscriber = client.duplicate();
await subscriber.connect();

subscriber.subscribe('api:events', (message) => {
  const event = JSON.parse(message);
  console.log('收到API事件:', event);
  // 处理事件逻辑
});
```

### 4.2 通过Redis缓存共享数据

两个服务可以通过Redis缓存共享配置、状态等数据：

```javascript
// 在app项目中 - 设置共享配置
const client = redisClient.getClient();
await client.set(
  'api:config:shared_settings',
  JSON.stringify({
    featureFlags: { enableNewFeature: true },
    rateLimits: { maxRequests: 1000 },
    updatedAt: Date.now()
  }),
  'EX', 3600 // 1小时过期
);

// 在redis-config/api项目中 - 读取共享配置
const client = redisClient.getClient();
const configStr = await client.get('api:config:shared_settings');
const sharedConfig = configStr ? JSON.parse(configStr) : {};
console.log('共享配置:', sharedConfig);
```

## 5. 健康检查联动

两个服务应互相检查对方的健康状态：

```javascript
// 在app项目中 - 检查redis-config API健康状态
async function checkRedisApiHealth() {
  try {
    const response = await fetch('http://localhost:3000/status');
    const health = await response.json();
    return health.status === 'healthy';
  } catch (error) {
    console.error('Redis API健康检查失败:', error);
    return false;
  }
}

// 在redis-config/api项目中 - 检查app健康状态
async function checkAppHealth() {
  try {
    const response = await fetch('http://localhost:3001/api/status');
    const health = await response.json();
    return health.status === 'ok';
  } catch (error) {
    console.error('App健康检查失败:', error);
    return false;
  }
}
```

## 6. 部署注意事项

### 6.1 启动顺序

1. 首先启动Redis服务：`bash /Users/yanyu/www/redis-config/scripts/redis-manager.sh start --mode docker --env prod`
2. 然后启动redis-config/api服务
3. 最后启动app服务

### 6.2 环境隔离

开发环境和生产环境应使用不同的Redis实例和配置：

- 开发环境：端口6380，无密码或弱密码
- 生产环境：端口6379，强密码保护，启用TLS（如需要）

## 7. 监控与日志

### 7.1 集中式日志

两个服务的日志应统一格式，便于集中分析：

```javascript
// 日志格式示例
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "service": "app", // 或 "redis-api"
  "message": "User login successful",
  "data": { "userId": "12345" },
  "traceId": "abc-123-def-456"
}
```

### 7.2 指标监控

两个服务应暴露相同格式的性能指标：

- 请求延迟
- 错误率
- 吞吐量
- Redis连接状态
- 资源使用情况

## 8. 故障排查

### 8.1 连接问题

如果两个服务无法通过Redis通信，请检查：

1. Redis服务器是否运行：`redis-cli ping`
2. 环境变量是否正确：`grep REDIS_ /Users/yanyu/www/app/.env.local /Users/yanyu/www/redis-config/.env.local`
3. 防火墙设置是否允许连接
4. 密码是否一致

### 8.2 数据同步问题

如果数据不同步，请检查：

1. Redis客户端是否使用相同的键前缀或命名空间
2. 数据过期时间设置是否合理
3. 是否正确处理了序列化和反序列化

## 9. 最佳实践

1. **始终使用同步脚本**保持环境变量一致
2. **使用命名空间隔离**不同服务的数据
3. **实现重试机制**处理临时连接失败
4. **监控Redis性能**避免成为瓶颈
5. **定期备份Redis数据**防止数据丢失
6. **使用事务或Lua脚本**保证操作原子性

## 10. 常见问题解答

### Q: 如何安全地更新Redis密码？

A: 使用同步脚本更新，它会自动更新所有相关配置文件。更新后记得重启所有服务。

### Q: 两个服务可以使用不同版本的Node.js吗？

A: 建议使用相同版本以避免兼容性问题，特别是对于共享库的使用。

### Q: 如何扩展此架构以支持更多服务？

A: 遵循相同的模式：共享环境变量、使用共享Redis客户端库、通过Redis进行通信。

---

保持代码健康，稳步前行！ 🌹
