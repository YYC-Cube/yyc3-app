# PostgreSQL MCP Server - 安全指南

🔒 **全面的安全配置和最佳实践**

## 📋 目录

1. [安全概述](#安全概述)
2. [威胁模型](#威胁模型)
3. [访问控制](#访问控制)
4. [输入验证](#输入验证)
5. [SQL注入防护](#sql注入防护)
6. [网络安全](#网络安全)
7. [认证和授权](#认证和授权)
8. [审计和日志](#审计和日志)
9. [安全配置](#安全配置)
10. [漏洞管理](#漏洞管理)

## 🛡️ 安全概述

PostgreSQL MCP Server 采用多层安全防护策略，确保数据库访问的安全性：

### 核心安全原则
- **最小权限原则**: 默认只读访问，写操作需明确启用
- **深度防御**: 多层安全验证和过滤
- **默认安全**: 默认配置优先考虑安全性
- **透明审计**: 详细的安全事件日志记录

### 安全特性
- ✅ SQL注入防护
- ✅ 危险操作检测和阻止
- ✅ 表访问控制
- ✅ 查询限制和超时
- ✅ 参数化查询支持
- ✅ 安全事件审计

## 🎯 威胁模型

### 潜在威胁
1. **SQL注入攻击**
   - 恶意SQL代码注入
   - 未授权数据访问
   - 数据篡改或删除

2. **权限提升**
   - 越权访问敏感表
   - 执行未授权写操作
   - 系统配置修改

3. **拒绝服务攻击**
   - 资源耗尽攻击
   - 长时间运行的查询
   - 连接池耗尽

4. **数据泄露**
   - 敏感信息暴露
   - 错误信息泄露
   - 日志信息泄露

### 防护措施
- 输入验证和过滤
- 权限控制和检查
- 资源限制和监控
- 安全日志和审计

## 🔐 访问控制

### 数据库用户权限
```sql
-- 创建专用只读用户
CREATE USER mcp_readonly WITH PASSWORD 'secure_random_password';

-- 授予最小必要权限
GRANT CONNECT ON DATABASE your_database TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;

-- 限制连接数
ALTER USER mcp_readonly CONNECTION LIMIT 5;

-- 禁用敏感功能
REVOKE ALL ON SCHEMA information_schema FROM mcp_readonly;
REVOKE ALL ON SCHEMA pg_catalog FROM mcp_readonly;
```

### 表级访问控制
```bash
# 环境变量配置
ALLOWED_TABLES=users,products,orders,audit_logs
BLOCKED_TABLES=admin_users,sensitive_data,system_config

# 或在代码中配置
const securityConfig = {
  allowedTables: ['users', 'products', 'orders'],
  blockedTables: ['admin_users', 'sensitive_data'],
};
```

### 操作权限控制
```bash
# 默认禁止写操作
DANGEROUSLY_ALLOW_WRITE_OPS=false

# 如需启用，必须明确设置
DANGEROUSLY_ALLOW_WRITE_OPS=true
```

## 🛡️ 输入验证

### SQL查询验证
```typescript
// 危险模式检测
const dangerousPatterns = [
  // 防止DROP操作
  /drop\s+(table|database|schema|view|index|function|procedure|trigger)/i,

  // 防止无条件的DELETE
  /delete\s+from\s+\w+\s*$/i,

  // 防止ALTER操作
  /alter\s+(table|database|schema|view|function|procedure|trigger)/i,

  // 防止系统表访问
  /information_schema/i,
  /pg_catalog/i,
  /pg_toast/i,

  // 防止文件系统访问
  /copy\s+from\s+/i,
  /copy\s+to\s+/i,
];
```

### 参数验证
```typescript
// 查询参数验证
const validateParameters = (parameters: any[]): boolean => {
  return parameters.every(param => {
    const type = typeof param;
    return ['string', 'number', 'boolean', 'object'].includes(type);
  });
};

// 长度限制
const MAX_QUERY_LENGTH = 10000;
const MAX_PARAMETER_COUNT = 100;
```

### 类型安全
```typescript
// 使用Zod进行运行时验证
const QuerySchema = z.object({
  query: z.string().min(1).max(MAX_QUERY_LENGTH),
  parameters: z.array(z.any()).max(MAX_PARAMETER_COUNT).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});
```

## 🔍 SQL注入防护

### 1. 参数化查询
```typescript
// 安全的参数化查询
const result = await connectionManager.query(
  'SELECT * FROM users WHERE id = $1 AND status = $2',
  [userId, status]
);

// 避免字符串拼接
// ❌ 危险
const query = `SELECT * FROM users WHERE name = '${userName}'`;

// ✅ 安全
const query = 'SELECT * FROM users WHERE name = $1';
await connectionManager.query(query, [userName]);
```

### 2. 输入清理
```typescript
// 清理和验证输入
const sanitizeInput = (input: string): string => {
  return input
    .replace(/['"]/g, '') // 移除引号
    .replace(/--/g, '')   // 移除注释
    .replace(/;/g, '')    // 移除分号
    .trim();
};
```

### 3. 白名单验证
```typescript
// 表名白名单验证
const validateTableName = (table: string): boolean => {
  const allowedTables = ['users', 'products', 'orders'];
  return allowedTables.includes(table.toLowerCase());
};

// 列名验证
const validateColumnNames = (columns: string[]): boolean => {
  const allowedPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return columns.every(col => allowedPattern.test(col));
};
```

## 🌐 网络安全

### 1. 连接安全
```bash
# 强制SSL连接
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# 验证证书
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=/path/to/ca.pem"
```

### 2. 防火墙配置
```bash
# UFW防火墙配置
sudo ufw enable
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw deny 5432
```

### 3. 网络隔离
```yaml
# Docker网络隔离
networks:
  mcp-network:
    driver: bridge
    internal: true  # 内部网络，无外网访问
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 4. VPN/隧道
```bash
# 使用SSH隧道
ssh -L 5432:localhost:5432 user@db-server

# 或使用VPN连接
# 确保数据库和MCP服务器在同一安全网络中
```

## 🔑 认证和授权

### 1. 数据库认证
```bash
# 使用强密码
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# 或使用密码管理器
# 如HashiCorp Vault, AWS Secrets Manager等
```

### 2. 应用层认证 (可选)
```typescript
// JWT Token验证
const validateToken = (token: string): boolean => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
```

### 3. API密钥管理
```bash
# 使用环境变量
API_KEY=$(openssl rand -hex 32)

# 或从安全存储加载
AWS_SECRET_NAME=postgresql-mcp-api-key
```

## 📊 审计和日志

### 1. 安全事件日志
```typescript
// 安全事件记录
const logSecurityEvent = (event: string, details: any) => {
  if (config.logSecurityEvents) {
    console.warn({
      timestamp: new Date().toISOString(),
      event: 'SECURITY',
      type: event,
      details,
      ip: details.ip,
      userAgent: details.userAgent,
    });
  }
};

// 使用示例
logSecurityEvent('DANGEROUS_QUERY_BLOCKED', {
  query: maliciousQuery,
  pattern: matchedPattern,
  ip: clientIP,
});
```

### 2. PostgreSQL审计日志
```sql
-- 启用审计日志
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

SELECT pg_reload_conf();
```

### 3. 查询监控
```typescript
// 慢查询监控
const monitorSlowQueries = (query: string, duration: number) => {
  if (duration > config.slowQueryThreshold) {
    logSecurityEvent('SLOW_QUERY', {
      query: sanitizeQuery(query),
      duration,
      threshold: config.slowQueryThreshold,
    });
  }
};
```

## ⚙️ 安全配置

### 1. 生产环境配置
```bash
# .env.production
NODE_ENV=production

# 安全设置
DANGEROUSLY_ALLOW_WRITE_OPS=false
REQUIRE_AUTHENTICATION=true
ENABLE_QUERY_VALIDATION=true
LOG_SECURITY_EVENTS=true

# 访问控制
ALLOWED_TABLES=users,products,orders
BLOCKED_TABLES=admin_users,sensitive_data,system_secrets

# 查询限制
MAX_QUERY_ROWS=100
QUERY_TIMEOUT=10000

# 日志设置
LOG_LEVEL=warn
STRUCTURED_LOGGING=true
```

### 2. PostgreSQL安全配置
```sql
-- postgresql.conf 安全设置

# 禁用不安全功能
ssl = on
password_encryption = scram-sha-256

# 连接限制
max_connections = 100
superuser_reserved_connections = 3

# 日志设置
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB

# 安全日志
log_min_messages = warning
log_min_error_statement = error
log_connections = on
log_disconnections = on
log_lock_waits = on

-- pg_hba.conf 访问控制
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# 本地连接
local   all             postgres                                peer
local   all             mcp_readonly                            md5

# IPv4 本地连接
host    all             mcp_readonly    127.0.0.1/32            md5
host    all             mcp_readonly    10.0.0.0/8               md5

# IPv6 本地连接
host    all             mcp_readonly    ::1/128                 md5

# 拒绝其他连接
host    all             all             0.0.0.0/0               reject
```

### 3. 系统安全
```bash
# 文件权限
chmod 600 .env
chmod 700 logs/
chmod 600 config/private.key

# 用户权限
sudo useradd -r -s /bin/false mcpserver
sudo chown -R mcpserver:mcpserver /opt/postgresql-mcp-server

# SELinux/AppArmor (如果启用)
sudo semanage fcontext -a -t var_log_t "/opt/postgresql-mcp-server/logs(/.*)?"
sudo restorecon -R /opt/postgresql-mcp-server/logs
```

## 🚨 漏洞管理

### 1. 依赖扫描
```bash
# 使用npm audit
bun audit

# 使用Snyk进行安全扫描
npx snyk test

# 使用GitHub Dependabot
# 在仓库中配置 .github/dependabot.yml
```

### 2. 定期更新
```bash
# 检查更新
bun update

# 安全补丁
bun update @modelcontextprotocol/sdk postgres zod

# 定期审查
每月进行安全审查和更新
```

### 3. 安全测试
```typescript
// 安全测试用例
describe('Security Tests', () => {
  test('should block SQL injection attempts', async () => {
    const maliciousQueries = [
      "SELECT * FROM users WHERE id = 1; DROP TABLE users; --",
      "SELECT * FROM users UNION SELECT * FROM passwords",
      "'; UPDATE users SET password = 'hacked' WHERE id = 1; --",
    ];

    for (const query of maliciousQueries) {
      const result = await securityValidator.validateQuery(query);
      expect(result.isValid).toBe(false);
    }
  });

  test('should enforce table access control', async () => {
    const result = await queryTool.execute({
      query: 'SELECT * FROM admin_users',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('blocked');
  });
});
```

### 4. 事件响应计划
```bash
# 安全事件响应流程

# 1. 检测
监控系统日志和安全告警

# 2. 评估
评估事件影响范围和严重程度

# 3. 遏制
立即停止受影响的服务
限制数据库访问权限

# 4. 根除
修复安全漏洞
更新安全配置

# 5. 恢复
逐步恢复服务
加强监控

# 6. 总结
记录事件详情
更新安全策略
```

## 🔧 安全检查清单

### 部署前检查
- [ ] 使用强密码和随机密钥
- [ ] 配置SSL/TLS加密连接
- [ ] 启用查询验证和过滤
- [ ] 设置表访问控制
- [ ] 配置安全日志记录
- [ ] 禁用不必要的功能
- [ ] 设置防火墙规则
- [ ] 使用非root用户运行

### 定期检查
- [ ] 更新依赖包和系统
- [ ] 审查访问日志
- [ ] 检查慢查询模式
- [ ] 验证用户权限
- [ ] 测试备份恢复
- [ ] 运行安全扫描
- [ ] 更新安全配置

### 事件监控
- [ ] 异常查询模式
- [ ] 多次认证失败
- [ ] 权限提升尝试
- [ ] 大量数据访问
- [ ] 异常连接时间
- [ ] 系统资源异常

---

## 📞 安全报告

**发现安全漏洞？请立即报告：**

- **邮箱**: security@example.com
- **加密**: PGP密钥可从网站获取
- **响应**: 24小时内确认，7天内修复

**请勿在公开渠道报告安全漏洞。**

---

**🎯 通过遵循这些安全指南，您的PostgreSQL MCP服务器将具有强大的安全防护能力！**