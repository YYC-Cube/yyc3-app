# 邮件服务使用指南

## 文档说明

本指南详细介绍YYC3邮件服务的使用方法，包括邮件发送、邮件模板管理、邮件历史查询、邮件统计等功能。

## 服务概述

YYC3邮件服务是一个功能强大的邮件发送和管理系统，支持：

- 批量邮件发送
- 邮件模板管理
- 邮件历史查询
- 邮件统计分析
- AI智能邮件内容生成
- 邮件发送失败重试
- 邮件发送状态跟踪

## 快速开始

### 1. 服务启动

```bash
# 启动邮件服务
docker-compose up -d mail-service

# 验证服务状态
curl https://api.0379.email/health
```

### 2. 发送第一封邮件

使用API发送邮件：

```bash
curl -X POST "https://api.0379.email/mail/v1/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "to": "user@example.com",
    "subject": "欢迎使用YYC3邮件服务",
    "content": "这是您使用YYC3邮件服务发送的第一封邮件！",
    "templateId": "welcome_template"
  }'
```

或者使用管理控制台发送邮件：

1. 登录管理控制台：https://admin.0379.email
2. 点击"邮件服务"菜单
3. 点击"发送邮件"按钮
4. 填写邮件信息，点击"发送"

## 功能指南

### 邮件模板管理

1. **创建模板**：
   - 登录管理控制台
   - 点击"邮件服务" -> "模板管理"
   - 点击"创建模板"
   - 填写模板名称、模板内容、变量等信息
   - 点击"保存"

2. **使用模板**：
   ```bash
   curl -X POST "http://api.0379.email:4000/mail/v1/send" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{
       "to": "user@example.com",
       "subject": "订单确认",
       "templateId": "order_confirmation",
       "variables": {
         "orderId": "12345",
         "orderDate": "2024-01-01",
         "amount": "¥99.00"
       }
     }'
   ```

### 邮件历史查询

1. **查询所有邮件**：
   ```bash
   curl -X GET "https://api.0379.email/mail/v1/history?page=1&pageSize=10" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

2. **按条件查询**：
   ```bash
   curl -X GET "https://api.0379.email/mail/v1/history?status=sent&startDate=2024-01-01&endDate=2024-01-31" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

### 邮件统计分析

1. **获取发送统计**：
   ```bash
   curl -X GET "https://api.0379.email/mail/v1/statistics/send?startDate=2024-01-01&endDate=2024-01-31" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

2. **获取模板使用统计**：
   ```bash
   curl -X GET "https://api.0379.email/mail/v1/statistics/template?templateId=welcome_template&startDate=2024-01-01&endDate=2024-01-31" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

## AI智能功能

YYC3邮件服务集成了AI功能，可以帮助您：

1. **生成邮件内容**：
   ```bash
   curl -X POST "https://api.0379.email/mail/v1/ai/generate" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{
       "purpose": "welcome_email",
       "language": "zh-CN",
       "keywords": ["欢迎", "YYC3", "邮件服务", "功能介绍"],
       "tone": "friendly",
       "length": "medium"
     }'
   ```

2. **优化邮件标题**：
   ```bash
   curl -X POST "https://api.0379.email/mail/v1/ai/optimize-title" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{
       "originalTitle": "欢迎使用我们的服务",
       "purpose": "welcome_email",
       "language": "zh-CN",
       "targetAudience": "new_users"
     }'
   ```

## 最佳实践

1. **使用模板发送邮件**：提高发送效率，保证邮件格式一致
2. **设置合理的发送频率**：避免发送过于频繁导致被邮件服务商标记为垃圾邮件
3. **使用有效的退订机制**：遵守邮件发送的法律法规
4. **定期备份邮件模板**：避免模板丢失
5. **监控邮件发送状态**：及时发现和解决发送问题

## 常见问题

### Q: 邮件发送失败怎么办？
A: 检查邮件服务状态、网络连接、邮件内容是否符合要求，查看邮件历史中的错误信息。

### Q: 如何提高邮件送达率？
A: 使用合法的发件人地址、避免垃圾邮件内容、设置SPF和DKIM记录、保持良好的发送信誉。

### Q: 可以发送多少封邮件？
A: 根据您的服务配置和订阅计划，不同计划支持不同的邮件发送量。

---

**[⬆️ 回到顶部](#邮件服务使用指南)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 📧