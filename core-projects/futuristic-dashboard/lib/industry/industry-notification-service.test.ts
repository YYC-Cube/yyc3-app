/**
 * @file 行业配置变更通知服务测试
 * @description 测试行业配置变更通知服务的各项功能
 * @module industry-notification-service.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  IndustryNotification,
  NotificationStatus,
  NotificationPriority,
  NotificationChangeType,
  NotificationListResponse,
  NotificationStats,
  NotificationSubscription,
  ChangeDetail
} from './industry-notification-types';
import { IndustryNotificationService } from './industry-notification-service';
import { apiClient } from '../api';
import { Industry } from './industry-types';

// Mock apiClient
jest.mock('../api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('IndustryNotificationService', () => {
  let notificationService: IndustryNotificationService;
  let mockIndustry: Industry;
  let mockChangeDetails: ChangeDetail[];

  beforeEach(() => {
    notificationService = new IndustryNotificationService();
    
    // 重置所有mock
    jest.clearAllMocks();

    // 模拟行业数据
    mockIndustry = {
      id: 'ind-001',
      name: '金融科技',
      description: '金融与科技结合的行业',
      category: '金融',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      config: { apiKey: 'test-key' }
    };

    // 模拟变更详情
    mockChangeDetails = [
      { field: 'status', oldValue: 'pending', newValue: 'active', displayName: '状态' },
      { field: 'description', oldValue: '旧描述', newValue: '新描述', displayName: '描述' }
    ];
  });

  describe('createNotification', () => {
    it('应该成功创建通知', async () => {
      // 模拟API响应
      const mockResponse = {
        data: {
          id: 'notif-001',
          industryId: mockIndustry.id,
          industryName: mockIndustry.name,
          changeType: NotificationChangeType.UPDATE,
          title: '金融科技 - 行业更新',
          message: '金融科技的配置已更新。变更内容：状态: pending → active，描述: 旧描述 → 新描述',
          priority: NotificationPriority.LOW,
          status: NotificationStatus.UNREAD,
          userId: 'test-user',
          userName: '测试用户',
          changeDetails: mockChangeDetails,
          createdAt: new Date(),
          updatedAt: new Date()
        } as IndustryNotification
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.createNotification(
        mockIndustry,
        NotificationChangeType.UPDATE,
        mockChangeDetails,
        'test-user',
        '测试用户'
      );

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/notifications', expect.objectContaining({
        industryId: mockIndustry.id,
        industryName: mockIndustry.name,
        changeType: NotificationChangeType.UPDATE,
        userId: 'test-user',
        userName: '测试用户',
        title: expect.any(String),
        message: expect.any(String),
        priority: expect.any(String),
        status: NotificationStatus.UNREAD,
        changeDetails: mockChangeDetails
      }));
    });

    it('应该处理API错误', async () => {
      // 模拟API错误
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      // 执行测试并验证错误
      await expect(
        notificationService.createNotification(
          mockIndustry,
          NotificationChangeType.UPDATE,
          mockChangeDetails
        )
      ).rejects.toThrow('创建行业通知失败: API Error');
    });

    it('应该正确生成不同变更类型的通知标题和消息', async () => {
      // 测试创建类型
      const createResponse = { data: { id: 'notif-create', ...mockChangeDetails } as any };
      mockApiClient.post.mockResolvedValueOnce(createResponse);

      await notificationService.createNotification(
        mockIndustry,
        NotificationChangeType.CREATE,
        []
      );

      // 验证POST调用包含正确的标题和消息
      const postCall = mockApiClient.post.mock.calls[0][1];
      expect(postCall.title).toContain('行业创建');
      expect(postCall.message).toContain('已创建');
    });
  });

  describe('getNotifications', () => {
    it('应该成功获取通知列表', async () => {
      // 模拟API响应
      const mockResponse = {
        data: {
          notifications: [
            {
              id: 'notif-001',
              industryId: mockIndustry.id,
              industryName: mockIndustry.name,
              title: '测试通知',
              status: NotificationStatus.UNREAD,
              priority: NotificationPriority.HIGH
            } as IndustryNotification
          ],
          total: 1,
          page: 1,
          limit: 10
        } as NotificationListResponse
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.getNotifications({ page: 1, limit: 10 });

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/notifications?page=1&limit=10');
    });

    it('应该处理空查询参数', async () => {
      // 模拟API响应
      const mockResponse = {
        data: { notifications: [], total: 0, page: 1, limit: 10 } as NotificationListResponse
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.getNotifications();

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/notifications');
    });

    it('应该处理API错误', async () => {
      // 模拟API错误
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      // 执行测试并验证错误
      await expect(notificationService.getNotifications()).rejects.toThrow(
        '获取通知列表失败: API Error'
      );
    });
  });

  describe('getNotificationById', () => {
    it('应该成功获取通知详情', async () => {
      const notificationId = 'notif-001';
      
      // 模拟API响应
      const mockResponse = {
        data: {
          id: notificationId,
          industryId: mockIndustry.id,
          industryName: mockIndustry.name,
          title: '测试通知',
          message: '测试消息',
          status: NotificationStatus.UNREAD
        } as IndustryNotification
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.getNotificationById(notificationId);

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/notifications/${notificationId}`);
    });

    it('应该处理API错误', async () => {
      const notificationId = 'notif-001';
      
      // 模拟API错误
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      // 执行测试并验证错误
      await expect(notificationService.getNotificationById(notificationId)).rejects.toThrow(
        '获取通知详情失败: API Error'
      );
    });
  });

  describe('updateNotificationStatus', () => {
    it('应该成功更新通知状态', async () => {
      const updateRequest = {
        notificationIds: ['notif-001', 'notif-002'],
        status: NotificationStatus.READ
      };

      mockApiClient.put.mockResolvedValue({});

      // 执行测试
      const result = await notificationService.updateNotificationStatus(updateRequest);

      // 验证结果
      expect(result).toBe(true);
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/notifications/status', updateRequest);
    });

    it('应该处理API错误', async () => {
      const updateRequest = {
        notificationIds: ['notif-001'],
        status: NotificationStatus.READ
      };

      // 模拟API错误
      mockApiClient.put.mockRejectedValue(new Error('API Error'));

      // 执行测试并验证错误
      await expect(
        notificationService.updateNotificationStatus(updateRequest)
      ).rejects.toThrow('更新通知状态失败: API Error');
    });
  });

  describe('markAsRead', () => {
    it('应该成功标记单个通知为已读', async () => {
      const notificationId = 'notif-001';

      mockApiClient.put.mockResolvedValue({});

      // 执行测试
      const result = await notificationService.markAsRead(notificationId);

      // 验证结果
      expect(result).toBe(true);
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/notifications/status', {
        notificationIds: [notificationId],
        status: NotificationStatus.READ
      });
    });
  });

  describe('markAllAsRead', () => {
    it('应该成功标记所有通知为已读', async () => {
      mockApiClient.put.mockResolvedValue({});

      // 执行测试
      const result = await notificationService.markAllAsRead();

      // 验证结果
      expect(result).toBe(true);
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/notifications/read-all');
    });

    it('应该处理API错误', async () => {
      // 模拟API错误
      mockApiClient.put.mockRejectedValue(new Error('API Error'));

      // 执行测试并验证错误
      await expect(notificationService.markAllAsRead()).rejects.toThrow(
        '标记所有通知为已读失败: API Error'
      );
    });
  });

  describe('deleteNotification', () => {
    it('应该成功删除通知', async () => {
      const notificationId = 'notif-001';

      mockApiClient.delete.mockResolvedValue({});

      // 执行测试
      const result = await notificationService.deleteNotification(notificationId);

      // 验证结果
      expect(result).toBe(true);
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/notifications/${notificationId}`);
    });

    it('应该处理API错误', async () => {
      const notificationId = 'notif-001';

      // 模拟API错误
      mockApiClient.delete.mockRejectedValue(new Error('API Error'));

      // 执行测试并验证错误
      await expect(notificationService.deleteNotification(notificationId)).rejects.toThrow(
        '删除通知失败: API Error'
      );
    });
  });

  describe('deleteBulkNotifications', () => {
    it('应该成功批量删除通知', async () => {
      const notificationIds = ['notif-001', 'notif-002'];

      mockApiClient.post.mockResolvedValue({});

      // 执行测试
      const result = await notificationService.deleteBulkNotifications(notificationIds);

      // 验证结果
      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/notifications/bulk-delete', {
        notificationIds
      });
    });
  });

  describe('getNotificationStats', () => {
    it('应该成功获取通知统计数据', async () => {
      // 模拟API响应
      const mockResponse = {
        data: {
          total: 10,
          unread: 3,
          read: 7,
          highPriority: 1,
          mediumPriority: 2,
          lowPriority: 7
        } as NotificationStats
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.getNotificationStats();

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/notifications/stats');
    });
  });

  describe('通知订阅相关功能', () => {
    it('应该成功创建通知订阅', async () => {
      const subscriptionRequest = {
        userId: 'user-001',
        notificationTypes: [NotificationChangeType.UPDATE, NotificationChangeType.STATUS_CHANGE],
        priorityFilter: NotificationPriority.HIGH,
        enabled: true
      };

      const mockResponse = {
        data: {
          id: 'sub-001',
          ...subscriptionRequest
        } as NotificationSubscription
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.createSubscription(subscriptionRequest);

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/notifications/subscriptions',
        subscriptionRequest
      );
    });

    it('应该成功获取用户订阅列表', async () => {
      const mockResponse = {
        data: [
          {
            id: 'sub-001',
            userId: 'user-001',
            enabled: true
          } as NotificationSubscription
        ]
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      // 执行测试
      const result = await notificationService.getUserSubscriptions();

      // 验证结果
      expect(result).toEqual(mockResponse.data);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/notifications/subscriptions');
    });
  });
});
