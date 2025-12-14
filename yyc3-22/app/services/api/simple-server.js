// =============================================================================
// 0379.email API 服务 - 简化版
// =============================================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 压缩中间件
app.use(compression());

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '0379.email API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.get('/api', (req, res) => {
  res.json({
    message: '0379.email API 服务运行正常',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/status',
      '/api/users',
      '/api/email',
      '/api/files'
    ]
  });
});

// 状态检查
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    service: '0379.email API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    database: {
      connected: process.env.DB_HOST ? 'configured' : 'not configured',
      host: process.env.DB_HOST || 'N/A',
      port: process.env.DB_PORT || 'N/A'
    },
    redis: {
      connected: process.env.REDIS_HOST ? 'configured' : 'not configured',
      host: process.env.REDIS_HOST || 'N/A',
      port: process.env.REDIS_PORT || 'N/A'
    }
  });
});

// 用户路由
app.get('/api/users', (req, res) => {
  res.json({
    message: '用户API端点',
    service: 'users',
    status: 'operational'
  });
});

// 邮件路由
app.get('/api/email', (req, res) => {
  res.json({
    message: '邮件API端点',
    service: 'email',
    status: 'operational',
    features: ['send', 'receive', 'template']
  });
});

// 文件路由
app.get('/api/files', (req, res) => {
  res.json({
    message: '文件API端点',
    service: 'files',
    status: 'operational',
    features: ['upload', 'download', 'list']
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '端点未找到',
    message: `无法找到 ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 0379.email API 服务运行在端口 ${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🌐 API端点: http://localhost:${PORT}/api`);
  console.log(`🔍 状态检查: http://localhost:${PORT}/api/status`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;