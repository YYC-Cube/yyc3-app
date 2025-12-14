/**
 * @file 默认主题配置
 * @description 定义应用默认主题的颜色、字体、间距等设计系统
 * @module theme/defaultTheme
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 颜色系统
export const colors = {
  // 主色调
  primary: {
    DEFAULT: '#3B82F6', // 蓝色
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
  
  // 辅助色
  secondary: {
    DEFAULT: '#8B5CF6', // 紫色
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    950: '#2E1065',
  },
  
  // 功能色
  success: {
    DEFAULT: '#10B981',
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  warning: {
    DEFAULT: '#F59E0B',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  error: {
    DEFAULT: '#EF4444',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // 中性色
  neutral: {
    DEFAULT: '#6B7280',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // 特殊用途色
  background: {
    DEFAULT: '#FFFFFF',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    disabled: '#F3F4F6',
  },
  
  surface: {
    DEFAULT: '#FFFFFF',
    100: '#F9FAFB',
    200: '#F3F4F6',
    300: '#E5E7EB',
  },
  
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#3B82F6',
  },
  
  border: {
    DEFAULT: '#E5E7EB',
    hover: '#D1D5DB',
    focus: '#3B82F6',
    disabled: '#E5E7EB',
  },
};

// 字体系统
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'Consolas',
      'Monaco',
      'Courier New',
      'monospace',
    ],
  },
  
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
  },
  
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// 间距系统
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
};

// 圆角系统
export const borderRadius = {
  none: '0px',
  sm: '0.125rem', // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// 阴影系统
export const boxShadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  // 自定义阴影样式
  sidebarRight: '3px 0 10px rgba(59, 130, 246, 0.3)',
  cardLeft: '-4px 0 12px rgba(59, 130, 246, 0.3)',
};

// 过渡动画系统
export const transitions = {
  duration: {
    shortest: '150ms',
    shorter: '200ms',
    short: '250ms',
    DEFAULT: '300ms',
    long: '350ms',
    longer: '400ms',
    longest: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Z-index系统
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  100: 100,
  // 特殊层级
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
};

// 断点系统
export const breakpoints = {
  xs: '360px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 组件特定配置
export const components = {
  // 按钮配置
  button: {
    minWidth: '80px',
    minHeight: '32px',
    padding: {
      xs: '2px 6px',
      sm: '4px 10px',
      md: '6px 16px',
      lg: '8px 20px',
      xl: '10px 24px',
    },
    fontSize: {
      xs: typography.fontSize.xs,
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
      xl: typography.fontSize.xl,
    },
  },
  
  // 输入框配置
  input: {
    minHeight: '36px',
    padding: '8px 12px',
    fontSize: typography.fontSize.base,
    borderWidth: '1px',
  },
  
  // 卡片配置
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: '1px',
  },
  
  // 菜单配置
  menu: {
    itemHeight: '32px',
    padding: '0 12px',
    fontSize: typography.fontSize.base,
  },
};

// 默认主题
export const defaultTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  transitions,
  zIndex,
  breakpoints,
  components,
  // 主题标识
  name: 'default',
  mode: 'light',
};

// 导出类型
export type Theme = typeof defaultTheme;
export type ColorPalette = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type BoxShadow = typeof boxShadow;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type ComponentConfig = typeof components;

export default defaultTheme;