"use client";

/**
 * @file Input组件
 * @description 输入框基础UI组件
 * @module components/ui/Input
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { ChangeEvent, FocusEvent, InputHTMLAttributes, forwardRef } from 'react';

// 输入框组件属性接口
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /**
   * 错误状态
   */
  error?: boolean;
  /**
   * 输入前缀组件
   */
  prefix?: React.ReactNode;
  /**
   * 输入后缀组件
   */
  suffix?: React.ReactNode;
  /**
   * 输入状态改变回调
   */
  onInputChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * 输入框组件
 * 提供可访问、样式化的文本输入UI
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  error = false,
  prefix,
  suffix,
  onInputChange,
  className = '',
  onChange,
  ...props
}, ref) => {
  // 处理输入变化
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // 调用原生onChange
    if (onChange) {
      onChange(event);
    }
    // 调用自定义onInputChange
    if (onInputChange) {
      onInputChange(event.target.value, event);
    }
  };

  // 构建输入框基础类名
  const inputBaseClass = `
    w-full min-h-[36px] px-3 py-2
    bg-transparent border rounded-md
    text-neutral-900 placeholder-neutral-400
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-all duration-200
  `;

  // 根据状态添加类名
  const inputClasses = `
    ${inputBaseClass}
    ${error 
      ? 'border-error focus:border-error focus:ring-error/30' 
      : 'border-neutral-300 focus:border-primary focus:ring-primary/30'}
    ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-400'}
  `;

  // 是否有前缀或后缀
  const hasPrefixOrSuffix = !!prefix || !!suffix;

  // 如果有前缀或后缀，使用包装容器
  if (hasPrefixOrSuffix) {
    return (
      <div className={`relative inline-flex items-center w-full ${className}`}>
        {prefix && (
          <div className="absolute left-3 pointer-events-none text-neutral-500">
            {prefix}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${inputClasses} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
          onChange={handleChange}
          {...props}
        />
        
        {suffix && (
          <div className="absolute right-3 pointer-events-none text-neutral-500">
            {suffix}
          </div>
        )}
      </div>
    );
  }

  // 基础输入框
  return (
    <input
      ref={ref}
      className={inputClasses}
      onChange={handleChange}
      {...props}
    />
  );
});

// 设置组件显示名称
Input.displayName = 'Input';

export default Input;
