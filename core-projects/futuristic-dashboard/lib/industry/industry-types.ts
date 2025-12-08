/**
 * @file 行业管理相关类型定义
 * @description 定义行业管理系统中使用的数据结构和接口类型
 * @module industry-types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * @description 行业类型枚举
 * @enum {string}
 */
export enum IndustryType {
  IT = 'IT',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER'
}

/**
 * @description 行业状态枚举
 * @enum {string}
 */
export enum IndustryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted'
}

/**
 * @description 代理配置
 * @interface ProxyConfig
 * @property {boolean} enabled - 是否启用代理
 * @property {string} host - 代理主机
 * @property {number} port - 代理端口
 * @property {string} username - 代理用户名
 * @property {string} password - 代理密码（加密存储）
 */
export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
}

/**
 * @description 主题配置
 * @interface ThemeConfig
 * @property {string} primaryColor - 主色调
 * @property {string} backgroundColor - 背景色
 * @property {string} textColor - 文字颜色
 */
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
}

/**
 * @description 行业基本信息
 * @interface Industry
 * @property {string} id - 行业ID
 * @property {string} name - 行业名称
 * @property {string} code - 行业代码
 * @property {IndustryType | string} type - 行业类型
 * @property {string} description - 行业描述
 * @property {string} icon - 行业图标
 * @property {IndustryStatus | string} status - 行业状态
 * @property {string} subdomain - 子域名
 * @property {ProxyConfig} proxyConfig - 代理配置
 * @property {ThemeConfig} theme - 主题配置
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} createdBy - 创建人ID
 * @property {string} updatedBy - 更新人ID
 */
export interface Industry {
  id: string;
  name: string;
  code: string;
  type: IndustryType | string;
  description: string;
  icon: string;
  status: IndustryStatus | string;
  subdomain: string;
  proxyConfig: ProxyConfig;
  theme: ThemeConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * @description 创建行业请求
 * @interface CreateIndustryRequest
 * @property {string} name - 行业名称
 * @property {string} code - 行业代码
 * @property {IndustryType | string} type - 行业类型
 * @property {string} description - 行业描述
 * @property {string} icon - 行业图标
 * @property {string} subdomain - 子域名
 * @property {ProxyConfig} proxyConfig - 代理配置
 * @property {ThemeConfig} theme - 主题配置
 */
export interface CreateIndustryRequest {
  name: string;
  code: string;
  type: IndustryType | string;
  description: string;
  icon: string;
  subdomain: string;
  proxyConfig: ProxyConfig;
  theme: ThemeConfig;
}

/**
 * @description 更新行业请求
 * @interface UpdateIndustryRequest
 * @property {string} name - 行业名称
 * @property {string} code - 行业代码
 * @property {IndustryType | string} type - 行业类型
 * @property {string} description - 行业描述
 * @property {string} icon - 行业图标
 * @property {IndustryStatus | string} status - 行业状态
 * @property {string} subdomain - 子域名
 * @property {ProxyConfig} proxyConfig - 代理配置
 * @property {ThemeConfig} theme - 主题配置
 */
export interface UpdateIndustryRequest {
  name: string;
  code: string;
  type: IndustryType | string;
  description: string;
  icon: string;
  status: IndustryStatus | string;
  subdomain: string;
  proxyConfig: ProxyConfig;
  theme: ThemeConfig;
}

/**
 * @description 行业配置历史记录
 * @interface IndustryConfigHistory
 * @property {string} id - 历史记录ID
 * @property {string} industryId - 关联的行业ID
 * @property {Omit<Industry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>} configData - 行业配置数据快照
 * @property {'create' | 'update' | 'delete' | 'rollback'} operationType - 操作类型
 * @property {string} operationDesc - 操作描述
 * @property {string} operatorId - 操作者ID
 * @property {string} operatorName - 操作者名称
 * @property {string} createdAt - 创建时间
 */
export interface IndustryConfigHistory {
  id: string;
  industryId: string;
  configData: Omit<Industry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
  operationType: 'create' | 'update' | 'delete' | 'rollback';
  operationDesc: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

/**
 * @description 版本回滚请求
 * @interface RollbackVersionRequest
 * @property {string} historyId - 要回滚到的历史记录ID
 * @property {string} reason - 回滚原因
 */
export interface RollbackVersionRequest {
  historyId: string;
  reason: string;
}

/**
 * @description 行业统计数据
 * @interface IndustryStats
 * @property {number} totalCount - 行业总数
 * @property {number} activeCount - 活跃行业数
 * @property {number} inactiveCount - 非活跃行业数
 * @property {Record<IndustryType | string, number>} typeDistribution - 行业类型分布
 * @property {number} totalProxies - 代理总数
 * @property {number} activeProxies - 活跃代理数
 * @property {IndustryTrend[]} trends - 行业趋势数据
 */
export interface IndustryStats {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  typeDistribution: Record<IndustryType | string, number>;
  totalProxies: number;
  activeProxies: number;
  trends: IndustryTrend[];
}

/**
 * @description 行业趋势数据
 * @interface IndustryTrend
 * @property {string} date - 日期
 * @property {number} count - 数量
 */
export interface IndustryTrend {
  date: string;
  count: number;
}

/**
 * @description 行业健康状态报告
 * @interface IndustryHealthReport
 * @property {number} healthyCount - 健康行业数
 * @property {number} warningCount - 警告行业数
 * @property {number} criticalCount - 严重行业数
 * @property {string[]} issues - 问题列表
 */
export interface IndustryHealthReport {
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  issues: string[];
}
