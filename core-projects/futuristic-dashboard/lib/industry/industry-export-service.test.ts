/**
 * @file 行业数据导出服务测试
 * @description 测试行业数据导出功能，包括CSV和Excel格式的生成与下载
 * @module industry-export-service
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { IndustryExportService, ExportFormat } from './industry-export-service';
import { Industry } from './industry-types';

// 模拟数据
const mockIndustries: Industry[] = [
  {
    id: '1',
    name: '技术开发',
    code: 'TECH',
    type: 'IT',
    description: '软件开发、系统集成',
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
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    createdBy: 'admin123',
    updatedBy: 'admin123'
  },
  {
    id: '2',
    name: '金融服务',
    code: 'FIN',
    type: 'FINANCE',
    description: '银行、保险、投资',
    icon: 'dollar-sign',
    status: 'inactive',
    subdomain: 'finance.example.com',
    proxyConfig: {
      enabled: false,
      host: '',
      port: 0,
      username: '',
      password: ''
    },
    theme: {
      primaryColor: '#10b981',
      backgroundColor: '#ecfdf5',
      textColor: '#134e4a'
    },
    createdAt: '2024-02-20T09:15:00Z',
    updatedAt: '2024-02-22T14:45:00Z',
    createdBy: 'admin123',
    updatedBy: 'admin123'
  }
];

// 模拟window.URL.createObjectURL和window.URL.revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟document.createElement
document.createElement = jest.fn().mockImplementation((tagName) => {
  const element = {
    tagName,
    setAttribute: jest.fn(),
    click: jest.fn(),
    style: { display: '' },
    download: '',
    href: ''
  };
  return element as any;
});

document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('IndustryExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('导出行业数据为CSV格式', () => {
    it('应该生成正确的CSV内容', async () => {
      const result = await IndustryExportService.exportIndustries('csv', mockIndustries);
      
      // 验证CSV头部
      expect(result).toContain('ID,行业名称,行业代码,行业类型,描述,图标,状态,子域名,代理状态,代理主机,代理端口,代理用户名,主色调,背景色,文字颜色,创建时间,更新时间,创建人,更新人');
      
      // 验证第一行数据
      expect(result).toContain('1,技术开发,TECH,IT,软件开发、系统集成,code,活跃,tech.example.com,已启用,proxy.tech.com,8080,tech_user,#3b82f6,#f9fafb,#1f2937,2024-01-15 10:00:00,2024-01-20 15:30:00,admin123,admin123');
      
      // 验证第二行数据
      expect(result).toContain('2,金融服务,FIN,金融,银行、保险、投资,dollar-sign,禁用,finance.example.com,未启用,,,,' +
        '#10b981,#ecfdf5,#134e4a,2024-02-20 09:15:00,2024-02-22 14:45:00,admin123,admin123');
    });

    it('应该正确处理空数据', async () => {
      const result = await IndustryExportService.exportIndustries('csv', []);
      
      // 只有头部没有数据行
      expect(result).toEqual('ID,行业名称,行业代码,行业类型,描述,图标,状态,子域名,代理状态,代理主机,代理端口,代理用户名,主色调,背景色,文字颜色,创建时间,更新时间,创建人,更新人\n');
    });

    it('应该正确处理包含逗号和换行符的描述', async () => {
      const industriesWithSpecialChars = [
        {
          ...mockIndustries[0],
          description: '这是一个包含,逗号和\n换行的数据'
        }
      ];
      
      const result = await IndustryExportService.exportIndustries('csv', industriesWithSpecialChars);
      
      // 验证特殊字符被正确转义
      expect(result).toContain('"这是一个包含,逗号和\n换行的数据"');
    });
  });

  describe('导出行业数据为Excel格式', () => {
    it('应该生成有效的Excel XML内容', async () => {
      const result = await IndustryExportService.exportIndustries('excel', mockIndustries);
      
      // 验证Excel XML头部
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
      
      // 验证包含行业数据
      expect(result).toContain('技术开发');
      expect(result).toContain('TECH');
      expect(result).toContain('IT');
      expect(result).toContain('金融服务');
    });

    it('应该正确处理空数据', async () => {
      const result = await IndustryExportService.exportIndustries('excel', []);
      
      // 验证Excel XML结构仍然完整
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Workbook');
      expect(result).toContain('</Workbook>');
    });

    it('应该正确处理包含特殊字符的数据', async () => {
      const industriesWithSpecialChars = [
        {
          ...mockIndustries[0],
          name: '技术&开发',
          description: '包含<尖括号>和"引号"的数据'
        }
      ];
      
      const result = await IndustryExportService.exportIndustries('excel', industriesWithSpecialChars);
      
      // 验证特殊字符被正确转义
      expect(result).toContain('技术&amp;开发');
      expect(result).toContain('包含&lt;尖括号&gt;和&quot;引号&quot;的数据');
    });
  });

  describe('文件下载功能', () => {
    it('应该正确下载CSV文件', () => {
      const content = 'test,csv,content';
      IndustryExportService.downloadFile(content, 'csv');
      
      // 验证创建了a标签
      expect(document.createElement).toHaveBeenCalledWith('a');
      
      // 验证设置了正确的download属性
      const createElementMock = document.createElement as jest.Mock;
      const linkElement = createElementMock.mock.results[0].value;
      
      expect(linkElement.download).toMatch(/^industry_data_\d{14}\.csv$/);
      expect(linkElement.click).toHaveBeenCalled();
    });

    it('应该正确下载Excel文件', () => {
      const content = '<xml>test excel content</xml>';
      IndustryExportService.downloadFile(content, 'excel');
      
      // 验证创建了a标签
      expect(document.createElement).toHaveBeenCalledWith('a');
      
      // 验证设置了正确的download属性
      const createElementMock = document.createElement as jest.Mock;
      const linkElement = createElementMock.mock.results[0].value;
      
      expect(linkElement.download).toMatch(/^industry_data_\d{14}\.xls$/);
      expect(linkElement.click).toHaveBeenCalled();
    });
  });

  describe('数据类型转换功能', () => {
    it('应该正确获取行业类型名称', () => {
      expect(IndustryExportService.getIndustryTypeName('IT')).toBe('IT');
      expect(IndustryExportService.getIndustryTypeName('FINANCE')).toBe('金融');
      expect(IndustryExportService.getIndustryTypeName('HEALTHCARE')).toBe('医疗健康');
      expect(IndustryExportService.getIndustryTypeName('EDUCATION')).toBe('教育');
      expect(IndustryExportService.getIndustryTypeName('MANUFACTURING')).toBe('制造业');
      expect(IndustryExportService.getIndustryTypeName('RETAIL')).toBe('零售');
      expect(IndustryExportService.getIndustryTypeName('TRANSPORT')).toBe('交通运输');
      expect(IndustryExportService.getIndustryTypeName('OTHER')).toBe('其他');
      expect(IndustryExportService.getIndustryTypeName('UNKNOWN')).toBe('未知');
    });

    it('应该正确获取行业状态名称', () => {
      expect(IndustryExportService.getIndustryStatusName('active')).toBe('活跃');
      expect(IndustryExportService.getIndustryStatusName('inactive')).toBe('禁用');
      expect(IndustryExportService.getIndustryStatusName('pending')).toBe('待审核');
      expect(IndustryExportService.getIndustryStatusName('deleted')).toBe('已删除');
      expect(IndustryExportService.getIndustryStatusName('unknown')).toBe('未知');
    });

    it('应该正确格式化代理配置', () => {
      const proxyConfig1 = {
        enabled: true,
        host: 'proxy.example.com',
        port: 8080,
        username: 'user123',
        password: 'pass123'
      };
      
      const proxyConfig2 = {
        enabled: false,
        host: '',
        port: 0,
        username: '',
        password: ''
      };
      
      const [status1, host1, port1, username1] = IndustryExportService.formatProxyConfig(proxyConfig1);
      expect(status1).toBe('已启用');
      expect(host1).toBe('proxy.example.com');
      expect(port1).toBe('8080');
      expect(username1).toBe('user123');
      
      const [status2, host2, port2, username2] = IndustryExportService.formatProxyConfig(proxyConfig2);
      expect(status2).toBe('未启用');
      expect(host2).toBe('');
      expect(port2).toBe('');
      expect(username2).toBe('');
    });
  });
});
