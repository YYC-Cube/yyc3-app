# PostgreSQL MCP Server - API 参考文档

📚 **完整的API接口文档和工具参考**

## 📋 目录

1. [概述](#概述)
2. [MCP工具](#mcp工具)
3. [MCP资源](#mcp资源)
4. [数据类型](#数据类型)
5. [错误处理](#错误处理)
6. [配置参数](#配置参数)
7. [示例代码](#示例代码)

## 🎯 概述

PostgreSQL MCP Server 提供三个核心工具和一个资源管理系统，通过MCP协议为AI开发工具提供安全的PostgreSQL数据库访问能力。

### 核心功能
- **安全查询执行**: 带SQL注入防护的查询执行
- **表结构分析**: 详细的表结构和约束信息
- **数据库浏览**: 表和模式的枚举和浏览
- **资源访问**: 基于URI的数据库资源访问

### 安全特性
- 默认只读访问模式
- SQL注入防护和危险操作检测
- 表访问控制列表
- 查询限制和超时保护
- 详细的审计日志

## 🛠️ MCP工具

### 1. pg_query - SQL查询执行

执行SQL查询并返回结果，支持参数化查询和安全验证。

#### 参数
```typescript
{
  query: string;                    // 必需 - SQL查询语句
  parameters?: any[];              // 可选 - 查询参数数组
  limit?: number;                  // 可选 - 最大返回行数 (1-1000)
}
```

#### 返回值
```typescript
{
  success: boolean;                // 查询是否成功
  data?: any[];                    // 查询结果数据
  rowCount?: number;               // 返回行数
  message: string;                 // 状态消息
  executionTime?: number;          // 执行时间(毫秒)
}
```

#### 使用示例
```javascript
// 基本查询
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC",
    "limit": 10
  }
}

// 参数化查询
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT * FROM products WHERE category = $1 AND price > $2",
    "parameters": ["electronics", 100],
    "limit": 50
  }
}

// 聚合查询
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT category, COUNT(*) as count, AVG(price) as avg_price FROM products GROUP BY category"
  }
}
```

#### 安全规则
- 默认禁止写操作 (INSERT, UPDATE, DELETE, DROP等)
- 自动添加LIMIT子句 (如果未指定)
- 检测并阻止危险SQL模式
- 验证表访问权限

---

### 2. pg_list_tables - 列出数据库表

列出数据库中的所有表、视图和物化视图，支持模式过滤。

#### 参数
```typescript
{
  schema?: string;                 // 可选 - 模式名称过滤
  includeSystemTables?: boolean;   // 可选 - 是否包含系统表 (默认: false)
}
```

#### 返回值
```typescript
{
  success: boolean;
  data?: Array<{
    table_schema: string;          // 模式名称
    table_name: string;            // 表名
    table_type: string;            // 表类型 (BASE TABLE, VIEW, MATERIALIZED VIEW)
    comment?: string;              // 表注释
  }>;
  count?: number;                  // 表总数
  message: string;
}
```

#### 使用示例
```javascript
// 列出所有用户表
{
  "name": "pg_list_tables",
  "arguments": {}
}

// 列出特定模式的表
{
  "name": "pg_list_tables",
  "arguments": {
    "schema": "public"
  }
}

// 包含系统表
{
  "name": "pg_list_tables",
  "arguments": {
    "includeSystemTables": true
  }
}
```

---

### 3. pg_describe_table - 描述表结构

获取表的详细结构信息，包括列、约束、索引等。

#### 参数
```typescript
{
  table: string;                   // 必需 - 表名
  schema?: string;                 // 可选 - 模式名称 (默认: public)
}
```

#### 返回值
```typescript
{
  success: boolean;
  data?: {
    table_schema: string;
    table_name: string;
    table_type: string;
    description?: string;          // 表描述
    row_count?: number;            // 大概行数
    columns: Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default?: string;
      character_maximum_length?: number;
      numeric_precision?: number;
      numeric_scale?: number;
      ordinal_position: number;
      description?: string;
    }>;
    constraints: Array<{
      constraint_name: string;
      constraint_type: string;
      column_names: string[];
      foreign_table?: string;
      foreign_columns?: string[];
      check_condition?: string;
    }>;
    indexes: Array<{
      index_name: string;
      index_type: string;
      columns: string[];
      is_unique: boolean;
      is_primary_key: boolean;
    }>;
  };
  message: string;
}
```

#### 使用示例
```javascript
// 描述用户表
{
  "name": "pg_describe_table",
  "arguments": {
    "table": "users"
  }
}

// 描述特定模式的表
{
  "name": "pg_describe_table",
  "arguments": {
    "table": "products",
    "schema": "inventory"
  }
}
```

## 📁 MCP资源

### 资源类型

#### 1. 模式资源
```
URI: postgres://schema_name
类型: application/json
内容: 模式中所有表的列表和基本信息
```

#### 2. 表资源
```
URI: postgres://schema_name.table_name
类型: application/json
内容: 表结构、列信息和示例数据
```

#### 3. 统计资源
```
URI: postgres://stats
类型: application/json
内容: 数据库统计信息和性能指标
```

### 资源访问示例

```javascript
// 列出所有资源
{
  "name": "list_resources"
}

// 读取模式资源
{
  "name": "read_resource",
  "arguments": {
    "uri": "postgres://public"
  }
}

// 读取表资源
{
  "name": "read_resource",
  "arguments": {
    "uri": "postgres://public.users"
  }
}

// 读取统计信息
{
  "name": "read_resource",
  "arguments": {
    "uri": "postgres://stats"
  }
}
```

## 📊 数据类型

### PostgreSQL数据类型映射

| PostgreSQL类型 | JSON类型 | 描述 |
|---------------|---------|------|
| INTEGER, INT4 | number | 32位整数 |
| BIGINT, INT8 | number | 64位整数 |
| DECIMAL, NUMERIC | string | 精确数值 |
| REAL, FLOAT4 | number | 32位浮点数 |
| DOUBLE PRECISION, FLOAT8 | number | 64位浮点数 |
| VARCHAR, TEXT | string | 字符串 |
| CHAR | string | 定长字符串 |
| BOOLEAN | boolean | 布尔值 |
| DATE | string | 日期 (YYYY-MM-DD) |
| TIMESTAMP | string | 时间戳 (ISO 8601) |
| TIMESTAMPTZ | string | 带时区时间戳 |
| TIME | string | 时间 |
| JSON, JSONB | object | JSON对象 |
| ARRAY | array | 数组 |
| UUID | string | UUID字符串 |
| BYTEA | string | Base64编码的二进制数据 |

### 特殊值处理
- `NULL` 值在JSON中表示为 `null`
- 数组类型转换为JSON数组
- JSON/JSONB类型解析为JSON对象
- 时间戳转换为ISO 8601格式字符串

## ❌ 错误处理

### 错误响应格式
```typescript
{
  content: [{
    type: "text",
    text: "Error message description"
  }],
  isError: true
}
```

### 常见错误类型

#### 1. 验证错误 (400)
```json
{
  "success": false,
  "message": "Invalid input: Query cannot be empty"
}
```

#### 2. 安全错误 (403)
```json
{
  "success": false,
  "message": "Security validation failed: Query contains potentially dangerous pattern"
}
```

#### 3. 权限错误 (403)
```json
{
  "success": false,
  "message": "Access to table 'admin_users' is blocked"
}
```

#### 4. 数据库错误 (500)
```json
{
  "success": false,
  "message": "Database error (42P01): relation \"nonexistent_table\" does not exist"
}
```

#### 5. 连接错误 (500)
```json
{
  "success": false,
  "message": "Failed to connect to database: connection refused"
}
```

#### 6. 超时错误 (408)
```json
{
  "success": false,
  "message": "Query execution timeout: query exceeded 30000ms limit"
}
```

### PostgreSQL错误代码
| 代码 | 类别 | 描述 |
|------|------|------|
| 42P01 | undefined_table | 表不存在 |
| 42703 | undefined_column | 列不存在 |
| 23505 | unique_violation | 唯一约束违反 |
| 23503 | foreign_key_violation | 外键约束违反 |
| 23514 | check_violation | 检查约束违反 |
| 22001 | string_data_right_truncation | 字符串过长 |
| 08006 | connection_failure | 连接失败 |
| 08001 | sqlclient_unable_to_establish_sqlconnection | 无法建立连接 |

## ⚙️ 配置参数

### 环境变量配置

```bash
# 数据库连接
DATABASE_URL=postgresql://user:pass@host:5432/db
PGHOST=localhost
PGPORT=5432
PGDATABASE=database
PGUSER=username
PGPASSWORD=password

# 安全设置
DANGEROUSLY_ALLOW_WRITE_OPS=false      # 允许写操作
MAX_QUERY_ROWS=1000                   # 最大返回行数
QUERY_TIMEOUT=30000                   # 查询超时(毫秒)
REQUIRE_AUTHENTICATION=false          # 需要认证
ENABLE_QUERY_VALIDATION=true          # 启用查询验证
LOG_SECURITY_EVENTS=true              # 记录安全事件

# 访问控制
ALLOWED_TABLES=users,products,orders  # 允许访问的表
BLOCKED_TABLES=admin_users,secrets    # 禁止访问的表

# 性能设置
MAX_CONNECTIONS=10                     # 最大连接数
MAX_POOL_SIZE=5                       # 连接池最大大小
ENABLE_SLOW_QUERY_LOGGING=true        # 慢查询日志
SLOW_QUERY_THRESHOLD=1000             # 慢查询阈值(毫秒)

# 日志配置
LOG_LEVEL=info                        # 日志级别
STRUCTURED_LOGGING=false              # 结构化日志
LOG_PREFIX=PostgreSQL-MCP             # 日志前缀
```

### 运行时配置

```typescript
// 在代码中动态配置
const config = {
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  },
  security: {
    allowWriteOps: false,
    maxQueryRows: 1000,
    dangerousPatterns: [
      /drop\s+table/i,
      /delete\s+from\s+\w+\s*$/i,
      // 更多模式...
    ],
    allowedTables: ['users', 'products'],
    blockedTables: ['admin_users'],
  },
  logging: {
    level: 'info',
    structured: false,
  }
};
```

## 💡 示例代码

### 1. 基本查询示例

```javascript
// 获取所有活跃用户
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT id, username, email, created_at FROM users WHERE status = 'active' ORDER BY created_at DESC",
    "limit": 20
  }
}

// 带参数的搜索
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT * FROM products WHERE name ILIKE $1 AND price BETWEEN $2 AND $3",
    "parameters": ["%laptop%", 500, 2000],
    "limit": 10
  }
}
```

### 2. 数据分析示例

```javascript
// 销售统计
{
  "name": "pg_query",
  "arguments": {
    "query": `
      SELECT
        DATE_TRUNC('month', order_date) as month,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE order_date >= NOW() - INTERVAL '1 year'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month DESC
    `
  }
}

// 产品类别分析
{
  "name": "pg_query",
  "arguments": {
    "query": `
      SELECT
        c.name as category,
        COUNT(p.id) as product_count,
        AVG(p.price) as avg_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `
  }
}
```

### 3. 表浏览示例

```javascript
// 获取所有表
{
  "name": "pg_list_tables",
  "arguments": {}
}

// 获取表结构
{
  "name": "pg_describe_table",
  "arguments": {
    "table": "users"
  }
}

// 查看表数据样本
{
  "name": "pg_query",
  "arguments": {
    "query": "SELECT * FROM users LIMIT 5"
  }
}
```

### 4. 高级查询示例

```javascript
// 复杂连接查询
{
  "name": "pg_query",
  "arguments": {
    "query": `
      SELECT
        u.username,
        u.email,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.order_date) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY u.id, u.username, u.email
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `
  }
}

// 窗口函数查询
{
  "name": "pg_query",
  "arguments": {
    "query": `
      SELECT
        name,
        price,
        category,
        RANK() OVER (PARTITION BY category ORDER BY price DESC) as price_rank,
        LAG(price) OVER (PARTITION BY category ORDER BY price) as prev_price
      FROM products
      WHERE category = $1
      ORDER BY price DESC
    `,
    "parameters": ["electronics"]
  }
}
```

### 5. 资源访问示例

```javascript
// 通过资源访问表信息
{
  "name": "read_resource",
  "arguments": {
    "uri": "postgres://public.products"
  }
}

// 访问数据库统计
{
  "name": "read_resource",
  "arguments": {
    "uri": "postgres://stats"
  }
}
```

## 🔧 工具集成示例

### Claude Code 配置
```json
{
  "mcpServers": {
    "postgresql": {
      "command": "bun",
      "args": ["/path/to/postgresql-mcp-server/index.ts"],
      "cwd": "/path/to/postgresql-mcp-server",
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host:5432/db",
        "DANGEROUSLY_ALLOW_WRITE_OPS": "false",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 使用提示
```javascript
// 在AI助手中可以这样使用：
"请使用 pg_describe_table 工具分析 users 表的结构"

"请使用 pg_query 工具查找价格在100-500之间的电子产品"

"请使用 pg_list_tables 工具列出数据库中所有的表"
```

---

## 📞 技术支持

- **文档**: [完整项目文档](./README.md)
- **问题反馈**: GitHub Issues
- **安全报告**: [SECURITY.md](./SECURITY.md)
- **部署指南**: [DEPLOYMENT.md](./DEPLOYMENT.md)

**🎯 现在您可以充分利用PostgreSQL MCP Server的强大功能了！**