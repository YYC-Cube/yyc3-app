/**
 * @file Redis 配置模块
 * @description 用于配置和管理 Redis 连接
 * @module config/redis
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import Redis from 'ioredis';
import { env } from './env';
import { logInfo, logError, logWarn } from '../utils/logger';

// Redis客户端实例
let redisClient: Redis | null = null;

/**
 * 配置并初始化Redis客户端
 * @returns 初始化后的Redis客户端
 */
export async function configureRedis(): Promise<Redis | null> {
  try {
    if (redisClient) {
      logInfo('Redis 客户端已存在，直接返回');
      return redisClient;
    }

    // 创建Redis客户端
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      keyPrefix: env.REDIS_KEY_PREFIX,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        // 指数退避重试策略
        const delay = Math.min(times * 100, 2000);
        logInfo(`Redis 连接重试 ${times} 次，延迟 ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // 监听连接事件
    redisClient.on('connect', () => {
      logInfo('📦 Redis 连接成功');
    });

    // 监听错误事件
    redisClient.on('error', (error) => {
      logError('❌ Redis 连接错误:', error);
    });

    // 监听断开事件
    redisClient.on('close', () => {
      logWarn('⚠️ Redis 连接已断开');
    });

    // 监听重新连接事件
    redisClient.on('reconnecting', () => {
      logInfo('🔄 Redis 正在重新连接');
    });

    // 监听连接结束事件
    redisClient.on('end', () => {
      logInfo('🔚 Redis 连接已关闭');
    });

    // 测试连接
    await redisClient.ping();
    logInfo('✅ Redis 连接测试通过');

    return redisClient;
  } catch (error) {
    logError('❌ Redis 初始化失败:', error);
    return null;
  }
}

/**
 * 获取Redis客户端实例
 * @returns Redis客户端实例，如果未初始化则返回null
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * 断开Redis连接
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logInfo('📦 Redis 连接已关闭');
    } catch (error) {
    logError('❌ Redis 断开连接失败:', error);
  } finally {
      redisClient = null;
    }
  }
}

/**
 * 检查Redis是否可用
 * @returns Redis是否可用
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * 设置缓存值
 * @param key 缓存键
 * @param value 缓存值
 * @param ttl 过期时间（秒），默认使用环境变量配置
 */
export async function setCache(key: string, value: any, ttl: number = env.REDIS_TTL): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const stringValue = JSON.stringify(value);
    await redisClient!.setex(key, ttl, stringValue);
    return true;
  } catch (error) {
    logError('❌ 设置缓存失败:', error);
    return false;
  }
}

/**
 * 获取缓存值
 * @param key 缓存键
 * @returns 缓存值，如果不存在则返回null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const value = await redisClient!.get(key);
    return value ? JSON.parse(value) as T : null;
  } catch (error) {
    logError('❌ 获取缓存失败:', error);
    return null;
  }
}

/**
 * 删除缓存值
 * @param key 缓存键
 * @returns 是否删除成功
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redisClient!.del(key);
    return true;
  } catch (error) {
    logError('❌ 删除缓存失败:', error);
    return false;
  }
}

/**
 * 批量删除缓存值
 * @param keys 缓存键数组
 * @returns 删除的键数量
 */
export async function deleteCacheBatch(keys: string[]): Promise<number> {
  if (!isRedisAvailable() || keys.length === 0) {
    return 0;
  }

  try {
    const result = await redisClient!.del(...keys);
    return result;
  } catch (error) {
    logError('❌ 批量删除缓存失败:', error);
    return 0;
  }
}

/**
 * 清除所有缓存（带前缀）
 * @returns 是否清除成功
 */
export async function clearAllCache(): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const keys = await redisClient!.keys(`${env.REDIS_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await deleteCacheBatch(keys);
    }
    return true;
  } catch (error) {
    logError('❌ 清除所有缓存失败:', error);
    return false;
  }
}