/**
 * @file Envoy代理配置生成器
 * @description 为服务网格自动生成和管理Envoy代理配置
 * @module service-mesh/envoy-config-generator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logger');
const { getServiceDiscovery } = require('../service-discovery');
const { AppError } = require('../error');

/**
 * Envoy配置生成器类
 */
class EnvoyConfigGenerator {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      configOutputDir: options.configOutputDir || '/tmp/envoy-configs',
      templateDir: options.templateDir || path.join(__dirname, 'templates'),
      refreshInterval: options.refreshInterval || 30000, // 30秒
      serviceDiscoveryConfig: options.serviceDiscoveryConfig || {},
      defaults: {
        admin: {
          accessLogPath: options.defaults?.admin?.accessLogPath || '/dev/null',
          address: {
            socketAddress: {
              address: options.defaults?.admin?.address || '127.0.0.1',
              portValue: options.defaults?.admin?.port || 9901
            }
          }
        },
        statsFlushInterval: options.defaults?.statsFlushInterval || 10, // 10秒
        tracing: options.defaults?.tracing || null
      }
    };
    
    this.serviceDiscovery = null;
    this.configCache = new Map();
    this.templates = new Map();
    this.watchers = [];
    this.refreshInterval = null;
  }
  
  /**
   * 初始化配置生成器
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('初始化Envoy配置生成器...');
    
    // 初始化服务发现
    if (this.options.serviceDiscoveryConfig) {
      this.serviceDiscovery = getServiceDiscovery(this.options.serviceDiscoveryConfig);
    } else {
      throw new AppError(500, '服务发现配置缺失');
    }
    
    // 确保输出目录存在
    await this._ensureDir(this.options.configOutputDir);
    
    // 加载模板
    await this._loadTemplates();
    
    // 生成初始配置
    await this.refreshAllConfigs();
    
    // 启动定期刷新
    this._startAutoRefresh();
    
    logger.info('Envoy配置生成器初始化完成');
  }
  
  /**
   * 生成单个服务的Envoy配置
   * @param {string} serviceName - 服务名称
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 生成的配置JSON
   */
  async generateConfig(serviceName, options = {}) {
    logger.info(`生成服务配置: ${serviceName}`);
    
    // 验证服务存在
    if (!serviceName) {
      throw new AppError(400, '服务名称不能为空');
    }
    
    try {
      // 获取服务信息
      const serviceInfo = await this.serviceDiscovery.getServiceInfo(serviceName);
      if (!serviceInfo) {
        throw new AppError(404, `服务 ${serviceName} 不存在`);
      }
      
      // 构建配置
      const config = await this._buildConfig(serviceName, serviceInfo, options);
      
      // 缓存配置
      this.configCache.set(serviceName, config);
      
      // 写入文件
      const filePath = path.join(this.options.configOutputDir, `${serviceName}.json`);
      await fs.writeFile(filePath, JSON.stringify(config, null, 2));
      
      logger.info(`服务 ${serviceName} 配置生成完成: ${filePath}`);
      
      // 通知配置变更
      this._notifyConfigChange(serviceName, config);
      
      return filePath;
    } catch (error) {
      logger.error(`生成服务 ${serviceName} 配置失败: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 刷新所有服务配置
   * @returns {Promise<void>}
   */
  async refreshAllConfigs() {
    logger.info('刷新所有服务配置...');
    
    try {
      // 获取所有服务
      const services = await this.serviceDiscovery.listServices();
      
      // 并行生成所有配置
      await Promise.all(
        services.map(serviceName => this.generateConfig(serviceName).catch(error => {
          logger.error(`刷新服务 ${serviceName} 配置失败: ${error.message}`);
        }))
      );
      
      logger.info('所有服务配置刷新完成');
    } catch (error) {
      logger.error(`刷新所有服务配置失败: ${error.message}`, error);
    }
  }
  
  /**
   * 获取服务配置
   * @param {string} serviceName - 服务名称
   * @returns {Object|null} 配置对象或null
   */
  getConfig(serviceName) {
    return this.configCache.get(serviceName) || null;
  }
  
  /**
   * 添加配置变更监听器
   * @param {Function} listener - 监听器函数
   * @returns {Function} 用于移除监听器的函数
   */
  addConfigChangeListener(listener) {
    this.watchers.push(listener);
    
    // 返回移除监听器的函数
    return () => {
      const index = this.watchers.indexOf(listener);
      if (index > -1) {
        this.watchers.splice(index, 1);
      }
    };
  }
  
  /**
   * 停止配置生成器
   */
  stop() {
    logger.info('停止Envoy配置生成器...');
    
    // 停止自动刷新
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    // 清空监听器
    this.watchers = [];
  }
  
  /**
   * 构建Envoy配置
   * @private
   * @param {string} serviceName - 服务名称
   * @param {Object} serviceInfo - 服务信息
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} Envoy配置对象
   */
  async _buildConfig(serviceName, serviceInfo, options) {
    // 基础配置
    const config = {
      static_resources: {
        listeners: [],
        clusters: []
      },
      admin: this.options.defaults.admin,
      dynamic_resources: {
        cds_config: {
          path: path.join(this.options.configOutputDir, `${serviceName}-clusters.json`)
        },
        lds_config: {
          path: path.join(this.options.configOutputDir, `${serviceName}-listeners.json`)
        }
      },
      stats_flush_interval: this.options.defaults.statsFlushInterval
    };
    
    // 添加追踪配置
    if (this.options.defaults.tracing) {
      config.tracing = this.options.defaults.tracing;
    }
    
    // 构建监听器
    const listeners = await this._buildListeners(serviceName, serviceInfo, options);
    config.static_resources.listeners = listeners;
    
    // 构建集群
    const clusters = await this._buildClusters(serviceName, serviceInfo, options);
    config.static_resources.clusters = clusters;
    
    // 保存动态资源配置
    await this._saveDynamicResources(serviceName, listeners, clusters);
    
    return config;
  }
  
  /**
   * 构建监听器
   * @private
   * @param {string} serviceName - 服务名称
   * @param {Object} serviceInfo - 服务信息
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>} 监听器配置数组
   */
  async _buildListeners(serviceName, serviceInfo, options) {
    const listeners = [];
    
    // 构建HTTP监听器
    if (serviceInfo.httpPort || options.httpPort) {
      const httpPort = serviceInfo.httpPort || options.httpPort;
      listeners.push({
        name: `${serviceName}-http-listener`,
        address: {
          socketAddress: {
            address: options.listenAddress || '0.0.0.0',
            portValue: httpPort
          }
        },
        filter_chains: [
          {
            filters: [
              {
                name: 'envoy.filters.network.http_connection_manager',
                typed_config: {
                  '@type': 'type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager',
                  stat_prefix: `${serviceName}-http`,
                  route_config: {
                    name: `${serviceName}-http-route`,
                    virtual_hosts: [
                      {
                        name: `${serviceName}-host`,
                        domains: ['*'],
                        routes: [
                          {
                            match: {
                              prefix: '/'
                            },
                            route: {
                              cluster: `${serviceName}-cluster`,
                              timeout: '15s',
                              retry_policy: {
                                retry_on: 'connect-failure,refused-stream,unavailable,cancelled,retriable-status-codes',
                                num_retries: 3,
                                retry_back_off: {
                                  base_interval: '0.25s',
                                  max_interval: '2s'
                                },
                                retriable_status_codes: [503, 504]
                              }
                            }
                          }
                        ]
                      }
                    ]
                  },
                  http_filters: [
                    {
                      name: 'envoy.filters.http.router',
                      typed_config: {
                        '@type': 'type.googleapis.com/envoy.extensions.filters.http.router.v3.Router'
                      }
                    }
                  ],
                  access_log: [
                    {
                      name: 'envoy.access_loggers.file',
                      typed_config: {
                        '@type': 'type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog',
                        path: '/dev/stdout',
                        log_format: {
                          text_format: '%LOCAL_REMOTE_ADDRESS% %REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL% %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %REQ(X-FORWARDED-FOR)% %REQ(USER-AGENT)% %REQ(:AUTHORITY)% %UPSTREAM_HOST%\n'
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      });
    }
    
    // 可以添加TCP监听器（如果需要）
    if (serviceInfo.tcpPort || options.tcpPort) {
      // 实现TCP监听器...
    }
    
    return listeners;
  }
  
  /**
   * 构建集群
   * @private
   * @param {string} serviceName - 服务名称
   * @param {Object} serviceInfo - 服务信息
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>} 集群配置数组
   */
  async _buildClusters(serviceName, serviceInfo, options) {
    const clusters = [];
    
    // 主服务集群
    const serviceCluster = {
      name: `${serviceName}-cluster`,
      connect_timeout: '5s',
      lb_policy: options.lbPolicy || 'ROUND_ROBIN',
      health_checks: [
        {
          timeout: '2s',
          interval: '10s',
          unhealthy_threshold: 3,
          healthy_threshold: 2,
          http_health_check: {
            path: options.healthCheckPath || '/health',
            port_value: serviceInfo.httpPort || options.httpPort
          }
        }
      ],
      circuit_breakers: {
        thresholds: [
          {
            max_connections: 1024,
            max_pending_requests: 1024,
            max_requests: 1024,
            max_retries: 3
          }
        ]
      },
      http2_protocol_options: {},
      load_assignment: {
        cluster_name: `${serviceName}-cluster`,
        endpoints: [
          {
            lb_endpoints: []
          }
        ]
      }
    };
    
    // 获取服务实例
    const instances = await this.serviceDiscovery.discoverService(serviceName);
    
    // 构建端点
    if (instances && instances.length > 0) {
      serviceCluster.load_assignment.endpoints[0].lb_endpoints = instances.map(instance => ({
        endpoint: {
          address: {
            socketAddress: {
              address: instance.address || instance.host,
              portValue: instance.port || serviceInfo.httpPort || options.httpPort
            }
          }
        }
      }));
    } else {
      // 如果没有实例，添加一个占位符以避免启动错误
      serviceCluster.load_assignment.endpoints[0].lb_endpoints = [{
        endpoint: {
          address: {
            socketAddress: {
              address: '127.0.0.1',
              portValue: 8080
            }
          }
        }
      }];
    }
    
    clusters.push(serviceCluster);
    
    // 添加其他依赖服务集群
    if (serviceInfo.dependencies && serviceInfo.dependencies.length > 0) {
      for (const dependency of serviceInfo.dependencies) {
        const dependencyCluster = await this._buildDependencyCluster(dependency, options);
        if (dependencyCluster) {
          clusters.push(dependencyCluster);
        }
      }
    }
    
    return clusters;
  }
  
  /**
   * 构建依赖服务集群
   * @private
   * @param {string} dependencyName - 依赖服务名称
   * @param {Object} options - 配置选项
   * @returns {Promise<Object|null>} 集群配置
   */
  async _buildDependencyCluster(dependencyName, options) {
    try {
      const dependencyInfo = await this.serviceDiscovery.getServiceInfo(dependencyName);
      if (!dependencyInfo) {
        logger.warn(`依赖服务 ${dependencyName} 不存在，跳过集群配置`);
        return null;
      }
      
      const instances = await this.serviceDiscovery.discoverService(dependencyName);
      
      return {
        name: `${dependencyName}-cluster`,
        connect_timeout: '5s',
        lb_policy: options.lbPolicy || 'ROUND_ROBIN',
        health_checks: [
          {
            timeout: '2s',
            interval: '10s',
            unhealthy_threshold: 3,
            healthy_threshold: 2,
            http_health_check: {
              path: options.healthCheckPath || '/health',
              port_value: dependencyInfo.httpPort || options.httpPort
            }
          }
        ],
        load_assignment: {
          cluster_name: `${dependencyName}-cluster`,
          endpoints: [
            {
              lb_endpoints: (instances || []).map(instance => ({
                endpoint: {
                  address: {
                    socketAddress: {
                      address: instance.address || instance.host,
                      portValue: instance.port || dependencyInfo.httpPort || options.httpPort
                    }
                  }
                }
              }))
            }
          ]
        }
      };
    } catch (error) {
      logger.error(`构建依赖服务 ${dependencyName} 集群配置失败: ${error.message}`);
      return null;
    }
  }
  
  /**
   * 保存动态资源配置
   * @private
   * @param {string} serviceName - 服务名称
   * @param {Array} listeners - 监听器配置
   * @param {Array} clusters - 集群配置
   * @returns {Promise<void>}
   */
  async _saveDynamicResources(serviceName, listeners, clusters) {
    // 保存监听器配置
    const listenersPath = path.join(this.options.configOutputDir, `${serviceName}-listeners.json`);
    await fs.writeFile(listenersPath, JSON.stringify({
      resources: listeners.map(listener => ({
        '@type': 'type.googleapis.com/envoy.config.listener.v3.Listener',
        ...listener
      }))
    }, null, 2));
    
    // 保存集群配置
    const clustersPath = path.join(this.options.configOutputDir, `${serviceName}-clusters.json`);
    await fs.writeFile(clustersPath, JSON.stringify({
      resources: clusters.map(cluster => ({
        '@type': 'type.googleapis.com/envoy.config.cluster.v3.Cluster',
        ...cluster
      }))
    }, null, 2));
  }
  
  /**
   * 加载模板
   * @private
   * @returns {Promise<void>}
   */
  async _loadTemplates() {
    // 这里可以实现从文件系统加载模板的逻辑
    // 目前使用内联配置，无需加载外部模板
  }
  
  /**
   * 确保目录存在
   * @private
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  async _ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  /**
   * 启动自动刷新
   * @private
   */
  _startAutoRefresh() {
    if (this.options.refreshInterval > 0) {
      this.refreshInterval = setInterval(async () => {
        await this.refreshAllConfigs();
      }, this.options.refreshInterval);
      
      logger.info(`自动配置刷新已启动，间隔: ${this.options.refreshInterval}ms`);
    }
  }
  
  /**
   * 通知配置变更
   * @private
   * @param {string} serviceName - 服务名称
   * @param {Object} config - 新配置
   */
  _notifyConfigChange(serviceName, config) {
    this.watchers.forEach(watcher => {
      try {
        watcher(serviceName, config);
      } catch (error) {
        logger.error(`通知配置变更失败: ${error.message}`);
      }
    });
  }
}

/**
 * 创建Envoy配置生成器实例
 * @param {Object} options - 配置选项
 * @returns {EnvoyConfigGenerator} 配置生成器实例
 */
function createEnvoyConfigGenerator(options = {}) {
  return new EnvoyConfigGenerator(options);
}

module.exports = {
  EnvoyConfigGenerator,
  createEnvoyConfigGenerator,
  VERSION: '1.0.0'
};
