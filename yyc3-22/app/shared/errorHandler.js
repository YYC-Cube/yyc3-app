/**
 * @file 统一错误处理模块
 * @description 提供全局错误处理、自定义错误类、错误响应格式化和监控集成
 * @module shared/errorHandler
 * @author YYC
 * @version 4.0.0
 * @created 2024-10-15
 * @updated 2024-10-16
 */

const { logger, logError, getContext, loggerAggregator } = require('./logger');
const { serviceStatusManager } = require('./status');

// 定义错误代码常量
const ERROR_CODES = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
};

// 自定义错误基类
class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    
    // 保存堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
    
    // 设置名称
    this.name = this.constructor.name;
    
    // 设置状态码
    this.statusCode = statusCode;
    
    // 设置错误类型
    this.isOperational = options.isOperational !== false;
    this.isRetryable = options.isRetryable || false;
    this.retryAttempts = options.retryAttempts || 0;
    
    // 添加额外数据
    this.code = options.code || 'UNKNOWN_ERROR';
    this.details = options.details;
    this.errors = options.errors;
    this.timestamp = new Date().toISOString();
    this.correlationId = options.correlationId;
    
    // 添加关联ID和上下文信息
    const context = getContext();
    if (context) {
      this.traceId = context.traceId;
      this.requestId = context.requestId;
      this.spanId = context.spanId;
      this.correlationId = this.correlationId || context.traceId;
    }
    
    // 保存原始错误
    if (options.originalError) {
      this.originalError = options.originalError;
    }
    
    // 记录错误到监控系统
    if (statusCode >= 500) {
      this.reportToMonitoring();
    }
  }
  
  // 序列化错误为API响应格式
  toResponse(includeStack = false) {
    const response = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp
      }
    };
    
    // 添加关联ID
    if (this.traceId) {
      response.error.traceId = this.traceId;
    }
    
    if (this.requestId) {
      response.error.requestId = this.requestId;
    }
    
    if (this.correlationId) {
      response.error.correlationId = this.correlationId;
    }
    
    // 添加详细信息
    if (this.details) {
      response.error.details = this.details;
    }
    
    // 添加验证错误列表
    if (this.errors && Array.isArray(this.errors) && this.errors.length > 0) {
      response.error.errors = this.errors;
    }
    
    // 仅在开发环境或指定时包含堆栈跟踪
    if (includeStack && process.env.NODE_ENV !== 'development') {
      response.error.stack = this.stack;
    }
    
    return response;
  }
  
  // 报告错误到监控系统
  reportToMonitoring() {
    try {
      // 更新服务状态
      if (serviceStatusManager) {
        serviceStatusManager.reportError(this.code, {
          code: this.code,
          message: this.message,
          statusCode: this.statusCode,
          traceId: this.traceId
        });
      }
      
      // 记录错误指标
      logger.metric('error_occurred', {
        code: this.code,
        statusCode: this.statusCode,
        isOperational: this.isOperational
      });
    } catch (monitoringError) {
      console.error('监控报告失败:', monitoringError);
    }
  }
  
  // 创建重试错误
  createRetryError(maxRetries = 3) {
    if (this.retryAttempts >= maxRetries) {
      return this;
    }
    
    const retryError = new this.constructor(
      this.message,
      this.statusCode,
      {
        ...this,
        retryAttempts: this.retryAttempts + 1,
        code: this.code,
        originalError: this
      }
    );
    
    return retryError;
  }
}

// 定义常见错误类型
class ValidationError extends AppError {
  constructor(message = '请求参数验证失败', details = null, errors = []) {
    super(message, 400, {
      code: 'VALIDATION_ERROR',
      details,
      errors,
      isOperational: true
    });
  }
}

class AuthenticationError extends AppError {
  constructor(message = '认证失败', details = null) {
    super(message, 401, {
      code: 'AUTHENTICATION_ERROR',
      details,
      isOperational: true
    });
  }
}

class ForbiddenError extends AppError {
  constructor(message = '没有权限执行此操作', details = null) {
    super(message, 403, {
      code: 'FORBIDDEN_ERROR',
      details,
      isOperational: true
    });
  }
}

class NotFoundError extends AppError {
  constructor(message = '请求的资源不存在', details = null) {
    super(message, 404, {
      code: 'NOT_FOUND_ERROR',
      details,
      isOperational: true
    });
  }
}

class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', details = null, originalError = null) {
    super(message, 500, {
      code: 'DATABASE_ERROR',
      details,
      originalError,
      isOperational: true,
      isRetryable: true
    });
  }
}

class ExternalServiceError extends AppError {
  constructor(message = '外部服务调用失败', details = null, service = null) {
    super(message, 503, {
      code: 'EXTERNAL_SERVICE_ERROR',
      details: { ...details, service },
      isOperational: true,
      isRetryable: true
    });
  }
}

// 业务逻辑错误类
class BusinessLogicError extends AppError {
  constructor(message = '业务逻辑错误', details = null, businessCode = null) {
    super(message, 400, {
      code: 'BUSINESS_LOGIC_ERROR',
      details: { ...details, businessCode },
      isOperational: true
    });
  }
}

// 资源冲突错误类
class ConflictError extends AppError {
  constructor(message = '资源冲突', details = null) {
    super(message, 409, {
      code: 'CONFLICT_ERROR',
      details,
      isOperational: true
    });
  }
}

// 请求超时错误类
class TimeoutError extends AppError {
  constructor(message = '请求超时', details = null) {
    super(message, 408, {
      code: 'TIMEOUT_ERROR',
      details,
      isOperational: true,
      isRetryable: true
    });
  }
}

// 服务不可用错误类
class ServiceUnavailableError extends AppError {
  constructor(message = '服务暂时不可用', details = null) {
    super(message, 503, {
      code: 'SERVICE_UNAVAILABLE_ERROR',
      details,
      isOperational: true,
      isRetryable: true
    });
  }
}

// 速率限制错误类
class RateLimitError extends AppError {
  constructor(message = '请求频率过高，请稍后再试', retryAfter = null) {
    super(message, 429, {
      code: 'RATE_LIMIT_ERROR',
      details: { retryAfter },
      isOperational: true
    });
    this.retryAfter = retryAfter;
  }
}

// 内部服务器错误类
class InternalServerError extends AppError {
  constructor(message = '内部服务器错误', details = null, originalError = null) {
    super(message, 500, {
      code: 'INTERNAL_SERVER_ERROR',
      details,
      originalError,
      isOperational: false
    });
  }
}

// 服务器错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 确保是AppError实例
  let error = err;
  if (!(error instanceof AppError)) {
    // 转换为AppError
    error = new InternalServerError(
      err.message || '内部服务器错误',
      null,
      err
    );
  }

  // 记录错误上下文
  const errorContext = {
    path: req.path,
    method: req.method,
    headers: {
      // 仅记录安全的头信息
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'accept': req.headers['accept'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    },
    params: req.params,
    query: req.query,
    // 添加请求源信息
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    // 添加请求处理时间
    responseTime: req.responseTime || null,
    // 添加用户信息（如果有）
    userId: req.user?.id || null,
    userRole: req.user?.role || null
  };
  
  // 仅在非生产环境或非敏感错误下记录请求体（过滤敏感信息）
  if ((process.env.NODE_ENV !== 'production' || !['AUTHENTICATION_ERROR', 'FORBIDDEN_ERROR'].includes(error.code)) && req.body) {
    const safeBody = { ...req.body };
    // 移除敏感字段
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'socialSecurity', 'auth', 'authorization', 'apikey'];
    
    // 递归过滤敏感字段
    const filterSensitiveData = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const filtered = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        if (sensitiveFields.some(field => keyLower.includes(field))) {
          filtered[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          filtered[key] = filterSensitiveData(value);
        } else {
          filtered[key] = value;
        }
      }
      return filtered;
    };
    
    errorContext.body = filterSensitiveData(safeBody);
  }
  
  // 添加错误分类信息
  errorContext.errorType = error.name;
  errorContext.isRetryable = error.isRetryable;
  errorContext.retryAttempts = error.retryAttempts;
  
  // 记录错误
  logError(error, errorContext);

  // 构建统一格式的错误响应
  const response = error.toResponse(process.env.NODE_ENV === 'development');
  
  // 设置适当的响应头
  if (error.retryAfter) {
    res.setHeader('Retry-After', error.retryAfter.toString());
  }
  
  // 添加关联ID到响应头
  if (error.traceId) {
    res.setHeader('X-Trace-Id', error.traceId);
  }
  
  // 发送响应并设置适当的状态码
  res.status(error.statusCode || 500).json(response);
};

// 未捕获路由处理
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
};

// 全局错误处理（未捕获的异常）
const setupGlobalErrorHandlers = () => {
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    
    // 包装为系统级错误
    const systemError = new AppError(
      '系统内部错误',
      500,
      {
        code: 'SYSTEM_ERROR',
        isOperational: false,
        originalError: error
      }
    );
    
    logError(systemError, { 
      type: 'uncaughtException',
      process: process.pid,
      memoryUsage: process.memoryUsage()
    });
    
    // 非操作错误需要关闭进程
    if (!systemError.isOperational) {
      // 给一些时间来记录错误
      setTimeout(() => process.exit(1), 1000);
    }
  });

  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', promise);
    console.error('拒绝原因:', reason);
    
    const error = reason instanceof Error 
      ? new AppError(
          reason.message || 'Promise拒绝错误',
          500,
          {
            code: 'PROMISE_REJECTION',
            originalError: reason
          }
        ) 
      : new AppError(
          typeof reason === 'string' ? reason : '未处理的Promise拒绝',
          500,
          {
            code: 'PROMISE_REJECTION',
            originalError: reason
          }
        );
    
    logError(error, { 
      type: 'unhandledRejection',
      promiseId: promise.constructor.name + Math.random().toString(36).substr(2, 9),
      process: process.pid
    });
    
    // 非操作错误需要关闭进程
    if (!error.isOperational) {
      // 给一些时间来记录错误
      setTimeout(() => process.exit(1), 1000);
    }
  });
};

// 实用工具函数
const errorUtils = {
  /**
   * 包装异步路由处理函数，自动捕获错误
   * @param {Function} fn - 异步路由处理函数
   * @returns {Function} 包装后的中间件函数
   */
  catchAsync: (fn) => {
    return (req, res, next) => {
      const startTime = Date.now();
      fn(req, res, next)
        .catch((error) => {
          // 记录请求处理时间
          req.responseTime = Date.now() - startTime;
          next(error);
        });
    };
  },
  
  /**
   * 带重试机制的异步函数包装器
   * @param {Function} fn - 要执行的异步函数
   * @param {Object} options - 重试选项
   * @param {number} options.maxRetries - 最大重试次数
   * @param {number} options.baseDelay - 基础延迟时间（毫秒）
   * @param {Array} options.retryableErrors - 可重试的错误类型或代码
   * @returns {Function} 包装后的函数
   */
  withRetry: (fn, options = {}) => {
    const { 
      maxRetries = 3, 
      baseDelay = 100, 
      retryableErrors = ['DATABASE_ERROR', 'EXTERNAL_SERVICE_ERROR', 'TIMEOUT_ERROR', 'SERVICE_UNAVAILABLE_ERROR'] 
    } = options;
    
    return async (...args) => {
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;
          
          // 检查是否可重试
          const isRetryable = error.isRetryable && 
            (retryableErrors.includes(error.code) || retryableErrors.includes(error.name));
          
          if (!isRetryable || attempt >= maxRetries) {
            throw error;
          }
          
          // 计算指数退避延迟
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
          logger.warn(`操作失败，将在 ${delay.toFixed(0)}ms 后重试 (尝试 ${attempt + 1}/${maxRetries})`, {
            errorCode: error.code,
            attempt: attempt + 1,
            maxRetries
          });
          
          // 创建重试错误
          const retryError = error.createRetryError(maxRetries);
          lastError = retryError;
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    };
  },
  
  /**
   * 验证输入参数并转换为错误
   * @param {Object} schema - 验证模式
   * @param {Object} data - 要验证的数据
   * @throws {ValidationError} 验证失败时抛出错误
   */
  validateInput: (schema, data) => {
    try {
      // 集成验证库的入口点
      if (typeof schema.validate === 'function') {
        const result = schema.validate(data);
        if (result.error) {
          // 格式化验证错误
          const formattedErrors = Array.isArray(result.error.details) 
            ? result.error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message,
                type: d.type
              }))
            : [result.error.message];
            
          throw new ValidationError(
            '输入参数验证失败',
            { fieldCount: formattedErrors.length },
            formattedErrors
          );
        }
        return result.value || data;
      } else {
        throw new Error('验证模式必须包含validate方法');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new ValidationError('输入参数验证失败', { originalError: error.message });
    }
  },
  
  /**
   * 创建错误验证中间件
   * @param {Object} schema - 验证模式
   * @param {string} source - 验证源 ('body', 'query', 'params')
   * @returns {Function} 验证中间件
   */
  validationMiddleware: (schema, source = 'body') => {
    return (req, res, next) => {
      try {
        const data = req[source];
        const validatedData = errorUtils.validateInput(schema, data);
        req[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validatedData;
        next();
      } catch (error) {
        next(error);
      }
    };
  },
  
  /**
   * 格式化数据库错误
   * @param {Error} error - 原始数据库错误
   * @param {string} operation - 数据库操作类型
   * @returns {DatabaseError} 格式化后的数据库错误
   */
  formatDatabaseError: (error, operation = '数据库操作') => {
    let message = `${operation}失败`;
    let details = null;
    
    // 解析常见的数据库错误
    if (error.code) {
      details = { errorCode: error.code };
      
      switch (error.code) {
        case 'ER_DUP_ENTRY':
          message = '数据重复，请检查输入';
          break;
        case 'ER_NO_REFERENCED_ROW_2':
          message = '引用的数据不存在';
          break;
        case 'ER_BAD_NULL_ERROR':
          message = '不允许为空的字段值为空';
          break;
        default:
          message = `${operation}失败: ${error.code}`;
      }
    }
    
    return new DatabaseError(message, details, error);
  },
  
  /**
   * 格式化外部服务错误
   * @param {Error} error - 原始错误
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 选项
   * @returns {ExternalServiceError} 格式化后的外部服务错误
   */
  formatExternalServiceError: (error, serviceName, options = {}) => {
    let message = `${serviceName} 服务调用失败`;
    let details = options.details || {};
    
    // 解析HTTP错误
    if (error.response) {
      details.status = error.response.status;
      details.statusText = error.response.statusText;
      
      if (error.response.data) {
        details.responseData = typeof error.response.data === 'object' 
          ? { ...error.response.data } 
          : { message: error.response.data };
      }
    }
    
    // 处理超时错误
    if (error.code === 'ECONNABORTED') {
      return new TimeoutError(`${serviceName} 服务响应超时`, details);
    }
    
    return new ExternalServiceError(message, details, serviceName);
  },
  
  /**
   * 安全地从错误中提取消息
   * @param {any} error - 错误对象或消息
   * @returns {string} 提取的错误消息
   */
  getErrorMessage: (error) => {
    if (!error) return '未知错误';
    
    if (typeof error === 'string') return error;
    if (error instanceof AppError) return error.message;
    if (error instanceof Error) return error.message;
    if (error.message) return error.message;
    
    try {
      return JSON.stringify(error);
    } catch (e) {
      return String(error);
    }
  }
};

// 错误监控和告警管理器
class ErrorMonitoringManager {
  constructor() {
    this.thresholds = {
      errorRate: 0.05, // 5%的错误率阈值
      criticalErrorCount: 10, // 关键错误数量阈值
      timeWindow: 60000, // 时间窗口（毫秒）
    };
    
    this.errorHistory = [];
    this.criticalErrors = new Map();
  }
  
  /**
   * 记录错误到监控系统
   * @param {AppError} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  recordError(error, context) {
    const now = Date.now();
    const errorRecord = {
      timestamp: now,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      context: { ...context }
    };
    
    this.errorHistory.push(errorRecord);
    
    // 清理旧记录
    this.cleanupOldRecords(now);
    
    // 检查是否需要告警
    if (error.statusCode >= 500) {
      this.checkThresholds();
    }
    
    // 检查关键错误
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error, context);
    }
  }
  
  /**
   * 清理旧记录
   * @param {number} now - 当前时间戳
   */
  cleanupOldRecords(now) {
    this.errorHistory = this.errorHistory.filter(
      record => now - record.timestamp < this.thresholds.timeWindow
    );
  }
  
  /**
   * 检查错误阈值
   */
  checkThresholds() {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      record => now - record.timestamp < this.thresholds.timeWindow
    );
    
    // 这里可以实现错误率监控和告警逻辑
    if (recentErrors.length > 0) {
      logger.info(`时间窗口内错误数量: ${recentErrors.length}`);
    }
  }
  
  /**
   * 判断是否为关键错误
   * @param {AppError} error - 错误对象
   * @returns {boolean} 是否为关键错误
   */
  isCriticalError(error) {
    const criticalCodes = [
      'DATABASE_ERROR',
      'SERVICE_UNAVAILABLE_ERROR',
      'INTERNAL_SERVER_ERROR'
    ];
    
    return criticalCodes.includes(error.code) && error.statusCode >= 500;
  }
  
  /**
   * 处理关键错误
   * @param {AppError} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  handleCriticalError(error, context) {
    const key = `${error.code}:${context.path || 'unknown'}`;
    const count = (this.criticalErrors.get(key) || 0) + 1;
    
    this.criticalErrors.set(key, count);
    
    // 如果达到阈值，发送告警
    if (count >= this.thresholds.criticalErrorCount) {
      logger.error(`关键错误阈值告警: ${error.code} 在 ${context.path}`, {
        count,
        threshold: this.thresholds.criticalErrorCount,
        context
      });
      
      // 重置计数
      this.criticalErrors.set(key, 0);
    }
  }
  
  /**
   * 获取监控统计信息
   * @returns {Object} 监控统计信息
   */
  getStats() {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      record => now - record.timestamp < this.thresholds.timeWindow
    );
    
    const groupedByCode = recentErrors.reduce((acc, record) => {
      acc[record.code] = (acc[record.code] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalErrors: recentErrors.length,
      errorByCode: groupedByCode,
      criticalErrorCount: this.criticalErrors.size,
      timeWindow: this.thresholds.timeWindow / 1000 + 's'
    };
  }
}

// 创建错误监控管理器实例
const errorMonitoringManager = new ErrorMonitoringManager();

// 更新全局错误处理，集成错误监控
const originalSetupGlobalErrorHandlers = setupGlobalErrorHandlers;
const enhancedSetupGlobalErrorHandlers = () => {
  originalSetupGlobalErrorHandlers();
  
  // 在这里可以添加额外的全局错误处理逻辑
  logger.info('增强的全局错误处理已设置');
};

// 导出核心错误处理功能
module.exports = {
  // 错误基类
  AppError,
  
  // 错误类型
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  ConflictError,
  TimeoutError,
  ServiceUnavailableError,
  RateLimitError,
  InternalServerError,
  
  // 中间件
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers: enhancedSetupGlobalErrorHandlers,
  
  // 监控
  errorMonitoringManager,
  
  // 工具函数
  ...errorUtils,
  
  // 新增：错误类型检查
  isAppError: (error) => error instanceof AppError,
  isValidationError: (error) => error instanceof ValidationError,
  isAuthenticationError: (error) => error instanceof AuthenticationError,
  isAuthorizationError: (error) => error instanceof ForbiddenError,
  isServerError: (error) => error instanceof AppError && error.statusCode >= 500,
  isClientError: (error) => error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500,
  
  // 新增：安全错误处理
  securityErrors: {
    createSecurityError: (message, details = null, securityCode = null) => {
      return new ForbiddenError(message, {
        ...details,
        securityCode,
        timestamp: new Date().toISOString()
      });
    },
    
    handleSecurityViolation: (violationType, context = {}) => {
      const error = new ForbiddenError(`安全违规: ${violationType}`, {
        violationType,
        context,
        securityCode: violationType.replace(/\s+/g, '_').toUpperCase()
      });
      
      // 记录安全事件
      logger.security('安全违规', {
        violationType,
        context,
        timestamp: new Date().toISOString()
      });
      
      return error;
    }
  },
  
  // 新增：错误响应格式化
  formatErrorResponse: (error, options = {}) => {
    if (error instanceof AppError) {
      return error.toResponse(options.includeStack);
    } else if (error instanceof z.ZodError) {
      const appError = handleZodError(error);
      return appError.toResponse(options.includeStack);
    }
    
    // 通用错误格式化
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        timestamp: new Date().toISOString(),
        type: error.name || 'Error'
      },
      meta: {
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }
};
