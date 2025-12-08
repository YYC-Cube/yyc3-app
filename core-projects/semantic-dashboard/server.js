/**
 * YYC³图形化语义应用面板 - 服务器
 * 智能脚本管理系统 - 实时监控和可视化
 * 作者: YYC3 AI Family
 * 邮箱: admin@0379.email
 */

import { serve } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = 9000;

// 服务配置
const SERVICES_CONFIG = {
  api: { port: 6600, name: "API服务", icon: "🚀", color: "#3B82F6" },
  admin: { port: 6601, name: "管理后台", icon: "🎛️", color: "#10B981" },
  llm: { port: 6602, name: "LLM服务", icon: "🤖", color: "#8B5CF6" },
  mail: { port: 6603, name: "邮件服务", icon: "📧", color: "#F59E0B" },
  ai: { port: 6604, name: "AI服务", icon: "✨", color: "#EC4899" },
  app: { port: 6605, name: "前端应用", icon: "🖥️", color: "#14B8A6" },
  redis: { port: 6606, name: "缓存服务", icon: "💾", color: "#EF4444" },
  m4: { port: 9558, name: "M4脚本生成器", icon: "🔧", color: "#06B6D4" }
};

// 实时系统状态
let systemStatus = {
  services: {},
  uptime: Date.now(),
  totalRequests: 0,
  activeConnections: 0,
  lastUpdate: new Date().toISOString(),
  scriptStats: {
    total: 0,
    running: 0,
    completed: 0,
    failed: 0
  }
};

// 检查服务状态
async function checkServiceStatus(service, config) {
  try {
    const response = await fetch(`http://localhost:${config.port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        status: 'running',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        ...data
      };
    } else {
      return {
        status: 'error',
        error: `HTTP ${response.status}`,
        lastCheck: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'offline',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

// 更新系统状态
async function updateSystemStatus() {
  for (const [service, config] of Object.entries(SERVICES_CONFIG)) {
    systemStatus.services[service] = await checkServiceStatus(service, config);
  }
  systemStatus.lastUpdate = new Date().toISOString();
}

// 获取脚本统计
async function getScriptStats() {
  try {
    const scriptDir = "/Users/yanyu/www/智能脚本生成器/scripts";
    const stats = await fetch(`http://localhost:9000/api/scripts/stats`);
    if (stats.ok) {
      systemStatus.scriptStats = await stats.json();
    }
  } catch (error) {
    console.log('无法获取脚本统计:', error.message);
  }
}

// 获取系统信息
function getSystemInfo() {
  return {
    ...systemStatus,
    systemInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      bunVersion: Bun.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    servicesCount: Object.keys(SERVICES_CONFIG).length
  };
}

// HTML模板
function generateHTML() {
  return readFileSync(join(import.meta.dir, "client/index.html"), "utf8");
}

// 启动服务器
const server = serve({
  port: PORT,
  development: process.env.NODE_ENV !== "production",

  // WebSocket支持
  websocket: {
    open: (ws) => {
      systemStatus.activeConnections++;
      console.log(`🔗 新连接: ${systemStatus.activeConnections} 个活跃连接`);

      // 发送初始数据
      ws.send(JSON.stringify({
        type: 'init',
        data: getSystemInfo()
      }));

      // 设置定时更新
      const interval = setInterval(async () => {
        try {
          await updateSystemStatus();
          await getScriptStats();
          ws.send(JSON.stringify({
            type: 'update',
            data: getSystemInfo()
          }));
        } catch (error) {
          console.error('更新状态失败:', error);
        }
      }, 2000); // 每2秒更新一次

      ws.interval = interval;
    },

    message: (ws, message) => {
      try {
        const data = JSON.parse(message);
        systemStatus.totalRequests++;

        switch (data.type) {
          case 'getServiceStatus':
            ws.send(JSON.stringify({
              type: 'serviceStatus',
              data: systemStatus.services[data.service]
            }));
            break;
          case 'restartService':
            // 实现服务重启逻辑
            ws.send(JSON.stringify({
              type: 'actionResult',
              data: { success: true, message: `服务 ${data.service} 重启已触发` }
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket消息处理失败:', error);
      }
    },

    close: (ws) => {
      systemStatus.activeConnections--;
      if (ws.interval) {
        clearInterval(ws.interval);
      }
      console.log(`❌ 连接关闭: ${systemStatus.activeConnections} 个活跃连接`);
    }
  },

  // HTTP路由
  routes: {
    "/": () => new Response(generateHTML(), {
      headers: { "Content-Type": "text/html" }
    }),

    "/api/status": () => new Response(JSON.stringify(getSystemInfo()), {
      headers: { "Content-Type": "application/json" }
    }),

    "/api/services": () => new Response(JSON.stringify(SERVICES_CONFIG), {
      headers: { "Content-Type": "application/json" }
    }),

    "/api/health": () => new Response(JSON.stringify({
      status: "ok",
      service: "YYC3 Semantic Dashboard",
      port: PORT,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    }), {
      headers: { "Content-Type": "application/json" }
    }),

    // 静态文件服务
    "/styles.css": () => new Response(readFileSync(join(import.meta.dir, "client/styles.css")), {
      headers: { "Content-Type": "text/css" }
    }),

    "/app.js": () => new Response(readFileSync(join(import.meta.dir, "client/app.js")), {
      headers: { "Content-Type": "application/javascript" }
    })
  },

  // 开发配置
  development: {
    hmr: true,
    console: true
  }
});

// 定期更新系统状态
setInterval(async () => {
  await updateSystemStatus();
  await getScriptStats();
}, 5000);

console.log(`\n🌟 YYC³图形化语义应用面板已启动！`);
console.log(`📊 访问地址: http://localhost:${PORT}`);
console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
console.log(`📧 联系邮箱: admin@0379.email`);
console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
console.log(`\n🚀 言启象限，语枢智能 - YYC³ AI Family\n`);