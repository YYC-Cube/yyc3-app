import express from 'express';
import os from 'os';
import { env } from '../config/env';
import { getRedisClient } from '../config/redis';

const router = express.Router();

/**
 * 健康检查接口
 * 用于Kubernetes、Nginx等负载均衡器的健康探测
 */
router.get('/', async (req, res) => {
  const redisClient = getRedisClient();
  const redisStatus = redisClient ? (redisClient.status === 'ready' ? 'connected' : 'disconnected') : 'not configured';
  
  res.json({
    healthy: true,
    service: 'llm',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    environment: env.NODE_ENV,
    redis: redisStatus,
  });
});

/**
 * 服务状态接口
 */
router.get('/status', async (req, res) => {
  const redisClient = getRedisClient();
  const redisStatus = redisClient ? (redisClient.status === 'ready' ? 'connected' : 'disconnected') : 'not configured';
  
  res.json({
    status: 'running',
    service: 'llm',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().rss / 1024 / 1024, // MB
    redis: redisStatus,
  });
});

/**
 * 版本信息接口
 */
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'llm-service',
    environment: env.NODE_ENV,
    apiVersion: env.API_VERSION,
  });
});

/**
 * 性能指标接口
 */
router.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: process.memoryUsage().rss / 1024 / 1024, // MB
      heapTotal: process.memoryUsage().heapTotal / 1024 / 1024, // MB
      heapUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    },
    cpuUsage: process.cpuUsage(),
    eventLoopDelay: process.hrtime.bigint(),
  });
});

export { router as healthCheckRoutes };