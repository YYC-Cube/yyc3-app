#!/bin/bash

# YYC³企业级邮件平台 - 简化生产环境部署脚本
# 目标服务器: 8.152.195.33
# 域名: mail.0379.email

set -e

# 配置变量
SERVER_IP="8.152.195.33"
SERVER_USER="root"
DOMAIN="mail.0379.email"
APP_NAME="yyc3-mail-platform"
APP_DIR="/opt/${APP_NAME}"
PORT="4000"

echo "🚀 开始简化部署YYC³企业级邮件平台"
echo "📍 目标服务器: ${SERVER_IP}"
echo "🌐 域名: ${DOMAIN}"
echo "📁 部署目录: ${APP_DIR}"

# 检查必要工具
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass未安装，请先安装: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# 创建简化版生产环境配置
echo "📝 创建生产环境配置..."
cat > .env.simple << EOF
NODE_ENV=production
PORT=${PORT}
DOMAIN=${DOMAIN}
API_DOMAIN=api.${DOMAIN}
MAIN_DOMAIN=0379.love

# 数据库配置
DB_TYPE=postgresql
DB_HOST=8.152.195.33
DB_PORT=5432
DB_NAME=yyc3_email
DB_USER=yyc3_email
DB_PASSWORD=yyc3_admin
DB_SSL=true

# Redis配置
REDIS_HOST=8.152.195.33
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=prod_jwt_secret_key_minimum_32_characters_$(date +%s)
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://${DOMAIN},https://0379.love
EOF

echo "✅ 生产环境配置已创建"

# 第一步：检查服务器状态并准备目录
echo "🔧 第一步：准备服务器环境..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "🏗️ 创建应用目录..."
mkdir -p ${APP_DIR}/{logs,uploads,temp}

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node --version || echo "Node.js未安装"
npm --version || echo "npm未安装"

# 检查PostgreSQL状态
echo "🗄️ 检查PostgreSQL状态..."
systemctl status postgresql --no-pager || echo "PostgreSQL未运行"

# 检查Nginx状态
echo "🌐 检查Nginx状态..."
systemctl status nginx --no-pager || echo "Nginx未运行"

echo "✅ 服务器环境检查完成"
EOF

# 第二步：只复制关键文件
echo "📁 第二步：复制关键应用文件..."

# 创建临时目录包含关键文件
mkdir -p temp-deploy
cp production-server.js temp-deploy/
cp .env.simple temp-deploy/.env
cp package.json temp-deploy/
cp README.md temp-deploy/ 2>/dev/null || echo "README.md not found"

# 同步关键文件
sshpass -p 'My151001' scp -r -o StrictHostKeyChecking=no temp-deploy/* ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/

# 清理临时目录
rm -rf temp-deploy

echo "✅ 关键文件复制完成"

# 第三步：配置生产环境
echo "🔧 第三步：配置生产环境..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
cd ${APP_DIR}

# 安装依赖
echo "📦 安装Node.js依赖..."
npm install --production --no-optional

# 设置权限
chmod +x production-server.js

# 创建简单的PM2配置
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'yyc3-mail-platform',
    script: 'production-server.js',
    cwd: '${APP_DIR}',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: ${PORT}
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '512M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2_EOF

echo "✅ 生产环境配置完成"
EOF

# 第四步：配置PostgreSQL数据库
echo "🗄️ 第四步：配置PostgreSQL数据库..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
# 确保PostgreSQL运行
systemctl start postgresql || true
systemctl enable postgresql || true

# 创建数据库和用户
sudo -u postgres psql -c "SELECT 1" || {
    echo "❌ 无法连接到PostgreSQL"
    exit 1
}

sudo -u postgres psql << 'SQL_EOF'
-- 创建用户（如果不存在）
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yyc3_email') THEN
      CREATE ROLE yyc3_email LOGIN PASSWORD 'yyc3_admin';
   END IF;
END
\$\$;

-- 创建数据库（如果不存在）
SELECT 'CREATE DATABASE yyc3_email OWNER yyc3_email'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'yyc3_email')\gexec

-- 授权
GRANT ALL PRIVILEGES ON DATABASE yyc3_email TO yyc3_email;
SQL_EOF

echo "✅ PostgreSQL配置完成"
EOF

# 第五步：启动应用
echo "🚀 第五步：启动应用服务..."

sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
cd ${APP_DIR}

# 安装PM2（如果不存在）
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 停止旧服务
pm2 stop yyc3-mail-platform || true
pm2 delete yyc3-mail-platform || true

# 启动新服务
echo "🔄 启动邮件平台服务..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save
pm2 startup

echo "✅ 应用服务启动完成"
EOF

# 第六步：验证部署
echo "🔍 第六步：验证部署..."

sleep 10

# 健康检查
echo "🧪 执行健康检查..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://${SERVER_IP}:${PORT}/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 部署成功！应用正常运行"
    echo "🌐 访问地址: http://${SERVER_IP}:${PORT}"

    # 显示服务状态
    sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "📈 服务状态:"
pm2 status
echo ""
echo "🔍 端口监听:"
netstat -tlnp | grep -E ":(${PORT}|5432|6379)" || echo "端口监听检查失败"
EOF

else
    echo "❌ 部署失败，HTTP状态码: $HTTP_CODE"
    echo "🔍 检查日志..."
    sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << EOF
echo "📋 应用日志:"
pm2 logs yyc3-mail-platform --lines 10
echo ""
echo "📋 系统日志:"
tail -10 /var/log/messages 2>/dev/null || echo "系统日志不可访问"
EOF
    exit 1
fi

echo "🎉 YYC³企业级邮件平台简化部署完成！"
echo ""
echo "📋 部署信息:"
echo "  🌐 访问地址: http://${SERVER_IP}:${PORT}"
echo "  📍 服务器: ${SERVER_IP}"
echo "  🗄️ 数据库: PostgreSQL (yyc3_email)"
echo "  📊 健康检查: http://${SERVER_IP}:${PORT}/health"
echo ""
echo "📝 后续任务:"
echo "  1. 配置域名DNS解析指向 ${SERVER_IP}"
echo "  2. 设置SSL证书"
echo "  3. 配置Nginx反向代理"
echo "  4. 配置SMTP邮件服务"
echo ""
echo "🔍 管理命令:"
echo "  pm2 status          - 查看服务状态"
echo "  pm2 restart all     - 重启服务"
echo "  pm2 logs            - 查看日志"
echo "  pm2 monit           - 监控面板"