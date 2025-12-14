/**
 * @file 安全配置
 * @description 统一管理API服务的安全相关配置
 * @module api/config
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { envConfig } from './env';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// CORS配置
export const corsConfig = cors({
  origin: envConfig.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Trace-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  credentials: true,
  optionsSuccessStatus: 200
});

// 速率限制配置
export const rateLimiter = rateLimit({
  windowMs: envConfig.rateLimit.windowMs,
  max: envConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  onLimitReached: (req, res, options) => {
    console.warn('速率限制触发', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
  }
});

// 安全头配置
export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'" }
];

// JWT配置
export const jwtConfig = {
  secret: envConfig.security.jwtSecret,
  expiresIn: '7d', // 7天过期
  algorithm: 'HS256' as const
};

// 密码加密配置
export const bcryptConfig = {
  saltRounds: envConfig.security.bcryptSalt
};
