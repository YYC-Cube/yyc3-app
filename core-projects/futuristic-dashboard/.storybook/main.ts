/**
 * @file Storybook主配置文件
 * @description 配置Storybook构建和插件
 * @author YYC
 * @created 2024-10-15
 */

import type { StorybookConfig } from '@storybook/nextjs';

export default {
  stories: [
    '../components/**/*.mdx',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    // 视觉回归测试插件
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    'storybook-addon-themes',
    'storybook-addon-tailwindcss',
    // Chromatic用于视觉回归测试
    'chromatic',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  // 配置webpack以支持Tailwind CSS和自定义主题
  webpackFinal: async (config) => {
    // 添加Tailwind CSS支持
    if (config.module?.rules) {
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['tailwindcss', 'autoprefixer'],
              },
            },
          },
        ],
        include: __dirname,
      });
    }
    return config;
  },
} as StorybookConfig;