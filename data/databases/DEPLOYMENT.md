# PostgreSQL MCP Server - 部署指南

🚀 **生产环境部署和运维指南**

## 📋 目录

1. [系统要求](#系统要求)
2. [环境准备](#环境准备)
3. [部署方式](#部署方式)
4. [生产环境配置](#生产环境配置)
5. [安全配置](#安全配置)
6. [性能优化](#性能优化)
7. [监控和日志](#监控和日志)
8. [故障排除](#故障排除)
9. [维护和更新](#维护和更新)

## 🖥️ 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+), macOS 10.15+, Windows 10+
- **运行时**: Bun 1.0.0+ 或 Node.js 20.0.0+
- **内存**: 512MB RAM (推荐 1GB+)
- **存储**: 100MB 可用空间
- **网络**: PostgreSQL 数据库连接

### 推荐配置
- **CPU**: 2+ 核心
- **内存**: 2GB+ RAM
- **存储**: SSD, 1GB+ 可用空间
- **网络**: 低延迟数据库连接 (内网推荐)

## 🛠️ 环境准备

### 1. 安装 Bun (推荐)
```bash
# Linux/macOS
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 2. 安装 Node.js (备选)
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 或直接下载安装包
# https://nodejs.org/
```

### 3. 安装 PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# macOS (使用 Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# 下载并安装 PostgreSQL 官方安装包
# https://www.postgresql.org/download/windows/
```

## 🚀 部署方式

### 方式一：直接部署 (开发/测试)

```bash
# 1. 克隆项目
git clone <repository-url>
cd postgresql-mcp-server-complete

# 2. 安装依赖
bun install

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 测试连接
bun run index.ts

# 5. 后台运行
nohup bun run index.ts > server.log 2>&1 &
```

### 方式二：Docker 部署 (推荐生产环境)

#### 创建 Dockerfile
```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json bun.lockb ./

# 安装依赖
RUN bun install --frozen-lockfile --production

# 复制源代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpserver -u 1001

# 设置权限
RUN chown -R mcpserver:nodejs /app
USER mcpserver

# 暴露端口 (如果使用 HTTP 模式)
EXPOSE 3000

# 启动命令
CMD ["bun", "run", "index.ts"]
```

#### 构建 Docker 镜像
```bash
# 构建镜像
docker build -t postgresql-mcp-server:latest .

# 运行容器
docker run -d \
  --name postgresql-mcp \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  postgresql-mcp-server:latest
```

#### Docker Compose 部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgresql-mcp:
    build: .
    container_name: postgresql-mcp
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mcpdb
      - DANGEROUSLY_ALLOW_WRITE_OPS=false
      - LOG_LEVEL=info
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    depends_on:
      - postgres
    networks:
      - mcp-network

  postgres:
    image: postgres:15-alpine
    container_name: postgres-mcp
    restart: unless-stopped
    environment:
      - POSTGRES_DB=mcpdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - mcp-network

volumes:
  postgres_data:

networks:
  mcp-network:
    driver: bridge
```

### 方式三：系统服务部署

#### Systemd 服务 (Linux)
```bash
# 创建服务文件
sudo nano /etc/systemd/system/postgresql-mcp.service
```

```ini
[Unit]
Description=PostgreSQL MCP Server
After=network.target postgresql.service

[Service]
Type=simple
User=mcpserver
WorkingDirectory=/opt/postgresql-mcp-server
Environment=NODE_ENV=production
EnvironmentFile=/opt/postgresql-mcp-server/.env
ExecStart=/usr/local/bin/bun run index.ts
Restart=always
RestartSec=10

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=postgresql-mcp

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

```bash
# 启用和启动服务
sudo systemctl daemon-reload
sudo systemctl enable postgresql-mcp
sudo systemctl start postgresql-mcp

# 查看状态
sudo systemctl status postgresql-mcp
sudo journalctl -u postgresql-mcp -f
```

## 🔧 生产环境配置

### 环境变量配置
```bash
# .env (生产环境)
NODE_ENV=production

# 数据库连接 (使用连接字符串)
DATABASE_URL=postgresql://app_user:secure_password@db.example.com:5432/production_db

# 安全设置
DANGEROUSLY_ALLOW_WRITE_OPS=false
MAX_QUERY_ROWS=500
QUERY_TIMEOUT=15000
REQUIRE_AUTHENTICATION=true
ENABLE_QUERY_VALIDATION=true
LOG_SECURITY_EVENTS=true

# 访问控制
ALLOWED_TABLES=users,products,orders,audit_logs
BLOCKED_TABLES=admin_users,sensitive_data

# 性能优化
MAX_CONNECTIONS=15
MAX_POOL_SIZE=8
MIN_POOL_SIZE=2
ENABLE_SLOW_QUERY_LOGGING=true
SLOW_QUERY_THRESHOLD=2000

# 缓存设置
ENABLE_QUERY_CACHING=true
QUERY_CACHE_SIZE=200
QUERY_CACHE_TTL=600

# 监控设置
LOG_LEVEL=warn
STRUCTURED_LOGGING=true
ENABLE_PERFORMANCE_METRICS=true
METRICS_INTERVAL=120
```

### 安全配置

#### 1. 数据库用户权限
```sql
-- 创建专用 MCP 用户
CREATE USER mcp_user WITH PASSWORD 'secure_random_password';

-- 授予只读权限
GRANT CONNECT ON DATABASE production_db TO mcp_user;
GRANT USAGE ON SCHEMA public TO mcp_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_user;

-- 为未来表设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_user;

-- 限制连接数
ALTER USER mcp_user CONNECTION LIMIT 10;
```

#### 2. 网络安全
```bash
# 防火墙配置 (ufw)
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw deny 5432

# 使用 VPN 或内网连接
# 避免将 PostgreSQL 暴露到公网
```

#### 3. SSL/TLS 配置
```bash
# 强制 SSL 连接
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# 或使用证书验证
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=/path/to/ca.pem
```

## ⚡ 性能优化

### 1. 连接池优化
```bash
# 高并发配置
MAX_POOL_SIZE=20
MIN_POOL_SIZE=5
ACQUIRE_TIMEOUT_MILLIS=5000
IDLE_TIMEOUT_MILLIS=30000
```

### 2. 查询缓存
```bash
# 启用 Redis 缓存 (可选)
REDIS_URL=redis://localhost:6379
ENABLE_QUERY_CACHING=true
QUERY_CACHE_TTL=1800  # 30 minutes
```

### 3. 数据库优化
```sql
-- PostgreSQL 配置优化
-- postgresql.conf

# 内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# 连接设置
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# 日志设置
log_statement = 'all'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### 4. 监控和性能指标
```bash
# 启用详细监控
ENABLE_PERFORMANCE_METRICS=true
METRICS_INTERVAL=30
ENABLE_QUERY_STATS=true
ENABLE_CONNECTION_STATS=true
```

## 📊 监控和日志

### 1. 日志配置
```bash
# 结构化日志
STRUCTURED_LOGGING=true
LOG_LEVEL=info

# 日志轮转 (logrotate 配置)
# /etc/logrotate.d/postgresql-mcp
/opt/postgresql-mcp-server/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 mcpserver mcpserver
    postrotate
        systemctl reload postgresql-mcp
    endscript
}
```

### 2. 监控集成

#### Prometheus Metrics (可选)
```typescript
// 添加到 main server
import client from 'prom-client';

const register = new client.Registry();
const httpRequestDuration = new client.Histogram({
  name: 'mcp_query_duration_seconds',
  help: 'Duration of MCP queries in seconds',
  labelNames: ['tool', 'status'],
});

register.registerMetric(httpRequestDuration);
```

#### Health Check 端点
```typescript
// 添加健康检查
app.get('/health', async (req, res) => {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
  res.json(status);
});
```

### 3. 告警配置
```yaml
# alertmanager.yml (示例)
groups:
- name: postgresql-mcp
  rules:
  - alert: HighErrorRate
    expr: mcp_error_rate > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"

  - alert: SlowQueries
    expr: mcp_slow_queries > 10
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Multiple slow queries detected"
```

## 🔧 故障排除

### 常见问题

#### 1. 连接失败
```bash
# 检查数据库连接
psql "postgresql://user:pass@host:5432/db"

# 检查网络连通性
telnet db-host 5432

# 查看服务状态
sudo systemctl status postgresql-mcp
```

#### 2. 内存不足
```bash
# 监控内存使用
top -p $(pgrep -f "bun.*index.ts")

# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. 性能问题
```bash
# 启用慢查询日志
log_min_duration_statement = 1000

# 分析慢查询
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 调试模式
```bash
# 启用详细调试
LOG_LEVEL=debug
STRUCTURED_LOGGING=true
ENABLE_QUERY_VALIDATION=true
LOG_SECURITY_EVENTS=true

# 运行调试模式
bun run index.ts
```

## 🔄 维护和更新

### 1. 备份策略
```bash
# 数据库备份
pg_dump production_db | gzip > backup_$(date +%Y%m%d).sql.gz

# 配置文件备份
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env *.json

# 自动化备份脚本
#!/bin/bash
# backup.sh
BACKUP_DIR="/opt/backups/postgresql-mcp"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env *.json
```

### 2. 更新流程
```bash
# 1. 备份当前版本
./backup.sh

# 2. 停止服务
sudo systemctl stop postgresql-mcp

# 3. 更新代码
git pull origin main

# 4. 更新依赖
bun install --production

# 5. 运行测试
bun test

# 6. 启动服务
sudo systemctl start postgresql-mcp

# 7. 验证更新
curl http://localhost:3000/health
```

### 3. 滚动更新 (Docker)
```bash
# 使用 Docker Swarm 或 Kubernetes
docker-compose pull
docker-compose up -d --no-deps postgresql-mcp
docker-compose ps
```

---

## 📞 获取帮助

- **文档**: 查看项目 `docs/` 目录
- **问题反馈**: GitHub Issues
- **社区支持**: 项目讨论区
- **紧急支持**: 查看 `SECURITY.md`

**🎯 现在您可以在生产环境中安全运行 PostgreSQL MCP 服务器了！**