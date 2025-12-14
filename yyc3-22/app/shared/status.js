/**
 * @file 共享状态接口模块
 * @description 提供标准的 status、version、metrics 和 healthcheck 接口
 * @module shared/status
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 */

const express = require('express');
const os = require('os');
const router = express.Router();

const startTime = Date.now();

/**
 * @description 健康检查接口 - 用于 Nginx/Ingress 与监控系统
 */
router.get('/healthcheck', (req, res) => {
  res.json({ 
    healthy: true, 
    service: req.hostname.split('.')[0], 
    timestamp: Date.now(), 
    hostname: os.hostname() 
  });
});

/**
 * @description 服务状态接口
 */
router.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

/**
 * @description 版本信息接口
 */
router.get('/version', (req, res) => {
  res.json({ 
    version: '1.0.0', 
    name: req.hostname 
  });
});

/**
 * @description 性能指标接口
 */
router.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
  res.json({ 
    uptime, 
    memory: parseFloat(memory),
    cpuUsage: process.cpuUsage()
  });
});

module.exports = router;