/**
 * @file 卡片组件
 * @description 提供统一的卡片容器样式
 * @module components/common/Card
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

interface CardProps {
  /** 卡片标题 */
  title?: string;
  /** 卡片标题右侧内容 */
  titleRight?: React.ReactNode;
  /** 卡片描述 */
  description?: string;
  /** 是否有阴影 */
  shadow?: boolean;
  /** 是否有边框 */
  border?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 头部自定义类名 */
  headerClassName?: string;
  /** 内容自定义类名 */
  contentClassName?: string;
  /** 底部自定义类名 */
  footerClassName?: string;
  /** 卡片底部内容 */
  footer?: React.ReactNode;
  /** 子元素 */
  children: React.ReactNode;
  /** 是否启用悬停效果 */
  hoverEffect?: boolean;
}

/**
 * 卡片组件
 */
export const Card: React.FC<CardProps> = ({
  title,
  titleRight,
  description,
  shadow = true,
  border = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
  footer,
  children,
  hoverEffect = true,
}) => {
  // 是否有头部内容
  const hasHeader = title || description;
  
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      {hasHeader && (
        <div className={`p-4 border-b border-gray-200 dark:border-gray-800 ${headerClassName}`}>
          {title && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
              {titleRight}
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className={`p-4 ${contentClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;