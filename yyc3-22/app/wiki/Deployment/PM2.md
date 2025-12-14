# PM2 部署指南

## 概述

PM2 (Process Manager 2) 是一个 Node.js 应用程序的进程管理器，它提供了应用程序的负载均衡、自动重启、日志管理和部署功能。本指南将详细介绍如何使用 PM2 部署和管理邮件系统的各个服务。

## 环境要求

- Node.js 14.x 或更高版本
- npm 或 yarn
- 各服务所需的依赖服务（MongoDB, Redis, RabbitMQ等）

## 安装 PM2

在部署服务器上全局安装 PM2：

```bash
npm install -g pm2
```

或使用 yarn：

```bash
yarn global add pm2
```

## 部署准备

### 代码获取

从版本控制系统获取最新代码：

```bash
git clone https://your-repository-url/email-system.git
cd email-system
```

### 依赖安装

为每个服务安装依赖：

```bash
# API Server
cd api-server
npm install

# Admin Server
cd ../admin-server
npm install

# Mail Server
cd ../mail-server
npm install

# LLM Server（如果使用Python版本）
cd ../llm-server
pip install -r requirements.txt
```

### 配置文件

确保每个服务的配置文件已正确设置，特别是数据库连接、API密钥和其他敏感信息。

## 使用 PM2 启动服务

### 单个服务启动

可以使用 PM2 单独启动每个服务：

```bash
# 启动 API Server
cd api-server
pm run build  # 构建项目（如果需要）
pm2 start dist/server.js --name "api-server"

# 启动 Admin Server
cd ../admin-server
npm run build
pm2 start dist/server.js --name "admin-server"

# 启动 Mail Server
cd ../mail-server
npm run build
pm2 start dist/server.js --name "mail-server"
```

### 多服务配置文件启动

创建 PM2 配置文件 `ecosystem.config.js`，用于管理所有服务：

```javascript
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'api-server/dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/api-server-error.log',
      out_file: '../logs/api-server-out.log'
    },
    {
      name: 'admin-server',
      script: 'admin-server/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/admin-server-error.log',
      out_file: '../logs/admin-server-out.log'
    },
    {
      name: 'mail-server',
      script: 'mail-server/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/mail-server-error.log',
      out_file: '../logs/mail-server-out.log'
    },
    {
      name: 'llm-server',
      script: 'python',
      args: 'llm-server/main.py',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        PORT: 3002
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/llm-server-error.log',
      out_file: '../logs/llm-server-out.log'
    }
  ]
};
```

使用配置文件启动所有服务：

```bash
pm2 start ecosystem.config.js
```

## PM2 常用命令

### 进程管理

```bash
# 查看所有进程
pm2 list

# 查看进程详情
pm2 show <app_name>

# 重启应用
pm2 restart <app_name>

# 停止应用
pm2 stop <app_name>

# 停止所有应用
pm2 stop all

# 删除应用
pm2 delete <app_name>

# 删除所有应用
pm2 delete all
```

### 日志管理

```bash
# 查看应用日志
pm2 logs <app_name>

# 查看实时日志
pm2 logs <app_name> --lines 100

# 清空日志
pm2 flush
```

### 监控和状态

```bash
# 监控应用资源使用情况
pm2 monit

# 查看应用状态
pm2 status
```

### 开机自启

设置 PM2 开机自启动：

```bash
# 生成启动脚本
pm2 startup

# 保存当前进程列表
pm2 save
```

根据输出提示执行相应的命令以完成自启动配置。

## 负载均衡

PM2 的集群模式提供了内置的负载均衡功能。在 `ecosystem.config.js` 中，通过设置 `instances: 'max'` 可以让 PM2 根据服务器的 CPU 核心数自动创建相应数量的实例。

## 性能优化建议

1. **合理设置实例数**：根据服务器 CPU 核心数和内存大小调整实例数量
2. **启用压缩**：在应用程序中启用响应压缩
3. **设置适当的超时**：避免长时间运行的请求占用资源
4. **监控内存使用**：定期检查内存使用情况，避免内存泄漏
5. **日志轮转**：配置日志轮转，避免日志文件过大

## 部署更新流程

1. 获取最新代码

   ```bash
   git pull
   ```

2. 安装新依赖（如果有）

   ```bash
   npm install
   ```

3. 重新构建应用

   ```bash
   npm run build
   ```

4. 平滑重启应用

   ```bash
   pm2 reload ecosystem.config.js
   ```

## 常见问题排查

1. **服务启动失败**
   - 检查配置文件
   - 检查端口是否被占用
   - 检查依赖服务是否正常运行

2. **内存占用过高**
   - 减少实例数量
   - 检查是否存在内存泄漏
   - 增加服务器内存

3. **响应缓慢**
   - 增加实例数量
   - 检查数据库连接和查询性能
   - 检查是否存在长时间运行的操作

4. **日志文件过大**
   - 配置日志轮转
   - 减少日志级别
   - 定期清理日志文件
