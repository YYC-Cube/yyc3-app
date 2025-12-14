/**
 * @file 邮件分析模型实现
 * @description 处理邮件分析和用户活动日志相关的数据访问和业务逻辑
 * @module models/analyticsModel
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { EmailAnalysis, UserActivityLog } from './index';

/**
 * 邮件分析数据访问层
 */
export class AnalyticsModel {
  /**
   * 创建邮件分析记录
   * @param analysisData 分析数据
   * @returns 创建的分析记录ID
   */
  static async createEmailAnalysis(
    analysisData: Omit<EmailAnalysis, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO email_analyses (
          email_id, user_id, sentiment_score, key_points, summary, entities
        ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          analysisData.email_id,
          analysisData.user_id,
          analysisData.sentiment_score,
          analysisData.key_points,
          analysisData.summary,
          analysisData.entities
        ]
      );

      const analysisId = result.rows[0].id;
      logger.info(`邮件分析记录创建成功: ID=${analysisId}, 邮件ID=${analysisData.email_id}`);
      return analysisId;
    } catch (error) {
      logger.error(`创建邮件分析记录失败: 邮件ID=${analysisData.email_id}`, error);
      throw new Error('创建邮件分析记录失败');
    }
  }

  /**
   * 获取邮件分析记录
   * @param emailId 邮件ID
   * @returns 分析记录
   */
  static async getEmailAnalysis(emailId: string): Promise<EmailAnalysis | null> {
    try {
      const result = await query(
        `SELECT * FROM email_analyses WHERE email_id = $1`,
        [emailId]
      );

      return result.rows.length > 0 ? (result.rows[0] as EmailAnalysis) : null;
    } catch (error) {
      logger.error(`获取邮件分析记录失败: 邮件ID=${emailId}`, error);
      throw new Error('获取邮件分析记录失败');
    }
  }

  /**
   * 更新邮件分析记录
   * @param analysisId 分析记录ID
   * @param updates 更新字段
   */
  static async updateEmailAnalysis(
    analysisId: string,
    updates: Partial<Pick<EmailAnalysis, 'sentiment_score' | 'key_points' | 'summary' | 'entities'>>
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
      values.push(analysisId);

      await query(
        `UPDATE email_analyses 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );

      logger.info(`邮件分析记录更新成功: ID=${analysisId}`);
    } catch (error) {
      logger.error(`更新邮件分析记录失败: ID=${analysisId}`, error);
      throw new Error('更新邮件分析记录失败');
    }
  }

  /**
   * 记录用户活动
   * @param activityData 活动数据
   * @returns 活动记录ID
   */
  static async logUserActivity(
    activityData: Omit<UserActivityLog, 'id' | 'created_at'>
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO user_activity_logs (
          user_id, activity_type, ip_address, user_agent, details, success
        ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          activityData.user_id,
          activityData.activity_type,
          activityData.ip_address || 'unknown',
          activityData.user_agent || 'unknown',
          activityData.details || {},
          activityData.success || true
        ]
      );

      const logId = result.rows[0].id;
      logger.info(`用户活动记录成功: ID=${logId}, 用户ID=${activityData.user_id}, 类型=${activityData.activity_type}`);
      return logId;
    } catch (error) {
      logger.error(`记录用户活动失败: 用户ID=${activityData.user_id}`, error);
      // 活动日志失败不应该影响主流程
      return 'error';
    }
  }

  /**
   * 获取用户活动日志
   * @param userId 用户ID
   * @param pagination 分页参数
   * @param filters 过滤条件
   * @returns 活动日志列表
   */
  static async getUserActivityLogs(
    userId: string,
    pagination: { offset: number; limit: number } = { offset: 0, limit: 50 },
    filters: {
      activity_type?: string;
      start_date?: Date;
      end_date?: Date;
    } = {}
  ): Promise<{ logs: UserActivityLog[]; total: number }> {
    try {
      // 构建查询条件
      let whereClause = `WHERE user_id = $1`;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filters.activity_type) {
        whereClause += ` AND activity_type = $${paramIndex}`;
        params.push(filters.activity_type);
        paramIndex++;
      }

      if (filters.start_date) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.start_date);
        paramIndex++;
      }

      if (filters.end_date) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.end_date);
        paramIndex++;
      }

      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM user_activity_logs ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      // 获取分页数据
      const logsResult = await query(
        `SELECT * FROM user_activity_logs ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pagination.limit, pagination.offset]
      );

      return {
        logs: logsResult.rows as UserActivityLog[],
        total
      };
    } catch (error) {
      logger.error(`获取用户活动日志失败: 用户ID=${userId}`, error);
      throw new Error('获取用户活动日志失败');
    }
  }

  /**
   * 获取邮件流量分析
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param groupBy 分组方式 (day, week, month)
   * @returns 邮件流量统计
   */
  static async getEmailTrafficAnalysis(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    try {
      // 根据分组方式设置日期格式
      let dateFormat = '';
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
      }

      const result = await query(
        `SELECT 
          TO_CHAR(received_at, $1) as period,
          COUNT(*) as total_emails,
          SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_emails,
          SUM(CASE WHEN is_starred THEN 1 ELSE 0 END) as starred_emails,
          SUM(CASE WHEN is_spam THEN 1 ELSE 0 END) as spam_emails
         FROM emails
         WHERE user_id = $2 AND received_at BETWEEN $3 AND $4 AND is_deleted = false
         GROUP BY period
         ORDER BY period`,
        [dateFormat, userId, startDate, endDate]
      );

      return result.rows as Array<{ activity_type: string; count: number }>;
    } catch (error) {
      logger.error(`获取邮件流量分析失败: 用户ID=${userId}`, error);
      throw new Error('获取邮件流量分析失败');
    }
  }

  /**
   * 获取用户活动分析
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 活动类型统计
   */
  static async getUserActivityAnalysis(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ activity_type: string; count: number }>> {
    try {
      const result = await query(
        `SELECT 
          activity_type,
          COUNT(*) as count
         FROM user_activity_logs
         WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY activity_type
         ORDER BY count DESC`,
        [userId, startDate, endDate]
      );

      return result.rows as Array<{ activity_type: string; count: number }>;
    } catch (error) {
      logger.error(`获取用户活动分析失败: 用户ID=${userId}`, error);
      throw new Error('获取用户活动分析失败');
    }
  }

  /**
   * 批量分析邮件
   * @param emailIds 邮件ID列表
   * @param userId 用户ID
   * @param analysisFunction 分析函数
   * @returns 分析结果列表
   */
  static async batchAnalyzeEmails(
    emailIds: string[],
    userId: string,
    analysisFunction: (emailId: string) => Promise<any>
  ): Promise<any[]> {
    return transaction(async (client) => {
      const results: any[] = [];
      
      for (const emailId of emailIds) {
        try {
          // 验证邮件存在且属于该用户
          const emailResult = await client.query(
            `SELECT id FROM emails WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
            [emailId, userId]
          );
          
          if (emailResult.rows.length === 0) {
            results.push({ email_id: emailId, success: false, error: '邮件不存在' });
            continue;
          }
          
          // 执行分析
          const analysisResult = await analysisFunction(emailId);
          
          // 保存分析结果
          const insertResult = await client.query(
            `INSERT INTO email_analyses (
              email_id, user_id, sentiment_score, key_points, summary, entities
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email_id) DO UPDATE SET
              sentiment_score = EXCLUDED.sentiment_score,
              key_points = EXCLUDED.key_points,
              summary = EXCLUDED.summary,
              entities = EXCLUDED.entities,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id`,
            [
              emailId,
              userId,
              analysisResult.sentiment_score,
              analysisResult.key_points,
              analysisResult.summary,
              analysisResult.entities || []
            ]
          );
          
          results.push({
            email_id: emailId,
            success: true,
            analysis_id: insertResult.rows[0].id
          });
          
        } catch (error) {
          results.push({
            email_id: emailId,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      return results;
    });
  }

  /**
   * 清理过期的活动日志
   * @param daysToKeep 保留天数
   */
  static async cleanupOldActivityLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const result = await query(
        `DELETE FROM user_activity_logs 
         WHERE created_at < CURRENT_DATE - INTERVAL '$1 days'`,
        [daysToKeep]
      );

      logger.info(`清理过期活动日志成功: 删除记录数=${result.rowCount}`);
    } catch (error) {
      logger.error('清理过期活动日志失败', error);
      throw new Error('清理过期活动日志失败');
    }
  }
}
