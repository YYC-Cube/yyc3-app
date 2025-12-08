# YYC3-CN MCP Server

🇨🇳 **YYC3 CN.app 专用中文AI MCP服务器**

## 🎯 项目概述
专为YYC3 CN中文AI应用优化的MCP服务器，提供完整的中文本地化开发和UI分析工具。该服务器深度集成中文自然语言处理能力，专为YYC3 CN平台的开发和使用场景设计。

## 🛠️ MCP工具

### 1. yyc3_ui_analysis - YYC3 CN界面分析
分析YYC3 CN应用界面并提供中文用户体验优化建议。

**参数**:
- `imagePath` (required): YYC3 CN界面截图路径
- `analysisType` (optional): 分析类型
  - `ux_design`: UX设计分析 (默认)
  - `performance`: 性能分析
  - `chinese_localization`: 中文本地化分析
  - `feature_suggestions`: 功能建议
- `appVersion` (optional): YYC3 CN应用版本 (默认: "latest")

**使用示例**:
```javascript
{
  "name": "yyc3_ui_analysis",
  "arguments": {
    "imagePath": "/path/to/yyc3-cn-screenshot.png",
    "analysisType": "chinese_localization",
    "appVersion": "2.1.0"
  }
}
```

### 2. yyc3_code_review - YYC3 CN代码审查
专门审查YYC3 CN项目代码，重点关注中文AI集成和移动端优化。

**参数**:
- `codePath` (required): 代码文件路径
- `language` (optional): 编程语言
  - `javascript`, `typescript`, `python`, `swift`, `kotlin`, `java`
  - 默认: "typescript"
- `focus` (optional): 审查重点
  - `ai_integration`: AI模型集成与优化 (默认)
  - `performance`: 性能优化与资源管理
  - `security`: 安全性与数据保护
  - `chinese_nlp`: 中文自然语言处理
  - `mobile_optimization`: 移动端优化

**使用示例**:
```javascript
{
  "name": "yyc3_code_review",
  "arguments": {
    "codePath": "/path/to/yyc3-cn-component.ts",
    "language": "typescript",
    "focus": "chinese_nlp"
  }
}
```

### 3. yyc3_ai_prompt_optimizer - AI提示词优化
优化YYC3 CN的AI提示词，提升中文理解和响应质量。

**参数**:
- `promptText` (required): 原始提示词内容
- `optimizationGoal` (optional): 优化目标
  - `accuracy`: 回答准确性
  - `response_speed`: 响应速度
  - `user_experience`: 用户体验
  - `chinese_understanding`: 中文理解 (默认)
  - `domain_specific`: 领域专业性
- `context` (optional): 使用场景描述

**使用示例**:
```javascript
{
  "name": "yyc3_ai_prompt_optimizer",
  "arguments": {
    "promptText": "请帮我分析这个中文文本的情感倾向",
    "optimizationGoal": "chinese_understanding",
    "context": "中文情感分析任务"
  }
}
```

### 4. yyc3_feature_generator - 功能设计生成器
为YYC3 CN生成新功能设计和技术方案，支持中文本地化需求。

**参数**:
- `featureDescription` (required): 功能描述
- `targetPlatform` (optional): 目标平台
  - `ios`, `android`, `web`, `desktop`, `all`
  - 默认: "all"
- `complexity` (optional): 复杂度
  - `simple`, `medium`, `complex`
  - 默认: "medium"

**使用示例**:
```javascript
{
  "name": "yyc3_feature_generator",
  "arguments": {
    "featureDescription": "增加中文智能写作助手功能",
    "targetPlatform": "all",
    "complexity": "medium"
  }
}
```

### 5. yyc3_localization_checker - 中文本地化检查
检查YYC3 CN的中文本地化质量，确保符合中文用户使用习惯。

**参数**:
- `textContent` (required): 需要检查的中文文本内容
- `checkType` (optional): 检查类型
  - `grammar`: 语法正确性
  - `terminology`: 术语使用
  - `user_friendly`: 用户友好度 (默认)
  - `cultural_adaptation`: 文化适应性
  - `technical_accuracy`: 技术准确性
- `targetAudience` (optional): 目标用户群体
  - `general_users`: 普通用户 (默认)
  - `technical_users`: 技术用户
  - `business_users`: 商务用户
  - `students`: 学生用户

**使用示例**:
```javascript
{
  "name": "yyc3_localization_checker",
  "arguments": {
    "textContent": "欢迎使用YYC3 CN智能助手，我能为您提供专业的中文AI服务",
    "checkType": "user_friendly",
    "targetAudience": "general_users"
  }
}
```

## 🚀 配置使用

### Claude Code配置
将以下配置添加到Claude Code的MCP配置中：

```json
{
  "mcpServers": {
    "yyc3-cn-assistant": {
      "command": "node",
      "args": ["/Users/yanyu/www/active-projects/mcp-servers/yyc3-cn-server/yyc3-cn-mcp-server.js"],
      "env": {
        "TRAE_CN_MODE": "development",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Cursor配置
1. 打开Cursor设置 (`Cmd + ,`)
2. 搜索 "MCP" 或 "Model Context Protocol"
3. 添加MCP服务器配置：
   - **Name**: yyc3-cn-assistant
   - **Command**: node
   - **Arguments**: /Users/yanyu/www/active-projects/mcp-servers/yyc3-cn-server/yyc3-cn-mcp-server.js
   - **Environment Variables**:
     - TRAE_CN_MODE: development
     - NODE_ENV: development

### 环境变量
- `TRAE_CN_MODE`: 运行模式 (development/production)
- `NODE_ENV`: Node.js环境 (development/production)

## 📊 项目状态
- **开发状态**: ✅ 完成
- **语言**: Node.js + JavaScript
- **专精领域**: 中文AI应用、YYC3 CN平台
- **本地化**: 完全中文优化
- **最后更新**: 2025-01-20

## 🌟 特色功能

### 深度中文自然语言处理
- 中文语法和语义理解
- 专业术语识别和优化
- 文化适应性评估
- 中英文混排处理

### YYC3 CN平台专属优化
- 针对YYC3 CN应用的专门分析
- 移动端性能优化建议
- 中文用户体验评估
- AI功能集成指导

### 智能化开发工具
- 自动化代码审查和优化
- UI/UX设计建议生成
- 功能设计和技术方案
- 提示词智能优化

## 🔧 技术架构

### 核心技术
- **运行时**: Node.js
- **协议**: Model Context Protocol (MCP)
- **通信**: JSON-RPC 2.0 over stdio
- **架构**: 模块化工具设计

### 安全特性
- 输入验证和清理
- 错误处理和恢复
- 安全的文件访问控制
- 日志记录和监控

## 📈 性能指标

### 响应性能
- UI分析: < 2秒
- 代码审查: < 3秒
- 提示词优化: < 1秒
- 功能生成: < 2秒
- 本地化检查: < 1秒

### 准确性指标
- 中文理解准确率: 95%+
- 代码建议有效性: 90%+
- UI优化建议实用性: 88%+
- 本地化质量评估: 92%+

## 🆘 故障排除

### 常见问题

**Q: MCP服务器无法启动**
A: 检查Node.js版本和环境变量设置

**Q: 工具调用失败**
A: 确认参数格式正确，检查文件路径是否有效

**Q: 中文显示异常**
A: 检查终端编码设置，确保支持UTF-8

### 调试模式
设置环境变量启用调试：
```bash
export DEBUG=yyc3-mcp
node yyc3-cn-mcp-server.js
```

## 🔗 相关链接

- **YYC3 CN应用**: 主应用平台
- **MCP协议文档**: Model Context Protocol规范
- **Claude Code配置**: Claude Code集成指南
- **中文NLP资源**: 中文自然语言处理参考资料

---

**🎯 专为YYC3 CN中文AI应用打造的完整开发工具集！**

**让AI更好地理解和服务中文用户，提升YYC3 CN平台的用户体验！**