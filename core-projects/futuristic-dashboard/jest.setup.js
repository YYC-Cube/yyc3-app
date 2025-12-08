/**
 * @file Jest测试环境配置文件
 * @description 设置全局测试环境和工具
 * @author YYC
 * @created 2024-10-15
 */

// 导入React Testing Library的扩展
import '@testing-library/jest-dom';

// 模拟framer-motion动画
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const MockComponent = ({ children, ...props }) => {
        return <div {...props}>{children}</div>;
      };
      MockComponent.displayName = 'motion.div';
      return <MockComponent {...props}>{children}</MockComponent>;
    },
    // 添加其他可能用到的motion组件模拟
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children, ...props }) => {
    return <>{children}</>;
  },
}));

// 模拟Next.js的useRouter钩子
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// 模拟next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: jest.fn(),
    resolvedTheme: 'dark',
    isLoading: false,
  }),
}));

// 模拟IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(),
  })),
});

// 模拟requestAnimationFrame
jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
  return setTimeout(callback, 0);
});

// 全局错误处理器
global.console.error = jest.fn((error) => {
  // 记录错误但不中断测试
  console.log('Test Error:', error);
});