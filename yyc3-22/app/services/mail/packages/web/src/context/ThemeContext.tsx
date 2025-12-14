"use client";

/**
 * @file 主题上下文管理
 * @description 提供应用主题切换和状态管理功能
 * @module context/ThemeContext
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultTheme } from '../theme/defaultTheme';
import type { Theme } from '../theme/defaultTheme';

// 主题上下文接口
type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 简单的暗黑主题配置（基于默认主题修改）
const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    // 保持默认主题的嵌套颜色结构
    primary: {
      ...defaultTheme.colors.primary,
    },
    background: {
      DEFAULT: '#111827',
      paper: '#1F2937',
      elevated: '#1F2937',
      disabled: '#374151',
    },
    surface: {
      DEFAULT: '#1F2937',
      100: '#374151',
      200: '#4B5563',
      300: '#6B7280',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
      inverse: '#111827',
      link: '#93C5FD',
    },
    border: {
      DEFAULT: '#374151',
      hover: '#4B5563',
      focus: '#60A5FA',
      disabled: '#374151',
    },
  },
  name: 'dark',
  mode: 'dark',
};

// 主题提供者Props接口
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 主题提供者组件
 * 管理应用的主题状态和切换功能
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初始化主题状态，优先从localStorage读取，否则根据系统偏好设置
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark';
    }
    // 默认使用系统偏好设置
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 当前主题
  const [theme, setTheme] = useState<Theme>(isDarkMode ? darkTheme : defaultTheme);

  // 切换主题函数
  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    setTheme(newIsDarkMode ? darkTheme : defaultTheme);
  };

  // 更新文档的data-theme属性
  useEffect(() => {
    document.documentElement.dataset.theme = theme.mode;
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');
  }, [theme.mode]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme');
      // 只有在没有明确保存的主题偏好时，才响应系统主题变化
      if (!savedTheme) {
        setIsDarkMode(e.matches);
        setTheme(e.matches ? darkTheme : defaultTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 提供主题上下文值
  const contextValue: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 主题上下文钩子
 * 在组件中使用主题状态和功能
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeProvider;
