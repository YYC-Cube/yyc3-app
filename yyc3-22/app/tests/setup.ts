/**
 * @file 测试环境设置文件
 * @description 配置Jest测试的全局环境
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.API_ENDPOINT = 'http://localhost:3000';

// 模拟全局对象
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = require('node-fetch');
}

// 忽略特定的警告
console.warn = jest.fn();

// 设置全局超时时间
jest.setTimeout(10000);
