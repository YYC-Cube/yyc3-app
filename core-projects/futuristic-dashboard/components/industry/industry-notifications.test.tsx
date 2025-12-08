/**
 * @file 行业配置变更通知组件测试
 * @description 测试行业配置变更通知组件的功能和交互
 * @component IndustryNotifications
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IndustryNotifications } from './industry-notifications';
import { industryNotificationService } from '../../lib/industry/industry-notification-service';
import {
  NotificationStatus,
  NotificationPriority,
  NotificationChangeType,
  IndustryNotification
} from '../../lib/industry/industry-notification-types';

// 模拟 industryNotificationService
jest.mock('../../lib/industry/industry-notification-service', () => ({
  industryNotificationService: {
    getNotifications: jest.fn(),
    updateNotificationStatus: jest.fn(),
    deleteBulkNotifications: jest.fn(),
    getUserSubscriptions: jest.fn(),
    createSubscription: jest.fn(),
    updateSubscription: jest.fn()
  }
}));

// 模拟测试数据
const mockNotifications: IndustryNotification[] = [
  {
    id: '1',
    title: '行业配置更新',
    message: '电商行业的配置已更新',
    industryId: 'ecommerce',
    industryName: '电商',
    changeType: NotificationChangeType.UPDATE,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: new Date('2024-10-15T10:00:00Z'),
    changeDetails: [
      {
        field: 'name',
        displayName: '行业名称',
        oldValue: '电子商务',
        newValue: '电商'
      },
      {
        field: 'status',
        displayName: '状态',
        oldValue: 'INACTIVE',
        newValue: 'ACTIVE'
      }
    ]
  },
  {
    id: '2',
    title: '行业创建成功',
    message: '新的金融行业已创建',
    industryId: 'finance',
    industryName: '金融',
    changeType: NotificationChangeType.CREATE,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.READ,
    createdAt: new Date('2024-10-15T09:00:00Z'),
    changeDetails: []
  },
  {
    id: '3',
    title: '状态变更通知',
    message: '科技行业状态已变更',
    industryId: 'tech',
    industryName: '科技',
    changeType: NotificationChangeType.STATUS_CHANGE,
    priority: NotificationPriority.LOW,
    status: NotificationStatus.UNREAD,
    createdAt: new Date('2024-10-15T08:00:00Z'),
    changeDetails: [
      {
        field: 'status',
        displayName: '状态',
        oldValue: 'ACTIVE',
        newValue: 'MAINTENANCE'
      }
    ]
  }
];

const mockSubscriptions = [
  {
    id: 'sub1',
    userId: 'current-user',
    enabled: true,
    notificationTypes: [NotificationChangeType.UPDATE, NotificationChangeType.STATUS_CHANGE],
    priorityFilter: NotificationPriority.MEDIUM,
    createdAt: new Date('2024-10-10T00:00:00Z'),
    updatedAt: new Date('2024-10-10T00:00:00Z')
  }
];

describe('IndustryNotifications 组件', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟返回值
    (industryNotificationService.getNotifications as jest.Mock).mockResolvedValue({
      notifications: mockNotifications,
      total: mockNotifications.length
    });
    
    (industryNotificationService.getUserSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
  });

  test('组件渲染并显示通知列表', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('行业配置变更通知')).toBeInTheDocument();
    });

    // 验证通知项
    expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    expect(screen.getByText('行业创建成功')).toBeInTheDocument();
    expect(screen.getByText('状态变更通知')).toBeInTheDocument();
    
    // 验证行业名称
    expect(screen.getByText('电商')).toBeInTheDocument();
    expect(screen.getByText('金融')).toBeInTheDocument();
    expect(screen.getByText('科技')).toBeInTheDocument();
  });

  test('未读通知样式应该有所不同', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    });

    // 未读通知应该显示为粗体
    const unreadTitle = screen.getByText('行业配置更新');
    expect(unreadTitle).toHaveStyle('font-weight: bold');

    // 已读通知不应该显示为粗体
    const readTitle = screen.getByText('行业创建成功');
    expect(readTitle).not.toHaveStyle('font-weight: bold');
  });

  test('点击通知项应该展开详情', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    });

    // 点击通知项
    const notificationItem = screen.getByText('行业配置更新');
    fireEvent.click(notificationItem);

    // 验证详情是否展开
    expect(screen.getByText('变更详情')).toBeInTheDocument();
    expect(screen.getByText('行业名称')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
  });

  test('点击标记已读按钮应该更新通知状态', async () => {
    // 设置 updateNotificationStatus 模拟
    (industryNotificationService.updateNotificationStatus as jest.Mock).mockResolvedValue({ success: true });

    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    });

    // 获取通知行
    const notificationRow = screen.getByText('行业配置更新').closest('tr');
    if (!notificationRow) {
      throw new Error('找不到通知行');
    }

    // 获取标记已读按钮
    const markReadButton = notificationRow.querySelector('button');
    if (!markReadButton) {
      throw new Error('找不到标记已读按钮');
    }

    // 点击标记已读按钮
    fireEvent.click(markReadButton);

    // 验证 updateNotificationStatus 被调用
    await waitFor(() => {
      expect(industryNotificationService.updateNotificationStatus).toHaveBeenCalledWith({
        notificationIds: ['1'],
        status: NotificationStatus.READ
      });
    });
  });

  test('选择并删除通知', async () => {
    // 设置 deleteBulkNotifications 模拟
    (industryNotificationService.deleteBulkNotifications as jest.Mock).mockResolvedValue({ success: true });

    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    });

    // 获取通知行的复选框
    const checkboxes = screen.getAllByRole('checkbox');
    // 第一个复选框是全选，第二个是第一个通知
    const firstNotificationCheckbox = checkboxes[1];
    
    // 选择通知
    fireEvent.click(firstNotificationCheckbox);

    // 获取删除按钮
    const deleteButton = screen.getByLabelText('删除所选');
    fireEvent.click(deleteButton);

    // 确认删除对话框
    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    // 点击确认删除
    const confirmDeleteButton = screen.getByText('删除');
    fireEvent.click(confirmDeleteButton);

    // 验证 deleteBulkNotifications 被调用
    await waitFor(() => {
      expect(industryNotificationService.deleteBulkNotifications).toHaveBeenCalledWith(['1']);
    });
  });

  test('点击全选应该选择所有通知', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置更新')).toBeInTheDocument();
    });

    // 获取全选复选框
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    
    // 点击全选
    fireEvent.click(selectAllCheckbox);

    // 验证所有复选框都被选中
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(3); // 全选 + 3个通知
    
    // 跳过第一个全选复选框，检查其他的
    for (let i = 1; i <= 3; i++) {
      expect(checkboxes[i]).toBeChecked();
    }
  });

  test('空状态应该正确显示', async () => {
    // 设置没有通知的情况
    (industryNotificationService.getNotifications as jest.Mock).mockResolvedValue({
      notifications: [],
      total: 0
    });

    await act(async () => {
      render(<IndustryNotifications />);
    });

    // 验证空状态
    await waitFor(() => {
      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });
  });

  test('加载状态应该正确显示', async () => {
    // 创建一个会延迟解析的模拟
    const delayedPromise = new Promise(resolve => 
      setTimeout(() => resolve({ notifications: [], total: 0 }), 100)
    );
    
    (industryNotificationService.getNotifications as jest.Mock).mockImplementation(() => delayedPromise);

    // 渲染组件，但不等待加载完成
    render(<IndustryNotifications />);

    // 检查加载状态
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('错误状态应该正确显示', async () => {
    // 设置错误情况
    (industryNotificationService.getNotifications as jest.Mock).mockRejectedValue(new Error('加载失败'));

    await act(async () => {
      render(<IndustryNotifications />);
    });

    // 验证错误信息
    await waitFor(() => {
      expect(screen.getByText('加载通知失败，请重试')).toBeInTheDocument();
    });
  });

  test('筛选功能应该正常工作', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置变更通知')).toBeInTheDocument();
    });

    // 打开筛选对话框
    const filterButton = screen.getByLabelText('筛选');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText('筛选通知')).toBeInTheDocument();
    });

    // 关闭筛选对话框
    const closeButton = screen.getByRole('button', { name: '取消' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('筛选通知')).not.toBeInTheDocument();
    });
  });

  test('订阅设置对话框应该正常打开', async () => {
    await act(async () => {
      render(<IndustryNotifications />);
    });

    await waitFor(() => {
      expect(screen.getByText('行业配置变更通知')).toBeInTheDocument();
    });

    // 打开订阅设置对话框
    const settingsButton = screen.getByLabelText('订阅设置');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('通知订阅设置')).toBeInTheDocument();
    });

    // 关闭订阅设置对话框
    const closeButton = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('通知订阅设置')).not.toBeInTheDocument();
    });
  });

  test('通过初始行业ID筛选通知', async () => {
    await act(async () => {
      render(<IndustryNotifications initialIndustryId="ecommerce" />);
    });

    // 验证 getNotifications 被调用时包含 industryIds 参数
    await waitFor(() => {
      expect(industryNotificationService.getNotifications).toHaveBeenCalledWith(expect.objectContaining({
        industryIds: ['ecommerce']
      }));
    });
  });
});
