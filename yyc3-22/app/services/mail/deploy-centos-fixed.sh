#!/bin/bash

# YYC³企业级邮件平台 - CentOS生产环境部署脚本 (修复版)
# 目标服务器: 8.152.195.33 (Alibaba Cloud ECS)
# 域名: mail.0379.email

set -e

# 配置变量
SERVER_IP="8.152.195.33"
SERVER_USER="root"
DOMAIN="mail.0379.email"
APP_NAME="yyc3-mail-platform"
APP_DIR="/opt/${APP_NAME}"
PORT="4000"

echo "🚀 开始部署YYC³企业级邮件平台到CentOS生产环境 (修复版)"
echo "📍 目标服务器: ${SERVER_IP}"
echo "🌐 域名: ${DOMAIN}"
echo "📁 部署目录: ${APP_DIR}"

# 检查必要工具
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass未安装，请先安装: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# 创建生产环境配置
echo "📝 创建生产环境配置..."
cat > .env.production << EOF
# YYC³ 企业级邮件平台 - 生产环境配置
NODE_ENV=production
PORT=${PORT}
DOMAIN=${DOMAIN}
API_DOMAIN=api.${DOMAIN}
MAIN_DOMAIN=0379.love

# 服务配置
SERVICE_NAME=YYC³ Enterprise Email Platform
VERSION=2.0.0
ENVIRONMENT=production

# 数据库配置 (ECS服务器)
DB_TYPE=postgresql
DB_HOST=8.152.195.33
DB_PORT=5432
DB_NAME=yyc3_email
DB_USER=yyc3_email
DB_PASSWORD=yyc3_admin
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_TIMEOUT=30000

# Redis缓存 (ECS服务器)
REDIS_HOST=8.152.195.33
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 邮件服务配置
SMTP_HOST=smtp.${DOMAIN}
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@${DOMAIN}
SMTP_PASSWORD=your_smtp_password_here
SMTP_FROM=noreply@${DOMAIN}
SMTP_FROM_NAME=YYC³ Email Platform

# 安全配置
JWT_SECRET=prod_jwt_secret_key_minimum_32_characters_$(date +%s)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12

# API安全
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS配置
CORS_ORIGIN=https://${DOMAIN},https://0379.love
CORS_CREDENTIALS=true

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30

# 监控配置
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# 邮件队列配置
EMAIL_CONCURRENCY=10
EMAIL_MAX_RETRY=5

# 企业功能配置
USER_MAX_EMAILS_PER_DAY=1000
EMAIL_TEMPLATES_ENABLED=true
SEARCH_ENABLED=true
EOF

echo "✅ 生产环境配置已创建"

# 部署到服务器
echo "🔄 开始部署到CentOS服务器..."

# 创建服务器目录结构
sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'
echo "🏗️ 创建应用目录结构..."
mkdir -p /opt/yyc3-mail-platform/{logs,uploads,temp,backups}
mkdir -p /opt/yyc3-mail-platform/config

echo "✅ 目录结构创建完成"
EOF

echo "📁 同步应用文件到服务器..."

# 先清理旧文件，然后同步新文件
sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
# 清理旧文件
rm -rf ${APP_DIR}/*
EOF

# 复制文件
sshpass -p 'My151001' scp -r -o StrictHostKeyChecking=no . ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/

# 配置生产环境服务
sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "🔧 配置生产环境服务..."

cd ${APP_DIR}

# 检查Node.js版本
echo "📋 检查现有Node.js版本..."
node --version
npm --version

# 如果Node.js版本 >= 18，则使用现有版本
NODE_VERSION=\$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "\$NODE_VERSION" -ge 18 ]; then
    echo "✅ Node.js版本 \$NODE_VERSION 满足要求，使用现有版本"
else
    echo "❌ Node.js版本过低，需要升级"
    exit 1
fi

# 安装Node.js依赖
echo "📦 安装Node.js依赖..."
npm install --production

# 复制生产环境配置
cp .env.production .env

# 确保日志目录存在
mkdir -p logs

# 设置文件权限
chmod +x *.js
chmod -R 755 .

# 创建PM2配置文件
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'yyc3-mail-platform',
    script: 'production-server.js',
    cwd: '/opt/yyc3-mail-platform',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2_EOF

echo "✅ 生产环境配置完成"
EOF

# 检查并启动PostgreSQL服务
echo "🗄️ 配置PostgreSQL数据库..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
# 检查PostgreSQL服务状态
if ! systemctl is-active --quiet postgresql; then
    echo "🔄 启动PostgreSQL服务..."
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "✅ PostgreSQL服务已运行"
fi

# 创建数据库和用户
sudo -u postgres psql << 'SQL_EOF'
-- 创建用户（如果不存在）
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yyc3_email') THEN
      CREATE ROLE yyc3_email LOGIN PASSWORD 'yyc3_admin';
   END IF;
END
\$\$;

-- 创建数据库
CREATE DATABASE yyc3_email OWNER yyc3_email;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE yyc3_email TO yyc3_email;
SQL_EOF

echo "✅ PostgreSQL数据库配置完成"

# 检查并启动Redis服务
if ! systemctl is-active --quiet redis; then
    echo "🔄 启动Redis服务..."
    systemctl start redis
    systemctl enable redis
else
    echo "✅ Redis服务已运行"
fi
EOF

# 设置Nginx配置
echo "🌐 配置Nginx反向代理..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
# 检查Nginx是否安装
if ! command -v nginx &> /dev/null; then
    echo "📦 安装Nginx..."
    dnf install -y nginx
    systemctl enable nginx
fi

# 创建Nginx配置
cat > /etc/nginx/conf.d/${DOMAIN}.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name ${DOMAIN} api.${DOMAIN};

    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} api.${DOMAIN};

    # SSL证书配置 (将使用Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API代理
    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_EOF

# 测试Nginx配置
nginx -t

echo "✅ Nginx配置完成"
EOF

# 安装PM2并设置SSL证书
echo "🔄 安装PM2和配置SSL证书..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
# 安装PM2 (如果不存在)
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
else
    echo "✅ PM2已安装"
fi

# 停止占用80端口的服务
systemctl stop nginx || true

# 检查是否安装了certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 安装Certbot..."
    dnf install -y certbot python3-certbot-nginx
fi

# 获取SSL证书
certbot --nginx -d ${DOMAIN} -d api.${DOMAIN} --non-interactive --agree-tos --email admin@0379.love --redirect || {
    echo "⚠️ SSL证书获取失败，创建临时证书"
    mkdir -p /etc/letsencrypt/live/${DOMAIN}
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
        -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \\
        -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \\
        -subj "/C=CN/ST=Beijing/L=Beijing/O=YYC3/CN=${DOMAIN}"
}

# 重启Nginx
systemctl restart nginx

# 设置SSL自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -

echo "✅ SSL证书配置完成"
EOF

# 启动应用服务
echo "🚀 启动应用服务..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
cd ${APP_DIR}

# 使用PM2启动应用
echo "🔄 启动PM2服务..."
pm2 kill || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ 应用服务启动完成"
EOF

# 验证部署
echo "🔍 验证部署状态..."

sleep 15

# 健康检查
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN}/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功！应用正常运行"
    echo "🌐 访问地址: https://${DOMAIN}"
    echo "📊 API文档: https://api.${DOMAIN}"

    # 显示服务状态
    sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "📈 服务状态:"
pm2 status
echo ""
echo "🔍 Nginx状态:"
systemctl status nginx --no-pager -l
echo ""
echo "📊 端口监听:"
netstat -tlnp | grep -E ":(80|443|4000|5432|6379)"
EOF

else
    echo "❌ 部署失败，HTTP状态码: $HTTP_CODE"
    echo "🔍 检查日志..."
    sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "📋 PM2日志:"
pm2 logs yyc3-mail-platform --lines 20
echo ""
echo "📋 Nginx日志:"
tail -20 /var/log/nginx/error.log || echo "Nginx日志文件不存在"
EOF
    exit 1
fi

echo "🎉 YYC³企业级邮件平台生产环境部署完成！"
echo ""
echo "📋 部署信息:"
echo "  🌐 域名: https://${DOMAIN}"
echo "  🔧 API: https://api.${DOMAIN}"
echo "  📊 健康检查: https://api.${DOMAIN}/health"
echo "  📍 服务器: ${SERVER_IP}"
echo "  🗄️ 数据库: PostgreSQL (yyc3_email)"
echo "  🔄 缓存: Redis"
echo ""
echo "🔑 管理员账户:"
echo "  📧 邮箱: admin@0379.love"
echo "  🔑 密码: admin123 (请立即修改)"
echo ""
echo "📝 下一步:"
echo "  1. 修改管理员密码"
echo "  2. 配置SMTP邮件服务"
echo "  3. 设置域名DNS解析"
echo "  4. 配置监控和备份"
echo ""
echo "🔍 管理命令:"
echo "  pm2 status          - 查看服务状态"
echo "  pm2 restart all     - 重启所有服务"
echo "  pm2 logs            - 查看日志"
echo "  nginx -t            - 测试Nginx配置"
echo "  systemctl reload nginx - 重载Nginx"