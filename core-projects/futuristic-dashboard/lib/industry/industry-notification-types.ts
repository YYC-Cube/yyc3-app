/**
 * @file 行业配置变更通知类型定义
 * @description 定义行业配置变更通知相关的数据类型和接口
 * @module industry-notification-types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { IndustryType, IndustryStatus } from './industry-types';

/**
 * 变更类型枚举
 * 描述行业配置发生了什么样的变更
 */
export enum NotificationChangeType {
  /** 创建新行业 */
  CREATE = 'create',
  /** 更新行业信息 */
  UPDATE = 'update',
  /** 删除行业 */
  DELETE = 'delete',
  /** 启用/禁用行业 */
  STATUS_CHANGE = 'status_change',
  /** 批量操作 */
  BULK_OPERATION = 'bulk_operation',
  /** 配置回滚 */
  ROLLBACK = 'rollback',
  /** 性能告警 */
  PERFORMANCE_ALERT = 'performance_alert',
  /** 系统通知 */
  SYSTEM = 'system'
}

/**
 * 通知优先级枚举
 * 定义通知的重要程度
 */
export enum NotificationPriority {
  /** 高优先级 */
  HIGH = 'high',
  /** 中优先级 */
  MEDIUM = 'medium',
  /** 低优先级 */
  LOW = 'low'
}

/**
 * 通知状态枚举
 * 定义通知的当前状态
 */
export enum NotificationStatus {
  /** 未读 */
  UNREAD = 'unread',
  /** 已读 */
  READ = 'read',
  /** 已处理 */
  PROCESSED = 'processed',
  /** 已忽略 */
  IGNORED = 'ignored'
}

/**
 * 变更详情接口
 * 记录配置变更的具体内容
 */
export interface ChangeDetail {
  /** 字段名 */
  field: string;
  /** 变更前的值 */
  oldValue?: any;
  /** 变更后的值 */
  newValue?: any;
  /** 字段的用户友好名称 */
  displayName?: string;
}

/**
 * 行业配置变更通知接口
 * 记录行业配置变更的通知信息
 */
export interface IndustryNotification {
  /** 通知ID */
  id: string;
  /** 相关行业ID */
  industryId?: string;
  /** 相关行业名称 */
  industryName?: string;
  /** 变更类型 */
  changeType: NotificationChangeType;
  /** 变更时间戳 */
  createdAt: string;
  /** 变更执行用户ID */
  userId?: string;
  /** 变更执行用户名称 */
  userName?: string;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 优先级 */
  priority: NotificationPriority;
  /** 通知状态 */
  status: NotificationStatus;
  /** 变更详情列表 */
  changeDetails?: ChangeDetail[];
  /** 关联的历史记录ID */
  historyId?: string;
  /** 额外的元数据信息 */
  metadata?: Record<string, any>;
}

/**
 * 通知查询参数接口
 * 用于筛选和分页获取通知列表
 */
export interface NotificationQueryParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 行业ID过滤 */
  industryId?: string;
  /** 变更类型过滤 */
  changeTypes?: NotificationChangeType[];
  /** 优先级过滤 */
  priorities?: NotificationPriority[];
  /** 状态过滤 */
  statuses?: NotificationStatus[];
  /** 创建时间范围-开始 */
  startDate?: string;
  /** 创建时间范围-结束 */
  endDate?: string;
  /** 搜索关键词 */
  searchTerm?: string;
  /** 排序字段 */
  sortBy?: keyof IndustryNotification;
  /** 排序方向 */
  sortDirection?: 'asc' | 'desc';
  /** 是否只显示未读 */
  onlyUnread?: boolean;
}

/**
 * 通知统计数据接口
 */
export interface NotificationStats {
  /** 总通知数 */
  totalCount: number;
  /** 未读通知数 */
  unreadCount: number;
  /** 按类型统计 */
  byType: Record<NotificationChangeType, number>;
  /** 按优先级统计 */
  byPriority: Record<NotificationPriority, number>;
  /** 按状态统计 */
  byStatus: Record<NotificationStatus, number>;
}

/**
 * 通知列表响应接口
 */
export interface NotificationListResponse {
  /** 通知列表 */
  notifications: IndustryNotification[];
  /** 总数 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 更新通知状态请求接口
 */
export interface UpdateNotificationStatusRequest {
  /** 通知ID列表 */
  notificationIds: string[];
  /** 目标状态 */
  status: NotificationStatus;
  /** 更新时间戳 */
  updatedAt?: string;
}

/**
 * 订阅通知接口
 * 定义用户对哪些类型的行业变更感兴趣
 */
export interface NotificationSubscription {
  /** 订阅ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 感兴趣的变更类型列表 */
  interestedChangeTypes: NotificationChangeType[];
  /** 感兴趣的行业ID列表，空数组表示所有行业 */
  interestedIndustries: string[];
  /** 最低优先级阈值 */
  minPriority: NotificationPriority;
  /** 是否启用订阅 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建通知订阅请求接口
 */
export interface CreateSubscriptionRequest {
  /** 感兴趣的变更类型列表 */
  interestedChangeTypes: NotificationChangeType[];
  /** 感兴趣的行业ID列表，空数组表示所有行业 */
  interestedIndustries?: string[];
  /** 最低优先级阈值 */
  minPriority?: NotificationPriority;
  /** 是否启用订阅 */
  enabled?: boolean;
}

/**
 * 更新通知订阅请求接口
 */
export interface UpdateSubscriptionRequest {
  /** 感兴趣的变更类型列表 */
  interestedChangeTypes?: NotificationChangeType[];
  /** 感兴趣的行业ID列表，空数组表示所有行业 */
  interestedIndustries?: string[];
  /** 最低优先级阈值 */
  minPriority?: NotificationPriority;
  /** 是否启用订阅 */
  enabled?: boolean;
}
