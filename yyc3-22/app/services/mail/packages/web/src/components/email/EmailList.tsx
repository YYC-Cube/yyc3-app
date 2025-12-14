"use client";

/**
 * @file EmailList组件
 * @description 邮件列表业务组件
 * @module components/email/EmailList
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, RefreshCw, ChevronDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Checkbox } from '../ui/Checkbox';
import { Separator } from '../ui/Separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { EmailItem } from './EmailItem';
import type { Email } from '@/types';

// EmailList组件属性接口
interface EmailListProps {
  /**
   * 邮件列表数据
   */
  emails: Email[];
  /**
   * 加载状态
   */
  loading?: boolean;
  /**
   * 错误状态
   */
  error?: string;
  /**
   * 加载更多回调
   */
  onLoadMore?: () => void;
  /**
   * 邮件选择回调
   */
  onSelectEmail?: (email: Email) => void;
  /**
   * 邮件状态更新回调
   */
  onUpdateEmail?: (emailId: string, updates: Partial<Email>) => void;
}

/**
 * 邮件列表组件
 * 显示邮件列表并提供筛选、搜索等功能
 */
export const EmailList: React.FC<EmailListProps> = ({
  emails,
  loading = false,
  error,
  onLoadMore,
  onSelectEmail,
  onUpdateEmail,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState<boolean>(false);

  // 处理邮件点击
  const handleEmailClick = (email: Email) => {
    // 如果未读，标记为已读
    if (!email.isRead && onUpdateEmail) {
      onUpdateEmail(email.id, { isRead: true });
    }
    
    if (onSelectEmail) {
      onSelectEmail(email);
    } else {
      // 默认行为：跳转到邮件详情页
      router.push(`/email/${email.id}`);
    }
  };

  // 处理邮件选择
  const handleEmailSelect = (emailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, emailId]);
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    }
    setAllSelected(false);
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    if (checked) {
      setSelectedEmails(emails.map(email => email.id));
    } else {
      setSelectedEmails([]);
    }
  };

  // 处理星标切换
  const handleToggleStar = (emailId: string, currentStarred: boolean) => {
    if (onUpdateEmail) {
      onUpdateEmail(emailId, { isStarred: !currentStarred });
    }
  };

  // 处理搜索变化
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // 这里可以添加搜索逻辑，例如过滤本地邮件或触发API请求
  };

  // 过滤邮件（简单本地过滤）
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
        email.content?.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query)
      );
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
      {/* 工具栏 */}
      <div className="sticky top-0 z-10 p-3 border-b bg-white dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center mb-3 gap-2">
          <Checkbox 
            checked={allSelected}
            onChange={(checked) => handleSelectAll(checked)}
            className="mr-2"
          />
          <IconButton variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>全部邮件</DropdownMenuItem>
              <DropdownMenuItem>未读邮件</DropdownMenuItem>
              <DropdownMenuItem>已加星标</DropdownMenuItem>
              <DropdownMenuItem>重要邮件</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="ml-auto">
            选择操作
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {/* 搜索栏 */}
        <div className="relative">
          <Input
            placeholder="搜索邮件..."
            value={searchQuery}
            onInputChange={handleSearchChange}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* 邮件列表 */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center p-8 text-red-500">
            {error}
          </div>
        )}
        
        {!loading && !error && filteredEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-neutral-500">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p>没有找到符合条件的邮件</p>
          </div>
        )}
        
        {filteredEmails.length > 0 && (
          <>
            {filteredEmails.map((email) => (
              <React.Fragment key={email.id}>
                <EmailItem
                  email={email}
                  selected={selectedEmails.includes(email.id)}
                  onClick={() => handleEmailClick(email)}
                  onSelect={(checked) => handleEmailSelect(email.id, checked)}
                  onToggleStar={() => handleToggleStar(email.id, email.isStarred)}
                />
                <Separator />
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* 加载更多 */}
      {onLoadMore && !loading && filteredEmails.length > 0 && (
        <div className="p-3 border-t text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLoadMore}
          >
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmailList;
