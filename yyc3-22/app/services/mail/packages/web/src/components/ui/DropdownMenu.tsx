"use client";

/**
 * @file DropdownMenu组件
 * @description 下拉菜单UI组件
 * @module components/ui/DropdownMenu
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { ReactNode, useRef, useState } from 'react';

// DropdownMenu属性接口
export interface DropdownMenuProps {
  /**
   * 子元素
   */
  children: ReactNode;
}

// DropdownMenuTrigger属性接口
export interface DropdownMenuTriggerProps {
  /**
   * 作为子元素的组件
   */
  asChild?: boolean;
  /**
   * 子元素
   */
  children: ReactNode;
}

// DropdownMenuContent属性接口
export interface DropdownMenuContentProps {
  /**
   * 子元素
   */
  children: ReactNode;
  /**
   * 类名
   */
  className?: string;
}

// DropdownMenuItem属性接口
export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 子元素
   */
  children: ReactNode;
}

/**
 * 下拉菜单组件 - 容器
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative">{children}</div>;
};

/**
 * 下拉菜单触发器
 */
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ asChild = false, children }) => {
  const [open, setOpen] = useState(false);
  
  // 将open状态传递给父组件（通过context或props）
  React.useEffect(() => {
    // 当下拉菜单打开时，添加点击外部关闭的逻辑
    const handleClickOutside = () => {
      setOpen(false);
    };
    
    if (open) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };
  
  if (asChild) {
    // 如果提供了asChild，则将点击处理函数传递给子元素
    // 这里简化处理，实际项目中可能需要使用React.cloneElement或更复杂的处理
    const childElement = children as React.ReactElement<any>;
    return React.cloneElement(childElement, {
      ...(childElement.props || {}),
      onClick: (e: React.MouseEvent) => {
        (childElement.props?.onClick as Function)?.call(null, e);
        handleClick(e);
      },
      'data-open': open,
    });
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className="focus:outline-none"
    >
      {children}
    </button>
  );
};

/**
 * 下拉菜单内容容器
 */
export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, className = '' }) => {
  // 在实际实现中，这里应该获取父组件的open状态
  const open = true; // 简化处理，实际应该从context或props获取
  
  if (!open) return null;
  
  return (
    <div
      className={`
        absolute z-50 w-56 rounded-md border bg-card p-1 text-card-foreground shadow-lg
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=open]:fade-in-80 data-[state=closed]:fade-out-80
        data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * 下拉菜单项
 */
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      type="button"
      className={`
        flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm
        transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default DropdownMenu;
