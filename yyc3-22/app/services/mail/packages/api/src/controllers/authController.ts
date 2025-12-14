/**
 * @file 认证控制器
 * @description 处理用户认证相关业务逻辑
 * @module authController
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middlewares/auth';
import { logInfo, logError, logWarn } from '../utils/logger';
import { query } from '../config/database';
import bcrypt from 'bcrypt';

// 用户注册接口
/**
 * 用户注册
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    
    // 输入验证
    if (!email || !password || !name) {
      throw new ApiError(400, '请提供完整的注册信息');
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, '无效的邮箱格式');
    }
    
    // 验证密码强度
    if (password.length < 8) {
      throw new ApiError(400, '密码长度至少为8个字符');
    }
    
    // 检查邮箱是否已注册
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ApiError(409, '该邮箱已被注册');
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const newUser = await query(
      'INSERT INTO users (email, password_hash, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, role',
      [email, hashedPassword, name, 'user']
    );
    
    // 生成令牌
    const accessToken = generateToken(newUser.rows[0].id, email, newUser.rows[0].role);
    const refreshToken = generateRefreshToken(newUser.rows[0].id);
    
    // 保存刷新令牌到数据库
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [newUser.rows[0].id, refreshToken]
    );
    
    logInfo('用户注册成功', {
      userId: newUser.rows[0].id,
      email,
      name
    });
    
    // 发送验证邮件
    sendVerificationEmail(email, newUser.rows[0].id);
    
    // 返回用户信息和令牌
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.rows[0].id,
          email: newUser.rows[0].email,
          name: newUser.rows[0].name,
          role: newUser.rows[0].role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600 // 1小时
        }
      },
      message: '注册成功，请检查邮箱完成验证'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('注册失败', error as Error);
      next(new ApiError(500, '注册失败，请稍后重试'));
    }
  }
};

// 用户登录接口
/**
 * 用户登录
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // 输入验证
    if (!email || !password) {
      throw new ApiError(400, '请提供邮箱和密码');
    }
    
    // 查询用户
    const user = await query('SELECT id, email, password_hash, name, role, email_verified FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      logWarn('登录失败：用户不存在', {
        email
      });
      throw new ApiError(401, '邮箱或密码错误');
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password_hash);
    
    if (!isPasswordValid) {
      logWarn('登录失败：密码错误', {
        email,
        userId: user.rows[0].id
      });
      throw new ApiError(401, '邮箱或密码错误');
    }
    
    // 检查邮箱是否已验证
    if (!user.rows[0].email_verified) {
      throw new ApiError(403, '请先验证您的邮箱');
    }
    
    // 生成令牌
    const accessToken = generateToken(user.rows[0].id, email, user.rows[0].role);
    const refreshToken = generateRefreshToken(user.rows[0].id);
    
    // 保存刷新令牌到数据库
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.rows[0].id, refreshToken]
    );
    
    logInfo('用户登录成功', {
      userId: user.rows[0].id,
      email
    });
    
    // 返回用户信息和令牌
    res.json({
      success: true,
      data: {
        user: {
          id: user.rows[0].id,
          email: user.rows[0].email,
          name: user.rows[0].name,
          role: user.rows[0].role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600 // 1小时
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('登录失败', error as Error);
      next(new ApiError(500, '登录失败，请稍后重试'));
    }
  }
};

// 刷新令牌接口
/**
 * 刷新访问令牌
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError(400, '缺少刷新令牌');
    }
    
    // 验证刷新令牌
    let userId: string;
    try {
      userId = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, '无效的刷新令牌');
    }
    
    // 检查刷新令牌是否在数据库中且未过期
    const tokenRecord = await query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [userId, refreshToken]
    );
    
    if (tokenRecord.rows.length === 0) {
      throw new ApiError(401, '无效的刷新令牌');
    }
    
    // 获取用户信息
    const user = await query('SELECT email, name, role FROM users WHERE id = $1', [userId]);
    
    if (user.rows.length === 0) {
      throw new ApiError(404, '用户不存在');
    }
    
    // 生成新的访问令牌
    const newAccessToken = generateToken(userId, user.rows[0].email, user.rows[0].role);
    
    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken(userId);
    
    // 删除旧的刷新令牌
    await query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRecord.rows[0].id]);
    
    // 保存新的刷新令牌
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [userId, newRefreshToken]
    );
    
    logInfo('令牌刷新成功', {
      userId,
      email: user.rows[0].email
    });
    
    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600 // 1小时
        }
      },
      message: '令牌刷新成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('令牌刷新失败', error as Error);
      next(new ApiError(500, '令牌刷新失败，请稍后重试'));
    }
  }
};

// 用户登出接口
/**
 * 用户登出
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    // 删除指定的刷新令牌或用户的所有刷新令牌
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2', [req.user.userId, refreshToken]);
    } else {
      // 登出所有设备
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.userId]);
    }
    
    logInfo('用户登出成功', {
      userId: req.user.userId,
      email: req.user.email
    });
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('登出失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '登出失败，请稍后重试'));
    }
  }
};

// 邮箱验证接口
/**
 * 验证邮箱
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;
    
    if (!token) {
      throw new ApiError(400, '缺少验证令牌');
    }
    
    // 查找验证令牌
    const verificationToken = await query(
      'SELECT user_id FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()',
      [token as string]
    );
    
    if (verificationToken.rows.length === 0) {
      throw new ApiError(401, '无效或过期的验证令牌');
    }
    
    const userId = verificationToken.rows[0].user_id;
    
    // 更新用户邮箱验证状态
    await query(
      'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
      [userId]
    );
    
    // 删除已使用的验证令牌
    await query('DELETE FROM email_verification_tokens WHERE token = $1', [token as string]);
    
    logInfo('邮箱验证成功', {
      userId
    });
    
    // 返回成功消息
    res.json({
      success: true,
      message: '邮箱验证成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('邮箱验证失败', error as Error);
      next(new ApiError(500, '邮箱验证失败，请稍后重试'));
    }
  }
};

// 发送验证邮件
/**
 * 发送邮箱验证邮件（模拟实现）
 * @param email 用户邮箱
 * @param userId 用户ID
 */
const sendVerificationEmail = (email: string, userId: string): void => {
  // 生成验证令牌
  const verificationToken = generateVerificationToken();
  
  // 保存验证令牌到数据库
  query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
      [userId, verificationToken]
    ).catch((error) => {
      logError('保存验证令牌失败', error as Error, {
        userId
      });
    });
  
  // 构建验证链接
  const verificationLink = `http://localhost:3100/api/v1/auth/verify-email?token=${verificationToken}`;
  
  // 这里应该调用邮件发送服务，这里只是模拟
  logInfo('验证邮件已发送', {
    email,
    userId,
    verificationLink
  });
};

// 生成验证令牌
/**
 * 生成邮箱验证令牌
 * @returns 生成的验证令牌
 */
const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};