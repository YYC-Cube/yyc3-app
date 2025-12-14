/**
 * @file 邮件控制器
 * @description 处理邮件相关业务逻辑
 * @module mailController
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { logInfo, logError, logWarn } from '../utils/logger';
import { query, transaction } from '../config/database';
import { RedisService } from '../config/redis';
import { smtpService } from '../config/smtpService';

// 发送邮件接口
/**
 * 发送邮件
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { to, cc, bcc, subject, body, attachments } = req.body;
    
    // 输入验证
    if (!to || !subject || !body) {
      throw new ApiError(400, '收件人、主题和正文是必填项');
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateEmails = (emails: string | string[]): void => {
      const emailList = Array.isArray(emails) ? emails : [emails];
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        throw new ApiError(400, `无效的邮箱地址: ${invalidEmails.join(', ')}`);
      }
    };
    
    validateEmails(to);
    if (cc) validateEmails(cc);
    if (bcc) validateEmails(bcc);
    
    // 开始数据库事务
    const emailId = await transaction(async (client) => {
      const user = req.user!; // 使用非空断言，因为已经在函数开头检查过
      // 创建邮件
      const emailResult = await client.query(
        `INSERT INTO emails (user_id, type, from_email, to_emails, cc_emails, bcc_emails, 
                          subject, body, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id`,
        [
          user.userId,
          'sent',
          user.email,
          Array.isArray(to) ? to : [to],
          cc ? (Array.isArray(cc) ? cc : [cc]) : [],
          bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
          subject,
          body,
          'sending'
        ]
      );
      
      const emailId = emailResult.rows[0].id;
      
      // 处理附件
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const attachment of attachments) {
          await client.query(
            `INSERT INTO email_attachments (email_id, filename, mimetype, size, storage_path, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [emailId, attachment.filename, attachment.mimetype, attachment.size, attachment.path]
          );
        }
      }
      
      return emailId;
    });

    // 使用SMTP服务发送邮件
    await smtpService.sendEmail({
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject,
      text: body,
      // 如果需要支持HTML邮件，可以在这里添加html字段
      // html: body,
      attachments: attachments ? (attachments as any[]) : undefined
    });

    // 更新邮件状态为已发送
    await transaction(async (client) => {
      await client.query(
        'UPDATE emails SET status = $1, updated_at = NOW() WHERE id = $2',
        ['sent', emailId]
      );
    });
      
    logInfo('邮件发送成功', {
      userId: req.user.userId,
      emailId,
      to,
      subject
    });

    // 清除缓存
    await RedisService.del(`emails:${req.user.userId}:list`);
    
    res.status(201).json({
      success: true,
      data: {
        emailId,
        status: 'sent',
        subject,
        to,
        sentAt: new Date().toISOString()
      },
      message: '邮件发送成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('发送邮件失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '发送邮件失败，请稍后重试'));
    }
  }
};

// 获取邮件列表接口
/**
 * 获取邮件列表
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { folder = 'inbox', page = 1, limit = 20, search, status } = req.query;
    
    // 验证参数
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ApiError(400, '页码必须是正整数');
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ApiError(400, '每页数量必须在1-100之间');
    }
    
    const offset = (pageNum - 1) * limitNum;
    
    // 构建缓存键
    const cacheKey = `emails:${req.user.userId}:${folder}:${pageNum}:${limitNum}:${search || ''}:${status || ''}`;
    
    // 尝试从缓存获取
    const cachedData = await RedisService.get(cacheKey);
    if (cachedData) {
      logInfo('从缓存获取邮件列表', {
        userId: req.user?.userId,
        folder,
        page: pageNum
      });
      res.json(JSON.parse(cachedData));
      return;
    }
    
    // 构建查询
    let emailQuery = `
      SELECT e.id, e.from_email, e.to_emails, e.cc_emails, e.subject, 
             SUBSTRING(e.body FROM 1 FOR 200) as preview, 
             e.status, e.is_read, e.importance, e.type, 
             e.created_at, e.updated_at,
             COUNT(ea.id) as attachments_count
      FROM emails e
      LEFT JOIN email_attachments ea ON e.id = ea.email_id
      WHERE e.user_id = $1
    `;
    
    const params: any[] = [req.user.userId];
    let paramIndex = 2;
    
    // 添加文件夹过滤
    if (folder !== 'all') {
      emailQuery += ` AND e.folder = $${paramIndex}`;
      params.push(folder);
      paramIndex++;
    }
    
    // 添加状态过滤
    if (status) {
      emailQuery += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // 添加搜索条件
    if (search) {
      emailQuery += ` AND (e.subject ILIKE $${paramIndex} OR e.body ILIKE $${paramIndex} OR 
                    e.from_email ILIKE $${paramIndex} OR e.to_emails::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // 添加分组和排序
    emailQuery += `
      GROUP BY e.id
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limitNum, offset);
    
    // 执行查询
    const result = await query(emailQuery, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM emails WHERE user_id = $1';
    const countParams: any[] = [req.user.userId];
    let countParamIndex = 2;
    
    if (folder !== 'all') {
      countQuery += ` AND folder = $${countParamIndex}`;
      countParams.push(folder);
      countParamIndex++;
    }
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (subject ILIKE $${countParamIndex} OR body ILIKE $${countParamIndex} OR 
                        from_email ILIKE $${countParamIndex} OR to_emails::text ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        emails: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: '获取邮件列表成功'
    };
    
    // 缓存结果
    await RedisService.set(cacheKey, JSON.stringify(responseData), 300); // 5分钟过期
    
    logInfo('获取邮件列表成功', {
      userId: req.user.userId,
      folder,
      page: pageNum,
      count: result.rows.length
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件列表失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '获取邮件列表失败，请稍后重试'));
    }
  }
};

// 获取邮件详情接口
/**
 * 获取邮件详情
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmailDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    // 构建缓存键
    const cacheKey = `email:${req.user.userId}:${id}`;
    
    // 尝试从缓存获取
    const cachedData = await RedisService.get(cacheKey);
    if (cachedData) {
      logInfo('从缓存获取邮件详情', {
        userId: req.user?.userId,
        emailId: id
      });
      res.json(JSON.parse(cachedData));
      return;
    }
    
    // 查询邮件
    const emailResult = await query(
      `SELECT id, from_email, to_emails, cc_emails, bcc_emails, subject, body, 
             status, is_read, importance, type, folder, created_at, updated_at
      FROM emails 
      WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );
    
    if (emailResult.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const email = emailResult.rows[0];
    
    // 查询附件
    const attachmentsResult = await query(
      `SELECT id, filename, mimetype, size, storage_path as path, created_at
      FROM email_attachments 
      WHERE email_id = $1`,
      [id]
    );
    
    // 将邮件标记为已读
    if (!email.is_read) {
      await query(
        'UPDATE emails SET is_read = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
        [id, req.user?.userId]
      );
      email.is_read = true;
      
      // 清除列表缓存
      await RedisService.del(`emails:${req.user.userId}:${email.folder}:*`);
    }
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        email: {
          ...email,
          attachments: attachmentsResult.rows
        }
      },
      message: '获取邮件详情成功'
    };
    
    // 缓存结果
    await RedisService.set(cacheKey, JSON.stringify(responseData), 300); // 5分钟过期
    
    logInfo('获取邮件详情成功', {
      userId: req.user.userId,
      emailId: id
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件详情失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '获取邮件详情失败，请稍后重试'));
    }
  }
};

// 删除邮件接口
/**
 * 删除邮件
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const deleteEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    // 开始数据库事务
    await transaction(async (client) => {
      const user = req.user!; // 使用非空断言，因为已经在函数开头检查过
      
      // 检查邮件是否存在且属于该用户
      const emailResult = await client.query(
        'SELECT id, folder FROM emails WHERE id = $1 AND user_id = $2',
        [id, user.userId]
      );
      
      if (emailResult.rows.length === 0) {
        throw new ApiError(404, '邮件不存在');
      }
      
      const email = emailResult.rows[0];
      const folder = email.folder;
      
      // 检查是否是永久删除或移到垃圾桶
      if (email.folder === 'trash') {
        // 永久删除：删除附件
        await client.query('DELETE FROM email_attachments WHERE email_id = $1', [id]);
        
        // 删除邮件
        await client.query('DELETE FROM emails WHERE id = $1 AND user_id = $2', [id, user.userId]);
        
        logInfo('永久删除邮件成功', {
          userId: user.userId,
          emailId: id
        });
      } else {
        // 移到垃圾桶
        await client.query(
          'UPDATE emails SET folder = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
          ['trash', id, user.userId]
        );
        
        logInfo('邮件移到垃圾桶成功', {
          userId: user.userId,
          emailId: id
        });
      }
      
      // 清除缓存
      await RedisService.del(`email:${user.userId}:${id}`);
      await RedisService.del(`emails:${user.userId}:${folder}:*`);
      
      res.json({
        success: true,
        message: email.folder === 'trash' ? '邮件已永久删除' : '邮件已移至垃圾桶'
      });
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('删除邮件失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '删除邮件失败，请稍后重试'));
    }
  }
};

// 转发邮件接口
/**
 * 转发邮件
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const forwardEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    const { to, cc, bcc, subject, body } = req.body;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    if (!to) {
      throw new ApiError(400, '收件人不能为空');
    }
    
    // 查询原始邮件
    const originalEmail = await query(
      'SELECT subject, body, from_email FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (originalEmail.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const original = originalEmail.rows[0];
    
    // 使用原始主题或新主题
    const finalSubject = subject || `FWD: ${original.subject}`;
    
    // 使用原始正文或新正文，自动添加转发标记
    const finalBody = body || `
--- Forwarded message from ${original.from_email} ---
Subject: ${original.subject}

${original.body}
    `;
    
    // 创建转发邮件（复用sendEmail的逻辑）
    const forwardedEmailResult = await query(
      `INSERT INTO emails (user_id, type, from_email, to_emails, cc_emails, bcc_emails, 
                        subject, body, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING id`,
      [
        req.user.userId,
        'forwarded',
        req.user.email,
        Array.isArray(to) ? to : [to],
        cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
        finalSubject,
        finalBody,
        'sent'
      ]
    );
    
    logInfo('邮件转发成功', {
      userId: req.user.userId,
      originalEmailId: id,
      forwardedEmailId: forwardedEmailResult.rows[0].id
    });
    
    // 清除缓存
    await RedisService.del(`emails:${req.user.userId}:list`);
    
    res.status(201).json({
      success: true,
      data: {
        emailId: forwardedEmailResult.rows[0].id,
        status: 'sent',
        subject: finalSubject,
        to,
        sentAt: new Date().toISOString()
      },
      message: '邮件转发成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('转发邮件失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '转发邮件失败，请稍后重试'));
    }
  }
};

// 回复邮件接口
/**
 * 回复邮件
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const replyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    const { to, cc, bcc, subject, body, replyAll } = req.body;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    if (!body) {
      throw new ApiError(400, '回复内容不能为空');
    }
    
    // 查询原始邮件
    const originalEmail = await query(
      'SELECT subject, from_email, to_emails, cc_emails FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (originalEmail.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const original = originalEmail.rows[0];
    
    // 确定回复对象
    let recipients: string[] = [];
    
    if (replyAll) {
      // 回复所有人
      const allRecipients = [
        original.from_email,
        ...(Array.isArray(original.to_emails) ? original.to_emails : [original.to_emails]),
        ...(Array.isArray(original.cc_emails) ? original.cc_emails : original.cc_emails || [])
      ];
      
      // 去重并移除发件人自己
      recipients = [...new Set(allRecipients)].filter(email => email !== req.user?.email);
    } else if (to) {
      // 使用自定义收件人
      recipients = Array.isArray(to) ? to : [to];
    } else {
      // 默认只回复发件人
      recipients = [original.from_email];
    }
    
    if (recipients.length === 0) {
      throw new ApiError(400, '请至少指定一个收件人');
    }
    
    // 使用原始主题或新主题，自动添加回复标记
    const finalSubject = subject || (original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`);
    
    // 创建回复邮件
    const replyEmailResult = await query(
      `INSERT INTO emails (user_id, type, from_email, to_emails, cc_emails, bcc_emails, 
                        subject, body, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING id`,
      [
        req.user.userId,
        'replied',
        req.user.email,
        recipients,
        cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
        finalSubject,
        body,
        'sent'
      ]
    );
    
    // 更新原始邮件状态为已回复
    await query(
      'UPDATE emails SET is_replied = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    logInfo('邮件回复成功', {
      userId: req.user.userId,
      originalEmailId: id,
      replyEmailId: replyEmailResult.rows[0].id
    });
    
    // 清除缓存
    await RedisService.del(`email:${req.user.userId}:${id}`);
    await RedisService.del(`emails:${req.user.userId}:list`);
    
    res.status(201).json({
      success: true,
      data: {
        emailId: replyEmailResult.rows[0].id,
        status: 'sent',
        subject: finalSubject,
        to: recipients,
        sentAt: new Date().toISOString()
      },
      message: '邮件回复成功'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('回复邮件失败', error as Error, {
        userId: req.user?.userId
      });
      next(new ApiError(500, '回复邮件失败，请稍后重试'));
    }
  }
};