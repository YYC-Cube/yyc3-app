'use client'

/**
 * @file 主题上下文
 * @description 提供主题管理和切换功能
 * @module theme/ThemeContext
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { defaultTheme, type Theme } from './defaultTheme';

// 暗色主题定义
const darkTheme: Theme = {
  ...defaultTheme,
  name: 'dark',
  mode: 'dark',
  colors: {
    ...defaultTheme.colors,
    primary: {
      DEFAULT: '#60A5FA',
      50: '#1E293B',
      100: '#334155',
      200: '#475569',
      300: '#64748B',
      400: '#94A3B8',
      500: '#CBD5E1',
      600: '#E2E8F0',
      700: '#F1F5F9',
      800: '#F8FAFC',
      900: '#FFFFFF',
      950: '#FFFFFF',
    },
    background: {
      DEFAULT: '#111827',
      paper: '#1F2937',
      elevated: '#374151',
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
      disabled: '#9CA3AF',
      inverse: '#111827',
      link: '#60A5FA',
    },
    border: {
      DEFAULT: '#374151',
      hover: '#4B5563',
      focus: '#60A5FA',
      disabled: '#374151',
    },
  },
};


// 主题上下文类型定义
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者Props
interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: 'light' | 'dark';
}

/**
 * 主题提供者组件
 * 用于包裹应用，提供主题上下文
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'light',
}) => {
  // 从localStorage或系统偏好获取初始主题
  const getInitialTheme = (): boolean => {
    // 首先检查localStorage中是否有保存的主题偏好（只在浏览器环境中执行）
    if (typeof window !== 'undefined' && localStorage) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme === 'dark';
      }
    }
    
    // 如果没有保存的偏好，检查系统偏好
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // 默认返回初始模式
    return initialMode === 'dark';
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);
  
  // 根据当前模式选择主题
  const theme = isDarkMode ? darkTheme : defaultTheme;

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // 设置暗黑模式
  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  // 当主题变化时，更新localStorage和HTML元素的类
  useEffect(() => {
    // 保存主题偏好到localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // 更新HTML元素的类以支持全局样式
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // 设置data-theme属性，方便CSS选择器使用
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  // 添加系统主题变化监听
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // 只有在没有保存主题偏好时，才响应系统主题变化
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === null) {
          setIsDarkMode(e.matches);
        }
      };
      
      // 添加事件监听
      mediaQuery.addEventListener('change', handleChange);
      
      // 清理函数
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 主题上下文Hook
 * 在组件中使用主题
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme必须在ThemeProvider内部使用');
  }
  
  return context;
};

/**
 * 主题切换组件
 * 用于在UI中切换主题
 */
export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      type="button"
    >
      {isDarkMode ? (
        // 亮色模式图标（太阳）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5 text-yellow-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // 暗色模式图标（月亮）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5 text-blue-800"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeProvider;