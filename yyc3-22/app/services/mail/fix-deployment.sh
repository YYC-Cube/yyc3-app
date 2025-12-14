#!/bin/bash

# YYC³企业级邮件平台 - 部署修复脚本

echo "🔧 修复YYC³邮件平台部署问题..."

SERVER_IP="8.152.195.33"
SERVER_USER="root"

# 修复缺失的依赖
sshpass -p 'My151001' ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /opt/yyc3-mail-platform

echo "📦 安装缺失的依赖..."
npm install dotenv express cors helmet compression express-rate-limit pg winston

echo "🔄 重启服务..."
pm2 stop yyc3-mail-platform || true
pm2 start ecosystem.config.js

echo "⏳ 等待服务启动..."
sleep 5

echo "🧪 测试服务..."
curl -s http://localhost:4000/health || echo "服务测试失败"

echo "📋 检查PM2状态..."
pm2 status

EOF

echo "✅ 修复完成！"