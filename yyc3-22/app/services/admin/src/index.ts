/**
 * @file Admin 服务入口
 * @description 管理后台服务，提供基础 API 路由与健康探针
 * @module admin
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 * @updated 2025-11-02
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { configureRedis } from './config/redis';
import { initializeLogger, logInfo, logError } from './utils/logger';
import { healthCheckRoutes } from './routes/health';

// 初始化日志器
initializeLogger();

// 创建Express应用
const app = express();

// 配置安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  xssFilter: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
}));

// 配置CORS
app.use(cors({
  origin: env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(',').map((origin: string) => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// 解析JSON请求体
app.use(express.json({
  limit: '10mb',
}));

// 解析URL编码请求体
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 配置路由
app.use('/health', healthCheckRoutes);

// 示例路由
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from admin.0379.email!' });
});

// 404错误处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('全局错误:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 启动服务器
const startServer = async () => {
  try {
    // 配置Redis
    await configureRedis();
    
    // 启动服务器
    app.listen(Number(env.PORT), env.HOST, () => {
      logInfo(`✅ Admin server running at http://${env.HOST}:${env.PORT}`);
      logInfo(`📦 Environment: ${env.NODE_ENV}`);
      logInfo(`🧪 Health check: http://${env.HOST}:${env.PORT}/health`);
    });
  } catch (error) {
    logError('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logInfo('接收到SIGTERM信号，准备关闭服务');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('接收到SIGINT信号，准备关闭服务');
  process.exit(0);
});