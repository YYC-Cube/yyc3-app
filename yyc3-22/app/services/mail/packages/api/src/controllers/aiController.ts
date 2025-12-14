/**
 * @file AI控制器
 * @description 处理邮件智能分析相关业务逻辑
 * @module aiController
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/errorHandler';
import { logInfo, logError, logWarn } from '../utils/logger';
import { query } from '../config/database';
import { redisClient } from '../config/redis';

// 邮件智能分析接口
/**
 * 邮件智能分析
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const analyzeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    // 构建缓存键
    const cacheKey = `ai:email:${req.user.userId}:${id}:analysis`;
    
    // 尝试从缓存获取
    const cachedAnalysis = await redisClient.get(cacheKey);
    if (cachedAnalysis) {
      logInfo('从缓存获取邮件分析结果', {
        userId: req.user.userId,
        emailId: id
      });
      res.json(JSON.parse(cachedAnalysis));
      return;
    }
    
    // 查询邮件
    const emailResult = await query(
      'SELECT subject, body FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (emailResult.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const email = emailResult.rows[0];
    
    // 模拟AI分析过程（实际项目中应调用真实的AI服务）
    const analysis = await simulateAIAnalysis(email.subject, email.body);
    
    // 保存分析结果到数据库
    await query(
      `INSERT INTO email_ai_analyses (email_id, user_id, sentiment_score, 
                                    importance_level, key_topics, action_items, 
                                    summary, entities, analysis_data, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
       ON CONFLICT (email_id) 
       DO UPDATE SET sentiment_score = $3, importance_level = $4, 
                    key_topics = $5, action_items = $6, summary = $7, 
                    entities = $8, analysis_data = $9, updated_at = NOW()`,
      [
        id,
        req.user.userId,
        analysis.sentiment.score,
        analysis.importance,
        analysis.keyTopics,
        analysis.actionItems,
        analysis.summary,
        analysis.entities,
        JSON.stringify(analysis)
      ]
    );
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        emailId: id,
        analysis: {
          sentiment: analysis.sentiment,
          importance: analysis.importance,
          keyTopics: analysis.keyTopics,
          actionItems: analysis.actionItems,
          summary: analysis.summary,
          entities: analysis.entities,
          confidence: analysis.confidence
        }
      },
      message: '邮件分析成功'
    };
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 }); // 1小时过期
    
    logInfo('邮件分析成功', {
      userId: req.user.userId,
      emailId: id
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('邮件分析失败', error as Error);
      next(new ApiError(500, '邮件分析失败，请稍后重试'));
    }
  }
};

// 批量邮件分析接口
/**
 * 批量邮件分析
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const batchAnalyzeEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      throw new ApiError(400, '邮件ID列表不能为空');
    }
    
    if (emailIds.length > 50) {
      throw new ApiError(400, '单次批量分析最多支持50封邮件');
    }
    
    // 验证邮件所有权
    const emailsResult = await query(
      'SELECT id FROM emails WHERE id = ANY($1) AND user_id = $2',
      [emailIds, req.user.userId]
    );
    
    const validEmailIds = emailsResult.rows.map(row => row.id);
    if (validEmailIds.length === 0) {
      throw new ApiError(404, '没有有效的邮件ID');
    }
    
    const results: { [key: string]: any } = {};
    
    // 批量分析每封邮件
    for (const emailId of validEmailIds) {
      try {
        // 尝试从缓存获取
        const cacheKey = `ai:email:${req.user.userId}:${emailId}:analysis`;
        const cachedAnalysis = await redisClient.get(cacheKey);
        
        if (cachedAnalysis) {
          results[emailId] = JSON.parse(cachedAnalysis).data.analysis;
          continue;
        }
        
        // 查询邮件内容
        const emailResult = await query(
          'SELECT subject, body FROM emails WHERE id = $1',
          [emailId]
        );
        
        const email = emailResult.rows[0];
        
        // 模拟AI分析
        const analysis = await simulateAIAnalysis(email.subject, email.body);
        
        // 保存到数据库
        await query(
          `INSERT INTO email_ai_analyses (email_id, user_id, sentiment_score, 
                                        importance_level, key_topics, action_items, 
                                        summary, entities, analysis_data, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
           ON CONFLICT (email_id) 
           DO UPDATE SET sentiment_score = $3, importance_level = $4, 
                        key_topics = $5, action_items = $6, summary = $7, 
                        entities = $8, analysis_data = $9, updated_at = NOW()`,
          [
            emailId,
            req.user.userId,
            analysis.sentiment.score,
            analysis.importance,
            analysis.keyTopics,
            analysis.actionItems,
            analysis.summary,
            analysis.entities,
            JSON.stringify(analysis)
          ]
        );
        
        results[emailId] = {
          sentiment: analysis.sentiment,
          importance: analysis.importance,
          keyTopics: analysis.keyTopics,
          actionItems: analysis.actionItems,
          summary: analysis.summary,
          entities: analysis.entities,
          confidence: analysis.confidence
        };
        
        // 缓存结果
        await redisClient.set(cacheKey, JSON.stringify({
          success: true,
          data: { emailId, analysis: results[emailId] },
          message: '邮件分析成功'
        }));
      } catch (error) {
        logWarn('单封邮件分析失败', {
          emailId,
          error: (error as Error).message
        });
        results[emailId] = { error: '分析失败' };
      }
    }
    
    logInfo('批量邮件分析完成', {
      userId: req.user.userId,
      totalEmails: validEmailIds.length,
      successCount: Object.values(results).filter(r => !r.error).length
    });
    
    res.json({
      success: true,
      data: {
        results,
        processedCount: validEmailIds.length,
        unprocessedCount: emailIds.length - validEmailIds.length
      },
      message: `成功分析 ${validEmailIds.length} 封邮件`
    });
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('批量邮件分析失败', error as Error);
      next(new ApiError(500, '批量邮件分析失败，请稍后重试'));
    }
  }
};

// 生成邮件摘要接口
/**
 * 生成邮件摘要
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const generateEmailSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id, maxLength = 300, format = 'text' } = req.params;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    const length = parseInt(maxLength.toString(), 10);
    if (isNaN(length) || length < 50 || length > 1000) {
      throw new ApiError(400, '摘要长度必须在50-1000个字符之间');
    }
    
    if (!['text', 'html', 'markdown'].includes(format)) {
      throw new ApiError(400, '摘要格式必须是text、html或markdown');
    }
    
    // 构建缓存键
    const cacheKey = `ai:email:${req.user.userId}:${id}:summary:${length}:${format}`;
    
    // 尝试从缓存获取
    const cachedSummary = await redisClient.get(cacheKey);
    if (cachedSummary) {
      logInfo('从缓存获取邮件摘要', {
        userId: req.user.userId,
        emailId: id
      });
      res.json(JSON.parse(cachedSummary));
      return;
    }
    
    // 查询邮件
    const emailResult = await query(
      'SELECT subject, body FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (emailResult.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const email = emailResult.rows[0];
    
    // 模拟生成摘要
    const summary = await simulateGenerateSummary(email.subject, email.body, length, format);
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        emailId: id,
        summary,
        format,
        maxLength: length,
        actualLength: summary.length
      },
      message: '生成邮件摘要成功'
    };
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 }); // 1小时过期
    
    logInfo('生成邮件摘要成功', {
      userId: req.user.userId,
      emailId: id
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('生成邮件摘要失败', error as Error);
      next(new ApiError(500, '生成邮件摘要失败，请稍后重试'));
    }
  }
};

// 提取邮件数据接口
/**
 * 提取邮件数据
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const extractEmailData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    const { dataTypes = [] } = req.body;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    const validDataTypes = ['contacts', 'dates', 'locations', 'times', 'numbers', 'links', 'keywords', 'attachments', 'addresses', 'phoneNumbers'];
    const invalidTypes = dataTypes.filter((type: string) => !validDataTypes.includes(type));
    
    if (invalidTypes.length > 0) {
      throw new ApiError(400, `无效的数据类型: ${invalidTypes.join(', ')}`);
    }
    
    // 如果没有指定数据类型，提取所有类型
    const typesToExtract = dataTypes.length > 0 ? dataTypes : validDataTypes;
    
    // 构建缓存键
    const cacheKey = `ai:email:${req.user.userId}:${id}:extract:${typesToExtract.sort().join(',')}`;
    
    // 尝试从缓存获取
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logInfo('从缓存获取提取的邮件数据', {
        userId: req.user.userId,
        emailId: id
      });
      res.json(JSON.parse(cachedData));
      return;
    }
    
    // 查询邮件
    const emailResult = await query(
      'SELECT subject, body FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (emailResult.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const email = emailResult.rows[0];
    
    // 模拟提取数据
    const extractedData = await simulateExtractData(email.subject, email.body, typesToExtract);
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        emailId: id,
        extractedData,
        extractedTypes: typesToExtract
      },
      message: '提取邮件数据成功'
    };
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 }); // 1小时过期
    
    logInfo('提取邮件数据成功', {
      userId: req.user.userId,
      emailId: id,
      extractedTypes: typesToExtract.length
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('提取邮件数据失败', error as Error);
      next(new ApiError(500, '提取邮件数据失败，请稍后重试'));
    }
  }
};

// 邮件分类接口
/**
 * 邮件分类
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件
 */
export const categorizeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    
    const { id } = req.params;
    const { customCategories = [] } = req.body;
    
    if (!id) {
      throw new ApiError(400, '邮件ID不能为空');
    }
    
    // 构建缓存键
    const cacheKey = `ai:email:${req.user.userId}:${id}:categorize:${customCategories.sort().join(',')}`;
    
    // 尝试从缓存获取
    const cachedCategories = await redisClient.get(cacheKey);
    if (cachedCategories) {
      logInfo('从缓存获取邮件分类结果', {
        userId: req.user.userId,
        emailId: id
      });
      res.json(JSON.parse(cachedCategories));
      return;
    }
    
    // 查询邮件
    const emailResult = await query(
      'SELECT subject, body FROM emails WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (emailResult.rows.length === 0) {
      throw new ApiError(404, '邮件不存在');
    }
    
    const email = emailResult.rows[0];
    
    // 模拟分类过程
    const categories = await simulateCategorizeEmail(email.subject, email.body, customCategories);
    
    // 更新邮件分类
    await query(
      'UPDATE emails SET categories = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [categories.primaryCategories, id, req.user.userId]
    );
    
    // 保存详细分类结果到AI分析表
    await query(
      `INSERT INTO email_ai_analyses (email_id, user_id, categories, 
                                    category_confidence, custom_categories, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       ON CONFLICT (email_id) 
       DO UPDATE SET categories = $3, category_confidence = $4, 
                    custom_categories = $5, updated_at = NOW()`,
      [
        id,
        req.user.userId,
        categories.primaryCategories,
        categories.confidenceScores,
        categories.customCategories
      ]
    );
    
    // 构建响应数据
    const responseData = {
      success: true,
      data: {
        emailId: id,
        categories: {
          primaryCategories: categories.primaryCategories,
          confidenceScores: categories.confidenceScores,
          customCategories: categories.customCategories,
          recommendation: categories.recommendation
        }
      },
      message: '邮件分类成功'
    };
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 }); // 1小时过期
    
    logInfo('邮件分类成功', {
      userId: req.user.userId,
      emailId: id,
      categories: categories.primaryCategories
    });
    
    res.json(responseData);
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logError('邮件分类失败', error as Error);
      next(new ApiError(500, '邮件分类失败，请稍后重试'));
    }
  }
};

// 模拟AI分析函数（实际项目中应调用真实的AI服务）
async function simulateAIAnalysis(subject: string, body: string): Promise<any> {
  // 模拟分析延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 简单的模拟分析逻辑
  const text = `${subject}\n${body}`;
  const sentimentScore = (Math.random() * 2 - 1).toFixed(2); // -1 到 1 之间的随机值
  const sentiment = parseFloat(sentimentScore);
  
  return {
    sentiment: {
      score: sentiment,
      label: sentiment > 0.5 ? 'positive' : sentiment < -0.5 ? 'negative' : 'neutral'
    },
    importance: text.includes('urgent') || text.includes('紧急') || text.includes('important') ? 'high' : 
               text.includes('reminder') || text.includes('提醒') ? 'medium' : 'low',
    keyTopics: extractKeywords(text).slice(0, 5),
    actionItems: text.includes('please') || text.includes('请') || text.includes('需要') ? 
                 ['请回复确认', '请查看附件', '请在截止日期前完成'] : [],
    summary: text.length > 100 ? text.substring(0, 100) + '...' : text,
    entities: {
      people: extractEmails(text).slice(0, 3),
      organizations: extractOrganizations(text).slice(0, 2),
      dates: extractDates(text).slice(0, 2),
      locations: extractLocations(text).slice(0, 2)
    },
    confidence: (0.8 + Math.random() * 0.2).toFixed(2)
  };
}

// 模拟生成摘要函数
async function simulateGenerateSummary(subject: string, body: string, maxLength: number, format: string): Promise<string> {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const combinedText = `${subject}\n${body}`;
  let summary = combinedText.length > maxLength ? combinedText.substring(0, maxLength - 3) + '...' : combinedText;
  
  // 根据格式调整
  if (format === 'html') {
    summary = `<p>${summary}</p>`;
  } else if (format === 'markdown') {
    summary = `**摘要:** ${summary}`;
  }
  
  return summary;
}

// 模拟提取数据函数
async function simulateExtractData(subject: string, body: string, dataTypes: string[]): Promise<any> {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 180));
  
  const text = `${subject}\n${body}`;
  const result: any = {};
  
  if (dataTypes.includes('contacts')) {
    result.contacts = extractEmails(text).map(email => ({
      type: 'email',
      value: email,
      confidence: 0.95
    }));
  }
  
  if (dataTypes.includes('dates')) {
    result.dates = extractDates(text).map(date => ({
      value: date,
      confidence: 0.9
    }));
  }
  
  if (dataTypes.includes('locations')) {
    result.locations = extractLocations(text).map(location => ({
      value: location,
      confidence: 0.85
    }));
  }
  
  if (dataTypes.includes('numbers')) {
    result.numbers = extractNumbers(text).map(num => ({
      value: num,
      confidence: 0.98
    }));
  }
  
  if (dataTypes.includes('links')) {
    result.links = extractLinks(text).map(link => ({
      value: link,
      confidence: 0.99
    }));
  }
  
  if (dataTypes.includes('keywords')) {
    result.keywords = extractKeywords(text).map(keyword => ({
      value: keyword,
      frequency: Math.floor(Math.random() * 10) + 1,
      confidence: 0.8
    }));
  }
  
  return result;
}

// 模拟邮件分类函数
async function simulateCategorizeEmail(subject: string, body: string, customCategories: string[]): Promise<any> {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 220));
  
  const text = `${subject.toLowerCase()}\n${body.toLowerCase()}`;
  const categories: string[] = [];
  const confidenceScores: { [key: string]: number } = {};
  const customMatches: string[] = [];
  
  // 预定义分类规则
  const categoryRules: { [key: string]: string[] } = {
    'work': ['project', 'meeting', 'deadline', 'report', 'client', '同事', '会议', '项目', '报告'],
    'personal': ['family', 'friend', 'party', 'invitation', '朋友', '家人', '邀请'],
    'promotion': ['offer', 'discount', 'sale', 'discount', '优惠', '促销', '特价'],
    'newsletter': ['newsletter', 'update', 'news', '通讯', '更新'],
    'spam': ['win', 'free', 'lottery', 'prize', '免费', '中奖'],
    'notification': ['alert', 'notification', 'reminder', '提醒', '通知', '警报'],
    'finance': ['bill', 'payment', 'invoice', 'salary', '金融', '账单', '付款', '发票']
  };
  
  // 应用预定义规则
  Object.entries(categoryRules).forEach(([category, keywords]) => {
    const matches = keywords.some(keyword => text.includes(keyword));
    if (matches) {
      categories.push(category);
      confidenceScores[category] = 0.7 + Math.random() * 0.25; // 70% - 95% 之间的置信度
    }
  });
  
  // 应用自定义分类
  customCategories.forEach(custom => {
    if (text.includes(custom.toLowerCase())) {
      customMatches.push(custom);
      confidenceScores[custom] = 0.8 + Math.random() * 0.15; // 80% - 95% 之间的置信度
    }
  });
  
  // 如果没有匹配任何分类，设置为general
  if (categories.length === 0 && customMatches.length === 0) {
    categories.push('general');
    confidenceScores['general'] = 0.6;
  }
  
  // 生成推荐标签
  const recommendation = categories.length > 0 ? categories[0] : 'general';
  
  return {
    primaryCategories: categories,
    confidenceScores,
    customCategories: customMatches,
    recommendation
  };
}

// 工具函数：提取关键词
function extractKeywords(text: string): string[] {
  // 简单的关键词提取（实际项目中应使用更复杂的算法）
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFrequency: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (!commonWords.has(word) && word.length > 1) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 10);
}

// 工具函数：提取邮箱
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches)]; // 去重
}

// 工具函数：提取组织
function extractOrganizations(text: string): string[] {
  // 简单模拟，实际项目中应使用NLP库
  const commonOrgs = ['公司', '企业', '部门', '团队', '集团', 'organization', 'company', 'corporation', 'team', 'department'];
  const potentialOrgs: string[] = [];
  
  commonOrgs.forEach(org => {
    const regex = new RegExp(`([\u4e00-\u9fa5a-zA-Z]+)\s*${org}`, 'g');
    const matches = text.match(regex) || [];
    potentialOrgs.push(...matches);
  });
  
  return [...new Set(potentialOrgs)];
}

// 工具函数：提取日期
function extractDates(text: string): string[] {
  // 简单的日期正则，实际项目中应使用日期解析库
  const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}年\d{1,2}月\d{1,2}日/g;
  const matches = text.match(dateRegex) || [];
  return [...new Set(matches)];
}

// 工具函数：提取地点
function extractLocations(text: string): string[] {
  // 简单模拟，实际项目中应使用NLP库
  const commonLocations = ['北京', '上海', '广州', '深圳', '杭州', '城市', '地点', '地址', 'building', 'street', 'city', 'town', 'avenue', 'road'];
  const potentialLocations: string[] = [];
  
  commonLocations.forEach(location => {
    const regex = new RegExp(`([\u4e00-\u9fa5a-zA-Z]+)\s*${location}`, 'g');
    const matches = text.match(regex) || [];
    potentialLocations.push(...matches);
  });
  
  return [...new Set(potentialLocations)];
}

// 工具函数：提取数字
function extractNumbers(text: string): string[] {
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  const matches = text.match(numberRegex) || [];
  return [...new Set(matches)];
}

// 工具函数：提取链接
function extractLinks(text: string): string[] {
  const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const matches = text.match(linkRegex) || [];
  return [...new Set(matches)];
}