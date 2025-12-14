/**
 * @file API 服务入口
 * @description 提供静态资源与基础 API 路由，集成验证、安全和监控
 * @module api
 * @author YYC
 * @version 2.0.0
 * @created 2025-11-02
 * @updated 2024-10-15
 */

const express = require('express');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 设置环境变量
process.env.SERVICE_NAME = 'api';

// 引入共享模块
const { logger, logRequest, setupRequestContext } = require('../shared/logger');
const { errorHandler, notFoundHandler, setupGlobalErrorHandlers, createAppError } = require('../shared/errorHandler');
const { apiValidator, paginationValidator } = require('./middleware/validation');
// 引入监控模块
const { getMonitoringManager } = require('../shared/monitoring');
const { initializeStatusMonitoring } = require('../shared/status');
// 初始化监控管理器
const monitoringManager = getMonitoringManager({ enabled: true, enablePrometheusExporter: false });

// 初始化服务
const redisService = require('../shared/redis');
const cacheService = require('../shared/cache');
const { loggerAggregator } = require('../shared/logging/logger-aggregator');

// 安全配置
const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP限制请求数
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Trace-ID']
  }
};

// 配置速率限制中间件
const limiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  onLimitReached: (req, res, options) => {
    logger.warn('速率限制触发', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
  }
});

// 启动时初始化所有服务
async function initializeServices() {
  try {
    logger.info('开始初始化服务...');
    
    // 初始化日志聚合器
    loggerAggregator.initialize();
    logger.info('日志聚合器初始化完成');
    
    // 初始化Redis服务
    const redisReady = await redisService.init();
    logger.info(`Redis服务初始化: ${redisReady ? '已连接' : '未连接'}`);
    
    // 如果Redis连接成功，初始化缓存服务
    if (redisReady) {
      await cacheService.initialize();
      logger.info('缓存服务初始化完成');
    }
    
    logger.info('所有服务初始化完成');
  } catch (error) {
    logger.error('服务初始化错误:', error);
    throw error;
  }
}

// 设置全局错误处理
setupGlobalErrorHandlers();

// 安全中间件
app.use(helmet()); // 设置安全HTTP头
app.use(cors(securityConfig.cors)); // 配置CORS
app.use(express.json({ limit: '1mb' })); // 解析JSON请求体，限制大小
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // 解析URL编码的请求体

// 请求上下文中间件
app.use(setupRequestContext);

// 请求日志中间件
app.use(logRequest);

// 速率限制中间件（应用于所有API路由）
app.use('/api/', limiter);

// 提供静态资源（如 HTML、JS、CSS）
app.use(express.static(__dirname + '/html'));

// API健康检查端点（无需速率限制）
app.get('/health', async (req, res) => {
  try {
    const redisHealth = await redisService.getHealthStatus();
    const cacheStats = await cacheService.getStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME,
      version: process.env.VERSION || '1.0.0',
      hostname: os.hostname(),
      redis: {
        status: redisHealth.status,
        connected: redisHealth.connected,
        latency: redisHealth.latency + 'ms',
        uptime: redisHealth.uptime
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate + '%',
        memoryUsage: cacheStats.memoryUsage
      }
    });
  } catch (error) {
    logger.error('健康检查失败', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 示例API路由 - 使用验证中间件
app.get('/api/hello', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Hello from api.0379.email!',
      version: '2.0.0'
    }
  });
});

// 分页示例路由
app.get('/api/examples', paginationValidator, async (req, res, next) => {
  try {
    // 访问验证后的数据
    const { page, limit, sortBy, sortOrder } = req.validatedData;
    
    // 模拟数据获取
    const examples = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `Example ${(page - 1) * limit + i + 1}`,
      createdAt: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: examples,
      meta: {
        page,
        limit,
        total: 100,
        totalPages: Math.ceil(100 / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 引入共享的状态接口模块（包含 healthcheck、status、version、metrics）
const statusRoutes = require('../shared/status');
app.use('/api', statusRoutes);

// 引入共享的文档模块，提供 Swagger 文档支持
const docsRoutes = require('../shared/docs');
app.get('/api/docs', (req, res) => {
  res.json(docsRoutes);
});

// 未找到路由处理
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 启动服务
async function startServer() {
  try {
    // 初始化所有服务
    await initializeServices();
    
    // 初始化状态监控
    initializeStatusMonitoring(app);
    
    // 启动HTTP服务
    const server = app.listen(PORT, HOST, () => {
      logger.info(`✅ API服务器运行在 http://${HOST}:${PORT}`);
      logger.info(`✅ 健康检查: http://${HOST}:${PORT}/health`);
      logger.info(`✅ API文档: http://${HOST}:${PORT}/api/docs`);
      logger.info(`✅ 监控指标: http://${HOST}:${PORT}/api/metrics`);
      logger.info(`✅ 服务状态: http://${HOST}:${PORT}/api/status`);
    });
    
    // 监听错误事件
    server.on('error', (error) => {
      logger.critical('API服务器启动失败', { error: error.message, code: error.code });
      process.exit(1);
    });
    
    // 监听客户端连接事件
    server.on('connection', (socket) => {
      socket.setTimeout(60000); // 设置超时时间为60秒
    });
    
    return server;
  } catch (error) {
    logger.critical('服务启动失败', { error: error.message });
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`接收到${signal}信号，准备优雅关闭服务...`);
  
  try {
    // 记录关闭开始时间
    const startTime = Date.now();
    
    // 停止接收新请求（如果有server引用）
    if (global.apiServer) {
      await new Promise((resolve) => {
        global.apiServer.close(resolve);
      });
      logger.info('HTTP服务器已停止接收新请求');
    }
    
    // 断开服务连接
    await Promise.allSettled([
      // 断开Redis连接
      redisService.disconnect().then(() => {
        logger.info('Redis连接已关闭');
      }),
      
      // 刷新日志
      new Promise((resolve) => {
        logger.flush(() => {
          logger.info('日志已刷新');
          resolve();
        });
      }),
      
      // 停止日志聚合器
      loggerAggregator.shutdown().then(() => {
        logger.info('日志聚合器已停止');
      })
    ]);
    
    // 计算关闭时间
    const shutdownTime = Date.now() - startTime;
    logger.info(`服务已成功关闭，耗时: ${shutdownTime}ms`);
    
    // 安全退出
    process.exit(0);
  } catch (error) {
    logger.error('优雅关闭过程中发生错误', { error: error.message });
    // 强制退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// 启动服务器并保存引用
startServer().then((server) => {
  global.apiServer = server;
});

// 导出app用于测试
module.exports = app;
