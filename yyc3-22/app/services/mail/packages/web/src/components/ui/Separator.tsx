"use client";

/**
 * @file Separator组件
 * @description 分隔线UI组件
 * @module components/ui/Separator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

// Separator变体类型
export type SeparatorOrientation = 'horizontal' | 'vertical';

// Separator属性接口
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 分隔线方向
   */
  orientation?: SeparatorOrientation;
  /**
   * 是否虚线
   */
  decorative?: boolean;
  /**
   * 类名
   */
  className?: string;
}

/**
 * 分隔线组件
 * 用于分隔内容区域
 */
export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  decorative = false,
  className = '',
  ...props
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <div
      className={`
        ${decorative
          ? isVertical
            ? 'bg-transparent border-l border-dashed border-border'
            : 'bg-transparent border-t border-dashed border-border'
          : isVertical
          ? 'bg-border w-px'
          : 'bg-border h-px'
        }
        ${isVertical ? 'h-full' : 'w-full'}
        ${className}
      `}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
};

export default Separator;
