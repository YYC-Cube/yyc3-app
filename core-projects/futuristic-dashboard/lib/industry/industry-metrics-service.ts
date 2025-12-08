/**
 * @file 行业API性能监控服务
 * @description 实现行业API性能监控和指标追踪的核心业务逻辑
 * @module industry-metrics-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { 
  ApiPerformanceMetrics, 
  ApiPerformanceTrend, 
  PerformanceAlertRule, 
  PerformanceAlert, 
  ApiMetricsQueryParams, 
  ApiPerformanceSummary, 
  PerformanceDashboardData 
} from './industry-metrics-types';

/**
 * 行业API性能监控服务
 */
export class IndustryMetricsService {
  /**
   * 获取API性能指标
   * @param params 查询参数
   * @returns 性能指标列表
   */
  async getApiPerformanceMetrics(params: ApiMetricsQueryParams): Promise<ApiPerformanceMetrics[]> {
    try {
      // 在实际实现中，这里应该调用后端API
      // 此处使用模拟数据进行演示
      console.log('获取API性能指标', params);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成模拟数据
      const mockMetrics: ApiPerformanceMetrics[] = [
        {
          id: 'metr1',
          industryId: params.industryId || 'ind1',
          industryName: '金融科技',
          apiPath: '/api/products',
          httpMethod: 'GET',
          requestCount: 1250,
          averageResponseTime: 120,
          maxResponseTime: 500,
          minResponseTime: 50,
          successRate: 98.5,
          errorRate: 1.5,
          statusCodeDistribution: {
            '200': 1225,
            '400': 15,
            '500': 10
          },
          timeRangeStart: params.startTime,
          timeRangeEnd: params.endTime,
          createdAt: new Date()
        },
        {
          id: 'metr2',
          industryId: params.industryId || 'ind1',
          industryName: '金融科技',
          apiPath: '/api/orders',
          httpMethod: 'POST',
          requestCount: 840,
          averageResponseTime: 250,
          maxResponseTime: 800,
          minResponseTime: 100,
          successRate: 99.2,
          errorRate: 0.8,
          statusCodeDistribution: {
            '201': 833,
            '400': 5,
            '500': 2
          },
          timeRangeStart: params.startTime,
          timeRangeEnd: params.endTime,
          createdAt: new Date()
        },
        {
          id: 'metr3',
          industryId: params.industryId || 'ind2',
          industryName: '电子商务',
          apiPath: '/api/users',
          httpMethod: 'GET',
          requestCount: 2100,
          averageResponseTime: 85,
          maxResponseTime: 400,
          minResponseTime: 30,
          successRate: 99.7,
          errorRate: 0.3,
          statusCodeDistribution: {
            '200': 2094,
            '401': 6
          },
          timeRangeStart: params.startTime,
          timeRangeEnd: params.endTime,
          createdAt: new Date()
        }
      ];
      
      // 如果指定了industryId，进行过滤
      if (params.industryId) {
        return mockMetrics.filter(metric => metric.industryId === params.industryId);
      }
      
      // 如果指定了apiPath，进行过滤
      if (params.apiPath) {
        return mockMetrics.filter(metric => metric.apiPath === params.apiPath);
      }
      
      // 如果指定了httpMethod，进行过滤
      if (params.httpMethod) {
        return mockMetrics.filter(metric => metric.httpMethod === params.httpMethod);
      }
      
      return mockMetrics;
    } catch (error) {
      console.error('获取API性能指标失败:', error);
      throw new Error('获取API性能指标失败');
    }
  }
  
  /**
   * 获取API性能趋势
   * @param industryId 行业ID
   * @param apiPath API路径
   * @param httpMethod HTTP方法
   * @param timeGranularity 时间粒度
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 性能趋势数据
   */
  async getApiPerformanceTrend(
    industryId: string,
    apiPath: string,
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startTime: Date,
    endTime: Date
  ): Promise<ApiPerformanceTrend> {
    try {
      console.log('获取API性能趋势', { industryId, apiPath, httpMethod, timeGranularity, startTime, endTime });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 生成模拟趋势数据点
      const dataPoints = this.generateMockTrendPoints(startTime, endTime, timeGranularity);
      
      return {
        industryId,
        apiPath,
        httpMethod,
        timeGranularity,
        dataPoints,
        timeRangeStart: startTime,
        timeRangeEnd: endTime
      };
    } catch (error) {
      console.error('获取API性能趋势失败:', error);
      throw new Error('获取API性能趋势失败');
    }
  }
  
  /**
   * 获取性能告警规则列表
   * @param industryId 行业ID(可选)
   * @returns 告警规则列表
   */
  async getPerformanceAlertRules(industryId?: string): Promise<PerformanceAlertRule[]> {
    try {
      console.log('获取性能告警规则', { industryId });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟告警规则数据
      const mockRules: PerformanceAlertRule[] = [
        {
          id: 'rule1',
          industryId: 'ind1',
          name: '高响应时间告警',
          description: '当API响应时间超过500ms时触发告警',
          responseTimeThreshold: 500,
          errorRateThreshold: 5,
          enabled: true,
          createdAt: new Date('2024-10-01'),
          updatedAt: new Date('2024-10-01')
        },
        {
          id: 'rule2',
          industryId: 'ind1',
          name: '高错误率告警',
          description: '当API错误率超过3%时触发告警',
          apiPath: '/api/orders',
          responseTimeThreshold: 1000,
          errorRateThreshold: 3,
          enabled: true,
          createdAt: new Date('2024-10-02'),
          updatedAt: new Date('2024-10-02')
        },
        {
          id: 'rule3',
          industryId: 'ind2',
          name: '用户服务告警',
          description: '用户服务API性能监控',
          apiPath: '/api/users',
          httpMethod: 'GET',
          responseTimeThreshold: 200,
          errorRateThreshold: 2,
          enabled: true,
          createdAt: new Date('2024-10-05'),
          updatedAt: new Date('2024-10-05')
        }
      ];
      
      // 如果指定了industryId，进行过滤
      if (industryId) {
        return mockRules.filter(rule => rule.industryId === industryId);
      }
      
      return mockRules;
    } catch (error) {
      console.error('获取性能告警规则失败:', error);
      throw new Error('获取性能告警规则失败');
    }
  }
  
  /**
   * 创建性能告警规则
   * @param rule 告警规则
   * @returns 创建的告警规则
   */
  async createPerformanceAlertRule(rule: Omit<PerformanceAlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceAlertRule> {
    try {
      console.log('创建性能告警规则', rule);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const newRule: PerformanceAlertRule = {
        ...rule,
        id: `rule_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return newRule;
    } catch (error) {
      console.error('创建性能告警规则失败:', error);
      throw new Error('创建性能告警规则失败');
    }
  }
  
  /**
   * 更新性能告警规则
   * @param ruleId 规则ID
   * @param updates 更新内容
   * @returns 更新后的告警规则
   */
  async updatePerformanceAlertRule(ruleId: string, updates: Partial<PerformanceAlertRule>): Promise<PerformanceAlertRule> {
    try {
      console.log('更新性能告警规则', { ruleId, updates });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // 模拟更新后的规则
      const updatedRule: PerformanceAlertRule = {
        id: ruleId,
        industryId: updates.industryId || 'ind1',
        name: updates.name || '更新后的告警规则',
        description: updates.description || '更新后的描述',
        apiPath: updates.apiPath,
        httpMethod: updates.httpMethod,
        responseTimeThreshold: updates.responseTimeThreshold || 500,
        errorRateThreshold: updates.errorRateThreshold || 5,
        enabled: updates.enabled ?? true,
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date()
      };
      
      return updatedRule;
    } catch (error) {
      console.error('更新性能告警规则失败:', error);
      throw new Error('更新性能告警规则失败');
    }
  }
  
  /**
   * 删除性能告警规则
   * @param ruleId 规则ID
   * @returns 是否删除成功
   */
  async deletePerformanceAlertRule(ruleId: string): Promise<boolean> {
    try {
      console.log('删除性能告警规则', ruleId);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      console.error('删除性能告警规则失败:', error);
      throw new Error('删除性能告警规则失败');
    }
  }
  
  /**
   * 获取性能告警列表
   * @param industryId 行业ID(可选)
   * @param resolved 是否已解决(可选)
   * @returns 告警列表
   */
  async getPerformanceAlerts(industryId?: string, resolved?: boolean): Promise<PerformanceAlert[]> {
    try {
      console.log('获取性能告警', { industryId, resolved });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟告警数据
      const mockAlerts: PerformanceAlert[] = [
        {
          id: 'alert1',
          ruleId: 'rule1',
          industryId: 'ind1',
          industryName: '金融科技',
          apiPath: '/api/products',
          httpMethod: 'GET',
          alertType: 'response_time',
          severity: 'warning',
          description: 'API响应时间超过阈值',
          currentValue: 650,
          threshold: 500,
          resolved: false,
          triggeredAt: new Date(Date.now() - 3600000), // 1小时前
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: 'alert2',
          ruleId: 'rule2',
          industryId: 'ind1',
          industryName: '金融科技',
          apiPath: '/api/orders',
          httpMethod: 'POST',
          alertType: 'error_rate',
          severity: 'critical',
          description: 'API错误率超过阈值',
          currentValue: 8.5,
          threshold: 3,
          resolved: false,
          triggeredAt: new Date(Date.now() - 1800000), // 30分钟前
          createdAt: new Date(Date.now() - 1800000)
        },
        {
          id: 'alert3',
          ruleId: 'rule3',
          industryId: 'ind2',
          industryName: '电子商务',
          apiPath: '/api/users',
          httpMethod: 'GET',
          alertType: 'response_time',
          severity: 'warning',
          description: 'API响应时间超过阈值',
          currentValue: 250,
          threshold: 200,
          resolved: true,
          resolvedAt: new Date(Date.now() - 7200000), // 2小时前
          triggeredAt: new Date(Date.now() - 10800000), // 3小时前
          createdAt: new Date(Date.now() - 10800000)
        }
      ];
      
      // 应用过滤条件
      let filteredAlerts = [...mockAlerts];
      
      if (industryId) {
        filteredAlerts = filteredAlerts.filter(alert => alert.industryId === industryId);
      }
      
      if (resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === resolved);
      }
      
      return filteredAlerts;
    } catch (error) {
      console.error('获取性能告警失败:', error);
      throw new Error('获取性能告警失败');
    }
  }
  
  /**
   * 解决性能告警
   * @param alertId 告警ID
   * @returns 是否解决成功
   */
  async resolvePerformanceAlert(alertId: string): Promise<boolean> {
    try {
      console.log('解决性能告警', alertId);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      console.error('解决性能告警失败:', error);
      throw new Error('解决性能告警失败');
    }
  }
  
  /**
   * 获取性能摘要
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 性能摘要
   */
  async getPerformanceSummary(startTime: Date, endTime: Date): Promise<ApiPerformanceSummary> {
    try {
      console.log('获取性能摘要', { startTime, endTime });
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 模拟性能摘要数据
      return {
        totalRequests: 4200,
        averageResponseTime: 150,
        overallSuccessRate: 99.2,
        highestErrorRateApi: { apiPath: '/api/orders', errorRate: 8.5 },
        slowestApi: { apiPath: '/api/products', avgResponseTime: 650 },
        mostCalledApi: { apiPath: '/api/users', requestCount: 2100 },
        activeIndustriesCount: 5,
        timeRangeStart: startTime,
        timeRangeEnd: endTime
      };
    } catch (error) {
      console.error('获取性能摘要失败:', error);
      throw new Error('获取性能摘要失败');
    }
  }
  
  /**
   * 获取性能监控仪表盘数据
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 仪表盘数据
   */
  async getPerformanceDashboardData(startTime: Date, endTime: Date): Promise<PerformanceDashboardData> {
    try {
      console.log('获取性能监控仪表盘数据', { startTime, endTime });
      
      // 并行获取各类数据
      const [summary, metrics, alerts] = await Promise.all([
        this.getPerformanceSummary(startTime, endTime),
        this.getApiPerformanceMetrics({
          startTime,
          endTime,
          timeGranularity: 'daily',
          pageSize: 5
        }),
        this.getPerformanceAlerts(undefined, false)
      ]);
      
      // 获取主要API的趋势数据
      const recentTrends: ApiPerformanceTrend[] = [];
      if (metrics.length > 0) {
        const mainApi = metrics[0];
        const trend = await this.getApiPerformanceTrend(
          mainApi.industryId,
          mainApi.apiPath,
          mainApi.httpMethod,
          'hourly',
          startTime,
          endTime
        );
        recentTrends.push(trend);
      }
      
      return {
        summary,
        recentTrends,
        activeAlerts: alerts,
        industryMetrics: metrics
      };
    } catch (error) {
      console.error('获取性能监控仪表盘数据失败:', error);
      throw new Error('获取性能监控仪表盘数据失败');
    }
  }
  
  /**
   * 生成模拟趋势数据点
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @param timeGranularity 时间粒度
   * @returns 趋势数据点数组
   */
  private generateMockTrendPoints(
    startTime: Date,
    endTime: Date,
    timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
  ) {
    const dataPoints = [];
    const currentTime = new Date(startTime);
    const now = new Date();
    
    // 根据时间粒度确定间隔
    let intervalMs = 3600000; // 默认按小时
    if (timeGranularity === 'daily') intervalMs = 86400000;
    else if (timeGranularity === 'weekly') intervalMs = 604800000;
    else if (timeGranularity === 'monthly') intervalMs = 2592000000;
    
    // 生成数据点
    while (currentTime <= endTime && currentTime <= now) {
      // 生成随机但有规律的数据
      const baseTime = currentTime.getTime();
      const avgResponseTime = 100 + Math.sin(baseTime / 10000000) * 50 + Math.random() * 30;
      const requestCount = 500 + Math.sin(baseTime / 8000000) * 200 + Math.random() * 100;
      const successRate = 97 + Math.sin(baseTime / 12000000) * 2 + Math.random() * 1;
      
      dataPoints.push({
        timestamp: new Date(currentTime),
        averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        requestCount: Math.round(requestCount),
        successRate: parseFloat(successRate.toFixed(2))
      });
      
      // 前进到下一个时间点
      currentTime.setTime(currentTime.getTime() + intervalMs);
    }
    
    return dataPoints;
  }
}
