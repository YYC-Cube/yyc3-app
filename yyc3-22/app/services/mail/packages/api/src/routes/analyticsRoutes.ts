/**
 * @file 分析路由
 * @description 统计分析相关的API路由
 * @module analyticsRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import express from 'express';
import { getEmailStatistics, getEmailTrafficAnalysis, getUserActivityAnalysis, getTopSenders, getEmailCategories } from '../controllers/analyticsController';
import { validateDateRange } from '../middlewares/validators/analyticsValidators';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: 邮件统计概览
 *     description: 获取用户邮件统计概览数据
 *     tags: [统计分析]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: grouping
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: 数据分组方式
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的日期范围
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/overview', authenticate, validateDateRange, getEmailStatistics);

/**
 * @swagger
 * /api/v1/analytics/traffic:
 *   get:
 *     summary: 邮件流量分析
 *     description: 获取邮件收发流量趋势
 *     tags: [统计分析]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: grouping
 *         schema:
 *           type: string
 *           enum: [hour, day, week]
 *           default: day
 *         description: 数据分组方式
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的日期范围
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/traffic', authenticate, validateDateRange, getEmailTrafficAnalysis);

/**
 * @swagger
 * /api/v1/analytics/activity:
 *   get:
 *     summary: 用户活动分析
 *     description: 获取用户邮件活动数据
 *     tags: [统计分析]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           enum: [sent, read, replied, forwarded, archived, deleted]
 *         description: 活动类型过滤
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的日期范围
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/activity', authenticate, validateDateRange, getUserActivityAnalysis);

/**
 * @swagger
 * /api/v1/analytics/top-senders:
 *   get:
 *     summary: 高频发件人统计
 *     description: 获取发送邮件最多的发件人列表
 *     tags: [统计分析]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: 返回数量限制
 *       - in: query
 *         name: excludeContacts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否排除联系人
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的参数
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/top-senders', authenticate, validateDateRange, getTopSenders);

/**
 * @swagger
 * /api/v1/analytics/categories:
 *   get:
 *     summary: 邮件分类统计
 *     description: 获取邮件分类统计数据
 *     tags: [统计分析]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [category, folder, sender_domain]
 *           default: category
 *         description: 分组方式
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 无效的参数
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/categories', authenticate, validateDateRange, getEmailCategories);

export { router as analyticsRoutes };