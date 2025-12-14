/**
 * @file 统一API网关模块
 * @description 提供认证、路由、限流、请求验证、跨域等API网关核心功能
 * @module gateway
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { validationMiddleware } = require('../validation');
const { logger, getContext, setContext } = require('../logger');
const { createAppError } = require('../errorHandler');

/**
 * API网关类
 * 提供统一的API管理功能
 */
class ApiGateway {
  constructor() {
    this.app = express();
    this.config = {
      enableCors: process.env.ENABLE_CORS !== 'false',
      enableHelmet: process.env.ENABLE_HELMET !== 'false',
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
      rateLimitMax: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
      enableRequestValidation: process.env.ENABLE_REQUEST_VALIDATION !== 'false',
      apiVersion: process.env.API_VERSION || 'v1',
      serviceName: process.env.SERVICE_NAME || 'api-gateway'
    };
    this.routes = new Map();
    this.validators = new Map();
    this.authStrategies = new Map();
    this.middlewares = [];
    this.errorHandlers = [];
    this.isInitialized = false;
  }

  /**
   * 初始化API网关
   * @returns {express.Application} Express应用实例
   */
  initialize() {
    if (this.isInitialized) {
      return this.app;
    }

    // 基础中间件配置
    this._setupMiddleware();
    
    // 全局请求处理中间件
    this._setupGlobalMiddleware();
    
    // 注册路由
    this._registerRoutes();
    
    // 错误处理
    this._setupErrorHandlers();
    
    this.isInitialized = true;
    logger.info('API网关初始化完成', this.config);
    
    return this.app;
  }

  /**
   * 设置基础中间件
   * @private
   */
  _setupMiddleware() {
    // 请求解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 安全增强中间件
    if (this.config.enableHelmet) {
      this.app.use(helmet());
      logger.info('安全中间件已启用');
    }
    
    // CORS配置
    if (this.config.enableCors) {
      const corsOptions = this._getCorsOptions();
      this.app.use(cors(corsOptions));
      logger.info('CORS中间件已启用', { origins: corsOptions.origin });
    }
  }

  /**
   * 设置全局中间件
   * @private
   */
  _setupGlobalMiddleware() {
    // 请求追踪中间件
    this.app.use((req, res, next) => {
      try {
        // 设置上下文信息
        const context = {
          traceId: req.headers['x-trace-id'] || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          spanId: `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startTime: Date.now(),
          clientIp: this._getClientIp(req),
          userAgent: req.headers['user-agent'],
          path: req.path,
          method: req.method
        };
        
        setContext(context);
        
        // 添加到响应头
        res.setHeader('x-trace-id', context.traceId);
        res.setHeader('x-request-id', context.requestId);
        
        // 记录请求开始
        logger.info('API请求开始', {
          method: req.method,
          path: req.path,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          clientIp: context.clientIp,
          userAgent: context.userAgent
        });
        
        // 响应结束时记录
        const originalSend = res.send;
        res.send = function(body) {
          const responseTime = Date.now() - context.startTime;
          
          logger.info('API请求完成', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: responseTime,
            contentLength: body ? body.length : 0
          });
          
          return originalSend.call(this, body);
        };
        
        next();
      } catch (error) {
        logger.error('请求追踪中间件错误:', error);
        next();
      }
    });
    
    // 全局限流中间件
    if (this.config.enableRateLimit) {
      const limiter = rateLimit({
        windowMs: this.config.rateLimitWindowMs,
        max: this.config.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { 
          error: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        keyGenerator: (req) => this._getClientIp(req),
        handler: (req, res) => {
          const error = createAppError(429, '请求过于频繁，请稍后再试', {
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
          });
          
          res.status(error.statusCode).json(error.toResponse());
        }
      });
      
      this.app.use(limiter);
      logger.info('全局限流中间件已启用', {
        windowMs: this.config.rateLimitWindowMs,
        maxRequests: this.config.rateLimitMax
      });
    }
  }

  /**
   * 注册路由
   * @private
   */
  _registerRoutes() {
    // API版本前缀路由组
    const apiRouter = express.Router();
    
    // 注册所有路由
    for (const [path, routeConfig] of this.routes.entries()) {
      const { method, handler, auth, middlewares = [], validator } = routeConfig;
      
      // 构建中间件链
      const middlewareChain = [];
      
      // 认证中间件
      if (auth) {
        if (typeof auth === 'string') {
          const strategy = this.authStrategies.get(auth);
          if (strategy) {
            middlewareChain.push(strategy);
          } else {
            logger.warn(`未找到认证策略: ${auth}`);
          }
        } else if (typeof auth === 'function') {
          middlewareChain.push(auth);
        }
      }
      
      // 请求验证中间件
      if (validator && this.config.enableRequestValidation) {
        middlewareChain.push(validationMiddleware(validator));
      }
      
      // 自定义中间件
      middlewareChain.push(...middlewares);
      
      // 注册到路由
      apiRouter[method.toLowerCase()](path, ...middlewareChain, this._wrapHandler(handler));
      logger.info(`路由已注册: ${method} ${path}`, {
        auth: auth ? (typeof auth === 'string' ? auth : 'custom') : 'none',
        hasValidator: !!validator
      });
    }
    
    // 应用API路由
    this.app.use(`/api/${this.config.apiVersion}`, apiRouter);
    
    // 404处理
    this.app.use((req, res, next) => {
      next(createAppError(404, 'API路径不存在', { 
        code: 'NOT_FOUND',
        path: req.path
      }));
    });
  }

  /**
   * 设置错误处理器
   * @private
   */
  _setupErrorHandlers() {
    // 应用自定义错误处理器
    this.errorHandlers.forEach(handler => {
      this.app.use(handler);
    });
    
    // 默认错误处理器
    this.app.use((error, req, res, next) => {
      const context = getContext();
      
      // 确保是AppError类型
      const appError = error.isAppError ? error : createAppError(
        500, 
        '服务器内部错误', 
        { 
          code: 'INTERNAL_ERROR',
          originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      );
      
      // 记录错误
      logger.error('API错误:', appError, {
        path: req.path,
        method: req.method,
        traceId: context?.traceId
      });
      
      // 安全响应（不暴露内部错误详情）
      const response = appError.toResponse();
      
      // 设置状态码
      res.status(appError.statusCode).json(response);
    });
  }

  /**
   * 获取CORS配置
   * @private
   */
  _getCorsOptions() {
    const corsOptions = {
      origin: '*', // 默认允许所有来源
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Trace-Id',
        'X-Request-Id',
        'X-API-Key'
      ],
      exposedHeaders: ['X-Trace-Id', 'X-Request-Id'],
      credentials: true,
      maxAge: 86400 // 预检请求结果缓存24小时
    };
    
    // 如果配置了特定的CORS来源
    if (process.env.CORS_ORIGINS) {
      const origins = process.env.CORS_ORIGINS.split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
      
      if (origins.length > 0) {
        corsOptions.origin = origins;
      }
    }
    
    return corsOptions;
  }

  /**
   * 获取客户端IP地址
   * @private
   */
  _getClientIp(req) {
    return req.headers['x-forwarded-for'] 
      || req.connection.remoteAddress 
      || req.ip;
  }

  /**
   * 包装处理函数，添加错误捕获
   * @private
   */
  _wrapHandler(handler) {
    return async (req, res, next) => {
      try {
        const result = await handler(req, res, next);
        
        // 如果处理函数没有直接返回响应，自动处理
        if (result !== undefined && !res.headersSent) {
          if (result instanceof Error) {
            throw result;
          }
          
          // 标准化响应格式
          res.json({
            success: true,
            data: result,
            meta: {
              traceId: getContext()?.traceId,
              requestId: getContext()?.requestId
            }
          });
        }
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 注册路由
   * @param {string} path - 路由路径
   * @param {string} method - HTTP方法
   * @param {Function} handler - 处理函数
   * @param {object} options - 路由选项
   * @returns {ApiGateway} 实例本身（支持链式调用）
   */
  route(path, method, handler, options = {}) {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    
    this.routes.set(path, {
      method: method.toUpperCase(),
      handler,
      auth: options.auth,
      middlewares: options.middlewares || [],
      validator: options.validator,
      description: options.description,
      tags: options.tags
    });
    
    return this;
  }

  /**
   * 注册GET路由
   */
  get(path, handler, options = {}) {
    return this.route(path, 'GET', handler, options);
  }

  /**
   * 注册POST路由
   */
  post(path, handler, options = {}) {
    return this.route(path, 'POST', handler, options);
  }

  /**
   * 注册PUT路由
   */
  put(path, handler, options = {}) {
    return this.route(path, 'PUT', handler, options);
  }

  /**
   * 注册DELETE路由
   */
  delete(path, handler, options = {}) {
    return this.route(path, 'DELETE', handler, options);
  }

  /**
   * 注册PATCH路由
   */
  patch(path, handler, options = {}) {
    return this.route(path, 'PATCH', handler, options);
  }

  /**
   * 添加全局中间件
   * @param {Function} middleware - 中间件函数
   * @returns {ApiGateway} 实例本身
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 添加错误处理器
   * @param {Function} handler - 错误处理函数
   * @returns {ApiGateway} 实例本身
   */
  error(handler) {
    this.errorHandlers.push(handler);
    return this;
  }

  /**
   * 注册认证策略
   * @param {string} name - 策略名称
   * @param {Function} strategy - 认证中间件函数
   * @returns {ApiGateway} 实例本身
   */
  registerAuthStrategy(name, strategy) {
    this.authStrategies.set(name, strategy);
    logger.info(`认证策略已注册: ${name}`);
    return this;
  }

  /**
   * 注册JWT认证策略
   * @param {Function} verifyToken - 验证token的函数
   * @returns {ApiGateway} 实例本身
   */
  registerJwtAuthStrategy(verifyToken) {
    const jwtStrategy = async (req, res, next) => {
      try {
        // 从请求头获取token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          throw createAppError(401, '缺少认证信息', { code: 'MISSING_AUTH_HEADER' });
        }
        
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
          throw createAppError(401, '认证格式错误', { code: 'INVALID_AUTH_FORMAT' });
        }
        
        // 验证token
        const user = await verifyToken(token);
        if (!user) {
          throw createAppError(401, '无效的认证信息', { code: 'INVALID_AUTH_TOKEN' });
        }
        
        // 将用户信息保存到请求对象
        req.user = user;
        
        // 更新上下文
        const context = getContext();
        if (context) {
          context.userId = user.id || user.userId;
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
    
    return this.registerAuthStrategy('jwt', jwtStrategy);
  }

  /**
   * 注册API密钥认证策略
   * @param {Function} validateApiKey - 验证API密钥的函数
   * @returns {ApiGateway} 实例本身
   */
  registerApiKeyAuthStrategy(validateApiKey) {
    const apiKeyStrategy = async (req, res, next) => {
      try {
        // 从请求头获取API密钥
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
          throw createAppError(401, '缺少API密钥', { code: 'MISSING_API_KEY' });
        }
        
        // 验证API密钥
        const apiClient = await validateApiKey(apiKey);
        if (!apiClient) {
          throw createAppError(401, '无效的API密钥', { code: 'INVALID_API_KEY' });
        }
        
        // 将API客户端信息保存到请求对象
        req.apiClient = apiClient;
        
        // 更新上下文
        const context = getContext();
        if (context) {
          context.clientId = apiClient.id || apiClient.clientId;
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
    
    return this.registerAuthStrategy('apiKey', apiKeyStrategy);
  }

  /**
   * 创建资源路由（CRUD）
   * @param {string} basePath - 基础路径
   * @param {object} controllers - 控制器对象
   * @param {object} options - 选项
   * @returns {ApiGateway} 实例本身
   */
  resource(basePath, controllers, options = {}) {
    const { get, post, put, delete: del, patch } = controllers;
    const auth = options.auth || null;
    const validators = options.validators || {};
    
    // GET /resource - 获取资源列表
    if (get) {
      this.get(basePath, get, {
        auth,
        validator: validators.list,
        description: options.descriptions?.list || '获取资源列表'
      });
    }
    
    // POST /resource - 创建资源
    if (post) {
      this.post(basePath, post, {
        auth,
        validator: validators.create,
        description: options.descriptions?.create || '创建新资源'
      });
    }
    
    // GET /resource/:id - 获取单个资源
    if (get) {
      this.get(`${basePath}/:id`, (req, res, next) => {
        req.params.id = req.params.id;
        return get(req, res, next);
      }, {
        auth,
        validator: validators.get,
        description: options.descriptions?.get || '获取单个资源'
      });
    }
    
    // PUT /resource/:id - 更新资源
    if (put) {
      this.put(`${basePath}/:id`, put, {
        auth,
        validator: validators.update,
        description: options.descriptions?.update || '更新资源'
      });
    }
    
    // PATCH /resource/:id - 部分更新资源
    if (patch) {
      this.patch(`${basePath}/:id`, patch, {
        auth,
        validator: validators.patch,
        description: options.descriptions?.patch || '部分更新资源'
      });
    }
    
    // DELETE /resource/:id - 删除资源
    if (del) {
      this.delete(`${basePath}/:id`, del, {
        auth,
        validator: validators.delete,
        description: options.descriptions?.delete || '删除资源'
      });
    }
    
    return this;
  }

  /**
   * 获取OpenAPI规范
   * @returns {object} OpenAPI规范对象
   */
  getOpenApiSpec() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: this.config.serviceName,
        version: this.config.apiVersion,
        description: `${this.config.serviceName} API文档`
      },
      paths: {}
    };
    
    // 转换路由到OpenAPI路径
    for (const [path, routeConfig] of this.routes.entries()) {
      const openApiPath = path.replace(/:([^/]+)/g, '{$1}');
      
      if (!spec.paths[openApiPath]) {
        spec.paths[openApiPath] = {};
      }
      
      spec.paths[openApiPath][routeConfig.method.toLowerCase()] = {
        summary: routeConfig.description || routeConfig.method + ' ' + path,
        tags: routeConfig.tags || ['default'],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {}
            }
          }
        }
      };
    }
    
    return spec;
  }

  /**
   * 启动OpenAPI文档路由
   * @returns {ApiGateway} 实例本身
   */
  enableApiDocs() {
    this.get('/docs', (req, res) => {
      res.json(this.getOpenApiSpec());
    }, {
      description: '获取OpenAPI规范文档'
    });
    
    return this;
  }
}

// 创建单例实例
const apiGateway = new ApiGateway();

// 导出
module.exports = {
  ApiGateway,
  apiGateway,
  createGateway: () => new ApiGateway()
};
