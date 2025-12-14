/**
 * @file 认证路由
 * @description 用户认证相关的API路由
 * @module authRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import express from 'express';
import { register, login, refreshToken, logout, verifyEmail } from '../controllers/authController';
// import { validateRegistration, validateLogin, validateRefreshToken } from '../middlewares/validators/authValidators';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 创建新用户账号
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 用户密码
 *               firstName:
 *                 type: string
 *                 description: 名字
 *               lastName:
 *                 type: string
 *                 description: 姓氏
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的请求参数
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户登录获取访问令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 description: 用户密码
 *               rememberMe:
 *                 type: boolean
 *                 description: 是否记住登录状态
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                   platform:
 *                     type: string
 *                   browser:
 *                     type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 邮箱或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 无效的刷新令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 用户登出
 *     description: 登出当前用户会话
 *     tags: [认证]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   get:
 *     summary: 验证邮箱
 *     description: 验证用户邮箱地址
 *     tags: [认证]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: 邮箱验证令牌
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的验证令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verify-email', verifyEmail);

export { router as authRoutes };