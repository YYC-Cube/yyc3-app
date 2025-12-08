/**
 * @file 行业统计服务
 * @description 提供行业数据统计和分析功能
 * @author YYC
 * @created 2024-10-15
 */

import { Industry, IndustryType, IndustryStatus, IndustryStats } from './industry-types';
import { IndustryApiService } from './industry-api';

/**
 * 行业统计服务
 * 提供行业数据的统计和分析功能
 */
export class IndustryStatsService {
  /**
   * 获取行业统计数据
   * @returns 行业统计信息
   */
  static async getIndustryStats(): Promise<IndustryStats> {
    try {
      const industries = await IndustryApiService.getAllIndustries();
      
      // 计算基本统计数据
      const totalCount = industries.length;
      const activeCount = industries.filter(ind => ind.status === IndustryStatus.ACTIVE).length;
      const inactiveCount = industries.filter(ind => ind.status === IndustryStatus.INACTIVE).length;
      
      // 按类型统计
      const byType: Record<string, number> = {};
      industries.forEach(industry => {
        byType[industry.type] = (byType[industry.type] || 0) + 1;
      });
      
      // 计算代理启用率
      const proxyEnabledCount = industries.filter(ind => ind.proxyEnabled).length;
      const proxyEnabledRate = totalCount > 0 ? (proxyEnabledCount / totalCount) * 100 : 0;
      
      // 获取最近创建的行业（按创建时间排序）
      const recentlyCreated = [...industries]
        .sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      
      // 计算平均描述长度
      const descriptionLengths = industries
        .map(ind => ind.description?.length || 0)
        .filter(len => len > 0);
      const avgDescriptionLength = descriptionLengths.length > 0
        ? descriptionLengths.reduce((sum, len) => sum + len, 0) / descriptionLengths.length
        : 0;
      
      return {
        totalCount,
        activeCount,
        inactiveCount,
        byType,
        proxyEnabledRate: Number(proxyEnabledRate.toFixed(2)),
        recentlyCreated,
        averages: {
          descriptionLength: Math.round(avgDescriptionLength)
        }
      };
    } catch (error) {
      console.error('获取行业统计数据失败:', error);
      throw new Error('无法获取行业统计数据');
    }
  }

  /**
   * 获取行业趋势数据
   * 这里使用模拟数据，实际项目中应从后端获取历史数据
   * @returns 行业趋势数据
   */
  static async getIndustryTrends(): Promise<{
    date: string;
    newIndustries: number;
    activeIndustries: number;
  }[]> {
    // 生成过去30天的模拟趋势数据
    const trends = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        newIndustries: Math.floor(Math.random() * 3), // 0-2个新行业
        activeIndustries: Math.floor(10 + Math.random() * 20) // 10-30个活跃行业
      });
    }
    
    return trends;
  }

  /**
   * 获取行业类型分布数据
   * @returns 行业类型分布数据，格式适合图表展示
   */
  static async getIndustryTypeDistribution(): Promise<{
    name: string;
    value: number;
    color: string;
  }[]> {
    try {
      const industries = await IndustryApiService.getAllIndustries();
      
      // 统计各类型数量
      const typeCounts: Record<string, number> = {};
      industries.forEach(industry => {
        typeCounts[industry.type] = (typeCounts[industry.type] || 0) + 1;
      });
      
      // 为每种类型分配颜色
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
        '#f97316', '#84cc16', '#06b6d4', '#d946ef',
        '#2563eb', '#dc2626', '#059669', '#d97706',
        '#7c3aed', '#db2777', '#4f46e5', '#0e7490',
        '#ea580c', '#65a30d', '#0891b2', '#a21caf'
      ];
      
      // 生成图表数据
      const typeNames = this.getIndustryTypeNames();
      return Object.entries(typeCounts).map(([type, count], index) => ({
        name: typeNames[type] || type,
        value: count,
        color: colors[index % colors.length]
      }));
    } catch (error) {
      console.error('获取行业类型分布失败:', error);
      return [];
    }
  }

  /**
   * 获取行业健康状态报告
   * @returns 行业健康状态报告
   */
  static async getIndustryHealthReport(): Promise<{
    overallHealth: number; // 0-100的健康分数
    issues: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      affectedIndustries: number;
    }[];
    recommendations: string[];
  }> {
    try {
      const industries = await IndustryApiService.getAllIndustries();
      const issues: {
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
        affectedIndustries: number;
      }[] = [];
      const recommendations: string[] = [];
      
      // 检查是否有未设置子域名的行业
      const missingSubdomain = industries.filter(ind => !ind.subdomain || ind.subdomain.trim() === '');
      if (missingSubdomain.length > 0) {
        issues.push({
          type: 'missing_subdomain',
          description: '部分行业未设置子域名',
          severity: 'medium',
          affectedIndustries: missingSubdomain.length
        });
        recommendations.push('为所有行业配置有效的子域名');
      }
      
      // 检查是否有代理配置不完整的行业
      const incompleteProxyConfig = industries.filter(ind => 
        ind.proxyEnabled && (!ind.proxyConfig || !ind.proxyConfig.target)
      );
      if (incompleteProxyConfig.length > 0) {
        issues.push({
          type: 'incomplete_proxy',
          description: '部分启用代理的行业配置不完整',
          severity: 'high',
          affectedIndustries: incompleteProxyConfig.length
        });
        recommendations.push('完善所有启用代理的行业配置');
      }
      
      // 计算健康分数
      let healthScore = 100;
      issues.forEach(issue => {
        if (issue.severity === 'high') healthScore -= 20;
        if (issue.severity === 'medium') healthScore -= 10;
        if (issue.severity === 'low') healthScore -= 5;
      });
      
      // 确保分数在0-100范围内
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      return {
        overallHealth: Math.round(healthScore),
        issues,
        recommendations: recommendations.length > 0 ? recommendations : ['当前系统运行良好，暂无特别建议']
      };
    } catch (error) {
      console.error('生成行业健康报告失败:', error);
      throw new Error('无法生成行业健康报告');
    }
  }

  /**
   * 获取行业类型的中文名称映射
   * @returns 行业类型名称映射
   */
  private static getIndustryTypeNames(): Record<string, string> {
    return {
      [IndustryType.TECHNOLOGY]: '科技行业',
      [IndustryType.FINANCE]: '金融行业',
      [IndustryType.HEALTHCARE]: '医疗健康',
      [IndustryType.EDUCATION]: '教育行业',
      [IndustryType.MANUFACTURING]: '制造业',
      [IndustryType.RETAIL]: '零售业',
      [IndustryType.ECOMMERCE]: '电子商务',
      [IndustryType.TRANSPORTATION]: '交通运输',
      [IndustryType.ENERGY]: '能源行业',
      [IndustryType.TELECOMMUNICATION]: '电信行业',
      [IndustryType.MEDIA]: '媒体娱乐',
      [IndustryType.REAL_ESTATE]: '房地产',
      [IndustryType.LOGISTICS]: '物流行业',
      [IndustryType.AGRICULTURE]: '农业',
      [IndustryType.CHEMICAL]: '化工行业',
      [IndustryType.PHARMACEUTICAL]: '制药行业',
      [IndustryType.AUTOMOTIVE]: '汽车行业',
      [IndustryType.AEROSPACE]: '航空航天',
      [IndustryType.CONSTRUCTION]: '建筑行业',
      [IndustryType.FOOD_BEVERAGE]: '食品饮料',
      [IndustryType.TOURISM]: '旅游行业',
      [IndustryType.HOSPITALITY]: '酒店服务业',
      [IndustryType.SPORTS]: '体育行业',
      [IndustryType.OTHER]: '其他行业'
    };
  }
}