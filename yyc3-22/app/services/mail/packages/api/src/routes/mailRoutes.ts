/**
 * @file 邮件路由
 * @description 邮件管理相关的API路由
 * @module mailRoutes
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import express from 'express';
import { sendEmail, getEmails, getEmailDetail, deleteEmail, forwardEmail, replyEmail } from '../controllers/mailController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v1/mail/send:
 *   post:
 *     summary: 发送邮件
 *     description: 发送新邮件
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 收件人列表
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 抄送列表
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 密送列表
 *               subject:
 *                 type: string
 *                 description: 邮件主题
 *               body:
 *                 type: string
 *                 description: 邮件内容
 *               isHtml:
 *                 type: boolean
 *                 default: false
 *                 description: 是否为HTML邮件
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     content:
 *                       type: string
 *                       format: base64
 *                     contentType:
 *                       type: string
 *     responses:
 *       201:
 *         description: 邮件发送成功
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
router.post('/send', authenticate, sendEmail);

/**
 * @swagger
 * /api/v1/mail/list:
 *   get:
 *     summary: 获取邮件列表
 *     description: 获取用户邮件列表
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           enum: [inbox, sent, draft, trash, spam]
 *           default: inbox
 *         description: 邮件文件夹
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, subject, sender]
 *           default: date
 *         description: 排序字段
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/list', authenticate, getEmails);

/**
 * @swagger
 * /api/v1/mail/{id}:
 *   get:
 *     summary: 获取邮件详情
 *     description: 根据邮件ID获取邮件详细信息
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 邮件ID
 *     responses:
 *       200:
 *         description: 获取成功
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
router.get('/:id', authenticate, getEmailDetail);

/**
 * @swagger
 * /api/v1/mail/{id}:
 *   delete:
 *     summary: 删除邮件
 *     description: 将邮件移动到垃圾箱
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 邮件ID
 *     responses:
 *       200:
 *         description: 删除成功
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
router.delete('/:id', authenticate, deleteEmail);

/**
 * @swagger
 * /api/v1/mail/forward:
 *   post:
 *     summary: 转发邮件
 *     description: 转发现有邮件
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalEmailId
 *               - to
 *             properties:
 *               originalEmailId:
 *                 type: string
 *                 description: 原始邮件ID
 *               to:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 收件人列表
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 抄送列表
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 密送列表
 *               subject:
 *                 type: string
 *                 description: 邮件主题
 *               body:
 *                 type: string
 *                 description: 邮件内容
 *               isHtml:
 *                 type: boolean
 *                 default: false
 *                 description: 是否为HTML邮件
 *     responses:
 *       201:
 *         description: 转发成功
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
router.post('/forward', authenticate, forwardEmail);

/**
 * @swagger
 * /api/v1/mail/reply:
 *   post:
 *     summary: 回复邮件
 *     description: 回复邮件给发件人或全部回复
 *     tags: [邮件]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalEmailId
 *               - body
 *             properties:
 *               originalEmailId:
 *                 type: string
 *                 description: 原始邮件ID
 *               replyToAll:
 *                 type: boolean
 *                 default: false
 *                 description: 是否回复给所有人
 *               body:
 *                 type: string
 *                 description: 邮件内容
 *               isHtml:
 *                 type: boolean
 *                 default: false
 *                 description: 是否为HTML邮件
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     content:
 *                       type: string
 *                       format: base64
 *                     contentType:
 *                       type: string
 *     responses:
 *       201:
 *         description: 回复成功
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
router.post('/reply', authenticate, replyEmail);

export { router as mailRoutes };