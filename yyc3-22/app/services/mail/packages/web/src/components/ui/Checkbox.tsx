"use client";

/**
 * @file Checkbox组件
 * @description 复选框基础UI组件
 * @module components/ui/Checkbox
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { ChangeEvent, useState } from 'react';

// Checkbox组件属性接口
interface CheckboxProps {
  /**
   * 复选框选中状态
   */
  checked?: boolean;
  /**
   * 默认选中状态（非受控模式）
   */
  defaultChecked?: boolean;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 错误状态
   */
  error?: boolean;
  /**
   * 状态改变回调函数
   */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /**
   * 复选框值
   */
  value?: string;
  /**
   * 复选框名称
   */
  name?: string;
  /**
   * 附加的CSS类名
   */
  className?: string;
}

/**
 * 复选框组件
 * 提供可访问、样式化的复选框UI
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked,
  disabled = false,
  error = false,
  onChange,
  value,
  name,
  className = '',
}) => {
  // 非受控模式下的内部状态
  const [internalChecked, setInternalChecked] = useState<boolean>(
    defaultChecked || false
  );

  // 判断是否为受控模式
  const isControlled = checked !== undefined;
  // 当前选中状态
  const currentChecked = isControlled ? checked : internalChecked;

  // 处理复选框变化事件
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    
    // 非受控模式下更新内部状态
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    
    // 调用外部变化回调
    if (onChange) {
      onChange(newChecked, event);
    }
  };

  return (
    <label className={`inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={currentChecked}
        onChange={handleChange}
        disabled={disabled}
        value={value}
        name={name}
        className={`
          sr-only peer
        `}
        aria-checked={currentChecked}
        aria-disabled={disabled}
      />
      <div
        className={`
          w-5 h-5 flex items-center justify-center
          border border-neutral-300 rounded transition-all
          peer-checked:bg-primary peer-checked:border-primary
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
          ${error ? 'border-error' : 'border-neutral-300'}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/70'}
        `}
      >
        {currentChecked && (
          <svg
            className="w-4 h-4 text-white"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </label>
  );
};

export default Checkbox;
