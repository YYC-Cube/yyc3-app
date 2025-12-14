/**
 * @file 类型定义文件
 * @description 定义邮件平台的核心数据模型和接口类型
 * @module types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// 邮件相关类型
export interface Attachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string;
  size: number;
  filePath: string;
  createdAt: string;
}

export interface Email {
  id: string;
  userId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  status: 'draft' | 'sent' | 'received' | 'archived' | 'trash';
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'normal' | 'high';
  categoryIds: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  receivedAt?: string;
}

export interface EmailSummary {
  id: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  status: Email['status'];
  isRead: boolean;
  isStarred: boolean;
  priority: Email['priority'];
  attachmentsCount: number;
  categoryIds: string[];
  createdAt: string;
  receivedAt?: string;
}

export interface EmailFilter {
  status?: Email['status'][];
  categoryId?: string;
  searchTerm?: string;
  from?: string;
  to?: string;
  subject?: string;
  minDate?: string;
  maxDate?: string;
  isRead?: boolean;
  isStarred?: boolean;
  priority?: Email['priority'][];
  folder?: string;
  sortBy?: keyof Email;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 排序选项类型
export interface SortOption {
  sortBy: keyof Email;
  sortOrder: 'asc' | 'desc';
}

export interface EmailQueryParams extends EmailFilter {
  page: number;
  limit: number;
  sortBy?: keyof Email;
  sortOrder?: 'asc' | 'desc';
}
// 邮件列表响应类型
export interface EmailListResponse {
  emails: EmailSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 新建邮件类型
export interface NewEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: Attachment[];
  replyToId?: string;
  priority?: Email['priority'];
}

// 分类相关类型
export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 分析相关类型
export interface EmailAnalytics {
  totalEmails: number;
  unreadEmails: number;
  drafts: number;
  sentEmails: number;
  starredEmails: number;
  emailsByCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  emailsByDay: {
    date: string;
    count: number;
  }[];
  topSenders: {
    email: string;
    count: number;
  }[];
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 表单相关类型
export interface FormErrors<T> {
  [key: string]: string;
}

export interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isValid: boolean;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  autoHide?: boolean;
  duration?: number;
}

// UI相关类型
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
