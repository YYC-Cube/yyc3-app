/**
 * @file 环境变量配置
 * @description 统一管理API服务的环境变量
 * @module api/config
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const envConfig = {
  // 服务配置
  service: {
    name: process.env.SERVICE_NAME || 'api',
    version: process.env.VERSION || '1.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '0379email'
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    bcryptSalt: parseInt(process.env.BCRYPT_SALT || '10', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  
  // 邮件配置
  email: {
    host: process.env.SMTP_HOST || 'smtp.0379.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || ''
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};
