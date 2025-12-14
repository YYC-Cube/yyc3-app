"use client";

/**
 * @file IconButton组件
 * @description 图标按钮UI组件
 * @module components/ui/IconButton
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { forwardRef } from 'react';

// 图标按钮变体类型
export type IconButtonVariant = 'default' | 'destructive' | 'secondary' | 'ghost' | 'outline';

// 图标按钮大小类型
export type IconButtonSize = 'sm' | 'md' | 'lg';

// 图标按钮属性接口
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮变体
   */
  variant?: IconButtonVariant;
  /**
   * 按钮大小
   */
  size?: IconButtonSize;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 子元素（图标）
   */
  children?: React.ReactNode;
  /**
   * 类名
   */
  className?: string;
}

/**
 * 图标按钮组件
 * 主要用于显示带有图标的按钮
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    variant = 'default',
    size = 'md',
    disabled = false,
    className = '',
    children,
    ...props
  }, ref) => {
    // 变体样式
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    };

    // 大小样式
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded-md transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:opacity-50 disabled:pointer-events-none ring-offset-background
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
