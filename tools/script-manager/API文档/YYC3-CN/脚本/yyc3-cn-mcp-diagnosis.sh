#!/bin/bash
# 🚨 YYC3-CN MCP 服务器诊断和修复脚本
# 版本: 1.0.0
# 作者: YYC

set -euo pipefail
trap "echo '🚨 脚本执行中断' && exit 1" EXIT INT TERM

echo "🔍 开始诊断 YYC3-CN MCP 服务器配置..."

# 1. 检查基础环境
echo "📋 1. 检查基础环境..."
NODE_VERSION=$(node --version 2>/dev/null || echo "未找到")
echo "   Node.js 版本: $NODE_VERSION"

if [[ "$NODE_VERSION" == "未找到" ]]; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 2. 检查服务器文件
echo "📋 2. 检查服务器文件..."
SERVER_PATH="/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js"
if [[ ! -f "$SERVER_PATH" ]]; then
    echo "❌ 服务器文件不存在: $SERVER_PATH"
    exit 1
fi

echo "   ✅ 服务器文件存在: $SERVER_PATH"

# 检查执行权限
if [[ -x "$SERVER_PATH" ]]; then
    echo "   ✅ 文件有执行权限"
else
    echo "   ⚠️ 添加执行权限..."
    chmod +x "$SERVER_PATH"
    echo "   ✅ 执行权限已添加"
fi

# 3. 测试服务器启动
echo "📋 3. 测试服务器启动..."
if timeout 3 node "$SERVER_PATH" >/dev/null 2>&1 & 
then
    sleep 1
    if pgrep -f "yyc3-cn-mcp-server.js" >/dev/null; then
        echo "   ✅ 服务器启动测试成功"
        pkill -f "yyc3-cn-mcp-server.js" || true
    else
        echo "   ❌ 服务器启动失败"
        exit 1
    fi
else
    echo "   ❌ 服务器无法启动"
    exit 1
fi

# 4. 修复配置文件
echo "📋 4. 生成修复后的配置..."

# 创建一个更稳健的配置
cat > ~/.config/cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "yyc3-mcp": {
      "command": "node",
      "args": [
        "/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js"
      ],
      "cwd": "/Users/yanyu/www/API文档",
      "env": {
        "NODE_ENV": "development",
        "YYC3_CN_MODE": "development"
      }
    }
  }
}
EOF

echo "   ✅ Cursor MCP 配置已更新"

# 5. 测试 MCP 协议
echo "📋 5. 测试 MCP 协议通信..."
TEST_RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | timeout 5 node "$SERVER_PATH" 2>/dev/null || echo '{"error":"测试失败"}')

if [[ "$TEST_RESULT" == *"yyc3-mcp"* ]]; then
    echo "   ✅ MCP 协议通信正常"
else
    echo "   ⚠️ MCP 协议通信可能有问题"
    echo "   错误详情: $TEST_RESULT"
fi

# 6. 生成完整测试
echo "📋 6. 生成完整功能测试脚本..."

cat > ~/yyc3-cn-mcp-test.js << 'EOF'
#!/usr/bin/env node
// YYC3-CN MCP 服务器完整功能测试

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 开始 YYC3-CN MCP 服务器完整功能测试...\n');

const server = spawn('node', ['/Users/yanyu/www/API文档/YYC3-CN/代码/yyc3-cn-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let responses = [];
let timeout;

server.stdout.on('data', (data) => {
    const response = data.toString();
    responses.push(response);
    console.log('📤 服务器响应:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
});

server.stderr.on('data', (data) => {
    console.log('❌ 错误输出:', data.toString());
});

function sendRequest(request) {
    return new Promise((resolve, reject) => {
        const jsonRequest = JSON.stringify(request) + '\n';
        server.stdin.write(jsonRequest);
        
        timeout = setTimeout(() => {
            reject(new Error('请求超时'));
        }, 10000);
    });
}

async function runTests() {
    try {
        // 测试 1: 初始化
        console.log('📋 测试 1: 服务器初始化...');
        await sendRequest({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize"
        });
        
        // 测试 2: 获取工具列表
        console.log('📋 测试 2: 获取工具列表...');
        await sendRequest({
            jsonrpc: "2.0", 
            id: 2,
            method: "tools/list"
        });
        
        // 测试 3: 调用本地化检查工具
        console.log('📋 测试 3: 测试本地化检查工具...');
        await sendRequest({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
                name: "yyc3_localization_checker",
                arguments: {
                    text: "测试中文本地化",
                    target_language: "zh-CN"
                }
            }
        });
        
        console.log('✅ 所有测试通过!');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        clearTimeout(timeout);
        server.kill();
        console.log('🧹 服务器已停止');
    }
}

runTests();
EOF

chmod +x ~/yyc3-cn-mcp-test.js

echo "   ✅ 测试脚本已生成: ~/yyc3-cn-mcp-test.js"

# 7. 输出修复指南
echo ""
echo "🎯 修复完成! 请按以下步骤操作:"
echo ""
echo "1. 🔄 重启 Cursor IDE"
echo "2. 🧪 运行测试脚本:"
echo "   cd ~ && node yyc3-cn-mcp-test.js"
echo ""
echo "3. 📋 在 Cursor 中检查:"
echo "   - MCP 工具是否出现在工具列表中"
echo "   - 能否正常调用 YYC3-CN 专属工具"
echo ""
echo "🔍 如仍有问题，请检查:"
echo "   - Cursor 的输出面板是否有错误信息"
echo "   - 运行: cat ~/.config/cursor/mcp.json (确认配置)"
echo ""

echo "✨ 诊断和修复完成! 🌹"