# 错误处理和日志记录机制分析

## 1. 当前实现评估

基于对项目代码的分析，当前系统已经实现了基本的错误处理和日志记录机制，但存在一些可优化空间。

### 1.1 日志记录现状

目前项目使用 `winston` 库实现了统一的日志记录系统，主要特性包括：

- 支持多环境配置（开发、测试、生产）
- 结构化的 JSON 日志格式
- 文件轮转（错误日志和综合日志）
- 日志级别控制
- 提供了 `logUtils` 工具集（`logRequest`、`logError`、`logPerformance`）

### 1.2 错误处理现状

- 使用 Express 中间件捕获全局错误
- 在关键操作中进行错误捕获和记录
- Redis 连接错误处理
- 健康检查机制

## 2. 现有实现代码分析

### 2.1 日志系统 (logger.js)

当前的日志系统实现了基本功能，但可以进一步增强：

```javascript
// 当前实现的优势
- 统一的日志接口
- 环境感知的日志级别
- 结构化的 JSON 日志
- 文件和控制台输出

// 需要改进的方面
- 缺少日志上下文信息
- 缺少关联 ID 追踪请求
- 日志级别使用不够规范
- 缺少日志聚合配置
- 性能日志不够详细
```

### 2.2 错误处理机制

错误处理机制需要更加系统化和一致：

```javascript
// 当前实现的优势
- 全局错误捕获
- Redis 错误重连机制
- 基本的错误日志记录

// 需要改进的方面
- 缺少统一的错误格式
- 错误分类不够明确
- 缺少用户友好的错误响应
- 缺少错误监控和告警
- 异常边界处理不够完善
```

## 3. 优化建议

### 3.1 增强日志系统

```javascript
// 增强版 logger.js
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// 创建日志格式
const jsonFormatter = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.json(),
  winston.format.printf(info => {
    // 确保包含基本字段
    const baseFields = {
      timestamp: info.timestamp,
      level: info.level,
      service: process.env.SERVICE_NAME || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      correlationId: info.correlationId,
      message: info.message
    };
    
    // 合并其他字段，排除已存在的字段
    const additionalFields = { ...info };
    delete additionalFields.timestamp;
    delete additionalFields.level;
    delete additionalFields.message;
    delete additionalFields.correlationId;
    delete additionalFields.service;
    delete additionalFields.environment;
    
    return JSON.stringify({ ...baseFields, ...additionalFields });
  })
);

// 创建控制台格式
const consoleFormatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.printf(info => {
    const correlationId = info.correlationId ? `[${info.correlationId.substring(0, 8)}]` : '';
    const service = process.env.SERVICE_NAME ? `[${process.env.SERVICE_NAME}]` : '';
    
    // 基本日志
    let logMessage = `${info.timestamp} ${info.level} ${service} ${correlationId} ${info.message}`;
    
    // 添加额外信息
    const additionalFields = { ...info };
    delete additionalFields.timestamp;
    delete additionalFields.level;
    delete additionalFields.message;
    delete additionalFields.correlationId;
    delete additionalFields.service;
    
    if (Object.keys(additionalFields).length > 0) {
      logMessage += ' ' + JSON.stringify(additionalFields);
    }
    
    return logMessage;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormatter,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: `${process.env.SERVICE_NAME || 'app'}-error.log`,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    }),
    // 综合日志
    new winston.transports.File({
      filename: `${process.env.SERVICE_NAME || 'app'}-combined.log`,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    })
  ]
});

// 非生产环境输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormatter
  }));
}

// 错误处理
logger.on('error', error => {
  console.error('日志记录器错误:', error);
});

// 日志工具集
const logUtils = {
  // 生成关联 ID
  generateCorrelationId: () => uuidv4(),
  
  // 请求日志中间件
  logRequest: (req, res, next) => {
    // 生成或获取关联 ID
    const correlationId = req.headers['x-correlation-id'] || logUtils.generateCorrelationId();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    
    const startTime = Date.now();
    const originalUrl = req.originalUrl;
    const method = req.method;
    const ip = req.ip;
    
    // 记录请求开始
    logger.info('请求开始', {
      correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent: req.headers['user-agent'],
      event: 'request_start'
    });
    
    // 拦截响应
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // 确定日志级别
      let logLevel = 'info';
      if (statusCode >= 500) {
        logLevel = 'error';
      } else if (statusCode >= 400) {
        logLevel = 'warn';
      }
      
      // 记录请求完成
      logger[logLevel]('请求完成', {
        correlationId,
        method,
        url: originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        responseSize: typeof body === 'string' ? body.length : 0,
        event: 'request_complete'
      });
      
      return originalSend.call(this, body);
    };
    
    next();
  },
  
  // 错误日志工具
  logError: (error, context, metadata = {}) => {
    // 结构化错误信息
    const errorInfo = {
      message: error.message || '未知错误',
      stack: error.stack,
      code: error.code,
      name: error.name,
      ...metadata
    };
    
    // 针对特定类型的错误进行特殊处理
    if (error.type === 'database') {
      // 数据库错误 - 隐藏敏感信息
      errorInfo.databaseError = true;
      errorInfo.queryType = error.queryType;
      // 不记录完整查询以防止SQL注入信息泄露
    } else if (error.type === 'validation') {
      // 验证错误
      errorInfo.validationErrors = error.details;
    }
    
    logger.error(`[${context}] 错误`, errorInfo);
    
    // 可以在这里添加错误告警逻辑
    if (process.env.NODE_ENV === 'production' && shouldAlert(error)) {
      triggerErrorAlert(error, context, metadata);
    }
    
    return errorInfo;
  },
  
  // 性能日志工具
  logPerformance: (operation, startTime, metadata = {}) => {
    const duration = Date.now() - startTime;
    
    // 确定日志级别
    let logLevel = 'info';
    if (duration > 1000) { // 超过1秒
      logLevel = 'error';
    } else if (duration > 500) { // 超过500ms
      logLevel = 'warn';
    }
    
    logger[logLevel]('性能指标', {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata,
      event: 'performance_metric'
    });
    
    return duration;
  }
};

// 判断是否需要发送告警
function shouldAlert(error) {
  // 可以根据错误类型、频率等决定是否需要告警
  const criticalErrors = ['OutOfMemoryError', 'database_connection_failed'];
  return criticalErrors.includes(error.name) || error.critical;
}

// 触发错误告警
function triggerErrorAlert(error, context, metadata) {
  // 这里可以集成告警服务，如Sentry、Prometheus等
  console.error(`需要发送告警: ${error.message} in ${context}`);
  // 实际实现中可以发送邮件、短信或集成第三方告警服务
}

module.exports = { logger, logUtils };
```

### 3.2 统一错误处理机制

创建一个专门的错误处理模块，提供统一的错误分类和处理机制：

```javascript
// error-handler.js
const { logger, logUtils } = require('./logger');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational !== false; // 默认是可操作的错误
    this.type = options.type || 'general';
    this.details = options.details;
    this.code = options.code;
    this.critical = options.critical || false;
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

// 特定类型的错误类
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, { 
      type: 'validation',
      details,
      isOperational: true 
    });
  }
}

class NotFoundError extends AppError {
  constructor(message, resource = '资源') {
    super(message, 404, { 
      type: 'not_found',
      resource,
      isOperational: true 
    });
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401, { 
      type: 'unauthorized',
      isOperational: true 
    });
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403, { 
      type: 'forbidden',
      isOperational: true 
    });
  }
}

class DatabaseError extends AppError {
  constructor(message, options = {}) {
    super(message, 500, { 
      type: 'database',
      queryType: options.queryType,
      isOperational: options.isOperational !== false,
      critical: options.critical !== false // 数据库错误通常比较严重
    });
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message, service) {
    super(message, 503, { 
      type: 'service_unavailable',
      service,
      isOperational: true 
    });
  }
}

// 错误响应格式化
function formatErrorResponse(error, req, res) {
  const correlationId = req.correlationId || 'no-correlation-id';
  
  // 基本错误响应
  const errorResponse = {
    error: {
      message: error.message,
      code: error.code || error.name.toLowerCase(),
      correlationId
    }
  };
  
  // 根据环境和错误类型添加详细信息
  if (process.env.NODE_ENV !== 'production' && error.details) {
    errorResponse.error.details = error.details;
  }
  
  // 对于验证错误，返回所有验证详情
  if (error.type === 'validation' && error.details) {
    errorResponse.error.validationErrors = error.details;
  }
  
  // 对于开发环境，可以返回堆栈信息
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack.split('\n');
  }
  
  return errorResponse;
}

// 全局错误处理中间件
function errorHandlerMiddleware(err, req, res, next) {
  // 确保错误被正确包装
  const error = wrapError(err);
  const correlationId = req.correlationId || logUtils.generateCorrelationId();
  
  // 记录错误
  const errorInfo = logUtils.logError(error, '全局错误处理', {
    correlationId,
    url: req.originalUrl,
    method: req.method,
    user: req.user ? req.user.id : 'unauthenticated'
  });
  
  // 格式化响应
  const response = formatErrorResponse(error, req, res);
  
  // 发送响应
  res.status(error.statusCode || 500).json(response);
}

// 未捕获异常处理
function setupUncaughtExceptionHandler() {
  process.on('uncaughtException', (error) => {
    logUtils.logError(error, '未捕获异常', { critical: true });
    
    // 给系统一些时间来完成日志记录
    setTimeout(() => {
      process.exit(1); // 非正常退出
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logUtils.logError(error, '未处理的Promise拒绝', { critical: true });
  });
}

// 将普通错误包装为AppError
function wrapError(error) {
  if (error instanceof AppError) {
    return error;
  }
  
  // 根据错误特征创建合适的错误类型
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message, error.details);
  }
  
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return new DatabaseError(error.message, { queryType: 'mongo' });
  }
  
  // 默认包装为通用错误
  return new AppError(error.message, 500, {
    code: error.code,
    isOperational: false,
    critical: true
  });
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  ServiceUnavailableError,
  errorHandlerMiddleware,
  setupUncaughtExceptionHandler,
  wrapError
};
```

### 3.3 Express应用集成示例

```javascript
// server.js 集成示例
const express = require('express');
const { logger, logUtils } = require('./shared/logger');
const {
  errorHandlerMiddleware,
  setupUncaughtExceptionHandler,
  ValidationError
} = require('./shared/error-handler');

const app = express();

// 设置未捕获异常处理
setupUncaughtExceptionHandler();

// 使用请求日志中间件
app.use(logUtils.logRequest);

// 其他中间件和路由...

// 示例: 验证中间件使用自定义错误
app.post('/api/users', (req, res, next) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      // 使用自定义验证错误
      throw new ValidationError('请求数据验证失败', error.details);
    }
    
    // 处理请求...
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// 示例: Redis错误处理
app.get('/api/cache-test', async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // 使用性能日志
    try {
      const result = await redisService.get('test-key');
      logUtils.logPerformance('redis:get', startTime, { key: 'test-key' });
      res.json({ result });
    } catch (redisError) {
      logUtils.logPerformance('redis:get', startTime, { 
        key: 'test-key', 
        success: false,
        error: redisError.message 
      });
      throw redisError;
    }
  } catch (error) {
    next(error);
  }
});

// 404 处理
app.use((req, res, next) => {
  next(new NotFoundError(`路径 ${req.originalUrl} 不存在`));
});

// 使用全局错误处理中间件
app.use(errorHandlerMiddleware);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`服务器启动在端口 ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到终止信号，正在关闭服务器...');
  
  // 关闭数据库连接、Redis连接等
  Promise.all([
    redisService.disconnect(),
    // 其他清理工作
  ]).then(() => {
    logger.info('所有连接已关闭，服务器退出');
    process.exit(0);
  }).catch((error) => {
    logger.error('关闭过程中发生错误', { error: error.message });
    process.exit(1);
  });
});
```

## 4. 日志聚合与监控集成

为了更好地管理和分析日志，建议集成日志聚合系统和监控工具：

### 4.1 ELK Stack 集成

```yaml
# docker-compose-elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk-network

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./app/logs:/logs
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch
    networks:
      - elk-network

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - elk-network

networks:
  elk-network:
    driver: bridge

volumes:
  elasticsearch-data:
```

### 4.2 Prometheus 监控集成

```javascript
// prometheus-metrics.js
const promClient = require('prom-client');
const { logger } = require('./logger');

// 配置默认指标收集
promClient.collectDefaultMetrics({
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5] // 垃圾收集持续时间桶
});

// 自定义指标
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP请求处理时间（毫秒）',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500] // 请求持续时间桶
});

const redisCommandDurationMicroseconds = new promClient.Histogram({
  name: 'redis_command_duration_ms',
  help: 'Redis命令执行时间（毫秒）',
  labelNames: ['command', 'success'],
  buckets: [0.1, 1, 5, 10, 50, 100]
});

const activeRequestsGauge = new promClient.Gauge({
  name: 'http_active_requests',
  help: '当前活跃的HTTP请求数'
});

const errorCounter = new promClient.Counter({
  name: 'app_errors_total',
  help: '应用错误计数',
  labelNames: ['error_type', 'error_name']
});

// 中间件：记录请求持续时间
function prometheusMiddleware(req, res, next) {
  const start = Date.now();
  activeRequestsGauge.inc();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 简化路由以避免高基数
    const route = getNormalizedRoute(req);
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    activeRequestsGauge.dec();
    
    // 记录错误计数
    if (res.statusCode >= 500) {
      errorCounter
        .labels('http', 'server_error')
        .inc();
    } else if (res.statusCode >= 400) {
      errorCounter
        .labels('http', 'client_error')
        .inc();
    }
  });
  
  next();
}

// 工具函数：规范化路由以避免高基数
function getNormalizedRoute(req) {
  // 检查是否是Express路由处理过的请求
  if (req.route && req.route.path) {
    return req.route.path;
  }
  
  // 对于动态路由，尝试规范化
  const path = req.path;
  
  // 替换常见的ID格式
  return path
    .replace(/\/[0-9a-fA-F]{24}$/, '/:id') // MongoDB ObjectId
    .replace(/\/\d+$/, '/:id') // 数字ID
    .replace(/\/[a-zA-Z0-9_-]{8,36}$/, '/:id'); // 一般ID格式
}

// Redis命令监控包装器
function monitorRedisCommand(redisClient, command, ...args) {
  const startTime = Date.now();
  let success = true;
  
  return redisClient[command](...args)
    .catch(error => {
      success = false;
      throw error;
    })
    .finally(() => {
      const duration = Date.now() - startTime;
      
      // 记录Redis命令执行时间
      redisCommandDurationMicroseconds
        .labels(command, String(success))
        .observe(duration);
    });
}

// 记录错误指标
function recordErrorMetric(error) {
  errorCounter
    .labels(error.type || 'unknown', error.name || 'Error')
    .inc();
}

// 导出指标端点处理函数
function metricsHandler(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
}

module.exports = {
  prometheusMiddleware,
  monitorRedisCommand,
  recordErrorMetric,
  metricsHandler
};
```

## 5. 实施建议

### 5.1 阶段实施计划

1. **第一阶段: 日志系统增强** (1周)
   - 更新 logger.js，增加关联ID和结构化字段
   - 集成日志聚合配置
   - 更新所有服务以使用增强的日志系统

2. **第二阶段: 错误处理机制** (1-2周)
   - 创建统一的错误处理模块
   - 实现各种自定义错误类型
   - 更新异常处理中间件
   - 添加未捕获异常处理

3. **第三阶段: 监控集成** (1-2周)
   - 集成Prometheus指标
   - 配置Grafana仪表板
   - 设置告警规则
   - 实现性能监控

### 5.2 最佳实践建议

1. **日志最佳实践**
   - 使用结构化日志，便于解析和分析
   - 包含关联ID，便于追踪请求流程
   - 敏感信息（密码、令牌等）不记录到日志
   - 日志级别使用规范：DEBUG（调试）、INFO（一般信息）、WARN（警告）、ERROR（错误）
   - 生产环境避免记录过多详细信息

2. **错误处理最佳实践**
   - 使用自定义错误类，提供更多上下文信息
   - 区分可操作错误和编程错误
   - 向用户返回友好的错误信息
   - 详细记录错误上下文，便于调试
   - 关键错误触发告警机制

3. **监控最佳实践**
   - 监控关键业务指标和系统指标
   - 设置合理的告警阈值
   - 实现错误率和延迟监控
   - 定期审查监控数据，优化系统

## 6. 总结

通过实施上述优化建议，可以显著提高系统的可观测性、可靠性和可维护性。增强的日志系统和统一的错误处理机制将使问题排查更加高效，而监控集成则能够帮助提前发现和解决潜在问题。

这些改进不仅有利于开发团队更快地定位和修复问题，也能够提高系统的整体稳定性，为用户提供更好的服务体验。建议按照实施计划逐步推进，并在每个阶段进行充分的测试，确保改动不会对现有功能产生负面影响。
