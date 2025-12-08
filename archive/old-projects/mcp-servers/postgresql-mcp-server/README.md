# PostgreSQL MCP Server

🚀 **为AI开发工具提供安全的PostgreSQL数据库访问**

## 🎯 项目概述
这是一个完整的、生产就绪的 Model Context Protocol (MCP) 服务器，为 Claude Code、Cursor 等 AI 开发工具提供安全的 PostgreSQL 数据库访问能力。

## 🏗️ 技术栈
- **运行时**: Bun 1.0+ / Node.js 20+
- **协议**: Model Context Protocol (MCP)
- **数据库**: PostgreSQL 12+
- **语言**: TypeScript
- **安全**: SQL注入防护、访问控制、参数化查询

## 🚀 快速开始

### 环境要求
- Bun 1.0+ 或 Node.js 20+
- PostgreSQL 12+
- 支持 MCP 的开发工具

### 安装依赖
```bash
bun install
```

### 配置数据库
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库连接
```

### 启动服务
```bash
bun run index.ts
```

## 🛠️ MCP 工具
- **pg_query**: 安全的 SQL 查询执行
- **pg_list_tables**: 数据库表浏览
- **pg_describe_table**: 表结构分析

## 📊 项目状态
- **开发状态**: ✅ 完成
- **最后更新**: 2025-01-20
- **文档**: 完整的 API 文档和部署指南

## 📚 详细文档
- [API参考文档](./API_REFERENCE.md)
- [快速开始指南](./QUICK_START.md)
- [部署指南](./DEPLOYMENT.md)
- [安全配置](./SECURITY.md)