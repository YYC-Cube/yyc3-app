# PostgreSQL MCP Server - 快速开始指南

🚀 **5分钟内配置并运行PostgreSQL MCP服务器**

## 📋 系统要求

- Bun 运行时 (v1.0.0+)
- PostgreSQL 数据库 (v12+)
- 支持MCP的开发工具 (Cursor, Claude Code等)

## 🚀 快速安装

### 1. 克隆或下载项目
```bash
git clone <repository-url>
cd postgresql-mcp-server-complete
```

### 2. 安装依赖
```bash
bun install
```

### 3. 配置数据库连接
```bash
# 复制配置模板
cp config/database.example.ts config/database.ts

# 编辑配置文件 (使用你喜欢的编辑器)
nano config/database.ts
```

编辑配置文件：
```typescript
export const DatabaseConfig = {
  databaseUrl: 'postgresql://username:password@localhost:5432/database_name',
  // 或者使用单独的参数
  host: 'localhost',
  port: 5432,
  database: 'database_name',
  user: 'username',
  password: 'password',
  pool: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
};
```

### 4. 启动服务器
```bash
bun run index.ts
```

成功启动后，你会看到：
```
[INFO] Initializing PostgreSQL MCP Server
[INFO] Database connection established
[INFO] PostgreSQL MCP Server running on stdio
```

## 🔧 在开发工具中配置

### Cursor 配置

1. **打开Cursor设置**
   - 按 `Cmd + ,` (macOS) 或 `Ctrl + ,` (Windows/Linux)
   - 搜索 "MCP" 或 "Model Context Protocol"

2. **添加MCP服务器**
   - 点击 "Add MCP Server" 或 "添加MCP服务器"
   - 填写以下信息：

```
Name: postgresql
Command: bun
Arguments: /path/to/postgresql-mcp-server-complete/index.ts
Working Directory: /path/to/postgresql-mcp-server-complete
Environment Variables:
  DATABASE_URL=postgresql://username:password@localhost:5432/database
  DANGEROUSLY_ALLOW_WRITE_OPS=false
  LOG_LEVEL=info
```

### Claude Code 配置

编辑 `~/.config/claude-code/mcp.json`：
```json
{
  "mcpServers": {
    "postgresql": {
      "command": "bun",
      "args": ["/Users/yanyu/www/postgresql-mcp-server-complete/index.ts"],
      "cwd": "/Users/yanyu/www/postgresql-mcp-server-complete",
      "env": {
        "DATABASE_URL": "postgresql://username:password@localhost:5432/database",
        "DANGEROUSLY_ALLOW_WRITE_OPS": "false"
      }
    }
  }
}
```

### 其他开发工具

参考 `docs/` 目录中的详细配置指南。

## 🧪 测试服务器

### 使用MCP Inspector
```bash
npm run inspect
```

这将启动可视化的MCP测试界面，可以：
- 查看可用工具
- 测试工具功能
- 检查资源访问

### 基本功能测试

在配置好的开发工具中测试：

#### 测试连接
```
请列出所有可用的MCP工具。
```

#### 测试表列表
```
请使用 pg_list_tools 查看数据库中的所有表。
```

#### 测试表结构
```
请使用 pg_describe_table 描述 users 表的结构。
```

#### 测试SQL查询
```
请使用 pg_query 执行以下查询：
SELECT 'Hello PostgreSQL!' as message, NOW() as current_time;
```

## 📊 可用工具

### `pg_query` - 执行SQL查询
执行各种SQL查询，支持参数化查询。

**参数**：
- `query` (required): SQL查询字符串
- `parameters` (optional): 查询参数数组
- `limit` (optional): 最大返回行数 (默认100，最大1000)

**示例**：
```sql
SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 10
```

### `pg_list_tables` - 列出数据库表
获取数据库中所有表的列表。

**参数**：
- `schema` (optional): 架构名称过滤

**示例**：
```javascript
{
  "schema": "public"
}
```

### `pg_describe_table` - 描述表结构
获取表的详细结构信息，包括列、约束、索引等。

**参数**：
- `table` (required): 表名
- `schema` (optional): 架构名称

**示例**：
```javascript
{
  "table": "users",
  "schema": "public"
}
```

## 🔒 安全设置

### 默认安全配置

- **只读模式**: 默认禁止写操作
- **查询限制**: 最大返回1000行
- **超时控制**: 30秒查询超时
- **SQL注入防护**: 参数化查询和输入验证

### 启用写操作

如需启用INSERT、UPDATE、DELETE操作：

1. 设置环境变量：
```bash
export DANGEROUSLY_ALLOW_WRITE_OPS=true
```

2. 或在开发工具中配置：
```
DANGEROUSLY_ALLOW_WRITE_OPS=true
```

## 🔍 故障排除

### 常见问题

#### 数据库连接失败
```bash
# 检查PostgreSQL是否运行
brew services list | grep postgresql

# 或检查端口占用
lsof -i :5432

# 测试连接
psql -h localhost -U postgres -d postgres
```

#### MCP服务器启动失败
```bash
# 检查依赖是否正确安装
bun install --verbose

# 检查语法错误
bun run index.ts
```

#### 开发工具无法连接
- 检查MCP配置文件路径
- 验证环境变量设置
- 查看开发工具的错误日志

### 调试模式

启用详细日志：
```bash
export LOG_LEVEL=debug
bun run index.ts
```

启用结构化日志：
```bash
export STRUCTURED_LOGGING=true
bun run index.ts
```

## 📚 更多文档

- [完整API参考](./API_REFERENCE.md)
- [部署指南](./DEPLOYMENT.md)
- [安全指南](./SECURITY.md)
- [架构设计](./docs/architecture.md)

## 🆘 获取帮助

- 查看项目README: `cat README.md`
- 运行测试: `npm test`
- 查看日志: 检查控制台输出

---

**🎯 现在您可以在任何支持MCP的开发工具中安全地访问PostgreSQL数据库了！**