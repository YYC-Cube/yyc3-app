/**
 * @file 404错误处理中间件
 * @description 处理未匹配的路由
 * @module notFoundHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response } from 'express';
import { logInfo } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  // 记录未找到的路由
  logInfo('路由未找到', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  return res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15),
  });
};