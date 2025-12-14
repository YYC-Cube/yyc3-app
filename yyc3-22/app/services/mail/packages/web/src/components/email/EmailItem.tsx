"use client";

/**
 * @file EmailItem组件
 * @description 邮件列表项组件
 * @module components/email/EmailItem
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';
import { Star, StarOff } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import type { Email } from '@/types';

// EmailItem组件属性接口
interface EmailItemProps {
  /**
   * 邮件数据
   */
  email: Email;
  /**
   * 是否被选中
   */
  selected?: boolean;
  /**
   * 点击回调
   */
  onClick?: () => void;
  /**
   * 选择状态变更回调
   */
  onSelect?: (checked: boolean) => void;
  /**
   * 星标切换回调
   */
  onToggleStar?: () => void;
}

/**
 * 邮件列表项组件
 * 显示单封邮件的摘要信息
 */
export const EmailItem: React.FC<EmailItemProps> = ({
  email,
  selected = false,
  onClick,
  onSelect,
  onToggleStar,
}) => {
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 今天：只显示时间
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // 昨天
      return '昨天';
    } else if (diffDays < 7) {
      // 一周内：显示星期
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${weekdays[date.getDay()]}`;
    } else {
      // 超过一周：显示月/日
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // 截取邮件内容预览
  const getPreview = (content?: string, maxLength = 100) => {
    if (!content) return '';
    // 移除HTML标签
    const plainText = content.replace(/\u003c[^\u003e]+\u003e/g, '');
    // 截取指定长度
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  // 处理复选框变化
  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(checked);
    }
  };

  // 处理星标点击
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar();
    }
  };

  return (
    <div
      className={`flex items-center p-3 rounded-md cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${selected ? 'bg-primary/10 dark:bg-primary/20' : ''} ${!email.isRead ? 'border-l-4 border-blue-500' : ''}`}
      onClick={onClick}
    >
      {/* 复选框 */}
      <Checkbox
        checked={selected}
        onChange={handleCheckboxChange}
        className="mr-3 flex-shrink-0"
      />

      {/* 星标 */}
      <button
        type="button"
        onClick={handleStarClick}
        className="mr-2 text-neutral-400 hover:text-yellow-400 flex-shrink-0"
        aria-label={email.isStarred ? '取消星标' : '添加星标'}
      >
        {email.isStarred ? (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="h-4 w-4" />
        )}
      </button>

      {/* 发件人 */}
      <div className="flex-shrink-0 w-28 md:w-36 font-medium truncate mr-4">
        {email.from}
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex items-center mb-1">
          <span className="truncate mr-2 font-medium">
            {email.subject || '(无主题)'}
          </span>
          {email.attachments && email.attachments.length > 0 && (
            <span className="text-neutral-400 text-xs">📎</span>
          )}
        </div>
        <div className="text-neutral-500 dark:text-neutral-400 text-sm truncate">
          {getPreview(email.content)}
        </div>
      </div>

      {/* 日期 */}
      <div className="flex-shrink-0 ml-4 text-xs text-neutral-400 whitespace-nowrap">
        {formatDate(email.receivedAt || email.createdAt)}
      </div>
    </div>
  );
};

export default EmailItem;
