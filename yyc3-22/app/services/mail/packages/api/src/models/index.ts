/**
 * @file 数据库模型定义
 * @description 核心业务实体的数据模型定义
 * @module models
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import { QueryResult } from 'pg';
import { query } from '../config/database';
import { env } from '../config/env';
import { logInfo, logError } from '../utils/logger';

// =======================================
// 类型定义
// =======================================

/**
 * 用户角色类型
 */
export type UserRole = 'user' | 'admin' | 'superadmin';

/**
 * 用户状态类型
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * 邮件优先级
 */
export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 邮件状态
 */
export type EmailStatus = 'draft' | 'sent' | 'received' | 'read' | 'archived' | 'deleted';

/**
 * 邮件分类
 */
export type EmailCategory = 'primary' | 'social' | 'promotions' | 'updates' | 'forums' | 'spam';

// =======================================
// 用户模型
// =======================================

/**
 * 用户模型接口
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  email_verification_token: string | null;
  refresh_token: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * 用户创建接口
 */
export interface CreateUser {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  status?: UserStatus;
}

/**
 * 用户更新接口
 */
export interface UpdateUser {
  first_name?: string;
  last_name?: string;
  password_hash?: string;
  role?: UserRole;
  status?: UserStatus;
  is_verified?: boolean;
  email_verification_token?: string | null;
  refresh_token?: string | null;
  last_login_at?: Date;
}

// =======================================
// 邮件模型
// =======================================

/**
 * 邮件模型接口
 */
export interface Email {
  id: string;
  user_id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_draft: boolean;
  is_deleted: boolean;
  is_sent: boolean;
  sent_at: Date | null;
  received_at: Date | null;
  thread_id: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * 邮件创建接口
 */
export interface CreateEmail {
  user_id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  is_read?: boolean;
  is_starred?: boolean;
  is_draft?: boolean;
  is_deleted?: boolean;
  is_sent?: boolean;
  sent_at?: Date | null;
  received_at?: Date | null;
  thread_id?: string | null;
}

/**
 * 邮件更新接口
 */
export interface UpdateEmail {
  sender?: string;
  recipients?: string[];
  subject?: string;
  body?: string;
  is_read?: boolean;
  is_starred?: boolean;
  is_draft?: boolean;
  is_deleted?: boolean;
  is_sent?: boolean;
  sent_at?: Date | null;
  received_at?: Date | null;
  thread_id?: string | null;
}

// =======================================
// 附件模型
// =======================================

/**
 * 附件模型接口
 */
export interface EmailAttachment {
  id: string;
  email_id: string;
  filename: string;
  content_type: string;
  size: number;
  storage_path: string;
  upload_url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * 附件创建接口
 */
export interface CreateEmailAttachment {
  email_id: string;
  filename: string;
  content_type: string;
  size: number;
  storage_path: string;
  upload_url?: string | null;
}

// =======================================
// 邮件分类模型
// =======================================

/**
 * 邮件分类自定义模型接口
 */
export interface EmailCustomCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * 邮件分类创建接口
 */
export interface CreateEmailCustomCategory {
  user_id: string;
  name: string;
  color: string;
  description?: string;
  is_default?: boolean;
}

// =======================================
// 邮件分析模型
// =======================================

/**
 * 邮件分析模型接口
 */
export interface EmailAnalysis {
  id: string;
  email_id: string;
  user_id: string;
  summary: string;
  key_points: string[];
  sentiment_score: number;
  entities: Record<string, string[]>;
  action_items: string[];
  follow_up_by: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * 邮件分析创建接口
 */
export interface CreateEmailAnalysis {
  email_id: string;
  user_id: string;
  summary: string;
  key_points: string[];
  sentiment_score: number;
  entities: Record<string, string[]>;
  action_items?: string[];
  follow_up_by?: Date | null;
}

// =======================================
// 用户活动日志模型
// =======================================

/**
 * 用户活动类型
 */
export type UserActivityType = 
  | 'login' 
  | 'logout' 
  | 'password_change' 
  | 'email_verification' 
  | 'profile_update' 
  | 'api_access' 
  | 'security_event';

/**
 * 用户活动日志模型接口
 */
export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: UserActivityType;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  success: boolean;
  created_at: Date;
}

/**
 * 用户活动日志创建接口
 */
export interface CreateUserActivityLog {
  user_id: string;
  activity_type: UserActivityType;
  ip_address: string;
  user_agent: string;
  details?: Record<string, any>;
  success?: boolean;
}

// =======================================
// 数据库初始化和迁移函数
// =======================================

/**
 * 初始化数据库表结构
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    logInfo('开始初始化数据库表结构...');
    
    // 创建用户表
    await createUsersTable();
    
    // 创建邮件表
    await createEmailsTable();
    
    // 创建附件表
    await createAttachmentsTable();
    
    // 创建自定义分类表
    await createEmailCustomCategoriesTable();
    
    // 创建邮件分析表
    await createEmailAnalysesTable();
    
    // 创建用户活动日志表
    await createUserActivityLogsTable();
    
    logInfo('✅ 数据库表结构初始化完成');
    return true;
  } catch (error) {
    logError('❌ 数据库表结构初始化失败', error as Error);
    throw error;
  }
};

/**
 * 创建用户表
 */
async function createUsersTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      is_verified BOOLEAN NOT NULL DEFAULT false,
      email_verification_token VARCHAR(255),
      refresh_token TEXT,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
  `;
  
  await query(queryText, [], { name: 'create_users_table' });
  logInfo('用户表创建/验证完成');
}

/**
 * 创建邮件表
 */
async function createEmailsTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender VARCHAR(255) NOT NULL,
      recipients JSONB NOT NULL,
      subject TEXT,
      body TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      is_starred BOOLEAN NOT NULL DEFAULT false,
      is_draft BOOLEAN NOT NULL DEFAULT false,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      is_sent BOOLEAN NOT NULL DEFAULT false,
      sent_at TIMESTAMP,
      received_at TIMESTAMP,
      thread_id VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
    CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
    CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
    CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
    CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
    CREATE INDEX IF NOT EXISTS idx_emails_deleted_at ON emails(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_emails_is_draft ON emails(is_draft);
    CREATE INDEX IF NOT EXISTS idx_emails_is_flagged ON emails(is_flagged);
    CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from);
  `;
  
  await query(queryText, [], { name: 'create_emails_table' });
  logInfo('邮件表创建/验证完成');
}

/**
 * 创建附件表
 */
async function createAttachmentsTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      content_type VARCHAR(100) NOT NULL,
      size BIGINT NOT NULL,
      storage_path TEXT NOT NULL,
      upload_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
  `;
  
  await query(queryText, [], { name: 'create_attachments_table' });
  logInfo('附件表创建/验证完成');
}

/**
 * 创建自定义分类表
 */
async function createEmailCustomCategoriesTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS email_custom_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(20) NOT NULL DEFAULT '#007bff',
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP,
      
      -- 同一用户下的分类名称必须唯一且未删除
      CONSTRAINT unique_user_category UNIQUE(user_id, name, deleted_at)
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_email_custom_categories_user_id ON email_custom_categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_custom_categories_deleted_at ON email_custom_categories(deleted_at);
  `;
  
  await query(queryText, [], { name: 'create_email_custom_categories_table' });
  logInfo('自定义分类表创建/验证完成');
}

/**
 * 创建邮件分析表
 */
async function createEmailAnalysesTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS email_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
      summary TEXT NOT NULL,
      key_points JSONB NOT NULL,
      sentiment_score NUMERIC(3,2) NOT NULL,
      entities JSONB NOT NULL,
      action_items JSONB DEFAULT '[]',
      follow_up_by TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      
      -- 每个邮件只能有一个分析记录
      CONSTRAINT unique_email_analysis UNIQUE(email_id)
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_email_analyses_email_id ON email_analyses(email_id);
    CREATE INDEX IF NOT EXISTS idx_email_analyses_sentiment_score ON email_analyses(sentiment_score);
    CREATE INDEX IF NOT EXISTS idx_email_analyses_follow_up_by ON email_analyses(follow_up_by);
  `;
  
  await query(queryText, [], { name: 'create_email_analyses_table' });
  logInfo('邮件分析表创建/验证完成');
}

/**
 * 创建用户活动日志表
 */
async function createUserActivityLogsTable(): Promise<void> {
  const queryText = `
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      ip_address VARCHAR(50),
      user_agent TEXT,
      details JSONB DEFAULT '{}',
      success BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_ip_address ON user_activity_logs(ip_address);
  `;
  
  await query(queryText, [], { name: 'create_user_activity_logs_table' });
  logInfo('用户活动日志表创建/验证完成');
}

// 导出所有模型类型和函数
export * from './userModel';
export * from './mailModel';
export * from './categoryModel';
export * from './analyticsModel';
