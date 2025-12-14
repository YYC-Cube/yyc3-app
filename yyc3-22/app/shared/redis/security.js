/**
 * @file Redis安全配置模块
 * @description 提供Redis连接安全增强、配置验证、认证管理等安全功能
 * @module redis/security
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const logger = require('../logger');
const { createAppError } = require('../errorHandler');

/**
 * Redis安全管理器类
 */
class RedisSecurityManager {
  constructor() {
    this.securityRules = {
      // 密码强度规则
      passwordComplexity: {
        minLength: 20, // 增强密码长度要求
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        denyCommonPasswords: true,
        commonPasswords: ['password', 'admin', 'redis', '123456', 'qwerty', '123456789']
      },
      // 连接安全规则
      connection: {
        // 禁止使用默认端口
        disallowDefaultPort: true,
        // 强制TLS连接
        enforceTLS: process.env.NODE_ENV === 'production',
        // 最大连接数限制
        maxConnections: process.env.REDIS_MAX_CONNECTIONS ? parseInt(process.env.REDIS_MAX_CONNECTIONS) : 1000,
        // 连接超时时间
        connectionTimeout: process.env.REDIS_CONNECTION_TIMEOUT ? parseInt(process.env.REDIS_CONNECTION_TIMEOUT) : 5000,
        // 空闲连接超时
        idleTimeout: process.env.REDIS_IDLE_TIMEOUT ? parseInt(process.env.REDIS_IDLE_TIMEOUT) : 30000,
        // 重试策略配置
        retryStrategy: {
          maxRetries: process.env.REDIS_MAX_RETRIES ? parseInt(process.env.REDIS_MAX_RETRIES) : 5,
          retryDelay: process.env.REDIS_RETRY_DELAY ? parseInt(process.env.REDIS_RETRY_DELAY) : 1000,
          maxRetryDelay: process.env.REDIS_MAX_RETRY_DELAY ? parseInt(process.env.REDIS_MAX_RETRY_DELAY) : 10000
        },
        // 允许的IP范围
        allowedIPs: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
        // 连接速率限制
        rateLimit: {
          connectionsPerMinute: 60,
          burst: 100
        }
      },
      // 命令安全规则
      command: {
        // 禁用的危险命令
        disabledCommands: ['FLUSHDB', 'FLUSHALL', 'CONFIG', 'DEBUG', 'SHUTDOWN', 'CLIENT KILL', 'MODULE', 'ACL'],
        // 只读模式选项
        readOnly: process.env.REDIS_READONLY === 'true',
        // 限制危险命令执行
        restrictedCommands: ['KEYS', 'HGETALL', 'ZRANGE', 'ZRANGEBYSCORE', 'SMEMBERS', 'SCAN'],
        // 需要审计的命令
        auditCommands: ['SET', 'DEL', 'HSET', 'LPUSH', 'MSET', 'EXPIRE', 'PERSIST', 'RENAME'],
        // 命令速率限制
        rateLimit: {
          GET: 200,
          HGETALL: 100,
          SMEMBERS: 50,
          SCAN: 30
        }
      },
      // 数据安全规则
      data: {
        // 敏感数据加密
        encryptSensitiveData: process.env.REDIS_ENCRYPT_SENSITIVE_DATA === 'true',
        // 敏感字段模式
        sensitiveFieldsPattern: /^(password|token|secret|key|credential|auth|api_?key|bearer|private|access|.*pass.*|.*secret.*)/i,
        // 数据TTL默认值（秒）
        defaultTTL: process.env.REDIS_DEFAULT_TTL ? parseInt(process.env.REDIS_DEFAULT_TTL) : 86400,
        // 最大缓存大小（MB）
        maxCacheSize: process.env.REDIS_MAX_CACHE_SIZE ? parseInt(process.env.REDIS_MAX_CACHE_SIZE) : 1024,
        // 数据验证规则
        validation: {
          allowedKeyPattern: /^[a-zA-Z0-9_\-:.]{1,1024}$/,
          rejectNullValues: true,
          maxListLength: 10000,
          maxHashFields: 1000
        },
        // 键大小限制
        maxKeySize: 1024, // 1KB
        // 值大小限制
        maxValueSize: 5 * 1024 * 1024 // 5MB
      },
      // 内存安全规则
      memory: {
        // 最大内存限制（百分比）
        maxMemoryPercentage: process.env.REDIS_MAX_MEMORY_PERCENTAGE ? parseFloat(process.env.REDIS_MAX_MEMORY_PERCENTAGE) : 75, // 降低阈值提前预警
        // 内存策略
        memoryPolicy: process.env.REDIS_MEMORY_POLICY || 'volatile-lru',
        // 内存监控配置
        monitoring: {
          enable: true,
          alertThreshold: 85,
          criticalThreshold: 95
        }
      },
      // 监控和审计规则
      monitoring: {
        enableAuditLog: true,
        logSensitiveOperations: true,
        alertOnSecurityBreach: true,
        logRetention: {
          days: 30,
          maxSizeMB: 1000
        }
      }
    };
    
    // 敏感数据哈希缓存（用于防止重复哈希计算）
    this.sensitiveDataCache = new Map();
    
    // 命令计数器（用于速率限制）
    this.commandCounters = new Map();
    
    // 初始化安全状态
    this.securityState = {
      lastSecurityCheck: 0,
      memoryWarnings: 0,
      securityScore: 100
    };
  }

  /**
   * 验证Redis配置安全性
   * @param {object} config - Redis配置对象
   * @returns {object} 验证结果 { isValid: boolean, warnings: string[], errors: string[] }
   */
  validateConfiguration(config) {
    const result = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // 检查必需配置项
    if (!config.host) {
      result.errors.push('Redis主机地址未配置');
      result.isValid = false;
    }

    // 检查密码配置
    if (config.password) {
      const passwordValidation = this.validatePassword(config.password);
      if (!passwordValidation.isValid) {
        result.errors.push(`密码不符合安全要求: ${passwordValidation.errors.join(', ')}`);
        result.isValid = false;
      }
    } else {
      result.warnings.push('Redis未配置密码保护，存在安全风险');
    }

    // 检查默认端口使用
    if (this.securityRules.connection.disallowDefaultPort && config.port === 6379) {
      result.warnings.push('使用Redis默认端口(6379)，建议更改');
    }

    // 检查TLS配置
    if (this.securityRules.connection.enforceTLS && !config.tls) {
      result.warnings.push('推荐使用TLS加密连接，但当前未配置');
      // 在生产环境中强制要求TLS
      if (process.env.NODE_ENV === 'production') {
        result.errors.push('生产环境必须使用TLS加密连接');
        result.isValid = false;
      }
    }

    // 检查连接超时设置
    if (!config.connect_timeout && !config.socket?.connectTimeout) {
      result.warnings.push('未配置连接超时，可能导致连接挂起');
    }

    // 记录验证结果
    if (result.errors.length > 0) {
      logger.error('Redis配置安全性验证失败', result.errors);
    }
    if (result.warnings.length > 0) {
      logger.warn('Redis配置存在安全隐患', result.warnings);
    }
    if (result.isValid) {
      logger.info('Redis配置安全性验证通过');
    }

    return result;
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码字符串
   * @returns {object} 验证结果 { isValid: boolean, errors: string[] }
   */
  validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    const rules = this.securityRules.passwordComplexity;

    // 检查密码长度
    if (password.length < rules.minLength) {
      result.errors.push(`密码长度至少为${rules.minLength}个字符`);
      result.isValid = false;
    }

    // 检查是否包含大写字母
    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      result.errors.push('密码必须包含大写字母');
      result.isValid = false;
    }

    // 检查是否包含小写字母
    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      result.errors.push('密码必须包含小写字母');
      result.isValid = false;
    }

    // 检查是否包含数字
    if (rules.requireNumbers && !/[0-9]/.test(password)) {
      result.errors.push('密码必须包含数字');
      result.isValid = false;
    }

    // 检查是否包含特殊字符
    if (rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.errors.push('密码必须包含特殊字符');
      result.isValid = false;
    }

    return result;
  }

  /**
   * 生成安全连接配置
   * @param {object} baseConfig - 基础配置
   * @returns {object} 安全增强后的配置
   */
  getSecureConfig(baseConfig) {
    const config = { ...baseConfig };
    
    // 连接安全配置
    config.socket = config.socket || {};
    config.socket.connectTimeout = config.socket.connectTimeout || this.securityRules.connection.connectionTimeout;
    config.socket.keepAlive = true;
    
    // 重试策略配置
    config.retryStrategy = (times) => {
      if (times > this.securityRules.connection.retryStrategy.maxRetries) {
        logger.error(`Redis连接重试失败，已达最大重试次数: ${this.securityRules.connection.retryStrategy.maxRetries}`);
        return new Error(`连接重试失败: 已尝试${times}次`);
      }
      
      const delay = Math.min(
        this.securityRules.connection.retryStrategy.retryDelay * Math.pow(2, times - 1),
        this.securityRules.connection.retryStrategy.maxRetryDelay
      );
      
      logger.info(`Redis连接重试中，延迟${delay}ms，第${times}次尝试`);
      return delay;
    };
    
    // TTL配置
    config.ttl = config.ttl || this.securityRules.data.defaultTTL;
    
    // 命令监控配置
    config.monitorCommands = process.env.NODE_ENV !== 'production';
    
    return config;
  }

  /**
   * 验证Redis命令安全性
   * @param {string} command - 命令名称
   * @param {array} args - 命令参数
   * @returns {object} 验证结果 { allowed: boolean, reason?: string }
   */
  validateCommand(command, args = []) {
    const upperCommand = command.toUpperCase();
    
    // 检查禁用命令
    if (this.securityRules.command.disabledCommands.includes(upperCommand)) {
      logger.warn(`尝试执行禁用的命令: ${upperCommand}`, { args });
      return {
        allowed: false,
        reason: `命令 ${upperCommand} 已被禁用`
      };
    }
    
    // 只读模式检查
    if (this.securityRules.command.readOnly) {
      const writeCommands = ['SET', 'DEL', 'HSET', 'LPUSH', 'RPUSH', 'ZADD', 'INCR', 'DECR'];
      if (writeCommands.includes(upperCommand)) {
        logger.warn(`只读模式下尝试执行写命令: ${upperCommand}`, { args });
        return {
          allowed: false,
          reason: '当前为只读模式，不允许执行写命令'
        };
      }
    }
    
    // 检查危险命令
    if (this.securityRules.command.restrictedCommands.includes(upperCommand)) {
      logger.info(`执行受限命令: ${upperCommand}`, { args });
      
      // 对KEYS命令进行额外限制
      if (upperCommand === 'KEYS' && args.length > 0) {
        const pattern = args[0];
        if (pattern === '*' && process.env.NODE_ENV === 'production') {
          return {
            allowed: false,
            reason: '生产环境禁止使用 KEYS * 命令'
          };
        }
      }
    }
    
    return { allowed: true };
  }

  /**
   * 过滤敏感数据
   * @param {any} data - 要过滤的数据
   * @param {boolean} [hashOnly=false] - 是否只哈希敏感值，不返回实际值
   * @returns {any} 过滤后的数据
   */
  filterSensitiveData(data, hashOnly = false) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // 处理数组
    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item, hashOnly));
    }

    // 处理对象
    const filteredData = {};
    const pattern = this.securityRules.data.sensitiveFieldsPattern;
    
    for (const [key, value] of Object.entries(data)) {
      // 检查键名是否敏感
      if (pattern.test(key) && value) {
        if (hashOnly) {
          // 只返回哈希值，用于日志记录
          filteredData[key] = this.hashSensitiveValue(value);
        } else {
          // 返回掩码值
          filteredData[key] = this.maskSensitiveValue(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        filteredData[key] = this.filterSensitiveData(value, hashOnly);
      } else {
        filteredData[key] = value;
      }
    }

    return filteredData;
  }

  /**
   * 哈希敏感值（用于日志记录）
   * @param {string} value - 敏感值
   * @returns {string} 哈希后的字符串
   */
  hashSensitiveValue(value) {
    const strValue = String(value);
    
    // 检查缓存
    if (this.sensitiveDataCache.has(strValue)) {
      return this.sensitiveDataCache.get(strValue);
    }
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < strValue.length; i++) {
      const char = strValue.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    const hashStr = `hash_${Math.abs(hash).toString(16).padStart(8, '0')}`;
    
    // 缓存哈希结果（限制缓存大小）
    if (this.sensitiveDataCache.size > 1000) {
      const firstKey = this.sensitiveDataCache.keys().next().value;
      this.sensitiveDataCache.delete(firstKey);
    }
    this.sensitiveDataCache.set(strValue, hashStr);
    
    return hashStr;
  }

  /**
   * 掩码敏感值
   * @param {string} value - 敏感值
   * @returns {string} 掩码后的值
   */
  maskSensitiveValue(value) {
    const strValue = String(value);
    
    // 根据不同类型的敏感数据应用不同的掩码策略
    if (strValue.length <= 4) {
      // 短字符串全部掩码
      return '***';
    } else if (strValue.length <= 8) {
      // 中等长度，显示前1后1
      return strValue[0] + '*'.repeat(strValue.length - 2) + strValue[strValue.length - 1];
    } else if (strValue.includes('@') && strValue.includes('.')) {
      // 邮箱格式
      const [username, domain] = strValue.split('@');
      const maskedUsername = username[0] + '*'.repeat(Math.max(1, username.length - 3)) + 
                           (username.length > 3 ? username.substr(-2) : '');
      return `${maskedUsername}@${domain}`;
    } else if (/^\d{16,19}$/.test(strValue)) {
      // 可能是信用卡号
      return '****-****-****-' + strValue.substr(-4);
    } else {
      // 一般处理，显示前3后3
      return strValue.substr(0, 3) + 
             '*'.repeat(Math.max(1, strValue.length - 6)) + 
             strValue.substr(-3);
    }
  }

  /**
   * 加密敏感数据
   * @param {string} data - 原始数据
   * @returns {string} 加密后的数据
   */
  encryptSensitiveData(data) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.REDIS_ENCRYPTION_KEY || this.generateEncryptionKey();
    
    // 生成随机初始化向量
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    
    // 加密数据
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    // 返回组合的加密数据（iv + authTag + 加密数据）
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  /**
   * 解密敏感数据
   * @param {string} encryptedData - 加密数据
   * @returns {string} 解密后的数据
   */
  decryptSensitiveData(encryptedData) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.REDIS_ENCRYPTION_KEY || this.generateEncryptionKey();
    
    // 分离iv、认证标签和加密数据
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // 创建解密器
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    decipher.setAuthTag(authTag);
    
    // 解密数据
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * 生成加密密钥（用于环境变量未配置时）
   * @returns {Buffer} 加密密钥
   */
  generateEncryptionKey() {
    const crypto = require('crypto');
    // 在生产环境中应该从环境变量获取
    if (process.env.NODE_ENV === 'production') {
      logger.warn('使用自动生成的加密密钥，建议在生产环境中配置REDIS_ENCRYPTION_KEY环境变量');
    }
    return crypto.scryptSync('redis-secure-default', 'salt-value', 32);
  }
  
  /**
   * 创建Redis命令拦截器
   * @param {RedisClient} client - Redis客户端实例
   * @returns {object} 增强的Redis客户端
   */
  createSecureClient(client) {
    // 保存原始命令方法
    const originalSendCommand = client.sendCommand;
    
    // 重写sendCommand方法
    client.sendCommand = async (commandObj, ...args) => {
      const command = commandObj.name;
      const commandArgs = commandObj.args || [];
      
      // 验证命令安全性
      const validation = this.validateCommand(command, commandArgs);
      if (!validation.allowed) {
        throw createAppError(
          403,
          validation.reason,
          {
            code: 'REDIS_COMMAND_DISALLOWED',
            command,
            args: this.filterSensitiveData(commandArgs, true)
          }
        );
      }
      
      // 记录命令（过滤敏感数据）
      logger.debug(`执行Redis命令: ${command}`, {
        args: this.filterSensitiveData(commandArgs, true),
        timestamp: Date.now()
      });
      
      // 审计关键命令
      if (this.securityRules.command.auditCommands.includes(command)) {
        logger.info(`审计Redis命令: ${command}`, {
          args: this.filterSensitiveData(commandArgs, true)
        });
      }
      
      try {
        // 执行原始命令
        const result = await originalSendCommand.call(client, commandObj, ...args);
        return result;
      } catch (error) {
        logger.error(`Redis命令执行失败: ${command}`, {
          error: error.message,
          args: this.filterSensitiveData(commandArgs, true)
        });
        throw error;
      }
    };
    
    // 添加安全方法
    client.setSecure = async (key, value, options = {}) => {
      // 检查键名是否敏感
      const isSensitive = this.securityRules.data.sensitiveFieldsPattern.test(key);
      let processedValue = value;
      
      // 敏感数据处理
      if (isSensitive && this.securityRules.data.encryptSensitiveData) {
        // 序列化对象
        const valueToEncrypt = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // 加密数据
        processedValue = this.encryptSensitiveData(valueToEncrypt);
        // 标记为加密数据
        if (!options.metadata) options.metadata = {};
        options.metadata.encrypted = true;
      }
      
      // 自动设置TTL
      if (!options.ttl && !options.EX && !options.PX) {
        options.EX = this.securityRules.data.defaultTTL;
      }
      
      // 执行设置操作
      return client.set(key, processedValue, options);
    };
    
    // 安全的get方法
    client.getSecure = async (key) => {
      const value = await client.get(key);
      
      // 检查键名是否敏感
      const isSensitive = this.securityRules.data.sensitiveFieldsPattern.test(key);
      
      // 如果是敏感数据且可能已加密
      if (isSensitive && value && value.includes(':')) {
        try {
          // 尝试解密
          const decrypted = this.decryptSensitiveData(value);
          // 尝试解析为JSON
          try {
            return JSON.parse(decrypted);
          } catch (e) {
            return decrypted;
          }
        } catch (e) {
          // 解密失败，可能不是加密数据，返回原始值
          logger.warn(`解密Redis数据失败，返回原始值: ${key}`);
          return value;
        }
      }
      
      return value;
    };
    
    // 批量安全操作
    client.mgetSecure = async (keys) => {
      const results = await client.mget(keys);
      return results.map((value, index) => {
        const key = keys[index];
        const isSensitive = this.securityRules.data.sensitiveFieldsPattern.test(key);
        
        if (isSensitive && value && value.includes(':')) {
          try {
            const decrypted = this.decryptSensitiveData(value);
            try {
              return JSON.parse(decrypted);
            } catch (e) {
              return decrypted;
            }
          } catch (e) {
            return value;
          }
        }
        return value;
      });
    };
    
    // 限制获取大量数据
    client.getAllKeys = async (pattern = '*') => {
      if (pattern === '*' && process.env.NODE_ENV === 'production') {
        throw createAppError(
          403,
          '生产环境禁止使用全局KEYS查询',
          { code: 'PROHIBITED_OPERATION' }
        );
      }
      
      return client.keys(pattern);
    };
    
    return client;
  }

  /**
   * 获取Redis内存使用报告
   * @param {RedisClient} client - Redis客户端实例
   * @returns {Promise<object>} 内存使用报告
   */
  async getMemoryUsageReport(client) {
    try {
      const info = await client.info('memory');
      const memoryStats = {};
      
      // 解析内存信息
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryStats[key] = value;
        }
      });
      
      const usedMemory = parseInt(memoryStats.used_memory) / (1024 * 1024); // MB
      const maxMemory = parseInt(memoryStats.maxmemory || 0) / (1024 * 1024); // MB
      const maxMemoryPercentage = this.securityRules.memory.maxMemoryPercentage;
      
      // 检查内存使用警告
      const isWarning = maxMemory > 0 && (usedMemory / maxMemory * 100) > maxMemoryPercentage;
      const isCritical = maxMemory > 0 && (usedMemory / maxMemory * 100) > this.securityRules.memory.monitoring.criticalThreshold;
      
      // 生成详细报告
      const report = {
        usedMemoryMB: Math.round(usedMemory * 100) / 100,
        maxMemoryMB: maxMemory > 0 ? Math.round(maxMemory * 100) / 100 : 'unlimited',
        memoryUsagePercentage: maxMemory > 0 ? Math.round((usedMemory / maxMemory) * 100 * 100) / 100 : 'unknown',
        maxAllowedPercentage: maxMemoryPercentage,
        alertThreshold: this.securityRules.memory.monitoring.alertThreshold,
        criticalThreshold: this.securityRules.memory.monitoring.criticalThreshold,
        isWarning,
        isCritical,
        memoryPolicy: memoryStats.maxmemory_policy || this.securityRules.memory.memoryPolicy,
        peakMemoryUsage: parseInt(memoryStats.used_memory_peak) / (1024 * 1024), // MB
        fragmentationRatio: parseFloat(memoryStats.mem_fragmentation_ratio || 1),
        rss: parseInt(memoryStats.used_memory_rss) / (1024 * 1024), // MB
        allocatedMemory: parseInt(memoryStats.used_memory_rss) / (1024 * 1024), // MB
        stats: {
          startUpTime: parseInt(memoryStats.startup_time) || 0,
          uptimeInSeconds: parseInt(memoryStats.uptime_in_seconds) || 0
        }
      };
      
      // 根据内存使用级别记录告警
      if (report.isCritical) {
        logger.error('Redis内存使用率达到临界值', {
          usedMemoryMB: report.usedMemoryMB,
          maxMemoryMB: report.maxMemoryMB,
          percentage: report.memoryUsagePercentage
        });
        this.securityState.memoryWarnings++;
      } else if (report.isWarning) {
        logger.warn('Redis内存使用率过高', {
          usedMemoryMB: report.usedMemoryMB,
          maxMemoryMB: report.maxMemoryMB,
          percentage: report.memoryUsagePercentage
        });
        this.securityState.memoryWarnings++;
      }
      
      // 更新安全状态
      this.securityState.lastSecurityCheck = Date.now();
      
      return report;
    } catch (error) {
      logger.error('获取Redis内存使用报告失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 实施内存保护措施
   * @param {RedisClient} client - Redis客户端实例
   * @returns {Promise<void>}
   */
  async enforceMemoryProtection(client) {
    try {
      const report = await this.getMemoryUsageReport(client);
      
      // 如果内存使用超过阈值，执行清理操作
      if (report.isWarning || report.isCritical) {
        logger.info('执行Redis内存清理措施', { memoryPercentage: report.memoryUsagePercentage });
        
        try {
          // 1. 清除过期键
          await client.call('MEMORY', 'PURGE');
          logger.info('Redis内存PURGE操作执行完成');
        } catch (purgeError) {
          logger.warn('Redis MEMORY PURGE命令不可用，尝试其他清理方法', { error: purgeError.message });
        }
        
        // 2. 在开发环境中触发主动淘汰
        if (process.env.NODE_ENV !== 'production' && report.isCritical) {
          logger.info('在非生产环境中执行额外内存清理');
          try {
            // 查找并删除一些大键（仅在开发环境）
            const largeKeys = await this.findLargeKeys(client, 10);
            for (const key of largeKeys) {
              logger.info(`删除大键: ${key.name} (${key.size}MB)`);
              await client.del(key.name);
            }
          } catch (cleanupError) {
            logger.error('执行额外内存清理失败', { error: cleanupError.message });
          }
        }
        
        logger.info('Redis内存清理措施执行完成');
      }
    } catch (error) {
      logger.error('执行Redis内存保护措施失败', { error: error.message });
    }
  }
  
  /**
   * 查找大型键（仅在必要时使用）
   * @param {RedisClient} client - Redis客户端实例
   * @param {number} limit - 返回数量限制
   * @returns {Promise<Array>} 大键列表
   */
  async findLargeKeys(client, limit = 10) {
    try {
      // 注意：这是一个昂贵的操作，仅在必要时使用
      const keys = await client.keys('*');
      const keySizes = [];
      
      // 获取每个键的大小
      for (const key of keys) {
        try {
          const size = await client.memory('USAGE', key);
          keySizes.push({
            name: this.filterSensitiveData(key, true),
            size: size / (1024 * 1024) // 转换为MB
          });
        } catch (e) {
          // 忽略单个键的错误
          continue;
        }
      }
      
      // 按大小排序并返回前N个
      return keySizes
        .sort((a, b) => b.size - a.size)
        .slice(0, limit);
    } catch (error) {
      logger.error('查找大键失败', { error: error.message });
      return [];
    }
  }
  
  /**
   * 获取Redis连接安全状态
   * @param {RedisClient} client - Redis客户端实例
   * @returns {Promise<object>} 连接安全状态
   */
  async getConnectionSecurityStatus(client) {
    try {
      const info = await client.info('server');
      const serverInfo = {};
      
      // 解析服务器信息
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          serverInfo[key] = value;
        }
      });
      
      // 检查连接安全
      const status = {
        version: serverInfo.redis_version || 'unknown',
        mode: serverInfo.redis_mode || 'unknown',
        tlsAvailable: !!process.env.REDIS_USE_TLS || this.securityRules.connection.enforceTLS,
        authEnabled: !!process.env.REDIS_PASSWORD,
        protectedMode: serverInfo.protected_mode === 'yes',
        connections: {
          accepted: parseInt(serverInfo.total_connections_received || 0),
          rejected: parseInt(serverInfo.rejected_connections || 0),
          current: parseInt(serverInfo.connected_clients || 0)
        },
        securityScore: this.calculateSecurityScore(serverInfo)
      };
      
      // 更新安全状态
      this.securityState.securityScore = status.securityScore;
      
      return status;
    } catch (error) {
      logger.error('获取Redis连接安全状态失败', { error: error.message });
      return {
        error: error.message,
        securityScore: 0
      };
    }
  }
  
  /**
   * 计算Redis安全评分
   * @param {object} serverInfo - 服务器信息
   * @returns {number} 安全评分 (0-100)
   */
  calculateSecurityScore(serverInfo) {
    let score = 100;
    
    // 检查密码保护
    if (!process.env.REDIS_PASSWORD) {
      score -= 30;
      logger.warn('Redis未配置密码，安全评分降低');
    }
    
    // 检查保护模式
    if (serverInfo.protected_mode !== 'yes') {
      score -= 20;
      logger.warn('Redis保护模式未启用，安全评分降低');
    }
    
    // 检查TLS
    if (!process.env.REDIS_USE_TLS && !this.securityRules.connection.enforceTLS) {
      score -= 15;
      logger.warn('Redis未启用TLS，安全评分降低');
    }
    
    // 检查是否限制IP绑定
    if (serverInfo.bind === '0.0.0.0') {
      score -= 15;
      logger.warn('Redis监听所有IP地址，安全评分降低');
    }
    
    // 检查危险命令是否已禁用
    const dangerousCommands = ['CONFIG', 'FLUSHALL', 'FLUSHDB', 'DEBUG'];
    const hasDisabledCommands = dangerousCommands.some(cmd => 
      this.securityRules.command.disabledCommands.includes(cmd)
    );
    
    if (!hasDisabledCommands) {
      score -= 10;
      logger.warn('部分危险命令未禁用，安全评分降低');
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 创建定期安全检查任务
   * @param {RedisClient} client - Redis客户端实例
   * @param {number} intervalMs - 检查间隔（毫秒）
   * @returns {object} 检查任务控制对象
   */
  createSecurityMonitor(client, intervalMs = 300000) { // 默认5分钟
    // 安全检查函数
    const performSecurityCheck = async () => {
      try {
        logger.debug('开始Redis安全定期检查');
        
        // 检查内存使用
        const memoryReport = await this.getMemoryUsageReport(client);
        
        // 获取连接状态
        const connectionStatus = await this.getConnectionSecurityStatus(client);
        
        // 执行内存保护
        await this.enforceMemoryProtection(client);
        
        logger.debug('Redis安全定期检查完成', {
          memoryUsage: memoryReport.memoryUsagePercentage,
          securityScore: connectionStatus.securityScore
        });
      } catch (error) {
        logger.error('Redis安全定期检查失败', { error: error.message });
      }
    };
    
    // 启动定时检查
    const interval = setInterval(performSecurityCheck, intervalMs);
    
    // 立即执行一次检查
    performSecurityCheck();
    
    return {
      stop: () => {
        clearInterval(interval);
        logger.info('Redis安全监控已停止');
      },
      forceCheck: performSecurityCheck,
      getStatus: () => ({
        lastCheck: this.securityState.lastSecurityCheck,
        memoryWarnings: this.securityState.memoryWarnings,
        securityScore: this.securityState.securityScore
      })
    };
  }

  /**
   * 生成安全建议
   * @param {object} redisInfo - Redis信息
   * @returns {object} 安全建议报告
   */
  generateSecurityReport(redisInfo = {}) {
    const recommendations = {
      critical: [],
      warnings: [],
      suggestions: []
    };

    // 检查认证
    if (!redisInfo.requirepass) {
      recommendations.critical.push('启用Redis认证（设置requirepass配置）');
    }

    // 检查绑定地址
    if (redisInfo.bind === '0.0.0.0') {
      recommendations.critical.push('限制Redis只监听本地或内部网络');
    }

    // 检查保护模式
    if (redisInfo.protected_mode !== 'yes') {
      recommendations.critical.push('启用保护模式（protected-mode yes）');
    }

    // 检查危险命令
    if (!redisInfo.rename_commands || !redisInfo.rename_commands.includes('CONFIG')) {
      recommendations.warnings.push('考虑重命名或禁用CONFIG等危险命令');
    }

    // 检查最大内存限制
    if (!redisInfo.maxmemory) {
      recommendations.warnings.push('设置Redis最大内存限制以防止内存耗尽');
    }

    // 检查内存策略
    if (redisInfo.maxmemory_policy !== this.securityRules.memory.memoryPolicy) {
      recommendations.suggestions.push(`建议使用${this.securityRules.memory.memoryPolicy}内存淘汰策略`);
    }

    // 检查AOF持久化
    if (redisInfo.appendonly !== 'yes') {
      recommendations.suggestions.push('启用AOF持久化以提高数据安全性');
    }

    // 检查日志级别
    if (redisInfo.loglevel === 'debug') {
      recommendations.suggestions.push('生产环境应降低日志级别，避免泄露敏感信息');
    }

    return recommendations;
  }
}

// 导出单例实例
const redisSecurityManager = new RedisSecurityManager();

module.exports = {
  RedisSecurityManager,
  redisSecurityManager
};
