/**
 * @file Jest测试配置
 * @description 配置Jest测试环境和选项
 * @author YYC
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json'],
  
  // 覆盖率配置
  collectCoverageFrom: [
    '**/services/**/*.js',
    '**/routes/**/*.js',
    '**/controllers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },
  
  // 测试运行超时
  testTimeout: 30000,
  
  // 模拟的模块
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 清除模拟调用
  clearMocks: true,
  
  // 收集覆盖率的目录
  coverageDirectory: 'coverage'
};
