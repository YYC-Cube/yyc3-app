/**
 * @file 行业API性能监控服务测试
 * @description 测试IndustryMetricsService类的各项功能和异常处理
 * @module industry-metrics-service.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { IndustryMetricsService } from './industry-metrics-service';
import {
  ApiPerformanceMetrics,
  ApiPerformanceTrend,
  PerformanceAlert,
  PerformanceDashboardData,
  AlertRule,
  AlertRuleResponse
} from './industry-metrics-types';

// 模拟API响应数据
const mockApiResponse = {
  metrics: [
    {
      id: 'metric-1',
      industryId: 'industry-1',
      industryName: '金融',
      apiPath: '/api/v1/financial/data',
      httpMethod: 'GET',
      requestCount: 1500,
      averageResponseTime: 120.5,
      successRate: 98.7,
      errorCount: 20,
      p50ResponseTime: 100,
      p90ResponseTime: 180,
      p95ResponseTime: 220,
      p99ResponseTime: 280,
      timestamp: new Date().toISOString()
    },
    {
      id: 'metric-2',
      industryId: 'industry-2',
      industryName: '零售',
      apiPath: '/api/v1/retail/products',
      httpMethod: 'POST',
      requestCount: 3200,
      averageResponseTime: 180.3,
      successRate: 96.5,
      errorCount: 112,
      p50ResponseTime: 150,
      p90ResponseTime: 250,
      p95ResponseTime: 320,
      p99ResponseTime: 400,
      timestamp: new Date().toISOString()
    }
  ],
  trends: [
    {
      industryId: 'industry-1',
      apiPath: '/api/v1/financial/data',
      dataPoints: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          requestCount: 200,
          averageResponseTime: 110,
          successRate: 99.0,
          errorCount: 2
        },
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          requestCount: 250,
          averageResponseTime: 115,
          successRate: 98.8,
          errorCount: 3
        },
        {
          timestamp: new Date().toISOString(),
          requestCount: 300,
          averageResponseTime: 120,
          successRate: 98.7,
          errorCount: 4
        }
      ]
    }
  ],
  alerts: [
    {
      id: 'alert-1',
      industryId: 'industry-2',
      industryName: '零售',
      apiPath: '/api/v1/retail/products',
      description: '响应时间超过阈值',
      alertType: 'response_time',
      severity: 'warning',
      currentValue: 180.3,
      threshold: 150,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      resolvedAt: null
    },
    {
      id: 'alert-2',
      industryId: 'industry-1',
      industryName: '金融',
      apiPath: '/api/v1/financial/data',
      description: '错误率超过阈值',
      alertType: 'error_rate',
      severity: 'critical',
      currentValue: 5.2,
      threshold: 5,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      resolvedAt: null
    }
  ],
  alertRules: [
    {
      id: 'rule-1',
      industryId: 'industry-1',
      alertType: 'response_time',
      threshold: 200,
      severity: 'warning',
      enabled: true,
      createdAt: new Date().toISOString()
    }
  ],
  dashboardData: {
    summary: {
      totalRequests: 4700,
      averageResponseTime: 150.4,
      overallSuccessRate: 97.6,
      activeIndustriesCount: 2,
      totalErrors: 132
    },
    industryMetrics: [
      {
        id: 'metric-1',
        industryId: 'industry-1',
        industryName: '金融',
        apiPath: '/api/v1/financial/data',
        httpMethod: 'GET',
        requestCount: 1500,
        averageResponseTime: 120.5,
        successRate: 98.7
      }
    ],
    recentTrends: [
      {
        industryId: 'industry-1',
        apiPath: '/api/v1/financial/data',
        dataPoints: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            requestCount: 200,
            averageResponseTime: 110,
            successRate: 99.0
          }
        ]
      }
    ],
    activeAlerts: [
      {
        id: 'alert-1',
        industryId: 'industry-2',
        industryName: '零售',
        apiPath: '/api/v1/retail/products',
        description: '响应时间超过阈值',
        alertType: 'response_time',
        severity: 'warning',
        currentValue: 180.3,
        threshold: 150,
        triggeredAt: new Date().toISOString()
      }
    ]
  }
};

// 模拟fetch API
global.fetch = jest.fn();

describe('IndustryMetricsService', () => {
  let metricsService: IndustryMetricsService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
  
  beforeEach(() => {
    metricsService = new IndustryMetricsService();
    jest.clearAllMocks();
  });
  
  describe('getPerformanceMetrics', () => {
    it('应该成功获取性能指标数据', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.metrics })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceMetrics(startTime, endTime);
      
      // Assert
      expect(result).toEqual(mockApiResponse.metrics);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/performance'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('应该成功获取特定行业的性能指标数据', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      const industryId = 'industry-1';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockApiResponse.metrics[0]] })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceMetrics(startTime, endTime, industryId);
      
      // Assert
      expect(result).toEqual([mockApiResponse.metrics[0]]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`industryId=${industryId}`),
        expect.anything()
      );
    });
    
    it('API调用失败时应该抛出错误', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);
      
      // Act & Assert
      await expect(metricsService.getPerformanceMetrics(startTime, endTime))
        .rejects
        .toThrow('获取性能指标失败: Internal Server Error');
    });
  });
  
  describe('getPerformanceTrends', () => {
    it('应该成功获取性能趋势数据', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.trends })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceTrends(startTime, endTime);
      
      // Assert
      expect(result).toEqual(mockApiResponse.trends);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/trends'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('API调用失败时应该抛出错误', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response);
      
      // Act & Assert
      await expect(metricsService.getPerformanceTrends(startTime, endTime))
        .rejects
        .toThrow('获取性能趋势数据失败: Bad Request');
    });
  });
  
  describe('getActiveAlerts', () => {
    it('应该成功获取活跃告警列表', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.alerts })
      } as Response);
      
      // Act
      const result = await metricsService.getActiveAlerts();
      
      // Assert
      expect(result).toEqual(mockApiResponse.alerts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/alerts'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('应该成功获取特定行业的活跃告警列表', async () => {
      // Arrange
      const industryId = 'industry-1';
      const expectedAlerts = mockApiResponse.alerts.filter(alert => alert.industryId === industryId);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: expectedAlerts })
      } as Response);
      
      // Act
      const result = await metricsService.getActiveAlerts(industryId);
      
      // Assert
      expect(result).toEqual(expectedAlerts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`industryId=${industryId}`),
        expect.anything()
      );
    });
  });
  
  describe('resolvePerformanceAlert', () => {
    it('应该成功解决性能告警', async () => {
      // Arrange
      const alertId = 'alert-1';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      // Act
      const result = await metricsService.resolvePerformanceAlert(alertId);
      
      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/metrics/alerts/${alertId}/resolve`),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
    
    it('解决告警失败时应该抛出错误', async () => {
      // Arrange
      const alertId = 'alert-1';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);
      
      // Act & Assert
      await expect(metricsService.resolvePerformanceAlert(alertId))
        .rejects
        .toThrow('解决告警失败: Not Found');
    });
  });
  
  describe('getAlertRules', () => {
    it('应该成功获取告警规则列表', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.alertRules })
      } as Response);
      
      // Act
      const result = await metricsService.getAlertRules();
      
      // Assert
      expect(result).toEqual(mockApiResponse.alertRules);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/alert-rules'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });
  
  describe('createAlertRule', () => {
    it('应该成功创建告警规则', async () => {
      // Arrange
      const newRule: AlertRule = {
        industryId: 'industry-3',
        alertType: 'success_rate',
        threshold: 95,
        severity: 'warning',
        enabled: true
      };
      const expectedResponse: AlertRuleResponse = {
        id: 'rule-2',
        ...newRule,
        createdAt: new Date().toISOString()
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: expectedResponse })
      } as Response);
      
      // Act
      const result = await metricsService.createAlertRule(newRule);
      
      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/alert-rules'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newRule)
        })
      );
    });
  });
  
  describe('updateAlertRule', () => {
    it('应该成功更新告警规则', async () => {
      // Arrange
      const ruleId = 'rule-1';
      const updatedRule: Partial<AlertRule> = {
        threshold: 250,
        enabled: false
      };
      const expectedResponse: AlertRuleResponse = {
        id: ruleId,
        industryId: 'industry-1',
        alertType: 'response_time',
        threshold: 250,
        severity: 'warning',
        enabled: false,
        createdAt: new Date().toISOString()
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: expectedResponse })
      } as Response);
      
      // Act
      const result = await metricsService.updateAlertRule(ruleId, updatedRule);
      
      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/metrics/alert-rules/${ruleId}`),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedRule)
        })
      );
    });
  });
  
  describe('deleteAlertRule', () => {
    it('应该成功删除告警规则', async () => {
      // Arrange
      const ruleId = 'rule-1';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      // Act
      const result = await metricsService.deleteAlertRule(ruleId);
      
      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/metrics/alert-rules/${ruleId}`),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });
  
  describe('getPerformanceDashboardData', () => {
    it('应该成功获取性能仪表盘数据', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.dashboardData })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceDashboardData(startTime, endTime);
      
      // Assert
      expect(result).toEqual(mockApiResponse.dashboardData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/dashboard'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
    
    it('应该成功获取特定行业的性能仪表盘数据', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      const industryId = 'industry-1';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.dashboardData })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceDashboardData(startTime, endTime, industryId);
      
      // Assert
      expect(result).toEqual(mockApiResponse.dashboardData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`industryId=${industryId}`),
        expect.anything()
      );
    });
  });
  
  describe('getPerformanceSummary', () => {
    it('应该成功获取性能摘要数据', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApiResponse.dashboardData.summary })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceSummary();
      
      // Assert
      expect(result).toEqual(mockApiResponse.dashboardData.summary);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/metrics/summary'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });
  
  describe('mock数据测试边界情况', () => {
    it('当API返回空数组时，应该正确处理', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response);
      
      // Act
      const result = await metricsService.getPerformanceMetrics(startTime, endTime);
      
      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
    
    it('当fetch抛出网络错误时，应该正确处理', async () => {
      // Arrange
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Act & Assert
      await expect(metricsService.getPerformanceMetrics(startTime, endTime))
        .rejects
        .toThrow('获取性能指标失败: Network error');
    });
  });
});
