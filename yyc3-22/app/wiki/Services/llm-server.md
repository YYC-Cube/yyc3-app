# LLM Server 文档

## 服务概述

LLM Server（Large Language Model Server）是系统的智能处理服务，负责邮件内容的智能分析、自动分类、内容提取、垃圾邮件检测、智能回复建议等功能，提升邮件处理的智能化水平。

## 技术栈

- **框架**: Python + FastAPI
- **模型**: 支持多种大语言模型，包括开源模型和API调用
- **数据库**: MongoDB (存储分析结果)
- **缓存**: Redis

## 核心功能

### 邮件智能分析

- 主题提取和优化
- 内容摘要生成
- 关键信息提取（日期、地点、联系人等）
- 情感分析

### 垃圾邮件检测

- 基于规则和机器学习的垃圾邮件识别
- 钓鱼邮件检测
- 恶意附件识别

### 智能分类

- 自动将邮件分类到不同文件夹（工作、个人、推广等）
- 优先级评估

### 智能回复建议

- 根据邮件内容生成回复建议
- 支持多种回复模板
- 多语言支持

### 邮件内容理解

- 实体识别（人名、公司名、产品名等）
- 意图识别（咨询、投诉、请求等）
- 关键词提取

## 安装和配置

### 环境要求

- Python 3.8 或更高版本
- CUDA 支持（使用GPU加速时）
- MongoDB 4.x 或更高版本
- Redis 6.x 或更高版本

### 依赖安装

```bash
pip install -r requirements.txt
```

### 配置文件

配置文件位于 `config/config.yaml`：

```yaml
service:
  port: 3002
  workers: 4

model:
  type: "openai"  # 可选: openai, huggingface, local
  openai_api_key: "your-api-key"
  model_name: "gpt-4"
  # 或使用本地模型
  # local_model_path: "/path/to/model"

storage:
  mongo:
    url: "mongodb://localhost:27017/email-system"
    collection: "llm_analysis"
  redis:
    host: "localhost"
    port: 6379
    cache_ttl: 3600

processing:
  batch_size: 10
  max_tokens: 2048
  timeout: 30
```

## API 接口

### 邮件分析

#### POST /api/analyze/email

分析单封邮件内容

**请求体**:

```json
{
  "email_id": "123456",
  "subject": "邮件主题",
  "content": "邮件内容...",
  "sender": "sender@example.com",
  "recipients": ["recipient@example.com"]
}
```

**响应**:

```json
{
  "analysis_id": "789012",
  "email_id": "123456",
  "summary": "邮件摘要...",
  "keywords": ["关键词1", "关键词2"],
  "entities": {
    "persons": ["张三"],
    "companies": ["公司名称"],
    "dates": ["2023-01-01"]
  },
  "sentiment": "positive",
  "is_spam": false,
  "category": "work",
  "priority": "medium"
}
```

### 智能回复

#### POST /api/generate/reply

生成回复建议

**请求体**:

```json
{
  "email_id": "123456",
  "context": "邮件上下文...",
  "tone": "formal",  # 可选: formal, casual, professional
  "max_suggestions": 3
}
```

**响应**:

```json
{
  "suggestions": [
    {
      "id": "1",
      "content": "建议回复内容1...",
      "score": 0.95
    },
    {
      "id": "2",
      "content": "建议回复内容2...",
      "score": 0.87
    }
  ]
}
```

### 批量处理

#### POST /api/process/batch

批量处理邮件

**请求体**:

```json
{
  "email_ids": ["123456", "234567"],
  "operations": ["analyze", "generate_reply", "classify"]
}
```

## 性能优化

- 使用模型量化减少内存占用
- 实现请求队列和批处理机制
- 缓存频繁使用的分析结果
- 根据负载动态调整资源分配

## 部署

请参考 [PM2 部署](../Deployment/PM2.md) 或 [Docker 部署](../Deployment/Docker.md) 文档。对于需要GPU加速的部署，请确保环境支持CUDA。

## 监控和维护

- 监控API响应时间和错误率
- 定期检查模型性能和准确率
- 监控资源使用情况（CPU、内存、GPU）
- 实现日志记录和异常报警
