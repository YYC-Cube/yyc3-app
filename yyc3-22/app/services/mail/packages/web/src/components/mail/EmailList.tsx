/**
 * @file 邮件列表组件
 * @description 显示邮件列表，支持批量操作和排序
 * @module components/mail/EmailList
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client';
import React, { useCallback } from 'react';
import { EmailListItem, EmailItemProps } from './EmailListItem';
import { Checkbox } from '../common/Checkbox';
import { IconButton } from '../common/IconButton';
import { Button } from '../common/Button';
import { useEmails } from '../../hooks/useEmails';
import { useEmailContext } from '@/context/EmailContext'; // 导入EmailContext

export interface EmailListProps {
  /** 邮件数据列表 */
  emails?: EmailItemProps[];
  /** 是否加载中 */
  loading?: boolean;
  /** 是否有更多邮件 */
  hasMore?: boolean;
  /** 排序方式 */
  sortBy?: 'date' | 'sender' | 'subject';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
  /** 邮件点击事件 */
  onEmailClick?: (id: string) => void;
  /** 加载更多邮件事件 */
  onLoadMore?: () => void;
  /** 排序变更事件 */
  onSortChange?: (sortBy: 'date' | 'sender' | 'subject', sortOrder: 'asc' | 'desc') => void;
  /** 批量删除事件 */
  onBulkDelete?: (ids: string[]) => void;
  /** 批量标记已读/未读事件 */
  onBulkMarkRead?: (ids: string[], isRead: boolean) => void;
  /** 批量标记星标事件 */
  onBulkStar?: (ids: string[], isStarred: boolean) => void;
}

/**
 * 邮件列表组件
 */
export const EmailList: React.FC<EmailListProps> = ({
  emails: propEmails,
  loading: propLoading,
  hasMore = false,
  sortBy = 'date',
  sortOrder = 'desc',
  onEmailClick,
  onLoadMore,
  onSortChange,
  onBulkDelete,
  onBulkMarkRead,
  onBulkStar,
}) => {
  // 使用自定义Hooks获取邮件状态和操作
  const {
    emails: contextEmails,
    isLoading: contextLoading,
    error,
    selectedEmails = new Set<string>(),
    isAllSelected,
    // 使用isPartialSelected代替isIndeterminate
    isPartialSelected,
    selectEmail,
    handleToggleSelectAll
  } = useEmails();
  
  // 保持向后兼容
  const isIndeterminate = isPartialSelected;
  
  // 从EmailContext获取操作函数
  const { toggleEmailStar, clearSelectedEmails } = useEmailContext();
  
  // 优先使用props中的数据，其次使用context中的数据
  const emails = propEmails || contextEmails.map(email => ({
      id: email.id,
      sender: email.from || '未知发件人',
      senderAvatar: '',
      subject: email.subject,
      preview: email.content?.substring(0, 100) || '',
      time: email.createdAt ? new Date(email.createdAt).toLocaleTimeString() : '',
      isRead: email.isRead,
      isStarred: email.isStarred,
    isImportant: false,
    tags: []
  }));
  
  const isLoading = propLoading !== undefined ? propLoading : contextLoading;

  // 处理邮件点击
  const handleEmailClick = useCallback((id: string) => {
    if (onEmailClick) {
      onEmailClick(id);
    }
  }, [onEmailClick]);

  // 处理邮件选择
  const handleEmailSelect = useCallback((id: string, checked: boolean) => {
    selectEmail(id, checked);
  }, [selectEmail]);

  // 处理星标切换
  const handleStarToggle = useCallback(async (id: string, starred: boolean) => {
    // 使用统一的星标切换方法
    await toggleEmailStar(id);
  }, [toggleEmailStar]);

  // 处理排序变更
  const handleSortChange = useCallback((newSortBy: 'date' | 'sender' | 'subject') => {
    if (onSortChange) {
      if (sortBy === newSortBy) {
        // 切换排序顺序
        const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        onSortChange(newSortBy, newSortOrder);
      } else {
        // 新的排序字段，默认降序
        onSortChange(newSortBy, 'desc');
      }
    }
  }, [sortBy, sortOrder, onSortChange]);

  // 处理批量操作
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedEmails);
    if (ids.length > 0) {
      // 调用props中的批量删除方法或使用context中的方法
      if (onBulkDelete) {
        onBulkDelete(ids);
      }
      // 操作完成后清空选择
      clearSelectedEmails();
    }
  }, [selectedEmails, onBulkDelete, clearSelectedEmails]);

  const handleBulkMarkRead = useCallback(async (isRead: boolean) => {
    const ids = Array.from(selectedEmails);
    if (ids.length > 0) {
      if (onBulkMarkRead) {
        onBulkMarkRead(ids, isRead);
      }
      // 操作完成后清空选择
      clearSelectedEmails();
    }
  }, [selectedEmails, onBulkMarkRead, clearSelectedEmails]);

  const handleBulkStar = useCallback(async (isStarred: boolean) => {
    const ids = Array.from(selectedEmails);
    if (ids.length > 0) {
      if (onBulkStar) {
        onBulkStar(ids, isStarred);
      }
      // 操作完成后清空选择
      clearSelectedEmails();
    }
  }, [selectedEmails, onBulkStar, clearSelectedEmails]);

  // 渲染排序按钮
  const renderSortButton = (field: 'date' | 'sender' | 'subject', label: string) => {
    const isActive = sortBy === field;
    let icon = null;

    if (isActive) {
      if (sortOrder === 'asc') {
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-4 w-4 ml-1">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 14l3-3-3-3" />
          </svg>
        );
      } else {
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="h-4 w-4 ml-1">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 6l3 3 3-3" />
          </svg>
        );
      }
    }

    return (
      <button
        className={`flex items-center text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}
        onClick={() => handleSortChange(field)}
      >
        {label}
        {icon}
      </button>
    );
  };

  // 加载中状态
  if (isLoading && emails.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 空状态
  if (!isLoading && (!emails || emails.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">暂无邮件</h3>
        <p className="text-gray-500 max-w-sm">您的收件箱是空的。当您收到新邮件时，它们将显示在这里。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 邮件列表头部 */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        {/* 选择和操作区域 */}
        <div className="flex items-center space-x-2">
          {selectedEmails.size > 0 ? (
            <>
              <span className="text-sm text-gray-600">选中 {selectedEmails.size} 项</span>
              <Button 
                variant="outline" 
                size="small"
                onClick={handleBulkDelete}
              >
                删除
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkMarkRead(true)}
              >
                标记已读
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkMarkRead(false)}
              >
                标记未读
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkStar(true)}
              >
                添加星标
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkStar(false)}
              >
                取消星标
              </Button>
            </>
          ) : (
            <>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleToggleSelectAll}
              />
              <span className="text-xs text-gray-500 ml-1">全选</span>
            </>
          )}
        </div>

        {/* 排序区域 */}
        <div className="hidden sm:flex items-center space-x-2">
          {renderSortButton('date', '时间')}
          {renderSortButton('sender', '发件人')}
          {renderSortButton('subject', '主题')}
        </div>
      </div>

      {/* 邮件列表 */}
      <div className="flex-1 overflow-y-auto">
        {emails?.map((email) => {
          // 确保邮件对象有效
          if (!email || !email.id) {
            return null;
          }
          
          return (
            <EmailListItem
              key={email.id}
              {...email}
              isSelected={selectedEmails.has(email.id)}
              onClick={handleEmailClick}
              onSelect={handleEmailSelect}
              onStarToggle={handleStarToggle}
            />
          );
        })}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 flex justify-center">
          <Button 
            variant="outline" 
            size="small"
            onClick={() => onLoadMore?.()}
            disabled={!onLoadMore}
          >
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmailList;