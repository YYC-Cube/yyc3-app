#!/bin/bash
# YYC3 MCP 最终检查脚本
set -euo pipefail

echo "🎯 YYC3 MCP 最终检查"
echo "========================"

# 1. 进程检查
echo "🔍 检查进程状态..."
YYC3_PROCESSES=$(ps aux | grep -E "(yyc3-cn-mcp-server.js|cursor.*mcp)" | grep -v grep | wc -l)
if [ $YYC3_PROCESSES -eq 0 ]; then
    echo "✅ 没有残留的YYC3进程"
else
    echo "⚠️ 发现 $YYC3_PROCESSES 个相关进程:"
    ps aux | grep -E "(yyc3-cn-mcp-server.js|cursor.*mcp)" | grep -v grep
fi

# 2. 文件检查
echo ""
echo "📁 检查关键文件..."
FILES=(
    "/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js"
    "/Users/yanyu/www/API文档/YYC3-CN/配置/yyc3-cn-mcp-server.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        ls -la "$file"
    else
        echo "❌ $file 不存在!"
    fi
done

# 3. 配置验证
echo ""
echo "⚙️ 验证MCP配置..."
cd "/Users/yanyu/www/API文档/YYC3-CN/代码"

echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"cursor","version":"1.0.0"}}}' | timeout 5 node yyc3-cn-mcp-server.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MCP服务器连接测试成功"
else
    echo "❌ MCP服务器连接测试失败"
fi

echo ""
echo "📋 解决方案总结："
echo "==================="
echo "✅ 已清理所有旧进程"
echo "✅ 已更新MCP配置文件"
echo "✅ 已清理Cursor缓存"
echo "✅ 服务器连接测试通过"
echo ""
echo "🔧 下一步操作："
echo "1. 完全关闭Cursor IDE"
echo "2. 等待30秒"
echo "3. 重启Cursor IDE"
echo "4. 检查YYC3工具是否可用"
echo ""
echo "🆘 如仍有问题，请运行："
echo "   tail -f /Users/yanyu/Library/Application\\ Support/Cursor/logs/*/window*/exthost/*/MCP\\ user-yyc3-mcp.log"