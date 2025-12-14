'use client';

/**
 * @file 客户端Body组件
 * @description 用于避免浏览器扩展添加的data属性导致的水合不匹配问题
 * @module app/client-body
 * @author YYC
 */

interface ClientBodyProps {
  children: React.ReactNode;
  className: string;
}

/**
 * 客户端Body组件 - 隔离客户端渲染逻辑
 */
export function ClientBody({ children, className }: ClientBodyProps) {
  return <body className={className}>{children}</body>;
}