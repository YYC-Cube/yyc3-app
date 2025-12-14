/**
 * @file Redis服务模块
 * @description 提供Redis缓存服务和连接管理
 * @module redis-service
 * @author YYC
 * @version 2.0.0
 * @created 2024-01-15
 * @updated 2024-01-15
 */

const { createClient } = require('redis');
const winston = require('winston');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/redis/service.log' })
  ]
});

// 环境变量配置
const config = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'redis_yyc3',
  useTls: String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true',
  namespace: process.env.REDIS_NAMESPACE || 'yyc3',
  timeoutMs: parseInt(process.env.REDIS_TIMEOUT_MS || '5000', 10),
  defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10) // 默认缓存时间1小时
};

const url = `redis://${config.host}:${config.port}`;

// 创建Redis客户端
const client = createClient({
  url,
  password: config.password,
  name: config.namespace,
  socket: {
    tls: config.useTls,
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3000);
      logger.info(`[Redis] 尝试重连 (${retries})... 延迟 ${delay}ms`);
      return delay;
    },
    connectTimeout: config.timeoutMs,
    keepAlive: 30000
  },
  disableOfflineQueue: false
});

// 连接事件处理
client.on('error', (err) => {
  logger.error('[Redis] 客户端错误:', { error: err.message, stack: err.stack });
});

client.on('connect', () => {
  logger.info('[Redis] 正在连接...');
});

client.on('ready', () => {
  logger.info('[Redis] 连接就绪');
});

client.on('end', () => {
  logger.info('[Redis] 连接已关闭');
});

client.on('reconnecting', (info) => {
  logger.info('[Redis] 正在重连...', info);
});

client.on('warning', (warning) => {
  logger.warn('[Redis] 警告:', warning);
});

// 初始化Redis连接
async function init() {
  try {
    if (!client.isOpen) {
      await client.connect();
      logger.info('[Redis] 连接初始化成功');
    }
  } catch (error) {
    logger.error('[Redis] 连接初始化失败:', { error: error.message });
    throw error;
  }
}

// 健康检查
async function ping() {
  try {
    if (!client.isOpen) {
      await init();
    }
    return await client.ping();
  } catch (error) {
    logger.error('[Redis] Ping失败:', { error: error.message });
    throw error;
  }
}

// 缓存操作 - 设置键值对
async function set(key, value, ttl = config.defaultTtl) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKey = `${config.namespace}:${key}`;
    const result = await client.set(fullKey, JSON.stringify(value), { 
      EX: ttl 
    });
    
    logger.debug('[Redis] 设置缓存成功:', { key: fullKey, ttl });
    return result;
  } catch (error) {
    logger.error('[Redis] 设置缓存失败:', { key, error: error.message });
    throw error;
  }
}

// 缓存操作 - 获取键值对
async function get(key) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKey = `${config.namespace}:${key}`;
    const value = await client.get(fullKey);
    
    if (value) {
      logger.debug('[Redis] 获取缓存成功:', { key: fullKey });
      return JSON.parse(value);
    }
    
    logger.debug('[Redis] 缓存未命中:', { key: fullKey });
    return null;
  } catch (error) {
    logger.error('[Redis] 获取缓存失败:', { key, error: error.message });
    throw error;
  }
}

// 缓存操作 - 删除键
async function del(key) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKey = `${config.namespace}:${key}`;
    const result = await client.del(fullKey);
    
    logger.debug('[Redis] 删除缓存成功:', { key: fullKey, affected: result });
    return result;
  } catch (error) {
    logger.error('[Redis] 删除缓存失败:', { key, error: error.message });
    throw error;
  }
}

// 缓存操作 - 批量获取
async function mget(keys) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKeys = keys.map(key => `${config.namespace}:${key}`);
    const values = await client.mGet(fullKeys);
    
    logger.debug('[Redis] 批量获取缓存成功:', { keys: fullKeys.length });
    return values.map(value => value ? JSON.parse(value) : null);
  } catch (error) {
    logger.error('[Redis] 批量获取缓存失败:', { keys: keys.length, error: error.message });
    throw error;
  }
}

// 缓存操作 - 批量设置
async function mset(keyValuePairs, ttl = config.defaultTtl) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const commands = [];
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const fullKey = `${config.namespace}:${key}`;
      commands.push(['set', fullKey, JSON.stringify(value), 'EX', ttl]);
    }
    
    await client.multi(commands).exec();
    logger.debug('[Redis] 批量设置缓存成功:', { keys: Object.keys(keyValuePairs).length });
    return true;
  } catch (error) {
    logger.error('[Redis] 批量设置缓存失败:', { error: error.message });
    throw error;
  }
}

// 缓存操作 - 设置过期时间
async function expire(key, ttl) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKey = `${config.namespace}:${key}`;
    const result = await client.expire(fullKey, ttl);
    
    logger.debug('[Redis] 设置过期时间成功:', { key: fullKey, ttl, affected: result });
    return result;
  } catch (error) {
    logger.error('[Redis] 设置过期时间失败:', { key, error: error.message });
    throw error;
  }
}

// 缓存操作 - 检查键是否存在
async function exists(key) {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const fullKey = `${config.namespace}:${key}`;
    const result = await client.exists(fullKey);
    
    logger.debug('[Redis] 检查键存在性:', { key: fullKey, exists: result > 0 });
    return result > 0;
  } catch (error) {
    logger.error('[Redis] 检查键存在性失败:', { key, error: error.message });
    throw error;
  }
}

// 缓存操作 - 清空命名空间下的所有键
async function flushNamespace() {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const pattern = `${config.namespace}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      logger.info('[Redis] 清空命名空间成功:', { namespace: config.namespace, keys: keys.length });
    }
    
    return keys.length;
  } catch (error) {
    logger.error('[Redis] 清空命名空间失败:', { namespace: config.namespace, error: error.message });
    throw error;
  }
}

// 获取Redis信息
async function info(section = 'all') {
  try {
    if (!client.isOpen) {
      await init();
    }
    
    const info = await client.info(section);
    logger.debug('[Redis] 获取信息成功:', { section });
    return info;
  } catch (error) {
    logger.error('[Redis] 获取信息失败:', { section, error: error.message });
    throw error;
  }
}

// 优雅关闭连接
async function close() {
  try {
    if (client.isOpen) {
      await client.quit();
      logger.info('[Redis] 连接已关闭');
    }
  } catch (error) {
    logger.error('[Redis] 关闭连接失败:', { error: error.message });
    throw error;
  }
}

module.exports = {
  client,
  init,
  ping,
  set,
  get,
  del,
  mget,
  mset,
  expire,
  exists,
  flushNamespace,
  info,
  close,
  config
};
