/**
 * @file 行业图标映射系统
 * @description 为24个行业分类提供对应的图标显示功能
 * @module industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 * @updated 2024-11-21
 */

"use client"

import React from "react";
import type { IndustryType } from "../../types/industry";

// 导入所有可用图标
import {
  Building,
  ShoppingCart,
  BarChart3,
  Server,
  Database,
  Network,
  Shield,
  FileText,
  Cpu,
  Globe,
  TrendingUp,
  Package,
  Truck,
  Mail,
  HardDrive,
  Settings,
  Activity,
  Users,
  ChevronRight,
  Heart,
  Calendar,
  Filter,
  Zap,
  Info,
} from "../icons";

/**
 * 行业图标映射接口
 */
interface IndustryIconMap {
  [key: string]: React.ComponentType<{ className?: string; size?: number }>;
}

/**
 * 行业图标映射表 - 为24个行业分类提供对应的图标
 */
export const industryIconMap: IndustryIconMap = {
  // 云数据中心
  "yyc3-dc": Server,
  // 金融科技
  "yyc3-finance": BarChart3,
  // 智慧医疗
  "yyc3-healthcare": Heart,
  // 智能制造
  "yyc3-manufacturing": Cpu,
  // 新零售
  "yyc3-retail": ShoppingCart,
  // 能源管理
  "yyc3-energy": Zap,
  // 智慧交通
  "yyc3-transport": Truck,
  // 智慧教育
  "yyc3-education": FileText,
  // 智慧政务
  "yyc3-government": Building,
  // 安全防护
  "yyc3-security": Shield,
  // 物联网
  "yyc3-iot": Network,
  // 人工智能
  "yyc3-ai": Brain,
  // 大数据
  "yyc3-bigdata": Database,
  // 云计算
  "yyc3-cloud": Cloud,
  // 区块链
  "yyc3-blockchain": Chain,
  // 5G应用
  "yyc3-5g": Wifi,
  // 机器人
  "yyc3-robotics": Cpu,
  // VR/AR
  "yyc3-vr": Activity,
  // 智慧物流
  "yyc3-logistics": Truck,
  // 智慧建筑
  "yyc3-construction": Building,
  // 智慧农业
  "yyc3-agriculture": Activity,
  // 环境监测
  "yyc3-environment": Activity,
  // 文化传媒
  "yyc3-media": Info,
  // 体育健康
  "yyc3-sports": Heart,
  
  // 默认图标
  "default": Info,
};

// 由于图标库中缺少的一些图标，我们需要添加这些组件
const Brain = (props: { className?: string; size?: number }) => (
  <SvgIcon {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.19.25-2.31.68-3.33.44 3.22 3.36 5.77 6.72 6.09v-1.61c-2.54-.24-4.5-1.62-4.5-3.86 0-2.31 2.11-4.19 4.6-4.19 2.77 0 4.5 2.08 4.5 4.67 0 2.85-2.23 4.46-5.19 4.46-.84 0-1.62-.22-2.27-.61l2.54 2.54c.42-.59.86-1.14 1.3-1.72H12v1.73c2.97-.17 5.36-1.99 5.36-5.19 0-3.52-3.13-6.18-6.8-6.18-4.47 0-7.2 3.27-7.2 7.6 0 4.86 3.5 7.65 8 7.65.67 0 1.32-.08 1.94-.23l-2.67-2.67c-.57.35-1.27.55-2.05.55H12z" />
  </SvgIcon>
);

const Cloud = (props: { className?: string; size?: number }) => (
  <SvgIcon {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </SvgIcon>
);

const Chain = (props: { className?: string; size?: number }) => (
  <SvgIcon {...props}>
    <path d="M16 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM8 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM8 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-3.5 0c1.1-1.1 1.1-2.9 0-4-1.1-1.1-2.9-1.1-4 0s-1.1 2.9 0 4c1.1 1.1 2.9 1.1 4 0zm15 0c1.1-1.1 1.1-2.9 0-4-1.1-1.1-2.9-1.1-4 0s-1.1 2.9 0 4c1.1 1.1 2.9 1.1 4 0zM8 5.5c1.1-1.1 1.1-2.9 0-4-1.1-1.1-2.9-1.1-4 0S2.9 4.4 4 5.5s2.9 1.1 4 0zm8 0c1.1-1.1 1.1-2.9 0-4-1.1-1.1-2.9-1.1-4 0s-1.1 2.9 0 4c1.1 1.1 2.9 1.1 4 0z" />
  </SvgIcon>
);

const Wifi = (props: { className?: string; size?: number }) => (
  <SvgIcon {...props}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </SvgIcon>
);

/**
 * 根据行业类型获取对应的图标组件
 * @param industryType 行业类型枚举值
 * @returns React组件 - 对应的行业图标组件
 */
export const getIndustryIcon = (industryType: IndustryType | string): React.ComponentType<{ className?: string; size?: number }> => {
  // 转换为小写以确保匹配一致性
  const typeKey = industryType.toLowerCase();
  
  // 返回对应的图标组件，如果没有匹配则返回默认图标
  return industryIconMap[typeKey] || industryIconMap["default"];
};

/**
 * 行业图标组件 - 简化使用方式
 * @param industryType 行业类型
 * @param className CSS类名
 * @param size 图标大小
 * @returns React.ReactNode - 渲染的图标
 */
export const IndustryIcon: React.FC<{
  industryType: IndustryType | string;
  className?: string;
  size?: number;
}> = ({ industryType, className = "", size = 20 }) => {
  const IconComponent = getIndustryIcon(industryType);
  
  return <IconComponent className={className} size={size} />;
};

/**
 * 获取所有行业类型及其对应的图标组件
 * @returns 行业类型与图标组件的映射数组
 */
export const getAllIndustryIcons = (): Array<{ type: string; icon: React.ComponentType<{ className?: string; size?: number }> }> => {
  return Object.entries(industryIconMap)
    .filter(([type]) => type !== "default")
    .map(([type, icon]) => ({ type, icon }));
};

/**
 * 行业图标类型别名 - 用于类型检查
 */
export type IndustryIconType = keyof typeof industryIconMap;
