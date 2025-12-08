/**
 * @file YYC³ 设计令牌系统
 * @description 统一管理项目中的所有设计令牌，确保风格一致性
 * @module design-tokens
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { type ClassValue } from "clsx"
import { cn } from "@/lib/utils"

/**
 * 🎨 基础色彩令牌
 */
export const colors = {
  // 基础灰度
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // 科技蓝色系
  tech: {
    blue: '#3B82F6',
    blueDark: '#2563EB',
    blueLight: '#60A5FA',
    cyan: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899'
  },

  // 功能性颜色
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4'
  }
}

/**
 * 📏 间距令牌（基于8px网格系统）
 */
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '1rem',      // 16px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '3rem',      // 48px
  '2xl': '4rem',   // 64px
  '3xl': '6rem'    // 96px
}

/**
 * 🔤 字体令牌
 */
export const typography = {
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }]
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  }
}

/**
 * 🌙 阴影令牌
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  
  // 科技感发光效果
  glow: {
    blue: '0 0 20px rgba(59, 130, 246, 0.5)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.5)',
    purple: '0 0 20px rgba(139, 92, 246, 0.5)'
  }
}

/**
 * 🎭 动画令牌
 */
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms'
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // 科技感缓动
    futuristic: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
}

/**
 * 🔘 边框令牌
 */
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  
  width: {
    none: '0',
    thin: '1px',
    base: '2px',
    thick: '4px',
    thicker: '8px'
  }
}

/**
 * 📱 响应式断点
 */
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

/**
 * 🌈 科技感主题配置
 */
export const futuristicTheme = {
  // 背景渐变
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    tech: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    dark: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
    
    // 网格背景
    grid: `
      linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
    `
  },
  
  // 毛玻璃效果
  glassmorphism: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.1)'
  },
  
  // 发光边框效果
  glowBorders: {
    blue: '1px solid rgba(59, 130, 246, 0.5)',
    cyan: '1px solid rgba(6, 182, 212, 0.5)',
    purple: '1px solid rgba(139, 92, 246, 0.5)'
  }
}

/**
 * 🛠️ 工具函数
 */
export const designUtils = {
  /**
   * 生成响应式类名
   */
  responsive: (base: string, variants: Record<string, string> = {}) => {
    return cn(base, variants.sm && `sm:${variants.sm}`, variants.md && `md:${variants.md}`, variants.lg && `lg:${variants.lg}`, variants.xl && `xl:${variants.xl}`)
  },
  
  /**
   * 生成科技感卡片样式
   */
  futuristicCard: (className?: ClassValue) => {
    return cn(
      'bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-lg',
      'shadow-lg shadow-slate-900/20',
      'transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/30',
      'hover:border-slate-600/50',
      className
    )
  },
  
  /**
   * 生成发光按钮样式
   */
  glowButton: (color: 'blue' | 'cyan' | 'purple' = 'blue', intensity: 'low' | 'medium' | 'high' = 'medium') => {
    const colorMap = {
      blue: { low: 'hover:shadow-blue-500/20', medium: 'hover:shadow-blue-500/30', high: 'hover:shadow-blue-500/40' },
      cyan: { low: 'hover:shadow-cyan-500/20', medium: 'hover:shadow-cyan-500/30', high: 'hover:shadow-cyan-500/40' },
      purple: { low: 'hover:shadow-purple-500/20', medium: 'hover:shadow-purple-500/30', high: 'hover:shadow-purple-500/40' }
    }
    
    return cn(
      'bg-blue-600/20 border border-blue-500/50 text-blue-400',
      'transition-all duration-300',
      'hover:bg-blue-600/30 hover:border-blue-400',
      'hover:shadow-lg',
      colorMap[color][intensity],
      'active:scale-95'
    )
  },
  
  /**
   * 生成渐变背景
   */
  gradient: (type: keyof typeof futuristicTheme.gradients) => {
    return futuristicTheme.gradients[type]
  }
}

/**
 * 📦 导出所有令牌
 */
export const tokens = {
  colors,
  spacing,
  typography,
  shadows,
  animations,
  borders,
  breakpoints,
  futuristicTheme,
  ...designUtils
}

export default tokens