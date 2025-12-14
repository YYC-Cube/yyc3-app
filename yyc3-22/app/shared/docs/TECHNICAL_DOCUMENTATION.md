# Shared Modules 技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 模块概述

YYC3 Shared Modules 是YYC3 AI Family平台的共享组件库，提供缓存管理、日志系统、配置中心、服务发现、API网关等通用功能模块。

### 基本信息

- **模块名称**: YYC3 Shared Components
- **技术栈**: Node.js | Redis | JavaScript | TypeScript
- **架构模式**: 微服务共享库
- **依赖管理**: npm/yarn

## 🏗️ 核心模块

### 模块结构

| 模块 | 功能描述 | 主要文件 |
|------|----------|----------|
| **cache** | 缓存管理 | `cache/` |
| **config-center** | 配置中心 | `config-center/` |
| **gateway** | API网关 | `gateway/` |
| **logger** | 日志系统 | `logger.js` |
| **redis** | Redis客户端 | `redis/` |
| **service-mesh** | 服务网格 | `service-mesh/` |
| **validation** | 数据验证 | `validation/` |
| **messaging** | 消息队列 | `messaging/` |
| **monitoring** | 监控组件 | `monitoring/` |
| **service-discovery** | 服务发现 | `service-discovery/` |

## 📁 详细结构

```
shared/
├── 📄 package.json           # 共享模块配置
├── 📄 docs.js                 # 文档生成器
├── 📄 errorHandler.js        # 统一错误处理
├── 📄 logger.js               # 日志系统主文件
├── 📄 status.js               # 状态管理
├── 📁 cache/                  # 缓存管理
│   ├── 📄 index.js           # 缓存主入口
│   ├── 📄 memory-cache.js    # 内存缓存
│   └── 📄 redis-cache.js     # Redis缓存
├── 📁 config-center/         # 配置中心
│   ├── 📄 index.js           # 配置管理主文件
│   ├── 📄 env-loader.js      # 环境变量加载
│   └── 📄 config-validator.js # 配置验证
├── 📁 gateway/                # API网关
│   ├── 📄 index.js           # 网关主文件
│   ├── 📄 router.js          # 路由管理
│   └── 📄 middleware.js      # 中间件集合
├── 📁 redis/                  # Redis客户端
│   ├── 📄 index.js           # Redis主客户端
│   ├── 📄 cluster.js         # Redis集群
│   └── 📄 pubsub.js          # 发布订阅
├── 📁 service-mesh/           # 服务网格
│   ├── 📄 index.js           # 服务网格主文件
│   ├── 📄 proxy.js           # 服务代理
│   └── 📄 load-balancer.js   # 负载均衡
├── 📁 validation/             # 数据验证
│   ├── 📄 index.js           # 验证主文件
│   ├── 📄 schema-validator.js # 模式验证
│   └── 📄 rules.js           # 验证规则
├── 📁 messaging/              # 消息队列
│   ├── 📄 index.js           # 消息主文件
│   ├── 📄 queue.js           # 队列管理
│   └── 📄 publisher.js       # 消息发布
├── 📁 monitoring/             # 监控组件
│   ├── 📄 index.js           # 监控主文件
│   ├── 📄 metrics.js         # 指标收集
│   └── 📄 health-check.js    # 健康检查
├── 📁 service-discovery/      # 服务发现
│   ├── 📄 index.js           # 服务发现主文件
│   ├── 📄 registry.js        # 服务注册
│   └── 📄 dns-resolver.js    # DNS解析
├── 📁 logging/                # 日志组件
│   ├── 📄 index.js           # 日志主文件
│   ├── 📄 formatters.js      # 日志格式化
│   └── 📄 transports.js      # 日志传输
└── 📁 status/                 # 状态管理
    ├── 📄 index.js           # 状态主文件
    └── 📄 health-check.js    # 健康检查
```

## 🔧 核心模块详解

### 1. 缓存管理 (`cache/`)

```javascript
// cache/index.js
const MemoryCache = require('./memory-cache');
const RedisCache = require('./redis-cache');

class CacheManager {
  constructor(options = {}) {
    this.type = options.type || 'memory';
    this.cache = this.createCache(options);
  }

  createCache(options) {
    switch (this.type) {
      case 'redis':
        return new RedisCache(options.redis);
      case 'memory':
      default:
        return new MemoryCache(options.memory);
    }
  }

  async get(key) {
    return await this.cache.get(key);
  }

  async set(key, value, ttl = 3600) {
    return await this.cache.set(key, value, ttl);
  }

  async del(key) {
    return await this.cache.del(key);
  }

  async exists(key) {
    return await this.cache.exists(key);
  }
}

module.exports = CacheManager;
```

### 2. 日志系统 (`logger.js`)

```javascript
const winston = require('winston');
const path = require('path');

class Logger {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.logger = this.createLogger(options);
  }

  createLogger(options) {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: this.serviceName,
          message,
          ...meta
        });
      })
    );

    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: path.join('logs', `${this.serviceName}-error.log`),
        level: 'error'
      }),
      new winston.transports.File({
        filename: path.join('logs', `${this.serviceName}-combined.log`)
      })
    ];

    return winston.createLogger({
      level: options.level || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, error = null, meta = {}) {
    this.logger.error(message, { error: error?.stack || error, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = Logger;
```

### 3. Redis客户端 (`redis/`)

```javascript
const Redis = require('ioredis');

class RedisClient {
  constructor(options = {}) {
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password,
      db: options.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...options
    };

    this.client = this.createClient();
  }

  createClient() {
    const client = new Redis(this.config);

    client.on('connect', () => {
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    client.on('close', () => {
      console.log('Redis connection closed');
    });

    return client;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      throw new Error(`Redis GET error for key ${key}: ${error.message}`);
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      throw new Error(`Redis SET error for key ${key}: ${error.message}`);
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      throw new Error(`Redis DEL error for key ${key}: ${error.message}`);
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      throw new Error(`Redis EXISTS error for key ${key}: ${error.message}`);
    }
  }
}

module.exports = RedisClient;
```

### 4. 配置中心 (`config-center/`)

```javascript
const fs = require('fs');
const path = require('path');

class ConfigCenter {
  constructor(options = {}) {
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = this.loadFile('default.json') || {};
    const envConfig = this.loadFile(`${this.env}.json`) || {};

    // 环境变量覆盖
    const envVars = this.loadEnvVars();

    return {
      ...defaultConfig,
      ...envConfig,
      ...envVars
    };
  }

  loadFile(filename) {
    const filePath = path.join(this.configPath, filename);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load config file ${filename}:`, error.message);
    }
    return null;
  }

  loadEnvVars() {
    const envConfig = {};
    const envPrefix = 'YYC3_';

    Object.keys(process.env).forEach(key => {
      if (key.startsWith(envPrefix)) {
        const configKey = key.substring(envPrefix.length).toLowerCase();
        const value = process.env[key];

        // 尝试解析为JSON，失败则作为字符串
        try {
          envConfig[configKey] = JSON.parse(value);
        } catch {
          envConfig[configKey] = value;
        }
      }
    });

    return envConfig;
  }

  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = this.config;

    for (const k of keys) {
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    target[lastKey] = value;
  }

  reload() {
    this.config = this.loadConfig();
  }
}

module.exports = ConfigCenter;
```

### 5. API网关 (`gateway/`)

```javascript
const express = require('express');
const httpProxy = require('http-proxy-middleware');

class APIGateway {
  constructor(options = {}) {
    this.app = express();
    this.routes = new Map();
    this.middleware = [];
    this.loadBalancer = options.loadBalancer || 'round-robin';

    this.setupMiddleware();
    this.setupRoutes(options.routes || {});
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }

  setupRoutes(routes) {
    Object.entries(routes).forEach(([path, config]) => {
      this.addRoute(path, config);
    });
  }

  addRoute(path, config) {
    const { target, methods = ['GET'], auth = false, rateLimit = null } = config;

    const proxy = httpProxy.createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`: '' },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err.message);
        res.status(502).json({ error: 'Service unavailable' });
      }
    });

    this.routes.set(path, { proxy, config, methods });

    methods.forEach(method => {
      this.app[method.toLowerCase()](path, (req, res, next) => {
        if (auth && !this.authenticate(req)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        if (rateLimit && !this.checkRateLimit(req, rateLimit)) {
          return res.status(429).json({ error: 'Too many requests' });
        }

        proxy(req, res, next);
      });
    });
  }

  authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    // JWT验证逻辑
    return this.validateToken(token);
  }

  validateToken(token) {
    try {
      // 实际的JWT验证逻辑
      return token.length > 10; // 简化验证
    } catch {
      return false;
    }
  }

  checkRateLimit(req, limit) {
    // 简化的限流逻辑
    return true;
  }

  listen(port, callback) {
    this.app.listen(port, callback);
  }
}

module.exports = APIGateway;
```

## 🔌 使用示例

### 初始化共享模块

```javascript
const Logger = require('../logger');
const CacheManager = require('../cache');
const RedisClient = require('../redis');
const ConfigCenter = require('../config-center');

// 初始化配置中心
const config = new ConfigCenter({
  env: process.env.NODE_ENV || 'development',
  configPath: './config'
});

// 初始化日志系统
const logger = new Logger('my-service', {
  level: config.get('log.level', 'info')
});

// 初始化缓存
const cache = new CacheManager({
  type: config.get('cache.type', 'memory'),
  redis: {
    host: config.get('redis.host', 'localhost'),
    port: config.get('redis.port', 6379)
  }
});

// 初始化Redis客户端
const redis = new RedisClient({
  host: config.get('redis.host', 'localhost'),
  port: config.get('redis.port', 6379),
  password: config.get('redis.password')
});

module.exports = {
  config,
  logger,
  cache,
  redis
};
```

### 在服务中使用

```javascript
const { config, logger, cache, redis } = require('./shared');

class MyService {
  constructor() {
    this.config = config;
    this.logger = logger;
    this.cache = cache;
    this.redis = redis;
  }

  async handleRequest(req, res) {
    try {
      this.logger.info('Processing request', {
        path: req.path,
        method: req.method
      });

      // 使用缓存
      const cacheKey = `request:${req.path}`;
      let result = await this.cache.get(cacheKey);

      if (!result) {
        // 业务逻辑处理
        result = await this.processData(req);

        // 缓存结果
        await this.cache.set(cacheKey, result, 300); // 5分钟缓存
      }

      res.json({ success: true, data: result });
    } catch (error) {
      this.logger.error('Request processing failed', error, {
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async processData(req) {
    // 使用Redis存储会话数据
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        // 使用会话数据
      }
    }

    // 返回处理结果
    return { processed: true, timestamp: new Date().toISOString() };
  }
}
```

## 📊 性能优化

### 缓存策略

```javascript
// 多级缓存策略
class MultiLevelCache {
  constructor() {
    this.memoryCache = new CacheManager({ type: 'memory' });
    this.redisCache = new CacheManager({
      type: 'redis',
      redis: { host: 'localhost', port: 6379 }
    });
  }

  async get(key) {
    // 1. 先查内存缓存
    let value = await this.memoryCache.get(key);
    if (value) {
      return value;
    }

    // 2. 查Redis缓存
    value = await this.redisCache.get(key);
    if (value) {
      // 回写内存缓存
      await this.memoryCache.set(key, value, 60);
      return value;
    }

    return null;
  }

  async set(key, value, ttl = 3600) {
    // 同时写入两级缓存
    await Promise.all([
      this.memoryCache.set(key, value, Math.min(ttl, 300)), // 内存缓存最多5分钟
      this.redisCache.set(key, value, ttl)
    ]);
  }
}
```

### 连接池管理

```javascript
// Redis连接池
const Redis = require('ioredis');

class RedisPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 10;
    this.connections = [];
    this.available = [];
    this.waiting = [];
  }

  async getConnection() {
    if (this.available.length > 0) {
      return this.available.pop();
    }

    if (this.connections.length < this.maxConnections) {
      const connection = new Redis(this.config);
      this.connections.push(connection);
      return connection;
    }

    // 等待可用连接
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  releaseConnection(connection) {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      resolve(connection);
    } else {
      this.available.push(connection);
    }
  }
}
```

## 🧪 测试

### 单元测试示例

```javascript
const CacheManager = require('../cache');

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ type: 'memory' });
  });

  afterEach(async () => {
    await cache.clear();
  });

  test('should set and get values', async () => {
    await cache.set('test-key', { data: 'test-value' });
    const result = await cache.get('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  test('should return null for non-existent keys', async () => {
    const result = await cache.get('non-existent');
    expect(result).toBeNull();
  });

  test('should respect TTL', async () => {
    await cache.set('ttl-key', 'value', 1); // 1秒TTL
    const immediate = await cache.get('ttl-key');
    expect(immediate).toBe('value');

    await new Promise(resolve => setTimeout(resolve, 1100));
    const delayed = await cache.get('ttl-key');
    expect(delayed).toBeNull();
  });
});
```

## 🔗 相关链接

- **主服务文档**: `[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)`
- **API参考文档**: `[../API_REFERENCE.md](../API_REFERENCE.md)`
- **API服务**: `../api/`
- **管理后台**: `../admin/`
- **LLM服务**: `../llm/`
- **邮件服务**: `../mail/`
- **Redis文档**: https://redis.io/documentation
- **Winston文档**: https://github.com/winstonjs/winston

## 📞 技术支持

- **问题反馈**: <dev@0379.email>
- **服务监控**: `https://monitor.0379.email`
- **在线文档**: `https://docs.0379.email`

---

<div align="center">

**[⬆️ 回到顶部](#shared-modules-技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🔧

</div>