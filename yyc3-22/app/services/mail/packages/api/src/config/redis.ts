/**
 * @file Redis配置
 * @description Redis缓存连接配置
 * @module redis
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { createClient, RedisClientType } from 'redis';
import { logInfo, logError } from '../utils/logger';

// 从环境变量获取Redis配置
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// 创建Redis客户端
const redisClient: RedisClientType = createClient({
  url: REDIS_URL,
});

// Redis连接事件监听
redisClient.on('connect', () => {
  logInfo('✅ Redis连接成功');
});

redisClient.on('error', (error) => {
  logError('❌ Redis连接失败', error);
});

redisClient.on('reconnecting', () => {
  logInfo('🔄 Redis正在重新连接...');
});

redisClient.on('end', () => {
  logInfo('❌ Redis连接已关闭');
});

// 连接Redis
export const connectRedis = async (): Promise<ReturnType<typeof createClient> | null> => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logError('❌ Redis连接失败', error as Error);
    // Redis连接失败不退出进程，使用降级策略
    return null;
  }
};

// Redis操作工具类
export class RedisService {
  // 设置键值对
  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await redisClient.set(key, stringValue, { EX: ttl });
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (error) {
      logError(`Redis设置键值失败: ${key}`, error as Error);
      // 降级处理：不抛出错误，允许服务继续运行
    }
  }

  // 获取值
  static async get(key: string): Promise<any> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      
      // 尝试解析为JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logError(`Redis获取值失败: ${key}`, error as Error);
      return null;
    }
  }

  // 删除键
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logError(`Redis删除键失败: ${key}`, error as Error);
    }
  }

  // 设置哈希表字段
  static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.hSet(key, field, stringValue);
    } catch (error) {
      logError(`Redis设置哈希表字段失败: ${key}:${field}`, error as Error);
    }
  }

  // 获取哈希表字段
  static async hget(key: string, field: string): Promise<any> {
    try {
      const value = await redisClient.hGet(key, field);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logError(`Redis获取哈希表字段失败: ${key}:${field}`, error as Error);
      return null;
    }
  }

  // 检查键是否存在
  static async exists(key: string): Promise<boolean> {
    try {
      return await redisClient.exists(key) > 0;
    } catch (error) {
      logError(`Redis检查键是否存在失败: ${key}`, error as Error);
      return false;
    }
  }

  // 设置过期时间
  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      logError(`Redis设置过期时间失败: ${key}`, error as Error);
    }
  }
}

// 导出Redis客户端
export { redisClient };