/**
 * @file 行业配置历史记录服务
 * @description 管理行业配置的历史记录和版本回滚功能
 * @module industry-history-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { Industry, IndustryConfigHistory, RollbackVersionRequest } from './industry-types';
import { IndustryApiService } from './industry-api';

/**
 * @description 行业配置历史记录服务类
 * @class IndustryHistoryService
 */
export class IndustryHistoryService {
  private static baseUrl = '/api/industry/history';

  /**
   * @description 获取行业配置历史记录
   * @param {string} industryId - 行业ID
   * @param {number} limit - 返回记录数量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<{ data: IndustryConfigHistory[]; total: number }>} 历史记录列表和总数
   */
  static async getIndustryHistory(
    industryId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: IndustryConfigHistory[]; total: number }> {
    try {
      // 在实际环境中，这里应该调用API获取数据
      // 模拟API调用
      const response = await fetch(
        `${this.baseUrl}?industryId=${industryId}&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`获取行业历史记录失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取行业配置历史记录失败:', error);
      // 模拟返回数据
      return this.getMockHistoryData(industryId, limit, offset);
    }
  }

  /**
   * @description 保存行业配置历史记录
   * @param {Industry} industry - 行业数据
   * @param {string} operationType - 操作类型
   * @param {string} operationDesc - 操作描述
   * @param {string} operatorId - 操作者ID
   * @param {string} operatorName - 操作者名称
   * @returns {Promise<IndustryConfigHistory>} 保存的历史记录
   */
  static async saveHistory(
    industry: Industry,
    operationType: 'create' | 'update' | 'delete' | 'rollback',
    operationDesc: string,
    operatorId: string,
    operatorName: string
  ): Promise<IndustryConfigHistory> {
    try {
      // 构建历史记录数据
      const historyData: Omit<IndustryConfigHistory, 'id' | 'createdAt'> = {
        industryId: industry.id,
        configData: {
          name: industry.name,
          code: industry.code,
          type: industry.type,
          description: industry.description,
          icon: industry.icon,
          status: industry.status,
          subdomain: industry.subdomain,
          proxyConfig: { ...industry.proxyConfig },
          theme: { ...industry.theme }
        },
        operationType,
        operationDesc,
        operatorId,
        operatorName
      };

      // 在实际环境中，这里应该调用API保存数据
      // 模拟API调用
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyData)
      });

      if (!response.ok) {
        throw new Error(`保存行业历史记录失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('保存行业配置历史记录失败:', error);
      // 模拟返回数据
      return {
        id: `history_${Date.now()}`,
        industryId: industry.id,
        configData: {
          name: industry.name,
          code: industry.code,
          type: industry.type,
          description: industry.description,
          icon: industry.icon,
          status: industry.status,
          subdomain: industry.subdomain,
          proxyConfig: { ...industry.proxyConfig },
          theme: { ...industry.theme }
        },
        operationType,
        operationDesc,
        operatorId,
        operatorName,
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * @description 回滚到指定版本
   * @param {RollbackVersionRequest} request - 回滚请求参数
   * @param {string} operatorId - 操作者ID
   * @param {string} operatorName - 操作者名称
   * @returns {Promise<Industry>} 回滚后的行业数据
   */
  static async rollbackToVersion(
    request: RollbackVersionRequest,
    operatorId: string,
    operatorName: string
  ): Promise<Industry> {
    try {
      // 获取历史记录
      const history = await this.getHistoryById(request.historyId);
      if (!history) {
        throw new Error('指定的历史记录不存在');
      }

      // 获取当前行业数据
      const currentIndustry = await IndustryApiService.getIndustryById(history.industryId);
      
      // 构建回滚请求体
      const rollbackData = {
        ...request,
        operatorId,
        operatorName
      };

      // 在实际环境中，这里应该调用API执行回滚
      // 模拟API调用
      const response = await fetch(`${this.baseUrl}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rollbackData)
      });

      if (!response.ok) {
        throw new Error(`执行版本回滚失败: ${response.statusText}`);
      }

      const rolledBackIndustry = await response.json();

      // 保存回滚操作的历史记录
      await this.saveHistory(
        rolledBackIndustry,
        'rollback',
        `回滚到版本 ${history.id}，原因：${request.reason}`,
        operatorId,
        operatorName
      );

      return rolledBackIndustry;
    } catch (error) {
      console.error('执行版本回滚失败:', error);
      // 模拟回滚操作
      const history = await this.getHistoryById(request.historyId);
      if (!history) {
        throw new Error('指定的历史记录不存在');
      }
      
      const currentIndustry = await IndustryApiService.getIndustryById(history.industryId);
      
      // 构建回滚后的行业数据
      const rolledBackIndustry: Industry = {
        ...currentIndustry,
        name: history.configData.name,
        code: history.configData.code,
        type: history.configData.type,
        description: history.configData.description,
        icon: history.configData.icon,
        status: history.configData.status,
        subdomain: history.configData.subdomain,
        proxyConfig: { ...history.configData.proxyConfig },
        theme: { ...history.configData.theme },
        updatedAt: new Date().toISOString(),
        updatedBy: operatorId
      };

      // 模拟保存操作
      return rolledBackIndustry;
    }
  }

  /**
   * @description 根据ID获取历史记录
   * @param {string} historyId - 历史记录ID
   * @returns {Promise<IndustryConfigHistory | null>} 历史记录
   */
  static async getHistoryById(historyId: string): Promise<IndustryConfigHistory | null> {
    try {
      // 在实际环境中，这里应该调用API获取数据
      // 模拟API调用
      const response = await fetch(`${this.baseUrl}/${historyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取历史记录失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取历史记录失败:', error);
      // 模拟返回数据
      return this.getMockHistoryById(historyId);
    }
  }

  /**
   * @description 比较两个版本的差异
   * @param {IndustryConfigHistory} version1 - 版本1
   * @param {IndustryConfigHistory} version2 - 版本2
   * @returns {Record<string, { old: any; new: any }>} 差异对象
   */
  static compareVersions(
    version1: IndustryConfigHistory,
    version2: IndustryConfigHistory
  ): Record<string, { old: any; new: any }> {
    const diffs: Record<string, { old: any; new: any }> = {};
    
    // 比较基本属性
    const keys = ['name', 'code', 'type', 'description', 'icon', 'status', 'subdomain'];
    
    keys.forEach(key => {
      if (version1.configData[key] !== version2.configData[key]) {
        diffs[key] = {
          old: version1.configData[key],
          new: version2.configData[key]
        };
      }
    });
    
    // 比较代理配置
    const proxyKeys = ['enabled', 'host', 'port', 'username'];
    let hasProxyDiff = false;
    const proxyDiff: Record<string, { old: any; new: any }> = {};
    
    proxyKeys.forEach(key => {
      if (version1.configData.proxyConfig[key] !== version2.configData.proxyConfig[key]) {
        hasProxyDiff = true;
        proxyDiff[key] = {
          old: version1.configData.proxyConfig[key],
          new: version2.configData.proxyConfig[key]
        };
      }
    });
    
    if (hasProxyDiff) {
      diffs['proxyConfig'] = proxyDiff;
    }
    
    // 比较主题配置
    const themeKeys = ['primaryColor', 'backgroundColor', 'textColor'];
    let hasThemeDiff = false;
    const themeDiff: Record<string, { old: any; new: any }> = {};
    
    themeKeys.forEach(key => {
      if (version1.configData.theme[key] !== version2.configData.theme[key]) {
        hasThemeDiff = true;
        themeDiff[key] = {
          old: version1.configData.theme[key],
          new: version2.configData.theme[key]
        };
      }
    });
    
    if (hasThemeDiff) {
      diffs['theme'] = themeDiff;
    }
    
    return diffs;
  }

  // 模拟数据生成方法
  private static getMockHistoryData(
    industryId: string,
    limit: number,
    offset: number
  ): { data: IndustryConfigHistory[]; total: number } {
    const mockHistory: IndustryConfigHistory[] = [
      {
        id: 'history_1',
        industryId,
        configData: {
          name: '技术开发',
          code: 'TECH',
          type: 'IT',
          description: '软件开发、系统集成和IT服务',
          icon: 'code',
          status: 'active',
          subdomain: 'tech.example.com',
          proxyConfig: {
            enabled: true,
            host: 'proxy.tech.com',
            port: 8080,
            username: 'tech_user',
            password: 'encrypted123'
          },
          theme: {
            primaryColor: '#3b82f6',
            backgroundColor: '#f9fafb',
            textColor: '#1f2937'
          }
        },
        operationType: 'create',
        operationDesc: '创建行业',
        operatorId: 'admin123',
        operatorName: '管理员',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'history_2',
        industryId,
        configData: {
          name: '技术开发部',
          code: 'TECH',
          type: 'IT',
          description: '软件开发、系统集成和IT服务',
          icon: 'code',
          status: 'active',
          subdomain: 'tech.example.com',
          proxyConfig: {
            enabled: true,
            host: 'proxy.tech.com',
            port: 8080,
            username: 'tech_user',
            password: 'encrypted123'
          },
          theme: {
            primaryColor: '#3b82f6',
            backgroundColor: '#f9fafb',
            textColor: '#1f2937'
          }
        },
        operationType: 'update',
        operationDesc: '更新行业名称',
        operatorId: 'admin123',
        operatorName: '管理员',
        createdAt: '2024-01-20T15:30:00Z'
      },
      {
        id: 'history_3',
        industryId,
        configData: {
          name: '技术开发部',
          code: 'TECH',
          type: 'IT',
          description: '软件开发、系统集成、IT服务和云计算',
          icon: 'code',
          status: 'active',
          subdomain: 'tech.example.com',
          proxyConfig: {
            enabled: true,
            host: 'new-proxy.tech.com',
            port: 8443,
            username: 'tech_admin',
            password: 'encrypted456'
          },
          theme: {
            primaryColor: '#2563eb',
            backgroundColor: '#eff6ff',
            textColor: '#1e40af'
          }
        },
        operationType: 'update',
        operationDesc: '更新描述和代理配置',
        operatorId: 'admin123',
        operatorName: '管理员',
        createdAt: '2024-02-10T09:15:00Z'
      }
    ];
    
    return {
      data: mockHistory.slice(offset, offset + limit),
      total: mockHistory.length
    };
  }

  private static getMockHistoryById(historyId: string): IndustryConfigHistory | null {
    const mockHistory: IndustryConfigHistory[] = [
      {
        id: 'history_1',
        industryId: '1',
        configData: {
          name: '技术开发',
          code: 'TECH',
          type: 'IT',
          description: '软件开发、系统集成和IT服务',
          icon: 'code',
          status: 'active',
          subdomain: 'tech.example.com',
          proxyConfig: {
            enabled: true,
            host: 'proxy.tech.com',
            port: 8080,
            username: 'tech_user',
            password: 'encrypted123'
          },
          theme: {
            primaryColor: '#3b82f6',
            backgroundColor: '#f9fafb',
            textColor: '#1f2937'
          }
        },
        operationType: 'create',
        operationDesc: '创建行业',
        operatorId: 'admin123',
        operatorName: '管理员',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'history_2',
        industryId: '1',
        configData: {
          name: '技术开发部',
          code: 'TECH',
          type: 'IT',
          description: '软件开发、系统集成和IT服务',
          icon: 'code',
          status: 'active',
          subdomain: 'tech.example.com',
          proxyConfig: {
            enabled: true,
            host: 'proxy.tech.com',
            port: 8080,
            username: 'tech_user',
            password: 'encrypted123'
          },
          theme: {
            primaryColor: '#3b82f6',
            backgroundColor: '#f9fafb',
            textColor: '#1f2937'
          }
        },
        operationType: 'update',
        operationDesc: '更新行业名称',
        operatorId: 'admin123',
        operatorName: '管理员',
        createdAt: '2024-01-20T15:30:00Z'
      }
    ];
    
    return mockHistory.find(h => h.id === historyId) || null;
  }
}
