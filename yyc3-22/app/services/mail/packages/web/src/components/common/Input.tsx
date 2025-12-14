/**
 * @file 输入框组件
 * @description 提供统一的输入框样式和状态管理
 * @module components/common/Input
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 标签文本 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 右侧内容 */
  rightElement?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 容器自定义类名 */
  containerClassName?: string;
}

/**
 * 输入框组件
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightElement,
  className = '',
  containerClassName = '',
  ...rest
}) => {
  // 输入框基础样式
  const baseClasses = 'flex-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  // 状态样式
  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 focus:border-transparent';

  // 尺寸样式（默认中等）
  const sizeClasses = 'py-2 px-3 text-sm';

  // 有图标时的内边距
  const iconClasses = icon ? 'pl-9' : '';

  // 组合所有样式
  const inputClasses = [
    baseClasses,
    stateClasses,
    sizeClasses,
    iconClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      {label && (
        <label 
          htmlFor={rest.id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={inputClasses}
          {...rest}
        />
        
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;