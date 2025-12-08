/**
 * @file 行业API服务测试
 * @description 测试IndustryApiService的各种方法和功能
 * @author YYC
 * @created 2024-10-15
 */

import { IndustryApiService } from './industry-api';
import { IndustryType, IndustryStatus, CreateIndustryRequest, UpdateIndustryRequest } from '@/types/industry';

describe('IndustryApiService测试', () => {
  // 重置服务中的数据
  beforeEach(() => {
    // 重置模拟数据（在实际项目中可能需要更复杂的重置逻辑）
    IndustryApiService.clearIndustries();
    
    // 添加一些测试数据
    const mockIndustries = [
      {
        id: '1',
        name: '科技行业',
        type: IndustryType.TECHNOLOGY,
        description: '高科技行业',
        subdomain: 'tech',
        proxyEnabled: true,
        proxyConfig: {
          target: 'https://api.tech.example.com',
          timeout: 5000
        },
        theme: 'blue',
        icon: 'Cloud',
        status: IndustryStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '金融行业',
        type: IndustryType.FINANCE,
        description: '金融服务行业',
        subdomain: 'finance',
        proxyEnabled: false,
        theme: 'green',
        icon: 'Wallet',
        status: IndustryStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    mockIndustries.forEach(industry => {
      // 在实际项目中，这里应该使用正确的方法来添加数据
      // 这里只是为了测试而模拟
      (IndustryApiService as any).industries.push(industry);
    });
  });

  test('getAllIndustries方法应返回所有行业', async () => {
    const industries = await IndustryApiService.getAllIndustries();
    
    expect(industries).toBeDefined();
    expect(Array.isArray(industries)).toBe(true);
    expect(industries.length).toBeGreaterThan(0);
    expect(industries[0].id).toBeDefined();
    expect(industries[0].name).toBeDefined();
  });

  test('getIndustryById方法应返回指定ID的行业', async () => {
    const industry = await IndustryApiService.getIndustryById('1');
    
    expect(industry).toBeDefined();
    expect(industry.id).toBe('1');
    expect(industry.name).toBe('科技行业');
  });

  test('getIndustryById方法在行业不存在时应抛出错误', async () => {
    await expect(IndustryApiService.getIndustryById('999')).rejects.toThrow();
  });

  test('createIndustry方法应创建新行业', async () => {
    const newIndustry: CreateIndustryRequest = {
      name: '医疗行业',
      type: IndustryType.HEALTHCARE,
      description: '医疗健康行业',
      subdomain: 'healthcare',
      proxyEnabled: true,
      proxyConfig: {
        target: 'https://api.healthcare.example.com',
        timeout: 5000
      },
      theme: 'teal',
      icon: 'Activity',
      status: IndustryStatus.ACTIVE
    };
    
    const createdIndustry = await IndustryApiService.createIndustry(newIndustry);
    
    expect(createdIndustry).toBeDefined();
    expect(createdIndustry.id).toBeDefined();
    expect(createdIndustry.name).toBe('医疗行业');
    expect(createdIndustry.type).toBe(IndustryType.HEALTHCARE);
    
    // 验证新行业是否已添加到列表中
    const allIndustries = await IndustryApiService.getAllIndustries();
    const found = allIndustries.find(ind => ind.id === createdIndustry.id);
    expect(found).toBeDefined();
  });

  test('updateIndustry方法应更新现有行业', async () => {
    const updateData: UpdateIndustryRequest = {
      name: '更新后的科技行业',
      description: '更新后的描述',
      theme: 'purple'
    };
    
    const updatedIndustry = await IndustryApiService.updateIndustry('1', updateData);
    
    expect(updatedIndustry).toBeDefined();
    expect(updatedIndustry.id).toBe('1');
    expect(updatedIndustry.name).toBe('更新后的科技行业');
    expect(updatedIndustry.description).toBe('更新后的描述');
    expect(updatedIndustry.theme).toBe('purple');
  });

  test('deleteIndustry方法应删除指定ID的行业', async () => {
    const result = await IndustryApiService.deleteIndustry('1');
    
    expect(result.success).toBe(true);
    
    // 验证行业是否已被删除
    await expect(IndustryApiService.getIndustryById('1')).rejects.toThrow();
  });

  test('getIndustriesByType方法应按类型过滤行业', async () => {
    const techIndustries = await IndustryApiService.getIndustriesByType(IndustryType.TECHNOLOGY);
    
    expect(techIndustries).toBeDefined();
    expect(techIndustries.length).toBe(1);
    expect(techIndustries[0].type).toBe(IndustryType.TECHNOLOGY);
  });

  test('getActiveIndustries方法应返回所有活跃状态的行业', async () => {
    const activeIndustries = await IndustryApiService.getActiveIndustries();
    
    expect(activeIndustries).toBeDefined();
    activeIndustries.forEach(industry => {
      expect(industry.status).toBe(IndustryStatus.ACTIVE);
    });
  });

  test('updateIndustryStatus方法应更新行业状态', async () => {
    const result = await IndustryApiService.updateIndustryStatus('1', IndustryStatus.INACTIVE);
    
    expect(result).toBeDefined();
    expect(result.status).toBe(IndustryStatus.INACTIVE);
    
    // 验证状态是否已更新
    const updatedIndustry = await IndustryApiService.getIndustryById('1');
    expect(updatedIndustry.status).toBe(IndustryStatus.INACTIVE);
  });
});
