"use client";

/**
 * @file Button组件
 * @description 通用按钮UI组件
 * @module components/ui/Button
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { forwardRef } from 'react';

// 按钮变体类型
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

// 按钮大小类型
export type ButtonSize = 'sm' | 'md' | 'lg';

// 按钮属性接口
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮变体
   */
  variant?: ButtonVariant;
  /**
   * 按钮大小
   */
  size?: ButtonSize;
  /**
   * 是否全宽
   */
  fullWidth?: boolean;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 子元素
   */
  children: React.ReactNode;
  /**
   * 类名
   */
  className?: string;
}

/**
 * 通用按钮组件
 * 支持多种变体和大小
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'default',
    size = 'md',
    fullWidth = false,
    disabled = false,
    className = '',
    children,
    ...props
  }, ref) => {
    // 变体样式
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    // 大小样式
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2 text-base',
      lg: 'h-11 px-8 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded-md font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:opacity-50 disabled:pointer-events-none ring-offset-background
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
