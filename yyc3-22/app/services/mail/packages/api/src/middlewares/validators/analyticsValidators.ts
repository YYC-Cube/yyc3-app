/**
 * @file 分析模块验证器
 * @description 统计分析相关API的请求参数验证
 * @module analyticsValidators
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errorHandler';
import { logWarn } from '../../utils/logger';

/**
 * 验证日期范围参数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { startDate, endDate } = req.query;
    
    // 检查是否提供了必要的日期参数
    if (!startDate || !endDate) {
      logWarn('缺少必要的日期参数', {
        query: req.query,
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, '开始日期和结束日期是必填参数');
    }
    
    // 验证日期格式
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      logWarn('无效的日期格式', {
        startDate,
        endDate,
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, '日期格式无效，请使用YYYY-MM-DD格式');
    }
    
    // 验证日期范围
    if (startDateObj > endDateObj) {
      logWarn('无效的日期范围', {
        startDate,
        endDate,
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, '开始日期不能晚于结束日期');
    }
    
    // 验证日期范围不能超过90天
    const maxDateRange = 90; // 最大允许90天
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > maxDateRange) {
      logWarn('日期范围过大', {
        startDate,
        endDate,
        diffDays,
        maxAllowed: maxDateRange,
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, `日期范围不能超过${maxDateRange}天`);
    }
    
    // 验证结束日期不能超过今天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (endDateObj > today) {
      logWarn('结束日期不能超过今天', {
        endDate,
        today: today.toISOString().split('T')[0],
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, '结束日期不能超过今天');
    }
    
    // 验证开始日期不能早于2年前
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (startDateObj < twoYearsAgo) {
      logWarn('开始日期太早', {
        startDate,
        minDate: twoYearsAgo.toISOString().split('T')[0],
        route: req.path,
        method: req.method
      });
      throw new ApiError(400, '开始日期不能早于2年前');
    }
    
    // 如果有分组参数，验证分组值
    if (req.query.grouping) {
      const validGroupings = ['hour', 'day', 'week', 'month'];
      const grouping = req.query.grouping as string;
      
      if (!validGroupings.includes(grouping)) {
        logWarn('无效的分组参数', {
          grouping,
          validOptions: validGroupings.join(', '),
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, `无效的分组参数，请使用以下值之一: ${validGroupings.join(', ')}`);
      }
      
      // 根据日期范围验证分组方式是否合理
      if (diffDays > 31 && grouping === 'hour') {
        logWarn('分组方式与日期范围不匹配', {
          grouping,
          diffDays,
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, '小时级分组仅适用于31天以内的数据');
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(400, '日期验证失败'));
    }
  }
};

/**
 * 验证统计参数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const validateStatisticsParams = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 验证limit参数
    if (req.query.limit) {
      const limit = parseInt(req.query.limit as string, 10);
      
      if (isNaN(limit) || limit <= 0) {
        logWarn('无效的limit参数', {
          limit: req.query.limit,
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, 'limit参数必须是正整数');
      }
      
      if (limit > 50) {
        logWarn('limit参数过大', {
          limit,
          maxAllowed: 50,
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, 'limit参数不能超过50');
      }
    }
    
    // 验证groupBy参数
    if (req.query.groupBy) {
      const validGroupByOptions = ['category', 'folder', 'sender_domain'];
      const groupBy = req.query.groupBy as string;
      
      if (!validGroupByOptions.includes(groupBy)) {
        logWarn('无效的groupBy参数', {
          groupBy,
          validOptions: validGroupByOptions.join(', '),
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, `无效的groupBy参数，请使用以下值之一: ${validGroupByOptions.join(', ')}`);
      }
    }
    
    // 验证activityType参数
    if (req.query.activityType) {
      const validActivityTypes = ['sent', 'read', 'replied', 'forwarded', 'archived', 'deleted'];
      let activityTypes: string[] = [];
      
      if (typeof req.query.activityType === 'string') {
        activityTypes = [req.query.activityType];
      } else if (Array.isArray(req.query.activityType)) {
        activityTypes = req.query.activityType as string[];
      }
      
      const invalidTypes = activityTypes.filter(type => !validActivityTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        logWarn('无效的activityType参数', {
          invalidTypes,
          validOptions: validActivityTypes.join(', '),
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, `无效的activityType参数，请使用以下值之一: ${validActivityTypes.join(', ')}`);
      }
    }
    
    // 验证excludeContacts参数
    if (req.query.excludeContacts) {
      if (typeof req.query.excludeContacts !== 'boolean' && req.query.excludeContacts !== 'true' && req.query.excludeContacts !== 'false') {
        logWarn('无效的excludeContacts参数', {
          excludeContacts: req.query.excludeContacts,
          route: req.path,
          method: req.method
        });
        throw new ApiError(400, 'excludeContacts参数必须是布尔值');
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(400, '参数验证失败'));
    }
  }
};