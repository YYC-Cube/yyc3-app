/**
 * @file Redis配置管理模块
 * @description 统一管理Redis连接配置和环境变量，增强安全配置和验证
 * @module shared/redis/config
 * @author YYC
 * @version 2.0.0
 * @created 2024-05-11
 * @updated 2024-10-15
 */

const logger = require('../logger');
const { redisSecurityManager } = require('./security');

/**
 * Redis连接配置管理
 * @class RedisConfig
 */
class RedisConfig {
  /**
   * 获取Redis连接配置
   * @returns {Object} Redis连接配置对象
   */
  static getConfig() {
    const baseConfig = {
      // 基本连接配置
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6380', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      
      // 安全配置
      useTls: String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true',
      enableClusterMode: String(process.env.REDIS_CLUSTER || 'false').toLowerCase() === 'true',
      
      // 命名空间和标识
      namespace: process.env.REDIS_NAMESPACE || 'api',
      applicationName: process.env.APP_NAME || 'unknown',
      
      // 连接超时和重试配置
      timeoutMs: parseInt(process.env.REDIS_TIMEOUT_MS || '5000', 10),
      socketTimeoutMs: parseInt(process.env.REDIS_SOCKET_TIMEOUT || '10000', 10),
      commandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000', 10),
      
      // 重试策略
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
      maxReconnectRetries: parseInt(process.env.REDIS_MAX_RECONNECT_RETRIES || '10', 10),
      
      // 性能配置
      maxMemoryPercentage: parseFloat(process.env.REDIS_MAX_MEMORY_PERCENTAGE || '75'),
      enableAutoPipelining: String(process.env.REDIS_ENABLE_PIPELINING || 'true').toLowerCase() === 'true',
      pipelineBatchSize: parseInt(process.env.REDIS_PIPELINE_BATCH_SIZE || '100', 10),
      
      // 监控和审计
      enableCommandMonitoring: true,
      enableSlowLog: String(process.env.REDIS_ENABLE_SLOW_LOG || 'true').toLowerCase() === 'true',
      slowLogThreshold: parseInt(process.env.REDIS_SLOW_LOG_THRESHOLD || '100', 10),
      
      // 数据安全
      defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
      maxKeySize: 1024, // 1KB
      maxValueSize: 5 * 1024 * 1024, // 5MB
      
      // ACL配置
      username: process.env.REDIS_USERNAME,
      requireAuth: process.env.REDIS_PASSWORD ? true : false
    };
    
    // 配置重试策略
    baseConfig.retryStrategy = (retries) => {
      if (retries > baseConfig.maxReconnectRetries) {
        logger.error(`[Redis] 达到最大重连次数: ${retries}`);
        return undefined;
      }
      
      // 指数退避策略
      const delay = Math.min(100 + retries * 500, 5000);
      logger.info(`[Redis] 正在尝试重连 (${retries}/${baseConfig.maxReconnectRetries}), 延迟: ${delay}ms`);
      return delay;
    };
    
    return baseConfig;
  }

  /**
   * 获取Redis URL
   * @returns {string} Redis连接URL
   */
  static getRedisUrl() {
    const config = this.getConfig();
    const protocol = config.useTls ? 'rediss' : 'redis';
    let url = `${protocol}://`;
    
    // 添加认证信息（如果有）
    if (config.username && config.password) {
      url += `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@`;
    } else if (config.password) {
      url += `:${encodeURIComponent(config.password)}@`;
    }
    
    url += `${config.host}:${config.port}/${config.db}`;
    return url;
  }

  /**
   * 验证配置有效性
   * @returns {boolean} 配置是否有效
   */
  static validateConfig() {
    const config = this.getConfig();
    
    // 基本配置验证
    if (!config.host || !config.port || isNaN(config.port) || config.port <= 0 || config.port >= 65536) {
      logger.error('[Redis] 无效的主机或端口配置');
      return false;
    }
    
    // 生产环境强制要求密码
    if (process.env.NODE_ENV === 'production' && !config.password) {
      logger.error('[Redis] 生产环境必须配置Redis密码');
      return false;
    }
    
    // 生产环境推荐使用TLS
    if (process.env.NODE_ENV === 'production' && !config.useTls) {
      logger.warn('[Redis] 生产环境强烈推荐使用TLS加密连接');
    }
    
    // 使用安全管理器验证配置
    const securityValidation = redisSecurityManager.validateConfiguration(config);
    
    // 记录安全分数
    logger.info(`[Redis] 配置安全分数: ${securityValidation.securityScore || '未知'}`);
    
    return securityValidation.isValid;
  }
  
  /**
   * 获取安全配置选项
   * @returns {Object} 适用于Redis客户端的安全配置
   */
  static getSecureOptions() {
    const config = this.getConfig();
    
    const options = {
      url: this.getRedisUrl(),
      name: config.namespace,
      database: config.db,
      username: config.username,
      password: config.password,
      
      // 安全选项
      socket: {
        tls: config.useTls,
        connectTimeout: config.timeoutMs,
        socketTimeout: config.socketTimeoutMs,
        
        // TLS特定选项
        ...(config.useTls && {
          rejectUnauthorized: true,
          secureOptions: 0, // 使用TLSv1.2+默认设置
          ca: process.env.REDIS_TLS_CA ? [process.env.REDIS_TLS_CA] : undefined,
          key: process.env.REDIS_TLS_KEY,
          cert: process.env.REDIS_TLS_CERT
        })
      },
      
      // 性能和可靠性
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      enableAutoPipelining: config.enableAutoPipelining,
      
      // 命令超时
      commandTimeout: config.commandTimeoutMs,
      
      // 监控配置
      autoResendUnfulfilledCommands: true,
      
      // 重试策略
      reconnectStrategy: config.retryStrategy
    };
    
    return options;
  }
  
  /**
   * 检查是否使用了默认端口
   * @returns {boolean} 是否使用默认端口
   */
  static isDefaultPort() {
    const config = this.getConfig();
    return config.port === 6379;
  }
  
  /**
   * 获取环境配置摘要（安全敏感信息被屏蔽）
   * @returns {Object} 配置摘要
   */
  /**
   * 解析Sentinel节点字符串为对象数组
   * @param {string} nodesString - 节点字符串，格式：host1:port1,host2:port2
   * @returns {Array} 节点对象数组
   */
  static parseSentinelNodes(nodesString) {
    if (!nodesString || typeof nodesString !== 'string') {
      return [];
    }
    
    return nodesString.split(',').map(node => {
      const [host, port] = node.trim().split(':');
      return {
        host: host.trim(),
        port: parseInt(port, 10) || 26379
      };
    });
  }

  /**
   * 获取配置摘要信息
   * @returns {Object} 配置摘要对象
   */
  static getConfigSummary() {
    const config = this.getConfig();
    return {
      host: config.host,
      port: config.port,
      useTls: config.useTls,
      db: config.db,
      namespace: config.namespace,
      enableClusterMode: config.enableClusterMode,
      enableSentinelMode: config.enableSentinelMode,
      sentinelNodesCount: config.sentinelNodes.length,
      sentinelName: config.sentinelName,
      hasPassword: !!config.password,
      hasUsername: !!config.username,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

module.exports = RedisConfig;
