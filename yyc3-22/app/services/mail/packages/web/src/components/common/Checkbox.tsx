/**
 * @file 复选框组件
 * @description 提供统一的复选框样式和状态管理
 * @module components/common/Checkbox
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

interface CheckboxProps {
  /** 是否选中 */
  checked?: boolean;
  /** 是否半选中状态（用于全选功能） */
  indeterminate?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签文本 */
  label?: string;
  /** 变更事件 */
  onChange?: (checked: boolean) => void;
  /** 自定义类名 */
  className?: string;
  /** 标签自定义类名 */
  labelClassName?: string;
}

/**
 * 复选框组件
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
  className = '',
  labelClassName = '',
}) => {
  // 处理复选框变更事件
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  // 复选框样式
  const checkboxClasses = [
    'h-4 w-4 rounded border flex items-center justify-center',
    disabled 
      ? 'border-gray-300 bg-gray-100' 
      : checked 
        ? 'border-blue-600 bg-blue-600 text-white' 
        : 'border-gray-300 bg-white',
    className,
  ].filter(Boolean).join(' ');

  // 标签样式
  const labelClasses = [
    'ml-2 text-sm font-medium',
    disabled 
      ? 'text-gray-400' 
      : 'text-gray-700',
    labelClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        data-indeterminate={indeterminate}
      />
      <div 
        className={checkboxClasses}
        onClick={!disabled ? () => onChange && onChange(!checked) : undefined}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {indeterminate && !disabled && (
          <div className="h-1.5 w-3 bg-white"></div>
        )}
        {checked && !indeterminate && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            className="h-3 w-3"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </div>
      {label && (
        <label 
          className={labelClasses}
          onClick={!disabled ? () => onChange && onChange(!checked) : undefined}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;