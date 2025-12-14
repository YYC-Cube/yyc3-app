/**
 * @file 按钮组件
 * @description 提供统一的按钮样式和交互效果
 * @module components/common/Button
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

interface ButtonProps {
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  /** 按钮大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 按钮组件
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  icon,
  rightIcon,
  onClick,
  className = '',
  children,
}) => {
  // 按钮基础样式
  const baseClasses = 'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  // 变体样式
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    text: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  };

  // 尺寸样式
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3',
  };

  // 禁用样式
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // 全宽样式
  const fullWidthClasses = fullWidth ? 'w-full' : '';

  // 组合所有样式
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    fullWidthClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;