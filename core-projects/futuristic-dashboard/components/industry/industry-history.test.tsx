/**
 * @file 行业历史记录组件测试
 * @description 测试行业配置历史记录和版本回滚功能的UI组件
 * @module industry-history
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IndustryHistory } from './industry-history';
import { IndustryHistoryService } from '../../lib/industry/industry-history-service';
import { Industry, IndustryConfigHistory } from '../../lib/industry/industry-types';

// 模拟服务
jest.mock('../../lib/industry/industry-history-service');

const mockHistoryService = IndustryHistoryService as jest.MockedClass<typeof IndustryHistoryService>;

// 模拟历史记录数据
const mockHistoryData: IndustryConfigHistory[] = [
  {
    id: 'hist3',
    industryId: 'ind1',
    config: {
      name: '金融科技3.0',
      code: 'FINTECH',
      type: 'technology',
      status: 'active',
      description: '金融科技行业最新版',
      subdomain: 'fintech',
      icon: 'bank',
      proxyConfig: {
        enabled: true,
        host: 'proxy.fintech.yyc3.com',
        port: 8080,
        username: 'fintech_user',
        password: 'encrypted_password'
      }
    },
    version: 3,
    operatorId: 'user1',
    operatorName: '张三',
    changeReason: '更新到最新功能',
    changeSummary: '更新名称和描述',
    createdAt: new Date('2024-10-12')
  },
  {
    id: 'hist2',
    industryId: 'ind1',
    config: {
      name: '金融科技',
      code: 'FINTECH',
      type: 'technology',
      status: 'active',
      description: '金融科技行业修改版',
      subdomain: 'fintech',
      icon: 'bank',
      proxyConfig: {
        enabled: true,
        host: 'proxy.fintech.yyc3.com',
        port: 8080,
        username: 'fintech_user',
        password: 'encrypted_password'
      }
    },
    version: 2,
    operatorId: 'user2',
    operatorName: '李四',
    changeReason: '更新描述信息',
    changeSummary: '修改行业描述',
    createdAt: new Date('2024-10-10')
  },
  {
    id: 'hist1',
    industryId: 'ind1',
    config: {
      name: '金融科技',
      code: 'FINTECH',
      type: 'finance',
      status: 'active',
      description: '金融科技行业初始版',
      subdomain: 'fintech',
      icon: 'bank',
      proxyConfig: {
        enabled: false,
        host: '',
        port: 0,
        username: '',
        password: ''
      }
    },
    version: 1,
    operatorId: 'admin',
    operatorName: '管理员',
    changeReason: '初始创建',
    changeSummary: '创建行业',
    createdAt: new Date('2024-10-01')
  }
];

// 模拟版本比较结果
const mockDiffResult = {
  changedFields: ['name', 'description', 'type'],
  differences: {
    name: {
      from: '金融科技',
      to: '金融科技3.0'
    },
    description: {
      from: '金融科技行业修改版',
      to: '金融科技行业最新版'
    },
    type: {
      from: 'finance',
      to: 'technology'
    }
  },
  summary: '名称、描述和类型发生变更'
};

// 模拟回滚结果
const mockRollbackResult: Industry = {
  id: 'ind1',
  name: '金融科技',
  code: 'FINTECH',
  type: 'finance',
  status: 'active',
  description: '金融科技行业初始版',
  subdomain: 'fintech',
  icon: 'bank',
  proxyConfig: {
    enabled: false,
    host: '',
    port: 0,
    username: '',
    password: ''
  },
  createdAt: new Date('2024-10-01'),
  updatedAt: new Date('2024-10-15')
};

describe('IndustryHistory Component', () => {
  let mockServiceInstance: jest.Mocked<IndustryHistoryService>;
  const mockOnVersionRollback = jest.fn();
  const mockOperatorInfo = {
    id: 'current_user',
    name: '当前用户'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceInstance = {
      getIndustryHistory: jest.fn(),
      getHistoryById: jest.fn(),
      compareVersions: jest.fn(),
      rollbackToVersion: jest.fn()
    } as any;
    mockHistoryService.mockImplementation(() => mockServiceInstance);
  });

  it('应该正确加载和显示历史记录列表', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue(mockHistoryData);

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    // 检查加载状态
    expect(screen.getByText('加载历史记录...')).toBeInTheDocument();

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载历史记录...')).not.toBeInTheDocument();
    });

    // 检查历史记录是否正确显示
    expect(screen.getByText('版本 3')).toBeInTheDocument();
    expect(screen.getByText('版本 2')).toBeInTheDocument();
    expect(screen.getByText('版本 1')).toBeInTheDocument();
    expect(screen.getByText('金融科技3.0')).toBeInTheDocument();
    expect(screen.getByText('更新到最新功能')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  it('应该处理加载历史记录失败的情况', async () => {
    mockServiceInstance.getIndustryHistory.mockRejectedValue(new Error('Failed to fetch history'));

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    // 等待错误状态
    await waitFor(() => {
      expect(screen.getByText('加载历史记录失败')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch history')).toBeInTheDocument();
    });

    // 测试重试按钮
    const retryButton = screen.getByText('重试');
    fireEvent.click(retryButton);
    expect(mockServiceInstance.getIndustryHistory).toHaveBeenCalledTimes(2);
  });

  it('应该处理空历史记录', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue([]);

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
    });
  });

  it('应该显示版本详情对话框', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue(mockHistoryData);
    mockServiceInstance.getHistoryById.mockResolvedValue(mockHistoryData[0]);

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('版本 3')).toBeInTheDocument();
    });

    // 点击查看详情
    const viewButton = screen.getAllByText('查看')[0];
    fireEvent.click(viewButton);

    // 检查对话框是否打开
    await waitFor(() => {
      expect(screen.getByText('版本详情')).toBeInTheDocument();
      expect(screen.getByText('版本号: 3')).toBeInTheDocument();
      expect(screen.getByText('操作人: 张三')).toBeInTheDocument();
      expect(screen.getByText('操作原因: 更新到最新功能')).toBeInTheDocument();
    });

    // 关闭对话框
    const closeButton = screen.getByText('关闭');
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText('版本详情')).not.toBeInTheDocument();
    });
  });

  it('应该显示版本比较对话框', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue(mockHistoryData);
    mockServiceInstance.compareVersions.mockResolvedValue(mockDiffResult);

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('版本 3')).toBeInTheDocument();
    });

    // 点击比较按钮
    const compareButton = screen.getByText('比较版本');
    fireEvent.click(compareButton);

    // 选择版本进行比较
    await waitFor(() => {
      const versionSelects = screen.getAllByRole('combobox');
      expect(versionSelects).toHaveLength(2);
      
      // 选择版本
      fireEvent.change(versionSelects[0], { target: { value: 'hist1' } });
      fireEvent.change(versionSelects[1], { target: { value: 'hist3' } });
      
      // 点击比较
      const doCompareButton = screen.getByText('执行比较');
      fireEvent.click(doCompareButton);
    });

    // 检查比较结果
    await waitFor(() => {
      expect(screen.getByText('版本差异')).toBeInTheDocument();
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('描述')).toBeInTheDocument();
      expect(screen.getByText('类型')).toBeInTheDocument();
    });
  });

  it('应该执行版本回滚操作', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue(mockHistoryData);
    mockServiceInstance.rollbackToVersion.mockResolvedValue(mockRollbackResult);

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('版本 3')).toBeInTheDocument();
    });

    // 点击回滚按钮
    const rollbackButtons = screen.getAllByText('回滚')[0];
    fireEvent.click(rollbackButtons);

    // 输入回滚原因
    await waitFor(() => {
      expect(screen.getByText('确认回滚')).toBeInTheDocument();
      
      const reasonInput = screen.getByPlaceholderText('请输入回滚原因');
      fireEvent.change(reasonInput, { target: { value: '测试回滚功能' } });
      
      const confirmButton = screen.getByText('确认回滚');
      fireEvent.click(confirmButton);
    });

    // 验证回滚调用和回调
    await waitFor(() => {
      expect(mockServiceInstance.rollbackToVersion).toHaveBeenCalledWith({
        industryId: 'ind1',
        historyId: 'hist3',
        version: 3,
        operatorId: 'current_user',
        operatorName: '当前用户',
        reason: '测试回滚功能'
      });
      expect(mockOnVersionRollback).toHaveBeenCalledWith(mockRollbackResult);
      expect(screen.getByText('版本回滚成功')).toBeInTheDocument();
    });
  });

  it('应该处理版本回滚失败的情况', async () => {
    mockServiceInstance.getIndustryHistory.mockResolvedValue(mockHistoryData);
    mockServiceInstance.rollbackToVersion.mockRejectedValue(new Error('Rollback failed'));

    render(
      <IndustryHistory 
        industryId="ind1" 
        onVersionRollback={mockOnVersionRollback}
        operatorInfo={mockOperatorInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('版本 3')).toBeInTheDocument();
    });

    // 点击回滚按钮
    const rollbackButtons = screen.getAllByText('回滚')[0];
    fireEvent.click(rollbackButtons);

    // 输入回滚原因并确认
    await waitFor(() => {
      const reasonInput = screen.getByPlaceholderText('请输入回滚原因');
      fireEvent.change(reasonInput, { target: { value: '测试回滚失败' } });
      
      const confirmButton = screen.getByText('确认回滚');
      fireEvent.click(confirmButton);
    });

    // 验证错误处理
    await waitFor(() => {
      expect(screen.getByText('回滚失败')).toBeInTheDocument();
      expect(screen.getByText('Rollback failed')).toBeInTheDocument();
    });
  });
});
