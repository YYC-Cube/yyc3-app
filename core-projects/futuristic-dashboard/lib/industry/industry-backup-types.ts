/**
 * @file 行业数据备份相关类型定义
 * @description 定义行业配置数据备份和恢复功能所需的类型
 * @module industry/industry-backup-types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { IndustryConfig, IndustryType } from '@/lib/industry-adapter';

/**
 * 备份状态枚举
 */
export enum BackupStatus {
  /** 备份成功 */
  SUCCESS = 'success',
  /** 备份进行中 */
  IN_PROGRESS = 'in_progress',
  /** 备份失败 */
  FAILED = 'failed',
  /** 备份已计划 */
  SCHEDULED = 'scheduled',
}

/**
 * 备份类型枚举
 */
export enum BackupType {
  /** 手动备份 */
  MANUAL = 'manual',
  /** 自动定时备份 */
  AUTOMATIC = 'automatic',
  /** 变更触发备份 */
  CHANGE_TRIGGERED = 'change_triggered',
}

/**
 * 备份配置接口
 */
export interface BackupConfig {
  /** 备份ID */
  id: string;
  /** 备份名称 */
  name: string;
  /** 备份类型 */
  type: BackupType;
  /** 备份状态 */
  status: BackupStatus;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 备份大小（字节） */
  size: number;
  /** 备份包含的行业数量 */
  industryCount: number;
  /** 备份描述 */
  description?: string;
  /** 创建者 */
  createdBy?: string;
  /** 错误信息（如果失败） */
  errorMessage?: string;
  /** 备份路径或标识符 */
  backupPath?: string;
}

/**
 * 备份选项接口
 */
export interface BackupOptions {
  /** 备份名称 */
  name?: string;
  /** 备份描述 */
  description?: string;
  /** 是否包含所有行业 */
  includeAllIndustries?: boolean;
  /** 要包含的特定行业ID列表 */
  industryIds?: IndustryType[];
  /** 备份类型 */
  type?: BackupType;
}

/**
 * 恢复选项接口
 */
export interface RestoreOptions {
  /** 是否覆盖现有行业配置 */
  overwrite?: boolean;
  /** 是否仅恢复特定行业 */
  specificIndustries?: IndustryType[];
  /** 恢复前是否创建备份 */
  createBackupBeforeRestore?: boolean;
}

/**
 * 备份元数据接口
 */
export interface BackupMetadata {
  /** 备份版本 */
  version: string;
  /** 系统版本 */
  systemVersion: string;
  /** 备份摘要信息 */
  summary: {
    /** 行业总数 */
    totalIndustries: number;
    /** 已启用行业数 */
    enabledIndustries: number;
    /** 已禁用行业数 */
    disabledIndustries: number;
  };
  /** 包含的行业配置列表 */
  includedIndustries: Array<{
    id: IndustryType;
    name: string;
    code: string;
  }>;
}

/**
 * 备份数据接口
 */
export interface BackupData {
  /** 备份元数据 */
  metadata: BackupMetadata;
  /** 行业配置数据 */
  industries: IndustryConfig[];
  /** 备份统计信息 */
  statistics: {
    /** 创建时间 */
    createdAt: string;
    /** 数据大小 */
    dataSize: number;
    /** 记录数 */
    recordCount: number;
  };
}

/**
 * 备份计划接口
 */
export interface BackupSchedule {
  /** 计划ID */
  id: string;
  /** 计划名称 */
  name: string;
  /** 执行频率（cron表达式） */
  cronExpression: string;
  /** 是否启用 */
  enabled: boolean;
  /** 上次执行时间 */
  lastExecution?: string;
  /** 下次执行时间 */
  nextExecution?: string;
  /** 备份选项 */
  backupOptions: Omit<BackupOptions, 'type'>;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 备份历史记录查询参数接口
 */
export interface BackupQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
  /** 状态筛选 */
  status?: BackupStatus;
  /** 类型筛选 */
  type?: BackupType;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 排序字段 */
  sortBy?: 'createdAt' | 'name' | 'size' | 'industryCount';
  /** 排序方向 */
  sortDirection?: 'asc' | 'desc';
}

/**
 * 备份操作结果接口
 */
export interface BackupOperationResult {
  /** 操作是否成功 */
  success: boolean;
  /** 备份ID（如果成功） */
  backupId?: string;
  /** 消息 */
  message: string;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 恢复操作结果接口
 */
export interface RestoreOperationResult {
  /** 操作是否成功 */
  success: boolean;
  /** 恢复的行业数量 */
  restoredCount?: number;
  /** 创建的备份ID（如果开启了恢复前备份） */
  preRestoreBackupId?: string;
  /** 消息 */
  message: string;
  /** 错误信息（如果失败） */
  error?: string;
}
