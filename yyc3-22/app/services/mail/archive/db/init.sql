-- 🚀 邮件平台数据库初始化脚本
-- @file init.sql
-- @description 初始化数据库表结构和索引
-- @author YYC
-- @version 1.0.0
-- @created 2024-10-15

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 创建邮件表
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(255) NOT NULL,
    recipients TEXT[] NOT NULL,
    cc TEXT[] DEFAULT '{}',
    bcc TEXT[] DEFAULT '{}',
    subject VARCHAR(512),
    body TEXT,
    body_html TEXT,
    attachments_count INTEGER DEFAULT 0,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    is_trash BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    thread_id VARCHAR(255),
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 创建附件表
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    path VARCHAR(512) NOT NULL,
    s3_key VARCHAR(512),
    preview_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建邮件分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#0078d4',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 创建邮件分类关联表
CREATE TABLE IF NOT EXISTS email_categories (
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (email_id, category_id)
);

-- 创建邮件分析表
CREATE TABLE IF NOT EXISTS email_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    sender_reputation VARCHAR(50),
    spam_score FLOAT DEFAULT 0,
    sentiment VARCHAR(20),
    key_topics TEXT[],
    priority_score FLOAT DEFAULT 0,
    response_time_prediction INTEGER, -- 预测响应时间（分钟）
    ai_summary TEXT,
    ai_tags TEXT[],
    entities JSONB, -- 存储提取的实体信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户活动日志表
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB, -- 存储额外的活动元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_sender ON emails(sender);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_categories_email_id ON email_categories(email_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_categories_category_id ON email_categories(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_analytics_email_id ON email_analytics(email_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

-- 创建视图：邮件统计视图
CREATE OR REPLACE VIEW email_statistics AS
SELECT 
    u.id as user_id,
    COUNT(e.id) as total_emails,
    COUNT(CASE WHEN e.is_read THEN 1 END) as read_emails,
    COUNT(CASE WHEN e.is_starred THEN 1 END) as starred_emails,
    COUNT(CASE WHEN e.is_trash THEN 1 END) as trash_emails,
    COUNT(CASE WHEN e.is_draft THEN 1 END) as draft_emails,
    COUNT(CASE WHEN e.is_sent THEN 1 END) as sent_emails
FROM users u
LEFT JOIN emails e ON u.id = e.user_id AND e.deleted_at IS NULL
GROUP BY u.id;

-- 创建系统默认分类
INSERT INTO categories (id, user_id, name, color, description, is_system)
VALUES 
    (uuid_generate_v4(), NULL, '重要', '#ff5252', '重要邮件', true),
    (uuid_generate_v4(), NULL, '工作', '#4caf50', '工作相关邮件', true),
    (uuid_generate_v4(), NULL, '个人', '#2196f3', '个人邮件', true),
    (uuid_generate_v4(), NULL, '促销', '#ff9800', '促销邮件', true)
ON CONFLICT DO NOTHING;

-- 创建管理员用户（仅开发环境）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
        INSERT INTO users (id, email, password_hash, name, is_active, is_verified, role)
        VALUES (
            uuid_generate_v4(),
            'admin@example.com',
            '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin123
            '系统管理员',
            true,
            true,
            'admin'
        );
    END IF;
END $$;