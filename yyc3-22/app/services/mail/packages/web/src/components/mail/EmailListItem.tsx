/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @file 邮件列表项组件
 * @description 显示邮件列表中的单个邮件项
 * @module components/mail/EmailListItem
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useEmailContext } from '../../context/EmailContext';
import { Checkbox } from '../common/Checkbox';
import { IconButton } from '../common/IconButton';

// 邮件项接口
export interface EmailItemProps {
  /** 邮件ID */
  id: string;
  /** 发件人 */
  sender?: string;
  /** 发件人头像 */
  senderAvatar?: string;
  /** 邮件主题 */
  subject: string;
  /** 邮件预览内容 */
  preview?: string;
  /** 发送时间 */
  time?: string;
  /** 是否已读 */
  isRead?: boolean;
  /** 是否星标 */
  isStarred?: boolean;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否为重要邮件 */
  isImportant?: boolean;
  /** 邮件标签 */
  tags?: string[];
  /** 点击事件 */
  onClick?: (id: string) => void;
  /** 选择事件 */
  onSelect?: (id: string, selected: boolean) => void;
  /** 星标切换事件 */
  onStarToggle?: (id: string, starred: boolean) => void;
}

/**
 * 格式化时间显示
 * @param {string} timeString - 时间字符串
 * @returns {string} 格式化后的时间
 */
const formatTime = (timeString?: string): string => {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // 今天的邮件显示时间
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 昨天的邮件显示"昨天"
  else if (diffDays === 1) {
    return '昨天';
  }
  // 今年的邮件显示月/日
  else if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  // 其他情况显示年/月/日
  else {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
};

/**
 * 邮件列表项组件
 */
export const EmailListItem: React.FC<EmailItemProps> = ({
  id,
  sender,
  senderAvatar,
  subject,
  preview,
  time,
  isRead = false,
  isStarred = false,
  isSelected = false,
  isImportant = false,
  tags = [],
  onClick,
  onSelect,
  onStarToggle,
}) => {
  const { toggleEmailStar, toggleReadStatus, deleteEmails } = useEmailContext();
  const [hovered, setHovered] = useState(false);
  // 处理选择变更
  const handleSelectChange = (selected: boolean) => {
    if (onSelect) {
      onSelect(id, selected);
    }
  };

  // 处理星标切换
  const handleStarToggle = () => {
    const newStarredState = !isStarred;
    if (onStarToggle) {
      onStarToggle(id, newStarredState);
    }
    // 使用上下文提供的方法更新状态
    toggleEmailStar(id);
  };

  // 处理点击
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
    // 自动标记为已读
    if (!isRead) {
      toggleReadStatus(id, true);
    }
  };
  
  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEmails([id]);
  };
  
  // 处理标记已读/未读
  const handleToggleRead = () => {
    toggleReadStatus(id, !isRead);
  };

  // 处理复选框区域点击，阻止冒泡
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 处理星标点击，阻止冒泡
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleStarToggle();
  };

  // 主体内容样式
  const contentClasses = [
    'flex items-center py-3 px-2 hover:bg-gray-50 rounded',
    isSelected && 'bg-blue-50',
    isRead ? 'text-gray-600' : 'font-medium text-gray-900',
  ].filter(Boolean).join(' ');

  // 星标图标
  const StarIcon = isStarred ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"
      className="h-4 w-4 text-yellow-400 fill-yellow-400"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"
      className="h-4 w-4 text-gray-400"
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  // 重要标记图标
  const ImportantIcon = isImportant && (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"
      className="h-4 w-4 text-red-500"
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M10 15v-3m0-2c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1V8m-4 8h8"
      />
    </svg>
  );

  return (
    <div 
      className={contentClasses}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 复选框 */}
      <div className="shrink-0 mr-2" onClick={handleCheckboxClick}>
        <Checkbox 
          checked={isSelected} 
          onChange={handleSelectChange}
        />
      </div>

      {/* 星标 */}
        <IconButton
          size="sm"
          variant="ghost"
          className="shrink-0 text-gray-400 hover:text-yellow-400 mr-2"
          onClick={handleStarClick}
          aria-label={isStarred ? '取消星标' : '添加星标'}
          icon={StarIcon}
        />

      {/* 重要标记 */}
      {ImportantIcon && <div className="shrink-0 mr-2">{ImportantIcon}</div>}

      {/* 发件人 */}
      <div className="hidden sm:block sm:shrink-0 sm:w-40 mr-2 font-medium">
        {senderAvatar ? (
          <Image 
            src={senderAvatar} 
            alt={`${sender || '未知发件人'}的头像`}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover mr-2"
            onError={(e) => {
              // 图片加载失败时隐藏
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
            {(sender?.charAt(0) || '?').toUpperCase()}
          </div>
        )}
        {sender || '未知发件人'}
      </div>

      {/* 移动端发件人 */}
      <div className="sm:hidden block mr-2 font-medium">
        {sender || '未知发件人'}
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 min-w-0 mr-2 shrink">
        <div className="flex items-center truncate">
          <span className="font-medium truncate">{subject || '无主题'}</span>
          <span className="mx-1 text-gray-400">·</span>
          <span className="text-gray-500 truncate">{preview || '[无内容]'}</span>
        </div>
      </div>

      {/* 时间 */}
      <div className="shrink-0 text-xs text-gray-500 whitespace-nowrap mr-2">
        {formatTime(time) || ''}
      </div>
      
      {/* 操作按钮 */}
      {(hovered || isSelected) && (
        <div className="shrink-0 flex items-center space-x-1">
          <IconButton
            size="sm"
            variant="ghost"
            className="h-7 w-7 text-gray-400 hover:text-red-500"
            onClick={handleDelete}
            aria-label="删除"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.318.15.648.15.966 0m-1.022-.165c-.34-.052-.68-.107-1.022-.166m0 2.133c.34.052.68.107 1.022.166m12 0c.342-.052.682-.107 1.022-.166m0 2.133c-.318.15-.648.15-.966 0m-12 .562a48.11 48.11 0 013.478-.397m11.377 0c.318.15.648.15.966 0m0 2.133c-.342.052-.682-.107-1.022-.166m-12 0c-.342-.052-.682-.107-1.022-.166" />
              </svg>
            }
          />
          <IconButton
            size="sm"
            variant="ghost"
            className={`h-7 w-7 ${isRead ? 'text-gray-400 hover:text-blue-500' : 'text-blue-500'}`}
            onClick={handleToggleRead}
            aria-label={isRead ? '标记未读' : '标记已读'}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
};

export default EmailListItem;