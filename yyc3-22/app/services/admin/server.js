/**
 * @file Admin 服务入口
 * @description 管理后台服务，提供基础 API 路由与健康探针
 * @module admin
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 * @updated 2025-11-02
 */

const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.static(__dirname + '/html'));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from admin.0379.email!' });
});

// 引入共享的状态接口模块（包含 healthcheck、status、version、metrics）
const statusRoutes = require('../shared/status');
app.use('/api', statusRoutes);

// 引入共享的文档模块，提供 Swagger 文档支持
const docsRoutes = require('../shared/docs');
app.get('/api/docs', (req, res) => {
  res.json(docsRoutes);
});

// 初始化Redis服务
const redisService = require('../shared/redis');

// 引入日志模块
const logger = console;

// 启动时初始化Redis（失败不阻塞API启动）
async function initializeServices() {
  try {
    const redisReady = await redisService.init();
    logger.info(`Redis service initialized: ${redisReady ? 'Connected' : 'Not connected'}`);
  } catch (error) {
    logger.error('Redis initialization error:', error);
  }
}

// 全局错误处理函数
function setupGlobalErrorHandlers() {
  // 错误处理中间件
  app.use((err, req, res, next) => {
    logger.error('Error occurred:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// 加载全局错误处理
setupGlobalErrorHandlers();

// 启动服务，绑定到本地回环地址，确保 Nginx 可代理
app.listen(PORT, HOST, async () => {
  await initializeServices();
  logger.info(`✅ Admin server running at http://${HOST}:${PORT}`);
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('接收到SIGTERM信号，准备关闭服务');
  
  // 断开Redis连接
  try {
    if (redisService && redisService.disconnect) {
      await redisService.disconnect();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  // 在这里可以添加清理逻辑，如关闭数据库连接等
  setTimeout(() => {
    logger.info('✅ Admin server gracefully stopped');
    process.exit(0);
  }, 500);
});
