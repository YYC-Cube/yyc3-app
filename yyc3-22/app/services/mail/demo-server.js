#!/usr/bin/env node

/**
 * YYC³ 企业级邮件平台演示服务器
 * 演示邮件发送、接收、管理功能
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 内存数据存储（演示用）
let emails = [];
let templates = [];
let users = [];
let stats = {
  totalEmails: 0,
  sentEmails: 0,
  failedEmails: 0
};

// 初始化示例数据
function initializeDemoData() {
  // 示例用户
  users = [
    {
      id: 1,
      email: 'admin@0379.love',
      name: '管理员',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      email: 'user@0379.love',
      name: '测试用户',
      role: 'user',
      createdAt: new Date().toISOString()
    }
  ];

  // 示例邮件模板
  templates = [
    {
      id: 1,
      name: '欢迎邮件',
      subject: '欢迎使用YYC³邮件平台',
      body: '亲爱的 {{name}}，欢迎您加入YYC³邮件平台！',
      variables: ['name'],
      isSystem: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: '密码重置',
      subject: '密码重置通知',
      body: '您的密码重置链接：{{resetLink}}',
      variables: ['resetLink'],
      isSystem: true,
      createdAt: new Date().toISOString()
    }
  ];

  console.log('📝 演示数据初始化完成');
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'YYC³邮件平台运行正常',
    timestamp: new Date().toISOString(),
    version: '2.0.0-demo',
    stats: stats
  });
});

// 服务信息
app.get('/api/info', (req, res) => {
  res.json({
    name: 'YYC³ Enterprise Email Platform',
    version: '2.0.0',
    description: '企业级邮件服务平台',
    environment: process.env.NODE_ENV || 'development',
    features: [
      '邮件发送',
      '邮件模板',
      '用户管理',
      '统计分析',
      '队列处理',
      '多租户支持'
    ],
    database: 'PostgreSQL (演示模式)',
    cache: 'Redis (演示模式)',
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

// 获取邮件列表
app.get('/api/v1/emails', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  let filteredEmails = emails;
  if (status) {
    filteredEmails = emails.filter(email => email.status === status);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

  res.json({
    success: true,
    emails: paginatedEmails,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredEmails.length,
      pages: Math.ceil(filteredEmails.length / Number(limit))
    },
    timestamp: new Date().toISOString()
  });
});

// 发送邮件
app.post('/api/v1/emails/send', (req, res) => {
  const { to, cc, bcc, subject, body, templateId, variables } = req.body;

  try {
    let emailContent = body;

    // 如果使用模板
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: '模板不存在',
          message: '请选择有效的邮件模板'
        });
      }

      emailContent = template.body;
      if (variables) {
        Object.keys(variables).forEach(key => {
          const placeholder = `{{${key}}}`;
          emailContent = emailContent.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
      }
    }

    const newEmail = {
      id: Date.now(),
      from: 'noreply@0379.love',
      to: Array.isArray(to) ? to : [to],
      cc: cc || [],
      bcc: bcc || [],
      subject: subject || '无主题',
      body: emailContent,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    emails.push(newEmail);
    stats.totalEmails++;
    stats.sentEmails++;

    res.json({
      success: true,
      email: newEmail,
      message: '邮件发送成功（演示模式）',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    stats.failedEmails++;
    res.status(500).json({
      success: false,
      error: '发送失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取邮件模板
app.get('/api/v1/templates', (req, res) => {
  res.json({
    success: true,
    templates: templates,
    timestamp: new Date().toISOString()
  });
});

// 使用模板发送邮件
app.post('/api/v1/emails/send-template', (req, res) => {
  const { templateId, to, variables } = req.body;

  try {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在',
        message: '请选择有效的邮件模板'
      });
    }

    let emailContent = template.body;
    let emailSubject = template.subject;

    if (variables) {
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        emailContent = emailContent.replace(new RegExp(placeholder, 'g'), variables[key]);
        emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), variables[key]);
      });
    }

    const newEmail = {
      id: Date.now(),
      from: 'noreply@0379.love',
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      body: emailContent,
      templateId: templateId,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    emails.push(newEmail);
    stats.totalEmails++;
    stats.sentEmails++;

    res.json({
      success: true,
      email: newEmail,
      template: template,
      message: '模板邮件发送成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发送失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户列表
app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    users: users,
    timestamp: new Date().toISOString()
  });
});

// 获取统计数据
app.get('/api/v1/analytics/stats', (req, res) => {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const recentEmails = emails.filter(email =>
    new Date(email.createdAt) > last7Days
  );

  const statsByStatus = emails.reduce((acc, email) => {
    acc[email.status] = (acc[email.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    stats: {
      total: stats,
      last7Days: recentEmails.length,
      byStatus: statsByStatus,
      templates: templates.length,
      users: users.length
    },
    timestamp: new Date().toISOString()
  });
});

// AI功能演示
app.post('/api/v1/ai/summarize', (req, res) => {
  const { text } = req.body;

  const summary = `这是对以下文本的AI摘要：\n\n原文：${text}\n\n摘要：${text.substring(0, 100)}...（演示摘要）`;

  res.json({
    success: true,
    summary: summary,
    originalLength: text.length,
    summaryLength: summary.length,
    timestamp: new Date().toISOString()
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用YYC³企业级邮件平台',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      info: '/api/info',
      emails: '/api/v1/emails',
      templates: '/api/v1/templates',
      users: '/api/v1/users',
      analytics: '/api/v1/analytics/stats',
      ai: '/api/v1/ai'
    },
    documentation: 'https://docs.0379.love',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET / - 服务欢迎页',
      'GET /health - 健康检查',
      'GET /api/info - 服务信息',
      'GET /api/v1/emails - 获取邮件列表',
      'POST /api/v1/emails/send - 发送邮件',
      'POST /api/v1/emails/send-template - 模板发送邮件',
      'GET /api/v1/templates - 获取邮件模板',
      'GET /api/v1/users - 获取用户列表',
      'GET /api/v1/analytics/stats - 获取统计数据',
      'POST /api/v1/ai/summarize - AI文本摘要'
    ],
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 YYC³ 企业级邮件平台演示服务器启动成功！');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 服务信息: http://localhost:${PORT}/api/info`);
  console.log(`📚 API文档: http://localhost:${PORT}/`);
  console.log('');
  console.log('🎯 演示功能:');
  console.log('  - 邮件发送和管理');
  console.log('  - 邮件模板系统');
  console.log('  - 用户管理');
  console.log('  - 统计分析');
  console.log('  - AI文本处理');
  console.log('  - 多租户支持架构');
  console.log('');
  console.log('📝 快速测试:');
  console.log('  curl http://localhost:4000/api/v1/emails');
  console.log('  curl -X POST http://localhost:4000/api/v1/emails/send -H "Content-Type: application/json" -d \'{"to":"test@example.com","subject":"测试邮件","body":"这是一封测试邮件"}\'');
  console.log('');

  // 初始化演示数据
  initializeDemoData();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 正在关闭服务器...');
  process.exit(0);
});

module.exports = app;