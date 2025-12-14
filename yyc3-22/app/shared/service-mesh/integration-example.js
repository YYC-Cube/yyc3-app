/**
 * @file 服务网格集成示例
 * @description 演示如何集成服务发现、配置中心和API网关组件
 * @module service-mesh/integration-example
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const { logger } = require('../logger');
const { createServiceMeshManager } = require('./service-mesh-manager');
const { EnhancedApiGateway } = require('../gateway/enhanced-gateway');
const { AppError } = require('../error');

/**
 * 服务网格集成示例类
 */
class ServiceMeshIntegrationExample {
  /**
   * 构造函数
   */
  constructor() {
    this.meshManager = null;
    this.gateway = null;
    this.server = null;
    this.isInitialized = false;
  }
  
  /**
   * 初始化服务网格集成
   * @param {Object} options - 集成选项
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    logger.info('初始化服务网格集成...');
    
    try {
      // 1. 创建并初始化服务网格管理器
      this.meshManager = createServiceMeshManager({
        serviceDiscoveryConfig: options.serviceDiscoveryConfig || {
          host: process.env.CONSUL_HOST || '127.0.0.1',
          port: process.env.CONSUL_PORT || 8500,
          token: process.env.CONSUL_TOKEN || null,
          timeout: 5000
        },
        configCenterConfig: options.configCenterConfig || {
          provider: 'consul',
          host: process.env.CONSUL_HOST || '127.0.0.1',
          port: process.env.CONSUL_PORT || 8500,
          defaultNamespace: 'default',
          cacheEnabled: true,
          cacheTTL: 60000 // 1分钟
        },
        envoyConfigConfig: options.envoyConfigConfig || {
          configOutputDir: process.env.ENVOY_CONFIG_DIR || '/tmp/envoy-configs',
          refreshInterval: 30000 // 30秒
        },
        healthCheckInterval: options.healthCheckInterval || 30000 // 30秒
      });
      
      // 初始化服务网格管理器
      await this.meshManager.initialize();
      
      // 2. 创建并配置增强型API网关
      this.gateway = new EnhancedApiGateway();
      
      // 初始化网关
      const gatewayApp = this.gateway.initialize({
        serviceDiscoveryConfig: options.serviceDiscoveryConfig || {
          host: process.env.CONSUL_HOST || '127.0.0.1',
          port: process.env.CONSUL_PORT || 8500
        },
        loadBalancerStrategy: 'ROUND_ROBIN'
      });
      
      // 3. 配置API网关路由和中间件
      this._configureGatewayRoutes();
      
      // 4. 注册服务网格事件监听
      this._registerMeshEventListeners();
      
      // 5. 启动网关服务器
      const port = options.gatewayPort || process.env.GATEWAY_PORT || 8080;
      this.server = this.gateway.listen(port, () => {
        logger.info(`增强型API网关已启动，监听端口: ${port}`);
        logger.info(`健康检查端点: http://localhost:${port}/health`);
      });
      
      // 6. 注册示例服务
      if (options.registerExampleServices !== false) {
        await this._registerExampleServices();
      }
      
      this.isInitialized = true;
      logger.info('服务网格集成初始化完成');
    } catch (error) {
      logger.error('服务网格集成初始化失败:', error);
      throw new AppError(500, `服务网格集成初始化失败: ${error.message}`);
    }
  }
  
  /**
   * 配置API网关路由
   * @private
   */
  _configureGatewayRoutes() {
    // 注册服务路由示例
    this.gateway
      // 用户服务路由
      .registerServiceRoute('/api/users', 'user-service', {
        method: 'GET',
        rateLimitOptions: {
          maxRequests: 100,
          timeWindow: 60000, // 1分钟
          identifier: 'ip'
        },
        circuitBreakerOptions: {
          failureThreshold: 5,
          resetTimeout: 30000, // 30秒
          successThreshold: 2
        }
      })
      // 订单服务路由
      .registerServiceRoute('/api/orders', 'order-service', {
        method: 'GET',
        rateLimitOptions: {
          maxRequests: 50,
          timeWindow: 60000,
          identifier: 'ip'
        }
      })
      // 支付服务路由
      .registerServiceRoute('/api/payments', 'payment-service', {
        method: 'POST',
        circuitBreakerOptions: {
          failureThreshold: 3,
          resetTimeout: 60000, // 1分钟
          successThreshold: 1
        }
      })
      // 产品服务路由 - 支持所有HTTP方法
      .registerServiceRoute('/api/products', 'product-service', {
        method: 'ALL'
      });
      
    // 注册静态路由示例
    this.gateway
      .registerStaticRoute('/static', 'http://static-assets.example.com')
      .registerStaticRoute('/docs', 'http://documentation.example.com');
      
    // 注册API网关管理端点
    this.gateway.app.get('/admin/gateway/stats', (req, res) => {
      const circuitBreakerStates = this.gateway.getCircuitBreakerStates();
      const meshMetrics = this.meshManager ? this.meshManager.getMeshMetrics() : {};
      
      res.json({
        circuitBreakers: circuitBreakerStates,
        meshMetrics,
        timestamp: new Date().toISOString()
      });
    });
    
    // 注册服务发现端点
    this.gateway.app.get('/admin/services', async (req, res) => {
      try {
        const services = await this.meshManager.listServices();
        res.json(services);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  
  /**
   * 注册服务网格事件监听
   * @private
   */
  _registerMeshEventListeners() {
    if (!this.meshManager) return;
    
    // 监听服务注册事件
    this.meshManager.on('service_registered', (service) => {
      logger.info(`服务注册事件: ${service.name} 版本 ${service.version}`);
      // 可以在这里执行服务注册后的逻辑，如发送通知等
    });
    
    // 监听服务健康状态变化事件
    this.meshManager.on('service_health_changed', (data) => {
      logger.info(`服务健康状态变化: ${data.serviceName} 从 ${data.oldStatus} 变为 ${data.newStatus}`);
      
      // 发送告警（如果服务变为不健康状态）
      if (data.newStatus === 'unhealthy') {
        logger.warn(`⚠️  服务 ${data.serviceName} 不健康！请检查`);
        // 这里可以添加告警发送逻辑
      }
    });
    
    // 监听配置更新事件
    this.meshManager.on('config_updated', (data) => {
      logger.info(`配置更新事件: 命名空间 ${data.namespace}`);
      // 可以在这里执行配置更新后的逻辑
    });
  }
  
  /**
   * 注册示例服务
   * @private
   * @returns {Promise<void>}
   */
  async _registerExampleServices() {
    if (!this.meshManager) return;
    
    const exampleServices = [
      {
        name: 'user-service',
        version: '1.0.0',
        description: '用户服务',
        httpPort: 8001,
        tags: ['users', 'authentication', 'v1'],
        healthCheckPath: '/health',
        dependencies: ['database']
      },
      {
        name: 'order-service',
        version: '1.0.0',
        description: '订单服务',
        httpPort: 8002,
        tags: ['orders', 'transactions', 'v1'],
        healthCheckPath: '/health',
        dependencies: ['user-service', 'payment-service']
      },
      {
        name: 'product-service',
        version: '1.0.0',
        description: '产品服务',
        httpPort: 8003,
        tags: ['products', 'catalog', 'v1'],
        healthCheckPath: '/health'
      },
      {
        name: 'payment-service',
        version: '1.0.0',
        description: '支付服务',
        httpPort: 8004,
        tags: ['payments', 'transactions', 'v1'],
        healthCheckPath: '/health',
        dependencies: ['order-service']
      }
    ];
    
    logger.info('注册示例服务...');
    
    for (const service of exampleServices) {
      try {
        await this.meshManager.registerService(service);
        logger.info(`示例服务注册成功: ${service.name}`);
      } catch (error) {
        logger.error(`注册示例服务 ${service.name} 失败:`, error);
      }
    }
  }
  
  /**
   * 关闭服务网格集成
   */
  async shutdown() {
    logger.info('关闭服务网格集成...');
    
    try {
      // 关闭网关服务器
      if (this.server) {
        this.server.close(() => {
          logger.info('API网关服务器已关闭');
        });
      }
      
      // 关闭服务网格管理器
      if (this.meshManager) {
        await this.meshManager.shutdown();
      }
      
      this.isInitialized = false;
      logger.info('服务网格集成已关闭');
    } catch (error) {
      logger.error('关闭服务网格集成失败:', error);
    }
  }
}

/**
 * 服务网格集成示例启动函数
 * @param {Object} options - 启动选项
 * @returns {Promise<ServiceMeshIntegrationExample>} 集成示例实例
 */
async function startServiceMesh(options = {}) {
  const integration = new ServiceMeshIntegrationExample();
  await integration.initialize(options);
  return integration;
}

/**
 * 主函数 - 直接运行示例
 */
async function main() {
  try {
    // 设置日志级别
    logger.level = process.env.LOG_LEVEL || 'info';
    
    // 启动服务网格集成
    const integration = await startServiceMesh({
      // 可以在这里提供自定义配置
      gatewayPort: 8080
    });
    
    // 优雅退出处理
    process.on('SIGINT', async () => {
      logger.info('收到停止信号，正在关闭...');
      await integration.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('收到终止信号，正在关闭...');
      await integration.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('启动服务网格失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动集成示例
if (require.main === module) {
  main();
}

module.exports = {
  ServiceMeshIntegrationExample,
  startServiceMesh,
  VERSION: '1.0.0'
};
