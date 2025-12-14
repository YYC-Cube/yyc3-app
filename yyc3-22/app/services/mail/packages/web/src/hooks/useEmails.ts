'use client';

/**
 * @file useEmails.ts
 * @description 邮件列表操作Hook
 * @module hooks
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { useCallback, useEffect } from 'react';
import { useEmailContext } from '../context/EmailContext';
import { EmailFilter, SortOption } from '../types';

/**
 * 邮件列表操作Hook
 * 提供邮件列表相关的操作和状态管理
 */
export const useEmails = () => {
  const {
    emails,
    isLoading,
    error,
    fetchEmails,
    deleteEmails,
    markAsRead,
    selectedEmails,
    selectEmail,
    selectAllEmails,
  } = useEmailContext();

  // 默认过滤条件
  const defaultFilter: EmailFilter = {
    folder: 'inbox',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  // 初始化加载邮件列表
  useEffect(() => {
    fetchEmails(defaultFilter);
  }, []); // 只在组件挂载时执行一次

  // 刷新邮件列表
  const refreshEmails = useCallback((filter?: EmailFilter) => {
    const finalFilter = filter || defaultFilter;
    return fetchEmails(finalFilter);
  }, [fetchEmails]);

  // 应用邮件过滤器
  const applyFilter = useCallback((filter: Partial<EmailFilter>) => {
    const updatedFilter = { ...defaultFilter, ...filter };
    return fetchEmails(updatedFilter);
  }, [fetchEmails]);

  // 更改排序方式
  const sortEmails = useCallback((sortOption: SortOption) => {
    return fetchEmails({
      ...defaultFilter,
      sortBy: sortOption.sortBy,
      sortOrder: sortOption.sortOrder,
    });
  }, [fetchEmails]);

  // 注意：由于fetchEmails函数实现在EmailContext中，当前文件中无法直接修改其实现
  // 建议在EmailContext.tsx文件中更新fetchEmails函数，确保正确处理EmailListResponse类型并更新分页状态

  // 批量删除选中的邮件
  const deleteSelectedEmails = useCallback(() => {
    if (selectedEmails.size === 0) return Promise.resolve();
    return deleteEmails(Array.from(selectedEmails));
  }, [selectedEmails, deleteEmails]);

  // 标记选中的邮件为已读
  const markSelectedAsRead = useCallback(() => {
    if (selectedEmails.size === 0) return Promise.resolve();
    return markAsRead(Array.from(selectedEmails), true);
  }, [selectedEmails, markAsRead]);

  // 标记选中的邮件为未读
  const markSelectedAsUnread = useCallback(() => {
    if (selectedEmails.size === 0) return Promise.resolve();
    return markAsRead(Array.from(selectedEmails), false);
  }, [selectedEmails, markAsRead]);

  // 计算选中状态
  const isAllSelected = selectedEmails.size === emails.length && emails.length > 0;
  const isPartialSelected = selectedEmails.size > 0 && selectedEmails.size < emails.length;

  // 处理全选/取消全选切换
  const handleToggleSelectAll = useCallback(() => {
    selectAllEmails(!isAllSelected);
  }, [isAllSelected, selectAllEmails]);

  return {
    // 数据状态
    emails,
    isLoading,
    error,
    selectedEmails,
    
    // 选择状态
    isAllSelected,
    isPartialSelected,
    
    // 操作方法
    refreshEmails,
    applyFilter,
    sortEmails,
    deleteSelectedEmails,
    markSelectedAsRead,
    markSelectedAsUnread,
    selectEmail,
    handleToggleSelectAll,
  };
};
