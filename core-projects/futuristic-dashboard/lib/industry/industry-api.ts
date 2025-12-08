/**
 * @file 行业API服务
 * @description 处理行业相关的API调用和数据交互
 * @module industry/api
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { Industry, IndustryType } from '@/types/industry';

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟行业数据
const mockIndustries: Industry[] = [
  {
    id: 'yyc3-dc',
    name: '云数据中心',
    description: '云服务数据中心管理平台',
    subdomain: 'dc.yyc3.com',
    icon: 'database',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'yyc3-finance',
    name: '金融科技',
    description: '金融科技解决方案平台',
    subdomain: 'finance.yyc3.com',
    icon: 'trending-up',
    status: 'active',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'yyc3-healthcare',
    name: '智慧医疗',
    description: '智慧医疗健康管理系统',
    subdomain: 'healthcare.yyc3.com',
    icon: 'activity',
    status: 'active',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
];

/**
 * 行业API服务类
 */
export class IndustryApiService {
  /**
   * 获取所有行业列表
   * @returns Promise<Industry[]> 行业列表
   */
  static async getAllIndustries(): Promise<Industry[]> {
    try {
      // 模拟API调用延迟
      await delay(300);
      return [...mockIndustries];
    } catch (error) {
      console.error('获取行业列表失败:', error);
      throw new Error('获取行业列表失败');
    }
  }

  /**
   * 根据ID获取行业信息
   * @param id 行业ID
   * @returns Promise<Industry | null> 行业信息或null
   */
  static async getIndustryById(id: IndustryType): Promise<Industry | null> {
    try {
      await delay(200);
      const industry = mockIndustries.find(ind => ind.id === id);
      return industry || null;
    } catch (error) {
      console.error(`获取行业 ${id} 失败:`, error);
      throw new Error(`获取行业 ${id} 失败`);
    }
  }

  /**
   * 创建新行业
   * @param industryData 行业数据
   * @returns Promise<Industry> 创建的行业信息
   */
  static async createIndustry(industryData: Omit<Industry, 'id' | 'createdAt' | 'updatedAt'>): Promise<Industry> {
    try {
      await delay(400);
      
      const newIndustry: Industry = {
        ...industryData,
        id: `yyc3-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockIndustries.push(newIndustry);
      return newIndustry;
    } catch (error) {
      console.error('创建行业失败:', error);
      throw new Error('创建行业失败');
    }
  }

  /**
   * 更新行业信息
   * @param id 行业ID
   * @param industryData 更新的行业数据
   * @returns Promise<Industry | null> 更新后的行业信息或null
   */
  static async updateIndustry(id: IndustryType, industryData: Partial<Omit<Industry, 'id' | 'createdAt'>>): Promise<Industry | null> {
    try {
      await delay(350);
      
      const index = mockIndustries.findIndex(ind => ind.id === id);
      if (index === -1) return null;
      
      const updatedIndustry: Industry = {
        ...mockIndustries[index],
        ...industryData,
        updatedAt: new Date(),
      };
      
      mockIndustries[index] = updatedIndustry;
      return updatedIndustry;
    } catch (error) {
      console.error(`更新行业 ${id} 失败:`, error);
      throw new Error(`更新行业 ${id} 失败`);
    }
  }

  /**
   * 删除行业
   * @param id 行业ID
   * @returns Promise<boolean> 是否删除成功
   */
  static async deleteIndustry(id: IndustryType): Promise<boolean> {
    try {
      await delay(300);
      
      const index = mockIndustries.findIndex(ind => ind.id === id);
      if (index === -1) return false;
      
      mockIndustries.splice(index, 1);
      return true;
    } catch (error) {
      console.error(`删除行业 ${id} 失败:`, error);
      throw new Error(`删除行业 ${id} 失败`);
    }
  }

  /**
   * 检查子域名是否已存在
   * @param subdomain 子域名
   * @param excludeId 排除的行业ID（用于更新时）
   * @returns Promise<boolean> 是否存在
   */
  static async isSubdomainExists(subdomain: string, excludeId?: IndustryType): Promise<boolean> {
    try {
      await delay(200);
      return mockIndustries.some(ind => 
        ind.subdomain === subdomain && (!excludeId || ind.id !== excludeId)
      );
    } catch (error) {
      console.error('检查子域名失败:', error);
      throw new Error('检查子域名失败');
    }
  }

  /**
   * 激活/停用行业
   * @param id 行业ID
   * @param status 状态
   * @returns Promise<Industry | null> 更新后的行业信息
   */
  static async toggleIndustryStatus(id: IndustryType, status: 'active' | 'inactive'): Promise<Industry | null> {
    return this.updateIndustry(id, { status });
  }
}

// 导出默认实例
export default IndustryApiService;