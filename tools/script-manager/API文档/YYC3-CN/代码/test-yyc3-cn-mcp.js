#!/usr/bin/env node

/**
 * 测试 YYC3 CN.app MCP 服务器
 */

const { spawn } = require('child_process');
const path = require('path');

function testYYC3CNServer() {
  console.log('🇨🇳 测试 YYC3 CN.app MCP 服务器...\n');

  // 启动 YYC3 CN MCP 服务器
  const serverPath = path.join(__dirname, 'yyc3-cn-mcp-server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let requestId = 1;

  server.stderr.on('data', (data) => {
    console.log('📋 服务器日志:', data.toString().trim());
  });

  server.stdout.on('data', (data) => {
    console.log('💬 服务器响应:', data.toString().trim());
  });

  server.on('error', (error) => {
    console.error('❌ 服务器启动错误:', error.message);
  });

  // 等待服务器启动
  setTimeout(() => {
    console.log('\n🔧 测试YYC3 CN工具列表...');

    // 测试工具列表
    const listRequest = {
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/list",
      params: {}
    };

    server.stdin.write(JSON.stringify(listRequest) + '\n');

    // 等待响应
    setTimeout(() => {
      console.log('\n🇨🇳 测试中文本地化检查工具...');

      // 测试中文本地化检查
      const localizationCheckRequest = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "tools/call",
        params: {
          name: "yyc3_localization_checker",
          arguments: {
            textContent: "欢迎使用YYC3 CN智能助手，为您提供专业的中文AI服务",
            checkType: "user_friendly",
            targetAudience: "general_users"
          }
        }
      };

      server.stdin.write(JSON.stringify(localizationCheckRequest) + '\n');

      // 等待响应
      setTimeout(() => {
        console.log('\n🎨 测试界面分析工具...');

        // 测试界面分析
        const uiAnalysisRequest = {
          jsonrpc: "2.0",
          id: requestId++,
          method: "tools/call",
          params: {
            name: "yyc3_ui_analysis",
            arguments: {
              imagePath: "/Users/yanyu/www/API文档/YYC3-CN/yyc3-cn-screenshot.png",
              analysisType: "chinese_localization",
              appVersion: "2.1.0"
            }
          }
        };

        server.stdin.write(JSON.stringify(uiAnalysisRequest) + '\n');

        // 等待响应后关闭
        setTimeout(() => {
          console.log('\n✅ yyc3 CN.app MCP 服务器测试完成！');
          console.log('📊 如果看到正确的响应，说明服务器工作正常');
          console.log('🎯 现在可以在开发工具中使用YYC3 CN专属工具了！');
          server.kill('SIGINT');
        }, 3000);
      }, 2000);
    }, 2000);
  }, 1000);
}

testYYC3CNServer();
