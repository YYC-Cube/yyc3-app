/**
 * @file Redis配置
 * @description 统一管理API服务的Redis连接配置
 * @module api/config
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { envConfig } from './env';
import Redis from 'redis';

// 创建Redis客户端
const redisClient = Redis.createClient({
  url: `redis://${envConfig.redis.host}:${envConfig.redis.port}`,
  password: envConfig.redis.password,
  database: envConfig.redis.db
});

// 错误处理
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// 连接事件
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

// 断开连接事件
redisClient.on('end', () => {
  console.log('Redis client disconnected');
});

// 导出Redis客户端
export default redisClient;

// 检查Redis连接状态
export async function checkRedisConnection(): Promise<{ status: string; error?: string }> {
  try {
    await redisClient.ping();
    return { status: 'connected' };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown Redis connection error'
    };
  }
}
