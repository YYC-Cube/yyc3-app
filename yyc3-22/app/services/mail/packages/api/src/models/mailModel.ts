/**
 * @file 邮件模型实现
 * @description 处理邮件相关的数据访问和业务逻辑
 * @module models/mailModel
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { Email, EmailAttachment, EmailCategory } from './index';

/**
 * 邮件数据访问层
 */
export class MailModel {
  /**
   * 创建新邮件
   * @param emailData 邮件数据
   * @param attachments 附件列表
   * @param categories 分类列表
   * @returns 创建的邮件ID
   */
  static async createEmail(
    emailData: Omit<Email, 'id' | 'created_at' | 'updated_at'>,
    attachments: Omit<EmailAttachment, 'id'>[] = [],
    categories: string[] = []
  ): Promise<string> {
    return transaction(async (client) => {
      // 创建邮件主记录
      const emailResult = await client.query(
        `INSERT INTO emails (
          user_id, sender, recipients, subject, body, is_read, is_starred, 
          is_draft, is_deleted, sent_at, received_at, thread_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          emailData.user_id,
          emailData.sender,
          emailData.recipients,
          emailData.subject,
          emailData.body,
          emailData.is_read || false,
          emailData.is_starred || false,
          emailData.is_draft || false,
          emailData.is_deleted || false,
          emailData.sent_at,
          emailData.received_at,
          emailData.thread_id
        ]
      );

      const emailId = emailResult.rows[0].id;

      // 创建附件记录
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          await client.query(
            `INSERT INTO email_attachments (
              email_id, filename, content_type, size, storage_path, upload_url
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [emailId, attachment.filename, attachment.content_type, attachment.size, attachment.storage_path, attachment.upload_url]
          );
        }
      }

      // 创建分类关联
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await client.query(
            `INSERT INTO email_categories (email_id, category_id) VALUES ($1, $2)`,
            [emailId, categoryId]
          );
        }
      }

      logger.info(`邮件创建成功: ID=${emailId}, 用户ID=${emailData.user_id}`);
      return emailId;
    });
  }

  /**
   * 获取邮件列表
   * @param userId 用户ID
   * @param filter 过滤条件
   * @param pagination 分页参数
   * @returns 邮件列表和总数
   */
  static async getEmails(
    userId: string,
    filter: {
      folder?: string;
      search?: string;
      category?: string;
      is_read?: boolean;
      is_starred?: boolean;
      date_from?: Date;
      date_to?: Date;
    } = {},
    pagination: {
      offset: number;
      limit: number;
    } = { offset: 0, limit: 20 }
  ): Promise<{ emails: Email[]; total: number }> {
    try {
      // 构建查询条件
      let whereClause = `WHERE e.user_id = $1 AND e.is_deleted = false`;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filter.folder) {
        switch (filter.folder) {
          case 'inbox':
            whereClause += ` AND e.is_draft = false AND e.is_sent = false`;
            break;
          case 'sent':
            whereClause += ` AND e.is_draft = false AND e.is_sent = true`;
            break;
          case 'drafts':
            whereClause += ` AND e.is_draft = true`;
            break;
          case 'starred':
            whereClause += ` AND e.is_starred = true`;
            break;
        }
      }

      if (filter.search) {
        whereClause += ` AND (e.subject ILIKE $${paramIndex} OR e.body ILIKE $${paramIndex} OR e.sender ILIKE $${paramIndex})`;
        params.push(`%${filter.search}%`);
        paramIndex++;
      }

      if (filter.category) {
        whereClause += ` AND EXISTS (SELECT 1 FROM email_categories ec WHERE ec.email_id = e.id AND ec.category_id = $${paramIndex})`;
        params.push(filter.category);
        paramIndex++;
      }

      if (filter.is_read !== undefined) {
        whereClause += ` AND e.is_read = $${paramIndex}`;
        params.push(filter.is_read);
        paramIndex++;
      }

      if (filter.is_starred !== undefined) {
        whereClause += ` AND e.is_starred = $${paramIndex}`;
        params.push(filter.is_starred);
        paramIndex++;
      }

      if (filter.date_from) {
        whereClause += ` AND e.received_at >= $${paramIndex}`;
        params.push(filter.date_from);
        paramIndex++;
      }

      if (filter.date_to) {
        whereClause += ` AND e.received_at <= $${paramIndex}`;
        params.push(filter.date_to);
        paramIndex++;
      }

      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM emails e ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      // 获取分页数据
      const emailsResult = await query(
        `SELECT e.* FROM emails e ${whereClause}
         ORDER BY e.received_at DESC, e.sent_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pagination.limit, pagination.offset]
      );

      return {
        emails: emailsResult.rows as Email[],
        total
      };
    } catch (error) {
      logger.error(`获取邮件列表失败: 用户ID=${userId}`, error);
      throw new Error('获取邮件列表失败');
    }
  }

  /**
   * 获取邮件详情
   * @param emailId 邮件ID
   * @param userId 用户ID
   * @returns 邮件详情（包含附件和分类）
   */
  static async getEmailDetail(emailId: string, userId: string): Promise<any> {
    try {
      // 获取邮件主信息
      const emailResult = await query(
        `SELECT * FROM emails WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
        [emailId, userId]
      );

      if (emailResult.rows.length === 0) {
        throw new Error('邮件不存在');
      }

      const email = emailResult.rows[0];

      // 获取附件信息
      const attachmentsResult = await query(
        `SELECT * FROM email_attachments WHERE email_id = $1`,
        [emailId]
      );

      // 获取分类信息
      const categoriesResult = await query(
        `SELECT c.id, c.name, c.color 
         FROM categories c
         JOIN email_categories ec ON c.id = ec.category_id
         WHERE ec.email_id = $1`,
        [emailId]
      );

      return {
        ...email,
        attachments: attachmentsResult.rows,
        categories: categoriesResult.rows
      };
    } catch (error) {
      logger.error(`获取邮件详情失败: 邮件ID=${emailId}, 用户ID=${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新邮件状态
   * @param emailId 邮件ID
   * @param userId 用户ID
   * @param updates 更新字段
   */
  static async updateEmail(
    emailId: string,
    userId: string,
    updates: Partial<Pick<Email, 'is_read' | 'is_starred' | 'is_deleted' | 'thread_id'>>
  ): Promise<void> {
    try {
      // 构建更新语句
      const fields = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([field, value]) => {
        fields.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      });

      // 添加更新时间
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      // 添加WHERE条件参数
      values.push(emailId, userId);

      await query(
        `UPDATE emails SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
        values
      );

      logger.info(`邮件更新成功: 邮件ID=${emailId}, 用户ID=${userId}`);
    } catch (error) {
      logger.error(`更新邮件失败: 邮件ID=${emailId}, 用户ID=${userId}`, error);
      throw new Error('更新邮件失败');
    }
  }

  /**
   * 删除邮件（软删除）
   * @param emailIds 邮件ID列表
   * @param userId 用户ID
   */
  static async deleteEmails(emailIds: string[], userId: string): Promise<void> {
    try {
      await query(
        `UPDATE emails SET is_deleted = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ANY($1) AND user_id = $2`,
        [emailIds, userId]
      );

      logger.info(`邮件删除成功: 数量=${emailIds.length}, 用户ID=${userId}`);
    } catch (error) {
      logger.error(`删除邮件失败: 数量=${emailIds.length}, 用户ID=${userId}`, error);
      throw new Error('删除邮件失败');
    }
  }

  /**
   * 彻底删除邮件（管理员功能）
   * @param emailId 邮件ID
   */
  static async permanentlyDeleteEmail(emailId: string): Promise<void> {
    return transaction(async (client) => {
      // 删除关联的附件记录
      await client.query(
        `DELETE FROM email_attachments WHERE email_id = $1`,
        [emailId]
      );

      // 删除分类关联
      await client.query(
        `DELETE FROM email_categories WHERE email_id = $1`,
        [emailId]
      );

      // 删除邮件记录
      await client.query(
        `DELETE FROM emails WHERE id = $1`,
        [emailId]
      );

      logger.info(`邮件彻底删除成功: 邮件ID=${emailId}`);
    });
  }

  /**
   * 添加邮件附件
   * @param emailId 邮件ID
   * @param attachment 附件信息
   * @returns 附件ID
   */
  static async addAttachment(
    emailId: string,
    attachment: Omit<EmailAttachment, 'id'>
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO email_attachments (
          email_id, filename, content_type, size, storage_path, upload_url
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [emailId, attachment.filename, attachment.content_type, attachment.size, attachment.storage_path, attachment.upload_url]
      );

      const attachmentId = result.rows[0].id;
      logger.info(`附件添加成功: 附件ID=${attachmentId}, 邮件ID=${emailId}`);
      return attachmentId;
    } catch (error) {
      logger.error(`添加附件失败: 邮件ID=${emailId}`, error);
      throw new Error('添加附件失败');
    }
  }

  /**
   * 获取邮件统计信息
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 统计数据
   */
  static async getEmailStatistics(userId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_emails,
          SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_emails,
          SUM(CASE WHEN is_starred THEN 1 ELSE 0 END) as starred_emails,
          SUM(CASE WHEN is_draft THEN 1 ELSE 0 END) as draft_emails,
          SUM(CASE WHEN is_sent THEN 1 ELSE 0 END) as sent_emails
         FROM emails 
         WHERE user_id = $1 AND received_at BETWEEN $2 AND $3 AND is_deleted = false`,
        [userId, startDate, endDate]
      );

      return result.rows[0];
    } catch (error) {
      logger.error(`获取邮件统计失败: 用户ID=${userId}`, error);
      throw new Error('获取邮件统计失败');
    }
  }

  /**
   * 获取高频发件人列表
   * @param userId 用户ID
   * @param limit 限制数量
   * @returns 发件人列表
   */
  static async getTopSenders(userId: string, limit: number = 10): Promise<Array<{ sender: string; count: number }>> {
    try {
      const result = await query(
        `SELECT sender, COUNT(*) as count 
         FROM emails 
         WHERE user_id = $1 AND is_sent = false AND is_deleted = false
         GROUP BY sender
         ORDER BY count DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows as Array<{ sender: string; count: number }>;
    } catch (error) {
      logger.error(`获取高频发件人失败: 用户ID=${userId}`, error);
      throw new Error('获取高频发件人失败');
    }
  }
}
