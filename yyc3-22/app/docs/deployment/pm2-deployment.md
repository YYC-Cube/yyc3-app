# PM2 部署方式

## 配置文件

- **配置路径**：/Users/yanyu/www/yyc3-22/app/ecosystem.config.js

## 配置示例

```javascript
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: '/Users/yanyu/www/yyc3-22/app/services/api/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'cluster',
      args: '--color',
      port: '3000',
      interpreter: 'node',
      interpreter_args: '--max_old_space_size=4096',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/Users/yanyu/www/yyc3-22/app/logs/api-server-err.log',
      out_file: '/Users/yanyu/www/yyc3-22/app/logs/api-server-out.log',
      pid_file: '/Users/yanyu/www/yyc3-22/app/logs/api-server-pid.pid',
      listen_timeout: 50000,
      kill_timeout: 5000,
    },
    {
      name: 'admin-server',
      script: '/Users/yanyu/www/yyc3-22/app/services/admin/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'cluster',
      args: '--color',
      port: '3001',
      interpreter: 'node',
      interpreter_args: '--max_old_space_size=4096',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/Users/yanyu/www/yyc3-22/app/logs/admin-server-err.log',
      out_file: '/Users/yanyu/www/yyc3-22/app/logs/admin-server-out.log',
      pid_file: '/Users/yanyu/www/yyc3-22/app/logs/admin-server-pid.pid',
      listen_timeout: 50000,
      kill_timeout: 5000,
    },
    {
      name: 'llm-server',
      script: '/Users/yanyu/www/yyc3-22/app/services/llm/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'cluster',
      args: '--color',
      port: '3002',
      interpreter: 'node',
      interpreter_args: '--max_old_space_size=4096',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/Users/yanyu/www/yyc3-22/app/logs/llm-server-err.log',
      out_file: '/Users/yanyu/www/yyc3-22/app/logs/llm-server-out.log',
      pid_file: '/Users/yanyu/www/yyc3-22/app/logs/llm-server-pid.pid',
      listen_timeout: 50000,
      kill_timeout: 5000,
    },
    {
      name: 'mail-server',
      script: '/Users/yanyu/www/yyc3-22/app/services/mail/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_mode: 'cluster',
      args: '--color',
      port: '3003',
      interpreter: 'node',
      interpreter_args: '--max_old_space_size=4096',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/Users/yanyu/www/yyc3-22/app/logs/mail-server-err.log',
      out_file: '/Users/yanyu/www/yyc3-22/app/logs/mail-server-out.log',
      pid_file: '/Users/yanyu/www/yyc3-22/app/logs/mail-server-pid.pid',
      listen_timeout: 50000,
      kill_timeout: 5000,
    },
  ],
};
```

## 常用命令

### 启动所有服务

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### 查看状态

```bash
pm2 status
```

### 重启服务

```bash
# 重启所有服务
pm2 restart all

# 重启特定服务
pm2 restart api-server
```

### 停止服务

```bash
# 停止所有服务
pm2 stop all

# 停止特定服务
pm2 stop api-server
```

### 开机自启

```bash
pm2 startup
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u $(whoami) --hp $(pwd)
pm2 save
```

## 日志管理

```bash
# 查看日志
pm2 logs

# 查看特定服务日志
pm2 logs api-server

# 清空日志
pm2 flush
```
