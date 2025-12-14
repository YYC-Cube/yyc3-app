# 高级功能指南

本文档详细介绍0379.email邮件系统的高级功能特性、使用方法和最佳实践，帮助高级用户充分利用系统强大功能。

## 目录

1. [邮件模板系统](#邮件模板系统)
2. [批量邮件发送](#批量邮件发送)
3. [邮件投递跟踪](#邮件投递跟踪)
4. [自定义触发器](#自定义触发器)
5. [API集成](#api集成)
6. [Webhooks配置](#webhooks配置)
7. [多租户管理](#多租户管理)
8. [高级搜索与过滤](#高级搜索与过滤)
9. [数据导出与报表](#数据导出与报表)
10. [系统扩展开发](#系统扩展开发)

## 邮件模板系统

### 模板语法

系统支持基于Handlebars的模板语法，允许在邮件中使用变量、条件判断和循环：

```handlebars
<html>
<body>
  <h1>亲爱的 {{user.name}},</h1>
  <p>感谢您注册我们的服务。您的账户信息如下：</p>
  <ul>
    <li>用户名: {{user.username}}</li>
    <li>邮箱: {{user.email}}</li>
    {{#if user.company}}
    <li>公司: {{user.company}}</li>
    {{/if}}
  </ul>
  {{#each products}}
    <div class="product">产品: {{this.name}}, 价格: {{this.price}}</div>
  {{/each}}
  <p>此致,<br>0379.email团队</p>
</body>
</html>
```

### 模板变量

可用的模板变量类型：

1. **用户变量** - 包含用户个人信息
2. **系统变量** - 如当前日期、域名等
3. **自定义变量** - 通过API传入的自定义数据
4. **列表变量** - 用于批量邮件中的收件人数据

### 模板管理API

```javascript
// 创建模板
const createTemplate = async (templateData) => {
  const response = await fetch('https://api.0379.email/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(templateData)
  });
  return response.json();
};

// 使用模板发送邮件
const sendEmailWithTemplate = async (templateId, data) => {
  const response = await fetch('https://api.0379.email/api/emails/template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ templateId, data })
  });
  return response.json();
};
```

## 批量邮件发送

### 批量发送API

```javascript
// 批量发送邮件
const sendBulkEmail = async (recipients, emailContent) => {
  const response = await fetch('https://api.0379.email/api/emails/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      recipients,
      subject: emailContent.subject,
      templateId: emailContent.templateId,
      variables: emailContent.variables,
      tags: emailContent.tags,
      sendAt: emailContent.sendAt
    })
  });
  return response.json();
};
```

### 分批发送策略

为避免触发邮件服务商的限制，系统支持分批发送策略：

```javascript
// 配置分批发送
const batchConfig = {
  batchSize: 500,        // 每批发送数量
  intervalSeconds: 60,   // 批次间隔（秒）
  retryAttempts: 3,      // 失败重试次数
  retryDelayMinutes: 30  // 重试间隔（分钟）
};
```

### 发送限制管理

系统会自动管理发送限制：

- **SMTP限制** - 遵循邮件服务器的发送频率限制
- **收件人限制** - 单次批量发送最多支持10,000个收件人
- **速率控制** - 可配置每秒最大发送数量

## 邮件投递跟踪

### 跟踪指标

系统提供全面的邮件投递跟踪指标：

1. **发送状态** - 邮件是否成功发送到SMTP服务器
2. **投递状态** - 邮件是否成功投递到收件人服务器
3. **打开状态** - 收件人是否打开邮件（需要启用跟踪像素）
4. **点击状态** - 收件人是否点击邮件中的链接
5. **退信状态** - 邮件是否被退回及退信原因

### 跟踪配置

```javascript
// 启用邮件跟踪
const trackingConfig = {
  openTracking: true,   // 启用打开跟踪
  clickTracking: true,  // 启用链接点击跟踪
  bounceTracking: true, // 启用退信跟踪
  ipTracking: false,    // 禁用IP跟踪（隐私考虑）
  customDomain: 'track.0379.email' // 自定义跟踪域名
};
```

### 获取跟踪统计

```javascript
// 获取发送活动统计
const getCampaignStats = async (campaignId) => {
  const response = await fetch(`https://api.0379.email/api/campaigns/${campaignId}/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 结果示例
{
  "totalSent": 1000,
  "delivered": 980,
  "openRate": 0.35, // 35%
  "clickRate": 0.12, // 12%
  "bounceRate": 0.02, // 2%
  "unsubscribeRate": 0.01 // 1%
}
```

## 自定义触发器

### 创建触发器

系统支持基于事件的自定义触发器，可自动执行特定操作：

```javascript
// 创建邮件触发器
const createTrigger = async (triggerConfig) => {
  const response = await fetch('https://api.0379.email/api/triggers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(triggerConfig)
  });
  return response.json();
};

// 触发器配置示例
const welcomeEmailTrigger = {
  name: '新用户欢迎邮件',
  event: 'user.registered',
  conditions: [
    { field: 'plan', operator: 'eq', value: 'premium' }
  ],
  actions: [
    {
      type: 'send_email',
      templateId: 'welcome-premium',
      delayMinutes: 5 // 注册5分钟后发送
    }
  ],
  enabled: true
};
```

### 支持的事件类型

- `user.registered` - 用户注册
- `user.login` - 用户登录
- `email.sent` - 邮件发送
- `email.opened` - 邮件被打开
- `email.clicked` - 链接被点击
- `email.bounced` - 邮件被退回
- `webhook.received` - 收到外部webhook

## API集成

### API认证

系统使用JWT进行API认证：

```javascript
// 获取API访问令牌
const getToken = async (credentials) => {
  const response = await fetch('https://api.0379.email/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// 使用令牌调用API
const callApi = async (endpoint, method, data = null) => {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  };
  
  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`https://api.0379.email/api${endpoint}`, options);
  return response.json();
};
```

### 速率限制

API调用存在速率限制，超过限制将收到429错误：

- **普通API** - 每分钟60次调用
- **批量操作API** - 每分钟10次调用
- **管理API** - 每分钟30次调用

### 分页与过滤

```javascript
// 分页获取数据
const getEmails = async (page = 1, pageSize = 100, filters = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('pageSize', pageSize);
  
  // 添加过滤器
  Object.keys(filters).forEach(key => {
    queryParams.append(`filter[${key}]`, filters[key]);
  });
  
  const response = await fetch(`https://api.0379.email/api/emails?${queryParams.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## Webhooks配置

### 创建Webhook

系统支持配置webhook，将事件通知发送到外部系统：

```javascript
// 创建Webhook
const createWebhook = async (webhookConfig) => {
  const response = await fetch('https://api.0379.email/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(webhookConfig)
  });
  return response.json();
};

// Webhook配置示例
const webhookConfig = {
  name: '邮件状态通知',
  url: 'https://your-server.com/webhooks/email-status',
  events: ['email.delivered', 'email.opened', 'email.clicked', 'email.bounced'],
  secret: 'your-webhook-secret', // 用于验证签名
  enabled: true,
  retryAttempts: 3
};
```

### Webhook安全

验证webhook请求签名：

```javascript
// 验证webhook签名
const verifyWebhookSignature = (payload, signature, secret) => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const digest = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

// 在Express中使用
app.post('/webhooks/email-status', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  if (verifyWebhookSignature(payload, signature, 'your-webhook-secret')) {
    // 处理webhook数据
    processWebhookData(payload);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

## 多租户管理

### 租户配置

系统支持多租户模式，每个租户拥有独立的数据空间：

```javascript
// 创建新租户
const createTenant = async (tenantData) => {
  const response = await fetch('https://api.0379.email/api/admin/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify(tenantData)
  });
  return response.json();
};

// 租户配置示例
const tenantConfig = {
  name: '示例公司',
  slug: 'example-company',
  contactEmail: 'admin@example.com',
  maxUsers: 100,
  maxEmailsPerDay: 10000,
  features: {
    templates: true,
    analytics: true,
    customDomains: true
  },
  createdAt: new Date().toISOString()
};
```

### 租户隔离

- **数据隔离** - 租户数据在数据库层面隔离
- **API隔离** - 租户只能访问自己的数据
- **配置隔离** - 租户可拥有独立的配置

### 资源限制

可配置每个租户的资源限制：

- 最大用户数
- 每日邮件发送限额
- 存储空间限制
- 功能访问权限

## 高级搜索与过滤

### 搜索语法

系统支持复杂的搜索查询：

```javascript
// 高级搜索示例
const advancedSearch = async () => {
  const query = {
    search: 'invoice', // 全文搜索
    filters: {
      dateRange: {
        field: 'createdAt',
        from: '2024-01-01',
        to: '2024-01-31'
      },
      status: ['sent', 'delivered'],
      sender: 'billing@0379.email',
      recipient: {
        operator: 'contains',
        value: 'customer.com'
      },
      tags: {
        operator: 'all',
        values: ['transactional', 'important']
      }
    },
    sort: [
      { field: 'createdAt', direction: 'desc' }
    ],
    page: 1,
    pageSize: 50
  };
  
  const response = await fetch('https://api.0379.email/api/emails/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(query)
  });
  return response.json();
};
```

### 搜索运算符

- `eq` - 等于
- `ne` - 不等于
- `gt` - 大于
- `gte` - 大于等于
- `lt` - 小于
- `lte` - 小于等于
- `contains` - 包含
- `notContains` - 不包含
- `startsWith` - 以...开头
- `endsWith` - 以...结尾
- `in` - 在集合中
- `notIn` - 不在集合中
- `between` - 在范围内
- `isNull` - 是否为空
- `isNotNull` - 是否不为空

## 数据导出与报表

### 导出配置

```javascript
// 创建导出任务
const createExport = async (exportConfig) => {
  const response = await fetch('https://api.0379.email/api/exports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(exportConfig)
  });
  return response.json();
};

// 导出配置示例
const exportConfig = {
  type: 'emails', // emails, users, stats
  format: 'csv', // csv, excel, json
  filters: {
    dateRange: {
      field: 'createdAt',
      from: '2024-01-01',
      to: '2024-01-31'
    }
  },
  fields: ['id', 'subject', 'sender', 'recipient', 'status', 'createdAt'],
  email: 'user@example.com' // 导出完成后发送通知
};
```

### 报表类型

系统提供多种预定义报表：

1. **发送活动报表** - 显示发送量、送达率、打开率等指标
2. **用户活动报表** - 显示用户操作和使用情况
3. **性能报表** - 显示系统性能指标
4. **安全报表** - 显示安全事件和异常登录

### 自动化报表

可配置定期生成和发送报表：

```javascript
// 创建自动化报表
const createReportSchedule = async (reportConfig) => {
  const response = await fetch('https://api.0379.email/api/reports/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(reportConfig)
  });
  return response.json();
};

// 报表配置示例
const reportConfig = {
  name: '每周发送报表',
  type: 'campaign',
  schedule: {
    frequency: 'weekly', // daily, weekly, monthly
    dayOfWeek: 1, // 周一
    time: '08:00'
  },
  recipients: ['admin@example.com', 'manager@example.com'],
  format: 'excel',
  filters: {
    dateRange: 'last_7_days'
  }
};
```

## 系统扩展开发

### 插件开发

系统支持通过插件扩展功能：

```javascript
// 示例插件结构
const emailAnalyticsPlugin = {
  name: 'email-analytics',
  version: '1.0.0',
  description: 'Enhanced email analytics plugin',
  
  // 初始化函数
  async init(config, context) {
    console.log('Initializing email analytics plugin');
    
    // 注册事件监听器
    context.events.on('email.opened', this.handleEmailOpened.bind(this));
    context.events.on('email.clicked', this.handleEmailClicked.bind(this));
    
    // 注册API端点
    context.api.registerRoute({
      method: 'GET',
      path: '/analytics/email/stats',
      handler: this.getEmailStats.bind(this),
      auth: true
    });
  },
  
  // 事件处理函数
  async handleEmailOpened(data) {
    // 处理邮件打开事件
    await this.saveAnalyticsData('open', data);
  },
  
  async handleEmailClicked(data) {
    // 处理链接点击事件
    await this.saveAnalyticsData('click', data);
  },
  
  // 自定义API处理函数
  async getEmailStats(req, res) {
    const stats = await this.generateStats(req.query);
    res.json(stats);
  },
  
  // 辅助方法
  async saveAnalyticsData(eventType, data) {
    // 保存分析数据到数据库
    // ...
  },
  
  async generateStats(params) {
    // 生成统计数据
    // ...
  }
};

module.exports = emailAnalyticsPlugin;
```

### 插件部署

1. 创建插件目录结构
2. 编写插件代码
3. 注册插件（通过配置文件或管理界面）
4. 重启服务使插件生效

### API扩展

系统支持通过中间件和自定义路由扩展API功能：

```javascript
// API中间件示例
const loggingMiddleware = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// 注册中间件
app.use(loggingMiddleware);

// 自定义API路由示例
const registerCustomRoutes = (app) => {
  app.get('/api/custom/stats', (req, res) => {
    // 自定义API逻辑
    res.json({ status: 'success', data: 'custom stats' });
  });
};
```

## 最佳实践

### 性能优化

1. **使用模板缓存** - 启用模板缓存提高渲染速度
2. **批量操作优化** - 合理设置批量大小和并发数
3. **索引优化** - 为频繁查询的字段创建索引
4. **缓存策略** - 使用Redis缓存热点数据

### 安全最佳实践

1. **API密钥保护** - 安全存储API密钥，定期轮换
2. **输入验证** - 严格验证所有用户输入
3. **敏感数据加密** - 加密存储敏感信息
4. **权限控制** - 实施最小权限原则

### 可扩展性考虑

1. **水平扩展** - 设计支持水平扩展的组件
2. **消息队列** - 使用消息队列解耦服务
3. **负载均衡** - 实施负载均衡策略
4. **监控告警** - 建立完善的监控系统

## 常见问题解答

**Q: 如何提高邮件送达率？**
A: 遵循发送频率限制，使用认证机制（SPF、DKIM、DMARC），避免使用垃圾邮件触发词，确保正确的退信处理。

**Q: 如何配置自定义域名进行邮件发送？**
A: 在管理面板中添加域名，然后按指南配置DNS记录（SPF、DKIM、MX），完成验证后即可使用。

**Q: 如何处理大量退信？**
A: 使用自动退信处理器，定期清理无效邮箱，实施渐进式退信处理策略。

**Q: 系统支持哪些第三方集成？**
A: 系统提供与CRM、ERP、分析工具等系统的集成接口，支持通过API或Webhook进行数据交换。

---

*最后更新时间：2024-01-15*
