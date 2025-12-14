/**
 * @file 错误处理中间件
 * @description 统一处理API错误的中间件
 * @module errorHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

// 自定义错误类
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: string[];

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: string[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  logError('API请求错误', err, {
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
  });

  // 处理不同类型的错误
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15),
    });
  }

  // 默认错误响应
  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15),
  });
};