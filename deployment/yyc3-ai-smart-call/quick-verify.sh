#!/bin/bash

echo "🔍 YYC3-AI-Smart-Call 项目验证脚本"
echo "=================================="

echo "📍 当前目录: $(pwd)"
echo "📊 项目状态检查:"

# 检查端口状态
echo ""
echo "🌐 端口检查:"
if lsof -i :3004 > /dev/null 2>&1; then
    echo "✅ 端口 3004 正在使用中"
    echo "🔗 应用访问地址: http://localhost:3004"
else
    echo "❌ 端口 3004 未被使用"
fi

# 检查PostgreSQL
echo ""
echo "🐘 数据库检查:"
if brew services list | grep postgresql@14 | grep "started" > /dev/null; then
    echo "✅ PostgreSQL 服务运行中"
else
    echo "❌ PostgreSQL 服务未运行"
fi

# 检查关键文件
echo ""
echo "📁 项目文件检查:"
files_to_check=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.ts"
    ".env.local"
    "app/layout.tsx"
    "app/page.tsx"
    "components/dashboard-client.tsx"
    "components/chat-interface.tsx"
    "prisma/schema.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
    fi
done

echo ""
echo "📦 依赖检查:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules 目录存在"
    echo "📊 依赖包数量: $(find node_modules -maxdepth 1 -type d | wc -l)"
else
    echo "❌ node_modules 目录不存在"
fi

echo ""
echo "🎯 下一步操作建议:"
echo "1. 打开浏览器访问: http://localhost:3004"
echo "2. 测试 AI对话功能"
echo "3. 配置语音设置"
echo "4. 如需身份验证，配置 Clerk 密钥"
echo "5. 如需AI功能，配置 OpenAI API"

echo ""
echo "🎉 YYC3-AI-Smart-Call 项目验证完成！"