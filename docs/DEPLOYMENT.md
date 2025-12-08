# 部署指南

本文档详细说明了 0379.email 项目的部署流程和配置要求。

## 部署环境

### 系统要求

- **操作系统**：Ubuntu 20.04+ / CentOS 8+ / macOS 12+
- **内存**：最低 8GB，推荐 16GB+
- **存储**：最低 100GB SSD
- **网络**：稳定的互联网连接

### 软件依赖

- **Docker**：24.0+
- **Docker Compose**：2.0+
- **Node.js**：18.0+ (开发环境)
- **Git**：2.30+

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/your-org/0379.email.git
cd 0379.email
```

### 2. 环境配置

```bash
# 复制环境配置文件
cp configs/environments/.env.example configs/environments/.env

# 编辑配置文件
vim configs/environments/.env
```

### 3. 生成安全密钥

```bash
# 生成 SSH 密钥和证书
make setup-security

# 或手动运行
./scripts/generate-keys-simple.sh
```

### 4. 启动服务

```bash
# 开发环境
make dev

# 生产环境
make prod-start
```

## 详细部署流程

### 开发环境部署

#### 1. 环境准备

```bash
# 安装 Docker (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 项目初始化

```bash
# 安装依赖
make install

# 初始化配置
make setup

# 设置安全配置
make setup-security
```

#### 3. 启动开发服务

```bash
# 使用开发配置启动
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
make logs
```

### 生产环境部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git htop

# 配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### 2. SSL 证书配置

```bash
# 使用 Let's Encrypt (推荐)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 0379.email -d api.0379.email

# 或使用自签名证书
./scripts/generate-ssl-certs.sh
```

#### 3. 数据库配置

```bash
# 设置数据库密码
export REDIS_PASSWORD=$(openssl rand -base64 32)
export MONGODB_PASSWORD=$(openssl rand -base64 32)
export POSTGRES_PASSWORD=$(openssl rand -base64 32)

# 更新环境配置
vim configs/environments/.env.production
```

#### 4. 启动生产服务

```bash
# 构建生产镜像
make build-prod

# 启动生产环境
make prod-start

# 检查服务健康状态
make check-health
```

## 服务配置详情

### 环境变量配置

#### 必需配置

```bash
# 应用配置
NODE_ENV=production
SERVICE_NAME=api
PORT=3000

# 数据库配置
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/0379email
POSTGRES_URL=postgresql://user:password@localhost:5432/0379email

# 安全配置
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 可选配置

```bash
# 监控配置
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

### 数据库初始化

#### MongoDB

```bash
# 连接到 MongoDB
docker-compose exec mongodb mongosh

# 创建数据库和用户
use 0379email
db.createUser({
  user: "app",
  pwd: "your-password",
  roles: [{ role: "readWrite", db: "0379email" }]
})
```

#### PostgreSQL

```bash
# 连接到 PostgreSQL
docker-compose exec postgres psql -U postgres

# 创建数据库和用户
CREATE DATABASE 0379email;
CREATE USER app WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE 0379email TO app;
```

#### Redis

```bash
# 设置 Redis 密码
docker-compose exec redis redis-cli
CONFIG SET requirepass your-password
CONFIG REWRITE
```

## 负载均衡配置

### Nginx 配置

```nginx
upstream api_backend {
    server api:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name 0379.email api.0379.email;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 0379.email api.0379.email;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/0379.email/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/0379.email/privkey.pem;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API 路由
    location /api/ {
        proxy_pass http://api_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 监控配置

### Prometheus 配置

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'

  - job_name: 'admin'
    static_configs:
      - targets: ['admin:3001']
    metrics_path: '/metrics'
```

### Grafana 仪表板

- 系统性能监控
- 应用指标监控
- 错误率和响应时间
- 用户活跃度统计

## 备份策略

### 自动备份脚本

```bash
#!/bin/bash
# backup-daily.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# 数据库备份
docker-compose exec mongodb mongodump --out /backups/mongodb_$DATE
docker-compose exec postgres pg_dump -U postgres 0379email > $BACKUP_DIR/postgres_$DATE.sql

# 文件备份
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/uploads

# 清理旧备份 (保留 30 天)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 定时任务配置

```bash
# 添加到 crontab
crontab -e

# 每日凌晨 2 点备份
0 2 * * * /path/to/backup-daily.sh

# 每周日 3 点完整备份
0 3 * * 0 /path/to/backup-full.sh
```

## 故障排除

### 常见问题

#### 服务无法启动

```bash
# 检查端口占用
netstat -tuln | grep :3000

# 检查 Docker 日志
docker-compose logs api

# 检查磁盘空间
df -h
```

#### 数据库连接失败

```bash
# 检查数据库服务状态
docker-compose ps mongodb

# 测试连接
docker-compose exec api ping mongodb

# 检查网络配置
docker network ls
```

#### 性能问题

```bash
# 检查系统资源
htop
iotop
docker stats

# 分析慢查询
docker-compose exec mongodb mongosh --eval "db.setProfilingLevel(2)"
```

### 日志分析

```bash
# 查看应用日志
docker-compose logs -f api

# 查看错误日志
grep ERROR /var/log/app/*.log

# 分析访问日志
tail -f /var/log/nginx/access.log
```

## 安全加固

### 系统安全

```bash
# 禁用 root 登录
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 配置 fail2ban
apt install fail2ban
systemctl enable fail2ban

# 定期更新
apt update && apt upgrade -y
```

### 应用安全

```bash
# 设置文件权限
chmod 600 configs/environments/.env.production
chmod 700 keys/

# 配置防火墙
ufw deny 27017  # MongoDB
ufw deny 5432   # PostgreSQL
ufw deny 6379   # Redis
```

---

*文档版本：v1.0.0*
*最后更新：2024-11-10*
