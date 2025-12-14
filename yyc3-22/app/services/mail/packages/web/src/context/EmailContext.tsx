"use client";

/**
 * @file EmailContext.tsx
 * @description 邮件上下文管理
 * @module context
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Email, EmailFilter, NewEmail, EmailListResponse, EmailQueryParams, EmailSummary } from '../types';
import { emailService } from '../services/api';

// 附件接口
export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  previewUrl?: string;
}

// 邮件状态类型定义
interface EmailState {
  emails: Email[];
  currentEmail: Email | null;
  selectedEmails: Set<string>;
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'detail' | 'compose';
}

// 邮件操作类型定义
type EmailAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMAILS'; payload: Email[] }
  | { type: 'SET_CURRENT_EMAIL'; payload: Email | null }
  | { type: 'UPDATE_EMAIL'; payload: { id: string; updates: Partial<Email> } }
  | { type: 'UPDATE_EMAILS'; payload: { ids: string[]; updates: Partial<Email> } }
  | { type: 'DELETE_EMAILS'; payload: string[] }
  | { type: 'SELECT_EMAIL'; payload: { id: string; selected: boolean } }
  | { type: 'SELECT_ALL_EMAILS'; payload: boolean }
  | { type: 'CLEAR_SELECTED_EMAILS' }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'detail' | 'compose' };

// 邮件上下文接口定义
export interface EmailContextType {
  // 邮件数据和状态
  emails: Email[];
  currentEmail: Email | null;
  selectedEmails: Set<string>;
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'detail' | 'compose';
  
  // 操作方法
  fetchEmails: (filter?: EmailFilter) => Promise<void>;
  getEmailById: (id: string) => Promise<void>;
  sendEmail: (email: NewEmail) => Promise<void>;
  deleteEmails: (ids: string[]) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  markAsRead: (ids: string[], read: boolean) => Promise<void>;
  selectEmail: (id: string, selected: boolean) => void;
  selectAllEmails: (selected: boolean) => void;
  clearSelectedEmails: () => void;
  setViewMode: (mode: 'list' | 'detail' | 'compose') => void;
  
  // 新增方法
  toggleEmailStar: (id: string) => Promise<void>;
  toggleReadStatus: (id: string, isRead?: boolean) => Promise<void>;
  
  // 附件操作方法
  uploadAttachment: (file: File) => Promise<Attachment>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  downloadAttachment: (attachmentId: string) => Promise<void>;
}

// 创建上下文
const EmailContext = createContext<EmailContextType | undefined>(undefined);

// 邮件上下文提供者Props接口
interface EmailProviderProps {
  children: ReactNode;
}

// 初始状态
const initialState: EmailState = {
  emails: [],
  currentEmail: null,
  selectedEmails: new Set<string>(),
  isLoading: false,
  error: null,
  viewMode: 'list',
};

// Reducer函数
const emailReducer = (state: EmailState, action: EmailAction): EmailState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EMAILS':
      return { ...state, emails: action.payload, selectedEmails: new Set() };
    case 'SET_CURRENT_EMAIL':
      return { ...state, currentEmail: action.payload };
    case 'UPDATE_EMAIL':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload.id
            ? { ...email, ...action.payload.updates }
            : email
        ),
        currentEmail: state.currentEmail?.id === action.payload.id
          ? { ...state.currentEmail, ...action.payload.updates }
          : state.currentEmail
      };
    case 'UPDATE_EMAILS':
      return {
        ...state,
        emails: state.emails.map(email =>
          action.payload.ids.includes(email.id)
            ? { ...email, ...action.payload.updates }
            : email
        ),
        currentEmail: state.currentEmail && action.payload.ids.includes(state.currentEmail.id)
          ? { ...state.currentEmail, ...action.payload.updates }
          : state.currentEmail,
        selectedEmails: new Set()
      };
    case 'DELETE_EMAILS':
      return {
        ...state,
        emails: state.emails.filter(email => !action.payload.includes(email.id)),
        currentEmail: state.currentEmail && action.payload.includes(state.currentEmail.id)
          ? null
          : state.currentEmail,
        selectedEmails: new Set()
      };
    case 'SELECT_EMAIL':
      return {
        ...state,
        selectedEmails: new Set(action.payload.selected
          ? [...state.selectedEmails, action.payload.id]
          : Array.from(state.selectedEmails).filter(emailId => emailId !== action.payload.id))
      };
    case 'SELECT_ALL_EMAILS':
      return {
        ...state,
        selectedEmails: action.payload
          ? new Set(state.emails.map(email => email.id))
          : new Set()
      };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'CLEAR_SELECTED_EMAILS':
      return { ...state, selectedEmails: new Set() };
    default:
      return state;
  }
};

// 邮件上下文提供者组件
export const EmailProvider: React.FC<EmailProviderProps> = ({ children }) => {
  // 使用useReducer管理状态
  const [state, dispatch] = useReducer(emailReducer, initialState);

  // 获取邮件列表
  const fetchEmails = async (filter?: EmailFilter) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      // 将EmailFilter转换为EmailQueryParams
      const queryParams: EmailQueryParams = {
        ...filter,
        page: filter?.page || 1,
        limit: filter?.limit || 20
      };
      const response = await emailService.getEmails(queryParams);
      // 从EmailListResponse中提取emails数组并转换为Email[]
      const emails: Email[] = (response.data?.emails || []).map((summary: EmailSummary) => ({
        ...summary,
        // 添加Email类型所需的其他属性
        content: '', // EmailSummary中可能没有content字段
        to: summary.to || [],
        cc: [], // EmailSummary中可能没有cc字段
        bcc: [], // EmailSummary中可能没有bcc字段
        attachments: [], // EmailSummary中可能没有attachments字段
        isRead: summary.isRead || false,
        isStarred: summary.isStarred || false,
        folder: 'inbox', // EmailSummary中可能没有folder字段
        userId: 'default-user-id', // EmailSummary没有userId属性，使用默认值
        createdAt: summary.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString() // EmailSummary中可能没有updatedAt字段
      }));
      dispatch({ type: 'SET_EMAILS', payload: emails });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: '获取邮件列表失败' });
      console.error('获取邮件列表失败:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 根据ID获取邮件详情
  const getEmailById = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const response = await emailService.getEmailById(id);
      dispatch({ type: 'SET_CURRENT_EMAIL', payload: response.data || null });
      
      // 如果邮件未读，标记为已读
      if (response.data && !response.data.isRead) {
        await markAsRead([id], true);
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: '获取邮件详情失败' });
      console.error('获取邮件详情失败:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 发送邮件
  const sendEmail = async (email: NewEmail) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await emailService.createEmail(email);
      // 发送成功后，重新获取邮件列表
      await fetchEmails();
      
      return;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: '发送邮件失败' });
      console.error('发送邮件失败:', err);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 删除邮件
  const deleteEmails = async (ids: string[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await emailService.deleteEmails(ids);
      // 从状态中移除已删除的邮件
      dispatch({ type: 'DELETE_EMAILS', payload: ids });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: '删除邮件失败' });
      console.error('删除邮件失败:', err);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 切换邮件星标状态 - 使用useCallback优化性能
  const toggleStar = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 获取当前邮件的星标状态
      const email = state.emails.find(e => e.id === id);
      if (!email) return;
      
      const newStarredStatus = !email.isStarred;
      
      // 乐观更新UI
      dispatch({
        type: 'UPDATE_EMAIL',
        payload: { id, updates: { isStarred: newStarredStatus } }
      });
      
      // 调用API更新状态
      await emailService.markEmailsAsStarred([id], newStarredStatus);
    } catch (err) {
      // 失败时回滚状态
      await fetchEmails();
      if (state.currentEmail) {
        await getEmailById(state.currentEmail.id);
      }
      dispatch({ type: 'SET_ERROR', payload: '更新星标状态失败' });
      console.error('更新星标状态失败:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.emails, state.currentEmail]);

  // 标记邮件已读/未读
  const markAsRead = useCallback(async (ids: string[], read: boolean) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // 乐观更新UI
      dispatch({
        type: 'UPDATE_EMAILS',
        payload: { ids, updates: { isRead: read } }
      });
      
      // 调用API更新状态
      await emailService.markEmailsAsRead(ids, read);
    } catch (err) {
      // 失败时回滚状态
      await fetchEmails();
      if (state.currentEmail) {
        await getEmailById(state.currentEmail.id);
      }
      dispatch({ type: 'SET_ERROR', payload: '更新已读状态失败' });
      console.error('更新已读状态失败:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 切换邮件星标状态
  const toggleEmailStar = useCallback(async (emailId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const email = state.emails.find(e => e.id === emailId);
      if (!email) return;
      
      const newStarredStatus = !email.isStarred;
        
        // 乐观更新UI
        dispatch({
          type: 'UPDATE_EMAIL',
          payload: { id: emailId, updates: { isStarred: newStarredStatus } }
        });
        
        // 调用API更新状态
        await emailService.markEmailsAsStarred([emailId], newStarredStatus);
    } catch (err) {
      // 失败时回滚状态
      await fetchEmails();
      if (state.currentEmail) {
        await getEmailById(state.currentEmail.id);
      }
      dispatch({ type: 'SET_ERROR', payload: '更新星标状态失败' });
      console.error('更新星标状态失败:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.emails]);

  // 切换单个邮件的已读状态
  const toggleReadStatus = useCallback(async (id: string, isRead?: boolean) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const email = state.emails.find(e => e.id === id);
      if (!email) return;
      
      const newReadStatus = isRead !== undefined ? isRead : !email.isRead;
      return await markAsRead([id], newReadStatus);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: '更新邮件已读状态失败' });
      console.error('更新邮件已读状态失败:', err);
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.emails, markAsRead]);

  // 选择/取消选择邮件
  const selectEmail = useCallback((id: string, selected: boolean) => {
    dispatch({
      type: 'SELECT_EMAIL',
      payload: { id, selected }
    });
  }, []);

  // 全选/取消全选邮件
  const selectAllEmails = useCallback((selected: boolean) => {
    dispatch({
      type: 'SELECT_ALL_EMAILS',
      payload: selected
    });
  }, []);

  // 清除选中的邮件
  const clearSelectedEmails = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_EMAILS' });
  }, []);

  // 设置视图模式
  const setViewMode = (mode: 'list' | 'detail' | 'compose') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };
  
  // 实现上传附件方法
  const uploadAttachment = async (file: File): Promise<Attachment> => {
    try {
      // 模拟上传附件
      // 在实际应用中，这里应该调用API上传文件
      console.log('Uploading attachment:', file.name);
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成预览URL（仅图片类型）
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      // 返回附件对象
      return {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      };
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  };

  // 实现删除附件方法
  const removeAttachment = async (attachmentId: string): Promise<void> => {
    try {
      // 模拟删除附件
      // 在实际应用中，这里应该调用API删除文件
      console.log('Removing attachment:', attachmentId);
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 清理预览URL（如果存在）
      // 注意：在实际应用中，这需要通过状态管理来跟踪附件的previewUrl
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      throw error;
    }
  };

  // 实现下载附件方法
  const downloadAttachment = async (attachmentId: string): Promise<void> => {
    try {
      // 模拟下载附件
      // 在实际应用中，这里应该调用API下载文件
      console.log('Downloading attachment:', attachmentId);
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 在实际应用中，这里应该触发文件下载
      // 例如使用window.open或创建Blob URL
      alert('模拟下载附件成功');
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw error;
    }
  };

  // 上下文值
  const contextValue: EmailContextType = {
    ...state,
    // 确保selectedEmails是Set<string>类型
    selectedEmails: new Set(state.selectedEmails),
    fetchEmails,
    getEmailById,
    sendEmail,
    deleteEmails,
    toggleStar,
    markAsRead,
    selectEmail,
      selectAllEmails,
      clearSelectedEmails,
    toggleEmailStar,
    toggleReadStatus,
    setViewMode,
    uploadAttachment,
    removeAttachment,
    downloadAttachment,
  };

  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
};

// 自定义Hook，便于使用邮件上下文
export const useEmailContext = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  return context;
};
