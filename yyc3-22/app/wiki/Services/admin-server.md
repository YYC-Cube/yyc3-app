# Admin Server 文档

## 服务概述

Admin Server 是系统的管理后台服务，提供系统配置、用户管理、权限控制、系统监控等管理功能。管理员可以通过该服务对整个邮件系统进行全面管理。

## 技术栈

- **前端**: React + Ant Design
- **后端**: Node.js + Express
- **数据库**: MongoDB
- **认证**: JWT + RBAC

## 功能特性

### 用户管理

- 用户创建、编辑、删除
- 密码重置
- 用户角色分配
- 用户状态管理

### 系统配置

- 系统参数配置
- 邮件模板管理
- SMTP服务器配置
- 存储策略配置

### 监控和统计

- 系统运行状态监控
- 邮件流量统计
- 用户活跃度统计
- 性能指标监控

### 安全管理

- 访问日志记录
- 安全审计
- 异常行为检测

## 安装和配置

### 环境要求

- Node.js 14.x 或更高版本
- MongoDB 4.x 或更高版本
- 前端构建工具: npm/yarn

### 后端配置

配置文件位于 `config/config.js`：

```javascript
module.exports = {
  port: 3001,
  mongo: {
    url: 'mongodb://localhost:27017/email-system',
    options: {}
  },
  jwt: {
    secret: 'admin-secret-key',
    expiresIn: '8h'
  },
  roles: {
    SUPER_ADMIN: ['*'],
    ADMIN: ['user:read', 'user:update', 'config:read', 'config:update'],
    OPERATOR: ['user:read', 'config:read']
  }
};
```

### 前端配置

配置文件位于 `frontend/.env`：

```dotenv
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_TITLE=邮件系统管理后台
```

## 管理界面

### 访问方式

启动服务后，通过浏览器访问 `http://localhost:3001` 进入管理登录页面。

### 主要页面

#### 仪表盘

显示系统概览、关键指标和最近活动。

#### 用户管理

用户列表、搜索、筛选和批量操作。

#### 系统配置

各项系统参数的配置界面。

#### 监控中心

实时监控系统运行状态和各项指标。

#### 日志管理

系统日志、访问日志和错误日志的查看和导出。

## API 接口

### 管理员认证

#### POST /api/admin/auth/login

管理员登录

**请求体**:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### POST /api/admin/auth/logout

管理员登出

### 用户管理 API

#### GET /api/admin/users

获取用户列表

#### POST /api/admin/users

创建新用户

#### PUT /api/admin/users/:id

更新用户信息

#### DELETE /api/admin/users/:id

删除用户

### 配置管理 API

#### GET /api/admin/config

获取系统配置

#### PUT /api/admin/config

更新系统配置

## 部署

请参考 [PM2 部署](../Deployment/PM2.md) 或 [Docker 部署](../Deployment/Docker.md) 文档。

## 安全注意事项

- 确保管理后台只允许内网访问
- 定期更新管理员密码
- 启用双因素认证
- 限制登录尝试次数
- 记录所有管理操作日志
