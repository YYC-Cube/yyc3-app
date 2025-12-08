/**
 * @file 行业类型定义
 * @description 定义行业相关的TypeScript类型和接口
 * @module types/industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * 行业类型ID - 24个主要行业分类
 */
export type IndustryType = 
  | 'yyc3-dc'            // 云数据中心
  | 'yyc3-finance'       // 金融科技
  | 'yyc3-healthcare'    // 智慧医疗
  | 'yyc3-manufacturing' // 智能制造
  | 'yyc3-retail'        // 新零售
  | 'yyc3-energy'        // 能源管理
  | 'yyc3-transport'     // 智慧交通
  | 'yyc3-education'     // 智慧教育
  | 'yyc3-government'    // 智慧政务
  | 'yyc3-security'      // 安全防护
  | 'yyc3-iot'           // 物联网
  | 'yyc3-ai'            // 人工智能
  | 'yyc3-bigdata'       // 大数据
  | 'yyc3-cloud'         // 云计算
  | 'yyc3-blockchain'    // 区块链
  | 'yyc3-5g'            // 5G应用
  | 'yyc3-robotics'      // 机器人
  | 'yyc3-vr'            // VR/AR
  | 'yyc3-logistics'     // 智慧物流
  | 'yyc3-construction'  // 智慧建筑
  | 'yyc3-agriculture'   // 智慧农业
  | 'yyc3-environment'   // 环境监测
  | 'yyc3-media'         // 文化传媒
  | 'yyc3-sports'        // 体育健康
  | string;  // 允许扩展的自定义行业ID

/**
 * 行业状态
 */
export type IndustryStatus = 'active' | 'inactive' | 'pending' | 'archived';

/**
 * 行业配置接口
 */
export interface IndustryConfig {
  /**
   * 行业名称
   */
  name: string;
  
  /**
   * 行业描述
   */
  description: string;
  
  /**
   * 子域名
   */
  subdomain: string;
  
  /**
   * 行业图标
   */
  icon: string;
  
  /**
   * 主题配置
   */
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  
  /**
   * 代理设置
   */
  proxySettings?: {
    enabled: boolean;
    endpoint?: string;
    headers?: Record<string, string>;
  };
}

/**
 * 行业数据模型
 */
export interface Industry extends IndustryConfig {
  /**
   * 行业ID
   */
  id: IndustryType;
  
  /**
   * 行业状态
   */
  status: IndustryStatus;
  
  /**
   * 创建时间
   */
  createdAt: Date;
  
  /**
   * 更新时间
   */
  updatedAt: Date;
  
  /**
   * 统计信息
   */
  stats?: {
    usersCount?: number;
    dataVolume?: number;
    activeSessions?: number;
  };
}

/**
 * 行业创建请求
 */
export interface CreateIndustryRequest extends Omit<IndustryConfig, 'proxySettings'> {
  proxySettings?: Partial<IndustryConfig['proxySettings']>;
}

/**
 * 行业更新请求
 */
export interface UpdateIndustryRequest extends Partial<CreateIndustryRequest> {
  status?: IndustryStatus;
}

/**
 * 行业选择器选项
 */
export interface IndustryOption {
  value: IndustryType;
  label: string;
  icon: string;
  description?: string;
}

/**
 * 行业管理状态接口
 */
export interface IndustryManagementState {
  industries: Industry[];
  loading: boolean;
  error: string | null;
  selectedIndustry: Industry | null;
  filter: {
    status?: IndustryStatus;
    searchTerm?: string;
  };
}