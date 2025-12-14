"use client";

/**
 * @file EmailDetail组件
 * @description 邮件详情页业务组件
 * @module components/email/EmailDetail
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Reply, ReplyAll, Forward, MoreVertical, Star, Trash2, Download, Archive, Share2, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Separator } from '../ui/Separator';
import type { Email } from '@/types';

// EmailDetail组件属性接口
interface EmailDetailProps {
  /**
   * 邮件数据
   */
  email: Email;
  /**
   * 返回按钮点击事件
   */
  onBack?: () => void;
}

/**
 * 邮件详情组件
 * 显示单封邮件的详细信息和操作
 */
export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onBack,
}) => {
  const router = useRouter();

  // 处理返回操作
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // 处理回复操作
  const handleReply = () => {
    // 实现回复逻辑
    console.log('Reply to email:', email.id);
  };

  // 处理转发操作
  const handleForward = () => {
    // 实现转发逻辑
    console.log('Forward email:', email.id);
  };

  // 处理删除操作
  const handleDelete = () => {
    // 实现删除逻辑
    console.log('Delete email:', email.id);
    router.back();
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
      {/* 头部工具栏 */}
      <div className="sticky top-0 z-10 flex items-center p-4 border-b bg-white dark:bg-neutral-800 dark:border-neutral-700">
        <IconButton onClick={handleBack} className="mr-2" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div className="flex-1">
          <IconButton variant="ghost" size="sm">
            <Reply className="h-4 w-4" />
          </IconButton>
          <IconButton variant="ghost" size="sm">
            <Forward className="h-4 w-4" />
          </IconButton>
          <IconButton variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
          </IconButton>
          <IconButton variant="ghost" size="sm">
            <Archive className="h-4 w-4" />
          </IconButton>
          <IconButton variant="ghost" size="sm"
            onClick={() => console.log('Toggle star')}
          >
            <Star 
              className={`h-4 w-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
            />
          </IconButton>
        </div>
        <IconButton variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </IconButton>
      </div>

      {/* 邮件内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 邮件头部信息 */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {email.subject || '无主题'}
            </h1>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {formatDate(email.receivedAt || email.createdAt)}
            </span>
          </div>

          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
              {email.from.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-neutral-900 dark:text-white">
                {email.from}
              </div>
            </div>
          </div>

          <div className="mb-6 text-sm">
            <div className="mb-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">收件人: </span>
              <span className="text-neutral-600 dark:text-neutral-400">
                {email.to.join(', ')}
              </span>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">抄送: </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {email.cc.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* 邮件正文 */}
        <div 
          className="prose max-w-none text-neutral-800 dark:text-neutral-200"
          dangerouslySetInnerHTML={{ __html: email.content || '' }}
        />

        {/* 附件列表 */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-8">
            <Separator className="mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
              附件 ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment: { filename: string, size: number }, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center p-3 rounded-md bg-neutral-50 dark:bg-neutral-800"
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <Download className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900 dark:text-white">
                      {attachment.filename}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {attachment.size}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => console.log('Download attachment:', attachment.filename)}
                  >
                    下载
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部回复区域 */}
      <div className="p-4 border-t bg-white dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleReply}>
            <Reply className="h-4 w-4 mr-2" />
            回复
          </Button>
          <Button size="sm" variant="ghost">
            <ReplyAll className="h-4 w-4 mr-2" />
            回复全部
          </Button>
          <Button size="sm" variant="ghost" onClick={handleForward}>
            <Forward className="h-4 w-4 mr-2" />
            转发
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
          <Button size="sm" variant="ghost">
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
