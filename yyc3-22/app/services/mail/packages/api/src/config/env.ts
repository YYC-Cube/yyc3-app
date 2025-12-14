/**
 * @file 环境变量管理
 * @description 处理环境变量的验证和管理
 * @module env
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { z } from 'zod';
import { logInfo, logError } from '../utils/logger';

// 环境变量验证模式
const envSchema = z.object({
  // 服务器基本配置
  PORT: z.string().default('3105').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.string().default('http://localhost:3105'),
  API_VERSION: z.string().default('v1'),

  // 数据库配置
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('yyc3_email'),
  DB_USER: z.string().default('yyc3_email'),
  DB_PASSWORD: z.string().default('yyc3_admin'),
  DB_SSL: z.string().default('false').transform(val => val === 'true'),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('20').transform(Number),

  // Redis配置
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.string().default('0').transform(Number),
  REDIS_TTL: z.string().default('3600').transform(Number),

  // JWT配置
  JWT_SECRET: z.string().default('yyc3-email-platform-jwt-secret-key-2024-123'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // 邮件发送配置
  SMTP_HOST: z.string().default('smtp.0379.email'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().default('admin@0379.email'),
  SMTP_PASSWORD: z.string().default('secure-password-change-me'),
  SMTP_SECURE: z.string().default('false').transform(val => val === 'true'),
  SMTP_FROM: z.string().email().default('admin@0379.email'),

  // 文件上传配置
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number),

  // 日志配置
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),

  // 速率限制配置
  RATE_LIMIT_WINDOW: z.string().default('15m'),
  RATE_LIMIT_MAX: z.string().default('1000').transform(Number),

  // API配置
  API_BASE_URL: z.string().default('/api'),
  CORS_ORIGINS: z.string().default('*'),

  // AI配置（可选，用于未来的LLM集成）
  AI_API_KEY: z.string().optional(),
  AI_API_ENDPOINT: z.string().url().optional(),
  AI_MODEL: z.string().default('gpt-4o'),
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
      
      logError('环境变量配置验证失败', undefined, {
      errors: errorMessages
    });
      
      console.error('❌ 环境变量配置验证失败:');
      errorMessages.forEach(err => {
        console.error(`  - ${err.field}: ${err.message}`);
      });
    } else {
      logError('加载环境变量配置失败', error as Error);
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
      PORT: 3000,
      NODE_ENV: 'development',
      API_BASE_URL: '/api',
      BASE_URL: 'http://localhost:3000',
      API_VERSION: 'v1',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'email_platform',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_SSL: false,
      DB_POOL_MAX: 10,
      DB_POOL_MIN: 2,
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
      REDIS_DB: 0,
      REDIS_TTL: 3600,
      JWT_SECRET: 'this-is-a-development-only-secret-key-please-change-in-production',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRATION: '7d',
      CORS_ORIGINS: '*',
      RATE_LIMIT_WINDOW: '15m',
      RATE_LIMIT_MAX: 100,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_USER: 'user@example.com',
      SMTP_PASSWORD: 'password',
      SMTP_SECURE: false,
      SMTP_FROM: 'no-reply@example.com',
      UPLOAD_DIR: './uploads',
      MAX_FILE_SIZE: 10485760,
      AI_API_KEY: 'sk-placeholder',
      AI_API_ENDPOINT: 'https://api.example.com/v1/completions',
      AI_MODEL: 'gpt-4o',
      LOG_LEVEL: 'info',
      LOG_FILE: './logs/app.log'
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
  isTest: isTest
};