/**
 * @file 行业统计仪表板组件测试
 * @description 测试行业统计仪表板的渲染和交互功能
 * @author YYC
 * @created 2024-10-15
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { IndustryStatsDashboard } from './industry-stats-dashboard';
import { IndustryStatsService } from '@/lib/industry/industry-stats-service';
import { IndustryStatus, IndustryType } from '@/types/industry';

// 模拟IndustryStatsService
jest.mock('@/lib/industry/industry-stats-service');
const mockIndustryStatsService = IndustryStatsService as jest.Mocked<typeof IndustryStatsService>;

// 模拟统计数据
const mockStats = {
  totalCount: 24,
  activeCount: 18,
  inactiveCount: 6,
  byType: {
    [IndustryType.TECHNOLOGY]: 3,
    [IndustryType.FINANCE]: 4,
    [IndustryType.HEALTHCARE]: 2,
    [IndustryType.EDUCATION]: 2,
    [IndustryType.RETAIL]: 3,
    [IndustryType.MANUFACTURING]: 2,
    [IndustryType.AUTOMOTIVE]: 1,
    [IndustryType.TRANSPORTATION]: 1,
    [IndustryType.ENERGY]: 1,
    [IndustryType.CONSTRUCTION]: 1,
    [IndustryType.REAL_ESTATE]: 1,
    [IndustryType.MEDIA]: 1,
    [IndustryType.ENTERTAINMENT]: 1,
    [IndustryType.TELECOMMUNICATIONS]: 1
  },
  proxyEnabledRate: 75,
  averages: {
    descriptionLength: 150
  },
  recentlyCreated: [
    {
      id: '1',
      name: '新建科技行业',
      type: IndustryType.TECHNOLOGY,
      status: IndustryStatus.ACTIVE,
      createdAt: '2024-10-15T10:00:00Z',
      icon: 'cloud'
    },
    {
      id: '2',
      name: '新建金融行业',
      type: IndustryType.FINANCE,
      status: IndustryStatus.ACTIVE,
      createdAt: '2024-10-14T14:30:00Z',
      icon: 'bank'
    }
  ]
};

// 模拟趋势数据
const mockTrends = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    newIndustries: Math.floor(Math.random() * 3),
    activeIndustries: 15 + Math.floor(Math.random() * 5)
  };
});

// 模拟类型分布数据
const mockDistribution = [
  { name: '科技', value: 3, color: '#0088FE' },
  { name: '金融', value: 4, color: '#00C49F' },
  { name: '医疗', value: 2, color: '#FFBB28' },
  { name: '教育', value: 2, color: '#FF8042' },
  { name: '零售', value: 3, color: '#8884D8' },
  { name: '其他', value: 10, color: '#82ca9d' }
];

// 模拟健康报告数据
const mockHealthReport = {
  overallHealth: 85,
  issues: [
    {
      type: 'missing_subdomain',
      severity: 'medium',
      affectedIndustries: 3,
      description: '部分行业缺少子域名配置'
    },
    {
      type: 'inactive_industries',
      severity: 'low',
      affectedIndustries: 6,
      description: '有6个行业处于非活跃状态'
    }
  ],
  recommendations: [
    '为所有行业配置有效的子域名',
    '检查并激活非活跃行业'
  ]
};

describe('IndustryStatsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIndustryStatsService.getIndustryStats.mockResolvedValue(mockStats);
    mockIndustryStatsService.getIndustryTrends.mockResolvedValue(mockTrends);
    mockIndustryStatsService.getIndustryTypeDistribution.mockResolvedValue(mockDistribution);
    mockIndustryStatsService.getIndustryHealthReport.mockResolvedValue(mockHealthReport);
  });

  it('应该渲染加载状态', () => {
    render(<IndustryStatsDashboard />);
    
    expect(screen.getByText('加载统计数据中...')).toBeInTheDocument();
  });

  it('应该正确渲染统计数据', async () => {
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('总行业数')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('活跃行业')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('非活跃行业')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('代理启用率')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('应该渲染最近创建的行业列表', async () => {
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('最近创建的行业')).toBeInTheDocument();
      expect(screen.getByText('新建科技行业')).toBeInTheDocument();
      expect(screen.getByText('新建金融行业')).toBeInTheDocument();
    });
  });

  it('应该渲染健康状态报告', async () => {
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业健康状态')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('部分行业缺少子域名配置')).toBeInTheDocument();
      expect(screen.getByText('为所有行业配置有效的子域名')).toBeInTheDocument();
    });
  });

  it('应该显示错误状态', async () => {
    mockIndustryStatsService.getIndustryStats.mockRejectedValue(new Error('加载失败'));
    
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('加载统计数据失败')).toBeInTheDocument();
      expect(screen.getByText('无法获取行业统计信息')).toBeInTheDocument();
    });
  });

  it('应该在错误状态下显示重试按钮', async () => {
    mockIndustryStatsService.getIndustryStats.mockRejectedValue(new Error('加载失败'));
    
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  it('应该在点击重试按钮后重新加载数据', async () => {
    // 第一次调用失败，第二次调用成功
    const mockGetIndustryStats = mockIndustryStatsService.getIndustryStats;
    mockGetIndustryStats.mockImplementationOnce(() => Promise.reject(new Error('加载失败')));
    mockGetIndustryStats.mockImplementationOnce(() => Promise.resolve(mockStats));
    
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    // 确认显示错误
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    // 点击重试按钮
    const retryButton = screen.getByText('重试');
    await act(async () => {
      retryButton.click();
    });

    // 确认重新加载并成功显示数据
    await waitFor(() => {
      expect(screen.getByText('24')).toBeInTheDocument();
    });
  });

  it('应该正确显示图表标题和说明', async () => {
    await act(async () => {
      render(<IndustryStatsDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业趋势（过去30天）')).toBeInTheDocument();
      expect(screen.getByText('行业类型分布')).toBeInTheDocument();
    });
  });
});
