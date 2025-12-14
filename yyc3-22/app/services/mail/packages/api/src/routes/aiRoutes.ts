/**
 * @file AI路由
 * @description AI智能分析相关的API路由
 * @module aiRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import express from 'express';
import { analyzeEmail, batchAnalyzeEmails, generateEmailSummary, extractEmailData, categorizeEmail } from '../controllers/aiController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v1/ai/analyze:
 *   post:
 *     summary: 邮件智能分析
 *     description: 使用AI分析单封邮件内容
 *     tags: [AI分析]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 description: 邮件ID
 *               analyzeType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 enum: [sentiment, keywords, entities, tone, priority, language]
 *                 default: ["sentiment", "keywords", "entities", "priority"]
 *                 description: 分析类型列表
 *     responses:
 *       200:
 *         description: 分析成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 邮件不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/analyze', authenticate, analyzeEmail);

/**
 * @swagger
 * /api/v1/ai/batch-analyze:
 *   post:
 *     summary: 批量邮件分析
 *     description: 批量分析多封邮件
 *     tags: [AI分析]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailIds
 *             properties:
 *               emailIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: 邮件ID列表
 *               analyzeType:
 *                 type: string
 *                 enum: [sentiment, keywords, entities, tone, priority, language]
 *                 description: 分析类型
 *               threshold:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.7
 *                 description: 置信度阈值
 *     responses:
 *       200:
 *         description: 批量分析成功
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
router.post('/batch-analyze', authenticate, batchAnalyzeEmails);

/**
 * @swagger
 * /api/v1/ai/summary:
 *   post:
 *     summary: 生成邮件摘要
 *     description: 为指定邮件生成摘要
 *     tags: [AI分析]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 description: 邮件ID
 *               summaryLength:
 *                 type: string
 *                 enum: [short, medium, long]
 *                 default: medium
 *                 description: 摘要长度
 *               focusOn:
 *                 type: array
 *                 items:
 *                   type: string
 *                 enum: [main_points, action_items, key_details, all]
 *                 default: ["all"]
 *                 description: 摘要重点
 *     responses:
 *       200:
 *         description: 生成摘要成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 邮件不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/summary', authenticate, generateEmailSummary);

/**
 * @swagger
 * /api/v1/ai/extract-data:
 *   post:
 *     summary: 提取邮件数据
 *     description: 从邮件内容中提取结构化数据
 *     tags: [AI分析]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *               - dataTypes
 *             properties:
 *               emailId:
 *                 type: string
 *                 description: 邮件ID
 *               dataTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 enum: [dates, contacts, addresses, phone_numbers, urls, amounts, order_numbers, all]
 *                 description: 要提取的数据类型
 *     responses:
 *       200:
 *         description: 数据提取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 邮件不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/extract-data', authenticate, extractEmailData);

/**
 * @swagger
 * /api/v1/ai/classify:
 *   post:
 *     summary: 邮件分类
 *     description: 使用AI对邮件进行分类
 *     tags: [AI分析]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 邮件ID列表（如果指定）
 *               folder:
 *                 type: string
 *                 enum: [inbox, sent, draft, trash, spam]
 *                 description: 要分类的邮件文件夹（如果指定）
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 自定义分类列表
 *                 default: ["工作", "个人", "推广", "重要", "紧急", "垃圾邮件"]
 *     responses:
 *       200:
 *         description: 分类成功
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
router.post('/classify', authenticate, categorizeEmail);

export { router as aiRoutes };