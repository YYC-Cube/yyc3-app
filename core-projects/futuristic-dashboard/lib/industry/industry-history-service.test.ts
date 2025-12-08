/**
 * @file 行业历史记录服务测试
 * @description 测试行业配置历史记录和版本回滚功能
 * @module industry-history-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { IndustryHistoryService } from './industry-history-service';
import { Industry, IndustryConfigHistory } from './industry-types';

// 模拟API响应
const mockIndustries: Industry[] = [
  {
    id: 'ind1',
    name: '金融科技',
    code: 'FINTECH',
    type: 'technology',
    status: 'active',
    description: '金融科技行业',
    subdomain: 'fintech',
    icon: 'bank',
    proxyConfig: {
      enabled: true,
      host: 'proxy.fintech.yyc3.com',
      port: 8080,
      username: 'fintech_user',
      password: 'encrypted_password'
    },
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-10')
  }
];

const mockHistory: IndustryConfigHistory[] = [
  {
    id: 'hist1',
    industryId: 'ind1',
    config: {
      name: '金融科技',
      code: 'FINTECH',
      type: 'technology',
      status: 'active',
      description: '金融科技行业修改版',
      subdomain: 'fintech',
      icon: 'bank',
      proxyConfig: {
        enabled: true,
        host: 'proxy.fintech.yyc3.com',
        port: 8080,
        username: 'fintech_user',
        password: 'encrypted_password'
      }
    },
    version: 2,
    operatorId: 'user1',
    operatorName: '张三',
    changeReason: '更新描述信息',
    changeSummary: '修改行业描述',
    createdAt: new Date('2024-10-10')
  },
  {
    id: 'hist0',
    industryId: 'ind1',
    config: {
      name: '金融科技',
      code: 'FINTECH',
      type: 'finance',
      status: 'active',
      description: '金融科技行业初始版',
      subdomain: 'fintech',
      icon: 'bank',
      proxyConfig: {
        enabled: false,
        host: '',
        port: 0,
        username: '',
        password: ''
      }
    },
    version: 1,
    operatorId: 'admin',
    operatorName: '管理员',
    changeReason: '初始创建',
    changeSummary: '创建行业',
    createdAt: new Date('2024-10-01')
  }
];

// 模拟fetch API
global.fetch = jest.fn();

describe('IndustryHistoryService', () => {
  let historyService: IndustryHistoryService;
  
  beforeEach(() => {
    historyService = new IndustryHistoryService();
    jest.clearAllMocks();
  });

  describe('getIndustryHistory', () => {
    it('应该成功获取行业历史记录', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      });

      const result = await historyService.getIndustryHistory('ind1');
      
      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/industry/ind1/history',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    });

    it('应该处理API错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(historyService.getIndustryHistory('ind1'))
        .rejects.toThrow('获取行业历史记录失败: Internal Server Error');
    });

    it('应该处理空历史记录', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await historyService.getIndustryHistory('ind1');
      expect(result).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('应该成功保存行业历史记录', async () => {
      const industry: Industry = mockIndustries[0];
      const saveData = {
        industryId: industry.id,
        config: {
          name: industry.name,
          code: industry.code,
          type: industry.type,
          status: industry.status,
          description: industry.description,
          subdomain: industry.subdomain,
          icon: industry.icon,
          proxyConfig: industry.proxyConfig
        },
        changeReason: '测试保存',
        operatorId: 'tester',
        operatorName: '测试用户'
      };

      const mockResponse = {
        id: 'hist2',
        version: 3,
        ...saveData,
        changeSummary: '更新行业信息',
        createdAt: new Date()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await historyService.saveHistory(industry, {
        changeReason: '测试保存',
        operatorId: 'tester',
        operatorName: '测试用户'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/industry/history',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saveData)
        }
      );
    });

    it('应该处理保存失败的情况', async () => {
      const industry: Industry = mockIndustries[0];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(historyService.saveHistory(industry, {
        changeReason: '测试保存',
        operatorId: 'tester',
        operatorName: '测试用户'
      })).rejects.toThrow('保存历史记录失败: Bad Request');
    });
  });

  describe('rollbackToVersion', () => {
    it('应该成功回滚到指定版本', async () => {
      const rollbackRequest = {
        industryId: 'ind1',
        historyId: 'hist0',
        version: 1,
        operatorId: 'user1',
        operatorName: '张三',
        reason: '回滚到初始版本'
      };

      const updatedIndustry = {
        ...mockIndustries[0],
        type: 'finance',
        description: '金融科技行业初始版',
        proxyConfig: {
          enabled: false,
          host: '',
          port: 0,
          username: '',
          password: ''
        },
        updatedAt: new Date()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedIndustry
      });

      const result = await historyService.rollbackToVersion(rollbackRequest);

      expect(result).toEqual(updatedIndustry);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/industry/ind1/rollback',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            historyId: 'hist0',
            version: 1,
            operatorId: 'user1',
            operatorName: '张三',
            reason: '回滚到初始版本'
          })
        }
      );
    });

    it('应该处理回滚失败的情况', async () => {
      const rollbackRequest = {
        industryId: 'ind1',
        historyId: 'hist0',
        version: 1,
        operatorId: 'user1',
        operatorName: '张三',
        reason: '回滚到初始版本'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'History Not Found'
      });

      await expect(historyService.rollbackToVersion(rollbackRequest))
        .rejects.toThrow('版本回滚失败: History Not Found');
    });
  });

  describe('getHistoryById', () => {
    it('应该成功获取历史记录详情', async () => {
      const targetHistory = mockHistory[0];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => targetHistory
      });

      const result = await historyService.getHistoryById('hist1');
      
      expect(result).toEqual(targetHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/industry/history/hist1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    });

    it('应该处理历史记录不存在的情况', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(historyService.getHistoryById('nonexistent'))
        .rejects.toThrow('获取历史记录详情失败: Not Found');
    });
  });

  describe('compareVersions', () => {
    it('应该成功比较两个版本', async () => {
      const compareRequest = {
        industryId: 'ind1',
        fromVersionId: 'hist0',
        toVersionId: 'hist1'
      };

      const mockDiff = {
        changedFields: ['type', 'description', 'proxyConfig'],
        differences: {
          type: {
            from: 'finance',
            to: 'technology'
          },
          description: {
            from: '金融科技行业初始版',
            to: '金融科技行业修改版'
          },
          proxyConfig: {
            enabled: {
              from: false,
              to: true
            },
            host: {
              from: '',
              to: 'proxy.fintech.yyc3.com'
            }
          }
        },
        summary: '类型、描述和代理配置发生变更'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDiff
      });

      const result = await historyService.compareVersions(compareRequest);

      expect(result).toEqual(mockDiff);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/industry/ind1/compare-versions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromVersionId: 'hist0',
            toVersionId: 'hist1'
          })
        }
      );
    });

    it('应该处理版本比较失败的情况', async () => {
      const compareRequest = {
        industryId: 'ind1',
        fromVersionId: 'hist0',
        toVersionId: 'nonexistent'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Invalid Version IDs'
      });

      await expect(historyService.compareVersions(compareRequest))
        .rejects.toThrow('版本比较失败: Invalid Version IDs');
    });
  });
});
