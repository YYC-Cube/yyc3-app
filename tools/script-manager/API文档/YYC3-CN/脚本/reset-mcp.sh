#!/bin/bash
# YYC3-CN MCP 重置脚本
set -euo pipefail

echo "🔄 YYC3-CN MCP 重置脚本"
echo "========================="

# 1. 停止所有相关进程
echo "🛑 停止所有YYC3相关进程..."
pkill -f "yyc3-cn-mcp-server.js" 2>/dev/null || true
pkill -f "cursor.*mcp" 2>/dev/null || true
sleep 2

# 2. 清理Cursor缓存
echo ""
echo "🧹 清理Cursor缓存..."
find /Users/yanyu/Library/Application\ Support/Cursor -name "*yyc3*" -type f -delete 2>/dev/null || true
find /Users/yanyu/Library/Application\ Support/Cursor -name "*yyc3*" -type d -exec rm -rf {} \; 2>/dev/null || true

# 3. 验证配置文件
echo ""
echo "✅ 验证配置..."
if [ -f "/Users/yanyu/www/API文档/YYC3-CN/配置/yyc3-cn-mcp-server.json" ]; then
    echo "配置文件存在"
    # 确保配置文件格式正确
    python3 -m json.tool "/Users/yanyu/www/API文档/YYC3-CN/配置/yyc3-cn-mcp-server.json" > /dev/null && echo "JSON格式正确" || echo "JSON格式错误!"
else
    echo "❌ 配置文件不存在!"
    exit 1
fi

# 4. 测试服务器
echo ""
echo "🧪 测试MCP服务器..."
cd "/Users/yanyu/www/API文档/YYC3-CN/代码"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"reset-test","version":"1.0.0"}}}' | timeout 5 node yyc3-cn-mcp-server.js

echo ""
echo "🎯 重置完成! 请执行以下步骤："
echo "1. 完全关闭Cursor IDE"
echo "2. 等待10秒"
echo "3. 重启Cursor IDE"
echo "4. 检查MCP连接状态"
echo ""
echo "🔍 如果仍有问题，请查看:"
echo "   tail -f /Users/yanyu/Library/Application\\ Support/Cursor/logs/*/window*/exthost/*/MCP\\ user-yyc3-mcp.log"