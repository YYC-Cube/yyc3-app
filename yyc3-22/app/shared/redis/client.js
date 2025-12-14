/**
 * @file Redis客户端实现模块
 * @description 统一的Redis客户端实现，提供连接管理、安全增强和基础操作
 * @module shared/redis/client
 * @author YYC
 * @version 2.0.0
 * @created 2024-05-11
 * @updated 2024-10-15
 */

const { createClient } = require('redis');
const RedisConfig = require('./config');
const logger = require('../logger');
const { redisSecurityManager } = require('./security');

/**
 * Redis客户端管理类
 * @class RedisClient
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.reconnectAttempts = 0;
    this.lastReconnectTime = 0;
    this.commandStats = {
      total: 0,
      failed: 0,
      lastCommandTime: 0
    };
    this.connectionStartTime = null;
  }

  /**
   * 初始化Redis客户端
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    // 如果已经初始化且连接正常，直接返回
    if (this.client && this.client.isOpen && this.isReady) {
      logger.info('[Redis] 客户端已初始化');
      return;
    }

    // 验证配置
    if (!RedisConfig.validateConfig()) {
      throw new Error('[Redis] 配置验证失败，无法初始化客户端');
    }

    try {
      // 获取安全配置选项
      const secureOptions = RedisConfig.getSecureOptions();
      logger.info('[Redis] 正在初始化客户端，使用安全配置', RedisConfig.getConfigSummary());

      // 创建客户端
      this.client = createClient(secureOptions);

      // 增强客户端安全性
      this.client = redisSecurityManager.createSecureClient(this.client);

      // 设置事件监听器
      this.setupEventListeners();
      
      // 开始计时
      this.connectionStartTime = Date.now();
      
      // 连接客户端
      await this.client.connect();
      
      this.isReady = true;
      this.reconnectAttempts = 0;
      const connectTime = Date.now() - this.connectionStartTime;
      
      logger.info(`[Redis] 客户端初始化成功，连接耗时: ${connectTime}ms`);
      
      // 连接成功后检查安全状态
      this.performSecurityCheck();
    } catch (error) {
      this.isReady = false;
      const errorDetails = {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      logger.error('[Redis] 初始化客户端失败', errorDetails);
      throw error;
    }
  }

  /**
   * 设置事件监听器
   * @private
   */
  setupEventListeners() {
    if (!this.client) return;

    this.client.on('error', (err) => {
      const errorDetails = {
        message: err.message,
        code: err.code,
        command: err.command,
        args: err.args
      };
      
      // 记录错误日志并分类
      if (err.code === 'ECONNREFUSED') {
        logger.critical('[Redis] 连接被拒绝，请检查Redis服务器状态和配置', errorDetails);
      } else if (err.code === 'ETIMEDOUT') {
        logger.error('[Redis] 连接超时', errorDetails);
      } else if (err.code === 'NOPERM') {
        logger.critical('[Redis] 认证失败或权限不足', errorDetails);
        // 记录安全事件
        logger.logSecurityEvent('auth_failure', {
          reason: 'permission_denied',
          error: err.message
        });
      } else {
        logger.error('[Redis] 客户端错误', errorDetails);
      }
      
      this.isReady = false;
    });

    this.client.on('connect', () => {
      logger.debug('[Redis] 正在连接...');
    });

    this.client.on('ready', () => {
      logger.info('[Redis] 连接就绪');
      this.isReady = true;
      this.reconnectAttempts = 0;
      
      // 记录连接成功事件
      logger.logSecurityEvent('connection_established', {
        host: this.client.options.socket?.host || 'unknown',
        port: this.client.options.socket?.port || 'unknown',
        tls: this.client.options.socket?.tls || false
      });
    });

    this.client.on('end', () => {
      logger.warn('[Redis] 连接已关闭');
      this.isReady = false;
    });

    this.client.on('reconnecting', (params) => {
      this.reconnectAttempts++;
      const now = Date.now();
      
      // 防止日志风暴
      if (now - this.lastReconnectTime > 5000 || this.reconnectAttempts <= 3) {
        this.lastReconnectTime = now;
        logger.warn(`[Redis] 正在尝试重连 (${this.reconnectAttempts}), 延迟: ${params.delay}ms`);
      }
      
      // 重连次数过多时记录警告
      if (this.reconnectAttempts > 5) {
        logger.warn(`[Redis] 重连次数过多 (${this.reconnectAttempts})，可能存在网络问题`);
      }
    });
    
    this.client.on('commandStarted', (command) => {
      // 更新命令统计
      this.commandStats.total++;
      this.commandStats.lastCommandTime = Date.now();
      
      // 记录敏感命令
      if (redisSecurityManager.isSensitiveCommand(command.name)) {
        logger.debug(`[Redis] 执行敏感命令: ${command.name}`, {
          argsLength: command.args.length,
          commandId: command.commandId
        });
      }
    });
    
    this.client.on('commandFailed', (command, error) => {
      this.commandStats.failed++;
      
      logger.error(`[Redis] 命令执行失败: ${command.name}`, {
        error: error.message,
        code: error.code
      });
    });
  }

  /**
   * 获取Redis客户端实例（带安全包装）
   * @returns {Object} Redis客户端实例
   */
  getClient() {
    if (!this.client) {
      throw new Error('[Redis] 客户端未初始化');
    }
    
    // 如果客户端未就绪，记录警告
    if (!this.isReady) {
      logger.warn('[Redis] 客户端未就绪，请检查连接状态');
    }
    
    return this.client;
  }

  /**
   * 检查客户端状态
   * @returns {boolean} 客户端是否就绪
   */
  isClientReady() {
    return this.isReady && this.client && this.client.isOpen;
  }

  /**
   * 检查客户端是否已初始化
   * @returns {boolean} 是否已初始化
   */
  isInitialized() {
    return !!this.client;
  }

  /**
   * 获取连接信息
   * @returns {Object} 连接信息对象
   */
  getConnectionInfo() {
    if (!this.client) {
      return null;
    }
    
    const options = this.client.options;
    const socket = options.socket || {};
    
    return {
      connected: this.isReady,
      host: socket.host || 'localhost',
      port: socket.port || 6379,
      db: options.database || 0,
      username: options.username || null,
      hasPassword: !!options.password,
      useTls: socket.tls || false,
      reconnectAttempts: this.reconnectAttempts,
      isOpen: this.client.isOpen,
      isReady: this.isReady,
      uptime: this.calculateUptime(),
      commandStats: {
        total: this.commandStats.total,
        failed: this.commandStats.failed,
        failureRate: this.commandStats.total > 0 ? 
          ((this.commandStats.failed / this.commandStats.total) * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  /**
   * 测试Redis连接
   * @async
   * @returns {Promise<boolean>} 连接是否正常
   */
  async ping() {
    try {
      if (!this.isClientReady()) {
        logger.info('[Redis] 客户端未就绪，尝试重新初始化');
        await this.initialize();
      }
      
      const startTime = Date.now();
      const result = await this.client.ping();
      const latency = Date.now() - startTime;
      
      logger.debug(`[Redis] Ping成功，延迟: ${latency}ms`);
      
      return result === 'PONG';
    } catch (error) {
      logger.error('[Redis] Ping失败', { error: error.message });
      return false;
    }
  }

  /**
   * 断开Redis连接
   * @async
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.client && this.client.isOpen) {
        logger.info('[Redis] 正在断开连接...');
        await this.client.quit();
        this.isReady = false;
        this.client = null;
        logger.info('[Redis] 连接已断开');
      }
    } catch (error) {
      logger.error('[Redis] 断开连接失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 执行安全检查
   * @private
   */
  async performSecurityCheck() {
    try {
      if (!this.isClientReady()) return;
      
      const client = this.client;
      const serverInfo = await client.info('server');
      const memoryInfo = await client.info('memory');
      
      // 生成安全报告
      const securityReport = redisSecurityManager.generateSecurityReport({
        server: serverInfo,
        memory: memoryInfo
      });
      
      logger.info('[Redis] 安全检查完成', {
        securityScore: securityReport.score,
        warnings: securityReport.warnings.length,
        version: securityReport.version
      });
      
      // 记录安全分数
      if (securityReport.score < 80) {
        logger.warn('[Redis] 安全分数较低，请检查配置', {
          score: securityReport.score,
          criticalIssues: securityReport.criticalIssues
        });
      }
    } catch (error) {
      logger.error('[Redis] 执行安全检查失败', { error: error.message });
    }
  }
  
  /**
   * 计算连接运行时间
   * @private
   * @returns {string} 格式化的运行时间
   */
  calculateUptime() {
    if (!this.connectionStartTime) return '0s';
    
    const now = Date.now();
    const diffMs = now - this.connectionStartTime;
    const diffSecs = Math.floor(diffMs / 1000);
    
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * 获取连接健康状态
   * @async
   * @returns {Object} 健康状态信息
   */
  async getHealthStatus() {
    const connectionInfo = this.getConnectionInfo();
    
    try {
      // 测试连接
      const isAlive = await this.ping();
      
      // 获取延迟
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;
      
      // 获取内存使用
      const memoryInfo = await this.client.info('memory');
      const memoryUsage = this.parseMemoryInfo(memoryInfo);
      
      return {
        status: isAlive ? 'healthy' : 'unhealthy',
        connected: connectionInfo.connected,
        latency,
        memoryUsage,
        commandStats: connectionInfo.commandStats,
        reconnectAttempts: connectionInfo.reconnectAttempts,
        uptime: connectionInfo.uptime
      };
    } catch (error) {
      logger.error('[Redis] 获取健康状态失败', { error: error.message });
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        reconnectAttempts: connectionInfo.reconnectAttempts
      };
    }
  }
  
  /**
   * 解析内存信息
   * @private
   * @param {string} memoryInfoStr - Redis内存信息字符串
   * @returns {Object} 解析后的内存信息
   */
  parseMemoryInfo(memoryInfoStr) {
    const info = {};
    const lines = memoryInfoStr.split('\r\n');
    
    for (const line of lines) {
      if (line.startsWith('used_memory:')) {
        info.usedMemory = parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('used_memory_rss:')) {
        info.usedMemoryRss = parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('maxmemory:')) {
        info.maxMemory = parseInt(line.split(':')[1]) || 0;
      } else if (line.startsWith('used_memory_peak:')) {
        info.usedMemoryPeak = parseInt(line.split(':')[1]) || 0;
      }
    }
    
    return info;
  }
}

// 导出单例实例
module.exports = new RedisClient();
