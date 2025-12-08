/**
 * @file Storybook预览配置文件
 * @description 设置全局参数和装饰器，确保组件展示一致性
 * @author YYC
 * @created 2024-10-15
 */

import type { Preview } from '@storybook/react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth/auth-context';
import '../app/globals.css';

// 全局参数设置
const preview: Preview = {
  parameters: {
    // 背景颜色设置，支持浅色和深色主题
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
        { name: 'system', value: 'system' },
      ],
    },
    // 控制故事展示的视口尺寸
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '720px' } },
      },
    },
    // 自动生成文档的配置
    docs: {
      source: {
        type: 'auto',
      },
    },
    // 交互测试配置
    interactions: {
      debug: true,
    },
  },

  // 全局装饰器，包装所有故事
  decorators: [
    // 添加主题提供者
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Story />
      </ThemeProvider>
    ),
    // 添加认证提供者
    (Story) => <AuthProvider>{Story()}</AuthProvider>,
    // 为组件提供一致的容器样式
    (Story) => (
      <div className="min-h-screen p-4 bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;