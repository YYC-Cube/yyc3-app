/**
 * @file 行业管理组件测试
 * @description 测试IndustryManagement组件的功能和交互
 * @author YYC
 * @created 2024-10-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndustryManagement } from './industry-management';
import { IndustryApiService } from '@/lib/industry/industry-api';
import { IndustryType } from '@/types/industry';

// Mock the IndustryApiService
jest.mock('@/lib/industry/industry-api');

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
    status: 'active',
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-15T00:00:00Z'
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
    status: 'active',
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-15T00:00:00Z'
  }
];

describe('IndustryManagement组件测试', () => {
  beforeEach(() => {
    // Mock the IndustryApiService methods
    (IndustryApiService.getAllIndustries as jest.Mock).mockResolvedValue(mockIndustries);
    (IndustryApiService.getIndustryById as jest.Mock).mockResolvedValue(mockIndustries[0]);
    (IndustryApiService.createIndustry as jest.Mock).mockResolvedValue({
      ...mockIndustries[0],
      id: '3'
    });
    (IndustryApiService.updateIndustry as jest.Mock).mockResolvedValue(mockIndustries[0]);
    (IndustryApiService.deleteIndustry as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('组件渲染时应显示行业列表', async () => {
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 检查是否显示行业名称
    expect(screen.getByText('科技行业')).toBeInTheDocument();
    expect(screen.getByText('金融行业')).toBeInTheDocument();
    
    // 检查是否调用了API
    expect(IndustryApiService.getAllIndustries).toHaveBeenCalledTimes(1);
  });

  test('点击添加行业按钮应打开表单', async () => {
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 点击添加按钮
    fireEvent.click(screen.getByText('添加行业'));
    
    // 检查表单是否打开
    expect(screen.getByText('创建新行业')).toBeInTheDocument();
  });

  test('提交表单应创建新行业', async () => {
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 点击添加按钮
    fireEvent.click(screen.getByText('添加行业'));
    
    // 填写表单
    fireEvent.change(screen.getByLabelText(/行业名称/i), {
      target: { value: '医疗行业' }
    });
    
    fireEvent.change(screen.getByLabelText(/行业类型/i), {
      target: { value: IndustryType.HEALTHCARE }
    });
    
    fireEvent.change(screen.getByLabelText(/子域名/i), {
      target: { value: 'healthcare' }
    });
    
    // 提交表单
    fireEvent.click(screen.getByText('保存'));
    
    // 验证API调用
    await waitFor(() => {
      expect(IndustryApiService.createIndustry).toHaveBeenCalled();
    });
  });

  test('搜索功能应过滤行业列表', async () => {
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 输入搜索关键词
    fireEvent.change(screen.getByPlaceholderText(/搜索行业名称或类型/i), {
      target: { value: '科技' }
    });
    
    // 验证搜索结果
    expect(screen.getByText('科技行业')).toBeInTheDocument();
    expect(screen.queryByText('金融行业')).not.toBeInTheDocument();
  });

  test('删除行业功能应正常工作', async () => {
    // Mock window.confirm to always return true
    const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<IndustryManagement />);
    
    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('行业管理')).toBeInTheDocument();
    });
    
    // 查找删除按钮并点击
    // 注意：实际项目中需要根据具体的组件结构来定位删除按钮
    const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
    fireEvent.click(deleteButtons[0]);
    
    // 验证API调用
    await waitFor(() => {
      expect(IndustryApiService.deleteIndustry).toHaveBeenCalled();
    });
    
    confirmMock.mockRestore();
  });
});
