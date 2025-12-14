/**
 * @file Redis服务模块入口
 * @description 统一的Redis服务接口，整合配置和客户端功能
 * @module shared/redis
 * @author YYC
 * @version 1.0.0
 * @created 2024-05-11
 */

const client = require('./client');
const RedisConfig = require('./config');

/**
 * Redis服务类
 * @class RedisService
 */
class RedisService {
  /**
   * 初始化Redis服务
   * @async
   * @returns {Promise<boolean>} 初始化是否成功
   */
  static async init() {
    try {
      // 验证配置
      if (!RedisConfig.validateConfig()) {
        throw new Error('[Redis] Invalid configuration');
      }
      
      // 初始化客户端
      await client.initialize();
      
      // 测试连接
      const isConnected = await client.ping();
      console.log(`[Redis] Service initialized: ${isConnected ? 'Connected' : 'Not connected'}`);
      return isConnected;
    } catch (error) {
      console.warn('[Redis] Service initialization failed:', error.message);
      // 失败时返回false但不抛出异常，避免阻塞应用启动
      return false;
    }
  }

  /**
   * 获取Redis客户端实例
   * @returns {Object} Redis客户端实例
   */
  static getClient() {
    return client.getClient();
  }

  /**
   * 检查Redis服务状态
   * @returns {boolean} 服务是否就绪
   */
  static isReady() {
    return client.isClientReady();
  }

  /**
   * 检查是否已初始化
   * @returns {boolean} 是否已初始化
   */
  static isInitialized() {
    return client.isInitialized();
  }

  /**
   * 测试Redis连接
   * @async
   * @returns {Promise<boolean>} 连接是否正常
   */
  static async ping() {
    return client.ping();
  }

  /**
   * 断开Redis连接
   * @async
   * @returns {Promise<void>}
   */
  static async disconnect() {
    return client.disconnect();
  }

  /**
   * 获取Redis配置信息
   * @returns {Object} Redis配置对象
   */
  static getConfig() {
    return RedisConfig.getConfig();
  }

  /**
   * 获取Redis服务器版本
   * @async
   * @returns {Promise<string|null>} Redis服务器版本
   */
  static async getServerVersion() {
    if (!this.isReady()) {
      return null;
    }
    try {
      const redisClient = this.getClient();
      const info = await redisClient.info('server');
      const versionMatch = info.match(/redis_version:([\d.]+)/);
      return versionMatch ? versionMatch[1] : null;
    } catch (error) {
      console.error('[Redis] 获取版本失败:', error);
      return null;
    }
  }

  /**
   * 获取Redis延迟
   * @async
   * @returns {Promise<number|null>} 延迟时间（毫秒）
   */
  static async getLatency() {
    if (!this.isReady()) {
      return null;
    }
    try {
      const startTime = Date.now();
      await this.ping();
      return Date.now() - startTime;
    } catch (error) {
      console.error('[Redis] 获取延迟失败:', error);
      return null;
    }
  }

  /**
   * 获取Redis连接信息
   * @returns {Object|null} 连接信息
   */
  static getConnectionInfo() {
    if (!this.isReady()) {
      return null;
    }
    return client.getConnectionInfo();
  }

  /**
   * 获取服务版本信息
   * @returns {string} 服务版本
   */
  static getVersion() {
    return '1.0.0';
  }
}

// 导出服务类和其他组件
module.exports = {
  RedisService,
  client,
  config: RedisConfig,
  // 为了向后兼容，也直接导出服务实例
  init: RedisService.init.bind(RedisService),
  getClient: RedisService.getClient.bind(RedisService),
  isReady: RedisService.isReady.bind(RedisService),
  ping: RedisService.ping.bind(RedisService),
  disconnect: RedisService.disconnect.bind(RedisService),
  getConfig: RedisService.getConfig.bind(RedisService)
};
