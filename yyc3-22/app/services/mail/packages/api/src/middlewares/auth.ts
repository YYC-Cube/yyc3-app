/**
 * @file 认证中间件
 * @description 处理用户认证和授权的中间件
 * @module auth
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { logInfo, logError } from '../utils/logger';

// 环境变量导入
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// JWT负载接口定义
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * 认证中间件 - 验证JWT令牌
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '未提供授权令牌');
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, '无效的授权令牌');
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    logInfo(`用户 ${decoded.email} 认证成功`, {
      userId: decoded.userId,
      route: req.path,
      method: req.method
    });
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logError('令牌已过期', error, {
        route: req.path,
        method: req.method
      });
      next(new ApiError(401, '令牌已过期'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      logError('无效的令牌', error, {
        route: req.path,
        method: req.method
      });
      next(new ApiError(401, '无效的令牌'));
    } else if (error instanceof ApiError) {
      next(error);
    } else {
      logError('认证失败', error as Error, {
        route: req.path,
        method: req.method
      });
      next(new ApiError(401, '认证失败'));
    }
  }
};

/**
 * 角色权限验证中间件
 * @param requiredRoles 允许的角色列表
 */
export const authorize = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !req.user.role) {
        throw new ApiError(401, '需要认证');
      }
      
      if (!requiredRoles.includes(req.user.role)) {
        logError('权限不足', undefined, {
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role,
          requiredRoles,
          route: req.path,
          method: req.method
        });
        throw new ApiError(403, '权限不足');
      }
      
      logInfo(`用户 ${req.user.email} 权限验证通过`, {
        userId: req.user.userId,
        role: req.user.role,
        route: req.path
      });
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(403, '授权失败'));
      }
    }
  };
};

/**
 * 生成JWT令牌
 * @param userId 用户ID
 * @param email 用户邮箱
 * @param role 用户角色
 * @returns 生成的JWT令牌
 */
export const generateToken = (userId: string, email: string, role: string = 'user'): string => {
  try {
    const payload: JwtPayload = {
      userId,
      email,
      role
    };
    
    // 使用更简单的方式调用jwt.sign，避免类型问题
    return jwt.sign(payload, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN as any });
  } catch (error) {
    logError('生成令牌失败', error as Error, {
      userId,
      email
    });
    throw new Error('生成令牌失败');
  }
};

/**
 * 生成刷新令牌
 * @param userId 用户ID
 * @returns 生成的刷新令牌
 */
export const generateRefreshToken = (userId: string): string => {
  try {
    const payload = {
      userId
    };
    
    return jwt.sign(payload, JWT_SECRET + '_refresh', { expiresIn: '7d' });
  } catch (error) {
    logError('生成刷新令牌失败', error as Error, {
      userId
    });
    throw new Error('生成刷新令牌失败');
  }
};

/**
 * 验证刷新令牌
 * @param token 刷新令牌
 * @returns 解码后的用户ID
 */
export const verifyRefreshToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET + '_refresh');
    return (decoded as any).userId;
  } catch (error) {
    logError('验证刷新令牌失败', error as Error);
    throw new Error('无效的刷新令牌');
  }
};

// 扩展Express请求接口，添加用户属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}