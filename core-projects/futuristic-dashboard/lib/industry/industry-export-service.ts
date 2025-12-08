/**
 * @file 行业数据导出服务
 * @description 提供行业数据的CSV和Excel格式导出功能
 * @author YYC
 * @created 2024-10-15
 */

import { Industry, IndustryStatus, IndustryType } from './industry-types';
import { IndustryApiService } from './industry-api';

/**
 * 导出文件类型
 */
export type ExportFormat = 'csv' | 'excel';

/**
 * 代理配置接口
 */
export interface ProxyConfig {
  target?: string;
  [key: string]: any;
}

/**
 * 行业数据导出服务
 */
export class IndustryExportService {
  /**
   * 导出所有行业数据
   * @param format 导出文件格式
   * @param industries 要导出的行业数据数组（可选，如果不提供则导出全部）
   * @returns Promise<string> 返回导出的文件内容
   */
  static async exportIndustries(format: ExportFormat, industries?: Industry[]): Promise<string> {
    try {
      // 如果未提供行业数据，则获取所有行业
      const data = industries || await IndustryApiService.getAllIndustries();
      
      // 根据格式调用相应的导出方法
      if (format === 'csv') {
        return this.exportToCSV(data);
      } else if (format === 'excel') {
        return this.exportToExcel(data);
      }
      
      throw new Error('不支持的导出格式');
    } catch (error) {
      console.error('导出行业数据失败:', error);
      throw new Error('无法导出行业数据，请重试');
    }
  }

  /**
   * 导出为CSV格式
   * @param industries 要导出的行业数据数组
   * @returns string CSV格式的数据
   */
  private static exportToCSV(industries: Industry[]): string {
    // CSV 表头
    const headers = [
      'ID',
      '行业名称',
      '行业类型',
      '行业描述',
      '状态',
      '子域名',
      '代理启用',
      '代理配置',
      '图标',
      '主题',
      '创建时间',
      '更新时间'
    ];

    // 生成CSV内容
    const csvContent = [
      // 写入表头（用双引号包裹以避免逗号问题）
      headers.map(header => `"${header}"`).join(','),
      // 写入数据行
      ...industries.map(industry => [
        industry.id,
        industry.name,
        this.getIndustryTypeName(industry.type),
        industry.description || '',
        this.getIndustryStatusName(industry.status),
        industry.subdomain || '',
        industry.proxyEnabled ? '是' : '否',
        this.formatProxyConfig(industry.proxyConfig as ProxyConfig | undefined),
        industry.icon || '',
        industry.theme || '',
        industry.createdAt,
        industry.updatedAt || ''
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * 导出为Excel格式（简化版，实际项目中可使用xlsx库）
   * @param industries 要导出的行业数据数组
   * @returns string 类似Excel的TSV格式数据
   */
  private static exportToExcel(industries: Industry[]): string {
    // 表头
    const headers = [
      'ID',
      '行业名称',
      '行业类型',
      '行业描述',
      '状态',
      '子域名',
      '代理启用',
      '代理配置',
      '图标',
      '主题',
      '创建时间',
      '更新时间'
    ];

    // 生成TSV内容（使用制表符分隔，Excel默认可以打开）
    const excelContent = [
      headers.join('\t'),
      ...industries.map(industry => [
        industry.id,
        industry.name,
        this.getIndustryTypeName(industry.type),
        industry.description || '',
        this.getIndustryStatusName(industry.status),
        industry.subdomain || '',
        industry.proxyEnabled ? '是' : '否',
        this.formatProxyConfig(industry.proxyConfig as ProxyConfig | undefined),
        industry.icon || '',
        industry.theme || '',
        industry.createdAt,
        industry.updatedAt || ''
      ].join('\t'))
    ].join('\n');

    return excelContent;
  }

  /**
   * 获取行业类型的中文名称
   * @param type 行业类型
   * @returns string 中文名称
   */
  private static getIndustryTypeName(type: IndustryType): string {
    const typeMap: Record<string, string> = {
      [IndustryType.TECHNOLOGY]: '科技',
      [IndustryType.FINANCE]: '金融',
      [IndustryType.HEALTHCARE]: '医疗健康',
      [IndustryType.EDUCATION]: '教育',
      [IndustryType.RETAIL]: '零售',
      [IndustryType.MANUFACTURING]: '制造业',
      [IndustryType.AUTOMOTIVE]: '汽车',
      [IndustryType.TRANSPORTATION]: '交通运输',
      [IndustryType.ENERGY]: '能源',
      [IndustryType.CONSTRUCTION]: '建筑',
      [IndustryType.REAL_ESTATE]: '房地产',
      [IndustryType.MEDIA]: '传媒',
      [IndustryType.TELECOMMUNICATION]: '电信',
      [IndustryType.AGRICULTURE]: '农业',
      [IndustryType.PHARMACEUTICAL]: '制药',
      [IndustryType.CHEMICAL]: '化工',
      [IndustryType.FOOD_BEVERAGE]: '食品',
      [IndustryType.LOGISTICS]: '物流',
      [IndustryType.TOURISM]: '旅游',
      [IndustryType.HOSPITALITY]: '酒店',
      [IndustryType.SPORTS]: '体育',
      [IndustryType.OTHER]: '其他'
    };
    
    return typeMap[type] || '未知';
  }

  /**
   * 获取行业状态的中文名称
   * @param status 行业状态
   * @returns string 中文名称
   */
  private static getIndustryStatusName(status: IndustryStatus): string {
    const statusMap: Record<IndustryStatus, string> = {
      [IndustryStatus.ACTIVE]: '活跃',
      [IndustryStatus.INACTIVE]: '非活跃',
      [IndustryStatus.PENDING]: '待审核',
      [IndustryStatus.DELETED]: '已删除'
    };
    
    return statusMap[status] || '未知';
  }

  /**
   * 格式化代理配置对象为字符串
   * @param config 代理配置对象
   * @returns string 格式化后的字符串
   */
  private static formatProxyConfig(config?: ProxyConfig): string {
    if (!config) return '';
    
    try {
      // 过滤掉 undefined 或 null 的属性
      const filteredConfig = Object.entries(config)
        .filter(([_, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, any>);
      
      return JSON.stringify(filteredConfig);
    } catch (error) {
      return '';
    }
  }

  /**
   * 下载导出文件
   * @param content 文件内容
   * @param format 文件格式
   * @param filename 文件名（可选）
   */
  static downloadFile(content: string, format: ExportFormat, filename?: string): void {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('下载功能仅在浏览器环境中可用');
      return;
    }

    // 生成文件名
    const defaultFilename = `industries_export_${new Date().toISOString().split('T')[0]}`;
    const finalFilename = filename || defaultFilename;
    
    // 根据格式设置文件扩展名和MIME类型
    const extension = format === 'csv' ? 'csv' : 'xls';
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;';
    
    // 创建Blob对象
    const blob = new Blob([`\uFEFF${content}`], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${finalFilename}.${extension}`);
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}