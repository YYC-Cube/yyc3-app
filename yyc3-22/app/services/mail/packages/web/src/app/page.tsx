"use client";
import { useState } from 'react';
import { PlusCircle, Filter, Search, RefreshCw } from 'lucide-react';
import { Button, Input, IconButton } from '@/components/common';
import { EmailList } from '@/components/mail';
import type { Email } from '@/types';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/theme';

/**
 * @file 邮件平台主页面
 * @description 显示邮件列表、搜索和过滤功能
 * @author YYC
 * @version 1.0.0
 */
export default function MailInbox() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 模拟邮件数据
  const mockEmails: Email[] = [
    {
      id: '1',
      userId: 'test-user',
      from: 'zhangsan@example.com',
      to: ['me@example.com'],
      subject: '项目进度报告',
      content: '您好，这是本周的项目进度报告，请查收。',
      isRead: false,
      isStarred: true,
      receivedAt: '2024-10-15T10:30:00',
      status: 'received',
      priority: 'normal',
      categoryIds: [],
      createdAt: '2024-10-15T10:30:00',
      updatedAt: '2024-10-15T10:30:00',
      attachments: []
    },
    {
      id: '2',
      userId: 'test-user',
      from: 'lisi@example.com',
      to: ['me@example.com'],
      subject: '会议安排通知',
      content: '下周一下午三点将举行技术讨论会，请准时参加。',
      isRead: true,
      isStarred: false,
      receivedAt: '2024-10-14T15:20:00',
      status: 'received',
      priority: 'normal',
      categoryIds: [],
      createdAt: '2024-10-14T15:20:00',
      updatedAt: '2024-10-14T15:20:00',
      attachments: []
    },
    {
      id: '3',
      userId: 'test-user',
      from: 'wangwu@example.com',
      to: ['me@example.com'],
      subject: '财务报销表格',
      content: '请填写附件中的报销表格并在下周五前提交。',
      isRead: false,
      isStarred: false,
      receivedAt: '2024-10-14T09:15:00',
      status: 'received',
      priority: 'normal',
      categoryIds: [],
      createdAt: '2024-10-14T09:15:00',
      updatedAt: '2024-10-14T09:15:00',
      attachments: [{ 
        id: '1', 
        emailId: '3',
        filename: '报销表格.xlsx', 
        size: 2048,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filePath: '/attachments/1.xlsx',
        createdAt: '2024-10-14T09:15:00'
      }]
    }
  ];

  const handleComposeClick = () => {
    router.push('/compose');
  };

  const handleRefresh = () => {
    // 刷新逻辑
    console.log('刷新邮件列表');
  };

  const handleFilter = () => {
    // 筛选逻辑
    console.log('打开筛选面板');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 */}
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <h1 className="text-xl font-semibold">收件箱</h1>
        <div className="flex items-center space-x-2">
          <IconButton
            icon={<RefreshCw size={18} />}
            onClick={handleRefresh}
            aria-label="刷新"
            size="small"
          />
          <IconButton
            icon={<Filter size={18} />}
            onClick={handleFilter}
            aria-label="筛选"
            size="small"
          />
          <IconButton
            icon={<PlusCircle size={18} />}
            onClick={handleComposeClick}
            aria-label="写邮件"
            size="small"
          />
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="p-4">
        <div className="relative max-w-3xl">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            type="text" 
            placeholder="搜索邮件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 邮件列表 */}
      <div className="flex-1 overflow-auto">
        <EmailList emails={mockEmails} />
        {/* 这里会显示邮件列表组件 */}
        <div className="bg-white">
          {/* 示例邮件项 */}
          <div className="border-b hover:bg-gray-50 transition-colors">
            <div className="p-4 flex items-center cursor-pointer">
              <div className="w-10 text-center mr-3">
                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 truncate">张三</h3>
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">10:30</span>
                </div>
                <div className="flex justify-between items-start mt-1">
                  <p className="text-sm text-gray-900 truncate">会议通知：项目进度讨论</p>
                  <span className="text-sm text-gray-500 truncate ml-4">请准时参加明天的项目进度讨论会议...</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 更多示例邮件项 */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b hover:bg-gray-50 transition-colors">
              <div className="p-4 flex items-center cursor-pointer">
                <div className="w-10 text-center mr-3">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 truncate">李四</h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">昨天</span>
                  </div>
                  <div className="flex justify-between items-start mt-1">
                    <p className="text-sm text-gray-900 truncate">项目文档更新通知</p>
                    <span className="text-sm text-gray-500 truncate ml-4">我已更新了项目文档，请查看并确认...</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}