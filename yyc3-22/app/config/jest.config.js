/**
 * @file Jest 配置文件
 * @description 配置 Jest 测试框架的运行环境和选项
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

module.exports = {
  // 根目录，用于解析模块路径
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '**/tests/**/*.test.(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.github/'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 模块路径映射，用于解析别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 代码覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },
  
  // 测试运行环境
  testEnvironment: 'node',
  
  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // 转换忽略的文件
  transformIgnorePatterns: ['/node_modules/'],
  
  // 是否显示详细的测试结果
  verbose: true,
  
  // 并行测试运行数量
  maxWorkers: '50%',
  
  // 用于 CI 环境的设置
  ci: false,
  
  // 每个测试的超时时间（毫秒）
  testTimeout: 30000,
  
  // 快照序列化器
  snapshotSerializers: [],
  
  // 全局设置文件
  setupFiles: ['<rootDir>/tests/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
  
  // 隔离模块
  isolatedModules: false,
  
  // 性能配置
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  
  // 运行失败的测试优先
  failFast: false,
  
  // 缓存配置
  cacheDirectory: '<rootDir>/.jest/cache'
};
