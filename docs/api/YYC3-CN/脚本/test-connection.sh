#!/bin/bash
# YYC3-CN MCP 连接诊断脚本
set -euo pipefail

echo "🔍 YYC3-CN MCP 连接诊断脚本"
echo "================================"

# 1. 检查服务器文件
echo "📁 检查服务器文件..."
if [ -f "/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js" ]; then
    echo "✅ 服务器文件存在: /Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js"
    ls -la "/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js"
else
    echo "❌ 服务器文件不存在!"
    exit 1
fi

# 2. 检查配置文件
echo ""
echo "⚙️ 检查配置文件..."
if [ -f "/Users/yanyu/www/API文档/YYC3-CN/配置/yyc3-cn-mcp-server.json" ]; then
    echo "✅ 配置文件存在"
    cat "/Users/yanyu/www/API文档/YYC3-CN/配置/yyc3-cn-mcp-server.json"
else
    echo "❌ 配置文件不存在!"
    exit 1
fi

# 3. 测试服务器连接
echo ""
echo "🧪 测试MCP服务器连接..."
cd "/Users/yanyu/www/API文档/YYC3-CN/代码"

echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"diagnostic-test","version":"1.0.0"}}}' | timeout 5 node yyc3-cn-mcp-server.js

echo ""
echo "🛠️ 手动测试命令："
echo 'echo '"'"'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"prompts":{},"resources":{}},"clientInfo":{"name":"cursor","version":"1.0.0"}}}'"'"' | timeout 5 node yyc3-cn-mcp-server.js'

echo ""
echo "📋 下一步操作："
echo "1. 重启Cursor IDE"
echo "2. 检查MCP连接状态"
echo "3. 如果仍有问题，检查Cursor日志"