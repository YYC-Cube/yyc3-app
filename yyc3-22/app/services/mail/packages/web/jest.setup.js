/**
 * @file Jest 初始化文件
 * @description 配置测试环境和全局变量
 * @author YYC
 */

// 导入测试库
import '@testing-library/jest-dom';

// 模拟 Next.js 的 router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// 模拟全局对象
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
  };
};

// 模拟 ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
