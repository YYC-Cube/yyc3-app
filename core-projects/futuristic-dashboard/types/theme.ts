/**
 * @file 主题类型定义
 * @description 提供主题相关的TypeScript类型支持
 * @author YYC
 * @created 2024-10-15
 */

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 颜色类型定义
 */
export interface ThemeColors {
  // 主色调
  primary: string;
  'primary-foreground': string;
  
  // 辅助色
  secondary: string;
  'secondary-foreground': string;
  
  // 强调色
  accent: string;
  'accent-foreground': string;
  
  // 破坏性/警告色
  destructive: string;
  'destructive-foreground': string;
  warning: string;
  'warning-foreground': string;
  
  // 中性色
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  muted: string;
  'muted-foreground': string;
  border: string;
  input: string;
  ring: string;
  
  // 状态色
  success: string;
  'success-foreground': string;
  error: string;
  'error-foreground': string;
  info: string;
  'info-foreground': string;
}

/**
 * 字体类型定义
 */
export interface ThemeFonts {
  sans: string;
  mono: string;
  
  // 字重
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

/**
 * 字体大小类型定义
 */
export interface ThemeFontSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
}

/**
 * 行高类型定义
 */
export interface ThemeLineHeights {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

/**
 * 间距类型定义
 */
export interface ThemeSpacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
}

/**
 * 圆角类型定义
 */
export interface ThemeRadius {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

/**
 * 阴影类型定义
 */
export interface ThemeShadows {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/**
 * 过渡类型定义
 */
export interface ThemeTransitions {
  'duration-fast': string;
  'duration-normal': string;
  'duration-slow': string;
  'timing-ease': string;
  'timing-linear': string;
  'timing-ease-in': string;
  'timing-ease-out': string;
  'timing-ease-in-out': string;
  'all': string;
  'colors': string;
  'transform': string;
  'opacity': string;
}

/**
 * 容器宽度类型定义
 */
export interface ThemeContainers {
  'max-w-xs': string;
  'max-w-sm': string;
  'max-w-md': string;
  'max-w-lg': string;
  'max-w-xl': string;
  'max-w-2xl': string;
  'max-w-3xl': string;
  'max-w-4xl': string;
  'max-w-5xl': string;
  'max-w-6xl': string;
  'max-w-7xl': string;
  'max-w-full': string;
}

/**
 * 断点类型定义
 */
export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * 完整主题类型定义
 */
export interface Theme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  fontSize: ThemeFontSizes;
  lineHeight: ThemeLineHeights;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  transitions: ThemeTransitions;
  containers: ThemeContainers;
  breakpoints: ThemeBreakpoints;
}

/**
 * 主题配置选项
 */
export interface ThemeConfig {
  initialColorMode: ThemeMode;
  disableTransitionOnChange?: boolean;
  respectPrefersColorScheme?: boolean;
}

/**
 * 主题上下文类型
 */
export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
}