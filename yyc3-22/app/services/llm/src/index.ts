import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { env } from './config/env';
import { configureRedis } from './config/redis';
import { initializeLogger, logInfo, logError, logDebug } from './utils/logger';
import { healthCheckRoutes } from './routes/health';
import { llmRoutes } from './routes/llm';

// 初始化日志器
initializeLogger();

// 创建Express应用
const app = express();

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

// 配置路由
app.use('/health', healthCheckRoutes);
app.use('/api/chat', llmRoutes);
app.use('/api/completion', llmRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ZodError) {
    logError('请求验证失败', { errors: err.errors });
    return res.status(400).json({ error: 'Invalid request', details: err.errors });
  }
  
  logError('内部服务器错误', { error: err });
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404错误处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
const startServer = async () => {
  try {
    // 配置Redis
    await configureRedis();
    
    // 启动服务器
    const PORT = env.PORT;
    app.listen(PORT, env.HOST, () => {
      logInfo(`🚀 LLM服务启动成功`);
      logInfo(`📦 环境: ${env.NODE_ENV}`);
      logInfo(`🌐 地址: http://${env.HOST}:${PORT}`);
      logInfo(`📝 API版本: ${env.API_VERSION}`);
      logInfo(`🧪 健康检查: http://${env.HOST}:${PORT}/health`);
    });
  } catch (error) {
    logError('服务器启动失败', { error });
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 优雅关闭处理
process.on('SIGINT', () => {
  logInfo('正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('正在关闭服务器...');
  process.exit(0);
});