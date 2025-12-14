#!/usr/bin/env node
/**
 * @file 服务网格配置生成脚本
 * @description 用于生成和验证服务网格系统的配置文件
 * @module scripts/generate-mesh-config
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

const path = require('path');
const fs = require('fs').promises;
const { program } = require('commander');

// 使用相对路径引用 logger
const logger = {
  info: (msg) => console.log(`ℹ️ ${msg}`),
  warn: (msg) => console.log(`⚠️ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  debug: (msg) => console.log(`🐛 ${msg}`)
};

// 设置项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * 默认配置模板
 */
const DEFAULT_CONFIG_TEMPLATES = {
  development: {
    gatewayPort: 8080,
    logLevel: "debug",
    serviceDiscoveryConfig: {
      host: "127.0.0.1",
      port: 8500,
      token: null,
      timeout: 5000,
      retryCount: 3,
      retryDelay: 1000
    },
    configCenterConfig: {
      provider: "consul",
      host: "127.0.0.1",
      port: 8500,
      defaultNamespace: "development",
      cacheEnabled: true,
      cacheTTL: 30000,
      watchEnabled: true
    },
    envoyConfigConfig: {
      configOutputDir: path.join(PROJECT_ROOT, 'config', 'envoy-output'),
      refreshInterval: 15000,
      templateDir: path.join(PROJECT_ROOT, 'config', 'templates', 'envoy'),
      adminPort: 9000
    },
    healthCheckInterval: 15000,
    registerExampleServices: true,
    metricsEnabled: true,
    tracingEnabled: false
  },
  staging: {
    gatewayPort: 8080,
    logLevel: "info",
    serviceDiscoveryConfig: {
      host: "consul-server",
      port: 8500,
      token: "${CONSUL_TOKEN}",
      timeout: 3000,
      retryCount: 3,
      retryDelay: 1000
    },
    configCenterConfig: {
      provider: "consul",
      host: "consul-server",
      port: 8500,
      defaultNamespace: "staging",
      cacheEnabled: true,
      cacheTTL: 60000,
      watchEnabled: true
    },
    envoyConfigConfig: {
      configOutputDir: "/opt/envoy/config",
      refreshInterval: 30000,
      templateDir: "/opt/mesh/templates/envoy",
      adminPort: 9000
    },
    healthCheckInterval: 30000,
    registerExampleServices: false,
    metricsEnabled: true,
    tracingEnabled: true,
    tracingEndpoint: "http://jaeger-collector:14268/api/traces"
  },
  production: {
    gatewayPort: 8080,
    logLevel: "warn",
    serviceDiscoveryConfig: {
      host: "consul-server",
      port: 8500,
      token: "${CONSUL_TOKEN}",
      timeout: 2000,
      retryCount: 5,
      retryDelay: 1000
    },
    configCenterConfig: {
      provider: "consul",
      host: "consul-server",
      port: 8500,
      defaultNamespace: "production",
      cacheEnabled: true,
      cacheTTL: 120000,
      watchEnabled: true
    },
    envoyConfigConfig: {
      configOutputDir: "/opt/envoy/config",
      refreshInterval: 60000,
      templateDir: "/opt/mesh/templates/envoy",
      adminPort: 9000
    },
    healthCheckInterval: 60000,
    registerExampleServices: false,
    metricsEnabled: true,
    tracingEnabled: true,
    tracingEndpoint: "http://jaeger-collector:14268/api/traces",
    circuitBreakerConfig: {
      failureThreshold: 0.5,
      resetTimeout: 30000,
      halfOpenMaxCalls: 5
    },
    rateLimiterConfig: {
      defaultRate: 100,
      defaultBurst: 50
    }
  }
};

/**
 * 配置验证规则
 */
const CONFIG_VALIDATION_RULES = {
  gatewayPort: value => {
    const port = parseInt(value);
    return !isNaN(port) && port > 0 && port <= 65535;
  },
  logLevel: value => {
    return ['debug', 'info', 'warn', 'error', 'fatal'].includes(value);
  },
  serviceDiscoveryConfig: value => {
    if (!value || typeof value !== 'object') return false;
    return (
      typeof value.host === 'string' &&
      CONFIG_VALIDATION_RULES.gatewayPort(value.port) &&
      (value.token === null || typeof value.token === 'string') &&
      (!value.timeout || CONFIG_VALIDATION_RULES.gatewayPort(value.timeout))
    );
  },
  configCenterConfig: value => {
    if (!value || typeof value !== 'object') return false;
    return (
      typeof value.provider === 'string' &&
      typeof value.host === 'string' &&
      CONFIG_VALIDATION_RULES.gatewayPort(value.port) &&
      typeof value.defaultNamespace === 'string'
    );
  },
  envoyConfigConfig: value => {
    if (!value || typeof value !== 'object') return false;
    return (
      typeof value.configOutputDir === 'string' &&
      (!value.refreshInterval || CONFIG_VALIDATION_RULES.gatewayPort(value.refreshInterval))
    );
  }
};

/**
 * 验证配置
 * @param {Object} config - 配置对象
 * @returns {Array} 错误信息数组
 */
function validateConfig(config) {
  const errors = [];
  
  // 验证基本配置
  if (!CONFIG_VALIDATION_RULES.gatewayPort(config.gatewayPort)) {
    errors.push('gatewayPort 必须是有效的端口号 (1-65535)');
  }
  
  if (!CONFIG_VALIDATION_RULES.logLevel(config.logLevel)) {
    errors.push('logLevel 必须是有效的日志级别 (debug, info, warn, error, fatal)');
  }
  
  // 验证服务发现配置
  if (!CONFIG_VALIDATION_RULES.serviceDiscoveryConfig(config.serviceDiscoveryConfig)) {
    errors.push('serviceDiscoveryConfig 配置无效');
  }
  
  // 验证配置中心配置
  if (!CONFIG_VALIDATION_RULES.configCenterConfig(config.configCenterConfig)) {
    errors.push('configCenterConfig 配置无效');
  }
  
  // 验证Envoy配置
  if (!CONFIG_VALIDATION_RULES.envoyConfigConfig(config.envoyConfigConfig)) {
    errors.push('envoyConfigConfig 配置无效');
  }
  
  // 验证健康检查间隔
  if (config.healthCheckInterval && (!Number.isInteger(config.healthCheckInterval) || config.healthCheckInterval <= 0)) {
    errors.push('healthCheckInterval 必须是正整数');
  }
  
  return errors;
}

/**
 * 生成配置文件
 * @param {string} env - 环境 (development, staging, production)
 * @param {string} outputPath - 输出路径
 * @param {Object} overrides - 覆盖配置
 */
async function generateConfig(env = 'development', outputPath = path.join(PROJECT_ROOT, 'mesh-config.json'), overrides = {}) {
  try {
    // 获取对应环境的模板
    const template = DEFAULT_CONFIG_TEMPLATES[env] || DEFAULT_CONFIG_TEMPLATES.development;
    
    // 合并覆盖配置
    const config = deepMerge(template, overrides);
    
    // 验证生成的配置
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      throw new Error(`配置验证失败:\n${validationErrors.join('\n')}`);
    }
    
    // 解析环境变量占位符
    const processedConfig = resolveEnvVars(config);
    
    // 确保输出目录存在
    const dir = path.dirname(outputPath);
    if (dir && dir !== '.') {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 写入配置文件
    await fs.writeFile(outputPath, JSON.stringify(processedConfig, null, 2));
    
    logger.info(`✅ 配置文件已生成: ${outputPath}`);
    logger.info(`环境: ${env}`);
    logger.info(`验证状态: 通过`);
    
    return processedConfig;
  } catch (error) {
    logger.error(`❌ 生成配置文件失败: ${error.message}`);
    throw error;
  }
}

/**
 * 验证现有配置文件
 * @param {string} configPath - 配置文件路径
 * @returns {Object} 验证结果
 */
async function validateConfigFile(configPath) {
  try {
    const resolvedPath = path.resolve(process.cwd(), configPath);
    logger.info(`验证配置文件: ${resolvedPath}`);
    
    const content = await fs.readFile(resolvedPath, 'utf8');
    const config = JSON.parse(content);
    
    const errors = validateConfig(config);
    
    if (errors.length > 0) {
      logger.error('❌ 配置验证失败:');
      errors.forEach(error => logger.error(`  - ${error}`));
      return { valid: false, errors };
    } else {
      logger.info('✅ 配置验证通过');
      return { valid: true };
    }
  } catch (error) {
    logger.error(`❌ 读取或解析配置文件失败: ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (typeof target === 'object' && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] !== null && typeof source[key] === 'object' && key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * 解析环境变量占位符
 * @param {any} config - 配置对象
 * @returns {any} 解析后的配置
 */
function resolveEnvVars(config) {
  if (typeof config === 'string') {
    // 查找 ${VAR_NAME} 格式的占位符
    return config.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const envValue = process.env[varName];
      return envValue !== undefined ? envValue : match; // 如果环境变量不存在，保留占位符
    });
  } else if (Array.isArray(config)) {
    return config.map(item => resolveEnvVars(item));
  } else if (typeof config === 'object' && config !== null) {
    const result = {};
    for (const key in config) {
      result[key] = resolveEnvVars(config[key]);
    }
    return result;
  }
  return config;
}

/**
 * 打印配置文件示例
 */
function printConfigExample() {
  console.log('\n📋 服务网格配置文件示例:');
  console.log('=========================================');
  console.log(JSON.stringify(DEFAULT_CONFIG_TEMPLATES.development, null, 2));
  console.log('=========================================');
}

/**
 * 创建配置目录结构
 * @param {string} baseDir - 基础目录
 */
async function createConfigDirectoryStructure(baseDir = path.join(PROJECT_ROOT, 'config')) {
  try {
    // 创建目录结构
    const dirs = [
      path.join(baseDir, 'templates', 'envoy'),
      path.join(baseDir, 'services'),
      path.join(baseDir, 'gateway'),
      path.join(baseDir, 'envoy')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`创建目录: ${dir}`);
    }
    
    // 创建Envoy模板文件
    const envoyTemplatePath = path.join(baseDir, 'templates', 'envoy', 'envoy-template.yaml');
    await fs.writeFile(envoyTemplatePath, `# Envoy代理配置模板
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        address: 0.0.0.0
        port_value: {{port}}
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              # 路由将通过服务网格动态配置
              {{routes}}
          http_filters:
          - name: envoy.filters.http.router
            typed_config: {}
admin:
  access_log_path: /tmp/admin_access.log
  address:
    socket_address:
      address: 0.0.0.0
      port_value: {{adminPort}}
`);
    
    logger.info(`✅ 配置目录结构已创建: ${baseDir}`);
    logger.info(`✅ Envoy模板文件已创建: ${envoyTemplatePath}`);
    
  } catch (error) {
    logger.error(`❌ 创建配置目录结构失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  program
    .name('generate-mesh-config')
    .description('生成和验证服务网格系统配置文件')
    .version('1.0.0')
    
    // 生成命令
    .command('generate')
    .description('生成配置文件')
    .option('-e, --env <environment>', '环境 (development, staging, production)', 'development')
    .option('-o, --output <path>', '输出路径', path.join(PROJECT_ROOT, 'mesh-config.json'))
    .option('-p, --port <number>', '网关端口', parseInt)
    .option('--overrides <json>', 'JSON格式的覆盖配置')
    .action(async (options) => {
      let overrides = {};
      if (options.overrides) {
        try {
          overrides = JSON.parse(options.overrides);
        } catch (e) {
          logger.error('无效的JSON覆盖配置');
          process.exit(1);
        }
      }
      
      if (options.port) {
        overrides.gatewayPort = options.port;
      }
      
      await generateConfig(options.env, options.output, overrides);
    });
    
    // 验证命令
    program
      .command('validate')
      .description('验证配置文件')
      .argument('<configPath>', '配置文件路径')
      .action(async (configPath) => {
        const result = await validateConfigFile(configPath);
        if (!result.valid) {
          process.exit(1);
        }
      });
      
      // 示例命令
      program
        .command('example')
        .description('显示配置示例')
        .action(() => {
          printConfigExample();
        });
        
        // 初始化配置目录
        program
          .command('init')
          .description('初始化配置目录结构')
          .option('-d, --dir <path>', '基础目录', './config')
          .action(async (options) => {
            await createConfigDirectoryStructure(options.dir);
          });
  
  program.parse(process.argv);
}

// 导出函数以供其他模块使用
module.exports = {
  generateConfig,
  validateConfig,
  validateConfigFile,
  createConfigDirectoryStructure,
  DEFAULT_CONFIG_TEMPLATES,
  VERSION: '1.0.0'
};

// 如果直接运行脚本
if (require.main === module) {
  main();
}
