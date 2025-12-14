#!/usr/bin/env bun

/**
 * YYC³ 邮件平台数据库初始化脚本
 * 创建邮件平台所需的所有表结构和初始数据
 */

import { Pool } from 'pg';

// 数据库配置
const dbConfig = {
  host: '192.168.3.45',
  port: 5432,
  database: 'yyc3_email',
  user: 'yyc3_email',
  password: 'yyc3_admin',
  ssl: false,
};

console.log('🏗️  开始初始化YYC³邮件平台数据库...');

async function initializeDatabase() {
  const pool = new Pool(dbConfig);

  try {
    console.log('🔄 连接数据库...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    console.log('\n🏛️  创建用户和组织表...');

    // 创建组织表
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        settings JSONB DEFAULT '{}',
        subscription_plan VARCHAR(50) DEFAULT 'free',
        max_users INTEGER DEFAULT 10,
        max_emails_per_day INTEGER DEFAULT 1000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 组织表创建成功');

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        organization_id INTEGER REFERENCES organizations(id),
        settings JSONB DEFAULT '{}',
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 用户表创建成功');

    console.log('\n📧 创建邮件相关表...');

    // 创建邮件表
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        from_email VARCHAR(255) NOT NULL,
        to_emails JSONB NOT NULL,
        cc_emails JSONB DEFAULT '[]',
        bcc_emails JSONB DEFAULT '[]',
        subject TEXT NOT NULL,
        body_text TEXT,
        body_html TEXT,
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed', 'scheduled')),
        priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        sent_at TIMESTAMP WITH TIME ZONE,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 邮件表创建成功');

    // 创建邮件模板表
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        subject_template TEXT NOT NULL,
        body_html_template TEXT NOT NULL,
        body_text_template TEXT,
        variables JSONB DEFAULT '[]',
        organization_id INTEGER REFERENCES organizations(id),
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 邮件模板表创建成功');

    // 创建邮件队列表
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id BIGSERIAL PRIMARY KEY,
        email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        error_message TEXT,
        priority INTEGER DEFAULT 0,
        scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 邮件队列表创建成功');

    console.log('\n📊 创建统计和日志表...');

    // 创建邮件统计表
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_stats (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        organization_id INTEGER REFERENCES organizations(id),
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(date, user_id)
      )
    `);
    console.log('✅ 邮件统计表创建成功');

    // 创建系统日志表
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id BIGSERIAL PRIMARY KEY,
        level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
        message TEXT NOT NULL,
        meta JSONB DEFAULT '{}',
        user_id INTEGER REFERENCES users(id),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ 系统日志表创建成功');

    console.log('\n🔍 创建索引...');

    // 创建用户表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');

    // 创建组织表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain)');

    // 创建邮件表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_emails_to_emails ON emails USING GIN(to_emails)');

    // 创建邮件队列表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC)');

    // 创建统计表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_stats_date ON email_stats(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_stats_user_id ON email_stats(user_id)');

    // 创建日志表索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)');

    console.log('✅ 索引创建完成');

    console.log('\n🌱 插入初始数据...');

    // 创建默认组织
    const orgResult = await client.query(`
      INSERT INTO organizations (name, domain, subscription_plan, max_users, max_emails_per_day)
      VALUES ('YYC³ 邮件平台', '0379.love', 'enterprise', 1000, 10000)
      ON CONFLICT (domain) DO NOTHING
      RETURNING id
    `);

    let orgId = 1; // 默认组织ID
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].id;
      console.log('✅ 默认组织创建成功');
    }

    // 创建系统邮件模板
    const templates = [
      {
        name: '欢迎邮件',
        description: '新用户注册欢迎邮件模板',
        subject_template: '欢迎使用YYC³邮件平台',
        body_html_template: `
          <h2>欢迎 {{name}}！</h2>
          <p>感谢您注册YYC³邮件平台。我们很高兴为您提供服务。</p>
          <p>您的账户信息：</p>
          <ul>
            <li>邮箱：{{email}}</li>
            <li>注册时间：{{created_at}}</li>
          </ul>
          <p>如有任何问题，请联系我们的客服团队。</p>
          <p>YYC³团队</p>
        `,
        body_text_template: `
欢迎 {{name}}！

感谢您注册YYC³邮件平台。我们很高兴为您提供服务。

您的账户信息：
邮箱：{{email}}
注册时间：{{created_at}}

如有任何问题，请联系我们的客服团队。

YYC³团队
        `,
        variables: JSON.stringify(['name', 'email', 'created_at']),
        is_system: true
      },
      {
        name: '密码重置',
        description: '用户密码重置邮件模板',
        subject_template: 'YYC³邮件平台 - 密码重置通知',
        body_html_template: `
          <h2>密码重置请求</h2>
          <p>您好 {{name}}，</p>
          <p>我们收到了您的密码重置请求。</p>
          <p>请点击以下链接重置您的密码：</p>
          <p><a href="{{reset_link}}">{{reset_link}}</a></p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
          <p>此链接将在24小时后失效。</p>
          <p>YYC³团队</p>
        `,
        body_text_template: `
密码重置请求

您好 {{name}}，

我们收到了您的密码重置请求。

请点击以下链接重置您的密码：
{{reset_link}}

如果您没有请求重置密码，请忽略此邮件。

此链接将在24小时后失效。

YYC³团队
        `,
        variables: JSON.stringify(['name', 'reset_link']),
        is_system: true
      },
      {
        name: '邮件发送确认',
        description: '邮件发送成功确认通知',
        subject_template: '邮件发送成功 - {{subject}}',
        body_html_template: `
          <h2>邮件发送成功</h2>
          <p>您好 {{sender_name}}，</p>
          <p>您的邮件已成功发送。</p>
          <p>邮件详情：</p>
          <ul>
            <li>主题：{{subject}}</li>
            <li>收件人：{{recipient}}</li>
            <li>发送时间：{{sent_at}}</li>
          </ul>
          <p>YYC³邮件平台</p>
        `,
        body_text_template: `
邮件发送成功

您好 {{sender_name}}，

您的邮件已成功发送。

邮件详情：
主题：{{subject}}
收件人：{{recipient}}
发送时间：{{sent_at}}

YYC³邮件平台
        `,
        variables: JSON.stringify(['sender_name', 'subject', 'recipient', 'sent_at']),
        is_system: true
      }
    ];

    for (const template of templates) {
      await client.query(`
        INSERT INTO email_templates
        (name, description, subject_template, body_html_template, body_text_template, variables, organization_id, is_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [
        template.name,
        template.description,
        template.subject_template,
        template.body_html_template,
        template.body_text_template,
        template.variables,
        orgId,
        template.is_system
      ]);
    }
    console.log('✅ 系统邮件模板创建成功');

    // 创建默认管理员用户 (密码为 admin123 的哈希值)
    const adminPasswordHash = '$2b$08$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2Ej7W';

    await client.query(`
      INSERT INTO users (email, password_hash, name, role, organization_id)
      VALUES ('admin@0379.love', $1, '系统管理员', 'admin', $2)
      ON CONFLICT (email) DO NOTHING
    `, [adminPasswordHash, orgId]);
    console.log('✅ 默认管理员用户创建成功 (admin@0379.love / admin123)');

    console.log('\n🎯 数据库初始化完成！');
    console.log('📊 创建的表数量：7个');
    console.log('📧 邮件模板数量：3个');
    console.log('👤 默认管理员：admin@0379.love');
    console.log('🔑 管理员密码：admin123');

    // 检查数据库状态
    const tableCount = await client.query(`
      SELECT count(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const userCount = await client.query('SELECT count(*) as count FROM users');
    const templateCount = await client.query('SELECT count(*) as count FROM email_templates');

    console.log('\n📈 数据库状态：');
    console.log(`  📋 数据表总数：${tableCount.rows[0].count}`);
    console.log(`  👤 用户数量：${userCount.rows[0].count}`);
    console.log(`  📧 邮件模板：${templateCount.rows[0].count}`);

    client.release();

  } catch (error) {
    console.error('\n❌ 数据库初始化失败：');
    console.error('错误信息：', error.message);
    process.exit(1);

  } finally {
    await pool.end();
    console.log('\n🔐 数据库连接已关闭');
  }
}

// 执行初始化
initializeDatabase().catch(console.error);