/**
 * @file 日志工具
 * @description 统一的日志记录功能
 * @module logger
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import winston from 'winston';

// 定义日志级别
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

// 创建日志实例
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: '0379-email-platform-api' },
  transports: [
    // 输出到控制台
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
      // 输出到错误日志文件
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 输出到所有日志文件
    new winston.transports.File({
      filename: './logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 导出日志方法
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};