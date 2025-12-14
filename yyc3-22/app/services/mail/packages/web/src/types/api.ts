/**
 * @file API类型定义
 * @description 定义API相关的TypeScript类型接口
 * @module types/api
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * API响应基础接口
 * @template T 响应数据类型
 */
export interface ApiResponse<T = any> {
  /**
   * 请求是否成功
   */
  success: boolean;
  
  /**
   * 响应数据
   */
  data?: T;
  
  /**
   * 错误信息
   */
  error?: string;
  
  /**
   * 状态码
   */
  code?: number;
  
  /**
   * 消息
   */
  message?: string;
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  /**
   * 页码
   */
  page: number;
  
  /**
   * 每页数量
   */
  pageSize: number;
  
  /**
   * 排序字段
   */
  sortBy?: string;
  
  /**
   * 排序方向
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应接口
 * @template T 数据项类型
 */
export interface PaginatedResponse<T> {
  /**
   * 数据列表
   */
  items: T[];
  
  /**
   * 总条数
   */
  total: number;
  
  /**
   * 当前页码
   */
  page: number;
  
  /**
   * 每页数量
   */
  pageSize: number;
  
  /**
   * 总页数
   */
  totalPages: number;
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  /**
   * 错误代码
   */
  code: string;
  
  /**
   * 错误消息
   */
  message: string;
  
  /**
   * 详细错误信息
   */
  details?: any;
  
  /**
   * 时间戳
   */
  timestamp: string;
}

/**
 * 通用ID请求参数
 */
export interface IdParams {
  id: string;
}

/**
 * 批量操作请求参数
 */
export interface BatchParams {
  ids: string[];
}