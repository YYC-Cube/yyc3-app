/**
 * @file 行业统计服务测试
 * @description 测试行业数据统计和分析功能
 * @author YYC
 * @created 2024-10-15
 */

import { IndustryStatsService, IndustryStats } from './industry-stats-service';
import { IndustryApiService } from './industry-api';
import { Industry, IndustryStatus, IndustryType } from '@/types/industry';

// 模拟IndustryApiService
jest.mock('./industry-api');
const mockIndustryApiService = IndustryApiService as jest.Mocked<typeof IndustryApiService>;

// 测试数据
const mockIndustries: Industry[] = [
  {
    id: '1',
    name: '科技行业示例',
    type: IndustryType.TECHNOLOGY,
    description: '这是一个科技行业的详细描述，包含了各种科技元素和创新点。',
    status: IndustryStatus.ACTIVE,
    subdomain: 'tech',
    proxyEnabled: true,
    proxyConfig: {
      target: 'https://api.tech.example.com',
      timeout: 5000
    },
    createdAt: '2024-10-10T08:00:00Z',
    updatedAt: '2024-10-12T10:00:00Z',
    icon: 'cloud',
    theme: 'blue'
  },
  {
    id: '2',
    name: '金融行业示例',
    type: IndustryType.FINANCE,
    description: '金融行业示例描述',
    status: IndustryStatus.ACTIVE,
    subdomain: 'finance',
    proxyEnabled: true,
    proxyConfig: {
      target: 'https://api.finance.example.com',
      timeout: 3000
    },
    createdAt: '2024-10-11T09:00:00Z',
    updatedAt: '2024-10-13T11:00:00Z',
    icon: 'bank',
    theme: 'green'
  },
  {
    id: '3',
    name: '医疗健康行业',
    type: IndustryType.HEALTHCARE,
    description: '医疗健康行业描述较长，包含了医疗服务、健康管理等多个方面的内容。',
    status: IndustryStatus.INACTIVE,
    subdomain: 'health',
    proxyEnabled: false,
    createdAt: '2024-10-09T14:00:00Z',
    updatedAt: '2024-10-09T14:00:00Z',
    icon: 'hospital',
    theme: 'red'
  },
  {
    id: '4',
    name: '教育行业示例',
    type: IndustryType.EDUCATION,
    description: '教育行业示例说明',
    status: IndustryStatus.ACTIVE,
    subdomain: '',
    proxyEnabled: false,
    createdAt: '2024-10-12T16:00:00Z',
    updatedAt: '2024-10-14T09:00:00Z',
    icon: 'school',
    theme: 'yellow'
  },
  {
    id: '5',
    name: '零售行业示例',
    type: IndustryType.RETAIL,
    description: '零售行业的简单描述',
    status: IndustryStatus.ACTIVE,
    subdomain: 'retail',
    proxyEnabled: true,
    proxyConfig: {
      target: 'https://api.retail.example.com'
    },
    createdAt: '2024-10-13T10:00:00Z',
    updatedAt: '2024-10-13T10:00:00Z',
    icon: 'shopping-cart',
    theme: 'purple'
  }
];

describe('IndustryStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIndustryApiService.getAllIndustries.mockResolvedValue(mockIndustries);
  });

  describe('getIndustryStats', () => {
    it('应该正确计算行业基本统计数据', async () => {
      const stats = await IndustryStatsService.getIndustryStats();

      expect(stats.totalCount).toBe(5);
      expect(stats.activeCount).toBe(4);
      expect(stats.inactiveCount).toBe(1);
      expect(stats.byType[IndustryType.TECHNOLOGY]).toBe(1);
      expect(stats.byType[IndustryType.FINANCE]).toBe(1);
      expect(stats.byType[IndustryType.HEALTHCARE]).toBe(1);
      expect(stats.byType[IndustryType.EDUCATION]).toBe(1);
      expect(stats.byType[IndustryType.RETAIL]).toBe(1);
      expect(stats.proxyEnabledRate).toBe(60); // 3/5 * 100 = 60%
    });

    it('应该正确获取最近创建的行业', async () => {
      const stats = await IndustryStatsService.getIndustryStats();

      expect(stats.recentlyCreated).toHaveLength(5);
      expect(stats.recentlyCreated[0].id).toBe('5'); // 最近创建的行业
      expect(stats.recentlyCreated[1].id).toBe('4');
      expect(stats.recentlyCreated[2].id).toBe('2');
      expect(stats.recentlyCreated[3].id).toBe('1');
      expect(stats.recentlyCreated[4].id).toBe('3');
    });

    it('应该正确计算平均描述长度', async () => {
      const stats = await IndustryStatsService.getIndustryStats();
      
      // 计算实际的平均描述长度
      const descriptions = mockIndustries.map(ind => ind.description?.length || 0);
      const avgLength = Math.round(descriptions.reduce((sum, len) => sum + len, 0) / descriptions.length);
      
      expect(stats.averages.descriptionLength).toBe(avgLength);
    });

    it('当API调用失败时应该抛出错误', async () => {
      mockIndustryApiService.getAllIndustries.mockRejectedValue(new Error('API错误'));
      
      await expect(IndustryStatsService.getIndustryStats()).rejects.toThrow('无法获取行业统计数据');
    });
  });

  describe('getIndustryTrends', () => {
    it('应该返回过去30天的趋势数据', async () => {
      const trends = await IndustryStatsService.getIndustryTrends();
      
      expect(trends).toHaveLength(30);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('newIndustries');
        expect(trend).toHaveProperty('activeIndustries');
        expect(typeof trend.newIndustries).toBe('number');
        expect(typeof trend.activeIndustries).toBe('number');
        expect(trend.newIndustries).toBeGreaterThanOrEqual(0);
        expect(trend.activeIndustries).toBeGreaterThanOrEqual(10); // 模拟数据中设置的最小值
      });
    });

    it('趋势数据应该按日期升序排列', async () => {
      const trends = await IndustryStatsService.getIndustryTrends();
      
      for (let i = 1; i < trends.length; i++) {
        const prevDate = new Date(trends[i-1].date);
        const currentDate = new Date(trends[i].date);
        expect(currentDate >= prevDate).toBe(true);
      }
    });
  });

  describe('getIndustryTypeDistribution', () => {
    it('应该返回正确的行业类型分布数据', async () => {
      const distribution = await IndustryStatsService.getIndustryTypeDistribution();
      
      expect(distribution).toHaveLength(5);
      
      // 验证每种类型都有正确的数据格式
      distribution.forEach(item => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('color');
        expect(typeof item.value).toBe('number');
      });
      
      // 验证每种类型的数量都是1
      const values = distribution.map(item => item.value);
      expect(values.every(val => val === 1)).toBe(true);
    });

    it('当API调用失败时应该返回空数组', async () => {
      mockIndustryApiService.getAllIndustries.mockRejectedValue(new Error('API错误'));
      
      const distribution = await IndustryStatsService.getIndustryTypeDistribution();
      expect(distribution).toEqual([]);
    });
  });

  describe('getIndustryHealthReport', () => {
    it('应该正确生成健康状态报告', async () => {
      const report = await IndustryStatsService.getIndustryHealthReport();
      
      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
      
      // 验证发现的问题
      const missingSubdomainIssue = report.issues.find((issue: any) => issue.type === 'missing_subdomain');
      expect(missingSubdomainIssue).toBeDefined();
      expect(missingSubdomainIssue.severity).toBe('medium');
      expect(missingSubdomainIssue.affectedIndustries).toBe(1); // 只有ID为4的行业没有子域名
      
      // 验证推荐
      expect(report.recommendations).toContain('为所有行业配置有效的子域名');
    });

    it('当API调用失败时应该抛出错误', async () => {
      mockIndustryApiService.getAllIndustries.mockRejectedValue(new Error('API错误'));
      
      await expect(IndustryStatsService.getIndustryHealthReport()).rejects.toThrow('无法生成行业健康报告');
    });

    it('当系统健康时应该返回健康分数和良好建议', async () => {
      // 创建一个健康的行业数据集
      const healthyIndustries = mockIndustries.map(industry => ({
        ...industry,
        subdomain: industry.subdomain || 'default',
        proxyEnabled: false // 禁用代理，避免不完整代理配置问题
      }));
      
      mockIndustryApiService.getAllIndustries.mockResolvedValue(healthyIndustries);
      
      const report = await IndustryStatsService.getIndustryHealthReport();
      
      expect(report.overallHealth).toBe(100);
      expect(report.issues.length).toBe(0);
      expect(report.recommendations).toContain('当前系统运行良好，暂无特别建议');
    });
  });
});
