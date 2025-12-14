/**
 * @file 服务状态监控模块
 * @description 提供健康检查、状态监控、性能指标收集和依赖监控功能
 * @module status
 * @author YYC
 * @version 2.0.0
 * @created 2025-11-02
 * @updated 2024-10-15
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const packageJson = require('../../package.json');

// 引入日志记录器
const { logger, getContext } = require('../logger');

// 尝试加载Redis服务（可选依赖）
let redisService;
try {
  redisService = require('../redis');
} catch (error) {
  logger.warn('Redis service not available:', error.message);
}

// 性能指标收集器
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byStatusCode: {},
        last: null,
        responseTimes: []
      },
      cpuUsage: [],
      memoryUsage: [],
      activeConnections: 0,
      peakConnections: 0,
      slowQueries: []
    };
    
    // 保留最近的指标
    this.maxSamples = 1000;
    
    // 启动指标收集
    this.startMetricsCollection();
  }
  
  // 开始定期收集指标
  startMetricsCollection() {
    // 每秒更新内存使用
    setInterval(() => this.recordMemoryUsage(), 1000);
  }
  
  // 记录请求
  recordRequest(statusCode, responseTime, path, method) {
    this.metrics.requests.total++;
    this.metrics.requests.last = new Date().toISOString();
    this.metrics.requests.responseTimes.push({
      time: Date.now(), 
      value: responseTime,
      path,
      method
    });
    
    // 限制样本数量
    if (this.metrics.requests.responseTimes.length > this.maxSamples) {
      this.metrics.requests.responseTimes.shift();
    }
    
    // 按状态码分类
    if (!this.metrics.requests.byStatusCode[statusCode]) {
      this.metrics.requests.byStatusCode[statusCode] = 0;
    }
    this.metrics.requests.byStatusCode[statusCode]++;
    
    // 成功/失败统计
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // 记录慢查询
    if (responseTime > 500) { // 500ms以上视为慢查询
      const context = getContext();
      this.metrics.slowQueries.push({
        timestamp: new Date().toISOString(),
        responseTime,
        statusCode,
        path,
        method,
        traceId: context?.traceId || null
      });
      
      // 限制慢查询记录数量
      if (this.metrics.slowQueries.length > this.maxSamples) {
        this.metrics.slowQueries.shift();
      }
      
      // 记录慢查询日志
      logger.warn(`慢查询警告: ${method} ${path} - ${responseTime}ms`, {
        traceId: context?.traceId,
        statusCode,
        responseTime
      });
    }
  }
  
  // 记录内存使用
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      time: Date.now(),
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external
    });
    if (this.metrics.memoryUsage.length > this.maxSamples) {
      this.metrics.memoryUsage.shift();
    }
  }
  
  // 更新连接数
  updateConnectionCount(count) {
    this.metrics.activeConnections = count;
    this.metrics.peakConnections = Math.max(this.metrics.peakConnections, count);
  }
  
  // 获取计算的指标
  getCalculatedMetrics() {
    const { requests, memoryUsage } = this.metrics;
    
    // 计算平均响应时间
    const avgResponseTime = requests.responseTimes.length > 0
      ? requests.responseTimes.reduce((sum, item) => sum + item.value, 0) / requests.responseTimes.length
      : 0;
    
    // 计算95%响应时间
    const p95ResponseTime = requests.responseTimes.length > 0
      ? [...requests.responseTimes]
          .sort((a, b) => a.value - b.value)
          [Math.floor(requests.responseTimes.length * 0.95)]?.value || 0
      : 0;
    
    // 内存使用趋势
    const latestMemory = memoryUsage[memoryUsage.length - 1];
    
    return {
      requestRate: {
        total: requests.total,
        successRate: requests.total > 0 ? (requests.success / requests.total * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        p95ResponseTime: p95ResponseTime.toFixed(2) + 'ms',
        statusCodeDistribution: requests.byStatusCode
      },
      memory: latestMemory ? {
        rss: (latestMemory.rss / 1024 / 1024).toFixed(2) + 'MB',
        heapUsed: (latestMemory.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        heapTotal: (latestMemory.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
      } : null,
      connections: {
        active: this.metrics.activeConnections,
        peak: this.metrics.peakConnections
      },
      slowQueriesCount: this.metrics.slowQueries.length
    };
  }
}

// 服务状态管理器
class ServiceStatusManager {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.metrics = new MetricsCollector();
    this.dependencies = {
      redis: {
        connected: false,
        latency: null,
        lastCheck: null,
        error: null,
        version: null
      },
      database: {
        connected: false,
        latency: null,
        lastCheck: null,
        error: null,
        poolStatus: {
          available: 0,
          total: 0,
          waitQueue: 0
        }
      },
      externalServices: {}
    };
    this.status = 'UP'; // UP, DEGRADED, DOWN
    
    // 启动依赖检查
    this.startDependencyChecks();
  }
  
  // 开始定期检查依赖
  startDependencyChecks() {
    // 定期检查依赖健康
    setInterval(() => this.checkAllDependencies(), 30000);
  }
  
  // 检查所有依赖
  async checkAllDependencies() {
    await Promise.all([
      this.checkRedisHealth(),
      this.checkDatabaseHealth()
    ]);
    this.updateOverallStatus();
  }
  
  // 获取服务状态
  getStatus() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return {
      startedAt: this.startedAt,
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      uptimeSeconds: uptime,
      status: this.status,
      version: packageJson.version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid
    };
  }
  
  // 获取详细状态（包含指标）
  getDetailedStatus() {
    return {
      ...this.getStatus(),
      metrics: this.metrics.getCalculatedMetrics(),
      dependencies: this.dependencies
    };
  }
  
  // 检查Redis健康状态
  async checkRedisHealth() {
    if (!redisService) {
      return {
        connected: false,
        latency: null,
        lastCheck: new Date().toISOString(),
        error: 'Redis service not available',
        version: null
      };
    }
    
    try {
      const startTime = Date.now();
      const isReady = await redisService.isReady();
      const latency = isReady ? Date.now() - startTime : null;
      const version = isReady ? await redisService.getVersion() : null;
      
      const redisStatus = {
        connected: isReady,
        latency: latency ? `${latency}ms` : null,
        lastCheck: new Date().toISOString(),
        error: null,
        version
      };
      
      // 更新Redis状态
      this.dependencies.redis = redisStatus;
      
      return redisStatus;
    } catch (error) {
      logger.error('Redis健康检查失败:', error);
      
      const errorStatus = {
        connected: false,
        latency: null,
        lastCheck: new Date().toISOString(),
        error: error.message,
        version: null
      };
      
      // 更新Redis状态
      this.dependencies.redis = errorStatus;
      
      return errorStatus;
    }
  }
  
  // 检查数据库健康状态（占位函数，实际项目中需实现）
  async checkDatabaseHealth() {
    try {
      // 这里应该实现实际的数据库连接检查
      // 暂时返回模拟数据
      
      const dbStatus = {
        connected: true,
        latency: '12ms',
        lastCheck: new Date().toISOString(),
        error: null,
        poolStatus: {
          available: 24,
          total: 25,
          waitQueue: 0
        }
      };
      
      // 更新数据库状态
      this.dependencies.database = dbStatus;
      
      return dbStatus;
    } catch (error) {
      logger.error('数据库健康检查失败:', error);
      
      const errorStatus = {
        connected: false,
        latency: null,
        lastCheck: new Date().toISOString(),
        error: error.message,
        poolStatus: {
          available: 0,
          total: 0,
          waitQueue: 0
        }
      };
      
      // 更新数据库状态
      this.dependencies.database = errorStatus;
      
      return errorStatus;
    }
  }
  
  // 更新整体状态
  updateOverallStatus() {
    const { redis, database } = this.dependencies;
    
    // 如果Redis和数据库都不可用，服务处于严重状态
    if (!redis.connected && !database.connected) {
      this.status = 'DOWN';
    }
    // 如果部分依赖不可用，服务处于降级状态
    else if (!redis.connected || !database.connected) {
      this.status = 'DEGRADED';
    }
    // 所有关键依赖都可用
    else {
      this.status = 'UP';
    }
  }
  
  // 注册外部服务健康检查
  registerExternalService(name, healthCheckFn) {
    if (!this.dependencies.externalServices[name]) {
      this.dependencies.externalServices[name] = {
        connected: false,
        latency: null,
        lastCheck: new Date().toISOString(),
        error: null
      };
      
      // 定期检查外部服务
      setInterval(async () => {
        try {
          const startTime = Date.now();
          const result = await healthCheckFn();
          const latency = Date.now() - startTime;
          
          this.dependencies.externalServices[name] = {
            connected: result.connected,
            latency: `${latency}ms`,
            lastCheck: new Date().toISOString(),
            error: null,
            details: result.details
          };
        } catch (error) {
          logger.error(`${name} 服务健康检查失败:`, error);
          this.dependencies.externalServices[name] = {
            connected: false,
            latency: null,
            lastCheck: new Date().toISOString(),
            error: error.message
          };
        }
        
        // 更新整体状态
        this.updateOverallStatus();
      }, 60000); // 每分钟检查一次
    }
  }
}

// 创建单例实例
const serviceStatusManager = new ServiceStatusManager();

// 请求跟踪中间件
function requestTrackerMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalEnd = res.end;
  const path = req.path;
  const method = req.method;
  
  // 更新连接数
  serviceStatusManager.metrics.updateConnectionCount(
    serviceStatusManager.metrics.metrics.activeConnections + 1
  );
  
  res.end = function() {
    const responseTime = Date.now() - startTime;
    
    // 记录请求
    serviceStatusManager.metrics.recordRequest(
      res.statusCode, 
      responseTime, 
      path, 
      method
    );
    
    // 更新连接数
    serviceStatusManager.metrics.updateConnectionCount(
      serviceStatusManager.metrics.metrics.activeConnections - 1
    );
    
    return originalEnd.apply(this, arguments);
  };
  
  next();
};

// 应用请求跟踪中间件
router.use(requestTrackerMiddleware);

/**
 * @description 健康检查接口 - 适合负载均衡器和Kubernetes使用
 * @route GET /api/health
 * @returns {object} 包含服务健康状态的对象
 */
router.get('/health', async (req, res) => {
  try {
    // 检查所有依赖
    await serviceStatusManager.checkAllDependencies();
    
    const { redis, database } = serviceStatusManager.dependencies;
    const overallStatus = serviceStatusManager.getStatus();
    
    const healthStatus = {
      status: overallStatus.status,
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'unknown',
      version: overallStatus.version,
      dependencies: {
        redis: {
          status: redis.connected ? 'UP' : 'DOWN',
          latency: redis.latency,
          version: redis.version
        },
        database: {
          status: database.connected ? 'UP' : 'DOWN',
          latency: database.latency
        }
      },
      // 添加关联ID支持
      traceId: getContext()?.traceId || null
    };
    
    // 添加外部服务状态
    if (Object.keys(serviceStatusManager.dependencies.externalServices).length > 0) {
      healthStatus.dependencies.externalServices = Object.entries(
        serviceStatusManager.dependencies.externalServices
      ).reduce((acc, [name, status]) => {
        acc[name] = {
          status: status.connected ? 'UP' : 'DOWN',
          latency: status.latency
        };
        return acc;
      }, {});
    }

    // 设置适当的状态码
    let statusCode = 200;
    if (healthStatus.status === 'DEGRADED') {
      statusCode = 503;
    } else if (healthStatus.status === 'DOWN') {
      statusCode = 503;
    }

    // 支持不同的响应格式
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(statusCode).json(healthStatus);
    } else {
      // 简单的文本响应，适合基本健康检查
      res.status(statusCode).send(healthStatus.status);
    }
  } catch (error) {
    logger.error('健康检查接口错误:', error, { traceId: getContext()?.traceId });
    
    const errorResponse = {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error.message,
      traceId: getContext()?.traceId || null
    };
    
    res.status(503).json(errorResponse);
  }
});

/**
 * @description 服务状态信息接口 - 提供详细的服务状态和性能指标
 * @route GET /api/status
 * @returns {object} 包含服务详细状态信息的对象
 */
router.get('/status', async (req, res) => {
  try {
    const detailedStatus = serviceStatusManager.getDetailedStatus();
    const context = getContext();
    
    // 获取系统资源信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuInfo = os.cpus();
    
    const status = {
      service: process.env.SERVICE_NAME || 'unknown',
      version: detailedStatus.version,
      nodeVersion: process.version,
      environment: detailedStatus.environment,
      uptime: {
        seconds: detailedStatus.uptimeSeconds,
        formatted: detailedStatus.uptime
      },
      status: detailedStatus.status,
      host: {
        name: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: cpuInfo.length,
        memory: {
          free: freeMemory,
          freeFormatted: `${(freeMemory / 1024 / 1024).toFixed(2)} MB`,
          total: totalMemory,
          totalFormatted: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
          usage: 1 - (freeMemory / totalMemory),
          usagePercent: `${((1 - (freeMemory / totalMemory)) * 100).toFixed(2)}%`
        },
        cpuModel: cpuInfo[0]?.model || 'unknown'
      },
      dependencies: detailedStatus.dependencies,
      metrics: detailedStatus.metrics,
      traceId: context?.traceId || null,
      requestId: context?.requestId || null
    };
    
    res.json(status);
  } catch (error) {
    logger.error('状态接口错误:', error, { traceId: getContext()?.traceId });
    res.status(500).json({
      status: 'error',
      error: error.message,
      traceId: getContext()?.traceId || null
    });
  }
});

/**
 * @description 版本信息接口
 * @route GET /api/version
 * @returns {object} 包含版本信息的对象
 */
router.get('/version', (req, res) => {
  const context = getContext();
  res.json({
    version: packageJson.version || '1.0.0',
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
    commitHash: process.env.COMMIT_HASH || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'unknown',
    traceId: context?.traceId || null
  });
});

/**
 * @description 性能指标接口 - 提供详细的性能和监控指标
 * @route GET /api/metrics
 * @returns {object} 包含性能指标的对象
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = serviceStatusManager.metrics.getCalculatedMetrics();
    const status = serviceStatusManager.getStatus();
    const context = getContext();
    
    // 获取当前内存使用
    const currentMemoryUsage = process.memoryUsage();
    
    const response = {
      timestamp: new Date().toISOString(),
      uptime: status.uptime,
      serviceId: `${status.environment}-${status.pid}-${process.env.SERVICE_NAME || 'unknown'}`,
      metrics: {
        ...metrics,
        currentMemory: {
          rss: `${(currentMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(currentMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(currentMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(currentMemoryUsage.external / 1024 / 1024).toFixed(2)} MB`
        },
        hostInfo: {
          platform: os.platform(),
          arch: os.arch(),
          cpuCount: os.cpus().length
        }
      },
      traceId: context?.traceId || null
    };
    
    res.json(response);
  } catch (error) {
    logger.error('指标接口错误:', error, { traceId: getContext()?.traceId });
    res.status(500).json({
      status: 'error',
      error: error.message,
      traceId: getContext()?.traceId || null
    });
  }
});

/**
 * @description 依赖状态详情接口
 * @route GET /api/dependencies
 * @returns {object} 包含所有依赖状态的对象
 */
router.get('/dependencies', async (req, res) => {
  try {
    // 强制刷新依赖状态
    await serviceStatusManager.checkAllDependencies();
    const context = getContext();
    
    res.json({
      timestamp: new Date().toISOString(),
      dependencies: serviceStatusManager.dependencies,
      traceId: context?.traceId || null
    });
  } catch (error) {
    logger.error('依赖状态接口错误:', error, { traceId: getContext()?.traceId });
    res.status(500).json({
      status: 'error',
      error: error.message,
      traceId: getContext()?.traceId || null
    });
  }
});

/**
 * @description 慢查询监控接口
 * @route GET /api/slow-queries
 * @returns {object} 包含慢查询记录的对象
 */
router.get('/slow-queries', (req, res) => {
  try {
    // 获取最近的慢查询记录
    const limit = parseInt(req.query.limit) || 50;
    const slowQueries = serviceStatusManager.metrics.metrics.slowQueries
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const context = getContext();
    
    res.json({
      timestamp: new Date().toISOString(),
      totalSlowQueries: serviceStatusManager.metrics.metrics.slowQueries.length,
      recentSlowQueries: slowQueries,
      traceId: context?.traceId || null
    });
  } catch (error) {
    logger.error('慢查询接口错误:', error, { traceId: getContext()?.traceId });
    res.status(500).json({
      status: 'error',
      error: error.message,
      traceId: getContext()?.traceId || null
    });
  }
});

// 初始化服务状态监控
function initializeStatusMonitoring(app) {
  // 注册状态路由
  app.use('/api', router);
  
  logger.info('服务状态监控模块已初始化');
  
  // 初始健康检查
  serviceStatusManager.checkAllDependencies().then(() => {
    logger.info(`初始健康检查结果: ${serviceStatusManager.status}`);
  }).catch(error => {
    logger.error('初始健康检查失败:', error);
  });
}

module.exports = {
  router,
  initializeStatusMonitoring,
  serviceStatusManager,
  registerExternalService: (name, healthCheckFn) => 
    serviceStatusManager.registerExternalService(name, healthCheckFn),
  requestTrackerMiddleware
};
