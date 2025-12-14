/**
 * @file 服务网格监控模块
 * @description 提供服务网格的监控、指标收集和统计功能
 * @module shared/monitoring
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const { EventEmitter } = require('events');
const { logger } = require('../logger');

/**
 * 监控指标类型枚举
 */
const METRIC_TYPES = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  SUMMARY: 'summary'
};

/**
 * 服务网格监控管理器
 */
class MonitoringManager extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {boolean} options.enabled - 是否启用监控
   * @param {number} options.metricRefreshInterval - 指标刷新间隔（毫秒）
   * @param {boolean} options.enablePrometheusExporter - 是否启用Prometheus导出
   * @param {number} options.exporterPort - Prometheus导出端口
   */
  constructor(options = {}) {
    super();
    
    this.enabled = options.enabled !== false;
    this.metricRefreshInterval = options.metricRefreshInterval || 10000;
    this.enablePrometheusExporter = options.enablePrometheusExporter || false;
    this.exporterPort = options.exporterPort || 9090;
    
    // 存储指标数据
    this.metrics = new Map();
    
    // 存储服务调用统计
    this.serviceStats = new Map();
    
    // 存储API网关统计
    this.gatewayStats = {
      requests: 0,
      requestsPerSecond: 0,
      errors: 0,
      errorRate: 0,
      latency: {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      activeConnections: 0
    };
    
    // 上次刷新时间
    this.lastRefreshTime = Date.now();
    
    // 定时刷新任务
    this.refreshTimer = null;
    
    // Prometheus服务器
    this.prometheusServer = null;
    
    if (this.enabled) {
      this.initialize();
    }
    
    logger.info(`监控模块已初始化: ${this.enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 初始化监控模块
   */
  initialize() {
    // 初始化默认指标
    this.createMetric('mesh_up', METRIC_TYPES.GAUGE, '服务网格状态', { initialValue: 1 });
    this.createMetric('mesh_services_total', METRIC_TYPES.GAUGE, '注册的服务总数');
    this.createMetric('mesh_requests_total', METRIC_TYPES.COUNTER, '总请求数');
    this.createMetric('mesh_request_errors_total', METRIC_TYPES.COUNTER, '错误请求数');
    this.createMetric('mesh_request_duration_ms', METRIC_TYPES.HISTOGRAM, '请求延迟（毫秒）');
    this.createMetric('mesh_active_connections', METRIC_TYPES.GAUGE, '活跃连接数');
    
    // 启动定时刷新
    this.startMetricRefresh();
    
    // 启动Prometheus导出（如果启用）
    if (this.enablePrometheusExporter) {
      this.startPrometheusExporter();
    }
    
    // 绑定进程信号
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }
  
  /**
   * 创建新指标
   * @param {string} name - 指标名称
   * @param {string} type - 指标类型
   * @param {string} help - 指标描述
   * @param {Object} options - 选项
   */
  createMetric(name, type, help, options = {}) {
    if (!this.enabled) return;
    
    if (!METRIC_TYPES[type]) {
      logger.error(`不支持的指标类型: ${type}`);
      return;
    }
    
    const metric = {
      name,
      type,
      help,
      value: options.initialValue || (type === METRIC_TYPES.COUNTER ? 0 : null),
      labels: options.labels || {},
      samples: type === METRIC_TYPES.HISTOGRAM ? [] : null
    };
    
    this.metrics.set(name, metric);
    logger.debug(`创建指标: ${name} (${type})`);
  }
  
  /**
   * 增加计数器值
   * @param {string} name - 指标名称
   * @param {number} value - 增加值
   * @param {Object} labels - 标签
   */
  increment(name, value = 1, labels = {}) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.COUNTER) {
      logger.warn(`尝试增加非计数器指标: ${name}`);
      return;
    }
    
    metric.value += value;
    this.emit('metric_updated', { name, value: metric.value, labels });
  }
  
  /**
   * 设置仪表盘值
   * @param {string} name - 指标名称
   * @param {number} value - 值
   * @param {Object} labels - 标签
   */
  gauge(name, value, labels = {}) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.GAUGE) {
      logger.warn(`尝试设置非仪表盘指标: ${name}`);
      return;
    }
    
    metric.value = value;
    this.emit('metric_updated', { name, value, labels });
  }
  
  /**
   * 记录直方图样本
   * @param {string} name - 指标名称
   * @param {number} value - 样本值
   * @param {Object} labels - 标签
   */
  histogram(name, value, labels = {}) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.HISTOGRAM) {
      logger.warn(`尝试记录非直方图指标: ${name}`);
      return;
    }
    
    if (!metric.samples) {
      metric.samples = [];
    }
    
    metric.samples.push(value);
    this.emit('metric_updated', { name, value, labels });
  }
  
  /**
   * 记录服务调用
   * @param {string} serviceName - 服务名称
   * @param {string} method - 方法名
   * @param {number} duration - 调用耗时（毫秒）
   * @param {boolean} success - 是否成功
   */
  recordServiceCall(serviceName, method, duration, success = true) {
    if (!this.enabled) return;
    
    const key = `${serviceName}.${method}`;
    if (!this.serviceStats.has(key)) {
      this.serviceStats.set(key, {
        service: serviceName,
        method,
        calls: 0,
        errors: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        durationSamples: []
      });
    }
    
    const stats = this.serviceStats.get(key);
    stats.calls++;
    
    if (!success) {
      stats.errors++;
      this.increment('mesh_request_errors_total', 1, { service: serviceName, method });
    }
    
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.calls;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.durationSamples.push(duration);
    
    // 更新全局指标
    this.increment('mesh_requests_total', 1, { service: serviceName, method });
    this.histogram('mesh_request_duration_ms', duration, { service: serviceName, method });
    
    // 计算并更新百分位数
    this.updatePercentiles(stats);
  }
  
  /**
   * 更新网关请求统计
   * @param {Object} requestInfo - 请求信息
   */
  recordGatewayRequest(requestInfo) {
    if (!this.enabled) return;
    
    this.gatewayStats.requests++;
    
    if (requestInfo.error) {
      this.gatewayStats.errors++;
    }
    
    if (requestInfo.duration) {
      const duration = requestInfo.duration;
      
      // 更新延迟统计
      const totalRequests = this.gatewayStats.requests;
      const prevAvg = this.gatewayStats.latency.avg;
      
      this.gatewayStats.latency.avg = (prevAvg * (totalRequests - 1) + duration) / totalRequests;
      this.gatewayStats.latency.min = Math.min(this.gatewayStats.latency.min || duration, duration);
      this.gatewayStats.latency.max = Math.max(this.gatewayStats.latency.max || 0, duration);
      
      // 记录延迟样本用于百分位计算
      if (!this.gatewayStats.latencySamples) {
        this.gatewayStats.latencySamples = [];
      }
      this.gatewayStats.latencySamples.push(duration);
    }
    
    if (requestInfo.activeConnections !== undefined) {
      this.gatewayStats.activeConnections = requestInfo.activeConnections;
      this.gauge('mesh_active_connections', requestInfo.activeConnections);
    }
    
    // 更新错误率
    this.gatewayStats.errorRate = this.gatewayStats.requests > 0 
      ? (this.gatewayStats.errors / this.gatewayStats.requests) * 100 
      : 0;
  }
  
  /**
   * 更新服务实例统计
   * @param {string} serviceName - 服务名称
   * @param {Object} stats - 实例统计
   */
  updateServiceInstances(serviceName, stats) {
    if (!this.enabled) return;
    
    const metricName = `mesh_service_instances_${serviceName}`;
    this.gauge(metricName, stats.total || 0);
    this.gauge(`${metricName}_healthy`, stats.healthy || 0);
    this.gauge(`${metricName}_unhealthy`, stats.unhealthy || 0);
  }
  
  /**
   * 计算百分位数
   * @param {Object} stats - 统计对象
   */
  updatePercentiles(stats) {
    if (stats.durationSamples.length < 5) return; // 样本不足时跳过
    
    const sorted = [...stats.durationSamples].sort((a, b) => a - b);
    
    stats.p50 = this.calculatePercentile(sorted, 50);
    stats.p95 = this.calculatePercentile(sorted, 95);
    stats.p99 = this.calculatePercentile(sorted, 99);
    
    // 限制样本数量，防止内存溢出
    if (stats.durationSamples.length > 10000) {
      stats.durationSamples = stats.durationSamples.slice(-5000);
    }
  }
  
  /**
   * 计算百分位数值
   * @param {Array} sorted - 排序后的数组
   * @param {number} percentile - 百分位
   * @returns {number} 百分位数值
   */
  calculatePercentile(sorted, percentile) {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  /**
   * 开始指标刷新
   */
  startMetricRefresh() {
    this.refreshTimer = setInterval(() => {
      this.refreshMetrics();
    }, this.metricRefreshInterval);
    
    this.refreshTimer.unref(); // 允许进程退出
  }
  
  /**
   * 刷新指标
   */
  refreshMetrics() {
    const now = Date.now();
    const elapsed = now - this.lastRefreshTime;
    
    // 计算RPS
    if (elapsed > 0) {
      const requestsInInterval = this.gatewayStats.requests - (this.lastRequests || 0);
      this.gatewayStats.requestsPerSecond = (requestsInInterval / elapsed) * 1000;
      this.lastRequests = this.gatewayStats.requests;
    }
    
    // 更新网关延迟百分位数
    if (this.gatewayStats.latencySamples && this.gatewayStats.latencySamples.length > 0) {
      const sorted = [...this.gatewayStats.latencySamples].sort((a, b) => a - b);
      
      this.gatewayStats.latency.p50 = this.calculatePercentile(sorted, 50);
      this.gatewayStats.latency.p95 = this.calculatePercentile(sorted, 95);
      this.gatewayStats.latency.p99 = this.calculatePercentile(sorted, 99);
    }
    
    // 更新服务总数指标
    const serviceNames = new Set([...this.serviceStats.values()].map(s => s.service));
    this.gauge('mesh_services_total', serviceNames.size);
    
    this.lastRefreshTime = now;
  }
  
  /**
   * 启动Prometheus导出器
   */
  startPrometheusExporter() {
    try {
      const http = require('http');
      
      this.prometheusServer = http.createServer((req, res) => {
        if (req.url === '/metrics') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(this.generatePrometheusMetrics());
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.prometheusServer.listen(this.exporterPort, () => {
        logger.info(`Prometheus指标导出器已启动: http://localhost:${this.exporterPort}/metrics`);
      });
      
    } catch (error) {
      logger.error(`启动Prometheus导出器失败: ${error.message}`);
    }
  }
  
  /**
   * 生成Prometheus格式的指标
   * @returns {string} Prometheus指标文本
   */
  generatePrometheusMetrics() {
    const lines = [];
    
    for (const [name, metric] of this.metrics.entries()) {
      // 添加帮助文本
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);
      
      // 添加指标值
      if (metric.type === METRIC_TYPES.HISTOGRAM && metric.samples && metric.samples.length > 0) {
        // 直方图特殊处理
        const sum = metric.samples.reduce((a, b) => a + b, 0);
        const count = metric.samples.length;
        
        lines.push(`${name}_sum ${sum}`);
        lines.push(`${name}_count ${count}`);
        
        // 生成直方图桶
        const buckets = [0.1, 1, 5, 10, 50, 100, 500, 1000];
        for (const bucket of buckets) {
          const bucketCount = metric.samples.filter(v => v <= bucket).length;
          lines.push(`${name}_bucket{le="${bucket}"} ${bucketCount}`);
        }
        lines.push(`${name}_bucket{le="+Inf"} ${count}`);
        
      } else if (metric.value !== null && metric.value !== undefined) {
        // 普通指标
        const labelsStr = Object.keys(metric.labels).length > 0
          ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : '';
          
        lines.push(`${name}${labelsStr} ${metric.value}`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 获取当前指标
   * @returns {Object} 指标数据
   */
  getMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics.entries()),
      gatewayStats: this.gatewayStats,
      serviceStats: Object.fromEntries(this.serviceStats.entries()),
      timestamp: Date.now()
    };
  }
  
  /**
   * 重置指标
   */
  resetMetrics() {
    this.metrics.clear();
    this.serviceStats.clear();
    this.gatewayStats = {
      requests: 0,
      requestsPerSecond: 0,
      errors: 0,
      errorRate: 0,
      latency: {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      activeConnections: 0
    };
    
    logger.info('监控指标已重置');
  }
  
  /**
   * 关闭监控模块
   */
  async shutdown() {
    logger.info('正在关闭监控模块...');
    
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // 关闭Prometheus服务器
    if (this.prometheusServer) {
      await new Promise((resolve) => {
        this.prometheusServer.close(resolve);
      });
      this.prometheusServer = null;
    }
    
    // 重置状态
    this.resetMetrics();
    
    logger.info('监控模块已关闭');
  }
}

/**
 * 服务健康检查器
 */
class HealthChecker {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {number} options.checkInterval - 检查间隔（毫秒）
   * @param {number} options.timeout - 超时时间（毫秒）
   */
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000;
    this.timeout = options.timeout || 5000;
    this.healthChecks = new Map();
    this.healthStatus = new Map();
    this.checkTimer = null;
    
    if (options.enabled !== false) {
      this.start();
    }
  }
  
  /**
   * 添加健康检查
   * @param {string} name - 检查名称
   * @param {Function} checkFn - 检查函数
   * @param {Object} options - 选项
   */
  addHealthCheck(name, checkFn, options = {}) {
    if (typeof checkFn !== 'function') {
      throw new Error('健康检查必须是函数');
    }
    
    this.healthChecks.set(name, {
      checkFn,
      interval: options.interval || this.checkInterval,
      timeout: options.timeout || this.timeout,
      lastCheck: null,
      lastSuccess: null
    });
    
    // 初始状态设为未知
    this.healthStatus.set(name, {
      status: 'UNKNOWN',
      message: '尚未执行检查',
      timestamp: null,
      error: null
    });
    
    logger.info(`添加健康检查: ${name}`);
  }
  
  /**
   * 移除健康检查
   * @param {string} name - 检查名称
   */
  removeHealthCheck(name) {
    this.healthChecks.delete(name);
    this.healthStatus.delete(name);
    logger.info(`移除健康检查: ${name}`);
  }
  
  /**
   * 执行单个健康检查
   * @param {string} name - 检查名称
   * @returns {Promise<Object>} 检查结果
   */
  async runHealthCheck(name) {
    const check = this.healthChecks.get(name);
    if (!check) {
      throw new Error(`未知的健康检查: ${name}`);
    }
    
    const startTime = Date.now();
    
    try {
      // 设置超时
      const result = await Promise.race([
        check.checkFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('健康检查超时')), check.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      const status = {
        status: 'HEALTHY',
        message: result?.message || '健康检查通过',
        timestamp: new Date().toISOString(),
        duration,
        error: null
      };
      
      check.lastCheck = startTime;
      check.lastSuccess = startTime;
      this.healthStatus.set(name, status);
      
      logger.debug(`健康检查 ${name}: 成功 (${duration}ms)`);
      return status;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = {
        status: 'UNHEALTHY',
        message: '健康检查失败',
        timestamp: new Date().toISOString(),
        duration,
        error: error.message
      };
      
      check.lastCheck = startTime;
      this.healthStatus.set(name, status);
      
      logger.warn(`健康检查 ${name}: 失败 - ${error.message} (${duration}ms)`);
      return status;
    }
  }
  
  /**
   * 执行所有健康检查
   * @returns {Promise<Object>} 所有检查结果
   */
  async runAllHealthChecks() {
    const results = {};
    let overallStatus = 'HEALTHY';
    
    for (const name of this.healthChecks.keys()) {
      const result = await this.runHealthCheck(name);
      results[name] = result;
      
      if (result.status !== 'HEALTHY') {
        overallStatus = 'UNHEALTHY';
      }
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
  
  /**
   * 获取当前健康状态
   * @returns {Object} 健康状态
   */
  getHealthStatus() {
    const checks = Object.fromEntries(this.healthStatus.entries());
    const allHealthy = Array.from(this.healthStatus.values()).every(
      status => status.status === 'HEALTHY'
    );
    
    return {
      status: this.healthStatus.size === 0 ? 'UNKNOWN' : (allHealthy ? 'HEALTHY' : 'UNHEALTHY'),
      timestamp: new Date().toISOString(),
      checks
    };
  }
  
  /**
   * 启动定期检查
   */
  start() {
    this.checkTimer = setInterval(() => {
      this.runAllHealthChecks();
    }, this.checkInterval);
    
    this.checkTimer.unref(); // 允许进程退出
    logger.info('健康检查器已启动');
  }
  
  /**
   * 停止定期检查
   */
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    logger.info('健康检查器已停止');
  }
  
  /**
   * 关闭健康检查器
   */
  shutdown() {
    this.stop();
    this.healthChecks.clear();
    this.healthStatus.clear();
    logger.info('健康检查器已关闭');
  }
}

// 导出单例实例
let monitoringManagerInstance = null;
let healthCheckerInstance = null;

/**
 * 获取监控管理器实例
 * @param {Object} options - 配置选项
 * @returns {MonitoringManager} 监控管理器实例
 */
function getMonitoringManager(options = {}) {
  if (!monitoringManagerInstance) {
    monitoringManagerInstance = new MonitoringManager(options);
  }
  return monitoringManagerInstance;
}

/**
 * 获取健康检查器实例
 * @param {Object} options - 配置选项
 * @returns {HealthChecker} 健康检查器实例
 */
function getHealthChecker(options = {}) {
  if (!healthCheckerInstance) {
    healthCheckerInstance = new HealthChecker(options);
  }
  return healthCheckerInstance;
}

module.exports = {
  MonitoringManager,
  HealthChecker,
  getMonitoringManager,
  getHealthChecker,
  METRIC_TYPES,
  VERSION: '1.0.0'
};
