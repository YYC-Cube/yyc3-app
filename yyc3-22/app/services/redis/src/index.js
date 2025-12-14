/**
 * @file Redis API服务主入口
 * @description Express应用配置和路由管理
 * @module index
 * @author YYC
 * @version 2.0.0
 * @created 2024-01-15
 * @updated 2024-01-15
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const expressWinston = require('express-winston');
const redisService = require('./services/redis');

// 引入共享监控模块
const { getMonitoringManager } = require('../../shared/monitoring');
const { initializeStatusMonitoring } = require('../../shared/status');

// 初始化监控管理器
const monitoringManager = getMonitoringManager({ enabled: true, enablePrometheusExporter: false });

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/redis/api.log' })
  ]
});

const app = express();
const port = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('[Rate Limit] 超出请求限制', { ip: req.ip, path: req.path });
    res.status(429).json({ 
      status: 'ERROR', 
      error: '请求频率过高，请稍后再试' 
    });
  }
});
app.use(limiter);

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  colorize: false
}));

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查Redis连接
    const redisPing = await redisService.ping();
    
    // 获取Redis信息
    const redisInfo = await redisService.info('server');
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      redis: {
        ping: redisPing,
        version: redisInfo.match(/redis_version:(\d+\.\d+\.\d+)/)?.[1] || '未知'
      },
      server: {
        port: port,
        uptime: process.uptime()
      }
    });
    
    logger.info('[Health Check] 系统健康状态正常');
  } catch (err) {
    logger.error('[Health Check] 系统健康状态异常', { error: err.message });
    res.status(500).json({
      status: 'ERROR',
      error: '系统健康检查失败',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Redis基本操作端点

// 设置缓存
app.post('/api/cache', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ 
        status: 'ERROR', 
        error: 'key和value是必填字段' 
      });
    }
    
    await redisService.set(key, value, ttl);
    
    res.status(200).json({ 
      status: 'OK', 
      message: '缓存设置成功',
      key: key
    });
    
    logger.info('[Cache] 设置缓存成功', { key });
  } catch (err) {
    logger.error('[Cache] 设置缓存失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '设置缓存失败',
      details: err.message
    });
  }
});

// 获取缓存
app.get('/api/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisService.get(key);
    
    if (value !== null) {
      res.status(200).json({ 
        status: 'OK', 
        data: value,
        key: key
      });
      logger.info('[Cache] 获取缓存成功', { key });
    } else {
      res.status(404).json({ 
        status: 'NOT_FOUND', 
        error: '缓存未命中',
        key: key
      });
      logger.debug('[Cache] 缓存未命中', { key });
    }
  } catch (err) {
    logger.error('[Cache] 获取缓存失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '获取缓存失败',
      details: err.message
    });
  }
});

// 删除缓存
app.delete('/api/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await redisService.del(key);
    
    res.status(200).json({ 
      status: 'OK', 
      message: '缓存删除成功',
      key: key,
      affected: result
    });
    
    logger.info('[Cache] 删除缓存成功', { key, affected: result });
  } catch (err) {
    logger.error('[Cache] 删除缓存失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '删除缓存失败',
      details: err.message
    });
  }
});

// 批量获取缓存
app.post('/api/cache/batch', async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys)) {
      return res.status(400).json({ 
        status: 'ERROR', 
        error: 'keys必须是数组' 
      });
    }
    
    const values = await redisService.mget(keys);
    
    res.status(200).json({ 
      status: 'OK', 
      data: keys.reduce((acc, key, index) => {
        acc[key] = values[index];
        return acc;
      }, {})
    });
    
    logger.info('[Cache] 批量获取缓存成功', { keys: keys.length });
  } catch (err) {
    logger.error('[Cache] 批量获取缓存失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '批量获取缓存失败',
      details: err.message
    });
  }
});

// 清空命名空间
app.delete('/api/cache/namespace', async (req, res) => {
  try {
    const keysCount = await redisService.flushNamespace();
    
    res.status(200).json({ 
      status: 'OK', 
      message: '命名空间清空成功',
      cleared: keysCount
    });
    
    logger.info('[Cache] 命名空间清空成功', { cleared: keysCount });
  } catch (err) {
    logger.error('[Cache] 命名空间清空失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '清空命名空间失败',
      details: err.message
    });
  }
});

// Redis信息端点
app.get('/api/redis/info', async (req, res) => {
  try {
    const { section } = req.query;
    const info = await redisService.info(section);
    
    // 将info字符串转换为对象
    const infoObject = info.split('\r\n')
      .filter(line => line && !line.startsWith('#') && line.includes(':'))
      .reduce((acc, line) => {
        const [key, value] = line.split(':');
        acc[key] = value;
        return acc;
      }, {});
    
    res.status(200).json({ 
      status: 'OK', 
      data: infoObject
    });
    
    logger.info('[Redis] 获取信息成功', { section });
  } catch (err) {
    logger.error('[Redis] 获取信息失败', { error: err.message });
    res.status(500).json({ 
      status: 'ERROR', 
      error: '获取Redis信息失败',
      details: err.message
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  logger.warn('[404] 资源未找到', { ip: req.ip, path: req.path });
  res.status(404).json({ 
    status: 'ERROR', 
    error: '请求的资源未找到' 
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('[Error] 未处理的错误', { 
    error: err.message, 
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ 
    status: 'ERROR', 
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
let server;

async function startServer() {
  try {
    // 初始化Redis连接
    await redisService.init();
    
    // 初始化状态监控
    initializeStatusMonitoring(app);
    
    server = app.listen(port, () => {
      logger.info(`[Server] Redis API服务已启动`, { port });
      logger.info(`[Server] 健康检查: http://localhost:${port}/health`);
      logger.info(`[Server] 监控指标: http://localhost:${port}/metrics`);
      logger.info(`[Server] 服务状态: http://localhost:${port}/status`);
    });
    
    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('[Server] 收到SIGTERM信号，正在关闭服务...');
      shutdownServer();
    });
    
    process.on('SIGINT', () => {
      logger.info('[Server] 收到SIGINT信号，正在关闭服务...');
      shutdownServer();
    });
    
  } catch (err) {
    logger.error('[Server] 启动失败', { error: err.message });
    process.exit(1);
  }
}

async function shutdownServer() {
  try {
    // 关闭Redis连接
    await redisService.close();
    
    // 关闭服务器
    server.close(() => {
      logger.info('[Server] Redis API服务已关闭');
      process.exit(0);
    });
    
    // 超时强制关闭
    setTimeout(() => {
      logger.error('[Server] 关闭超时，强制退出');
      process.exit(1);
    }, 10000);
    
  } catch (err) {
    logger.error('[Server] 关闭失败', { error: err.message });
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;