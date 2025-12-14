/**
 * @file 健康检查路由模块
 * @description 提供服务健康状态检查接口
 * @module routes/health
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 * @updated 2025-11-02
 */

import express from 'express';
import { z } from 'zod';
import { getRedisClient } from '../config/redis';
import { env } from '../config/env';
import { logInfo, logError } from '../utils/logger';

// 创建路由
const router = express.Router();

// 定义健康检查响应类型
interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    redis: 'connected' | 'disconnected';
  };
  version: string;
  environment: string;
}

// 定义服务状态响应类型
interface ServiceStatusResponse {
  status: 'ok' | 'warning' | 'error';
  timestamp: string;
  services: {
    redis: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
  };
  metrics: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

// 健康检查接口
router.get('/', async (req: express.Request, res: express.Response<HealthCheckResponse>) => {
  try {
    // 检查Redis连接状态
    const redisClient = getRedisClient();
    const redisStatus = redisClient ? 'connected' : 'disconnected';

    // 构建响应
    const response: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisStatus,
      },
      version: env.VERSION || '1.0.0',
      environment: env.NODE_ENV,
    };

    res.status(200).json(response);
  } catch (error) {
    logError('健康检查失败:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: 'disconnected',
      },
      version: env.VERSION || '1.0.0',
      environment: env.NODE_ENV,
    });
  }
});

// 服务状态接口
router.get('/status', async (req: express.Request, res: express.Response<ServiceStatusResponse>) => {
  try {
    // 检查Redis连接状态和延迟
    const redisClient = getRedisClient();
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisLatency: number | undefined;

    if (redisClient) {
      try {
        const startTime = Date.now();
        await redisClient.ping();
        redisLatency = Date.now() - startTime;
        redisStatus = 'connected';
      } catch (err) {
        logError('Redis ping失败:', err);
      }
    }

    // 获取内存使用情况
    const memoryUsage = process.memoryUsage();

    // 构建响应
    const response: ServiceStatusResponse = {
      status: redisStatus === 'connected' ? 'ok' : 'warning',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: redisStatus,
          latency: redisLatency,
        },
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logError('服务状态检查失败:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: 'disconnected',
        },
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  }
});

// 版本信息接口
router.get('/version', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    version: env.VERSION || '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// 性能指标接口
router.get('/metrics', (req: express.Request, res: express.Response) => {
  // 获取性能指标
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(metrics);
});

// 导出路由
export const healthCheckRoutes = router;