import { createLogger, format, transports } from 'winston';
import { env } from '../config/env';

// 定义日志级别对应的颜色
const levelColors = {
  debug: 'blue',
  info: 'green',
  warn: 'yellow',
  error: 'red',
};

// 配置日志格式
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.colorize({
    all: true,
    colors: levelColors,
  }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// 配置JSON格式（用于生产环境）
const jsonFormat = format.combine(
  format.timestamp(),
  format.json()
);

// 日志器实例
let logger: any = null;

/**
 * 初始化日志器
 * @returns 初始化后的日志器
 */
export function initializeLogger() {
  const transportsList = [
    new transports.Console({
      format: env.LOG_FORMAT === 'json' ? jsonFormat : logFormat,
    }),
  ];

  logger = createLogger({
    level: env.LOG_LEVEL,
    transports: transportsList,
  });

  return logger;
}

/**
 * 获取日志器实例
 * @returns 日志器实例
 */
export function getLogger() {
  if (!logger) {
    return initializeLogger();
  }
  return logger;
}

/**
 * 记录调试日志
 * @param message 日志消息
 * @param meta 附加元数据
 */
export function logDebug(message: string, meta?: any) {
  getLogger().debug(message, meta);
}

/**
 * 记录信息日志
 * @param message 日志消息
 * @param meta 附加元数据
 */
export function logInfo(message: string, meta?: any) {
  getLogger().info(message, meta);
}

/**
 * 记录警告日志
 * @param message 日志消息
 * @param meta 附加元数据
 */
export function logWarn(message: string, meta?: any) {
  getLogger().warn(message, meta);
}

/**
 * 记录错误日志
 * @param message 日志消息
 * @param meta 附加元数据
 */
export function logError(message: string, meta?: any) {
  getLogger().error(message, meta);
}