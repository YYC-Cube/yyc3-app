/**
 * @file 日志工具模块
 * @description 用于配置和管理应用日志
 * @module utils/logger
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 * @updated 2025-11-02
 */

import winston from 'winston';
import { env } from '../config/env';

// 日志器实例
let logger: winston.Logger;

/**
 * 初始化日志器
 */
export function initializeLogger(): void {
  // 日志格式
  const format = env.LOG_FORMAT === 'json' 
    ? winston.format.json()
    : winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.colorize(),
        winston.format.printf((info) => {
          return `${info.timestamp} [${info.level}] ${info.message}`;
        })
      );

  // 创建日志器
  logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format,
    transports: [
      // 控制台输出
      new winston.transports.Console(),
      // 错误日志文件
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 1024 * 1024 * 10, // 10MB
        maxFiles: 5,
        tailable: true,
      }),
      // 所有日志文件
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 1024 * 1024 * 10, // 10MB
        maxFiles: 5,
        tailable: true,
      }),
    ],
  });
}

/**
 * 记录调试信息
 */
export function logDebug(message: string, ...meta: any[]): void {
  if (logger) {
    logger.debug(message, ...meta);
  } else {
    console.debug(message, ...meta);
  }
}

/**
 * 记录普通信息
 */
export function logInfo(message: string, ...meta: any[]): void {
  if (logger) {
    logger.info(message, ...meta);
  } else {
    console.info(message, ...meta);
  }
}

/**
 * 记录警告信息
 */
export function logWarn(message: string, ...meta: any[]): void {
  if (logger) {
    logger.warn(message, ...meta);
  } else {
    console.warn(message, ...meta);
  }
}

/**
 * 记录错误信息
 */
export function logError(message: string, ...meta: any[]): void {
  if (logger) {
    logger.error(message, ...meta);
  } else {
    console.error(message, ...meta);
  }
}

/**
 * 获取日志器实例
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    initializeLogger();
  }
  return logger;
}