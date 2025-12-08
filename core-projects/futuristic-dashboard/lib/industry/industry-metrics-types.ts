/**
 * @file 行业API性能监控类型定义
 * @description 定义行业API性能监控和指标追踪相关的数据结构
 * @module industry-metrics-types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * API调用性能指标
 */
export interface ApiPerformanceMetrics {
  /** 指标ID */
  id: string;
  /** 行业ID */
  industryId: string;
  /** 行业名称 */
  industryName: string;
  /** API路径 */
  apiPath: string;
  /** HTTP方法 */
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 调用次数 */
  requestCount: number;
  /** 平均响应时间(毫秒) */
  averageResponseTime: number;
  /** 最大响应时间(毫秒) */
  maxResponseTime: number;
  /** 最小响应时间(毫秒) */
  minResponseTime: number;
  /** 成功率(0-100) */
  successRate: number;
  /** 错误率(0-100) */
  errorRate: number;
  /** 状态码分布 */
  statusCodeDistribution: Record<string, number>;
  /** 指标采集时间范围开始 */
  timeRangeStart: Date;
  /** 指标采集时间范围结束 */
  timeRangeEnd: Date;
  /** 指标生成时间 */
  createdAt: Date;
}

/**
 * API性能趋势数据点
 */
export interface ApiPerformanceTrendPoint {
  /** 时间点 */
  timestamp: Date;
  /** 平均响应时间(毫秒) */
  averageResponseTime: number;
  /** 调用次数 */
  requestCount: number;
  /** 成功率(0-100) */
  successRate: number;
}

/**
 * API性能趋势数据
 */
export interface ApiPerformanceTrend {
  /** 行业ID */
  industryId: string;
  /** API路径 */
  apiPath: string;
  /** HTTP方法 */
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 时间粒度 */
  timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  /** 趋势数据点 */
  dataPoints: ApiPerformanceTrendPoint[];
  /** 趋势分析时间范围开始 */
  timeRangeStart: Date;
  /** 趋势分析时间范围结束 */
  timeRangeEnd: Date;
}

/**
 * 性能告警规则
 */
export interface PerformanceAlertRule {
  /** 规则ID */
  id: string;
  /** 行业ID */
  industryId: string;
  /** 告警名称 */
  name: string;
  /** 告警描述 */
  description: string;
  /** API路径(可选，为空表示所有API) */
  apiPath?: string;
  /** HTTP方法(可选) */
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 响应时间阈值(毫秒) */
  responseTimeThreshold: number;
  /** 错误率阈值(0-100) */
  errorRateThreshold: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 性能告警记录
 */
export interface PerformanceAlert {
  /** 告警ID */
  id: string;
  /** 关联规则ID */
  ruleId: string;
  /** 行业ID */
  industryId: string;
  /** 行业名称 */
  industryName: string;
  /** API路径 */
  apiPath: string;
  /** HTTP方法 */
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 告警类型 */
  alertType: 'response_time' | 'error_rate' | 'request_count_spike';
  /** 告警级别 */
  severity: 'info' | 'warning' | 'critical';
  /** 告警描述 */
  description: string;
  /** 当前值 */
  currentValue: number;
  /** 阈值 */
  threshold: number;
  /** 是否已解决 */
  resolved: boolean;
  /** 解决时间 */
  resolvedAt?: Date;
  /** 告警触发时间 */
  triggeredAt: Date;
  /** 告警创建时间 */
  createdAt: Date;
}

/**
 * API性能指标查询参数
 */
export interface ApiMetricsQueryParams {
  /** 行业ID(可选) */
  industryId?: string;
  /** API路径(可选) */
  apiPath?: string;
  /** HTTP方法(可选) */
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 时间范围开始 */
  startTime: Date;
  /** 时间范围结束 */
  endTime: Date;
  /** 时间粒度 */
  timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  /** 分页大小 */
  pageSize?: number;
  /** 页码 */
  page?: number;
  /** 排序字段 */
  sortBy?: 'responseTime' | 'requestCount' | 'errorRate';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * API性能统计摘要
 */
export interface ApiPerformanceSummary {
  /** 总调用次数 */
  totalRequests: number;
  /** 平均响应时间(毫秒) */
  averageResponseTime: number;
  /** 总体成功率(0-100) */
  overallSuccessRate: number;
  /** 最高错误率的API */
  highestErrorRateApi: { apiPath: string; errorRate: number };
  /** 最慢响应的API */
  slowestApi: { apiPath: string; avgResponseTime: number };
  /** 最常调用的API */
  mostCalledApi: { apiPath: string; requestCount: number };
  /** 活跃行业数量 */
  activeIndustriesCount: number;
  /** 统计时间范围开始 */
  timeRangeStart: Date;
  /** 统计时间范围结束 */
  timeRangeEnd: Date;
}

/**
 * 性能监控仪表盘数据
 */
export interface PerformanceDashboardData {
  /** 性能摘要 */
  summary: ApiPerformanceSummary;
  /** 近期趋势数据 */
  recentTrends: ApiPerformanceTrend[];
  /** 活跃告警 */
  activeAlerts: PerformanceAlert[];
  /** 按行业的性能指标 */
  industryMetrics: ApiPerformanceMetrics[];
}

/**
 * 性能监控图表数据类型
 */
export type ChartDataType = 'response_time' | 'request_count' | 'success_rate' | 'error_rate';

/**
 * 性能监控图表配置
 */
export interface PerformanceChartConfig {
  /** 图表类型 */
  chartType: 'line' | 'bar' | 'area';
  /** 数据类型 */
  dataType: ChartDataType;
  /** 是否显示网格 */
  showGrid: boolean;
  /** 是否显示图例 */
  showLegend: boolean;
  /** 是否显示数据标签 */
  showDataLabels: boolean;
  /** 颜色方案 */
  colorScheme: string;
}
