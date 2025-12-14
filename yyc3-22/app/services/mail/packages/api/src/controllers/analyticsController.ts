/**
 * @file 分析控制器
 * @description 处理邮件统计和分析相关业务逻辑
 * @module analyticsController
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { logInfo, logError } from '../utils/logger';
import { query } from '../config/database';
import { redisClient } from '../config/redis';

// 邮件统计概览接口
/**
 * 获取邮件统计概览
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmailStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { timeRange = '30d' } = req.query;
    
    // 验证时间范围参数
    const validRanges = ['7d', '30d', '90d', '1y', 'all'];
    if (!validRanges.includes(timeRange as string)) {
      throw new ApiError(400, `无效的时间范围，支持的值: ${validRanges.join(', ')}`);
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:overview:${timeRange}`;
    
    // 尝试从缓存获取
    const cachedStats = await redisClient.get(cacheKey);
    if (cachedStats) {
      logInfo('从缓存获取邮件统计概览', {
        userId: req.user.userId,
        timeRange
      });
      res.json(JSON.parse(cachedStats));
      return;
    }
    
    // 构建时间查询条件
    let timeCondition = '';
    const params: any[] = [req.user.userId];
    
    switch (timeRange) {
      case '7d':
        timeCondition = 'AND created_at >= NOW() - INTERVAL \'7 days\'';
        break;
      case '30d':
        timeCondition = 'AND created_at >= NOW() - INTERVAL \'30 days\'';
        break;
      case '90d':
        timeCondition = 'AND created_at >= NOW() - INTERVAL \'90 days\'';
        break;
      case '1y':
        timeCondition = 'AND created_at >= NOW() - INTERVAL \'1 year\'';
        break;
      case 'all':
      default:
        timeCondition = '';
    }
    
    // 获取统计数据
    const [totalStatsResult, categoryStatsResult, dailyStatsResult] = await Promise.all([
      // 总统计
      query(
        `SELECT 
          COUNT(*) as total_emails,
          SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_emails,
          SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_emails,
          SUM(CASE WHEN is_starred = true THEN 1 ELSE 0 END) as starred_emails,
          SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_emails,
          MAX(created_at) as latest_email
         FROM emails 
         WHERE user_id = $1 ${timeCondition}`,
        params
      ),
      
      // 分类统计
      query(
        `SELECT 
          COALESCE(categories[1], 'unclassified') as category,
          COUNT(*) as count
         FROM emails 
         WHERE user_id = $1 ${timeCondition}
         GROUP BY COALESCE(categories[1], 'unclassified')
         ORDER BY count DESC
         LIMIT 10`,
        params
      ),
      
      // 每日邮件趋势（最近7天）
      query(
        `SELECT 
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as count,
          SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_count
         FROM emails 
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL \'7 days\'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY day`,
        params
      )
    ]);
    
    const totalStats = totalStatsResult.rows[0];
    const categoryStats = categoryStatsResult.rows;
    const dailyStats = dailyStatsResult.rows;
    
    // 计算额外指标
    const readRate = totalStats.total_emails > 0 ? 
      (totalStats.read_emails / totalStats.total_emails * 100).toFixed(1) : '0';
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        summary: {
          totalEmails: parseInt(totalStats.total_emails, 10),
          readEmails: parseInt(totalStats.read_emails, 10),
          unreadEmails: parseInt(totalStats.unread_emails, 10),
          starredEmails: parseInt(totalStats.starred_emails, 10),
          importantEmails: parseInt(totalStats.important_emails, 10),
          readRate: `${readRate}%`,
          latestEmail: totalStats.latest_email
        },
        categories: categoryStats.map((row: any) => ({
          category: row.category,
          count: row.count,
          percentage: totalStats.total_emails > 0 ? 
            (row.count / totalStats.total_emails * 100).toFixed(1) : '0'
        })),
        dailyTrend: dailyStats.map((row: any) => ({
          day: row.day.toISOString().split('T')[0],
          total: row.count,
          read: row.read_count,
          unread: row.count - row.read_count
        }))
      },
      message: '邮件统计概览获取成功',
      timeRange
    };
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 }); // 1小时过期
    
    logInfo('获取邮件统计概览成功', {
      userId: req.user.userId,
      timeRange,
      totalEmails: totalStats.total_emails
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件统计概览失败', error as Error);
      next(new ApiError(500, '获取邮件统计概览失败，请稍后重试'));
    }
  }
};

// 邮件流量分析接口
/**
 * 获取邮件流量分析
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmailTrafficAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // 验证分组参数
    const validGroupBy = ['day', 'week', 'month', 'hour'];
    if (!validGroupBy.includes(groupBy as string)) {
      throw new ApiError(400, `无效的分组方式，支持的值: ${validGroupBy.join(', ')}`);
    }
    
    // 验证日期参数
    if (startDate && !isValidDate(startDate as string)) {
      throw new ApiError(400, '无效的开始日期格式');
    }
    if (endDate && !isValidDate(endDate as string)) {
      throw new ApiError(400, '无效的结束日期格式');
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:traffic:${startDate || 'all'}:${endDate || 'all'}:${groupBy}`;
    
    // 尝试从缓存获取
    const cachedAnalysis = await redisClient.get(cacheKey);
    if (cachedAnalysis) {
      logInfo('从缓存获取邮件流量分析', {
        userId: req.user.userId,
        groupBy
      });
      res.json(JSON.parse(cachedAnalysis));
      return;
    }
    
    // 构建日期查询条件
    let dateCondition = '';
    const params: any[] = [req.user.userId];
    let paramIndex = 2;
    
    if (startDate) {
      dateCondition += `AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认最近30天
      dateCondition += `AND created_at >= NOW() - INTERVAL \'30 days\'`;
    }
    
    if (endDate) {
      dateCondition += `AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // 构建分组表达式
    let groupExpression = '';
    switch (groupBy) {
      case 'day':
        groupExpression = 'DATE_TRUNC(\'day\', created_at)';
        break;
      case 'week':
        groupExpression = 'DATE_TRUNC(\'week\', created_at)';
        break;
      case 'month':
        groupExpression = 'DATE_TRUNC(\'month\', created_at)';
        break;
      case 'hour':
        groupExpression = 'DATE_TRUNC(\'hour\', created_at)';
        break;
    }
    
    // 获取流量数据
    const trafficResult = await query(
      `SELECT 
        ${groupExpression} as period,
        COUNT(*) as total_count,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count,
        SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_count
       FROM emails 
       WHERE user_id = $1 ${dateCondition}
       GROUP BY ${groupExpression}
       ORDER BY period`,
      params
    );
    
    // 获取发送方统计
    const sendersResult = await query(
      `SELECT 
        sender_email as sender,
        COUNT(*) as count,
        MAX(created_at) as latest_email
       FROM emails 
       WHERE user_id = $1 AND direction = 'incoming' ${dateCondition}
       GROUP BY sender_email
       ORDER BY count DESC
       LIMIT 10`,
      params
    );
    
    // 获取接收方统计
    const recipientsResult = await query(
      `SELECT 
        recipient_email as recipient,
        COUNT(*) as count,
        MAX(created_at) as latest_email
       FROM email_recipients 
       WHERE email_id IN (
         SELECT id FROM emails WHERE user_id = $1 AND direction = 'outgoing' ${dateCondition}
       )
       GROUP BY recipient_email
       ORDER BY count DESC
       LIMIT 10`,
      params
    );
    
    const trafficData = trafficResult.rows;
    const topSenders = sendersResult.rows;
    const topRecipients = recipientsResult.rows;
    
    // 计算总计
    const totalIncoming = trafficData.reduce((sum, item) => sum + item.incoming_count, 0);
    const totalOutgoing = trafficData.reduce((sum, item) => sum + item.outgoing_count, 0);
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        traffic: trafficData.map((row: any) => ({
          period: row.period,
          total: row.total_count,
          incoming: row.incoming_count,
          outgoing: row.outgoing_count,
          readRate: row.total_count > 0 ? 
            (row.read_count / row.total_count * 100).toFixed(1) : '0'
        })),
        topSenders: topSenders.map((row: any) => ({
          sender: row.sender,
          count: row.count,
          percentage: totalIncoming > 0 ? 
            (row.count / totalIncoming * 100).toFixed(1) : '0',
          latestEmail: row.latest_email
        })),
        topRecipients: topRecipients.map((row: any) => ({
          recipient: row.recipient,
          count: row.count,
          percentage: totalOutgoing > 0 ? 
            (row.count / totalOutgoing * 100).toFixed(1) : '0',
          latestEmail: row.latest_email
        })),
        summary: {
          totalEmails: totalIncoming + totalOutgoing,
          incoming: totalIncoming,
          outgoing: totalOutgoing,
          ratio: totalOutgoing > 0 ? 
            (totalIncoming / totalOutgoing).toFixed(2) : 'Infinity'
        }
      },
      message: '邮件流量分析获取成功',
      dateRange: {
        startDate,
        endDate
      },
      groupBy
    };
    
    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)); // 1小时过期
    
    logInfo('获取邮件流量分析成功', {
      userId: req.user.userId,
      totalEmails: totalIncoming + totalOutgoing
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件流量分析失败', error as Error);
      next(new ApiError(500, '获取邮件流量分析失败，请稍后重试'));
    }
  }
};


// 邮件分类趋势接口
/**
 * 获取邮件分类趋势
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmailCategoryTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // 验证分组参数
    const validGroupBy = ['day', 'week', 'month', 'hour'];
    if (!validGroupBy.includes(groupBy as string)) {
      throw new ApiError(400, `无效的分组方式，支持的值: ${validGroupBy.join(', ')}`);
    }
    
    // 验证日期参数
    if (startDate && !isValidDate(startDate as string)) {
      throw new ApiError(400, '无效的开始日期格式');
    }
    if (endDate && !isValidDate(endDate as string)) {
      throw new ApiError(400, '无效的结束日期格式');
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:traffic:${startDate || 'all'}:${endDate || 'all'}:${groupBy}`;
    
    // 尝试从缓存获取
    const cachedAnalysis = await redisClient.get(cacheKey);
    if (cachedAnalysis) {
      logInfo('从缓存获取邮件流量分析', {
        userId: req.user.userId,
        groupBy
      });
      res.json(JSON.parse(cachedAnalysis));
      return;
    }
    
    // 构建日期查询条件
    let dateCondition = '';
    const params: any[] = [req.user.userId];
    let paramIndex = 2;
    
    if (startDate) {
      dateCondition += `AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认最近30天
      dateCondition += `AND created_at >= NOW() - INTERVAL \'30 days\'`;
    }
    
    if (endDate) {
      dateCondition += `AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // 构建分组表达式
    let groupExpression = '';
    switch (groupBy) {
      case 'day':
        groupExpression = 'DATE_TRUNC(\'day\', created_at)';
        break;
      case 'week':
        groupExpression = 'DATE_TRUNC(\'week\', created_at)';
        break;
      case 'month':
        groupExpression = 'DATE_TRUNC(\'month\', created_at)';
        break;
      case 'hour':
        groupExpression = 'DATE_TRUNC(\'hour\', created_at)';
        break;
    }
    
    // 获取流量数据
    const trafficResult = await query(
      `SELECT 
        ${groupExpression} as period,
        COUNT(*) as total_count,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count,
        SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_count
       FROM emails 
       WHERE user_id = $1 ${dateCondition}
       GROUP BY ${groupExpression}
       ORDER BY period`,
      params
    );
    
    // 获取发送方统计
    const sendersResult = await query(
      `SELECT 
        sender_email as sender,
        COUNT(*) as count,
        MAX(created_at) as latest_email
       FROM emails 
       WHERE user_id = $1 AND direction = 'incoming' ${dateCondition}
       GROUP BY sender_email
       ORDER BY count DESC
       LIMIT 10`,
      params
    );
    
    // 获取接收方统计
    const recipientsResult = await query(
      `SELECT 
        recipient_email as recipient,
        COUNT(*) as count,
        MAX(created_at) as latest_email
       FROM email_recipients 
       WHERE email_id IN (
         SELECT id FROM emails WHERE user_id = $1 AND direction = 'outgoing' ${dateCondition}
       )
       GROUP BY recipient_email
       ORDER BY count DESC
       LIMIT 10`,
      params
    );
    
    const trafficData = trafficResult.rows;
    const topSenders = sendersResult.rows;
    const topRecipients = recipientsResult.rows;
    
    // 计算总计
    const totalIncoming = trafficData.reduce((sum, item) => sum + item.incoming_count, 0);
    const totalOutgoing = trafficData.reduce((sum, item) => sum + item.outgoing_count, 0);
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        traffic: trafficData.map((row: any) => ({
          period: row.period,
          total: row.total_count,
          incoming: row.incoming_count,
          outgoing: row.outgoing_count,
          readRate: row.total_count > 0 ? 
            (row.read_count / row.total_count * 100).toFixed(1) : '0'
        })),
        topSenders: topSenders.map((row: any) => ({
          sender: row.sender,
          count: row.count,
          percentage: totalIncoming > 0 ? 
            (row.count / totalIncoming * 100).toFixed(1) : '0',
          latestEmail: row.latest_email
        })),
        topRecipients: topRecipients.map((row: any) => ({
          recipient: row.recipient,
          count: row.count,
          percentage: totalOutgoing > 0 ? 
            (row.count / totalOutgoing * 100).toFixed(1) : '0',
          latestEmail: row.latest_email
        })),
        summary: {
          totalEmails: totalIncoming + totalOutgoing,
          incoming: totalIncoming,
          outgoing: totalOutgoing,
          ratio: totalOutgoing > 0 ? 
            (totalIncoming / totalOutgoing).toFixed(2) : 'Infinity'
        }
      },
      message: '邮件流量分析获取成功',
      dateRange: {
        startDate,
        endDate
      },
      groupBy
    };
    
    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)); // 1小时过期
    
    logInfo('获取邮件流量分析成功', {
      userId: req.user.userId,
      totalEmails: totalIncoming + totalOutgoing
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件流量分析失败', error as Error);
      next(new ApiError(500, '获取邮件流量分析失败，请稍后重试'));
    }
  }
};

// 用户活动分析接口
/**
 * 获取用户活动分析
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getUserActivityAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { startDate, endDate, activityType = 'all' } = req.query;
    
    // 验证活动类型
    const validActivityTypes = ['all', 'read', 'send', 'star', 'delete', 'archive'];
    if (!validActivityTypes.includes(activityType as string)) {
      throw new ApiError(400, `无效的活动类型，支持的值: ${validActivityTypes.join(', ')}`);
    }
    
    // 验证日期参数
    if (startDate && !isValidDate(startDate as string)) {
      throw new ApiError(400, '无效的开始日期格式');
    }
    
    if (endDate && !isValidDate(endDate as string)) {
      throw new ApiError(400, '无效的结束日期格式');
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:activity:${startDate || 'all'}:${endDate || 'all'}:${activityType}`;
    
    // 尝试从缓存获取
    const cachedActivity = await redisClient.get(cacheKey);
    if (cachedActivity) {
      logInfo('从缓存获取用户活动分析', {
        userId: req.user.userId,
        activityType
      });
      res.json(JSON.parse(cachedActivity));
    }
    
    // 构建日期查询条件
    let dateCondition = '';
    const params: any[] = [req.user.userId];
    let paramIndex = 2;
    
    if (startDate) {
      dateCondition += `AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认最近30天
      dateCondition += `AND created_at >= NOW() - INTERVAL \'30 days\'`;
    }
    
    if (endDate) {
      dateCondition += `AND created_at <= $${paramIndex}`;
      params.push(endDate);
    }
    
    // 构建活动类型条件
    let activityCondition = '';
    if (activityType !== 'all') {
      activityCondition = `AND activity_type = '${activityType}'`;
    }
    
    // 获取活动数据
    const activityResult = await query(
      `SELECT 
        activity_type,
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count,
        COUNT(DISTINCT email_id) as unique_emails
       FROM user_activities 
       WHERE user_id = $1 ${activityCondition} ${dateCondition}
       GROUP BY activity_type, DATE_TRUNC('day', created_at)
       ORDER BY date, activity_type`,
      params
    );
    
    // 获取活动统计
    const activityStatsResult = await query(
      `SELECT 
        activity_type,
        COUNT(*) as total_count,
        COUNT(DISTINCT email_id) as unique_emails
       FROM user_activities 
       WHERE user_id = $1 ${activityCondition} ${dateCondition}
       GROUP BY activity_type
       ORDER BY total_count DESC`,
      params
    );
    
    // 获取每日活跃时间
    const hourlyActivityResult = await query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
       FROM user_activities 
       WHERE user_id = $1 ${activityCondition} ${dateCondition}
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour`,
      params
    );
    
    const activityData = activityResult.rows;
    const activityStats = activityStatsResult.rows;
    const hourlyActivity = hourlyActivityResult.rows;
    
    // 按日期和活动类型组织数据
    const dailyActivityByType: { [key: string]: { [key: string]: number } } = {};
    activityData.forEach((row: any) => {
      const dateKey = row.date.toISOString().split('T')[0];
      if (!dailyActivityByType[dateKey]) {
        dailyActivityByType[dateKey] = {};
      }
      dailyActivityByType[dateKey][row.activity_type] = row.count;
    });
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        activityByType: activityStats.map((row: any) => ({
          type: row.activity_type,
          count: row.total_count,
          uniqueEmails: row.unique_emails
        })),
        dailyActivity: Object.entries(dailyActivityByType).map(([date, activities]) => ({
          date,
          activities
        })),
        hourlyActivity: hourlyActivity.map((row: any) => ({
          hour: parseInt(row.hour, 10),
          count: row.count
        })),
        totalActivities: activityStats.reduce((sum, item) => sum + item.total_count, 0)
      },
      message: '用户活动分析获取成功',
      dateRange: {
        startDate,
        endDate
      },
      activityType
    };
    
    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)); // 1小时过期
    
    logInfo('获取用户活动分析成功', {
      userId: req.user.userId,
      activityType,
      totalActivities: responseData.data.totalActivities
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取用户活动分析失败', error as Error);
      next(new ApiError(500, '获取用户活动分析失败，请稍后重试'));
    }
  }
};

// 高频发件人统计接口
/**
 * 获取高频发件人统计
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getTopSenders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { limit = 10, startDate, endDate, withDetails = false } = req.query;
    
    // 验证限制参数
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ApiError(400, '限制数量必须在1-100之间');
    }
    
    // 验证日期参数
    if (startDate && !isValidDate(startDate as string)) {
      throw new ApiError(400, '无效的开始日期格式');
    }
    
    if (endDate && !isValidDate(endDate as string)) {
      throw new ApiError(400, '无效的结束日期格式');
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:topsenders:${limit}:${startDate || 'all'}:${endDate || 'all'}:${withDetails}`;
    
    // 尝试从缓存获取
    const cachedSenders = await redisClient.get(cacheKey);
    if (cachedSenders) {
      logInfo('从缓存获取高频发件人统计', {
        userId: req.user.userId,
        limit
      });
      res.json(JSON.parse(cachedSenders));
      return;
    }
    
    // 构建日期查询条件
    let dateCondition = '';
    const params: any[] = [req.user.userId, limitNum];
    let paramIndex = 3;
    
    if (startDate) {
      dateCondition += `AND e.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认最近90天
      dateCondition += `AND e.created_at >= NOW() - INTERVAL \'90 days\'`;
    }
    
    if (endDate) {
      dateCondition += `AND e.created_at <= $${paramIndex}`;
      params.push(endDate);
    }
    
    // 获取高频发件人
    const sendersQuery = `
      SELECT 
        e.sender_email,
        e.sender_name,
        COUNT(*) as email_count,
        SUM(CASE WHEN e.is_read = true THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN e.is_starred = true THEN 1 ELSE 0 END) as starred_count,
        MAX(e.created_at) as latest_email,
        MIN(e.created_at) as first_email
      FROM emails e
      WHERE e.user_id = $1 AND e.direction = 'incoming' ${dateCondition}
      GROUP BY e.sender_email, e.sender_name
      ORDER BY email_count DESC
      LIMIT $2
    `;
    
    const sendersResult = await query(sendersQuery, params);
    
    const topSenders = sendersResult.rows;
    
    // 定义响应数据类型
    interface SenderData {
      email: string;
      name: string;
      emailCount: number;
      readCount: number;
      starredCount: number;
      readRate: string;
      latestEmail: Date;
      firstEmail: Date;
      recentEmails?: any[];
    }

    interface TopSendersData {
      topSenders: SenderData[];
      totalSenders: number;
      period: string;
    }

    interface ResponseData {
      success: boolean;
      data: TopSendersData;
      message: string;
      limit: number;
    }
    
    let responseData: ResponseData = {
      success: true,
      data: {
        topSenders: topSenders.map((row: any) => ({
          email: row.sender_email,
          name: row.sender_name || row.sender_email.split('@')[0],
          emailCount: row.email_count,
          readCount: row.read_count,
          starredCount: row.starred_count,
          readRate: row.email_count > 0 ? 
            (row.read_count / row.email_count * 100).toFixed(1) : '0',
          latestEmail: row.latest_email,
          firstEmail: row.first_email
        })),
        totalSenders: topSenders.length,
        period: startDate ? `${startDate} to ${endDate || 'present'}` : 'Last 90 days'
      },
      message: '高频发件人统计获取成功',
      limit: limitNum
    };
    
    // 如果需要详细信息
    if (withDetails === 'true') {
        // 为每个发件人获取最近的邮件样本
        const detailedSenders = await Promise.all(topSenders.map(async (sender: any) => {
            const sampleEmailsResult = await query(
              `SELECT 
                id, subject, created_at, is_read, is_starred
               FROM emails 
               WHERE user_id = $1 AND sender_email = $2 AND direction = 'incoming'
               ORDER BY created_at DESC
               LIMIT 3`,
              [req.user!.userId, sender.sender_email]
            );
            
            const senderData = responseData.data.topSenders.find((s: any) => s.email === sender.sender_email);
            if (!senderData) {
              return undefined;
            }
            
            return {
              ...senderData,
              recentEmails: sampleEmailsResult.rows
            } as SenderData;
          })
        );
        
        // Filter out undefined results
        responseData.data.topSenders = detailedSenders.filter((sender): sender is SenderData => sender !== undefined);
      }
    
    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)); // 1小时过期
    
    logInfo('获取高频发件人统计成功', {
      userId: req.user.userId,
      limit: limitNum,
      count: topSenders.length
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取高频发件人统计失败', error as Error);
      next(new ApiError(500, '获取高频发件人统计失败，请稍后重试'));
    }
  }
};

// 邮件分类统计接口
/**
 * 获取邮件分类统计
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const getEmailCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { startDate, endDate, withTrend = false } = req.query;
    
    // 验证日期参数
    if (startDate && !isValidDate(startDate as string)) {
      throw new ApiError(400, '无效的开始日期格式');
    }
    
    if (endDate && !isValidDate(endDate as string)) {
      throw new ApiError(400, '无效的结束日期格式');
    }
    
    // 构建缓存键
    const cacheKey = `analytics:user:${req.user.userId}:categories:${startDate || 'all'}:${endDate || 'all'}:${withTrend}`;
    
    // 尝试从缓存获取
    const cachedCategories = await redisClient.get(cacheKey);
    if (cachedCategories) {
      logInfo('从缓存获取邮件分类统计', {
        userId: req.user.userId
      });
      res.json(JSON.parse(cachedCategories));
      return;
    }
    
    // 构建日期查询条件
    let dateCondition = '';
    const params: any[] = [req.user.userId];
    let paramIndex = 2;
    
    if (startDate) {
      dateCondition += `AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认最近30天
      dateCondition += `AND created_at >= NOW() - INTERVAL \'30 days\'`;
    }
    
    if (endDate) {
      dateCondition += `AND created_at <= $${paramIndex}`;
      params.push(endDate);
    }
    
    // 获取分类统计
    const categoriesResult = await query(
      `SELECT 
        COALESCE(categories[1], 'unclassified') as category,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_starred = true THEN 1 ELSE 0 END) as starred_count,
        MAX(created_at) as latest_email
      FROM emails 
      WHERE user_id = $1 ${dateCondition}
      GROUP BY COALESCE(categories[1], 'unclassified')
      ORDER BY count DESC`,
      params
    );
    
    const categories = categoriesResult.rows;
    const totalEmails = categories.reduce((sum: number, cat: any) => sum + cat.count, 0);
    
    // 定义响应数据类型
    interface CategoryData {
      category: string;
      count: number;
      percentage: string;
      readCount: number;
      starredCount: number;
      readRate: string;
      latestEmail: Date;
    }

    interface TrendData {
      date: string;
      categories: { [key: string]: number };
    }

    interface AnalyticsData {
      categories: CategoryData[];
      totalCategories: number;
      totalEmails: number;
      period: string;
      categoryTrend?: TrendData[];
    }

    interface ResponseData {
      success: boolean;
      data: AnalyticsData;
      message: string;
    }

    let responseData: ResponseData = {
      success: true,
      data: {
        categories: categories.map((row: any) => ({
          category: row.category,
          count: row.count,
          percentage: totalEmails > 0 ? 
            (row.count / totalEmails * 100).toFixed(1) : '0',
          readCount: row.read_count,
          starredCount: row.starred_count,
          readRate: row.count > 0 ? 
            (row.read_count / row.count * 100).toFixed(1) : '0',
          latestEmail: row.latest_email
        })),
        totalCategories: categories.length,
        totalEmails,
        period: startDate ? `${startDate} to ${endDate || 'present'}` : 'Last 30 days'
      },
      message: '邮件分类统计获取成功'
    };
    
    // 如果需要趋势数据
    if (withTrend === 'true') {
      // 获取分类趋势（最近7天）
      const trendResult = await query(
        `SELECT 
          COALESCE(categories[1], 'unclassified') as category,
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as count
        FROM emails 
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL \'7 days\'
        GROUP BY COALESCE(categories[1], 'unclassified'), DATE_TRUNC('day', created_at)
        ORDER BY day, category`,
        [req.user.userId]
      );
      
      // 组织趋势数据
      const trendData: { [key: string]: { [key: string]: number } } = {};
      trendResult.rows.forEach((row: any) => {
        const dateKey = row.day.toISOString().split('T')[0];
        if (!trendData[dateKey]) {
          trendData[dateKey] = {};
        }
        trendData[dateKey][row.category] = row.count;
      });
      
      responseData.data.categoryTrend = Object.entries(trendData).map(([date, categories]) => ({
        date,
        categories
      }));
    }
    
    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)); // 1小时过期
    
    logInfo('获取邮件分类统计成功', {
      userId: req.user.userId,
      categories: categories.length,
      totalEmails
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('获取邮件分类统计失败', error as Error);
      next(new ApiError(500, '获取邮件分类统计失败，请稍后重试'));
    }
  }
};

// 工具函数：验证日期格式
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}