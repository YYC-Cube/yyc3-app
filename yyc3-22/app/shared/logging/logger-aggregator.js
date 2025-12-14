/**
 * @file 日志聚合管理器
 * @description 集中管理和聚合多个服务的日志信息，支持实时监控、告警和分析
 * @module shared/logging/logger-aggregator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const { getContext } = require('../context');
const { serviceStatusManager } = require('../status');
const RedisClient = require('../../redis/client');

// 日志级别常量
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
  SECURITY: 'security'
};

// 日志聚合管理器
class LoggerAggregator {
  constructor() {
    this.redisClient = null;
    this.isInitialized = false;
    this.logBuffer = [];
    this.bufferSize = 100; // 缓冲区大小
    this.flushInterval = 1000; // 1秒刷新一次
    this.flushTimer = null;
    this.serviceName = process.env.SERVICE_NAME || 'unknown-service';
    this.environment = process.env.NODE_ENV || 'development';
    this.logStreams = {}; // 存储不同流的日志
  }

  /**
   * 初始化日志聚合器
   */
  async initialize() {
    try {
      // 连接Redis用于日志聚合
      this.redisClient = await RedisClient.getInstance();
      
      // 启动自动刷新定时器
      this.startAutoFlush();
      
      // 注册进程事件处理
      this.registerProcessHandlers();
      
      this.isInitialized = true;
      console.log('日志聚合器初始化成功');
    } catch (error) {
      console.error('日志聚合器初始化失败:', error);
      // 即使Redis连接失败，仍然可以使用内存缓存
      this.isInitialized = true;
    }
  }

  /**
   * 注册进程事件处理
   */
  registerProcessHandlers() {
    // 进程退出时确保刷新所有日志
    process.on('exit', () => this.flushAllLogs());
    process.on('SIGINT', () => this.flushAllLogs());
    process.on('SIGTERM', () => this.flushAllLogs());
  }

  /**
   * 启动自动刷新
   */
  startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * 停止自动刷新
   */
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 添加日志到聚合器
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {object} meta - 附加信息
   */
  async log(level, message, meta = {}) {
    const context = getContext() || {};
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      // 关联ID信息
      traceId: context.traceId,
      requestId: context.requestId,
      spanId: context.spanId,
      // 进程信息
      pid: process.pid,
      host: process.env.HOSTNAME || 'localhost',
      // 附加元数据
      ...meta
    };

    // 添加到缓冲区
    this.logBuffer.push(logEntry);
    
    // 添加到特定流
    if (!this.logStreams[level]) {
      this.logStreams[level] = [];
    }
    this.logStreams[level].push(logEntry);

    // 检查是否需要立即刷新
    if (this.logBuffer.length >= this.bufferSize || level === LOG_LEVELS.CRITICAL) {
      await this.flushLogs();
    }

    // 对于关键错误，额外处理
    if (level === LOG_LEVELS.CRITICAL || level === LOG_LEVELS.SECURITY) {
      await this.handleCriticalLog(logEntry);
    }

    return logEntry;
  }

  /**
   * 处理关键日志
   * @param {object} logEntry - 日志条目
   */
  async handleCriticalLog(logEntry) {
    try {
      // 发送到告警通道
      const alertChannel = `logs:alerts:${this.serviceName}`;
      
      if (this.redisClient) {
        await this.redisClient.publish(alertChannel, JSON.stringify(logEntry));
      }
      
      // 更新服务状态
      if (serviceStatusManager) {
        serviceStatusManager.reportError('CRITICAL_LOG', {
          level: logEntry.level,
          message: logEntry.message,
          traceId: logEntry.traceId
        });
      }
    } catch (error) {
      console.error('处理关键日志失败:', error);
    }
  }

  /**
   * 刷新日志到存储
   */
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      if (this.redisClient) {
        // 使用Redis存储日志
        const logKey = `logs:${this.serviceName}:${new Date().toISOString().split('T')[0]}`;
        
        // 使用管道批量操作
        const pipeline = this.redisClient.pipeline();
        
        // 添加每条日志
        logsToFlush.forEach(log => {
          pipeline.lpush(logKey, JSON.stringify(log));
          // 设置过期时间为7天
          pipeline.expire(logKey, 7 * 24 * 60 * 60);
        });
        
        // 执行批量操作
        await pipeline.exec();
        
        // 记录日志计数统计
        await this.updateLogStats(logsToFlush);
      } else {
        // Redis不可用时，将日志写入标准输出
        logsToFlush.forEach(log => {
          console.log(JSON.stringify(log));
        });
      }
    } catch (error) {
      console.error('刷新日志失败:', error);
      // 失败时将日志放回缓冲区
      this.logBuffer = [...this.logBuffer, ...logsToFlush];
    }
  }

  /**
   * 刷新所有日志（包括各流日志）
   */
  async flushAllLogs() {
    // 停止自动刷新
    this.stopAutoFlush();
    
    // 刷新主缓冲区
    await this.flushLogs();
    
    // 刷新各流日志
    for (const [level, logs] of Object.entries(this.logStreams)) {
      if (logs.length > 0) {
        // 临时存储并清空流
        const streamLogs = [...logs];
        this.logStreams[level] = [];
        
        // 写入流日志
        if (this.redisClient) {
          const streamKey = `logs:stream:${level}:${this.serviceName}`;
          for (const log of streamLogs) {
            await this.redisClient.xadd(
              streamKey,
              '*', // 自动生成ID
              'timestamp', log.timestamp,
              'level', log.level,
              'message', log.message,
              'data', JSON.stringify(log)
            );
            // 设置流最大长度，避免无限增长
            await this.redisClient.xtrim(streamKey, 'MAXLEN', '~', 10000);
          }
        }
      }
    }
  }

  /**
   * 更新日志统计信息
   * @param {Array} logs - 日志数组
   */
  async updateLogStats(logs) {
    try {
      const statsKey = `logs:stats:${this.serviceName}`;
      const pipeline = this.redisClient.pipeline();
      
      // 统计各级别日志数量
      const levelCounts = {};
      logs.forEach(log => {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      });
      
      // 更新Redis中的统计数据
      for (const [level, count] of Object.entries(levelCounts)) {
        pipeline.hincrby(statsKey, `count:${level}`, count);
      }
      
      // 更新总日志数
      pipeline.hincrby(statsKey, 'total', logs.length);
      
      // 设置统计数据过期时间
      pipeline.expire(statsKey, 24 * 60 * 60); // 24小时
      
      await pipeline.exec();
    } catch (error) {
      console.error('更新日志统计失败:', error);
    }
  }

  /**
   * 获取日志统计信息
   * @returns {Promise<object>} 统计信息
   */
  async getLogStats() {
    try {
      if (!this.redisClient) {
        return { error: 'Redis不可用' };
      }
      
      const statsKey = `logs:stats:${this.serviceName}`;
      const stats = await this.redisClient.hgetall(statsKey);
      
      return stats || {};
    } catch (error) {
      console.error('获取日志统计失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 搜索日志
   * @param {object} query - 搜索条件
   * @returns {Promise<Array>} 匹配的日志
   */
  async searchLogs(query = {}) {
    try {
      if (!this.redisClient) {
        return { logs: [], error: 'Redis不可用' };
      }
      
      const { level, message, startDate, endDate, limit = 100 } = query;
      const results = [];
      
      // 构建搜索键名
      const dateRange = this.getDateRange(startDate, endDate);
      
      // 在每个日期的日志中搜索
      for (const date of dateRange) {
        const logKey = `logs:${this.serviceName}:${date}`;
        
        // 检查键是否存在
        const exists = await this.redisClient.exists(logKey);
        if (!exists) continue;
        
        // 获取日志条目
        const logs = await this.redisClient.lrange(logKey, 0, -1);
        
        // 过滤日志
        for (const logStr of logs) {
          try {
            const log = JSON.parse(logStr);
            
            // 应用过滤条件
            if (level && log.level !== level) continue;
            if (message && !log.message.includes(message)) continue;
            
            results.push(log);
            
            // 达到限制数量
            if (results.length >= limit) {
              return { logs: results };
            }
          } catch (parseError) {
            console.error('解析日志失败:', parseError);
          }
        }
      }
      
      return { logs: results };
    } catch (error) {
      console.error('搜索日志失败:', error);
      return { logs: [], error: error.message };
    }
  }

  /**
   * 获取日期范围数组
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Array} 日期数组
   */
  getDateRange(startDate, endDate) {
    const dates = [];
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    // 限制最多搜索7天
    if (dates.length > 7) {
      return dates.slice(-7);
    }
    
    return dates;
  }

  /**
   * 关闭日志聚合器
   */
  async close() {
    // 确保所有日志都被刷新
    await this.flushAllLogs();
    
    // 停止定时器
    this.stopAutoFlush();
    
    this.isInitialized = false;
    console.log('日志聚合器已关闭');
  }
}

// 创建单例实例
let loggerAggregatorInstance = null;

/**
 * 获取日志聚合器实例
 * @returns {Promise<LoggerAggregator>} 日志聚合器实例
 */
async function getLoggerAggregator() {
  if (!loggerAggregatorInstance) {
    loggerAggregatorInstance = new LoggerAggregator();
    await loggerAggregatorInstance.initialize();
  }
  
  return loggerAggregatorInstance;
}

// 导出
module.exports = {
  LoggerAggregator,
  getLoggerAggregator,
  LOG_LEVELS
};
