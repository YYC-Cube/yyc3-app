# YYC3服务非Docker部署方案

## 概述

本方案提供了在阿里云ECS上不使用Docker部署YYC3所有服务的完整指导。所有服务将直接在ECS上安装运行环境并启动，使用PM2进行进程管理，Nginx作为反向代理。

## 环境准备

### 1. 系统要求

- **操作系统**: CentOS 7/8 或 Ubuntu 18.04+（推荐Ubuntu 20.04）
- **CPU**: 至少 2核
- **内存**: 至少 4GB
- **磁盘**: 至少 50GB 可用空间

### 2. 基础软件安装

#### 2.1 更新系统

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y && sudo yum upgrade -y
```

#### 2.2 安装Node.js (v18+)

```bash
# 使用NodeSource安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version   # 应显示 v9.x.x

# 安装pnpm (mail服务需要)
npm install -g pnpm
```

#### 2.3 安装PM2进程管理器

```bash
npm install -g pm2
```

#### 2.4 安装PostgreSQL数据库

```bash
# Ubuntu
apt install -y postgresql postgresql-contrib

# CentOS
yum install -y postgresql-server postgresql-contrib
postgresql-setup --initdb

systemctl start postgresql
systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << 'EOF'
CREATE USER yyc3_user WITH PASSWORD 'yyc3_password';
CREATE DATABASE yyc3_db OWNER yyc3_user;
CREATE DATABASE yyc3_email OWNER yyc3_user;
GRANT ALL PRIVILEGES ON DATABASE yyc3_db TO yyc3_user;
GRANT ALL PRIVILEGES ON DATABASE yyc3_email TO yyc3_user;
EOF
```

#### 2.5 安装Redis

```bash
# Ubuntu
apt install -y redis-server

# CentOS
yum install -y redis

systemctl start redis
systemctl enable redis
```

#### 2.6 安装Nginx

```bash
# Ubuntu
apt install -y nginx

# CentOS
yum install -y nginx

systemctl start nginx
systemctl enable nginx
```

## 服务部署

### 1. 项目文件上传

```bash
# 从本地上传项目文件到ECS
scp -r -P 22 /Users/yanyu/www/yyc3-22/app root@8.152.195.33:/opt/yyc3

# 连接到ECS
ssh -p 22 root@8.152.195.33

# 进入项目目录
cd /opt/yyc3
```

### 2. API服务部署

#### 2.1 配置环境变量

```bash
# 进入API服务目录
cd /opt/yyc3/services/api

# 创建.env文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=6600
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_db
DB_USER=yyc3_user
DB_PASSWORD=yyc3_password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=yyc3_jwt_secret_key_minimum_32_characters
EOF
```

#### 2.2 安装依赖并启动服务

```bash
# 安装依赖
npm install --production

# 使用PM2启动服务
pm install -g pm2
pm install pm2-logrotate

# 配置PM2应用
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'api-service',
    script: 'simple-server.js',
    cwd: '/opt/yyc3/services/api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 6600
    },
    error_file: '/opt/yyc3/services/api/logs/error.log',
    out_file: '/opt/yyc3/services/api/logs/out.log',
    log_file: '/opt/yyc3/services/api/logs/combined.log',
    time: true,
    max_memory_restart: '256M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
pm install pm2
pm run start

# 保存PM2配置
pm install -g pm2
pm run pm2:save
```

### 3. Admin服务部署

#### 3.1 配置环境变量

```bash
# 进入Admin服务目录
cd /opt/yyc3/services/admin

# 创建.env文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=6601
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
EOF
```

#### 3.2 构建并启动服务

```bash
# 安装依赖
npm install --production

# 构建TypeScript代码
npm run build

# 配置PM2应用
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'admin-service',
    script: 'dist/index.js',
    cwd: '/opt/yyc3/services/admin',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 6601
    },
    error_file: '/opt/yyc3/services/admin/logs/error.log',
    out_file: '/opt/yyc3/services/admin/logs/out.log',
    log_file: '/opt/yyc3/services/admin/logs/combined.log',
    time: true,
    max_memory_restart: '256M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
pm install pm2
pm run start
```

### 4. LLM服务部署

#### 4.1 配置环境变量

```bash
# 进入LLM服务目录
cd /opt/yyc3/services/llm

# 创建.env文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=6602
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
EOF
```

#### 4.2 构建并启动服务

```bash
# 安装依赖
npm install --production

# 构建TypeScript代码
npm run build

# 配置PM2应用
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'llm-service',
    script: 'dist/index.js',
    cwd: '/opt/yyc3/services/llm',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 6602
    },
    error_file: '/opt/yyc3/services/llm/logs/error.log',
    out_file: '/opt/yyc3/services/llm/logs/out.log',
    log_file: '/opt/yyc3/services/llm/logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
npm install pm2
npm run start
```

### 5. Mail服务部署

#### 5.1 配置环境变量

```bash
# 进入Mail服务目录
cd /opt/yyc3/services/mail

# 创建.env文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=6603
DOMAIN=mail.0379.email
API_DOMAIN=api.0379.email
MAIN_DOMAIN=0379.love

# 数据库配置
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_email
DB_USER=yyc3_user
DB_PASSWORD=yyc3_password
DB_SSL=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=yyc3_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://mail.0379.email,https://0379.love
EOF
```

#### 5.2 安装依赖并启动服务

```bash
# 安装pnpm
npm install -g pnpm

# 安装依赖
pnpm install --production
pnpm -r install --production

# 构建项目
pnpm run build

# 配置PM2应用
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mail-service',
    script: 'production-server.js',
    cwd: '/opt/yyc3/services/mail',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 6603
    },
    error_file: '/opt/yyc3/services/mail/logs/error.log',
    out_file: '/opt/yyc3/services/mail/logs/out.log',
    log_file: '/opt/yyc3/services/mail/logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
npm install pm2
npm run start
```

## 服务管理

### 1. PM2管理命令

```bash
# 查看所有服务状态
pm install -g pm2
pm run pm2:status

# 重启所有服务
pm run pm2:restart

# 查看服务日志
npm run pm2:logs

# 查看特定服务日志
npm run pm2:logs -- api-service
```

### 2. 健康检查

```bash
# 检查API服务
curl http://localhost:6600/health

# 检查Admin服务
curl http://localhost:6601/health

# 检查LLM服务
curl http://localhost:6602/health

# 检查Mail服务
curl http://localhost:6603/health
```

## Nginx配置

### 1. 主配置文件

```bash
# 备份原配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# 更新Nginx主配置
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;

include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log notice;

    # Gzip压缩
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 代理设置
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # 包含服务配置
    include /etc/nginx/conf.d/*.conf;
}
EOF
```

### 2. 服务配置文件

```bash
# 创建API服务配置
cat > /etc/nginx/conf.d/api.0379.email.conf << 'EOF'
server {
    listen 80;
    server_name api.0379.email;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.0379.email;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/api.0379.email.crt;
    ssl_certificate_key /etc/nginx/ssl/api.0379.email.key;
    
    location / {
        proxy_pass http://localhost:6600;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        send_timeout 300;
    }
    
    location /health {
        proxy_pass http://localhost:6600/health;
        access_log off;
    }
}
EOF

# 创建Admin服务配置
cat > /etc/nginx/conf.d/admin.0379.email.conf << 'EOF'
server {
    listen 80;
    server_name admin.0379.email;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.0379.email;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/admin.0379.email.crt;
    ssl_certificate_key /etc/nginx/ssl/admin.0379.email.key;
    
    location / {
        proxy_pass http://localhost:6601;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        send_timeout 300;
    }
    
    location /health {
        proxy_pass http://localhost:6601/health;
        access_log off;
    }
}
EOF

# 创建LLM服务配置
cat > /etc/nginx/conf.d/llm.0379.email.conf << 'EOF'
server {
    listen 80;
    server_name llm.0379.email;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name llm.0379.email;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/llm.0379.email.crt;
    ssl_certificate_key /etc/nginx/ssl/llm.0379.email.key;
    
    location / {
        proxy_pass http://localhost:6602;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        send_timeout 300;
    }
    
    location /health {
        proxy_pass http://localhost:6602/health;
        access_log off;
    }
}
EOF

# 创建Mail服务配置
cat > /etc/nginx/conf.d/mail.0379.email.conf << 'EOF'
server {
    listen 80;
    server_name mail.0379.email;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.0379.email;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/mail.0379.email.crt;
    ssl_certificate_key /etc/nginx/ssl/mail.0379.email.key;
    
    location / {
        proxy_pass http://localhost:6603;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        send_timeout 300;
    }
    
    location /health {
        proxy_pass http://localhost:6603/health;
        access_log off;
    }
}
EOF
```

### 3. 验证Nginx配置并重启

```bash
# 验证配置
nginx -t

# 重启Nginx
systemctl reload nginx
```

## FRPS配置

### 1. 检查FRPS服务状态

```bash
# 查看FRPS配置
cat /root/frps/frps.toml

# 检查FRPS服务状态
systemctl status frps

# 如果需要重启FRPS
systemctl restart frps
```

### 2. 确保FRPS配置正确

```bash
# 确保配置文件包含以下内容
cat /root/frps/frps.toml << 'EOF'
bind_port = 7001
dashboard_port = 7500
dashboard_user = yyc3
dashboard_pwd = my151001
vhost_http_port = 18080
vhost_https_port = 4443
allow_ports = [5001,5002,5003,5004,5005,5006,6000,6600,6601,6602,6603]
token = yyc3_nas
EOF
```

## 服务验证

### 1. 本地端口测试

```bash
# 测试API服务
curl http://localhost:6600/health

# 测试Admin服务
curl http://localhost:6601/health

# 测试LLM服务
curl http://localhost:6602/health

# 测试Mail服务
curl http://localhost:6603/health
```

### 2. 域名访问测试

使用浏览器或curl测试以下服务URL：

```bash
curl https://api.0379.email/health
curl https://admin.0379.email/health
curl https://llm.0379.email/health
curl https://mail.0379.email/health
```

## 自动化管理脚本

### 1. 服务启动脚本

```bash
# 创建启动脚本
cat > /opt/yyc3/scripts/start-all-services.sh << 'EOF'
#!/bin/bash

# 进入项目目录
cd /opt/yyc3

# 启动API服务
echo "启动API服务..."
cd /opt/yyc3/services/api
pm install pm2
npm run start

# 启动Admin服务
echo "启动Admin服务..."
cd /opt/yyc3/services/admin
npm install pm2
npm run start

# 启动LLM服务
echo "启动LLM服务..."
cd /opt/yyc3/services/llm
npm install pm2
npm run start

# 启动Mail服务
echo "启动Mail服务..."
cd /opt/yyc3/services/mail
npm install pm2
npm run start

echo "所有服务启动完成！"
EOF

# 赋予执行权限
chmod +x /opt/yyc3/scripts/start-all-services.sh
```

### 2. 服务监控脚本

```bash
# 创建监控脚本
cat > /opt/yyc3/scripts/monitor-services.sh << 'EOF'
#!/bin/bash

echo "YYC3服务监控报告 $(date)"
echo "==========================="

# 检查API服务
echo "
API服务状态:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6600/health || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API服务正常运行"
else
    echo "❌ API服务异常，HTTP状态码: $API_STATUS"
    # 自动重启服务
    cd /opt/yyc3/services/api
    npm install pm2
    npm run restart
fi

# 检查Admin服务
echo "
Admin服务状态:"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6601/health || echo "000")
if [ "$ADMIN_STATUS" = "200" ]; then
    echo "✅ Admin服务正常运行"
else
    echo "❌ Admin服务异常，HTTP状态码: $ADMIN_STATUS"
    # 自动重启服务
    cd /opt/yyc3/services/admin
    npm install pm2
    npm run restart
fi

# 检查LLM服务
echo "
LLM服务状态:"
LLM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6602/health || echo "000")
if [ "$LLM_STATUS" = "200" ]; then
    echo "✅ LLM服务正常运行"
else
    echo "❌ LLM服务异常，HTTP状态码: $LLM_STATUS"
    # 自动重启服务
    cd /opt/yyc3/services/llm
    npm install pm2
    npm run restart
fi

# 检查Mail服务
echo "
Mail服务状态:"
MAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6603/health || echo "000")
if [ "$MAIL_STATUS" = "200" ]; then
    echo "✅ Mail服务正常运行"
else
    echo "❌ Mail服务异常，HTTP状态码: $MAIL_STATUS"
    # 自动重启服务
    cd /opt/yyc3/services/mail
    npm install pm2
    npm run restart
fi

echo "
==========================="
echo "监控结束 $(date)"
EOF

# 赋予执行权限
chmod +x /opt/yyc3/scripts/monitor-services.sh

# 添加到crontab，每5分钟执行一次
crontab -l > /tmp/current_crontab
echo "*/5 * * * * /opt/yyc3/scripts/monitor-services.sh >> /opt/yyc3/scripts/monitor.log 2>&1" >> /tmp/current_crontab
crontab /tmp/current_crontab
rm /tmp/current_crontab
```

## 注意事项

1. **SSL证书**: 需要为各个域名申请并安装SSL证书，将证书文件放置在`/etc/nginx/ssl/`目录下

2. **数据库备份**: 定期备份数据库

   ```bash
   # 备份数据库
   pg_dump -U yyc3_user yyc3_db > /opt/yyc3/backups/yyc3_db_$(date +%Y%m%d_%H%M%S).sql
   pg_dump -U yyc3_user yyc3_email > /opt/yyc3/backups/yyc3_email_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **日志管理**: 定期清理日志文件

   ```bash
   # 清理日志
   find /opt/yyc3 -name "*.log" -mtime +30 -delete
   ```

4. **安全加固**:
   - 定期更新系统和软件包
   - 配置防火墙，只开放必要端口
   - 使用强密码和密钥认证

5. **性能监控**: 安装监控工具如Prometheus和Grafana监控服务性能

## 故障排查

1. **服务无法启动**
   - 检查日志文件：`pm2 logs <service-name>`
   - 检查端口是否被占用：`netstat -tlnp | grep <port>`
   - 检查环境变量是否正确：`cat .env`

2. **Nginx 502错误**
   - 检查后端服务是否运行：`pm2 status`
   - 检查Nginx配置：`nginx -t`
   - 检查代理配置是否正确

3. **数据库连接错误**
   - 检查数据库服务是否运行：`systemctl status postgresql`
   - 检查数据库用户名和密码：`cat .env`
   - 检查数据库是否存在：`psql -U postgres -l`

保持代码健康，稳步前行！ 🌹
