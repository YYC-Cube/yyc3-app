/**
 * @file 行业管理集成测试
 * @description 测试行业管理相关组件和服务之间的交互
 * @author YYC
 * @created 2024-10-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndustryManagement } from '@/components/industry/industry-management';
import { IndustryApiService } from '@/lib/industry/industry-api';
import { IndustryType, IndustryStatus } from '@/types/industry';

// Mock the IndustryApiService
jest.mock('@/lib/industry/industry-api');

describe('行业管理集成测试', () => {
  // 测试数据
  const testIndustries = [
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
      createdAt: '2024-10-15T00:00:00Z',
      updatedAt: '2024-10-15T00:00:00Z'
    }
  ];

  beforeEach(() => {
    // Mock所有API方法
    (IndustryApiService.getAllIndustries as jest.Mock).mockResolvedValue(testIndustries);
    (IndustryApiService.getIndustryById as jest.Mock).mockResolvedValue(testIndustries[0]);
    (IndustryApiService.createIndustry as jest.Mock).mockImplementation((data) => 
      Promise.resolve({
        ...data,
        id: 'new-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
    (IndustryApiService.updateIndustry as jest.Mock).mockImplementation((id, data) => 
      Promise.resolve({
        ...testIndustries[0],
        ...data,
        id,
        updatedAt: new Date().toISOString()
      })
    );
    (IndustryApiService.deleteIndustry as jest.Mock).mockResolvedValue({ success: true });
    (IndustryApiService.updateIndustryStatus as jest.Mock).mockImplementation((id, status) => 
      Promise.resolve({
        ...testIndustries[0],
        id,
        status,
        updatedAt: new Date().toISOString()
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('完整的行业创建流程', async () => {
    // Mock window.confirm 用于删除确认
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    // 渲染组件
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 1. 创建新行业
    fireEvent.click(screen.getByText('添加行业'));
    
    // 填写表单
    fireEvent.change(screen.getByLabelText(/行业名称/i), {
      target: { value: '零售行业' }
    });
    
    fireEvent.change(screen.getByLabelText(/行业类型/i), {
      target: { value: IndustryType.RETAIL }
    });
    
    fireEvent.change(screen.getByLabelText(/子域名/i), {
      target: { value: 'retail' }
    });
    
    fireEvent.change(screen.getByLabelText(/行业描述/i), {
      target: { value: '零售行业描述' }
    });
    
    // 启用代理设置
    const proxyToggle = screen.getByRole('checkbox', { name: /启用代理/i });
    fireEvent.click(proxyToggle);
    
    // 填写代理配置
    fireEvent.change(screen.getByLabelText(/代理目标URL/i), {
      target: { value: 'https://api.retail.example.com' }
    });
    
    // 保存行业
    fireEvent.click(screen.getByText('保存'));
    
    // 验证创建API是否被调用，以及是否传递了正确的参数
    await waitFor(() => {
      expect(IndustryApiService.createIndustry).toHaveBeenCalledWith(expect.objectContaining({
        name: '零售行业',
        type: IndustryType.RETAIL,
        subdomain: 'retail',
        description: '零售行业描述',
        proxyEnabled: true,
        proxyConfig: {
          target: 'https://api.retail.example.com',
          timeout: expect.any(Number)
        }
      }));
    });
    
    // 2. 编辑刚刚创建的行业
    // 注意：在实际测试中，可能需要重新渲染组件或模拟列表更新
    // 这里为了简化，我们直接调用编辑操作
    (IndustryApiService.getIndustryById as jest.Mock).mockResolvedValue({
      id: 'new-id',
      name: '零售行业',
      type: IndustryType.RETAIL,
      description: '零售行业描述',
      subdomain: 'retail',
      proxyEnabled: true,
      proxyConfig: {
        target: 'https://api.retail.example.com',
        timeout: 5000
      },
      theme: 'default',
      icon: 'ShoppingBag',
      status: IndustryStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 假设我们找到了编辑按钮并点击
    const editButtons = screen.getAllByRole('button', { name: /编辑/i });
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      
      // 更新行业名称
      fireEvent.change(screen.getByLabelText(/行业名称/i), {
        target: { value: '更新后的零售行业' }
      });
      
      // 保存更新
      fireEvent.click(screen.getByText('保存'));
      
      // 验证更新API是否被调用
      await waitFor(() => {
        expect(IndustryApiService.updateIndustry).toHaveBeenCalledWith(
          'new-id',
          expect.objectContaining({
            name: '更新后的零售行业'
          })
        );
      });
    }
    
    // 3. 测试搜索和过滤功能
    // 输入搜索关键词
    fireEvent.change(screen.getByPlaceholderText(/搜索行业名称或类型/i), {
      target: { value: '零售' }
    });
    
    // 可以添加更多验证逻辑...
  });

  test('代理配置的验证和保存', async () => {
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 打开创建表单
    fireEvent.click(screen.getByText('添加行业'));
    
    // 填写基本信息
    fireEvent.change(screen.getByLabelText(/行业名称/i), {
      target: { value: '制造业' }
    });
    
    fireEvent.change(screen.getByLabelText(/行业类型/i), {
      target: { value: IndustryType.MANUFACTURING }
    });
    
    // 启用代理
    const proxyToggle = screen.getByRole('checkbox', { name: /启用代理/i });
    fireEvent.click(proxyToggle);
    
    // 测试无效的代理URL
    fireEvent.change(screen.getByLabelText(/代理目标URL/i), {
      target: { value: 'invalid-url' }
    });
    
    // 尝试保存
    fireEvent.click(screen.getByText('保存'));
    
    // 应该显示验证错误
    await waitFor(() => {
      expect(screen.getByText(/URL格式无效/i)).toBeInTheDocument();
    });
    
    // 修复URL并保存
    fireEvent.change(screen.getByLabelText(/代理目标URL/i), {
      target: { value: 'https://api.manufacturing.example.com' }
    });
    
    fireEvent.click(screen.getByText('保存'));
    
    // 验证代理配置是否正确保存
    await waitFor(() => {
      expect(IndustryApiService.createIndustry).toHaveBeenCalledWith(expect.objectContaining({
        name: '制造业',
        type: IndustryType.MANUFACTURING,
        proxyEnabled: true,
        proxyConfig: {
          target: 'https://api.manufacturing.example.com',
          timeout: expect.any(Number)
        }
      }));
    });
  });
});
