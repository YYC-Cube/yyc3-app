/**
 * @file 环境变量管理
 * @description 处理环境变量的验证和管理
 * @module config/env
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { z } from 'zod';
import { logInfo, logError } from '../utils/logger';

// 环境变量验证模式
const envSchema = z.object({
  // 服务器基本配置
  PORT: z.string().default('3002').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  BASE_URL: z.string().default('http://localhost:3002'),
  API_VERSION: z.string().default('v1'),
  VERSION: z.string().default('1.0.0'),

  // CORS配置
  CORS_ORIGINS: z.string().default('*'),

  // Redis配置
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.string().default('0').transform(Number),
  REDIS_TTL: z.string().default('3600').transform(Number),
  REDIS_KEY_PREFIX: z.string().default('llm:'),

  // LLM模型配置
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),
  OPENAI_MAX_TOKENS: z.string().default('2048').transform(Number),
  OPENAI_TEMPERATURE: z.string().default('0.7').transform(Number),
  OPENAI_TIMEOUT: z.string().default('30000').transform(Number),
  OPENAI_BASE_URL: z.string().optional(),

  // 缓存配置
  CACHE_ENABLED: z.string().default('true').transform(val => val === 'true'),
  CACHE_TTL: z.string().default('300').transform(Number),

  // 日志配置
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('text'),
  LOG_FILE: z.string().default('./logs/app.log'),
});

// 导出类型
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 获取和验证环境变量
 * @returns 已验证的环境变量配置
 */
export function getEnvConfig(): EnvConfig {
  try {
    // 尝试解析环境变量
    const config = envSchema.parse(process.env);
    
    // 记录配置加载成功
    logInfo('环境变量配置加载成功', {
      env: config.NODE_ENV,
      baseUrl: config.BASE_URL,
      port: config.PORT,
      apiVersion: config.API_VERSION
    });
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 格式化Zod验证错误
      const errorMessages = error.errors.map(err => {
        return {
          field: err.path.join('.') || 'unknown',
          message: err.message,
          code: err.code
        };
      });
      
      logError('环境变量配置验证失败', {
      errors: errorMessages
    });
      
      console.error('❌ 环境变量配置验证失败:');
      errorMessages.forEach(err => {
        console.error(`  - ${err.field}: ${err.message}`);
      });
    } else {
      logError('加载环境变量配置失败', { error });
      console.error('❌ 加载环境变量配置失败:', (error as Error).message);
    }
    
    // 在生产环境中，配置错误应该导致应用程序退出
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ 生产环境下配置错误，应用程序无法启动');
      process.exit(1);
    }
    
    // 在非生产环境中，返回默认值以允许开发继续
    console.warn('⚠️ 在开发环境中使用默认配置继续运行');
    return {
      PORT: 3002,
      NODE_ENV: 'development',
      HOST: '127.0.0.1',
      BASE_URL: 'http://localhost:3002',
      API_VERSION: 'v1',
      VERSION: '1.0.0',
      CORS_ORIGINS: '*',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
      REDIS_DB: 0,
      REDIS_TTL: 3600,
      REDIS_KEY_PREFIX: 'llm:',
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: 'gpt-3.5-turbo',
      OPENAI_MAX_TOKENS: 2048,
      OPENAI_TEMPERATURE: 0.7,
      OPENAI_TIMEOUT: 30000,
      OPENAI_BASE_URL: undefined,
      CACHE_ENABLED: true,
      CACHE_TTL: 300,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'text',
      LOG_FILE: './logs/app.log',
    };
  }
}

/**
 * 获取单个环境变量，如果不存在则返回默认值
 * @param key 环境变量名称
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
export function getEnvVar<T = string>(key: string, defaultValue: T): T {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  // 如果默认值是数字，尝试转换
  if (typeof defaultValue === 'number') {
    const numValue = Number(value);
    return Number.isNaN(numValue) ? defaultValue : numValue as unknown as T;
  }
  
  // 如果默认值是布尔值，尝试转换
  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as unknown as T;
  }
  
  return value as unknown as T;
}

/**
 * 检查是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 * @returns 是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 检查是否为测试环境
 * @returns 是否为测试环境
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

// 导出配置实例
export const env = getEnvConfig();

// 导出环境变量辅助函数
export const envUtils = {
  get: getEnvVar,
  isDev: isDevelopment,
  isProd: isProduction,
  isTest: isTest,
  getApiBaseUrl: () => `${env.BASE_URL}/api/${env.API_VERSION}`,
  getRedisUrl: () => `redis://${env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : ''}${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`,
  getOpenaiUrl: () => env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
};