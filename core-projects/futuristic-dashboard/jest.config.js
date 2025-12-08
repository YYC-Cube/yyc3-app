/**
 * @file Jest配置文件
 * @description 为UI组件测试和视觉回归测试提供配置
 * @author YYC
 * @created 2024-10-15
 */

/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // 提供Next.js应用的路径
  dir: './',
});

// 自定义Jest配置
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    // 模块别名
    '^@/(.*)$': '<rootDir>/$1',
  },
  // 快照测试配置
  snapshotSerializers: ['@emotion/jest/serializer'],
  // 收集覆盖率的目录
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    '!components/**/*.stories.{ts,tsx}',
    '!components/**/*.test.{ts,tsx}',
  ],
  // 视觉回归测试配置
  testMatch: ['**/__tests__/**/*.(test|spec).{js,ts,jsx,tsx}', '**/*.{test,spec}.{js,ts,jsx,tsx}'],
};

// 导出配置
module.exports = createJestConfig(customJestConfig);