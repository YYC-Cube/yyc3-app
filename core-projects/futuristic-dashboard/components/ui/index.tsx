/**
 * @file UI组件库入口
 * @description 导出所有UI组件
 * @module components/ui
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React from 'react';

// 创建简单的占位组件
export const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
};

export const Alert = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const Card = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const Checkbox = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input type="checkbox" {...props} />;
};

export const Dialog = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input {...props} />;
};

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  return <select {...props} />;
};

export const Slider = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input type="range" {...props} />;
};

export const Table = ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
  return <table {...props}>{children}</table>;
};

export const Tag = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span {...props}>{children}</span>;
};

export const Tooltip = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const Switch = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input type="checkbox" {...props} />;
};
