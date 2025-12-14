/**
 * @file 统一日志系统与聚合平台
 * @description 提供异步、结构化的日志记录功能，支持关联ID、上下文追踪和日志聚合
 * @module shared/logger
 * @author YYC
 * @version 4.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
// AsyncLocalStorage用于在异步调用链中存储上下文
const { AsyncLocalStorage } = require('async_hooks');
// 导入日志轮转和格式化工具
const { format } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const { MESSAGE } = require('triple-beam');
// 导入日志聚合器
const { getLoggerAggregator, LOG_LEVELS: AGGREGATOR_LOG_LEVELS } = require('./logging/logger-aggregator');
// 尝试导入node-fetch或使用全局fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  fetch = globalThis.fetch;
}

// 日志配置
const LOGGER_CONFIG = {
  // 日志级别
  levels: {
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    verbose: 5,
    debug: 6,
    silly: 7,
    metric: 8,
    audit: 9,
    security: 10
  },
  // 存储配置
  storage: {
    logsDir: process.env.LOG_DIR || path.join(process.cwd(), '../logs'),
    maxSize: process.env.LOG_MAX_SIZE || '100m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    retentionDays: process.env.LOG_RETENTION_DAYS || 14
  },
  // 聚合配置
  aggregation: {
    enabled: process.env.LOG_AGGREGATION_ENABLED === 'true' || false,
    endpoint: process.env.LOG_AGGREGATION_ENDPOINT,
    batchSize: parseInt(process.env.LOG_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL || '5000'), // 5秒
    maxBufferSize: parseInt(process.env.LOG_MAX_BUFFER_SIZE || '1000')
  },
  // 敏感数据过滤
  sensitiveData: {
    fields: [
      'password', 'token', 'secret', 'key', 'apiKey', 'auth',
      'authorization', 'creditCard', 'socialSecurity', 'ssn',
      'bankAccount', 'passport', 'cardNumber', 'cvv'
    ]
  }
};

// 创建异步本地存储实例，用于保存请求上下文
const asyncLocalStorage = new AsyncLocalStorage();

// 确保日志目录存在
const logDir = LOGGER_CONFIG.storage.logsDir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 服务名称
const serviceName = process.env.SERVICE_NAME || path.basename(process.cwd());

// 创建敏感数据过滤器
const createSensitiveDataFilter = (sensitiveFields) => {
  return format((info) => {
    const filterSensitiveData = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const filtered = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => 
          keyLower.includes(field) || field.includes(keyLower)
        );
        
        if (isSensitive) {
          filtered[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          filtered[key] = filterSensitiveData(value);
        } else {
          filtered[key] = value;
        }
      }
      return filtered;
    };
    
    // 过滤整个info对象中的敏感数据
    return filterSensitiveData(info);
  });
};

// 自定义JSON格式，支持更复杂的序列化
const customJsonFormat = format((info) => {
  const serializeError = (err) => {
    if (!err || typeof err !== 'object') return err;
    
    const serialized = {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
      statusCode: err.statusCode
    };
    
    // 添加错误特有的属性
    if (err.details) serialized.details = err.details;
    if (err.errors) serialized.errors = err.errors;
    if (err.isOperational !== undefined) serialized.isOperational = err.isOperational;
    
    return serialized;
  };
  
  // 处理错误对象
  if (info.error) {
    info.error = serializeError(info.error);
  }
  
  // 处理原始错误对象
  if (info.originalError) {
    info.originalError = serializeError(info.originalError);
  }
  
  // 设置格式化消息
  info[MESSAGE] = JSON.stringify(info, (key, value) => {
    if (value instanceof Error) return serializeError(value);
    if (typeof value === 'bigint') return value.toString();
    if (value === undefined) return null;
    return value;
  });
  
  return info;
});

// 创建日志聚合器实例
let loggerAggregator = null;

// 初始化日志聚合器
async function initializeLoggerAggregator() {
  if (!loggerAggregator) {
    try {
      loggerAggregator = await getLoggerAggregator();
      console.log('日志聚合器初始化成功');
    } catch (error) {
      console.error('日志聚合器初始化失败:', error);
    }
  }
  return loggerAggregator;
}

// 初始化日志聚合器（异步）
initializeLoggerAggregator();

// 创建批处理器用于日志聚合
class LogBatchProcessor {
  constructor(config) {
    this.config = config;
    this.buffer = [];
    this.timer = null;
    this.isProcessing = false;
  }
  
  // 添加日志到缓冲区
  add(log) {
    // 异步添加到日志聚合器
    this.addToAggregator(log);
    
    // 如果启用了HTTP聚合，继续使用原有的批处理逻辑
    if (!this.config.enabled || !this.config.endpoint) return;
    
    // 限制缓冲区大小
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.buffer.shift(); // 移除最旧的日志
    }
    
    this.buffer.push(log);
    
    // 检查是否达到批处理大小
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // 设置定时刷新
      this.timer = setTimeout(() => this.flush(), this.config.flushInterval);
    }
  }
  
  // 添加日志到聚合器
  async addToAggregator(log) {
    try {
      const aggregator = await initializeLoggerAggregator();
      if (aggregator) {
        // 转换日志级别
        const aggregatorLevel = this.mapLogLevel(log.level);
        await aggregator.log(aggregatorLevel, log.message, log);
      }
    } catch (error) {
      console.error('添加日志到聚合器失败:', error);
    }
  }
  
  // 映射日志级别到聚合器级别
  mapLogLevel(level) {
    switch(level) {
      case 'critical':
        return AGGREGATOR_LOG_LEVELS.CRITICAL;
      case 'error':
        return AGGREGATOR_LOG_LEVELS.ERROR;
      case 'warn':
        return AGGREGATOR_LOG_LEVELS.WARN;
      case 'info':
      case 'http':
        return AGGREGATOR_LOG_LEVELS.INFO;
      case 'debug':
      case 'verbose':
      case 'silly':
        return AGGREGATOR_LOG_LEVELS.DEBUG;
      case 'security':
        return AGGREGATOR_LOG_LEVELS.SECURITY;
      default:
        return AGGREGATOR_LOG_LEVELS.INFO;
    }
  }
  
  // 刷新缓冲区
  async flush() {
    if (this.isProcessing || this.buffer.length === 0) return;
    
    this.isProcessing = true;
    
    // 清除定时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // 获取当前缓冲区内容并清空
    const logsToSend = [...this.buffer];
    this.buffer = [];
    
    try {
      await this.sendLogs(logsToSend);
    } catch (error) {
      console.error('日志聚合发送失败:', error);
      // 尝试重新添加到缓冲区（限制重试次数）
      if (this.buffer.length < this.config.maxBufferSize) {
        this.buffer.push(...logsToSend.filter(log => !log._sentAttempted));
        logsToSend.forEach(log => log._sentAttempted = true);
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  // 发送日志到聚合服务
  async sendLogs(logs) {
    if (!this.config.endpoint) return;
    
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': serviceName,
          'X-Environment': process.env.NODE_ENV || 'development'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          service: serviceName,
          environment: process.env.NODE_ENV || 'development',
          logs
        }),
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`发送日志失败: ${response.status}`);
      }
    } catch (error) {
      console.error('发送日志到聚合服务失败:', error);
      throw error;
    }
  }
  
  // 关闭批处理器
  async close() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // 尝试发送剩余的日志
    await this.flush();
    
    // 刷新日志聚合器
    const aggregator = await initializeLoggerAggregator();
    if (aggregator) {
      await aggregator.flushAllLogs();
    }
  }
}

// 创建日志批处理器实例
const logBatchProcessor = new LogBatchProcessor(LOGGER_CONFIG.aggregation);

// 创建自定义传输用于日志聚合
class AggregationTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
    this.name = 'aggregation';
  }
  
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    
    // 添加日志到批处理器
    logBatchProcessor.add(info);
    
    callback();
  }
}

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOGGER_CONFIG.levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    // 注入关联ID和其他上下文信息
    format((info) => {
      // 从AsyncLocalStorage获取当前上下文
      const store = asyncLocalStorage.getStore();
      if (store) {
        // 添加关联ID和其他上下文信息到日志中
        info.traceId = store.traceId;
        info.spanId = store.spanId;
        info.user = store.user;
        info.requestId = store.requestId;
        if (store.customContext) {
          info = { ...info, ...store.customContext };
        }
      }
      return info;
    })(),
    // 敏感数据过滤
    createSensitiveDataFilter(LOGGER_CONFIG.sensitiveData.fields),
    // 自定义JSON格式化
    customJsonFormat(),
    format.uncolorize()
  ),
  defaultMeta: {
    service: serviceName,
    hostname: os.hostname(),
    pid: process.pid,
    // 添加环境信息
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // 错误日志（每日轮转）
    new DailyRotateFile({
      filename: path.join(logDir, `${serviceName}-error-%DATE%.log`),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true,
      handleExceptions: true
    }),
    // 全部日志（每日轮转）
    new DailyRotateFile({
      filename: path.join(logDir, `${serviceName}-combined-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true
    }),
    // HTTP请求日志
    new DailyRotateFile({
      filename: path.join(logDir, `${serviceName}-http-%DATE%.log`),
      level: 'http',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true
    }),
    // 指标日志
    new DailyRotateFile({
      filename: path.join(logDir, `${serviceName}-metrics-%DATE%.log`),
      level: 'metric',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true
    }),
    // 审计日志
    new DailyRotateFile({
      filename: path.join(logDir, `${serviceName}-audit-%DATE%.log`),
      level: 'audit',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: '30d', // 审计日志保存30天
      zippedArchive: true
    }),
    // 日志聚合传输
    new AggregationTransport()
  ],
  // 处理日志写入错误
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOGGER_CONFIG.storage.maxSize,
      maxFiles: LOGGER_CONFIG.storage.maxFiles,
      zippedArchive: true
    })
  ]
});

// 开发环境下输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.timestamp({
        format: 'HH:mm:ss.SSS'
      }),
      format.printf(info => {
        const { timestamp, level, message, service, traceId, spanId, ...rest } = info;
        // 格式化控制台输出，包含关联ID
        let formattedMessage = `[${timestamp}] ${level} [${service}]`;
        if (traceId) {
          formattedMessage += ` [trace:${traceId?.substring(0, 8)}]`;
        }
        formattedMessage += `: ${message}`;
        
        // 处理错误信息
        if (rest.error && typeof rest.error === 'object') {
          formattedMessage += `\n  Error: ${rest.error.message}`;
          if (rest.error.stack) {
            formattedMessage += `\n  Stack: ${rest.error.stack.split('\n')[1]?.trim()}`;
          }
          delete rest.error;
        }
        
        // 添加其他信息
        const restString = Object.keys(rest).length > 0 
          ? ' ' + JSON.stringify(rest, null, 2)
          : '';
        return formattedMessage + restString;
      })
    )
  }));
}

// 进程退出时确保日志被刷新
process.on('exit', () => {
  logBatchProcessor.close().catch(err => console.error('关闭日志批处理器失败:', err));
});

// 监听未捕获的异常和拒绝，确保它们被记录
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { 
    reason: reason instanceof Error ? reason : { message: String(reason) },
    promiseId: promise.constructor.name
  });
});

// 请求上下文中间件
const requestContextMiddleware = (req, res, next) => {
  // 从请求头获取traceId或创建新的
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = uuidv4();
  
  // 从请求中提取用户信息（如果可用）
  let userInfo = null;
  if (req.user) {
    userInfo = { 
      id: req.user.id || req.user._id,
      email: req.user.email,
      // 避免记录敏感信息
      role: req.user.role || 'user'
    };
  }
  
  // 创建请求上下文
  const context = {
    traceId,
    spanId,
    requestId: uuidv4(),
    user: userInfo,
    customContext: {}
  };
  
  // 将上下文保存到AsyncLocalStorage中
  asyncLocalStorage.run(context, () => {
    // 设置响应头，传递traceId
    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-request-id', context.requestId);
    
    next();
  });
};

// 创建便捷的日志方法
const logUtils = {
  // 记录请求日志
  logRequest: (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody = '';

    // 捕获响应体
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      // 根据状态码确定日志级别
      let logLevel = 'http';
      if (res.statusCode >= 500) {
        logLevel = 'error';
      } else if (res.statusCode >= 400) {
        logLevel = 'warn';
      } else if (res.statusCode >= 300) {
        logLevel = 'info';
      }
      
      const logData = {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        status: res.statusCode,
        responseTime: duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        params: req.params,
        query: req.query,
        // 添加请求来源服务信息
        referer: req.headers.referer || '',
        xForwardedFor: req.headers['x-forwarded-for'],
        // 记录API版本（如果在URL中）
        apiVersion: req.originalUrl.match(/\/api\/v(\d+)/)?.[1] || 'unknown',
        contentLength: res.get('content-length') || 0
      };

      // 性能警告
      if (duration > 5000) {
        logger.warn('请求处理时间过长', {
          ...logData,
          threshold: '5000ms',
          severity: 'high'
        });
      } else if (duration > 2000) {
        logger.warn('请求处理时间较长', {
          ...logData,
          threshold: '2000ms',
          severity: 'medium'
        });
      }

      // 仅在非生产环境或错误状态下记录请求体和响应体
      if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
        // 过滤敏感信息已经由全局过滤器处理
        logData.bodySize = req.body ? JSON.stringify(req.body).length : 0;
        
        // 避免记录大型响应体
        if (responseBody && responseBody.length < 5000) {
          logData.responseSize = responseBody.length;
        }
      }

      logger[logLevel]('HTTP请求', {
        ...logData,
        // 记录用户信息（如果有）
        userId: req.user?.id || null,
        userRole: req.user?.role || null,
        // 记录请求大小和处理时间范围
        sizeCategory: logData.bodySize > 1024 * 1024 ? 'large' : logData.bodySize > 1024 * 100 ? 'medium' : 'small',
        timeCategory: duration > 1000 ? 'slow' : duration > 200 ? 'medium' : 'fast'
      });
    });

    next();
  },

  // 记录错误
  logError: (error, context = {}) => {
    // 从AsyncLocalStorage获取当前上下文
    const store = asyncLocalStorage.getStore();
    
    // 确保错误是对象
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorData = {
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
        timestamp: new Date().toISOString()
      },
      context: {
        ...context,
        // 添加traceId和spanId（如果可用）
        traceId: store?.traceId || null,
        spanId: store?.spanId || null,
        requestId: store?.requestId || null,
        userId: store?.user?.id || null
      }
    };

    // 添加自定义错误属性
    if (errorObj.code) errorData.error.code = errorObj.code;
    if (errorObj.statusCode) errorData.error.statusCode = errorObj.statusCode;
    if (errorObj.details) errorData.error.details = errorObj.details;
    if (errorObj.isOperational !== undefined) errorData.error.isOperational = errorObj.isOperational;
    if (errorObj.isRetryable !== undefined) errorData.error.isRetryable = errorObj.isRetryable;
    
    // 添加原始错误信息
    if (errorObj.originalError) errorData.error.originalError = errorObj.originalError instanceof Error 
      ? {
          name: errorObj.originalError.name,
          message: errorObj.originalError.message
        }
      : errorObj.originalError;

    // 添加错误严重性
    const severity = errorObj.statusCode >= 500 ? 'critical' : 
                    errorObj.statusCode >= 400 ? 'error' : 'warning';
    errorData.context.severity = severity;
    
    // 使用正确的日志级别
    const logLevel = severity === 'critical' ? 'critical' : 'error';
    logger[logLevel]('应用错误', errorData);
    
    // 对于关键错误和安全错误，发送审计日志
    if (severity === 'critical' || context.isSecurityError) {
      logUtils.logAudit(context.isSecurityError ? 'SECURITY_ERROR' : 'CRITICAL_ERROR', {
        errorCode: errorObj.code || 'UNKNOWN_ERROR',
        severity,
        message: errorObj.message,
        context: errorData.context
      });
    }
  },
  
  // 记录安全事件
  logSecurityEvent: (eventType, details = {}) => {
    const securityLog = {
      eventType,
      timestamp: new Date().toISOString(),
      userId: details.userId || null,
      userRole: details.userRole || null,
      ip: details.ip || null,
      action: details.action || 'unknown',
      resource: details.resource || 'unknown',
      status: details.status || 'unknown',
      ...details
    };
    
    logger.security('安全事件', securityLog);
    
    // 同时记录审计日志
    logUtils.logAudit(`SECURITY_${eventType.toUpperCase()}`, securityLog);
  },

  // 记录性能指标
  logPerformance: (operation, duration, context = {}) => {
    // 性能级别分类
    let performanceLevel = 'good';
    if (duration > 5000) {
      performanceLevel = 'critical';
    } else if (duration > 2000) {
      performanceLevel = 'poor';
    } else if (duration > 1000) {
      performanceLevel = 'fair';
    }
    
    logger.metric('性能指标', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      performanceLevel,
      timestamp: new Date().toISOString(),
      ...context
    });
    
    // 对于性能较差的操作，记录警告
    if (performanceLevel === 'poor' || performanceLevel === 'critical') {
      logger.warn('性能警告', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        threshold: performanceLevel === 'critical' ? '5000ms' : '2000ms',
        performanceLevel,
        ...context
      });
    }
  },
  
  // 记录审计日志
  logAudit: (action, details = {}) => {
    const auditLog = {
      action,
      timestamp: new Date().toISOString(),
      userId: details.userId || null,
      userRole: details.userRole || null,
      ip: details.ip || null,
      ...details
    };
    
    logger.audit('审计日志', auditLog);
  },
  
  // 记录业务事件
  logBusinessEvent: (eventName, data = {}, level = 'info') => {
    logger[level]('业务事件', {
      eventName,
      timestamp: new Date().toISOString(),
      ...data
    });
  },
  
  // 记录数据库操作
  logDatabaseOperation: (operation, entity, duration, metadata = {}) => {
    const logData = {
      operation,
      entity,
      duration: `${duration.toFixed(2)}ms`,
      ...metadata
    };
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn('数据库慢查询', logData);
    }
    
    logger.verbose('数据库操作', logData);
  },
  
  // 记录外部服务调用
  logExternalServiceCall: (serviceName, operation, duration, metadata = {}) => {
    const logData = {
      serviceName,
      operation,
      duration: `${duration.toFixed(2)}ms`,
      status: metadata.status || 'unknown',
      ...metadata
    };
    
    // 根据状态和持续时间确定日志级别
    let logLevel = 'info';
    if (metadata.status === 'error' || metadata.statusCode >= 500) {
      logLevel = 'error';
    } else if (metadata.statusCode >= 400) {
      logLevel = 'warn';
    } else if (duration > 2000) {
      logLevel = 'warn';
    }
    
    logger[logLevel]('外部服务调用', logData);
  },
  
  // 获取日志统计信息
  getLogStats: () => {
    return {
      aggregationEnabled: LOGGER_CONFIG.aggregation.enabled,
      bufferSize: logBatchProcessor.buffer.length,
      logLevels: Object.keys(LOGGER_CONFIG.levels),
      logDirectory: LOGGER_CONFIG.storage.logsDir
    };
  },
  
  // 刷新所有待发送的日志
  flushLogs: async () => {
    await logBatchProcessor.flush();
    
    // 同时刷新日志聚合器
    const aggregator = await initializeLoggerAggregator();
    if (aggregator) {
      await aggregator.flushLogs();
    }
  },
  
  // 获取日志聚合器实例
  getLoggerAggregator: async () => {
    return await initializeLoggerAggregator();
  },
  
  // 向当前上下文添加自定义信息
  addContext: (contextData) => {
    const store = asyncLocalStorage.getStore();
    if (store && store.customContext) {
      store.customContext = { ...store.customContext, ...contextData };
    }
  },

  // 获取当前上下文中的关联ID
  getContext: () => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      return {
        traceId: store.traceId,
        spanId: store.spanId,
        requestId: store.requestId,
        user: store.user
      };
    }
    return null;
  },

  // 创建子span（用于服务间调用追踪）
  createChildSpan: (parentSpanId = null) => {
    const store = asyncLocalStorage.getStore();
    const spanId = uuidv4();
    const traceId = store?.traceId || uuidv4();
    
    return {
      traceId,
      spanId,
      parentSpanId: parentSpanId || store?.spanId || null
    };
  }
};

// 导出请求上下文中间件
exports.requestContextMiddleware = requestContextMiddleware;

// 导出日志记录器、中间件和工具方法
module.exports = {
  logger,
  requestContextMiddleware,
  logBatchProcessor,
  LOGGER_CONFIG,
  getLoggerAggregator: initializeLoggerAggregator,
  ...logUtils
};