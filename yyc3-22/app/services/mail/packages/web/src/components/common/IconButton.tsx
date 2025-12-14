/**
 * @file 图标按钮组件
 * @description 提供统一的图标按钮样式和交互效果
 * @module components/common/IconButton
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

interface IconButtonProps {
  /** 图标 */
  icon: React.ReactNode;
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large' | 'sm';
  /** 按钮变体 */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 提示文本 */
  tooltip?: string;
  /** 点击事件 */
  onClick?: (...args: any[]) => void;
  /** 自定义类名 */
  className?: string;
  /** 图标自定义类名 */
  iconClassName?: string;
}

/**
 * 图标按钮组件
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'medium',
  variant = 'default',
  disabled = false,
  loading = false,
  tooltip,
  onClick,
  className = '',
  iconClassName = '',
}) => {
  // 按钮基础样式
  const baseClasses = 'flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  // 尺寸类
  const sizeClasses: Record<string, string> = {
      small: 'h-8 w-8',
      sm: 'h-8 w-8', // sm作为small的别名
      medium: 'h-10 w-10',
      large: 'h-12 w-12'
    };

  // 变体样式
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  };

  // 禁用样式
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // 组合所有样式
  const buttonClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className,
  ].filter(Boolean).join(' ');

  // 图标尺寸
  const iconSizeClasses = {
    small: 'h-4 w-4',
    sm: 'h-4 w-4', // sm作为small的别名
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
  };

  // 组合图标样式
  const iconSizeClass = iconSizeClasses[size];
  const combinedIconClasses = [iconSizeClass, iconClassName].filter(Boolean).join(' ');

  // 加载动画
  const loadingIndicator = (
    <svg className={combinedIconClasses} fill="none" viewBox="0 0 24 24">
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      title={tooltip || ''}
    >
      {loading ? loadingIndicator : (
        <span className={combinedIconClasses}>{icon}</span>
      )}
    </button>
  );
};

export default IconButton;