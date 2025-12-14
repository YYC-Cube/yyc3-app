/**
 * @file 服务网格管理器
 * @description 服务网格核心管理组件，负责协调服务注册、发现、配置和监控
 * @module service-mesh/service-mesh-manager
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const { logger } = require('../logger');
const { getServiceDiscovery } = require('../service-discovery');
const { getConfigCenter } = require('../config-center');
const { EnvoyConfigGenerator } = require('./envoy-config-generator');
const { AppError } = require('../error');

/**
 * 服务状态枚举
 */
const ServiceStatus = {
  PENDING: 'pending',
  REGISTERED: 'registered',
  RUNNING: 'running',
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  DEGRADED: 'degraded',
  DEREGISTERED: 'deregistered'
};

/**
 * 服务网格事件类型
 */
const MeshEventTypes = {
  SERVICE_REGISTERED: 'service_registered',
  SERVICE_DEREGISTERED: 'service_deregistered',
  SERVICE_HEALTH_CHANGED: 'service_health_changed',
  CONFIG_UPDATED: 'config_updated',
  MESH_STATUS_CHANGED: 'mesh_status_changed'
};

/**
 * 服务网格管理器类
 */
class ServiceMeshManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      serviceDiscoveryConfig: options.serviceDiscoveryConfig || {},
      configCenterConfig: options.configCenterConfig || {},
      envoyConfigConfig: options.envoyConfigConfig || {},
      healthCheckInterval: options.healthCheckInterval || 30000, // 30秒
      metricsCollectionInterval: options.metricsCollectionInterval || 60000 // 60秒
    };
    
    // 初始化组件
    this.serviceDiscovery = null;
    this.configCenter = null;
    this.envoyConfigGenerator = null;
    
    // 状态管理
    this.services = new Map();
    this.metrics = {
      totalServices: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      totalEndpoints: 0,
      requests: 0,
      errors: 0,
      latency: { avg: 0, min: 0, max: 0 }
    };
    
    // 事件系统
    this.eventListeners = new Map();
    
    // 定时任务
    this.healthCheckInterval = null;
    this.metricsInterval = null;
  }
  
  /**
   * 初始化服务网格
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('初始化服务网格管理器...');
    
    try {
      // 初始化服务发现
      this.serviceDiscovery = getServiceDiscovery(this.options.serviceDiscoveryConfig);
      await this.serviceDiscovery.initialize();
      logger.info('服务发现组件初始化完成');
      
      // 初始化配置中心
      this.configCenter = getConfigCenter(this.options.configCenterConfig);
      await this.configCenter.initialize();
      logger.info('配置中心组件初始化完成');
      
      // 初始化Envoy配置生成器
      this.envoyConfigGenerator = new EnvoyConfigGenerator({
        ...this.options.envoyConfigConfig,
        serviceDiscoveryConfig: this.options.serviceDiscoveryConfig
      });
      await this.envoyConfigGenerator.initialize();
      logger.info('Envoy配置生成器初始化完成');
      
      // 注册配置变更监听
      this._registerConfigListeners();
      
      // 注册服务变更监听
      this._registerServiceListeners();
      
      // 启动监控和健康检查
      this._startMonitoring();
      
      // 加载现有服务
      await this._loadExistingServices();
      
      logger.info('服务网格管理器初始化完成');
      
      // 触发网格状态变更事件
      this._emitEvent(MeshEventTypes.MESH_STATUS_CHANGED, {
        status: 'running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('初始化服务网格失败:', error);
      throw new AppError(500, `服务网格初始化失败: ${error.message}`);
    }
  }
  
  /**
   * 注册服务
   * @param {Object} serviceInfo - 服务信息
   * @returns {Promise<Object>} 注册结果
   */
  async registerService(serviceInfo) {
    logger.info(`注册服务: ${serviceInfo.name}`);
    
    if (!serviceInfo || !serviceInfo.name) {
      throw new AppError(400, '服务名称不能为空');
    }
    
    try {
      // 验证服务信息
      this._validateServiceInfo(serviceInfo);
      
      // 注册到服务发现
      const registration = await this.serviceDiscovery.registerService(serviceInfo);
      
      // 更新本地服务状态
      const service = {
        ...serviceInfo,
        status: ServiceStatus.REGISTERED,
        registrationTime: new Date().toISOString(),
        lastHealthCheck: null,
        endpoints: []
      };
      
      this.services.set(serviceInfo.name, service);
      
      // 生成Envoy配置
      await this.envoyConfigGenerator.generateConfig(serviceInfo.name, {
        httpPort: serviceInfo.httpPort,
        healthCheckPath: serviceInfo.healthCheckPath || '/health'
      });
      
      // 更新指标
      this._updateMetrics();
      
      // 触发事件
      this._emitEvent(MeshEventTypes.SERVICE_REGISTERED, service);
      
      logger.info(`服务 ${serviceInfo.name} 注册成功`);
      
      return {
        success: true,
        serviceId: registration.id,
        service: service
      };
    } catch (error) {
      logger.error(`注册服务 ${serviceInfo.name} 失败:`, error);
      throw new AppError(500, `服务注册失败: ${error.message}`);
    }
  }
  
  /**
   * 注销服务
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Object>} 注销结果
   */
  async deregisterService(serviceName) {
    logger.info(`注销服务: ${serviceName}`);
    
    if (!serviceName) {
      throw new AppError(400, '服务名称不能为空');
    }
    
    try {
      // 从服务发现注销
      await this.serviceDiscovery.deregisterService(serviceName);
      
      // 更新本地状态
      const service = this.services.get(serviceName);
      if (service) {
        service.status = ServiceStatus.DEREGISTERED;
        service.deregistrationTime = new Date().toISOString();
      }
      
      // 更新指标
      this._updateMetrics();
      
      // 触发事件
      this._emitEvent(MeshEventTypes.SERVICE_DEREGISTERED, { name: serviceName });
      
      logger.info(`服务 ${serviceName} 注销成功`);
      
      return { success: true };
    } catch (error) {
      logger.error(`注销服务 ${serviceName} 失败:`, error);
      throw new AppError(500, `服务注销失败: ${error.message}`);
    }
  }
  
  /**
   * 获取服务详情
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Object|null>} 服务信息
   */
  async getService(serviceName) {
    if (!serviceName) {
      throw new AppError(400, '服务名称不能为空');
    }
    
    const service = this.services.get(serviceName);
    if (!service) {
      return null;
    }
    
    // 获取最新的服务实例
    const instances = await this.serviceDiscovery.discoverService(serviceName);
    return {
      ...service,
      endpoints: instances || []
    };
  }
  
  /**
   * 列出所有服务
   * @returns {Promise<Array>} 服务列表
   */
  async listServices() {
    const serviceNames = await this.serviceDiscovery.listServices();
    const services = [];
    
    for (const name of serviceNames) {
      const service = await this.getService(name);
      if (service) {
        services.push(service);
      }
    }
    
    return services;
  }
  
  /**
   * 手动触发服务健康检查
   * @param {string} serviceName - 服务名称（可选，不提供则检查所有服务）
   * @returns {Promise<Object>} 健康检查结果
   */
  async checkServiceHealth(serviceName) {
    logger.info(`执行服务健康检查: ${serviceName || '所有服务'}`);
    
    try {
      const results = {};
      
      if (serviceName) {
        // 检查单个服务
        const health = await this._checkSingleServiceHealth(serviceName);
        results[serviceName] = health;
      } else {
        // 检查所有服务
        const serviceNames = await this.serviceDiscovery.listServices();
        
        for (const name of serviceNames) {
          try {
            results[name] = await this._checkSingleServiceHealth(name);
          } catch (error) {
            logger.error(`检查服务 ${name} 健康状态失败:`, error);
            results[name] = { healthy: false, error: error.message };
          }
        }
      }
      
      // 更新指标
      this._updateMetrics();
      
      return results;
    } catch (error) {
      logger.error('执行服务健康检查失败:', error);
      throw new AppError(500, `健康检查失败: ${error.message}`);
    }
  }
  
  /**
   * 获取网格指标
   * @returns {Object} 网格指标
   */
  getMeshMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * 获取网格状态
   * @returns {Object} 网格状态
   */
  getMeshStatus() {
    return {
      status: 'running',
      timestamp: new Date().toISOString(),
      components: {
        serviceDiscovery: this.serviceDiscovery ? 'running' : 'stopped',
        configCenter: this.configCenter ? 'running' : 'stopped',
        envoyConfig: this.envoyConfigGenerator ? 'running' : 'stopped'
      },
      metrics: this.getMeshMetrics()
    };
  }
  
  /**
   * 添加事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   * @returns {Function} 用于移除监听器的函数
   */
  on(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType);
    listeners.push(listener);
    
    // 返回移除监听器的函数
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 停止服务网格
   */
  async shutdown() {
    logger.info('停止服务网格管理器...');
    
    try {
      // 停止定时任务
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      
      // 停止Envoy配置生成器
      if (this.envoyConfigGenerator) {
        this.envoyConfigGenerator.stop();
      }
      
      // 清空监听器
      this.eventListeners.clear();
      
      logger.info('服务网格管理器已停止');
    } catch (error) {
      logger.error('停止服务网格管理器失败:', error);
    }
  }
  
  /**
   * 验证服务信息
   * @private
   * @param {Object} serviceInfo - 服务信息
   */
  _validateServiceInfo(serviceInfo) {
    const requiredFields = ['name', 'version'];
    
    for (const field of requiredFields) {
      if (!serviceInfo[field]) {
        throw new AppError(400, `服务信息缺少必要字段: ${field}`);
      }
    }
    
    // 验证端口信息
    if (!serviceInfo.httpPort && !serviceInfo.tcpPort) {
      throw new AppError(400, '服务信息必须包含httpPort或tcpPort');
    }
  }
  
  /**
   * 加载现有服务
   * @private
   */
  async _loadExistingServices() {
    logger.info('加载现有服务...');
    
    try {
      const serviceNames = await this.serviceDiscovery.listServices();
      
      for (const name of serviceNames) {
        try {
          const serviceInfo = await this.serviceDiscovery.getServiceInfo(name);
          if (serviceInfo) {
            this.services.set(name, {
              ...serviceInfo,
              status: ServiceStatus.PENDING,
              registrationTime: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error(`加载服务 ${name} 信息失败:`, error);
        }
      }
      
      // 执行初始健康检查
      await this.checkServiceHealth();
      
      logger.info(`已加载 ${this.services.size} 个服务`);
    } catch (error) {
      logger.error('加载现有服务失败:', error);
    }
  }
  
  /**
   * 检查单个服务健康状态
   * @private
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Object>} 健康检查结果
   */
  async _checkSingleServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new AppError(404, `服务 ${serviceName} 不存在`);
    }
    
    try {
      // 从服务发现获取健康状态
      const instances = await this.serviceDiscovery.discoverService(serviceName, { passingOnly: true });
      const allInstances = await this.serviceDiscovery.discoverService(serviceName);
      
      // 计算健康状态
      const healthyCount = instances ? instances.length : 0;
      const totalCount = allInstances ? allInstances.length : 0;
      const healthy = healthyCount > 0;
      
      // 更新服务状态
      let newStatus = ServiceStatus.UNHEALTHY;
      if (healthy) {
        if (healthyCount === totalCount) {
          newStatus = ServiceStatus.HEALTHY;
        } else {
          newStatus = ServiceStatus.DEGRADED;
        }
      }
      
      // 如果状态发生变化，触发事件
      if (service.status !== newStatus) {
        const oldStatus = service.status;
        service.status = newStatus;
        
        this._emitEvent(MeshEventTypes.SERVICE_HEALTH_CHANGED, {
          serviceName,
          oldStatus,
          newStatus,
          healthyCount,
          totalCount,
          timestamp: new Date().toISOString()
        });
      }
      
      // 更新服务信息
      service.lastHealthCheck = new Date().toISOString();
      service.endpoints = allInstances || [];
      
      return {
        healthy,
        status: newStatus,
        healthyCount,
        totalCount,
        instances: allInstances || []
      };
    } catch (error) {
      logger.error(`检查服务 ${serviceName} 健康状态失败:`, error);
      
      // 更新为不健康状态
      service.status = ServiceStatus.UNHEALTHY;
      service.lastHealthCheck = new Date().toISOString();
      
      return {
        healthy: false,
        status: ServiceStatus.UNHEALTHY,
        error: error.message
      };
    }
  }
  
  /**
   * 注册配置变更监听
   * @private
   */
  _registerConfigListeners() {
    if (this.configCenter) {
      this.configCenter.on('config_changed', (namespace, config) => {
        logger.info(`配置中心更新 - 命名空间: ${namespace}`);
        
        // 触发配置更新事件
        this._emitEvent(MeshEventTypes.CONFIG_UPDATED, {
          namespace,
          config,
          timestamp: new Date().toISOString()
        });
      });
    }
  }
  
  /**
   * 注册服务变更监听
   * @private
   */
  _registerServiceListeners() {
    if (this.serviceDiscovery) {
      // 监听服务注册
      this.serviceDiscovery.on('service_registered', async (serviceInfo) => {
        logger.info(`服务注册事件: ${serviceInfo.name}`);
        
        // 生成Envoy配置
        await this.envoyConfigGenerator.generateConfig(serviceInfo.name, {
          httpPort: serviceInfo.httpPort,
          healthCheckPath: serviceInfo.healthCheckPath || '/health'
        });
      });
      
      // 监听服务注销
      this.serviceDiscovery.on('service_deregistered', (serviceName) => {
        logger.info(`服务注销事件: ${serviceName}`);
      });
    }
  }
  
  /**
   * 启动监控和健康检查
   * @private
   */
  _startMonitoring() {
    // 启动定期健康检查
    if (this.options.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(() => {
        this.checkServiceHealth().catch(error => {
          logger.error('定期健康检查失败:', error);
        });
      }, this.options.healthCheckInterval);
      
      logger.info(`定期健康检查已启动，间隔: ${this.options.healthCheckInterval}ms`);
    }
    
    // 启动指标收集
    if (this.options.metricsCollectionInterval > 0) {
      this.metricsInterval = setInterval(() => {
        this._updateMetrics();
      }, this.options.metricsCollectionInterval);
      
      logger.info(`指标收集已启动，间隔: ${this.options.metricsCollectionInterval}ms`);
    }
  }
  
  /**
   * 更新网格指标
   * @private
   */
  _updateMetrics() {
    let healthyServices = 0;
    let unhealthyServices = 0;
    let totalEndpoints = 0;
    
    this.services.forEach(service => {
      if (service.status === ServiceStatus.HEALTHY || service.status === ServiceStatus.DEGRADED) {
        healthyServices++;
      } else if (service.status === ServiceStatus.UNHEALTHY) {
        unhealthyServices++;
      }
      
      if (service.endpoints && service.endpoints.length) {
        totalEndpoints += service.endpoints.length;
      }
    });
    
    this.metrics = {
      ...this.metrics,
      totalServices: this.services.size,
      healthyServices,
      unhealthyServices,
      totalEndpoints,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * 触发事件
   * @private
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  _emitEvent(eventType, data) {
    const listeners = this.eventListeners.get(eventType) || [];
    
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error(`事件监听器执行失败 (${eventType}):`, error);
      }
    });
  }
}

/**
 * 创建服务网格管理器实例
 * @param {Object} options - 配置选项
 * @returns {ServiceMeshManager} 服务网格管理器实例
 */
function createServiceMeshManager(options = {}) {
  return new ServiceMeshManager(options);
}

module.exports = {
  ServiceMeshManager,
  createServiceMeshManager,
  ServiceStatus,
  MeshEventTypes,
  VERSION: '1.0.0'
};
