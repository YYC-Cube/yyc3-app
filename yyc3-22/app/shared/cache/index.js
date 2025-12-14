/**
 * @file 缓存服务模块
 * @description 提供高级缓存管理，支持多级缓存、安全验证、监控统计、健康检查等功能
 * @module shared/cache
 * @author YYC
 * @version 2.0.1
 * @created 2024-10-15
 * @updated 2024-10-16
 */

const { logger } = require('../logger');
const { redisSecurityManager } = require('../redis/security');
const { redisService } = require('../redis');
const { AppError } = require('../errorHandler');

/**
 * 本地缓存项类
 */
class LocalCacheItem {
  constructor(value, ttl) {
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = Date.now() + (ttl * 1000);
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  getRemainingTtl() {
    const remaining = this.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }
}

/**
 * 本地缓存管理器 - 实现LRU缓存算法
 */
class LocalCacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300; // 默认5分钟
    this.cache = new Map();
    this.usageQueue = []; // LRU队列
    this.cleanupInterval = null;
    
    // 启动定期清理过期项
    this.startCleanup();
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (item.isExpired()) {
      this.delete(key);
      return null;
    }
    
    // 更新LRU队列
    this.updateUsage(key);
    
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    // 如果达到最大容量，删除最不常用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const leastUsed = this.usageQueue.shift();
      if (leastUsed) {
        this.cache.delete(leastUsed);
      }
    }
    
    // 设置缓存项
    this.cache.set(key, new LocalCacheItem(value, ttl));
    this.updateUsage(key);
    
    return true;
  }

  delete(key) {
    this.cache.delete(key);
    // 从LRU队列中移除
    const index = this.usageQueue.indexOf(key);
    if (index > -1) {
      this.usageQueue.splice(index, 1);
    }
    return true;
  }

  /**
   * 清除缓存
   * @param {string} pattern - 清除模式，为null时清除所有
   * @returns {number} 删除的键数量
   */
  clear(pattern = null) {
    let deletedCount = 0;
    
    if (pattern) {
      // 清除匹配模式的键
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern)) {
          keysToDelete.push(key);
        }
      }
      deletedCount = keysToDelete.length;
      keysToDelete.forEach(key => this.delete(key));
    } else {
      // 清除所有键
      deletedCount = this.cache.size;
      this.cache.clear();
      this.usageQueue = [];
    }
    
    return deletedCount;
  }

  /**
   * 更新缓存项的过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 新的过期时间（秒）
   * @returns {boolean} 是否更新成功
   */
  updateExpiry(key, ttl) {
    const item = this.cache.get(key);
    if (item && !item.isExpired()) {
      // 更新TTL和创建时间来重置过期时间
      item.ttl = ttl;
      item.createdAt = Date.now();
      this.updateUsage(key);
      return true;
    }
    return false;
  }

  updateUsage(key) {
    // 从当前位置移除
    const index = this.usageQueue.indexOf(key);
    if (index > -1) {
      this.usageQueue.splice(index, 1);
    }
    // 添加到末尾（最近使用）
    this.usageQueue.push(key);
  }

  startCleanup() {
    // 每60秒清理一次过期项
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  cleanupExpired() {
    const expiredKeys = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  getSize() {
    return this.cache.size;
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * 缓存服务类
 * 提供高级缓存管理、多级缓存、TTL策略、命名空间隔离和监控功能
 */
class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 默认缓存时间1小时
    this.namespace = process.env.CACHE_NAMESPACE || 'app';
    this.localCache = new LocalCacheManager({ 
      maxSize: 5000, 
      defaultTTL: 300 // 本地缓存默认5分钟
    });
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      lastReset: new Date().toISOString(),
      redisConnections: 0
    };
    this.ttlStrategies = {
      short: 300,    // 5分钟
      medium: 3600,  // 1小时
      long: 86400,   // 1天
      permanent: 0   // 永不过期
    };
    this.initialized = false;
    
    // 初始化缓存服务
    this.initialize();
  }

  /**
   * 初始化缓存服务
   */
  async initialize() {
    try {
      logger.info('开始初始化缓存服务...');
      
      // 确保Redis服务已初始化
      if (!redisService.isInitialized()) {
        logger.info('Redis服务未初始化，开始初始化...');
        await redisService.init();
      }
      
      // 验证Redis连接
      if (redisService.isConnected()) {
        this.stats.redisConnections++;
        logger.info('缓存服务成功连接到Redis');
        
        // 验证安全设置
        await this.validateSecurity();
        
        // 设置监控钩子
        this.setupMonitoring();
      } else {
        logger.warn('Redis未连接，缓存服务将使用本地内存缓存作为后备');
      }
      
      this.initialized = true;
      logger.info('缓存服务初始化完成，版本 2.0.0');
    } catch (error) {
      logger.error('缓存服务初始化失败:', { error: error.message });
      this.stats.errors++;
      throw new AppError(
        '缓存服务初始化失败',
        500,
        'CACHE_INIT_ERROR',
        false,
        { error: error.message }
      );
    }
  }
  
  /**
   * 验证Redis安全设置
   */
  async validateSecurity() {
    try {
      if (redisSecurityManager) {
        const securityStatus = await redisSecurityManager.validateConnection(redisService.getClient());
        if (!securityStatus.isSecure) {
          logger.warn('Redis连接安全检查警告', { warnings: securityStatus.warnings });
        } else {
          logger.info('Redis安全连接验证通过');
        }
      }
    } catch (error) {
      logger.error('Redis安全验证失败:', { error: error.message });
    }
  }
  
  /**
   * 设置缓存监控
   */
  setupMonitoring() {
    // 定期记录缓存统计信息
    setInterval(() => {
      const stats = this.getStats();
      logger.metric('cache_stats', stats);
      
      // 如果命中率低于阈值，记录警告
      const hitRateNum = parseFloat(stats.hitRate);
      if (hitRateNum < 20 && stats.totalOperations > 100) {
        logger.warn('缓存命中率过低', { hitRate: stats.hitRate });
      }
      
      // 检查本地缓存大小
      if (this.localCache.getSize() > this.localCache.maxSize * 0.9) {
        logger.warn('本地缓存接近最大容量', { current: this.localCache.getSize(), max: this.localCache.maxSize });
      }
    }, 300000); // 每5分钟
  }

  /**
   * 生成缓存键
   * @param {string} key - 原始键名
   * @param {string} namespace - 可选的自定义命名空间
   * @returns {string} 安全格式化后的缓存键
   */
  getCacheKey(key, namespace = null) {
    const ns = namespace || this.namespace;
    
    // 确保键安全（防止注入和无效字符）
    const safeNamespace = String(ns).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return `${safeNamespace}:${safeKey}`;
  }

  /**
   * 从缓存获取数据（支持多级缓存）
   * @param {string} key - 缓存键
   * @param {object} options - 选项
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<any>} 缓存的数据
   */
  async get(key, options = {}) {
    const { namespace = null, trackStats = true, skipLocal = false } = options;
    const cacheKey = this.getCacheKey(key, namespace);
    
    try {
      // 1. 先从本地缓存获取（如果未跳过）
      if (!skipLocal) {
        const localValue = this.localCache.get(cacheKey);
        if (localValue !== null) {
          if (trackStats) this.stats.hits++;
          logger.debug(`缓存命中(本地): ${key}`, { namespace, source: 'local' });
          return localValue;
        }
      }
      
      // 2. 从Redis获取
      if (redisService.isConnected()) {
        const client = redisService.getClient();
        const data = await client.get(cacheKey);
        
        if (data) {
          const parsedValue = JSON.parse(data);
          
          // 更新本地缓存（使用较短的TTL）
          if (!skipLocal) {
            this.localCache.set(cacheKey, parsedValue, 300); // 本地缓存5分钟
          }
          
          if (trackStats) this.stats.hits++;
          logger.debug(`缓存命中(Redis): ${key}`, { namespace, source: 'redis' });
          return parsedValue;
        }
      }
      
      // 缓存未命中
      if (trackStats) this.stats.misses++;
      logger.debug(`缓存未命中: ${key}`, { namespace });
      return null;
    } catch (error) {
      logger.error(`获取缓存失败: ${key}`, { error: error.message, namespace });
      if (trackStats) this.stats.errors++;
      return null;
    }
  }

  /**
   * 设置缓存数据（支持多级缓存）
   * @param {string} key - 缓存键
   * @param {any} value - 要缓存的数据
   * @param {object} options - 选项
   * @param {number|string} options.ttl - 缓存过期时间（秒）或TTL策略名称
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<boolean>} 是否设置成功
   */
  async set(key, value, options = {}) {
    const { ttl = this.defaultTTL, namespace = null, trackStats = true, skipLocal = false } = options;
    const cacheKey = this.getCacheKey(key, namespace);
    
    try {
      // 确定最终TTL
      const finalTTL = this.getTTLValue(ttl);
      
      // 过滤敏感数据
      const filteredValue = redisSecurityManager ? 
        redisSecurityManager.filterSensitiveData(value) : value;
      
      // 1. 设置本地缓存（如果未跳过）
      if (!skipLocal) {
        this.localCache.set(cacheKey, filteredValue, Math.min(finalTTL, 300)); // 本地缓存最多5分钟
      }
      
      // 2. 设置Redis缓存
      if (redisService.isConnected()) {
        const client = redisService.getClient();
        if (finalTTL > 0) {
          await client.set(cacheKey, JSON.stringify(filteredValue), 'EX', finalTTL);
        } else {
          await client.set(cacheKey, JSON.stringify(filteredValue)); // 永不过期
        }
      }
      
      if (trackStats) this.stats.sets++;
      logger.debug(`缓存设置: ${key}, TTL: ${finalTTL}秒`, { namespace, ttlStrategy: typeof ttl === 'string' ? ttl : 'custom' });
      return true;
    } catch (error) {
      logger.error(`设置缓存失败: ${key}`, { error: error.message, namespace });
      if (trackStats) this.stats.errors++;
      return false;
    }
  }
  
  /**
   * 获取TTL值（支持策略名称）
   * @param {number|string} ttl - TTL值或策略名称
   * @returns {number} 实际TTL值
   */
  getTTLValue(ttl) {
    if (typeof ttl === 'string' && this.ttlStrategies[ttl]) {
      return this.ttlStrategies[ttl];
    }
    return typeof ttl === 'number' ? ttl : this.defaultTTL;
  }

  /**
   * 删除缓存数据（支持多级缓存）
   * @param {string} key - 缓存键
   * @param {object} options - 选项
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(key, options = {}) {
    const { namespace = null, trackStats = true, skipLocal = false } = options;
    const cacheKey = this.getCacheKey(key, namespace);
    
    try {
      // 1. 删除本地缓存
      if (!skipLocal) {
        this.localCache.delete(cacheKey);
      }
      
      // 2. 删除Redis缓存
      if (redisService.isConnected()) {
        const client = redisService.getClient();
        await client.del(cacheKey);
      }
      
      if (trackStats) this.stats.deletes++;
      logger.debug(`缓存删除: ${key}`, { namespace });
      return true;
    } catch (error) {
      logger.error(`删除缓存失败: ${key}`, { error: error.message, namespace });
      if (trackStats) this.stats.errors++;
      return false;
    }
  }

  /**
   * 清除指定命名空间的所有缓存（支持多级缓存）
   * @param {string} namespace - 命名空间
   * @param {object} options - 选项
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @param {boolean} options.skipRedis - 是否跳过Redis缓存
   * @returns {Promise<boolean>} 是否清除成功
   */
  async clearNamespace(namespace, options = {}) {
    const { skipLocal = false, skipRedis = false } = options;
    
    try {
      let deletedKeys = 0;
      const pattern = `${namespace}:*`;
      
      // 清除本地缓存
      if (!skipLocal) {
        const localDeleted = this.localCache.clear(pattern);
        deletedKeys += localDeleted;
        logger.debug(`本地缓存命名空间清除: ${namespace}, 删除键数: ${localDeleted}`);
      }
      
      // 清除Redis缓存
      if (!skipRedis && redisService.isConnected()) {
        const client = redisService.getClient();
        
        // 使用SCAN代替KEYS以避免阻塞
        let cursor = 0;
        let redisDeleted = 0;
        
        do {
          const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = parseInt(result[0]);
          const keys = result[1];
          
          if (keys.length > 0) {
            await client.del(keys);
            redisDeleted += keys.length;
          }
        } while (cursor !== 0);
        
        deletedKeys += redisDeleted;
        logger.debug(`Redis缓存命名空间清除: ${namespace}, 删除键数: ${redisDeleted}`);
      }
      
      logger.info(`命名空间缓存清除成功: ${namespace}, 总计删除键数: ${deletedKeys}`);
      return true;
    } catch (error) {
      logger.error(`清除命名空间缓存失败: ${namespace}`, { error: error.message });
      throw new AppError(`清除命名空间缓存失败: ${namespace}`, { 
        code: 'CACHE_NAMESPACE_CLEAR_ERROR',
        cause: error
      });
    }
  }

  /**
   * 获取缓存数据，如果不存在则执行获取函数并缓存结果（支持多级缓存）
   * @param {string} key - 缓存键
   * @param {Function} fetcher - 数据获取函数
   * @param {object} options - 选项
   * @param {number|string} options.ttl - 缓存过期时间（秒）或TTL策略名称
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.backgroundRefresh - 是否在后台刷新缓存
   * @param {boolean} options.forceRefresh - 是否强制刷新缓存
   * @returns {Promise<any>} 缓存数据
   */
  async getWithCache(key, fetcher, options = {}) {
    const { 
      ttl = this.defaultTTL, 
      namespace = null, 
      trackStats = true,
      backgroundRefresh = false,
      forceRefresh = false
    } = options;
    
    const cacheKey = this.getCacheKey(key, namespace);
    
    try {
      // 如果不是强制刷新，先尝试从缓存获取
      let cachedValue = null;
      if (!forceRefresh) {
        cachedValue = await this.get(key, { 
          namespace, 
          trackStats,
          skipLocal: false // 始终使用多级缓存获取
        });
      }
      
      // 如果缓存命中且不是强制刷新
      if (cachedValue !== null && !forceRefresh) {
        // 如果启用了后台刷新且缓存已存在一段时间
        if (backgroundRefresh) {
          // 异步刷新缓存，不阻塞主流程
          this.refreshCacheInBackground(key, fetcher, options).catch(error => {
            logger.error(`后台刷新缓存失败: ${key}`, { error: error.message, namespace });
            if (trackStats) this.stats.errors++;
          });
        }
        return cachedValue;
      }
      
      // 缓存未命中或强制刷新，调用获取函数
      logger.debug(`${forceRefresh ? '强制刷新' : '缓存未命中'}，调用获取函数: ${key}`, { 
        namespace,
        forceRefresh 
      });
      
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('数据获取超时')), 30000); // 30秒超时
      });
      
      const freshData = await Promise.race([
        fetcher(),
        timeoutPromise
      ]);
      
      // 缓存结果（同时更新本地和Redis缓存）
      await this.set(key, freshData, { 
        ttl, 
        namespace, 
        trackStats,
        skipLocal: false // 强制更新所有层级缓存
      });
      
      // 预热相关缓存（如果数据结构合适）
      this.warmRelatedCache(key, freshData, options).catch(console.error);
      
      return freshData;
    } catch (error) {
      logger.error(`getWithCache 操作失败: ${key}`, { error: error.message, namespace });
      if (trackStats) this.stats.errors++;
      
      // 优雅降级：如果是后台刷新或强制刷新失败，尝试返回旧缓存
      if ((backgroundRefresh || forceRefresh) && !forceRefresh) {
        const fallbackValue = await this.get(key, { namespace, trackStats: false });
        if (fallbackValue !== null) {
          logger.warn(`使用降级策略，返回旧缓存: ${key}`, { namespace });
          return fallbackValue;
        }
      }
      
      // 抛出原始错误
      throw error;
    }
  }
  
  /**
   * 在后台刷新缓存
   * @private
   * @param {string} key - 缓存键
   * @param {Function} fetcher - 数据获取函数
   * @param {object} options - 选项
   * @returns {Promise<void>}
   */
  async refreshCacheInBackground(key, fetcher, options = {}) {
    const { ttl = this.defaultTTL, namespace = null } = options;
    
    // 添加锁机制，避免并发刷新
    const lockKey = `cache_refresh_lock:${this.getCacheKey(key, namespace)}`;
    const lockClient = redisService.getClient();
    
    // 尝试获取锁（5秒过期）
    const lockAcquired = await lockClient.set(lockKey, '1', 'NX', 'EX', 5);
    if (!lockAcquired) {
      logger.debug(`缓存刷新锁已存在，跳过重复刷新: ${key}`, { namespace });
      return;
    }
    
    try {
      // 使用更短的超时时间
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('后台数据获取超时')), 15000); // 15秒超时
      });
      
      const freshData = await Promise.race([
        fetcher(),
        timeoutPromise
      ]);
      
      // 设置缓存时指定不同的本地TTL，避免本地缓存过长
      await this.set(key, freshData, { 
        ttl, 
        namespace, 
        trackStats: false, // 后台操作不统计
        skipLocal: false
      });
      
      logger.debug(`后台刷新缓存成功: ${key}`, { namespace });
    } catch (error) {
      logger.error(`后台刷新缓存失败: ${key}`, { error: error.message, namespace });
    } finally {
      // 释放锁
      await lockClient.del(lockKey).catch(() => {});
    }
  }
  
  /**
   * 预热相关缓存
   * @private
   * @param {string} key - 当前缓存键
   * @param {any} data - 缓存数据
   * @param {object} options - 缓存选项
   * @returns {Promise<void>}
   */
  async warmRelatedCache(key, data, options = {}) {
    // 可以根据数据结构和业务需求实现相关缓存预热
    // 例如：如果是用户信息，可以预热用户权限、用户配置等相关缓存
    // 这里只实现基础的日志记录
    logger.debug(`缓存预热考虑: ${key}`, { dataType: typeof data });
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计信息
   */
  getStats() {
    const totalOperations = this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes;
    const hitRate = totalOperations > 0 ? 
      ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%' : 
      '0%';
    
    return {
      ...this.stats,
      totalOperations,
      hitRate,
      uptime: this.calculateUptime(),
      localCacheSize: this.localCache.size,
      ttlStrategies: { ...this.ttlStrategies },
      initialized: this.initialized
    };
  }

  /**
   * 重置缓存统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      redisConnections: 0,
      lastReset: new Date().toISOString()
    };
    logger.info('缓存统计信息已重置');
  }

  /**
   * 计算服务运行时间
   * @returns {string} 格式化的运行时间
   */
  calculateUptime() {
    const now = new Date();
    const lastReset = new Date(this.stats.lastReset);
    const diffMs = now - lastReset;
    const diffSecs = Math.floor(diffMs / 1000);
    
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * 设置缓存数据过期时间（支持多级缓存）
   * @param {string} key - 缓存键
   * @param {number|string} ttl - 过期时间（秒）或TTL策略名称
   * @param {object} options - 选项
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<boolean>} 是否设置成功
   */
  async expire(key, ttl, options = {}) {
    const { namespace = null, skipLocal = false } = options;
    const cacheKey = this.getCacheKey(key, namespace);
    const finalTTL = this.getTTLValue(ttl);
    
    try {
      // 更新本地缓存的过期时间
      if (!skipLocal) {
        this.localCache.updateExpiry(cacheKey, finalTTL);
      }
      
      // 更新Redis缓存的过期时间
      if (redisService.isConnected()) {
        const client = redisService.getClient();
        await client.expire(cacheKey, finalTTL);
      }
      
      logger.debug(`缓存过期时间设置: ${key}, TTL: ${finalTTL}秒`, { 
        namespace, 
        ttlStrategy: typeof ttl === 'string' ? ttl : 'custom'
      });
      return true;
    } catch (error) {
      logger.error(`设置缓存过期时间失败: ${key}`, { error: error.message, namespace });
      return false;
    }
  }

  /**
   * 检查缓存服务健康状态
   * @returns {Promise<{status: string, details: object}>} 健康状态
   */
  async checkHealth() {
    const redisConnected = redisService.isConnected();
    const localCacheHealthy = this.localCache.size < this.localCache.maxSize * 0.9; // 本地缓存使用小于90%
    
    // 尝试执行一个简单的Redis命令（如果已连接）
    let redisHealthy = redisConnected;
    if (redisConnected) {
      try {
        const client = redisService.getClient();
        await client.ping();
        redisHealthy = true;
      } catch (error) {
        redisHealthy = false;
        logger.error('Redis健康检查失败', { error: error.message });
      }
    }
    
    // 综合健康状态
    const status = (redisHealthy || !redisConnected) && localCacheHealthy ? 'healthy' : 'degraded';
    
    return {
      status,
      details: {
        redis: {
          connected: redisConnected,
          healthy: redisHealthy
        },
        localCache: {
          size: this.localCache.size,
          maxSize: this.localCache.maxSize,
          usage: `${Math.round((this.localCache.size / this.localCache.maxSize) * 100)}%`,
          healthy: localCacheHealthy
        },
        metrics: {
          hitRate: this.getStats().hitRate,
          uptime: this.calculateUptime()
        }
      }
    };
  }
  
  /**
   * 清理过期缓存
   * @returns {Promise<void>}
   */
  async cleanup() {
    // 清理本地缓存过期项
    const localCleanedCount = this.localCache.cleanupExpired();
    
    // 可以在这里添加Redis缓存的清理逻辑
    // 例如：使用Redis的SCAN命令查找和删除过期模式的键
    
    logger.debug(`缓存清理完成`, { localCleanedCount });
  }
  
  /**
   * 批量获取缓存数据（支持多级缓存）
   * @param {Array<string>} keys - 缓存键数组
   * @param {object} options - 选项
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<object>} 键值对对象
   */
  async mget(keys, options = {}) {
    const { namespace = null, trackStats = true, skipLocal = false } = options;
    const results = {};
    const missingKeys = [];
    const redisNeededKeys = [];
    const cacheKeys = {};
    
    try {
      // 生成缓存键映射
      keys.forEach(key => {
        const cacheKey = this.getCacheKey(key, namespace);
        cacheKeys[cacheKey] = key;
        redisNeededKeys.push(cacheKey);
      });
      
      // 1. 先从本地缓存获取
      if (!skipLocal) {
        Object.entries(cacheKeys).forEach(([cacheKey, originalKey]) => {
          const localValue = this.localCache.get(cacheKey);
          if (localValue !== null) {
            results[originalKey] = localValue;
            if (trackStats) this.stats.hits++;
            // 从需要从Redis获取的列表中移除
            const index = redisNeededKeys.indexOf(cacheKey);
            if (index > -1) redisNeededKeys.splice(index, 1);
          } else {
            missingKeys.push(originalKey);
          }
        });
      } else {
        missingKeys.push(...keys);
      }
      
      // 2. 从Redis获取剩余的键
      if (redisNeededKeys.length > 0 && redisService.isConnected()) {
        const client = redisService.getClient();
        const redisResults = await client.mget(redisNeededKeys);
        
        redisResults.forEach((value, index) => {
          const cacheKey = redisNeededKeys[index];
          const originalKey = cacheKeys[cacheKey];
          
          if (value) {
            try {
              const parsedValue = JSON.parse(value);
              results[originalKey] = parsedValue;
              
              // 更新本地缓存
              if (!skipLocal) {
                this.localCache.set(cacheKey, parsedValue, 300); // 5分钟
              }
              
              if (trackStats) {
                const wasMissing = missingKeys.includes(originalKey);
                if (wasMissing) {
                  this.stats.hits++;
                  missingKeys.splice(missingKeys.indexOf(originalKey), 1);
                }
              }
            } catch (parseError) {
              logger.warn(`解析缓存数据失败: ${originalKey}`, { error: parseError.message });
            }
          }
        });
      }
      
      // 统计未命中
      if (trackStats && missingKeys.length > 0) {
        this.stats.misses += missingKeys.length;
      }
      
      logger.debug(`批量获取缓存: ${keys.length} 个键`, { 
        found: Object.keys(results).length, 
        namespace,
        localHits: skipLocal ? 0 : Object.keys(results).length,
        redisRequests: redisNeededKeys.length
      });
      return results;
    } catch (error) {
      logger.error(`批量获取缓存失败`, { error: error.message, keys, namespace });
      if (trackStats) {
        this.stats.errors += keys.length;
      }
      return results;
    }
  }

  /**
   * 批量设置缓存数据（支持多级缓存）
   * @param {Object<string, any>} keyValuePairs - 键值对对象
   * @param {object} options - 选项
   * @param {number|string} options.ttl - 缓存过期时间（秒）或TTL策略名称
   * @param {string} options.namespace - 自定义命名空间
   * @param {boolean} options.trackStats - 是否跟踪统计信息
   * @param {boolean} options.skipLocal - 是否跳过本地缓存
   * @returns {Promise<boolean>} 是否全部设置成功
   */
  async mset(keyValuePairs, options = {}) {
    const { ttl = this.defaultTTL, namespace = null, trackStats = true, skipLocal = false } = options;
    
    try {
      const finalTTL = this.getTTLValue(ttl);
      const localCacheTTL = Math.min(finalTTL, 300); // 本地缓存最多5分钟
      
      // 1. 设置本地缓存（如果未跳过）
      if (!skipLocal) {
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          const cacheKey = this.getCacheKey(key, namespace);
          const filteredValue = redisSecurityManager ? 
            redisSecurityManager.filterSensitiveData(value) : value;
          this.localCache.set(cacheKey, filteredValue, localCacheTTL);
        });
      }
      
      // 2. 批量设置Redis缓存
      if (redisService.isConnected()) {
        const pipeline = redisService.getClient().pipeline();
        
        Object.entries(keyValuePairs).forEach(([key, value]) => {
          const cacheKey = this.getCacheKey(key, namespace);
          const filteredValue = redisSecurityManager ? 
            redisSecurityManager.filterSensitiveData(value) : value;
          
          if (finalTTL > 0) {
            pipeline.set(cacheKey, JSON.stringify(filteredValue), 'EX', finalTTL);
          } else {
            pipeline.set(cacheKey, JSON.stringify(filteredValue)); // 永不过期
          }
        });
        
        await pipeline.exec();
      }
      
      if (trackStats) {
        this.stats.sets += Object.keys(keyValuePairs).length;
      }
      
      logger.debug(`批量设置缓存: ${Object.keys(keyValuePairs).length} 个键`, { 
        namespace, 
        ttlStrategy: typeof ttl === 'string' ? ttl : 'custom'
      });
      return true;
    } catch (error) {
      logger.error(`批量设置缓存失败`, { error: error.message, namespace });
      if (trackStats) {
        this.stats.errors += Object.keys(keyValuePairs).length;
      }
      return false;
    }
  }
}

// 导出单例实例
const cacheService = new CacheService();

module.exports = {
  // 类导出
  CacheService,
  // 单例实例导出
  cacheService,
  // 工具类导出
  LocalCacheManager,
  LocalCacheItem,
  // 版本信息
  VERSION: '2.0.1'
};
