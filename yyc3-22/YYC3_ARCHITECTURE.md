# YYC3 AI Family 项目架构文档

## 📋 项目概述

YYC3 AI Family 是一个完整的人工智能服务平台，提供多模型支持、MCP工具集成、邮件服务和管理控制台等核心功能。

### 🏗️ 系统架构

```
YYC3 AI Family
├── 🚀 API Server (6600)          # 核心API服务
├── 🎛️ Admin Console (6601)      # 管理控制台
├── 🤖 LLM Service (6602)         # AI对话服务 (GLM集成)
├── 📧 Mail Service (6603)        # 邮件平台服务
├── 🧠 AI/FCP Service (6604)      # AI文件处理服务
├── 🌐 Frontend App (6605)        # 前端应用集成服务
└── 💾 Redis Cache (6606)         # 缓存服务
```

## 🌐 服务端口分配

| 服务名称 | 端口 | 状态 | 域名 | 主要功能 |
|---------|------|------|------|----------|
| API服务器 | 6600 | ✅ 运行中 | api.0379.email | 核心API、用户管理、认证 |
| 管理控制台 | 6601 | ✅ 运行中 | admin.0379.email | 系统监控、用户管理、服务状态 |
| LLM/AI服务 | 6602 | ✅ 运行中 | llm.0379.email | GLM对话、MCP工具调用 |
| 邮件服务 | 6603 | ✅ 运行中 | mail.0379.email | 邮件收发、模板管理 |
| AI/FCP服务 | 6604 | ✅ 运行中 | ai.0379.email | 文件处理、AI分析 |
| 前端应用服务 | 6605 | ✅ 运行中 | app.0379.email | 前端应用集成、API聚合 |
| Redis缓存 | 6606 | ✅ 运行中 | redis.0379.email | 缓存管理、会话存储 |

## 🤖 AI模型支持

### GLM系列模型 (智谱AI)
- **GLM-4.5-Flash**: 默认模型，深度思考、128K上下文、完全免费
- **GLM-4-Flash**: 轻量级快速响应模型
- **GLM-4V-Flash**: 视觉理解多模态模型
- **GLM-Z1-Flash**: 免费普及型模型

### 其他模型
- **GPT-4**: OpenAI先进语言模型
- **Claude 3**: Anthropic AI助手
- **Gemini Pro**: Google多模态AI模型

## 🔧 MCP工具集成

### 可用工具
- **联网搜索**: 实时搜索网络信息获取最新数据
- **视觉理解**: 图像内容分析和特征识别
- **代码执行**: 多语言代码运行和结果返回

## 💾 数据存储架构

### Redis缓存
- 会话管理
- API响应缓存
- 实时数据存储
- 消息队列

### 邮件数据
- 用户邮件存储
- 模板管理
- 发送记录

## 🔐 安全配置

- CORS跨域支持
- JWT身份认证
- API访问控制
- 数据加密传输

## 📊 监控指标

- 服务健康状态
- 请求响应时间
- 模型使用统计
- 用户活跃度
- 系统资源使用

## 🌍 域名服务

### 主要域名
- **0379.email**: 邮件和API服务 (yyc3-33: 8.152.195.33)
- **0379.world**: 扩展服务 (yyc3-121: 8.130.127.121)

### 子域名服务
- api.0379.email
- admin.0379.email
- llm.0379.email
- mail.0379.email
- ai.0379.email

## 🚀 部署架构

### 服务器配置
- **yyc3-33**: 主服务器，处理0379.email域名服务
- **yyc3-121**: 扩展服务器，处理0379.world域名服务

### 环境变量配置
```bash
API_PORT=6600
ADMIN_PORT=6601
LLM_PORT=6602
MAIL_PORT=6603
AI_PORT=6604
APP_PORT=6605
REDIS_PORT=6606
```

## 📝 API端点总览

### LLM服务 (6602)
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /api/models` - 模型列表
- `POST /api/chat` - AI对话
- `GET /api/mcp/tools` - MCP工具列表
- `POST /api/mcp/tools` - MCP工具调用
- `POST /api/chat/thinking` - 深度思考模式

### 邮件服务 (6603)
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /api/inbox` - 收件箱
- `GET /api/sent` - 已发送
- `POST /api/send` - 发送邮件
- `GET /api/templates` - 邮件模板

### AI/FCP服务 (6604)
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `POST /api/ai/chat` - AI聊天
- `POST /api/ai/generate` - 内容生成
- `POST /api/file/upload` - 文件上传
- `POST /api/file/process` - 文件处理
- `POST /api/ai/analyze` - AI分析
- `POST /api/code/generate` - 代码生成
- `GET /api/stats` - 统计信息

### 前端应用服务 (6605)
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /api/app/status` - 应用状态
- `GET /api/app/services` - 服务集成状态
- `GET /api/app/llm-status` - LLM服务状态
- `GET /api/app/mail-status` - 邮件服务状态
- `POST /api/app/chat-integration` - 聊天集成
- `GET /api/dashboard/data` - 仪表板数据

### Redis缓存服务 (6606)
- `GET /` - 服务信息
- `GET /health` - 健康检查
- `GET /info` - Redis信息
- `GET /api/stats` - 缓存统计
- `GET /api/cache` - 缓存数据
- `POST /api/ops` - Redis操作 (GET/SET/DEL等)
- `POST /api/cache/sync` - 服务状态同步

## 🎯 开发规范

### 代码结构
- 模块化设计
- 统一错误处理
- 完整的日志记录
- 健康检查端点

### API设计原则
- RESTful风格
- JSON响应格式
- 统一状态码
- 完整的错误信息

## 🔮 未来规划

- 更多AI模型集成
- 高级MCP工具开发
- 实时协作功能
- 性能优化
- 国际化支持

---

**文档版本**: v2.0.0
**更新时间**: 2025-12-06
**维护团队**: YYC3 AI Family