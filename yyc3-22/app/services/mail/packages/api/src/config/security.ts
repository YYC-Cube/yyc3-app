/**
 * @file 安全配置
 * @description 处理CORS、速率限制和其他安全相关配置
 * @module security
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { env, envUtils } from './env';
import { logInfo, logWarn } from '../utils/logger';

/**
 * 配置CORS中间件
 * @returns CORS中间件配置
 */
export function configureCORS() {
  // 解析允许的源
  const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
  
  // CORS配置选项
  const corsOptions: cors.CorsOptions = {
    origin: corsOrigins.includes('*') 
      ? '*' 
      : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Content-Length',
      'Accept-Encoding',
      'X-CSRF-Token',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400 // 预检请求结果缓存24小时
  };
  
  logInfo('CORS配置已加载', {
    origins: corsOrigins,
    methods: corsOptions.methods
  });
  
  return cors(corsOptions);
}

/**
 * 配置API速率限制器
 * @returns 速率限制中间件
 */
export function configureRateLimit() {
  // 默认速率限制配置
  const rateLimitWindow = '15m'; // 15分钟
  const rateLimitMax = 1000; // 每个IP的最大请求数
  
  const limiter = rateLimit({
    windowMs: parseTimeWindow(rateLimitWindow), // 窗口时间
    max: rateLimitMax, // 每个IP的最大请求数
    standardHeaders: true, // 返回速率限制头
    legacyHeaders: false, // 禁用旧版X-RateLimit头
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    // 自定义处理函数
    handler: (req: express.Request, res: express.Response, options: any) => {
      logWarn('速率限制触发', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: options.max
      });
      res.status(options.statusCode).json(options.message);
    },
    // 白名单（可选）
    skip: (req: express.Request) => {
      // 可以在这里添加白名单逻辑
      // 例如：开发环境下跳过某些IP
      if (envUtils.isDev() && req.ip === '127.0.0.1') {
        return true;
      }
      return false;
    }
  });
  
  logInfo('速率限制配置已加载', {
    windowMs: rateLimitWindow,
    max: rateLimitMax
  });
  
  return limiter;
}

/**
 * 配置安全头（Helmet）
 * @returns Helmet中间件配置
 */
export function configureHelmet() {
  // 基础Helmet配置
  const helmetOptions: any = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", env.BASE_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true
    },
    xssFilter: true,
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' }
  };
  
  // 开发环境下禁用某些限制以方便调试
  if (envUtils.isDev()) {
    helmetOptions.contentSecurityPolicy = false;
    helmetOptions.hsts = false;
    logInfo('开发环境下部分安全头已禁用以方便调试');
  }
  
  logInfo('Helmet安全头配置已加载');
  return helmet(helmetOptions);
}

/**
 * 配置XSS清理中间件
 * @returns XSS清理中间件
 */
export function configureXSSClean() {
  logInfo('XSS清理中间件已加载');
  return xss();
}

/**
 * 配置HPP（HTTP参数污染）防护中间件
 * @returns HPP中间件
 */
export function configureHPP() {
  const hppOptions: any = {
    whitelist: [
      // 允许重复的参数名（如果需要）
      // 例如：对于排序和过滤参数
      'sort',
      'filter',
      'q'
    ]
  };
  
  logInfo('HPP参数污染防护已加载');
  return hpp(hppOptions);
}

/**
 * 配置MongoDB注入防护中间件
 * @returns MongoDB注入防护中间件
 */
export function configureMongoSanitize() {
  logInfo('MongoDB注入防护中间件已加载');
  return mongoSanitize();
}

/**
 * 配置请求大小限制中间件
 * @param options 限制选项
 * @returns 请求大小限制中间件
 */
export function configureBodyParser(options?: {
  jsonLimit?: string;
  urlencodedLimit?: string;
}) {
  const jsonParser = express.json({
    limit: options?.jsonLimit || '10mb',
    strict: true,
    type: 'application/json'
  });
  
  const urlencodedParser = express.urlencoded({
    extended: true,
    limit: options?.urlencodedLimit || '10mb'
  });
  
  logInfo('请求体解析器配置已加载', {
    jsonLimit: options?.jsonLimit || '10mb',
    urlencodedLimit: options?.urlencodedLimit || '10mb'
  });
  
  return { jsonParser, urlencodedParser };
}

/**
 * 配置全局安全中间件
 * @param app Express应用实例
 */
export function configureSecurityMiddlewares(app: express.Application) {
  // 1. 配置CORS
  app.use(configureCORS());
  
  // 2. 配置安全头
  app.use(configureHelmet());
  
  // 3. 配置请求体解析器
  const { jsonParser, urlencodedParser } = configureBodyParser();
  app.use(jsonParser);
  app.use(urlencodedParser);
  
  // 4. 配置安全中间件
  app.use(configureXSSClean());
  app.use(configureMongoSanitize());
  app.use(configureHPP());
  
  // 5. 配置API速率限制（仅对API路由应用）
  const apiBaseUrl = `${env.BASE_URL}/api/${env.API_VERSION}`;
  app.use(`${apiBaseUrl}/*`, configureRateLimit());
  
  logInfo('所有安全中间件已成功配置');
}

/**
 * 解析时间窗口字符串为毫秒数
 * @param timeWindow 时间窗口字符串（如 '15m', '1h', '1d'）
 * @returns 毫秒数
 */
function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)([mhd])$/);
  if (!match) {
    logWarn(`无效的时间窗口格式: ${timeWindow}, 使用默认值 15m`);
    return 15 * 60 * 1000; // 默认15分钟
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

/**
 * 安全的重定向函数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param url 重定向URL
 * @param statusCode HTTP状态码
 */
export function secureRedirect(req: express.Request, res: express.Response, url: string, statusCode: number = 302): void {
  // 验证URL是否安全
  const isValidUrl = isSafeRedirectUrl(url, req.hostname);
  
  if (!isValidUrl) {
    logWarn('检测到不安全的重定向尝试', {
      requestedUrl: url,
      host: req.hostname,
      ip: req.ip
    });
    res.redirect(statusCode, '/');
    return;
  }
  
  res.redirect(statusCode, url);
}

/**
 * 验证重定向URL是否安全
 * @param url 重定向URL
 * @param allowedHost 允许的主机名
 * @returns 是否安全
 */
function isSafeRedirectUrl(url: string, allowedHost: string): boolean {
  try {
    const parsedUrl = new URL(url, `https://${allowedHost}`);
    
    // 只允许相对路径或同域名的重定向
    return parsedUrl.hostname === allowedHost || url.startsWith('/');
  } catch (error) {
    // 无效的URL
    return false;
  }
}

/**
 * 敏感数据脱敏工具
 * @param data 原始数据
 * @param fields 需要脱敏的字段列表
 * @returns 脱敏后的数据
 */
export function maskSensitiveData(data: any, fields: string[] = ['password', 'token', 'secret', 'api_key']): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // 深拷贝数据以避免修改原始数据
  const maskedData = JSON.parse(JSON.stringify(data));
  
  // 脱敏指定字段
  fields.forEach(field => {
    const fieldLower = field.toLowerCase();
    
    // 遍历对象属性
    Object.keys(maskedData).forEach(key => {
      const keyLower = key.toLowerCase();
      
      if (keyLower.includes(fieldLower)) {
        const value = maskedData[key];
        if (typeof value === 'string') {
          // 保留前3位和后4位，中间用星号替换
          if (value.length <= 7) {
            maskedData[key] = '*'.repeat(value.length);
          } else {
            maskedData[key] = value.substring(0, 3) + 
                              '*'.repeat(Math.min(8, value.length - 7)) + 
                              value.substring(value.length - 4);
          }
        }
      }
    });
  });
  
  return maskedData;
}