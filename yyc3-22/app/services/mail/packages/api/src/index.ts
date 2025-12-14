/**
 * @file API服务主入口
 * @description 0379邮件平台API服务启动入口
 * @module index
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { authRoutes } from './routes/authRoutes';
import { mailRoutes } from './routes/mailRoutes';
import { aiRoutes } from './routes/aiRoutes';
import { analyticsRoutes } from './routes/analyticsRoutes';
import { swaggerDocsSetup } from './config/swagger';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 连接数据库
connectDB();
connectRedis();

// 中间件配置
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '0379邮件平台API服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

// API文档
swaggerDocsSetup(app, Number(PORT));

// 路由配置
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/emails', mailRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 错误处理中间件
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 0379邮件平台API服务已启动，监听端口: ${PORT}`);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  logger.info('正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('正在关闭服务器...');
  process.exit(0);
});