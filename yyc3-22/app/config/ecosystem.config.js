/**
 * @file PM2 配置文件
 * @description 统一管理所有 Node.js 服务的 PM2 配置
 * @module ecosystem.config
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 */

module.exports = {
  apps: [
    {
      name: 'api-server',
      script: './server.js',
      cwd: '/Users/yanyu/0379.email/api',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1'
      },
      // 日志配置
      error_file: '/Users/yanyu/0379.email/var/log/api-server-error.log',
      out_file: '/Users/yanyu/0379.email/var/log/api-server-out.log',
      // 重启策略
      max_restarts: 5,
      restart_delay: 3000,
      // 健康检查
      health_check: {
        path: '/api/healthcheck',
        interval: 30000 // 30秒
      }
    },
    {
      name: 'admin-server',
      script: './server.js',
      cwd: '/Users/yanyu/0379.email/admin',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1'
      },
      // 日志配置
      error_file: '/Users/yanyu/0379.email/var/log/admin-server-error.log',
      out_file: '/Users/yanyu/0379.email/var/log/admin-server-out.log',
      // 重启策略
      max_restarts: 5,
      restart_delay: 3000,
      // 健康检查
      health_check: {
        path: '/api/healthcheck',
        interval: 30000 // 30秒
      }
    },
    {
      name: 'llm-server',
      script: './server.js',
      cwd: '/Users/yanyu/0379.email/llm',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOST: '127.0.0.1'
      },
      // 日志配置
      error_file: '/Users/yanyu/0379.email/var/log/llm-server-error.log',
      out_file: '/Users/yanyu/0379.email/var/log/llm-server-out.log',
      // 重启策略
      max_restarts: 5,
      restart_delay: 3000,
      // 健康检查
      health_check: {
        path: '/api/healthcheck',
        interval: 30000 // 30秒
      }
    },
    {
      name: 'mail-server',
      script: './server.js',
      cwd: '/Users/yanyu/0379.email/mail',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOST: '127.0.0.1'
      },
      // 日志配置
      error_file: '/Users/yanyu/0379.email/var/log/mail-server-error.log',
      out_file: '/Users/yanyu/0379.email/var/log/mail-server-out.log',
      // 重启策略
      max_restarts: 5,
      restart_delay: 3000,
      // 健康检查
      health_check: {
        path: '/api/healthcheck',
        interval: 30000 // 30秒
      }
    }
  ]
};