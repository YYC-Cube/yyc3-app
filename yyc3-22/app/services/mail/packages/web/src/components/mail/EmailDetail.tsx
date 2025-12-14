/**
 * @file 邮件详情组件
 * @description 显示单个邮件的完整内容
 * @module components/mail/EmailDetail
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useEmailContext } from '../../context/EmailContext';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { Card } from '../common/Card';

export interface EmailDetailProps {
  /** 邮件ID */
  id: string;
  /** 发件人信息 */
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** 收件人列表 */
  to: Array<{ name: string; email: string }>;
  /** 抄送列表 */
  cc?: Array<{ name: string; email: string }>;
  /** 密送列表 */
  bcc?: Array<{ name: string; email: string }>;
  /** 邮件主题 */
  subject: string;
  /** 发送时间 */
  sentAt: string;
  /** 邮件内容 */
  body: React.ReactNode;
  /** 是否已读 */
  isRead: boolean;
  /** 是否星标 */
  isStarred: boolean;
  /** 附件列表 */
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  /** 回复事件 */
  onReply?: () => void;
  /** 回复全部事件 */
  onReplyAll?: () => void;
  /** 转发事件 */
  onForward?: () => void;
  /** 删除事件 */
  onDelete?: () => void;
  /** 星标切换事件 */
  onStarToggle?: (starred: boolean) => void;
  /** 标记已读/未读事件 */
  onMarkRead?: (read: boolean) => void;
}

/**
 * 邮件详情组件
 */
export const EmailDetail: React.FC<EmailDetailProps> = ({
  id,
  from,
  to,
  cc,
  bcc,
  subject,
  sentAt,
  body,
  isRead = true,
  isStarred = false,
  attachments = [],
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onStarToggle,
  onMarkRead,
}) => {
  const { toggleEmailStar, toggleReadStatus, deleteEmails } = useEmailContext();
  // 处理星标切换
  const handleStarToggle = () => {
    toggleEmailStar(id);
    if (onStarToggle) {
      onStarToggle(!isStarred);
    }
  };

  // 处理标记已读/未读
  const handleMarkRead = () => {
    toggleReadStatus(id, !isRead);
    if (onMarkRead) {
      onMarkRead(!isRead);
    }
  };
  
  // 处理删除
  const handleDelete = () => {
    // 调用上下文的删除方法
    deleteEmails([id]);
    if (onDelete) {
      onDelete();
    }
  };

  // 格式化附件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // 渲染收件人列表
  const renderRecipients = (recipients: Array<{ name: string; email: string }>) => {
    return recipients.map((recipient, index) => (
      <span key={index} className="mr-2">
        <span className="font-medium">{recipient.name}</span>
        <span className="text-gray-500">{` \u003c${recipient.email}\u003e`}</span>
        {index < recipients.length - 1 && ','}
      </span>
    ));
  };

  // 星标图标
  const StarIcon = isStarred ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"
      className="h-5 w-5 text-yellow-400 fill-yellow-400"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"
      className="h-5 w-5 text-gray-400"
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <Card className="flex flex-col h-full border border-gray-200">
      {/* 邮件工具栏 */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <IconButton
            icon={StarIcon}
            onClick={handleStarToggle}
            variant="ghost"
            size="small"
            tooltip={isStarred ? '取消星标' : '添加星标'}
          />
          <IconButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"
                className="h-5 w-5 text-gray-700"
              >
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M3 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 6H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            onClick={handleMarkRead}
            variant="ghost"
            size="small"
            tooltip={isRead ? '标记未读' : '标记已读'}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="small"
            onClick={onReply}
          >
            回复
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={onReplyAll}
          >
            回复全部
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={onForward}
          >
            转发
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={handleDelete}
          >
            删除
          </Button>
        </div>
      </div>

      {/* 邮件头部信息 */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold mb-4">{subject}</h1>
        
        <div className="flex items-start mb-2">
          {from.avatar ? (
            <Image
              src={from.avatar}
              alt={from.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover mr-3 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3 shrink-0">
              {from.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="mb-1">
              <span className="font-medium">{from.name}</span>
              <span className="text-gray-500 ml-1">{` \u003c${from.email}\u003e`}</span>
            </div>
            <div className="text-sm text-gray-500">{sentAt}</div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-start">
            <span className="font-medium text-gray-500 mr-2 min-w-[40px]">收件人:</span>
            <div className="text-gray-700 flex-wrap">
              {renderRecipients(to)}
            </div>
          </div>
          
          {cc && cc.length > 0 && (
            <div className="flex items-start">
              <span className="font-medium text-gray-500 mr-2 min-w-[40px]">抄送:</span>
              <div className="text-gray-700 flex-wrap">
                {renderRecipients(cc)}
              </div>
            </div>
          )}
          
          {bcc && bcc.length > 0 && (
            <div className="flex items-start">
              <span className="font-medium text-gray-500 mr-2 min-w-[40px]">密送:</span>
              <div className="text-gray-700 flex-wrap">
                {renderRecipients(bcc)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="prose max-w-none">
          {body}
        </div>
      </div>

      {/* 附件部分 */}
      {attachments.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">附件 ({attachments.length})</h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 hover:bg-gray-50 rounded"
              >
                <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"
                    className="h-5 w-5 text-gray-700"
                  >
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-medium truncate">{attachment.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                </div>
                <div className="text-blue-600 text-sm">下载</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EmailDetail;