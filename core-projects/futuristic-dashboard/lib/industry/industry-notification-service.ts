/**
 * @file 行业配置变更通知服务
 * @description 处理行业配置变更通知的业务逻辑
 * @module industry-notification-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  IndustryNotification,
  NotificationQueryParams,
  NotificationListResponse,
  NotificationStatus,
  NotificationPriority,
  NotificationChangeType,
  UpdateNotificationStatusRequest,
  NotificationStats,
  NotificationSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  ChangeDetail
} from './industry-notification-types';
import { Industry } from './industry-types';
import { apiClient } from '../api';

/**
 * 行业配置变更通知服务类
 * 提供通知的创建、查询、更新和管理功能
 */
export class IndustryNotificationService {
  private readonly baseUrl = '/api/notifications';

  /**
   * 创建行业配置变更通知
   * @param industry 行业对象（可以是新的或修改后的）
   * @param changeType 变更类型
   * @param changeDetails 变更详情
   * @param userId 操作用户ID
   * @param userName 操作用户名称
   * @param metadata 额外元数据
   * @param historyId 关联的历史记录ID
   * @returns Promise<IndustryNotification> 创建的通知对象
   */
  async createNotification(
    industry: Industry,
    changeType: NotificationChangeType,
    changeDetails: ChangeDetail[],
    userId: string = 'system',
    userName: string = '系统',
    metadata: Record<string, any> = {},
    historyId?: string
  ): Promise<IndustryNotification> {
    try {
      const notificationData: Partial<IndustryNotification> = {
        industryId: industry.id,
        industryName: industry.name,
        changeType,
        userId,
        userName,
        title: this.generateNotificationTitle(industry, changeType),
        message: this.generateNotificationMessage(industry, changeType, changeDetails),
        priority: this.determinePriority(changeType, industry.status),
        status: NotificationStatus.UNREAD,
        changeDetails,
        historyId,
        metadata
      };

      const response = await apiClient.post<IndustryNotification>(`${this.baseUrl}`, notificationData);
      return response.data;
    } catch (error) {
      console.error('🚨 创建行业通知失败:', error);
      throw new Error(`创建行业通知失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量创建通知
   * @param notifications 通知数据数组
   * @returns Promise<IndustryNotification[]> 创建的通知对象数组
   */
  async createBulkNotifications(
    notifications: Partial<IndustryNotification>[]
  ): Promise<IndustryNotification[]> {
    try {
      const response = await apiClient.post<IndustryNotification[]>(
        `${this.baseUrl}/bulk`,
        { notifications }
      );
      return response.data;
    } catch (error) {
      console.error('🚨 批量创建行业通知失败:', error);
      throw new Error(`批量创建行业通知失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取通知列表
   * @param params 查询参数
   * @returns Promise<NotificationListResponse> 通知列表响应
   */
  async getNotifications(
    params: NotificationQueryParams = {}
  ): Promise<NotificationListResponse> {
    try {
      const queryParams = this.buildQueryParams(params);
      const response = await apiClient.get<NotificationListResponse>(
        `${this.baseUrl}${queryParams ? `?${queryParams}` : ''}`
      );
      return response.data;
    } catch (error) {
      console.error('🚨 获取通知列表失败:', error);
      throw new Error(`获取通知列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 根据ID获取通知详情
   * @param notificationId 通知ID
   * @returns Promise<IndustryNotification> 通知详情
   */
  async getNotificationById(notificationId: string): Promise<IndustryNotification> {
    try {
      const response = await apiClient.get<IndustryNotification>(
        `${this.baseUrl}/${notificationId}`
      );
      return response.data;
    } catch (error) {
      console.error(`🚨 获取通知详情失败 [ID: ${notificationId}]:`, error);
      throw new Error(`获取通知详情失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 更新通知状态
   * @param request 更新请求
   * @returns Promise<boolean> 更新是否成功
   */
  async updateNotificationStatus(
    request: UpdateNotificationStatusRequest
  ): Promise<boolean> {
    try {
      await apiClient.put(`${this.baseUrl}/status`, request);
      return true;
    } catch (error) {
      console.error('🚨 更新通知状态失败:', error);
      throw new Error(`更新通知状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 标记单个通知为已读
   * @param notificationId 通知ID
   * @returns Promise<boolean> 更新是否成功
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    return this.updateNotificationStatus({
      notificationIds: [notificationId],
      status: NotificationStatus.READ
    });
  }

  /**
   * 标记所有通知为已读
   * @returns Promise<boolean> 更新是否成功
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.put(`${this.baseUrl}/read-all`);
      return true;
    } catch (error) {
      console.error('🚨 标记所有通知为已读失败:', error);
      throw new Error(`标记所有通知为已读失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.baseUrl}/${notificationId}`);
      return true;
    } catch (error) {
      console.error(`🚨 删除通知失败 [ID: ${notificationId}]:`, error);
      throw new Error(`删除通知失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量删除通知
   * @param notificationIds 通知ID数组
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteBulkNotifications(notificationIds: string[]): Promise<boolean> {
    try {
      await apiClient.post(`${this.baseUrl}/bulk-delete`, { notificationIds });
      return true;
    } catch (error) {
      console.error('🚨 批量删除通知失败:', error);
      throw new Error(`批量删除通知失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取通知统计数据
   * @returns Promise<NotificationStats> 统计数据
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.get<NotificationStats>(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('🚨 获取通知统计失败:', error);
      throw new Error(`获取通知统计失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建通知订阅
   * @param request 订阅请求
   * @returns Promise<NotificationSubscription> 创建的订阅
   */
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<NotificationSubscription> {
    try {
      const response = await apiClient.post<NotificationSubscription>(
        `${this.baseUrl}/subscriptions`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('🚨 创建通知订阅失败:', error);
      throw new Error(`创建通知订阅失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 更新通知订阅
   * @param subscriptionId 订阅ID
   * @param request 更新请求
   * @returns Promise<NotificationSubscription> 更新后的订阅
   */
  async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<NotificationSubscription> {
    try {
      const response = await apiClient.put<NotificationSubscription>(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(`🚨 更新通知订阅失败 [ID: ${subscriptionId}]:`, error);
      throw new Error(`更新通知订阅失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取通知订阅列表
   * @returns Promise<NotificationSubscription[]> 订阅列表
   */
  async getUserSubscriptions(): Promise<NotificationSubscription[]> {
    try {
      const response = await apiClient.get<NotificationSubscription[]>(
        `${this.baseUrl}/subscriptions`
      );
      return response.data;
    } catch (error) {
      console.error('🚨 获取通知订阅列表失败:', error);
      throw new Error(`获取通知订阅列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除通知订阅
   * @param subscriptionId 订阅ID
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.baseUrl}/subscriptions/${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(`🚨 删除通知订阅失败 [ID: ${subscriptionId}]:`, error);
      throw new Error(`删除通知订阅失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成通知标题
   * @param industry 行业对象
   * @param changeType 变更类型
   * @returns string 通知标题
   */
  private generateNotificationTitle(industry: Industry, changeType: NotificationChangeType): string {
    const typeMap: Record<NotificationChangeType, string> = {
      [NotificationChangeType.CREATE]: '行业创建',
      [NotificationChangeType.UPDATE]: '行业更新',
      [NotificationChangeType.DELETE]: '行业删除',
      [NotificationChangeType.STATUS_CHANGE]: '行业状态变更',
      [NotificationChangeType.BULK_OPERATION]: '批量操作',
      [NotificationChangeType.ROLLBACK]: '配置回滚',
      [NotificationChangeType.PERFORMANCE_ALERT]: '性能告警',
      [NotificationChangeType.SYSTEM]: '系统通知'
    };

    return `${industry.name} - ${typeMap[changeType] || '行业配置变更'}`;
  }

  /**
   * 生成通知消息
   * @param industry 行业对象
   * @param changeType 变更类型
   * @param changeDetails 变更详情
   * @returns string 通知消息
   */
  private generateNotificationMessage(
    industry: Industry,
    changeType: NotificationChangeType,
    changeDetails: ChangeDetail[]
  ): string {
    let baseMessage = '';
    
    switch (changeType) {
      case NotificationChangeType.CREATE:
        baseMessage = `行业"${industry.name}"已创建`;
        break;
      case NotificationChangeType.DELETE:
        baseMessage = `行业"${industry.name}"已删除`;
        break;
      case NotificationChangeType.STATUS_CHANGE:
        baseMessage = `行业"${industry.name}"的状态已变更`;
        break;
      case NotificationChangeType.ROLLBACK:
        baseMessage = `行业"${industry.name}"的配置已回滚`;
        break;
      case NotificationChangeType.PERFORMANCE_ALERT:
        baseMessage = `行业"${industry.name}"触发性能告警`;
        break;
      case NotificationChangeType.BULK_OPERATION:
        baseMessage = `对行业"${industry.name}"执行了批量操作`;
        break;
      case NotificationChangeType.SYSTEM:
        baseMessage = `行业"${industry.name}"的系统通知`;
        break;
      default:
        baseMessage = `行业"${industry.name}"的配置已更新`;
    }

    // 添加变更详情摘要
    if (changeDetails.length > 0) {
      const detailsText = changeDetails
        .slice(0, 3) // 只显示前3个变更
        .map(detail => {
          const displayName = detail.displayName || detail.field;
          if (detail.oldValue === undefined) {
            return `${displayName}: ${this.formatValue(detail.newValue)}`;
          } else if (detail.newValue === undefined) {
            return `${displayName}: 已删除`;
          } else {
            return `${displayName}: ${this.formatValue(detail.oldValue)} → ${this.formatValue(detail.newValue)}`;
          }
        })
        .join('，');
      
      baseMessage += `。变更内容：${detailsText}${changeDetails.length > 3 ? ` 等${changeDetails.length}项变更` : ''}`;
    }

    return baseMessage;
  }

  /**
   * 确定通知优先级
   * @param changeType 变更类型
   * @param industryStatus 行业状态
   * @returns NotificationPriority 优先级
   */
  private determinePriority(
    changeType: NotificationChangeType,
    industryStatus?: string
  ): NotificationPriority {
    // 性能告警和系统通知通常是高优先级
    if (changeType === NotificationChangeType.PERFORMANCE_ALERT || 
        changeType === NotificationChangeType.SYSTEM) {
      return NotificationPriority.HIGH;
    }
    
    // 删除操作和状态变更为禁用通常是中优先级
    if (changeType === NotificationChangeType.DELETE || 
        (changeType === NotificationChangeType.STATUS_CHANGE && 
         industryStatus?.toLowerCase().includes('disabled'))) {
      return NotificationPriority.MEDIUM;
    }
    
    // 其他操作默认为低优先级
    return NotificationPriority.LOW;
  }

  /**
   * 格式化值，使其在通知中更易读
   * @param value 要格式化的值
   * @returns string 格式化后的值
   */
  private formatValue(value: any): string {
    if (value === null) return '空';
    if (value === undefined) return '未设置';
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (typeof value === 'object') {
      try {
        const str = JSON.stringify(value);
        return str.length > 50 ? `${str.substring(0, 50)}...` : str;
      } catch {
        return '[对象]';
      }
    }
    return String(value);
  }

  /**
   * 构建查询参数字符串
   * @param params 查询参数对象
   * @returns string 查询参数字符串
   */
  private buildQueryParams(params: NotificationQueryParams): string {
    const queryParts: string[] = [];
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
          });
        } else {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      }
    });
    
    return queryParts.join('&');
  }
}

/**
 * 行业通知服务单例
 */
export const industryNotificationService = new IndustryNotificationService();
