#!/usr/bin/env node

/**
 * @file API集成测试脚本
 * @description 测试redis-config和app项目之间的API联动和Redis通信
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-06
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const redis = require('redis');

// 配置路径
const CONFIG_PATHS = {
  REDIS_CONFIG_ENV: '/Users/yanyu/www/redis-config/.env.local',
  APP_ENV: '/Users/yanyu/www/app/.env.local',
  SHARED_LIB_PATH: '/Users/yanyu/www/shared-lib/redis-client'
};

// 测试结果对象
const testResults = {
  environmentSync: { passed: false, details: [] },
  redisConnection: { passed: false, details: [] },
  sharedLib: { passed: false, details: [] },
  apiServices: { passed: false, details: [] },
  redisCommunication: { passed: false, details: [] },
  overall: { passed: false }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * 打印带颜色的消息
 */
function logWithColor(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 读取环境变量文件
 */
function readEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    content.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, value] = line.split('=').map(part => part.trim());
        envVars[key] = value;
      }
    });
    return envVars;
  } catch (error) {
    logWithColor(`❌ 无法读取环境文件 ${envPath}: ${error.message}`, 'red');
    return {};
  }
}

/**
 * 测试环境变量同步
 */
async function testEnvironmentSync() {
  logWithColor('\n=== 测试环境变量同步 ===', 'blue');
  
  const redisConfigEnv = readEnvFile(CONFIG_PATHS.REDIS_CONFIG_ENV);
  const appEnv = readEnvFile(CONFIG_PATHS.APP_ENV);
  
  // 检查必要的环境变量是否存在
  const criticalEnvVars = ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'];
  let syncPassed = true;
  
  criticalEnvVars.forEach(varName => {
    const redisVal = redisConfigEnv[varName];
    const appVal = appEnv[varName];
    
    if (!redisVal) {
      testResults.environmentSync.details.push(`❌ ${CONFIG_PATHS.REDIS_CONFIG_ENV} 缺少 ${varName}`);
      syncPassed = false;
    } else if (!appVal) {
      testResults.environmentSync.details.push(`❌ ${CONFIG_PATHS.APP_ENV} 缺少 ${varName}`);
      syncPassed = false;
    } else if (redisVal !== appVal) {
      testResults.environmentSync.details.push(`❌ ${varName} 不匹配: redis-config=${redisVal}, app=${appVal}`);
      syncPassed = false;
    } else {
      testResults.environmentSync.details.push(`✅ ${varName} 匹配: ${redisVal}`);
    }
  });
  
  testResults.environmentSync.passed = syncPassed;
  
  if (syncPassed) {
    logWithColor('✅ 环境变量同步测试通过', 'green');
  } else {
    logWithColor('❌ 环境变量同步测试失败', 'red');
  }
  
  return redisConfigEnv; // 返回环境变量用于后续测试
}

/**
 * 测试Redis连接
 */
async function testRedisConnection(envVars) {
  logWithColor('\n=== 测试Redis连接 ===', 'blue');
  
  if (!envVars.REDIS_HOST || !envVars.REDIS_PORT || !envVars.REDIS_PASSWORD) {
    testResults.redisConnection.details.push('❌ 缺少必要的Redis连接参数');
    testResults.redisConnection.passed = false;
    logWithColor('❌ Redis连接测试跳过 (缺少参数)', 'yellow');
    return null;
  }
  
  try {
    const client = redis.createClient({
      url: `redis://:${envVars.REDIS_PASSWORD}@${envVars.REDIS_HOST}:${envVars.REDIS_PORT}`
    });
    
    client.on('error', err => {
      testResults.redisConnection.details.push(`❌ Redis客户端错误: ${err.message}`);
      logWithColor(`❌ Redis客户端错误: ${err.message}`, 'red');
    });
    
    await client.connect();
    testResults.redisConnection.details.push('✅ Redis连接成功');
    logWithColor('✅ Redis连接成功', 'green');
    
    const pingResponse = await client.ping();
    if (pingResponse === 'PONG') {
      testResults.redisConnection.details.push('✅ Redis PING命令返回正常');
      logWithColor('✅ Redis PONG响应正常', 'green');
    } else {
      testResults.redisConnection.details.push(`❌ Redis PING返回意外值: ${pingResponse}`);
      logWithColor(`❌ Redis PING返回意外值: ${pingResponse}`, 'red');
    }
    
    testResults.redisConnection.passed = true;
    return client;
  } catch (error) {
    testResults.redisConnection.details.push(`❌ Redis连接失败: ${error.message}`);
    testResults.redisConnection.passed = false;
    logWithColor(`❌ Redis连接失败: ${error.message}`, 'red');
    return null;
  }
}

/**
 * 测试共享库
 */
async function testSharedLib() {
  logWithColor('\n=== 测试共享库 ===', 'blue');
  
  try {
    // 检查共享库是否存在
    if (!fs.existsSync(CONFIG_PATHS.SHARED_LIB_PATH)) {
      testResults.sharedLib.details.push(`❌ 共享库路径不存在: ${CONFIG_PATHS.SHARED_LIB_PATH}`);
      testResults.sharedLib.passed = false;
      logWithColor(`❌ 共享库路径不存在: ${CONFIG_PATHS.SHARED_LIB_PATH}`, 'red');
      return;
    }
    
    // 检查共享库的主要文件
    const mainFiles = ['index.js', 'package.json'];
    let libPassed = true;
    
    mainFiles.forEach(file => {
      const filePath = path.join(CONFIG_PATHS.SHARED_LIB_PATH, file);
      if (fs.existsSync(filePath)) {
        testResults.sharedLib.details.push(`✅ 共享库文件存在: ${file}`);
      } else {
        testResults.sharedLib.details.push(`❌ 共享库文件不存在: ${file}`);
        libPassed = false;
        logWithColor(`❌ 共享库文件不存在: ${file}`, 'red');
      }
    });
    
    // 检查package.json中的依赖
    const pkgPath = path.join(CONFIG_PATHS.SHARED_LIB_PATH, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.dependencies && pkg.dependencies.redis) {
        testResults.sharedLib.details.push(`✅ 共享库包含Redis依赖: ${pkg.dependencies.redis}`);
      } else {
        testResults.sharedLib.details.push('❌ 共享库缺少Redis依赖');
        libPassed = false;
        logWithColor('❌ 共享库缺少Redis依赖', 'red');
      }
    }
    
    testResults.sharedLib.passed = libPassed;
    
    if (libPassed) {
      logWithColor('✅ 共享库测试通过', 'green');
    } else {
      logWithColor('❌ 共享库测试失败', 'red');
    }
  } catch (error) {
    testResults.sharedLib.details.push(`❌ 共享库测试出错: ${error.message}`);
    testResults.sharedLib.passed = false;
    logWithColor(`❌ 共享库测试出错: ${error.message}`, 'red');
  }
}

/**
 * 测试API服务状态
 */
async function testApiServices() {
  logWithColor('\n=== 测试API服务状态 ===', 'blue');
  
  const services = [
    { name: 'redis-config API', url: 'http://localhost:3000/status', port: 3000 },
    { name: 'app API', url: 'http://localhost:3001/api/status', port: 3001 }
  ];
  
  let allServicesPassed = true;
  
  for (const service of services) {
    try {
      // 检查端口是否在使用中
      const portCheck = execSync(`lsof -i :${service.port} || echo ""`, { encoding: 'utf8' });
      
      if (portCheck.trim() === '') {
        testResults.apiServices.details.push(`⚠️ ${service.name} 未运行在端口 ${service.port}`);
        logWithColor(`⚠️ ${service.name} 未运行在端口 ${service.port}`, 'yellow');
        allServicesPassed = false;
      } else {
        testResults.apiServices.details.push(`✅ ${service.name} 端口 ${service.port} 正在使用`);
        logWithColor(`✅ ${service.name} 端口 ${service.port} 正在使用`, 'green');
        
        // 尝试访问API状态端点
        try {
          // 使用curl测试API
          const response = execSync(`curl -s ${service.url} || echo ""`, { encoding: 'utf8' });
          
          if (response.trim() === '') {
            testResults.apiServices.details.push(`⚠️ ${service.name} 响应为空`);
            logWithColor(`⚠️ ${service.name} 响应为空`, 'yellow');
          } else {
            testResults.apiServices.details.push(`✅ ${service.name} 返回响应`);
            logWithColor(`✅ ${service.name} 返回响应`, 'green');
            
            // 尝试解析JSON响应
            try {
              const jsonResponse = JSON.parse(response);
              testResults.apiServices.details.push(`✅ ${service.name} 返回有效的JSON响应`);
              logWithColor(`✅ ${service.name} 返回有效的JSON响应`, 'green');
            } catch (jsonError) {
              testResults.apiServices.details.push(`⚠️ ${service.name} 返回的不是有效的JSON`);
              logWithColor(`⚠️ ${service.name} 返回的不是有效的JSON`, 'yellow');
            }
          }
        } catch (apiError) {
          testResults.apiServices.details.push(`⚠️ 无法访问 ${service.name}: ${apiError.message}`);
          logWithColor(`⚠️ 无法访问 ${service.name}: ${apiError.message}`, 'yellow');
        }
      }
    } catch (error) {
      testResults.apiServices.details.push(`❌ 检查 ${service.name} 失败: ${error.message}`);
      logWithColor(`❌ 检查 ${service.name} 失败: ${error.message}`, 'red');
      allServicesPassed = false;
    }
  }
  
  testResults.apiServices.passed = allServicesPassed;
  
  if (allServicesPassed) {
    logWithColor('✅ 所有API服务测试通过', 'green');
  } else {
    logWithColor('⚠️ 部分API服务测试未通过，请检查服务状态', 'yellow');
  }
}

/**
 * 测试Redis通信
 */
async function testRedisCommunication(redisClient) {
  logWithColor('\n=== 测试Redis通信 ===', 'blue');
  
  if (!redisClient) {
    testResults.redisCommunication.details.push('❌ 无法进行Redis通信测试 (客户端未初始化)');
    testResults.redisCommunication.passed = false;
    logWithColor('❌ Redis通信测试跳过 (客户端未初始化)', 'yellow');
    return;
  }
  
  try {
    // 测试1: 设置和获取键值对
    const testKey = 'test:api_integration';
    const testValue = JSON.stringify({ message: 'API集成测试', timestamp: Date.now() });
    
    await redisClient.set(testKey, testValue, 'EX', 60); // 60秒过期
    testResults.redisCommunication.details.push('✅ 设置测试键成功');
    logWithColor('✅ 设置测试键成功', 'green');
    
    const retrievedValue = await redisClient.get(testKey);
    if (retrievedValue === testValue) {
      testResults.redisCommunication.details.push('✅ 获取测试键成功，值匹配');
      logWithColor('✅ 获取测试键成功，值匹配', 'green');
    } else {
      testResults.redisCommunication.details.push('❌ 获取的测试值与设置的值不匹配');
      logWithColor('❌ 获取的测试值与设置的值不匹配', 'red');
    }
    
    // 测试2: 发布/订阅机制
    const testChannel = 'test:api_channel';
    const testMessage = JSON.stringify({ type: 'test_message', content: 'Hello from integration test' });
    
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    
    let messageReceived = false;
    let subscriptionPassed = false;
    
    subscriber.subscribe(testChannel, (message) => {
      messageReceived = true;
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'test_message') {
          testResults.redisCommunication.details.push('✅ 成功接收发布的消息');
          logWithColor('✅ 成功接收发布的消息', 'green');
          subscriptionPassed = true;
        } else {
          testResults.redisCommunication.details.push('❌ 接收到的消息类型不匹配');
          logWithColor('❌ 接收到的消息类型不匹配', 'red');
        }
      } catch (parseError) {
        testResults.redisCommunication.details.push(`❌ 解析接收到的消息失败: ${parseError.message}`);
        logWithColor(`❌ 解析接收到的消息失败: ${parseError.message}`, 'red');
      }
    });
    
    // 等待订阅成功
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 发布消息
    await redisClient.publish(testChannel, testMessage);
    testResults.redisCommunication.details.push('✅ 发布测试消息成功');
    logWithColor('✅ 发布测试消息成功', 'green');
    
    // 等待消息接收
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await subscriber.unsubscribe(testChannel);
    await subscriber.disconnect();
    
    if (!messageReceived) {
      testResults.redisCommunication.details.push('❌ 未能接收到发布的消息');
      logWithColor('❌ 未能接收到发布的消息', 'red');
    }
    
    // 测试3: 检查键的过期时间
    const ttl = await redisClient.ttl(testKey);
    if (ttl > 0 && ttl <= 60) {
      testResults.redisCommunication.details.push(`✅ 键的过期时间正确: ${ttl}秒`);
      logWithColor(`✅ 键的过期时间正确: ${ttl}秒`, 'green');
    } else {
      testResults.redisCommunication.details.push(`❌ 键的过期时间不正确: ${ttl}秒`);
      logWithColor(`❌ 键的过期时间不正确: ${ttl}秒`, 'red');
    }
    
    // 清理测试数据
    await redisClient.del(testKey);
    testResults.redisCommunication.details.push('✅ 清理测试数据成功');
    logWithColor('✅ 清理测试数据成功', 'green');
    
    testResults.redisCommunication.passed = subscriptionPassed;
    
  } catch (error) {
    testResults.redisCommunication.details.push(`❌ Redis通信测试失败: ${error.message}`);
    testResults.redisCommunication.passed = false;
    logWithColor(`❌ Redis通信测试失败: ${error.message}`, 'red');
  }
}

/**
 * 生成测试报告
 */
function generateTestReport() {
  logWithColor('\n=== 测试报告 ===', 'blue');
  
  const allTestsPassed = Object.values(testResults)
    .filter(test => test.passed !== undefined)
    .every(test => test.passed);
  
  testResults.overall.passed = allTestsPassed;
  
  logWithColor('\n测试结果摘要:', 'blue');
  console.log(`环境变量同步: ${testResults.environmentSync.passed ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Redis连接: ${testResults.redisConnection.passed ? '✅ 通过' : '❌ 失败'}`);
  console.log(`共享库: ${testResults.sharedLib.passed ? '✅ 通过' : '❌ 失败'}`);
  console.log(`API服务: ${testResults.apiServices.passed ? '✅ 通过' : '⚠️ 部分通过'}`);
  console.log(`Redis通信: ${testResults.redisCommunication.passed ? '✅ 通过' : '❌ 失败'}`);
  
  logWithColor(`\n总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`, allTestsPassed ? 'green' : 'red');
  
  // 保存详细报告
  const reportPath = '/Users/yanyu/www/docs/api-integration-report.json';
  try {
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    logWithColor(`\n详细报告已保存到: ${reportPath}`, 'yellow');
  } catch (saveError) {
    logWithColor(`\n❌ 无法保存详细报告: ${saveError.message}`, 'red');
  }
  
  // 如果测试失败，提供修复建议
  if (!allTestsPassed) {
    logWithColor('\n修复建议:', 'yellow');
    
    if (!testResults.environmentSync.passed) {
      console.log('1. 运行同步脚本更新环境变量: bash /Users/yanyu/www/scripts/sync-api-settings.sh');
    }
    
    if (!testResults.redisConnection.passed) {
      console.log('2. 检查Redis服务是否运行: redis-cli ping');
      console.log('3. 验证Redis密码是否正确');
      console.log('4. 检查防火墙设置是否允许连接');
    }
    
    if (!testResults.sharedLib.passed) {
      console.log('5. 确保共享库存在并安装了依赖');
      console.log('6. 检查符号链接是否正确');
    }
    
    if (!testResults.apiServices.passed) {
      console.log('7. 启动API服务:');
      console.log('   - redis-config API: cd /Users/yanyu/www/redis-config/api && npm start');
      console.log('   - app API: cd /Users/yanyu/www/app && npm start');
    }
    
    if (!testResults.redisCommunication.passed) {
      console.log('8. 检查Redis客户端版本兼容性');
      console.log('9. 验证发布/订阅配置是否正确');
    }
  }
  
  logWithColor('\n完成API集成测试！', 'blue');
}

/**
 * 主测试函数
 */
async function runTests() {
  logWithColor('\n🚀 API集成测试启动', 'green');
  logWithColor('正在测试redis-config和app项目之间的联动...', 'blue');
  
  try {
    const envVars = await testEnvironmentSync();
    const redisClient = await testRedisConnection(envVars);
    await testSharedLib();
    await testApiServices();
    await testRedisCommunication(redisClient);
    
    // 关闭Redis连接
    if (redisClient) {
      await redisClient.disconnect();
    }
  } catch (error) {
    logWithColor(`\n❌ 测试运行出错: ${error.message}`, 'red');
    console.error(error.stack);
  } finally {
    generateTestReport();
  }
}

// 执行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
