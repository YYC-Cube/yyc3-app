/**
 * @file 测试后置设置文件
 * @description 配置Jest测试的后置环境和扩展
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { expect, afterEach } from '@jest/globals';

// 扩展 expect 断言
// @ts-ignore
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// 每个测试后清理
// @ts-ignore
afterEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
  // 重置所有模块
  jest.resetModules();
  // 恢复所有原始实现
  jest.restoreAllMocks();
});

// 配置测试覆盖率阈值警告
if (process.env.CI) {
  console.log('Running in CI environment - enforcing coverage thresholds');
}
