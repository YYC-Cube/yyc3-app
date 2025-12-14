/**
 * @file Jest 配置文件
 * @description 测试环境配置
 * @author YYC
 */

module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
  ],
  moduleNameMapper: {
    // 处理 Next.js 别名
    '^@/(.*)$': '<rootDir>/src/$1',
    // 处理静态资源
    '^.+\.(jpg|jpeg|png|gif|webp|avif|svg|css|less|scss)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: ['/node_modules/', '^.+\.module\.(css|sass|scss)$'],
};
