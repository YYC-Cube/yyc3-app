/**
 * @file API客户端管理器
 * @description 提供统一的API调用管理、错误处理、重试机制和请求取消功能
 * @module services/apiClient
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, CancelTokenSource } from 'axios';
import { ApiResponse } from '@/types';

// API客户端配置接口
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// API调用结果接口 - 直接使用ApiResponse接口
export type ApiCallResult<T = any> = ApiResponse<T>;

/**
 * API客户端管理器类
 * 提供统一的API调用管理、错误处理、重试机制和请求取消功能
 */
export class ApiClientManager {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;
  private pendingRequests: Map<string, CancelTokenSource>;

  /**
   * 构造函数
   * @param config API客户端配置
   */
  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.pendingRequests = new Map();

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证令牌
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 为请求添加取消令牌
        if (config.method && config.url) {
          const requestKey = this.generateRequestKey(config);
          // 取消相同的未完成请求
          this.cancelPendingRequest(requestKey);
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          this.pendingRequests.set(requestKey, source);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // 请求完成后删除未完成请求记录
        if (response.config.method && response.config.url) {
          const requestKey = this.generateRequestKey(response.config);
          this.pendingRequests.delete(requestKey);
        }

        return response;
      },
      async (error: AxiosError) => {
        // 处理取消请求错误
        if (axios.isCancel(error)) {
          console.log('Request canceled:', error.message);
          return Promise.reject(error);
        }

        // 请求失败后删除未完成请求记录
        if (error.config && error.config.method && error.config.url) {
          const requestKey = this.generateRequestKey(error.config);
          this.pendingRequests.delete(requestKey);
        }

        // 重试逻辑
        const originalRequest = error.config as any;
        if (!originalRequest._retry && this.shouldRetry(error)) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= this.retryAttempts) {
            // 延迟重试
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay * Math.pow(2, originalRequest._retryCount - 1))
            );
            return this.client(originalRequest);
          }
        }

        // 处理认证错误
        if (error.response?.status === 401 && !originalRequest._authRetry) {
          originalRequest._authRetry = true;
          try {
            await this.handleTokenRefresh();
            // 刷新令牌后重试请求
            if (originalRequest.headers) {
              const token = localStorage.getItem('auth_token');
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // 刷新令牌失败，重定向到登录页
            this.handleAuthFailure();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 生成请求唯一键
   * @param config 请求配置
   * @returns 请求键
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const { method = 'get', url = '', params = {}, data = {} } = config;
    return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
  }

  /**
   * 取消未完成的请求
   * @param requestKey 请求键
   */
  private cancelPendingRequest(requestKey: string): void {
    const source = this.pendingRequests.get(requestKey);
    if (source) {
      source.cancel(`取消重复请求: ${requestKey}`);
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * 检查是否应该重试请求
   * @param error 错误
   * @returns 是否应该重试
   */
  private shouldRetry(error: AxiosError): boolean {
    // 只对服务器错误和网络错误进行重试
    return (
      error.response?.status &&
      error.response.status >= 500 &&
      error.response.status < 600
    ) || !error.response; // 网络错误
  }

  /**
   * 处理令牌刷新
   */
  private async handleTokenRefresh(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('无刷新令牌');
    }

    try {
      const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
        `${this.client.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success && response.data.data) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      } else {
        throw new Error('刷新令牌失败');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 处理认证失败
   */
  private handleAuthFailure(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }

  /**
   * 执行GET请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns API调用结果
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      // 确保返回的对象符合ApiResponse接口
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        message: response.data.message
      };
    } catch (error) {
      return this.handleError(error as AxiosError<ApiResponse>);
    }
  }

  /**
   * 执行POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns API调用结果
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      // 确保返回的对象符合ApiResponse接口
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        message: response.data.message
      };
    } catch (error) {
      return this.handleError(error as AxiosError<ApiResponse>);
    }
  }

  /**
   * 执行PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns API调用结果
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      // 确保返回的对象符合ApiResponse接口
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        message: response.data.message
      };
    } catch (error) {
      return this.handleError(error as AxiosError<ApiResponse>);
    }
  }

  /**
   * 执行PATCH请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns API调用结果
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      // 确保返回的对象符合ApiResponse接口
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        message: response.data.message
      };
    } catch (error) {
      return this.handleError(error as AxiosError<ApiResponse>);
    }
  }

  /**
   * 执行DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns API调用结果
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      // 确保返回的对象符合ApiResponse接口
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
        message: response.data.message
      };
    } catch (error) {
      return this.handleError(error as AxiosError<ApiResponse>);
    }
  }

  /**
   * 处理API错误
   * @param error Axios错误
   * @returns 错误结果
   */
  private handleError<T = any>(error: AxiosError<ApiResponse>): ApiResponse<T> {
    let errorMessage = '未知错误，请稍后重试';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('API错误:', errorMessage, error);
    
    return {
      error: errorMessage,
      success: false,
      message: errorMessage
    };
  }

  /**
   * 取消所有未完成的请求
   */
  cancelAllRequests(): void {
    this.pendingRequests.forEach((source) => {
      source.cancel('取消所有请求');
    });
    this.pendingRequests.clear();
  }
}

// 创建并导出API客户端实例
export const apiClient = new ApiClientManager({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
});

// 导出类型
export type { ApiClientConfig };