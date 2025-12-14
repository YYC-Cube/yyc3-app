/**
 * @file API服务
 * @description 处理前端与后端的通信，提供所有API接口的封装
 * @module services/api
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { 
  User, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  Email, 
  EmailSummary, 
  EmailListResponse, 
  EmailQueryParams, 
  Category, 
  EmailAnalytics,
  ApiResponse
} from '@/types';
import { apiClient } from './apiClient';

// Token管理函数
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

const clearAuthData = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const redirectToLogin = (): void => {
  window.location.href = '/auth/login';
};

// 认证相关API
export const authService = {
  // 用户登录
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // 保存认证信息到localStorage
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setRefreshToken(response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw new Error('登录失败，请稍后重试');
    }
  },

  // 用户注册
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response;
    } catch (error) {
      throw new Error('注册失败，请稍后重试');
    }
  },

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>('/auth/logout');
      
      // 清除localStorage中的认证信息
      clearAuthData();
      
      return response;
    } catch (error) {
      // 即使API调用失败，也清除本地认证信息
      clearAuthData();
      throw new Error('登出失败，请稍后重试');
    }
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      
      // 更新localStorage中的用户信息
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  },

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const response = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });
      
      // 保存新令牌
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setRefreshToken(response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      throw new Error('刷新令牌失败');
    }
  },
};

// 邮件相关API
export const emailService = {
  // 获取邮件列表
  async getEmails(params: EmailQueryParams): Promise<ApiResponse<EmailListResponse>> {
    try {
      const response = await apiClient.get<EmailListResponse>('/emails', { params });
      // 确保返回符合EmailListResponse类型的数据
      if (response.data) {
        const listResponse: EmailListResponse = {
          emails: response.data.emails || [],
          total: response.data.total || 0,
          page: response.data.page || (params?.page || 1),
          limit: response.data.limit || (params?.limit || 20),
          totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / (params?.limit || 20))
        };
        return {
          ...response,
          data: listResponse
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        data: {
          emails: [],
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: 0
        },
        message: '获取邮件列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  },

  // 获取邮件详情
  async getEmailById(emailId: string): Promise<ApiResponse<Email>> {
    try {
      return await apiClient.get<Email>(`/emails/${emailId}`);
    } catch (error) {
      throw new Error('获取邮件详情失败');
    }
  },

  // 创建新邮件
  async createEmail(emailData: Partial<Email>): Promise<ApiResponse<Email>> {
    try {
      return await apiClient.post<Email>('/emails', emailData);
    } catch (error) {
      throw new Error('创建邮件失败');
    }
  },

  // 更新邮件
  async updateEmail(emailId: string, emailData: Partial<Email>): Promise<ApiResponse<Email>> {
    try {
      return await apiClient.patch<Email>(`/emails/${emailId}`, emailData);
    } catch (error) {
      throw new Error('更新邮件失败');
    }
  },

  // 发送邮件
  async sendEmail(emailData: Partial<Email>): Promise<ApiResponse<Email>> {
    try {
      return await apiClient.post<Email>('/emails/send', emailData);
    } catch (error) {
      throw new Error('发送邮件失败');
    }
  },

  // 删除邮件（移动到垃圾箱）
  async deleteEmails(emailIds: string[]): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>('/emails', { data: { emailIds } });
    } catch (error) {
      throw new Error('删除邮件失败');
    }
  },

  // 永久删除邮件
  async permanentlyDeleteEmails(emailIds: string[]): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>('/emails/permanent', { data: { emailIds } });
    } catch (error) {
      throw new Error('永久删除邮件失败');
    }
  },

  // 标记邮件为已读/未读
  async markEmailsAsRead(emailIds: string[], isRead: boolean): Promise<ApiResponse<void>> {
    try {
      return await apiClient.patch<void>('/emails/read', { emailIds, isRead });
    } catch (error) {
      throw new Error('更新邮件阅读状态失败');
    }
  },

  // 更新邮件
  updateEmails: async (ids: string[], updates: Partial<Email>) => {
    return apiClient.patch(`/emails/batch`, { ids, updates });
  },

  // 标记邮件星标状态
  markEmailsAsStarred: async (ids: string[], isStarred: boolean) => {
    return apiClient.patch(`/emails/batch`, { ids, updates: { isStarred } });
  },

  // 上传附件
  async uploadAttachment(formData: FormData): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<any>('/emails/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      throw new Error('上传附件失败');
    }
  },

  // 下载附件
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(`/emails/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('附件下载失败，返回数据为空');
      }
      return response.data;
    } catch (error) {
      throw new Error('下载附件失败');
    }
  },
};

// 分类相关API
export const categoryService = {
  // 获取用户所有分类
  async getUserCategories(): Promise<ApiResponse<Category[]>> {
    try {
      return await apiClient.get<Category[]>('/categories');
    } catch (error) {
      throw new Error('获取分类列表失败');
    }
  },

  // 创建分类
  async createCategory(categoryData: { name: string; color: string; icon?: string }): Promise<ApiResponse<Category>> {
    try {
      return await apiClient.post<Category>('/categories', categoryData);
    } catch (error) {
      throw new Error('创建分类失败');
    }
  },

  // 更新分类
  async updateCategory(categoryId: string, categoryData: { name?: string; color?: string; icon?: string }): Promise<ApiResponse<Category>> {
    try {
      return await apiClient.patch<Category>(`/categories/${categoryId}`, categoryData);
    } catch (error) {
      throw new Error('更新分类失败');
    }
  },

  // 删除分类
  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/categories/${categoryId}`);
    } catch (error) {
      throw new Error('删除分类失败');
    }
  },

  // 为邮件添加分类
  async addCategoryToEmails(emailIds: string[], categoryId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post<void>(`/categories/${categoryId}/emails`, {
        emailIds,
      });
    } catch (error) {
      throw new Error('添加分类失败');
    }
  },

  // 从邮件中移除分类
  async removeCategoryFromEmails(emailIds: string[], categoryId: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/categories/${categoryId}/emails`, {
        data: { emailIds },
      });
    } catch (error) {
      throw new Error('移除分类失败');
    }
  },
};

// 分析相关API
export const analyticsService = {
  // 获取邮件分析数据
  async getEmailAnalytics(): Promise<ApiResponse<EmailAnalytics>> {
    try {
      return await apiClient.get<EmailAnalytics>('/analytics/emails');
    } catch (error) {
      throw new Error('获取邮件分析数据失败');
    }
  },

  // 获取用户活动日志
  async getUserActivity(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    try {
      return await apiClient.get<any>('/analytics/activity', {
        params: { page, limit },
      });
    } catch (error) {
      throw new Error('获取活动日志失败');
    }
  },
};

export default apiClient;
