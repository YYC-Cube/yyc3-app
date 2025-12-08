/**
 * @file 行业API性能监控仪表盘组件测试
 * @description 测试IndustryMetricsDashboard组件的渲染和交互功能
 * @module industry-metrics-dashboard.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IndustryMetricsDashboard } from './industry-metrics-dashboard';
import { IndustryMetricsService } from '../../lib/industry/industry-metrics-service';
import { PerformanceDashboardData } from '../../lib/industry/industry-metrics-types';

// 创建一个简单的MUI主题
const theme = createTheme();

// 模拟仪表盘数据
const mockDashboardData: PerformanceDashboardData = {
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
    },
    {
      id: 'metric-2',
      industryId: 'industry-2',
      industryName: '零售',
      apiPath: '/api/v1/retail/products',
      httpMethod: 'POST',
      requestCount: 3200,
      averageResponseTime: 180.3,
      successRate: 96.5
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
        },
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          requestCount: 250,
          averageResponseTime: 115,
          successRate: 98.8
        },
        {
          timestamp: new Date().toISOString(),
          requestCount: 300,
          averageResponseTime: 120,
          successRate: 98.7
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
      triggeredAt: new Date().toISOString()
    }
  ]
};

// 模拟空仪表盘数据
const emptyDashboardData: PerformanceDashboardData = {
  summary: {
    totalRequests: 0,
    averageResponseTime: 0,
    overallSuccessRate: 0,
    activeIndustriesCount: 0,
    totalErrors: 0
  },
  industryMetrics: [],
  recentTrends: [
    {
      industryId: 'industry-1',
      apiPath: '/api/v1/financial/data',
      dataPoints: []
    }
  ],
  activeAlerts: []
};

// 模拟IndustryMetricsService
jest.mock('../../lib/industry/industry-metrics-service');
const MockedIndustryMetricsService = IndustryMetricsService as jest.MockedClass<typeof IndustryMetricsService>;

// 清除所有模拟
beforeEach(() => {
  jest.clearAllMocks();
  // 模拟构造函数
  (IndustryMetricsService as jest.Mock).mockImplementation(() => ({
    getPerformanceDashboardData: MockedIndustryMetricsService.prototype.getPerformanceDashboardData,
    resolvePerformanceAlert: MockedIndustryMetricsService.prototype.resolvePerformanceAlert
  }));
});

describe('IndustryMetricsDashboard组件', () => {
  // 模拟方法实现
  beforeEach(() => {
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue(mockDashboardData);
    MockedIndustryMetricsService.prototype.resolvePerformanceAlert.mockResolvedValue(true);
  });

  test('渲染加载状态', async () => {
    // Arrange - 使用自定义组件包装以避免自动刷新的影响
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert
    expect(screen.getByText('整体API性能监控')).toBeInTheDocument();
    // 检查加载状态是否存在
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('成功渲染仪表盘数据', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 检查性能指标卡片
    expect(screen.getByText('总请求量')).toBeInTheDocument();
    expect(screen.getByText('平均响应时间')).toBeInTheDocument();
    expect(screen.getByText('成功率')).toBeInTheDocument();
    expect(screen.getByText('活跃行业')).toBeInTheDocument();

    // 检查摘要数据
    expect(screen.getByText('4.7k')).toBeInTheDocument(); // 格式化后的请求量
    expect(screen.getByText('150.4')).toBeInTheDocument(); // 平均响应时间
    expect(screen.getByText('97.6%')).toBeInTheDocument(); // 成功率
    expect(screen.getByText('2')).toBeInTheDocument(); // 活跃行业数

    // 检查性能趋势图表标题
    expect(screen.getByText('性能趋势')).toBeInTheDocument();
  });

  test('渲染API性能表格', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 检查API性能表格
    expect(screen.getByText('API性能')).toBeInTheDocument();
    expect(screen.getByText('金融')).toBeInTheDocument();
    expect(screen.getByText('零售')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/financial/data')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/retail/products')).toBeInTheDocument();
  });

  test('渲染活跃告警列表', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 切换到告警标签页
    fireEvent.click(screen.getByText('活跃告警'));

    // 检查告警列表
    expect(screen.getByText('零售')).toBeInTheDocument();
    expect(screen.getByText('金融')).toBeInTheDocument();
    expect(screen.getByText('响应时间超过阈值')).toBeInTheDocument();
    expect(screen.getByText('错误率超过阈值')).toBeInTheDocument();
  });

  test('处理刷新按钮点击', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待初始数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 重置mock以捕获第二次调用
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockClear();
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue(mockDashboardData);

    // 点击刷新按钮
    fireEvent.click(screen.getByText('刷新'));

    // 检查是否重新调用了API
    await waitFor(() => {
      expect(MockedIndustryMetricsService.prototype.getPerformanceDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  test('处理时间范围变化', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待初始数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 重置mock以捕获新的调用
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockClear();
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue(mockDashboardData);

    // 选择不同的时间范围
    const timeRangeSelect = screen.getByLabelText('时间范围');
    fireEvent.mouseDown(timeRangeSelect);
    fireEvent.click(screen.getByText('过去7天'));

    // 检查是否重新调用了API
    await waitFor(() => {
      expect(MockedIndustryMetricsService.prototype.getPerformanceDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  test('处理图表类型变化', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待初始数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 选择不同的图表类型
    const chartTypeSelect = screen.getByLabelText('图表类型');
    fireEvent.mouseDown(chartTypeSelect);
    fireEvent.click(screen.getByText('请求数量'));

    // 确认图表类型已更改（通过检查图表相关组件是否仍在文档中）
    expect(screen.getByText('性能趋势')).toBeInTheDocument();
  });

  test('处理告警解决', async () => {
    // Arrange
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待初始数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 切换到告警标签页
    fireEvent.click(screen.getByText('活跃告警'));

    // 重置mock以捕获新的调用
    MockedIndustryMetricsService.prototype.resolvePerformanceAlert.mockClear();
    MockedIndustryMetricsService.prototype.resolvePerformanceAlert.mockResolvedValue(true);
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue({
      ...mockDashboardData,
      activeAlerts: []
    });

    // 点击标记为已解决按钮
    const resolveButtons = screen.getAllByText('标记为已解决');
    fireEvent.click(resolveButtons[0]);

    // 检查是否调用了解决告警方法
    await waitFor(() => {
      expect(MockedIndustryMetricsService.prototype.resolvePerformanceAlert).toHaveBeenCalledTimes(1);
    });
  });

  test('渲染特定行业的仪表盘', async () => {
    // Arrange
    const industryId = 'industry-1';
    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard industryId={industryId} />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 检查标题是否包含行业ID
    expect(screen.getByText('行业API性能监控')).toBeInTheDocument();
    // 检查是否传递了industryId参数
    expect(MockedIndustryMetricsService.prototype.getPerformanceDashboardData).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      industryId
    );
  });

  test('处理加载错误', async () => {
    // Arrange - 模拟API错误
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockRejectedValue(
      new Error('API请求失败')
    );

    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待错误状态显示
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument();
      expect(screen.getByText('API请求失败')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
    });

    // 测试重试按钮
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockClear();
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue(mockDashboardData);

    fireEvent.click(screen.getByRole('button', { name: /重试/i }));

    // 检查是否重新调用了API
    await waitFor(() => {
      expect(MockedIndustryMetricsService.prototype.getPerformanceDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  test('渲染空数据状态', async () => {
    // Arrange - 模拟空数据
    MockedIndustryMetricsService.prototype.getPerformanceDashboardData.mockResolvedValue(emptyDashboardData);

    const TestComponent = () => {
      return (
        <ThemeProvider theme={theme}>
          <IndustryMetricsDashboard />
        </ThemeProvider>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert - 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // 检查API性能表格的空状态
    expect(screen.getByText('API性能')).toBeInTheDocument();
    // 切换到告警标签页
    fireEvent.click(screen.getByText('活跃告警'));
    // 检查告警的空状态
    expect(screen.getByText('暂无活跃告警')).toBeInTheDocument();
  });
});
