/**
 * @file 邮件分类模型实现
 * @description 处理邮件分类相关的数据访问和业务逻辑
 * @module models/categoryModel
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { EmailCustomCategory } from './index';

/**
 * 邮件分类数据访问层
 */
export class CategoryModel {
  /**
   * 创建新分类
   * @param categoryData 分类数据
   * @returns 创建的分类对象
   */
  static async createCategory(categoryData: Omit<EmailCustomCategory, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'is_default'>): Promise<EmailCustomCategory> {
    try {
      const result = await query(
        `INSERT INTO categories (user_id, name, color, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, name, color, description, created_at, updated_at`,
        [categoryData.user_id, categoryData.name, categoryData.color || '#4A90E2', categoryData.description || '']
      );

      const category = result.rows[0];
      logger.info(`分类创建成功: ID=${category.id}, 名称=${category.name}, 用户ID=${category.user_id}`);
      return category as EmailCustomCategory;
    } catch (error) {
      logger.error(`创建分类失败: 用户ID=${categoryData.user_id}, 名称=${categoryData.name}`, error);
      throw new Error('创建分类失败');
    }
  }

  /**
   * 获取用户的所有分类
   * @param userId 用户ID
   * @returns 分类列表
   */
  static async getUserCategories(userId: string): Promise<EmailCustomCategory[]> {
    try {
      const result = await query(
        `SELECT id, user_id, name, color, description, created_at, updated_at
         FROM categories
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows as EmailCustomCategory[];
    } catch (error) {
      logger.error(`获取用户分类失败: 用户ID=${userId}`, error);
      throw new Error('获取用户分类失败');
    }
  }

  /**
   * 获取分类详情
   * @param categoryId 分类ID
   * @param userId 用户ID
   * @returns 分类详情
   */
  static async getCategoryById(categoryId: string, userId: string): Promise<EmailCustomCategory> {
    try {
      const result = await query(
        `SELECT id, user_id, name, color, description, created_at, updated_at
         FROM categories
         WHERE id = $1 AND user_id = $2`,
        [categoryId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('分类不存在');
      }

      return result.rows[0] as EmailCustomCategory;
    } catch (error) {
      logger.error(`获取分类详情失败: 分类ID=${categoryId}, 用户ID=${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新分类
   * @param categoryId 分类ID
   * @param userId 用户ID
   * @param updates 更新字段
   * @returns 更新后的分类对象
   */
  static async updateCategory(
    categoryId: string,
    userId: string,
    updates: Partial<Pick<EmailCustomCategory, 'name' | 'color'>>
  ): Promise<EmailCustomCategory> {
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
      values.push(categoryId, userId);

      const result = await query(
        `UPDATE categories 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING id, user_id, name, color, description, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('分类不存在或无权更新');
      }

      const updatedCategory = result.rows[0];
      logger.info(`分类更新成功: ID=${updatedCategory.id}, 名称=${updatedCategory.name}`);
      return updatedCategory as EmailCustomCategory;
    } catch (error) {
      logger.error(`更新分类失败: 分类ID=${categoryId}, 用户ID=${userId}`, error);
      throw error;
    }
  }

  /**
   * 删除分类
   * @param categoryId 分类ID
   * @param userId 用户ID
   */
  static async deleteCategory(categoryId: string, userId: string): Promise<void> {
    return transaction(async (client) => {
      // 检查分类是否存在且属于该用户
      const categoryResult = await client.query(
        `SELECT id FROM categories WHERE id = $1 AND user_id = $2`,
        [categoryId, userId]
      );

      if (categoryResult.rows.length === 0) {
        throw new Error('分类不存在或无权删除');
      }

      // 删除分类与邮件的关联
      await client.query(
        `DELETE FROM email_categories WHERE category_id = $1`,
        [categoryId]
      );

      // 删除分类
      await client.query(
        `DELETE FROM categories WHERE id = $1`,
        [categoryId]
      );

      logger.info(`分类删除成功: 分类ID=${categoryId}, 用户ID=${userId}`);
    });
  }

  /**
   * 为邮件添加分类
   * @param emailId 邮件ID
   * @param categoryId 分类ID
   * @param userId 用户ID
   */
  static async addCategoryToEmail(emailId: string, categoryId: string, userId: string): Promise<void> {
    try {
      // 验证邮件和分类是否存在且属于该用户
      await query(
        `WITH email_check AS (
          SELECT id FROM emails WHERE id = $1 AND user_id = $2
        ),
        category_check AS (
          SELECT id FROM categories WHERE id = $3 AND user_id = $2
        )
        SELECT 
          CASE WHEN (SELECT COUNT(*) FROM email_check) = 0 THEN '邮件不存在' 
               WHEN (SELECT COUNT(*) FROM category_check) = 0 THEN '分类不存在' 
               ELSE NULL END as error
        `,
        [emailId, userId, categoryId]
      ).then(result => {
        if (result.rows[0].error) {
          throw new Error(result.rows[0].error);
        }
      });

      // 添加分类关联
      await query(
        `INSERT INTO email_categories (email_id, category_id)
         VALUES ($1, $2)
         ON CONFLICT (email_id, category_id) DO NOTHING`,
        [emailId, categoryId]
      );

      logger.info(`邮件添加分类成功: 邮件ID=${emailId}, 分类ID=${categoryId}`);
    } catch (error) {
      logger.error(`邮件添加分类失败: 邮件ID=${emailId}, 分类ID=${categoryId}`, error);
      throw error;
    }
  }

  /**
   * 从邮件中移除分类
   * @param emailId 邮件ID
   * @param categoryId 分类ID
   * @param userId 用户ID
   */
  static async removeCategoryFromEmail(emailId: string, categoryId: string, userId: string): Promise<void> {
    try {
      // 验证邮件和分类是否存在且属于该用户
      await query(
        `WITH email_check AS (
          SELECT id FROM emails WHERE id = $1 AND user_id = $2
        ),
        category_check AS (
          SELECT id FROM categories WHERE id = $3 AND user_id = $2
        )
        SELECT 
          CASE WHEN (SELECT COUNT(*) FROM email_check) = 0 THEN '邮件不存在' 
               WHEN (SELECT COUNT(*) FROM category_check) = 0 THEN '分类不存在' 
               ELSE NULL END as error
        `,
        [emailId, userId, categoryId]
      ).then(result => {
        if (result.rows[0].error) {
          throw new Error(result.rows[0].error);
        }
      });

      // 移除分类关联
      const result = await query(
        `DELETE FROM email_categories 
         WHERE email_id = $1 AND category_id = $2`,
        [emailId, categoryId]
      );

      if (result.rowCount === 0) {
        throw new Error('邮件未添加该分类');
      }

      logger.info(`邮件移除分类成功: 邮件ID=${emailId}, 分类ID=${categoryId}`);
    } catch (error) {
      logger.error(`邮件移除分类失败: 邮件ID=${emailId}, 分类ID=${categoryId}`, error);
      throw error;
    }
  }

  /**
   * 获取分类邮件统计
   * @param userId 用户ID
   * @returns 分类统计列表
   */
  static async getCategoryStatistics(userId: string): Promise<Array<{
    id: string;
    name: string;
    color: string;
    email_count: number;
  }>> {
    try {
      const result = await query(
        `SELECT 
          c.id, 
          c.name, 
          c.color,
          COUNT(ec.email_id) as email_count
         FROM categories c
         LEFT JOIN email_categories ec ON c.id = ec.category_id
         LEFT JOIN emails e ON ec.email_id = e.id AND e.is_deleted = false
         WHERE c.user_id = $1
         GROUP BY c.id, c.name, c.color
         ORDER BY email_count DESC`,
        [userId]
      );

      return result.rows as Array<{ id: string; name: string; color: string; email_count: number }>;
    } catch (error) {
      logger.error(`获取分类统计失败: 用户ID=${userId}`, error);
      throw new Error('获取分类统计失败');
    }
  }

  /**
   * 创建系统默认分类
   * @param userId 用户ID
   */
  static async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      { name: '重要', color: '#E53935', description: '重要邮件' },
      { name: '工作', color: '#1E88E5', description: '工作相关邮件' },
      { name: '个人', color: '#43A047', description: '个人相关邮件' },
      { name: '促销', color: '#FB8C00', description: '促销和广告邮件' },
      { name: '社交', color: '#8E24AA', description: '社交媒体通知' }
    ];

    try {
      for (const category of defaultCategories) {
        await query(
          `INSERT INTO categories (user_id, name, color, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, name) DO NOTHING`,
          [userId, category.name, category.color, category.description]
        );
      }

      logger.info(`创建默认分类成功: 用户ID=${userId}`);
    } catch (error) {
      logger.error(`创建默认分类失败: 用户ID=${userId}`, error);
      throw new Error('创建默认分类失败');
    }
  }
}
