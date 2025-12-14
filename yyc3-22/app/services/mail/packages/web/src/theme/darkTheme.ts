/**
 * @file 暗黑主题配置
 * @description 定义应用暗黑模式的颜色、字体、间距等设计系统
 * @module theme/darkTheme
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { defaultTheme } from './defaultTheme';
import type { Theme } from './defaultTheme';

// 暗黑模式颜色系统
const darkColors = {
  // 主色调（保持与默认主题一致，但在暗色背景上更突出）
  primary: {
    DEFAULT: '#60A5FA', // 稍微亮一点的蓝色
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#1D4ED8',
    300: '#2563EB',
    400: '#3B82F6',
    500: '#60A5FA',
    600: '#93C5FD',
    700: '#BFDBFE',
    800: '#DBEAFE',
    900: '#EFF6FF',
    950: '#1E293B',
  },
  
  // 辅助色
  secondary: {
    DEFAULT: '#A78BFA', // 稍微亮一点的紫色
    50: '#2E1065',
    100: '#4C1D95',
    200: '#5B21B6',
    300: '#6D28D9',
    400: '#7C3AED',
    500: '#8B5CF6',
    600: '#A78BFA',
    700: '#C4B5FD',
    800: '#DDD6FE',
    900: '#EDE9FE',
    950: '#1E1B4B',
  },
  
  // 功能色（在暗色背景上保持可辨识度）
  success: {
    DEFAULT: '#34D399',
    50: '#064E3B',
    100: '#065F46',
    200: '#047857',
    300: '#059669',
    400: '#10B981',
    500: '#34D399',
    600: '#6EE7B7',
    700: '#A7F3D0',
    800: '#D1FAE5',
    900: '#ECFDF5',
  },
  
  warning: {
    DEFAULT: '#FBBF24',
    50: '#78350F',
    100: '#92400E',
    200: '#B45309',
    300: '#D97706',
    400: '#F59E0B',
    500: '#FBBF24',
    600: '#FCD34D',
    700: '#FDE68A',
    800: '#FEF3C7',
    900: '#FFFBEB',
  },
  
  error: {
    DEFAULT: '#F87171',
    50: '#7F1D1D',
    100: '#991B1B',
    200: '#B91C1C',
    300: '#DC2626',
    400: '#EF4444',
    500: '#F87171',
    600: '#FCA5A5',
    700: '#FECACA',
    800: '#FEE2E2',
    900: '#FEF2F2',
  },
  
  // 中性色（暗黑模式特定）
  neutral: {
    DEFAULT: '#9CA3AF',
    50: '#1F2937',
    100: '#374151',
    200: '#4B5563',
    300: '#6B7280',
    400: '#9CA3AF',
    500: '#D1D5DB',
    600: '#E5E7EB',
    700: '#F3F4F6',
    800: '#F9FAFB',
    900: '#FFFFFF',
    950: '#030712',
  },
  
  // 特殊用途色（暗黑模式特定）
  background: {
    DEFAULT: '#111827', // 深灰黑色背景
    paper: '#1F2937', // 卡片背景
    elevated: '#374151', // 提升层级的背景
    disabled: '#374151',
  },
  
  surface: {
    DEFAULT: '#1F2937',
    100: '#374151',
    200: '#4B5563',
    300: '#6B7280',
  },
  
  text: {
    primary: '#F9FAFB', // 主文本使用亮色
    secondary: '#D1D5DB', // 次要文本使用稍暗的亮色
    disabled: '#6B7280',
    inverse: '#111827',
    link: '#60A5FA', // 链接使用亮蓝色
  },
  
  border: {
    DEFAULT: '#374151', // 边框使用深色
    hover: '#4B5563',
    focus: '#60A5FA',
    disabled: '#374151',
  },
};

// 暗黑主题配置（继承默认主题，覆盖颜色）
export const darkTheme: Theme = {
  ...defaultTheme,
  colors: darkColors,
  // 更新主题标识
  name: 'dark',
  mode: 'dark',
};

export default darkTheme;