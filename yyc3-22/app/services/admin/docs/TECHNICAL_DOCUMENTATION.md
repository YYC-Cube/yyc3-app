# Admin Console 技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 服务概述

YYC3 Admin Console 是YYC3 AI Family平台的管理后台服务，提供系统监控、用户权限管理、配置参数管理等核心管理功能。

### 基本信息

- **服务名称**: YYC3 Admin Console
- **端口**: 6601 (生产) / 3001 (开发)
- **技术栈**: Node.js | Express.js | JWT | Swagger
- **主文件**: `server.js`
- **API文档**: `swagger.json`

## 🏗️ 核心功能

### 主要特性

- **系统监控仪表板**: 实时系统状态监控
- **用户权限管理**: 角色管理和访问控制
- **配置参数管理**: 动态配置管理
- **日志查看与分析**: 系统日志查看
- **性能监控**: 服务性能指标监控
- **数据统计报表**: 业务数据统计

### 管理功能模块

| 模块 | 功能描述 | 权限级别 |
|------|----------|----------|
| **仪表板** | 系统概览、实时监控 | Admin/User |
| **用户管理** | 用户增删改查、角色分配 | Admin |
| **权限管理** | 角色定义、权限配置 | Super Admin |
| **系统配置** | 参数配置、环境管理 | Admin |
| **日志管理** | 日志查看、搜索分析 | Admin |
| **监控中心** | 性能监控、告警管理 | Admin |
| **数据统计** | 业务数据、报表生成 | Admin/User |

### 关键端点

| 端点 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/health` | GET | 服务健康检查 | ❌ |
| `/` | GET | 管理后台首页 | ✅ |
| `/api/status` | GET | 系统状态总览 | ✅ |
| `/api/users` | GET/POST | 用户管理 | Admin |
| `/api/users/:id` | PUT/DELETE | 用户操作 | Admin |
| `/api/roles` | GET/POST | 角色管理 | Admin |
| `/api/config` | GET/PUT | 配置管理 | Admin |
| `/api/logs` | GET | 日志查看 | Admin |
| `/api/metrics` | GET | 性能指标 | Admin |

## 📁 文件结构

```
admin/
├── 📄 server.js              # 主服务文件
├── 📄 package.json           # 依赖配置
├── 📄 .env.example           # 环境变量示例
├── 📄 swagger.json           # API文档配置
├── 📁 logs/                  # 日志目录
└── 📄 server.js.backup       # 备份文件
```

## 🔧 配置说明

### 环境变量

```bash
# 服务端口
ADMIN_PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yyc3_admin
DB_USER=root
DB_PASSWORD=

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-admin-secret-key
JWT_EXPIRES_IN=24h

# 服务配置
API_SERVICE_URL=http://localhost:3000
LLM_SERVICE_URL=http://localhost:3002
MAIL_SERVICE_URL=http://localhost:3003

# 管理员配置
ADMIN_EMAIL=admin@0379.email
ADMIN_PASSWORD=admin_password_hash

# 安全配置
SESSION_SECRET=your-session-secret
BCRYPT_ROUNDS=12

# 监控配置
METRICS_ENABLED=true
LOG_LEVEL=info
```

## 🔌 API接口文档

### 认证接口

#### 管理员登录

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@0379.email",
  "password": "admin_password"
}

Response:
{
  "success": true,
  "data": {
    "token": "admin_jwt_token_here",
    "admin": {
      "id": 1,
      "email": "admin@0379.email",
      "role": "super_admin",
      "last_login": "2025-12-08T05:30:00.000Z"
    },
    "permissions": [
      "user:read", "user:write", "config:read", "config:write"
    ]
  }
}
```

### 用户管理接口

#### 获取用户列表

```http
GET /api/users?page=1&limit=10&role=user
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@0379.email",
        "role": "user",
        "status": "active",
        "created_at": "2025-12-08T06:00:00.000Z",
        "last_login": "2025-12-08T05:30:00.000Z",
        "login_count": 15
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### 创建用户

```http
POST /api/users
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "email": "newuser@0379.email",
  "password": "secure_password",
  "role": "user",
  "status": "active"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "newuser@0379.email",
      "role": "user",
      "status": "active",
      "created_at": "2025-12-08T06:00:00.000Z"
    }
  }
}
```

### 系统监控接口

#### 系统状态总览

```http
GET /api/status
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "system": "YYC3 AI Family",
    "status": "operational",
    "uptime": 86400,
    "version": "3.0.0",
    "services": {
      "api": {
        "port": 6600,
        "status": "running",
        "uptime": 86000,
        "requests_per_minute": 45
      },
      "admin": {
        "port": 6601,
        "status": "running",
        "uptime": 86400,
        "active_sessions": 5
      },
      "llm": {
        "port": 6602,
        "status": "running",
        "uptime": 85000,
        "active_conversations": 12
      },
      "mail": {
        "port": 6603,
        "status": "running",
        "uptime": 85500,
        "pending_emails": 3
      }
    },
    "resources": {
      "cpu_usage": 25.5,
      "memory_usage": 68.2,
      "disk_usage": 45.8,
      "network_io": {
        "bytes_in": 1024576,
        "bytes_out": 2048576
      }
    }
  }
}
```

## 🎛️ 管理后台界面

### 仪表板设计

```javascript
// 仪表板数据聚合
async function getDashboardData() {
  const [
    userStats,
    serviceMetrics,
    systemResources,
    recentLogs
  ] = await Promise.all([
    getUserStatistics(),
    getServiceMetrics(),
    getSystemResources(),
    getRecentLogs()
  ]);

  return {
    overview: {
      total_users: userStats.total,
      active_users: userStats.active,
      total_services: 4,
      healthy_services: serviceMetrics.healthy
    },
    charts: {
      user_growth: userStats.growth,
      service_performance: serviceMetrics.performance,
      resource_usage: systemResources.usage
    },
    alerts: recentLogs.filter(log => log.level === 'ERROR').slice(0, 5),
    recent_activity: recentLogs.slice(0, 10)
  };
}
```

### 用户界面组件

```html
<!-- 管理后台首页模板 -->
<div class="admin-dashboard">
  <header class="dashboard-header">
    <h1>YYC3 管理后台</h1>
    <div class="user-info">
      <span>管理员: {{admin_email}}</span>
      <button onclick="logout()">退出登录</button>
    </div>
  </header>

  <nav class="dashboard-nav">
    <ul>
      <li><a href="/dashboard" class="active">仪表板</a></li>
      <li><a href="/users">用户管理</a></li>
      <li><a href="/config">系统配置</a></li>
      <li><a href="/logs">日志管理</a></li>
      <li><a href="/monitor">监控中心</a></li>
    </ul>
  </nav>

  <main class="dashboard-content">
    <section class="overview-cards">
      <div class="card">
        <h3>总用户数</h3>
        <div class="metric">{{total_users}}</div>
      </div>
      <div class="card">
        <h3>在线用户</h3>
        <div class="metric">{{active_users}}</div>
      </div>
      <div class="card">
        <h3>服务状态</h3>
        <div class="metric healthy">{{healthy_services}}/{{total_services}}</div>
      </div>
      <div class="card">
        <h3>系统运行时间</h3>
        <div class="metric">{{uptime}}天</div>
      </div>
    </section>

    <section class="charts-section">
      <div class="chart-container">
        <h3>用户增长趋势</h3>
        <canvas id="userGrowthChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>服务性能监控</h3>
        <canvas id="performanceChart"></canvas>
      </div>
    </section>
  </main>
</div>
```

## 🔐 权限管理系统

### 基于角色的访问控制 (RBAC)

```javascript
const RBAC = {
  roles: {
    super_admin: ['*'], // 所有权限
    admin: [
      'user:read', 'user:write',
      'config:read', 'config:write',
      'log:read', 'metrics:read'
    ],
    moderator: [
      'user:read',
      'log:read'
    ],
    viewer: [
      'metrics:read'
    ]
  },

  checkPermission(userRole, permission) {
    const userPermissions = this.roles[userRole] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  },

  middleware: (requiredPermission) => {
    return (req, res, next) => {
      const userRole = req.user?.role;

      if (!userRole || !RBAC.checkPermission(userRole, requiredPermission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermission
        });
      }

      next();
    };
  }
};
```

### 权限中间件使用

```javascript
// 路由保护示例
router.get('/api/users',
  authenticateToken,
  RBAC.middleware('user:read'),
  getUsers
);

router.post('/api/users',
  authenticateToken,
  RBAC.middleware('user:write'),
  createUser
);

router.put('/api/config',
  authenticateToken,
  RBAC.middleware('config:write'),
  updateConfig
);
```

## 📊 监控与日志

### 性能指标收集

```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        perMinute: 0,
        errors: 0
      },
      users: {
        total: 0,
        active: 0,
        newToday: 0
      },
      system: {
        uptime: 0,
        memory: 0,
        cpu: 0
      }
    };
  }

  incrementRequests() {
    this.metrics.requests.total++;
    this.metrics.requests.perMinute++;
  }

  updateSystemMetrics() {
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.memory = process.memoryUsage();
    // CPU使用率计算
    this.metrics.system.cpu = process.cpuUsage();
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 日志管理

```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/admin-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/admin-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

function logAdminAction(action, userId, details = {}) {
  logger.info('Admin action', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown'
  });
}
```

## 🚀 部署指南

### 开发环境启动

```bash
cd /Users/yanyu/www/yyc3-22/app/admin
npm install
cp .env.example .env
# 编辑 .env 文件配置
npm start
```

### 生产环境部署

```bash
# 使用 PM2 管理进程
pm2 start server.js --name "yyc3-admin-console" --port 6601

# 或使用 Docker
docker build -t yyc3-admin-console .
docker run -p 6601:6601 yyc3-admin-console
```

## 🧪 测试

### 单元测试示例

```javascript
const request = require('supertest');
const app = require('./server');

describe('Admin Console', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/status with admin auth', async () => {
    const response = await request(app)
      .get('/api/status')
      .set('Authorization', 'Bearer valid_admin_token')
      .expect(200);

    expect(response.body.data).toHaveProperty('services');
  });

  test('POST /api/users without permission should return 403', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        password: 'password'
      })
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Insufficient permissions');
  });
});
```

## 🔗 相关链接

- **主服务文档**: `[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)`
- **API参考文档**: `[../API_REFERENCE.md](../API_REFERENCE.md)`
- **API服务**: `../api/`
- **LLM服务**: `../llm/`
- **邮件服务**: `../mail/`
- **共享模块**: `../shared/`

## 📞 技术支持

- **问题反馈**: <dev@0379.email>
- **服务监控**: `https://monitor.0379.email`
- **在线文档**: `https://docs.0379.email`

---

<div align="center">

**[⬆️ 回到顶部](#admin-console-技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🎛️

</div>
