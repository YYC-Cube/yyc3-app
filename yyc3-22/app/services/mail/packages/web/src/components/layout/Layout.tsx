"use client";
/**
 * @file Layout组件 - 应用程序的主要布局组件
 * @description 包含应用程序的导航、侧边栏和主要内容区域
 * @module components/layout
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, X, Search, Settings, LogOut, Mail, Star, Trash2, Tag, BarChart3, Inbox, Send, Calendar, FileText, HelpCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import type { User as UserType } from '@/types';

// 使用UserType代替User以避免重复导入

interface LayoutProps {
  children: React.ReactNode;
}

// 侧边栏菜单项定义
interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  isActive?: boolean;
}

/**
 * 应用布局组件
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // 检测窗口大小，在移动设备上默认关闭侧边栏
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    // 获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 侧边栏菜单
  const sidebarMenu: SidebarMenuItem[] = [
    {
      id: 'inbox',
      label: '收件箱',
      icon: <Inbox className="h-5 w-5" />,
      path: '/',
      badge: 24,
    },
    {
      id: 'sent',
      label: '已发送',
      icon: <Send className="h-5 w-5" />,
      path: '/sent',
    },
    {
      id: 'starred',
      label: '星标邮件',
      icon: <Star className="h-5 w-5" />,
      path: '/starred',
      badge: 5,
    },
    {
      id: 'trash',
      label: '垃圾箱',
      icon: <Trash2 className="h-5 w-5" />,
      path: '/trash',
    },
    {
      id: 'drafts',
      label: '草稿',
      icon: <FileText className="h-5 w-5" />,
      path: '/drafts',
      badge: 3,
    },
  ];

  // 分类菜单项
  const categories: SidebarMenuItem[] = [
    {
      id: 'work',
      label: '工作',
      icon: <Tag className="h-5 w-5 text-blue-500" />,
      path: '/category/work',
    },
    {
      id: 'personal',
      label: '个人',
      icon: <Tag className="h-5 w-5 text-green-500" />,
      path: '/category/personal',
    },
    {
      id: 'finance',
      label: '财务',
      icon: <Tag className="h-5 w-5 text-purple-500" />,
      path: '/category/finance',
    },
  ];

  // 其他功能菜单项
  const otherMenu: SidebarMenuItem[] = [
    {
      id: 'analytics',
      label: '邮件分析',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/analytics',
    },
    {
      id: 'calendar',
      label: '日历',
      icon: <Calendar className="h-5 w-5" />,
      path: '/calendar',
    },
    {
      id: 'settings',
      label: '设置',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
    },
    {
      id: 'help',
      label: '帮助中心',
      icon: <HelpCircle className="h-5 w-5" />,
      path: '/help',
    },
  ];

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 处理登出
  const handleLogout = () => {
    // 在实际应用中，这里会调用登出API
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 侧边栏 */}
        <aside className="fixed lg:relative z-30 w-64 h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Email Platform</h1>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-1 rounded-full hover:bg-gray-100"
            aria-label="关闭侧边栏"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 主要菜单项 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-6">
            <button className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors mb-4">
              <PlusCircle className="h-5 w-5 mr-2" />
              写邮件
            </button>
            
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">主要功能</h3>
            <div className="space-y-1">
              {sidebarMenu.map((item) => (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === item.path ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50'}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
            </div>
          </div>

          {/* 分类 */}
          <div className="mb-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">分类</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.path}
                    className={`w-full flex items-center py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === category.path ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50'}`}
                  >
                    <span className="mr-3">{category.icon}</span>
                    <span>{category.label}</span>
                  </Link>
                ))}
              <button className="w-full flex items-center py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50">
                <PlusCircle className="h-4 w-4 mr-3" />
                <span>添加分类</span>
              </button>
            </div>
          </div>

          {/* 其他功能 */}
          <div className="px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">其他</h3>
            <div className="space-y-1">
              {otherMenu.map((item) => (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`w-full flex items-center py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === item.path ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-400/50'}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        </nav>

        {/* 用户信息 */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-medium">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user.fullName || user.email}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button 
            onClick={handleLogout}
            className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="登出"
          >
            <LogOut className="h-4 w-4" />
          </button>
            </div>
          </div>
        )}
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-20">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar} 
                className="lg:hidden p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="打开侧边栏"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 relative lg:ml-0">
                <div className="relative rounded-md shadow-sm max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50 dark:bg-blue-900/30 dark:text-gray-100"
                    placeholder="搜索邮件..."
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative" aria-label="通知">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" aria-hidden="true"></span>
              </button>
              <button className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200" aria-label="设置">
                <Settings className="h-5 w-5" />
              </button>
              {user && (
                <div className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-medium">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user.fullName || user.email}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>

      {/* 移动设备遮罩层 */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-20 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;

// 邮件列表组件
interface EmailItem {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  attachments?: number;
}

/**
 * 邮件列表组件
 */
export const EmailList: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showCheckedAll, setShowCheckedAll] = useState(false);

  // 模拟获取邮件列表数据
  useEffect(() => {
    // 在实际应用中，这里会调用API获取邮件列表
    const mockEmails: EmailItem[] = [
      {
        id: '1',
        sender: {
          name: '张三',
          email: 'zhangsan@example.com'
        },
        subject: '项目进度会议',
        preview: '嗨，关于明天的项目进度会议，我们需要准备以下材料...',
        date: '今天 10:30',
        isRead: false,
        isStarred: true,
        attachments: 2
      },
      {
        id: '2',
        sender: {
          name: '李四',
          email: 'lisi@example.com'
        },
        subject: '周报提交提醒',
        preview: '各位同事请注意，本周五下午5点前请提交周报...',
        date: '今天 09:15',
        isRead: true,
        isStarred: false
      },
      {
        id: '3',
        sender: {
          name: '王五',
          email: 'wangwu@example.com'
        },
        subject: '产品设计稿评审',
        preview: '设计稿已更新，请查收附件并提出意见...',
        date: '昨天 16:45',
        isRead: false,
        isStarred: false,
        attachments: 1
      },
    ];

    setTimeout(() => {
      setEmails(mockEmails);
      setLoading(false);
    }, 500);
  }, []);

  // 切换邮件选中状态
  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  // 切换邮件已读状态
  const toggleReadStatus = (emailId: string) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === emailId 
          ? { ...email, isRead: !email.isRead }
          : email
      )
    );
  };

  // 切换邮件星标状态
  const toggleStarStatus = (emailId: string) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === emailId 
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm"
      style={{ boxShadow: '-4px 0 12px rgba(59, 130, 246, 0.3)' }}
    >
      {/* 邮件列表工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded hover:bg-gray-100 text-gray-500"
            onClick={toggleSelectAll}
          >
            {selectedEmails.length > 0 && selectedEmails.length === emails.length ? (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            ) : (
              <div className={`h-5 w-5 rounded border ${selectedEmails.length > 0 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}></div>
            )}
          </button>
          <button className="p-2 rounded hover:bg-gray-100 text-gray-500">
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 text-gray-500">
            <Mail className="h-4 w-4" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100 text-gray-500">
            <Tag className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {emails.length} 封邮件
        </div>
      </div>

      {/* 邮件列表 */}
      <div className="divide-y divide-gray-100">
        {emails.map(email => {
          const isSelected = selectedEmails.includes(email.id);
          return (
            <div 
              key={email.id}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
              onClick={(e) => {
                // 如果点击的是复选框或操作按钮，不切换选中状态
                if ((e.target as HTMLElement).closest('button')) return;
                toggleEmailSelection(email.id);
              }}
            >
              <button 
                className="mr-3 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEmailSelection(email.id);
                }}
              >
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                ) : (
                  <div className={`h-5 w-5 rounded border ${email.isRead ? 'border-gray-300' : 'border-blue-600 bg-blue-50'}`}></div>
                )}
              </button>
              
              <button 
                className="mr-3 flex-shrink-0 text-gray-400 hover:text-yellow-400"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarStatus(email.id);
                }}
              >
                <Star className={`h-4 w-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </button>
              
              <div className={`flex-1 min-w-0 ${email.isRead ? 'text-gray-500' : 'font-medium'}`}>
                <div className="flex justify-between mb-1">
                  <div className="truncate max-w-xs">{email.sender.name}</div>
                  <div className="text-sm whitespace-nowrap">{email.date}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="truncate mr-4">{email.subject}</div>
                  {email.attachments && (
                    <div className="text-xs text-gray-400 mr-2">📎{email.attachments}</div>
                  )}
                  <div className="truncate text-sm text-gray-500 max-w-md">
                    {email.preview}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
