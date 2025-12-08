/**
 * @file 错误处理器
 * @description 统一错误处理工具函数
 * @module utils
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 定义错误类型
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * 错误处理类
 */
export class ErrorHandler {
  /**
   * 处理应用错误
   * @param error - 错误对象
   * @param context - 错误上下文
   * @returns 格式化后的错误对象
   */
  static handle(error: unknown, context: string): AppError {
    console.error(`🚨 [${context}] 错误:`, error);
    
    // 发送告警到监控系统 (模拟)
    this.sendAlert(error, context);
    
    // 格式化错误
    if (error instanceof Error) {
      const appError: AppError = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      
      // 如果是AppError类型，保留额外属性
      if ('statusCode' in error) {
        appError.statusCode = (error as AppError).statusCode;
      }
      if ('code' in error) {
        appError.code = (error as AppError).code;
      }
      if ('details' in error) {
        appError.details = (error as AppError).details;
      }
      
      return appError;
    }
    
    // 非Error类型的错误
    return {
      name: 'UnknownError',
      message: String(error),
      statusCode: 500,
      code: 'UNKNOWN_ERROR'
    };
  }
  
  /**
   * 发送错误告警
   * @param error - 错误对象
   * @param context - 错误上下文
   */
  static sendAlert(error: unknown, context: string): void {
    // 这里应该是实际的告警发送逻辑
    // 为了演示，我们只打印日志
    console.warn(`⚠️  [${context}] 告警已发送`);
  }
  
  /**
   * 创建应用错误
   * @param message - 错误消息
   * @param options - 错误选项
   * @returns 应用错误实例
   */
  static createError(
    message: string,
    options: { statusCode?: number; code?: string; details?: any } = {}
  ): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = options.statusCode || 500;
    error.code = options.code || 'APPLICATION_ERROR';
    error.details = options.details;
    return error;
  }
}

/**
 * 异步错误处理包装器
 * @param fn - 异步函数
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export function asyncErrorHandler<T extends (...args: any[]) => Promise<any>>(fn: T, context: string) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handle(error, context);
    }
  };
}
