/**
 * @file 简易后端服务器
 * @description 为前端提供必要的API端点，支持邮件平台基本功能
 * @author YYC
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟邮件数据
const mockEmails = [
  {
    id: '1',
    sender: 'support@example.com',
    recipient: 'user@example.com',
    subject: '欢迎使用0379邮件平台',
    content: '尊敬的用户，欢迎您使用我们的邮件平台。这里有丰富的功能等待您探索。',
    isRead: false,
    isStarred: true,
    attachments: [],
    createdAt: '2024-01-15T10:30:00Z',
    folder: 'inbox'
  },
  {
    id: '2',
    sender: 'newsletter@example.com',
    recipient: 'user@example.com',
    subject: '每周新闻资讯',
    content: '以下是本周的重要新闻和更新。',
    isRead: true,
    isStarred: false,
    attachments: [],
    createdAt: '2024-01-14T15:20:00Z',
    folder: 'inbox'
  },
  {
    id: '3',
    sender: 'team@example.com',
    recipient: 'user@example.com',
    subject: '项目进度更新',
    content: '请查看附件中的项目进度报告。',
    isRead: false,
    isStarred: false,
    attachments: [{ name: 'progress.pdf', size: 2048, type: 'application/pdf' }],
    createdAt: '2024-01-13T09:45:00Z',
    folder: 'inbox'
  }
];

// 邮件列表API - 前端主要调用的端点
app.get('/api/emails', (req, res) => {
  const { folder = 'inbox', page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  // 筛选指定文件夹的邮件
  const filteredEmails = mockEmails.filter(email => email.folder === folder);
  
  // 排序
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    } else {
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    }
  });
  
  // 分页
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const paginatedEmails = sortedEmails.slice(startIndex, startIndex + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      emails: paginatedEmails,
      pagination: {
        total: filteredEmails.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredEmails.length / parseInt(limit))
      }
    }
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '简易邮件平台后端服务运行正常'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 简易后端服务已启动，监听端口: ${PORT}`);
  console.log(`🔗 邮件API: http://localhost:${PORT}/api/emails`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});
