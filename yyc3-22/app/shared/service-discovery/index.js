/**
 * @file 服务发现客户端
 * @description 提供服务注册、发现、健康检查和负载均衡功能
 * @module service-discovery
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const Consul = require('consul');
const { logger } = require('../logger');

/**
 * 负载均衡策略枚举
 */
const LoadBalancerStrategy = {
  ROUND_ROBIN: 'round-robin',
  RANDOM: 'random',
  LEAST_CONNECTIONS: 'least-connections',
  CONSISTENT_HASH: 'consistent-hash'
};

/**
 * 服务发现客户端类
 * 提供服务注册、发现和健康检查功能
 */
class ServiceDiscoveryClient {
  /**
   * 构造函数
   * @param {Object} config - 服务发现客户端配置
   */
  constructor(config = {}) {
    this.config = {
      host: process.env.CONSUL_HOST || '127.0.0.1',
      port: process.env.CONSUL_PORT || 8500,
      serviceName: process.env.SERVICE_NAME || 'unknown-service',
      secure: process.env.CONSUL_SECURE === 'true',
      token: process.env.CONSUL_TOKEN,
      loadBalancerStrategy: process.env.LB_STRATEGY || LoadBalancerStrategy.ROUND_ROBIN,
      ...config
    };
    
    this.consul = new Consul({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      token: this.config.token
    });
    
    this.registeredServices = new Map();
    this.healthCheckTimers = new Map();
    this.loadBalancerState = new Map();
    this.initialized = false;
  }
  
  /**
   * 初始化服务发现客户端
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    try {
      logger.info('初始化服务发现客户端...');
      
      // 验证连接
      await this._verifyConnection();
      logger.info(`连接服务发现成功: ${this.config.host}:${this.config.port}`);
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('服务发现初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 注册服务
   * @param {Object} serviceConfig - 服务配置
   * @returns {Promise<Object>} 注册结果
   */
  async registerService(serviceConfig) {
    try {
      const service = {
        name: serviceConfig.name || this.config.serviceName,
        id: serviceConfig.id || `${serviceConfig.name || this.config.serviceName}-${Date.now()}`,
        address: serviceConfig.address || '127.0.0.1',
        port: serviceConfig.port || 3000,
        tags: serviceConfig.tags || [],
        meta: serviceConfig.meta || {},
        check: serviceConfig.check || null
      };
      
      logger.info(`注册服务: ${service.name} (${service.id})`);
      
      // 注册服务
      await this.consul.agent.service.register(service);
      
      // 保存注册信息
      this.registeredServices.set(service.id, service);
      
      // 如果配置了健康检查，启动本地健康检查
      if (service.check && service.check.Script) {
        this._startLocalHealthCheck(service);
      }
      
      logger.info(`服务注册成功: ${service.name} (${service.id})`);
      return { success: true, service: service };
    } catch (error) {
      logger.error('服务注册失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 注销服务
   * @param {string} serviceId - 服务ID
   * @returns {Promise<boolean>} 注销是否成功
   */
  async deregisterService(serviceId) {
    try {
      logger.info(`注销服务: ${serviceId}`);
      
      // 注销服务
      await this.consul.agent.service.deregister(serviceId);
      
      // 清理定时器
      if (this.healthCheckTimers.has(serviceId)) {
        clearInterval(this.healthCheckTimers.get(serviceId));
        this.healthCheckTimers.delete(serviceId);
      }
      
      // 清理注册信息
      this.registeredServices.delete(serviceId);
      
      logger.info(`服务注销成功: ${serviceId}`);
      return true;
    } catch (error) {
      logger.error(`服务注销失败 ${serviceId}:`, error);
      return false;
    }
  }
  
  /**
   * 发现服务
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 发现选项
   * @returns {Promise<Array>} 服务实例列表
   */
  async discoverService(serviceName, options = {}) {
    try {
      // 获取服务实例
      const { passingOnly = true } = options;
      const result = await this.consul.health.service({
        service: serviceName,
        passing: passingOnly
      });
      
      // 格式化服务实例信息
      const instances = result.map(item => ({
        id: item.Service.ID,
        name: item.Service.Service,
        address: item.Service.Address,
        port: item.Service.Port,
        tags: item.Service.Tags,
        meta: item.Service.Meta,
        checks: item.Checks
      }));
      
      logger.debug(`发现服务实例 ${serviceName}: ${instances.length} 个`);
      return instances;
    } catch (error) {
      logger.error(`服务发现失败 ${serviceName}:`, error);
      return [];
    }
  }
  
  /**
   * 选择服务实例（负载均衡）
   * @param {Array} instances - 服务实例列表
   * @param {string} serviceName - 服务名称
   * @param {string} strategy - 负载均衡策略
   * @returns {Object|null} 选中的服务实例
   */
  selectServiceInstance(instances, serviceName, strategy = null) {
    if (!instances || instances.length === 0) {
      return null;
    }
    
    const loadStrategy = strategy || this.config.loadBalancerStrategy;
    
    logger.debug(`使用负载均衡策略 ${loadStrategy} 选择 ${serviceName} 实例`);
    
    switch (loadStrategy) {
      case LoadBalancerStrategy.ROUND_ROBIN:
        return this._selectRoundRobin(instances, serviceName);
      
      case LoadBalancerStrategy.RANDOM:
        return this._selectRandom(instances);
      
      case LoadBalancerStrategy.LEAST_CONNECTIONS:
        return this._selectLeastConnections(instances);
      
      case LoadBalancerStrategy.CONSISTENT_HASH:
        // 需要传入请求参数或标识符用于一致性哈希
        return this._selectConsistentHash(instances, serviceName, options && options.hashKey);
      
      default:
        logger.warn(`未知的负载均衡策略: ${loadStrategy}，使用默认的轮询策略`);
        return this._selectRoundRobin(instances, serviceName);
    }
  }
  
  /**
   * 更新服务健康检查
   * @param {string} serviceId - 服务ID
   * @param {boolean} passing - 是否通过
   * @param {string} output - 健康检查输出
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateHealthCheck(serviceId, passing, output = '') {
    try {
      await this.consul.agent.check.update({
        id: serviceId,
        status: passing ? 'passing' : 'critical',
        output: output
      });
      
      logger.debug(`健康检查更新成功: ${serviceId} - ${passing ? 'passing' : 'critical'}`);
      return true;
    } catch (error) {
      logger.error(`健康检查更新失败 ${serviceId}:`, error);
      return false;
    }
  }
  
  /**
   * 获取所有已注册的服务
   * @returns {Array} 已注册的服务列表
   */
  async getRegisteredServices() {
    try {
      const services = await this.consul.agent.services();
      return Object.values(services);
    } catch (error) {
      logger.error('获取已注册服务失败:', error);
      return [];
    }
  }
  
  /**
   * 获取服务健康状态
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Object>} 服务健康状态
   */
  async getServiceHealth(serviceName) {
    try {
      const health = await this.consul.health.service({
        service: serviceName,
        passing: false
      });
      
      return health.map(item => ({
        service: item.Service,
        healthStatus: item.Checks.every(check => check.Status === 'passing') ? 'passing' : 'critical',
        checks: item.Checks
      }));
    } catch (error) {
      logger.error(`获取服务健康状态失败 ${serviceName}:`, error);
      return [];
    }
  }
  
  /**
   * 验证与服务发现的连接
   * @private
   * @returns {Promise<void>}
   */
  async _verifyConnection() {
    try {
      await this.consul.status.leader();
    } catch (error) {
      throw new Error(`无法连接到服务发现: ${error.message}`);
    }
  }
  
  /**
   * 轮询选择服务实例
   * @private
   * @param {Array} instances - 服务实例列表
   * @param {string} serviceName - 服务名称
   * @returns {Object} 选中的服务实例
   */
  _selectRoundRobin(instances, serviceName) {
    if (!this.loadBalancerState.has(serviceName)) {
      this.loadBalancerState.set(serviceName, 0);
    }
    
    const currentIndex = this.loadBalancerState.get(serviceName);
    const nextIndex = (currentIndex + 1) % instances.length;
    
    // 更新状态
    this.loadBalancerState.set(serviceName, nextIndex);
    
    logger.debug(`轮询选择实例索引: ${currentIndex} -> ${nextIndex} 服务: ${serviceName}`);
    
    return instances[currentIndex];
  }
  
  /**
   * 随机选择服务实例
   * @private
   * @param {Array} instances - 服务实例列表
   * @returns {Object} 选中的服务实例
   */
  _selectRandom(instances) {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }
  
  /**
   * 最少连接数选择服务实例
   * @private
   * @param {Array} instances - 服务实例列表
   * @returns {Object} 选中的服务实例
   */
  _selectLeastConnections(instances) {
    // 这里使用简单实现，实际应该统计真实连接数
    // 可以通过监控指标或记录到state中
    
    // 简单起见，我们假设实例的meta中包含connections字段
    // 如果没有，按随机选择
    
    let minConnections = Infinity;
    let selectedInstances = [];
    
    instances.forEach(instance => {
      const connections = parseInt(instance.meta?.connections || '0', 10);
      if (connections < minConnections) {
        minConnections = connections;
        selectedInstances = [instance];
      } else if (connections === minConnections) {
        selectedInstances.push(instance);
      }
    });
    
    // 如果有多个实例具有相同的最小连接数，随机选择一个
    return this._selectRandom(selectedInstances);
  }
  
  /**
   * 一致性哈希选择服务实例
   * @private
   * @param {Array} instances - 服务实例列表
   * @param {string} serviceName - 服务名称
   * @param {string} hashKey - 哈希键
   * @returns {Object} 选中的服务实例
   */
  _selectConsistentHash(instances, serviceName, hashKey) {
    // 简单实现一致性哈希
    // 在生产环境中可以使用更完善的实现，如引入虚拟节点
    
    // 如果没有提供hashKey，默认使用随机
    if (!hashKey) {
      return this._selectRandom(instances);
    }
    
    // 生成简单哈希值
    const hash = this._simpleHash(hashKey);
    
    // 计算每个实例的哈希位置并排序
    const sortedInstances = [...instances].sort((a, b) => {
      const hashA = this._simpleHash(a.id);
      const hashB = this._simpleHash(b.id);
      return hashA - hashB;
    });
    
    // 找到哈希环上第一个大于等于请求哈希的实例
    for (const instance of sortedInstances) {
      const instanceHash = this._simpleHash(instance.id);
      if (instanceHash >= hash) {
        return instance;
      }
    }
    
    // 如果找不到，返回第一个实例
    return sortedInstances[0];
  }
  
  /**
   * 简单哈希函数
   * @private
   * @param {string} str - 输入字符串
   * @returns {number} 哈希值
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * 启动本地健康检查
   * @private
   * @param {Object} service - 服务配置
   */
  _startLocalHealthCheck(service) {
    // 这里实现本地健康检查逻辑
    // 注意：在实际环境中，应该使用更安全的方式执行命令或API调用
    
    const checkInterval = service.check.Interval || '10s';
    const intervalMs = this._parseTimeInterval(checkInterval);
    
    // 启动定时健康检查
    const timer = setInterval(async () => {
      try {
        // 这里应该实现实际的健康检查逻辑
        // 例如执行脚本、调用API等
        // 此处为示例实现
        
        // 模拟健康检查，随机返回通过或失败
        const passing = Math.random() > 0.1; // 90%的概率通过
        const output = passing ? '服务运行正常' : '服务异常';
        
        await this.updateHealthCheck(service.id, passing, output);
      } catch (error) {
        logger.error(`本地健康检查执行失败 ${service.id}:`, error);
        
        // 出错时将健康状态设置为失败
        try {
          await this.updateHealthCheck(service.id, false, error.message);
        } catch (e) {
          logger.error(`健康状态更新失败 ${service.id}:`, e);
        }
      }
    }, intervalMs);
    
    // 保存定时器引用
    this.healthCheckTimers.set(service.id, timer);
    logger.info(`本地健康检查已启动: ${service.id} (间隔: ${checkInterval})`);
  }
  
  /**
   * 解析时间间隔字符串
   * @private
   * @param {string} interval - 时间间隔字符串，如 '10s', '1m'
   * @returns {number} 毫秒数
   */
  _parseTimeInterval(interval) {
    const match = interval.match(/^(\d+)([smh])$/);
    if (!match) {
      logger.warn(`无效的时间间隔格式: ${interval}，使用默认值 10000ms`);
      return 10000; // 默认10秒
    }
    
    const [, value, unit] = match;
    const num = parseInt(value, 10);
    
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      default: return 10000;
    }
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 注销所有注册的服务
    this.registeredServices.forEach((service, id) => {
      this.deregisterService(id).catch(err => {
        logger.error(`资源清理时注销服务失败 ${id}:`, err);
      });
    });
    
    // 清理定时器
    this.healthCheckTimers.forEach((timer, id) => {
      clearInterval(timer);
    });
    
    // 清空状态
    this.registeredServices.clear();
    this.healthCheckTimers.clear();
    this.loadBalancerState.clear();
    this.initialized = false;
    
    logger.info('服务发现客户端资源已清理');
  }
}

// 创建单例实例
let serviceDiscoveryInstance = null;

/**
 * 获取服务发现客户端实例
 * @param {Object} config - 配置选项
 * @returns {ServiceDiscoveryClient} 服务发现客户端实例
 */
function getServiceDiscovery(config = {}) {
  if (!serviceDiscoveryInstance) {
    serviceDiscoveryInstance = new ServiceDiscoveryClient(config);
  }
  return serviceDiscoveryInstance;
}

/**
 * 服务发现工具类
 * 提供便捷的服务发现方法
 */
class ServiceDiscoveryUtils {
  /**
   * 构建服务URL
   * @param {Object} instance - 服务实例
   * @param {string} path - 路径
   * @returns {string} 完整的服务URL
   */
  static buildServiceUrl(instance, path = '') {
    const protocol = instance.meta && instance.meta.secure ? 'https' : 'http';
    const host = instance.address || '127.0.0.1';
    const port = instance.port || 80;
    
    // 处理路径格式
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${protocol}://${host}:${port}${normalizedPath}`;
  }
  
  /**
   * 等待服务可用
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 服务是否可用
   */
  static async waitForService(serviceName, options = {}) {
    const { timeout = 30000, interval = 1000 } = options;
    const discovery = getServiceDiscovery();
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const instances = await discovery.discoverService(serviceName, { passingOnly: true });
      
      if (instances.length > 0) {
        logger.info(`服务 ${serviceName} 可用，发现 ${instances.length} 个实例`);
        return true;
      }
      
      logger.debug(`等待服务 ${serviceName} 可用...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    logger.error(`等待服务 ${serviceName} 超时`);
    return false;
  }
}

module.exports = {
  ServiceDiscoveryClient,
  getServiceDiscovery,
  ServiceDiscoveryUtils,
  LoadBalancerStrategy,
  VERSION: '1.0.0'
};
