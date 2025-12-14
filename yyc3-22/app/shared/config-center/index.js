/**
 * @file 配置中心客户端
 * @description 实现集中式配置管理，支持动态配置更新和配置监听
 * @module config-center
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const Consul = require('consul');
const { logger } = require('../logger');

/**
 * 配置中心客户端类
 * 提供配置获取、监听和缓存功能
 */
class ConfigCenterClient {
  /**
   * 构造函数
   * @param {Object} config - 配置中心客户端配置
   */
  constructor(config = {}) {
    this.config = {
      host: process.env.CONFIG_CENTER_HOST || '127.0.0.1',
      port: process.env.CONFIG_CENTER_PORT || 8500,
      serviceName: process.env.SERVICE_NAME || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      secure: process.env.CONFIG_CENTER_SECURE === 'true',
      token: process.env.CONFIG_CENTER_TOKEN,
      ...config
    };
    
    this.consul = new Consul({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      token: this.config.token
    });
    
    this.configCache = new Map();
    this.watches = new Map();
    this.callbacks = new Map();
    this.initialized = false;
  }
  
  /**
   * 初始化配置中心客户端
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    try {
      logger.info('初始化配置中心客户端...');
      
      // 验证连接
      await this._verifyConnection();
      logger.info(`连接配置中心成功: ${this.config.host}:${this.config.port}`);
      
      // 加载初始配置
      await this.loadAllConfigs();
      logger.info('配置加载完成');
      
      // 设置配置变更监听
      this._setupWatchers();
      logger.info('配置监听设置完成');
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('配置中心初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 加载所有配置
   * @returns {Promise<void>}
   */
  async loadAllConfigs() {
    try {
      // 加载全局配置
      await this.loadConfig('global');
      
      // 加载环境配置
      await this.loadConfig(`env/${this.config.environment}`);
      
      // 加载服务配置
      await this.loadConfig(`services/${this.config.serviceName}`);
      
      // 加载环境特定的服务配置
      await this.loadConfig(`services/${this.config.serviceName}/${this.config.environment}`);
      
      logger.info(`共加载 ${this.configCache.size} 项配置`);
      return true;
    } catch (error) {
      logger.error('加载配置失败:', error);
      return false;
    }
  }
  
  /**
   * 获取配置
   * @param {string} key - 配置键
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  getConfig(key, defaultValue = null) {
    // 支持嵌套键路径，如 "redis/host"
    if (key.includes('/')) {
      return this._getNestedConfig(key, defaultValue);
    }
    
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }
    
    return defaultValue;
  }
  
  /**
   * 设置配置
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setConfig(key, value) {
    try {
      // 将值序列化为JSON字符串
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // 写入Consul KV
      await this.consul.kv.set({
        key: key,
        value: stringValue
      });
      
      // 更新本地缓存
      this.configCache.set(key, value);
      
      logger.info(`配置设置成功: ${key}`);
      return true;
    } catch (error) {
      logger.error(`配置设置失败 ${key}:`, error);
      return false;
    }
  }
  
  /**
   * 设置配置变更监听器
   * @param {string} key - 配置键或前缀
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消监听函数
   */
  watchConfig(key, callback) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, []);
    }
    
    this.callbacks.get(key).push(callback);
    
    // 返回取消监听函数
    return () => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
          logger.info(`取消配置监听: ${key}`);
        }
      }
    };
  }
  
  /**
   * 获取所有已加载的配置键
   * @returns {Array<string>} 配置键列表
   */
  getAllConfigKeys() {
    return Array.from(this.configCache.keys());
  }
  
  /**
   * 检查配置是否已加载
   * @returns {boolean} 是否已初始化
   */
  isInitialized() {
    return this.initialized;
  }
  
  /**
   * 验证与配置中心的连接
   * @private
   * @returns {Promise<void>}
   */
  async _verifyConnection() {
    try {
      await this.consul.status.leader();
    } catch (error) {
      throw new Error(`无法连接到配置中心: ${error.message}`);
    }
  }
  
  /**
   * 加载指定路径的配置
   * @private
   * @param {string} path - 配置路径
   * @returns {Promise<void>}
   */
  async loadConfig(path) {
    try {
      logger.debug(`加载配置路径: ${path}`);
      
      const result = await this.consul.kv.get({
        key: path,
        recurse: true
      });
      
      if (!result) {
        logger.debug(`配置路径不存在: ${path}`);
        return;
      }
      
      if (Array.isArray(result)) {
        result.forEach(item => this._processConfigItem(item));
      } else {
        this._processConfigItem(result);
      }
    } catch (error) {
      logger.error(`加载配置路径失败 ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * 处理单个配置项
   * @private
   * @param {Object} item - 配置项
   */
  _processConfigItem(item) {
    if (item.Value) {
      try {
        // 尝试解析JSON
        const value = JSON.parse(item.Value);
        this.configCache.set(item.Key, value);
        logger.debug(`解析JSON配置成功: ${item.Key}`);
      } catch (e) {
        // 如果不是JSON，直接保存
        this.configCache.set(item.Key, item.Value);
        logger.debug(`保存非JSON配置: ${item.Key}`);
      }
    }
  }
  
  /**
   * 设置配置变更监视器
   * @private
   */
  _setupWatchers() {
    // 监听全局配置变更
    this._watchPath('global');
    
    // 监听环境配置变更
    this._watchPath(`env/${this.config.environment}`);
    
    // 监听服务配置变更
    this._watchPath(`services/${this.config.serviceName}`);
    
    // 监听环境特定的服务配置变更
    this._watchPath(`services/${this.config.serviceName}/${this.config.environment}`);
  }
  
  /**
   * 监听指定路径的配置变更
   * @private
   * @param {string} path - 配置路径
   */
  _watchPath(path) {
    try {
      logger.info(`设置配置监听: ${path}`);
      
      // 创建Consul watch
      const watch = this.consul.watch({
        method: this.consul.kv.get,
        options: {
          key: path,
          recurse: true
        }
      });
      
      // 保存watch引用
      this.watches.set(path, watch);
      
      // 设置变更回调
      watch.on('change', data => {
        if (!data) return;
        
        logger.info(`检测到配置变更: ${path}`);
        
        if (Array.isArray(data)) {
          data.forEach(item => {
            this._processConfigItem(item);
            this._notifyConfigChange(item.Key, this.configCache.get(item.Key));
          });
        } else {
          this._processConfigItem(data);
          this._notifyConfigChange(data.Key, this.configCache.get(data.Key));
        }
      });
      
      // 设置错误处理
      watch.on('error', error => {
        logger.error(`配置监听错误 ${path}:`, error);
        
        // 尝试重新设置watch
        setTimeout(() => {
          logger.info(`尝试重新设置配置监听: ${path}`);
          this._watchPath(path);
        }, 5000);
      });
    } catch (error) {
      logger.error(`设置配置监听失败 ${path}:`, error);
    }
  }
  
  /**
   * 触发配置变更回调
   * @private
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   */
  _notifyConfigChange(key, value) {
    // 通知精确匹配的回调
    if (this.callbacks.has(key)) {
      const callbacks = this.callbacks.get(key);
      callbacks.forEach(callback => {
        try {
          callback(key, value);
          logger.debug(`触发配置回调: ${key}`);
        } catch (error) {
          logger.error(`配置变更回调执行失败 ${key}:`, error);
        }
      });
    }
    
    // 通知前缀匹配的回调
    this.callbacks.forEach((callbacks, watchKey) => {
      // 跳过精确匹配的键和不以/结尾的键（避免误匹配）
      if (watchKey === key || !watchKey.endsWith('/')) return;
      
      // 检查是否以watchKey作为前缀
      if (key.startsWith(watchKey)) {
        callbacks.forEach(callback => {
          try {
            callback(key, value);
            logger.debug(`触发前缀配置回调: ${watchKey} -> ${key}`);
          } catch (error) {
            logger.error(`前缀配置变更回调执行失败 ${watchKey}:`, error);
          }
        });
      }
    });
  }
  
  /**
   * 获取嵌套配置
   * @private
   * @param {string} path - 嵌套键路径，如 "redis/host"
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  _getNestedConfig(path, defaultValue) {
    // 尝试直接获取完整路径
    if (this.configCache.has(path)) {
      return this.configCache.get(path);
    }
    
    // 尝试从父配置中获取子属性
    const parts = path.split('/');
    let current = null;
    
    // 尝试所有可能的父路径
    for (let i = parts.length - 1; i > 0; i--) {
      const parentKey = parts.slice(0, i).join('/');
      const remainingKeys = parts.slice(i);
      
      if (this.configCache.has(parentKey)) {
        current = this.configCache.get(parentKey);
        
        // 遍历剩余的键路径
        let found = true;
        for (const key of remainingKeys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            found = false;
            break;
          }
        }
        
        if (found) {
          return current;
        }
      }
    }
    
    return defaultValue;
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 关闭所有watch
    this.watches.forEach((watch, path) => {
      try {
        watch.end();
        logger.info(`关闭配置监听: ${path}`);
      } catch (error) {
        logger.error(`关闭配置监听失败 ${path}:`, error);
      }
    });
    
    // 清空缓存和回调
    this.watches.clear();
    this.configCache.clear();
    this.callbacks.clear();
    this.initialized = false;
    
    logger.info('配置中心客户端资源已清理');
  }
}

// 创建单例实例
let configCenterInstance = null;

/**
 * 获取配置中心客户端实例
 * @param {Object} config - 配置选项
 * @returns {ConfigCenterClient} 配置中心客户端实例
 */
function getConfigCenter(config = {}) {
  if (!configCenterInstance) {
    configCenterInstance = new ConfigCenterClient(config);
  }
  return configCenterInstance;
}

/**
 * 配置中心工具类
 * 提供便捷的配置访问方法
 */
class ConfigUtils {
  /**
   * 获取配置，并根据环境变量名转换为正确的类型
   * @param {string} key - 配置键
   * @param {any} defaultValue - 默认值
   * @returns {any} 配置值
   */
  static getConfigWithType(key, defaultValue = null) {
    const config = getConfigCenter();
    const value = config.getConfig(key, defaultValue);
    
    // 如果是字符串，尝试自动转换类型
    if (typeof value === 'string') {
      // 尝试解析数字
      if (!isNaN(value) && value.trim() !== '') {
        return Number(value);
      }
      
      // 尝试解析布尔值
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      
      // 尝试解析JSON
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // 解析失败，返回原始字符串
        }
      }
    }
    
    return value;
  }
  
  /**
   * 批量获取配置
   * @param {Array<string>} keys - 配置键数组
   * @returns {Object} 配置对象，键为配置名，值为配置值
   */
  static getConfigs(keys) {
    const config = getConfigCenter();
    const result = {};
    
    keys.forEach(key => {
      result[key] = config.getConfig(key);
    });
    
    return result;
  }
  
  /**
   * 获取特定服务的配置前缀
   * @param {string} serviceName - 服务名称
   * @returns {string} 配置前缀
   */
  static getServiceConfigPrefix(serviceName) {
    const env = process.env.NODE_ENV || 'development';
    return `services/${serviceName}/${env}`;
  }
}

module.exports = {
  ConfigCenterClient,
  getConfigCenter,
  ConfigUtils,
  VERSION: '1.0.0'
};
