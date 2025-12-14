/**
 * @file 增强型API网关
 * @description 集成服务发现、高级路由、限流、熔断等功能的API网关
 * @module gateway/enhanced-gateway
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const express = require('express');
const httpProxy = require('http-proxy');
const { logger } = require('../logger');
const { getServiceDiscovery, ServiceDiscoveryUtils, LoadBalancerStrategy } = require('../service-discovery');
const { AppError } = require('../error');

/**
 * 断路器状态枚举
 */
const CircuitState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
};

/**
 * 断路器类
 * 基于状态机模式：关闭-半开-打开
 */
class CircuitBreaker {
  /**
   * 构造函数
   * @param {Object} options - 断路器配置
   */
  constructor(options = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 30000,
      successThreshold: options.successThreshold || 2
    };
    
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.metrics = {
      requests: 0,
      failures: 0,
      successes: 0,
      timeouts: 0
    };
  }
  
  /**
   * 执行受断路器保护的操作
   * @param {Function} operation - 要执行的异步操作
   * @returns {Promise<any>} 操作结果
   * @throws {Error} 当断路器打开或操作失败时抛出错误
   */
  async execute(operation) {
    // 检查断路器状态
    if (this.state === CircuitState.OPEN) {
      // 检查是否可以尝试半开状态
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        logger.info('断路器从OPEN切换到HALF_OPEN');
        this.state = CircuitState.HALF_OPEN;
      } else {
        this.metrics.timeouts++;
        throw new Error(`断路器打开，服务暂时不可用`);
      }
    }
    
    this.metrics.requests++;
    
    try {
      // 执行操作
      const result = await operation();
      
      // 成功处理
      this._onSuccess();
      this.metrics.successes++;
      return result;
    } catch (error) {
      // 失败处理
      this._onFailure();
      this.metrics.failures++;
      throw error;
    }
  }
  
  /**
   * 操作成功处理
   * @private
   */
  _onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        // 重置断路器
        logger.info('断路器从HALF_OPEN切换到CLOSED');
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // 重置失败计数
      this.failureCount = 0;
    }
  }
  
  /**
   * 操作失败处理
   * @private
   */
  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      logger.info('断路器从HALF_OPEN切换到OPEN');
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      logger.info('断路器从CLOSED切换到OPEN');
      this.state = CircuitState.OPEN;
    }
  }
  
  /**
   * 获取断路器状态
   * @returns {Object} 断路器状态和指标
   */
  getState() {
    return {
      state: this.state,
      metrics: this.metrics,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.state === CircuitState.OPEN 
        ? this.lastFailureTime + this.options.resetTimeout 
        : null
    };
  }
}

/**
 * 速率限制器类
 */
class RateLimiter {
  /**
   * 构造函数
   * @param {Object} options - 速率限制器配置
   */
  constructor(options = {}) {
    this.options = {
      maxRequests: options.maxRequests || 100,
      timeWindow: options.timeWindow || 60000, // 毫秒
      identifier: options.identifier || 'ip' // ip, user, header等
    };
    
    this.requestCounts = new Map();
  }
  
  /**
   * 检查是否允许请求
   * @param {Object} requestInfo - 请求信息
   * @returns {Object} 检查结果
   */
  check(requestInfo) {
    const now = Date.now();
    const key = this._getIdentifier(requestInfo);
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, []);
    }
    
    const timestamps = this.requestCounts.get(key);
    
    // 移除过期的请求记录
    const validTimestamps = timestamps.filter(t => now - t < this.options.timeWindow);
    this.requestCounts.set(key, validTimestamps);
    
    // 检查是否超过限制
    const allowed = validTimestamps.length < this.options.maxRequests;
    
    if (allowed) {
      // 记录新请求
      validTimestamps.push(now);
    }
    
    return {
      allowed,
      remaining: Math.max(0, this.options.maxRequests - validTimestamps.length),
      resetTime: this.options.timeWindow - (now - validTimestamps[0])
    };
  }
  
  /**
   * 获取请求标识符
   * @private
   * @param {Object} requestInfo - 请求信息
   * @returns {string} 标识符
   */
  _getIdentifier(requestInfo) {
    switch (this.options.identifier) {
      case 'ip':
        return requestInfo.ip || 'unknown';
      case 'user':
        return requestInfo.userId || requestInfo.ip || 'unknown';
      case 'header':
        return requestInfo.headers[this.options.headerName] || requestInfo.ip || 'unknown';
      default:
        return requestInfo.ip || 'unknown';
    }
  }
  
  /**
   * 清理过期的请求记录
   */
  cleanup() {
    const now = Date.now();
    
    this.requestCounts.forEach((timestamps, key) => {
      const validTimestamps = timestamps.filter(t => now - t < this.options.timeWindow);
      
      if (validTimestamps.length === 0) {
        this.requestCounts.delete(key);
      } else {
        this.requestCounts.set(key, validTimestamps);
      }
    });
  }
}

/**
 * 增强型API网关类
 * 集成服务发现、高级路由和监控功能
 */
class EnhancedApiGateway {
  /**
   * 构造函数
   */
  constructor() {
    this.app = express();
    this.routes = [];
    this.middlewares = [];
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      timeout: 30000 // 30秒超时
    });
    
    this.serviceDiscovery = null;
    this.circuitBreakers = new Map();
    this.rateLimiters = new Map();
    this.loadBalancerStrategy = LoadBalancerStrategy.ROUND_ROBIN;
    
    // 初始化错误处理
    this._initErrorHandler();
    
    // 启动定期清理
    this._startCleanupInterval();
  }
  
  /**
   * 初始化API网关
   * @param {Object} options - 初始化选项
   * @returns {express.Application} Express应用实例
   */
  initialize(options = {}) {
    logger.info('初始化增强型API网关...');
    
    // 初始化服务发现
    if (options.serviceDiscoveryConfig) {
      logger.info('配置服务发现客户端');
      this.serviceDiscovery = getServiceDiscovery(options.serviceDiscoveryConfig);
    }
    
    // 设置负载均衡策略
    if (options.loadBalancerStrategy) {
      this.loadBalancerStrategy = options.loadBalancerStrategy;
    }
    
    // 注册中间件
    this._registerDefaultMiddlewares();
    
    // 注册路由
    this._registerRoutes();
    
    logger.info('增强型API网关初始化完成');
    return this.app;
  }
  
  /**
   * 注册中间件
   * @param {Function} middleware - Express中间件
   * @param {Object} options - 中间件选项
   */
  use(middleware, options = {}) {
    if (options.global !== false) {
      this.app.use(middleware);
    }
    this.middlewares.push({ middleware, options });
  }
  
  /**
   * 注册路由
   * @param {string} path - 路由路径
   * @param {Object} config - 路由配置
   */
  route(path, config) {
    this.routes.push({ path, config });
    return this;
  }
  
  /**
   * 注册服务路由
   * @param {string} path - 路由路径
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 路由选项
   */
  registerServiceRoute(path, serviceName, options = {}) {
    if (!this.serviceDiscovery) {
      throw new AppError(500, '服务发现未初始化');
    }
    
    // 创建断路器（如果不存在）
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker(options.circuitBreakerOptions));
    }
    
    // 创建速率限制器（如果配置了）
    if (options.rateLimitOptions) {
      this.rateLimiters.set(`${path}-${serviceName}`, new RateLimiter(options.rateLimitOptions));
    }
    
    // 动态服务路由处理器
    const serviceHandler = async (req, res, next) => {
      try {
        // 应用速率限制
        const rateLimiter = this.rateLimiters.get(`${path}-${serviceName}`);
        if (rateLimiter) {
          const result = rateLimiter.check({
            ip: req.ip,
            userId: req.user?.id,
            headers: req.headers
          });
          
          // 设置速率限制响应头
          res.set('X-RateLimit-Limit', options.rateLimitOptions.maxRequests);
          res.set('X-RateLimit-Remaining', result.remaining);
          res.set('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + Math.floor(result.resetTime / 1000));
          
          if (!result.allowed) {
            return next(new AppError(429, '请求过于频繁，请稍后再试'));
          }
        }
        
        // 从服务发现获取服务实例
        const instances = await this.serviceDiscovery.discoverService(serviceName, { passingOnly: true });
        if (!instances || instances.length === 0) {
          return next(new AppError(503, `服务 ${serviceName} 不可用`));
        }
        
        // 负载均衡选择实例
        const instance = this.serviceDiscovery.selectServiceInstance(
          instances, 
          serviceName, 
          options.loadBalancerStrategy || this.loadBalancerStrategy
        );
        
        // 请求转发
        this._forwardRequest(req, res, next, instance, serviceName, options);
      } catch (error) {
        next(error);
      }
    };
    
    // 注册路由
    this.route(path, {
      method: options.method || 'GET',
      handler: serviceHandler,
      ...options
    });
    
    logger.info(`注册服务路由: ${options.method || 'GET'} ${path} -> ${serviceName}`);
    return this;
  }
  
  /**
   * 注册静态路由
   * @param {string} path - 路由路径
   * @param {string} target - 目标URL
   * @param {Object} options - 路由选项
   */
  registerStaticRoute(path, target, options = {}) {
    const staticHandler = (req, res, next) => {
      this._forwardRequest(req, res, next, { address: target }, 'static', options);
    };
    
    // 注册路由
    this.route(path, {
      method: options.method || 'GET',
      handler: staticHandler,
      ...options
    });
    
    logger.info(`注册静态路由: ${options.method || 'GET'} ${path} -> ${target}`);
    return this;
  }
  
  /**
   * 启动服务器
   * @param {number} port - 端口
   * @param {Function} callback - 回调函数
   * @returns {http.Server} HTTP服务器实例
   */
  listen(port, callback) {
    return this.app.listen(port, callback);
  }
  
  /**
   * 获取断路器状态
   * @returns {Object} 所有断路器状态
   */
  getCircuitBreakerStates() {
    const states = {};
    this.circuitBreakers.forEach((breaker, service) => {
      states[service] = breaker.getState();
    });
    return states;
  }
  
  /**
   * 初始化默认中间件
   * @private
   */
  _registerDefaultMiddlewares() {
    // 解析请求体
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // 请求日志中间件
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      // 记录请求开始
      logger.info(`${req.method} ${req.url} - ${req.ip}`);
      
      // 记录响应
      const originalSend = res.send;
      res.send = function(body) {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, body);
      };
      
      next();
    });
    
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        circuitBreakers: this.getCircuitBreakerStates()
      });
    });
  }
  
  /**
   * 注册路由
   * @private
   */
  _registerRoutes() {
    this.routes.forEach(({ path, config }) => {
      const { method = 'GET', handler, middlewares = [] } = config;
      
      // 注册带中间件的路由
      if (middlewares && middlewares.length > 0) {
        this.app[method.toLowerCase()](path, ...middlewares, handler);
      } else {
        this.app[method.toLowerCase()](path, handler);
      }
    });
  }
  
  /**
   * 初始化错误处理
   * @private
   */
  _initErrorHandler() {
    // 代理错误处理
    this.proxy.on('error', (err, req, res) => {
      logger.error(`代理错误: ${err.message}`);
      
      // 如果响应还未发送，发送错误响应
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Bad Gateway',
          message: '服务暂时不可用，请稍后再试'
        });
      }
    });
    
    // 应用错误处理
    this.app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message = err.message || '服务器内部错误';
      
      logger.error(`请求处理错误: ${statusCode} - ${message}`, err);
      
      res.status(statusCode).json({
        error: err.name || 'Error',
        message: message
      });
    });
  }
  
  /**
   * 转发请求
   * @private
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   * @param {Object} instance - 服务实例
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 选项
   */
  _forwardRequest(req, res, next, instance, serviceName, options = {}) {
    // 构建目标URL
    const target = options.target || ServiceDiscoveryUtils.buildServiceUrl(instance, req.path);
    
    logger.debug(`转发请求到: ${target}`);
    
    // 获取断路器
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    // 如果有断路器，通过断路器执行
    if (circuitBreaker) {
      circuitBreaker.execute(() => {
        return new Promise((resolve, reject) => {
          // 设置超时处理
          const timeout = setTimeout(() => {
            reject(new Error('请求超时'));
          }, options.timeout || 30000);
          
          // 转发请求
          this.proxy.web(req, res, { target }, (error) => {
            clearTimeout(timeout);
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }).catch(error => {
        logger.error(`断路器保护: ${serviceName} - ${error.message}`);
        next(new AppError(503, `服务 ${serviceName} 暂时不可用，请稍后再试`));
      });
    } else {
      // 直接转发
      this.proxy.web(req, res, { target }, next);
    }
  }
  
  /**
   * 启动定期清理
   * @private
   */
  _startCleanupInterval() {
    setInterval(() => {
      // 清理速率限制器
      this.rateLimiters.forEach(limiter => {
        limiter.cleanup();
      });
    }, 60000); // 每分钟清理一次
  }
}

module.exports = {
  EnhancedApiGateway,
  CircuitBreaker,
  RateLimiter,
  VERSION: '1.0.0'
};
