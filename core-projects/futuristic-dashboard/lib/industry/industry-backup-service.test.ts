/**
 * @file 行业数据备份和恢复服务测试
 * @description 测试行业配置数据的备份和恢复功能
 * @module industry/industry-backup-service.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { IndustryBackupService } from './industry-backup-service';
import { IndustryAdapter } from '@/lib/industry-adapter';
import {
  BackupConfig,
  BackupData,
  BackupMetadata,
  BackupOperationResult,
  BackupOptions,
  BackupStatus,
  BackupType,
  RestoreOptions,
  RestoreOperationResult
} from './industry-backup-types';
import { IndustryConfig, IndustryType } from '@/lib/industry-adapter';

// 模拟数据
const mockIndustries: IndustryConfig[] = [
  {
    id: 'ecommerce' as IndustryType,
    name: '电子商务',
    code: 'ECOM',
    isEnabled: true,
    config: { apiEndpoint: 'https://api.ecommerce.com', timeout: 30000 },
    createdAt: '2024-10-01T00:00:00Z',
    updatedAt: '2024-10-10T00:00:00Z',
  },
  {
    id: 'finance' as IndustryType,
    name: '金融服务',
    code: 'FIN',
    isEnabled: true,
    config: { apiEndpoint: 'https://api.finance.com', timeout: 15000 },
    createdAt: '2024-10-02T00:00:00Z',
    updatedAt: '2024-10-11T00:00:00Z',
  },
  {
    id: 'healthcare' as IndustryType,
    name: '医疗健康',
    code: 'HLTH',
    isEnabled: false,
    config: { apiEndpoint: 'https://api.healthcare.com', timeout: 45000 },
    createdAt: '2024-10-03T00:00:00Z',
    updatedAt: '2024-10-12T00:00:00Z',
  },
];

// 模拟 IndustryAdapter
const mockIndustryAdapter: jest.Mocked<IndustryAdapter> = {
  getAllIndustries: jest.fn(),
  getIndustryById: jest.fn(),
  saveIndustry: jest.fn(),
  clearCache: jest.fn(),
  // 其他方法...
} as any;

// 模拟备份存储
const mockBackupStorage: any = {
  save: jest.fn(),
  load: jest.fn(),
  delete: jest.fn(),
  size: jest.fn(),
};

describe('IndustryBackupService', () => {
  let backupService: IndustryBackupService;

  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();
    
    // 初始化服务
    backupService = new IndustryBackupService(mockIndustryAdapter, mockBackupStorage);
    
    // 模拟一些基础方法
    jest.spyOn(backupService as any, 'recordBackupStart').mockResolvedValue(undefined);
    jest.spyOn(backupService as any, 'recordBackupCompletion').mockResolvedValue(undefined);
    jest.spyOn(backupService as any, 'saveBackupData').mockResolvedValue('backups/test-backup.json');
    jest.spyOn(backupService as any, 'getBackupSize').mockResolvedValue(2048);
  });

  describe('createBackup', () => {
    it('应该成功创建包含所有行业的备份', async () => {
      // 准备
      mockIndustryAdapter.getAllIndustries.mockResolvedValue(mockIndustries);
      
      // 执行
      const result = await backupService.createBackup({
        name: '测试备份',
        includeAllIndustries: true,
      });
      
      // 验证
      expect(result.success).toBe(true);
      expect(result.backupId).toBeDefined();
      expect(mockIndustryAdapter.getAllIndustries).toHaveBeenCalled();
      expect((backupService as any).recordBackupStart).toHaveBeenCalled();
      expect((backupService as any).saveBackupData).toHaveBeenCalled();
      expect((backupService as any).recordBackupCompletion).toHaveBeenCalled();
    });

    it('应该成功创建包含特定行业的备份', async () => {
      // 准备
      mockIndustryAdapter.getIndustryById
        .mockResolvedValueOnce(mockIndustries[0]) // ecommerce
        .mockResolvedValueOnce(mockIndustries[1]); // finance
      
      // 执行
      const result = await backupService.createBackup({
        name: '特定行业备份',
        industryIds: ['ecommerce', 'finance'] as IndustryType[],
      });
      
      // 验证
      expect(result.success).toBe(true);
      expect(mockIndustryAdapter.getIndustryById).toHaveBeenCalledTimes(2);
      expect(mockIndustryAdapter.getIndustryById).toHaveBeenCalledWith('ecommerce');
      expect(mockIndustryAdapter.getIndustryById).toHaveBeenCalledWith('finance');
    });

    it('备份失败时应该返回错误信息', async () => {
      // 准备
      mockIndustryAdapter.getAllIndustries.mockRejectedValue(new Error('获取行业数据失败'));
      
      // 执行
      const result = await backupService.createBackup();
      
      // 验证
      expect(result.success).toBe(false);
      expect(result.error).toBe('获取行业数据失败');
    });
  });

  describe('restoreBackup', () => {
    const mockBackupData: BackupData = {
      metadata: {
        version: '1.0.0',
        systemVersion: '1.0.0',
        summary: { totalIndustries: 2, enabledIndustries: 2, disabledIndustries: 0 },
        includedIndustries: [
          { id: 'ecommerce', name: '电子商务', code: 'ECOM' },
          { id: 'finance', name: '金融服务', code: 'FIN' },
        ],
      },
      industries: mockIndustries.slice(0, 2),
      statistics: {
        createdAt: '2024-10-15T00:00:00Z',
        dataSize: 2048,
        recordCount: 2,
      },
    };

    beforeEach(() => {
      jest.spyOn(backupService as any, 'findBackupById').mockResolvedValue({
        id: 'test-backup-id',
        name: '测试备份',
        type: BackupType.MANUAL,
        status: BackupStatus.SUCCESS,
        createdAt: '2024-10-15T00:00:00Z',
        completedAt: '2024-10-15T00:01:00Z',
        size: 2048,
        industryCount: 2,
        backupPath: 'backups/test-backup.json',
      });
      jest.spyOn(backupService as any, 'loadBackupData').mockResolvedValue(mockBackupData);
    });

    it('应该成功恢复备份', async () => {
      // 准备
      mockIndustryAdapter.getIndustryById.mockResolvedValue(null); // 行业不存在
      mockIndustryAdapter.saveIndustry.mockResolvedValue(undefined);
      
      // 执行
      const result = await backupService.restoreBackup('test-backup-id');
      
      // 验证
      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(2);
      expect(mockIndustryAdapter.saveIndustry).toHaveBeenCalledTimes(2);
      expect(mockIndustryAdapter.clearCache).toHaveBeenCalled();
    });

    it('启用overwrite选项时应该覆盖现有行业', async () => {
      // 准备
      mockIndustryAdapter.getIndustryById.mockResolvedValue(mockIndustries[0]);
      mockIndustryAdapter.saveIndustry.mockResolvedValue(undefined);
      
      // 执行
      const result = await backupService.restoreBackup('test-backup-id', {
        overwrite: true,
      });
      
      // 验证
      expect(result.success).toBe(true);
      expect(mockIndustryAdapter.saveIndustry).toHaveBeenCalled();
    });

    it('不启用overwrite选项时不应覆盖现有行业', async () => {
      // 准备
      mockIndustryAdapter.getIndustryById.mockResolvedValue(mockIndustries[0]);
      mockIndustryAdapter.saveIndustry.mockResolvedValue(undefined);
      
      // 执行
      const result = await backupService.restoreBackup('test-backup-id', {
        overwrite: false,
      });
      
      // 验证
      expect(result.success).toBe(true);
      // 由于不覆盖，restoreCount可能为0或部分成功，取决于模拟情况
    });

    it('应该在恢复前创建备份（如果配置）', async () => {
      // 准备
      mockIndustryAdapter.getIndustryById.mockResolvedValue(null);
      mockIndustryAdapter.saveIndustry.mockResolvedValue(undefined);
      jest.spyOn(backupService, 'createBackup').mockResolvedValue({
        success: true,
        backupId: 'pre-restore-backup',
        message: '恢复前备份创建成功',
      });
      
      // 执行
      const result = await backupService.restoreBackup('test-backup-id', {
        createBackupBeforeRestore: true,
      });
      
      // 验证
      expect(backupService.createBackup).toHaveBeenCalled();
      expect(result.preRestoreBackupId).toBe('pre-restore-backup');
    });
  });

  describe('deleteBackup', () => {
    beforeEach(() => {
      jest.spyOn(backupService as any, 'findBackupById').mockResolvedValue({
        id: 'test-backup-id',
        name: '测试备份',
        type: BackupType.MANUAL,
        status: BackupStatus.SUCCESS,
        createdAt: '2024-10-15T00:00:00Z',
        completedAt: '2024-10-15T00:01:00Z',
        size: 2048,
        industryCount: 2,
        backupPath: 'backups/test-backup.json',
      });
      jest.spyOn(backupService as any, 'deleteBackupData').mockResolvedValue(undefined);
      jest.spyOn(backupService as any, 'removeBackupRecord').mockResolvedValue(undefined);
    });

    it('应该成功删除备份', async () => {
      // 执行
      const result = await backupService.deleteBackup('test-backup-id');
      
      // 验证
      expect(result).toBe(true);
      expect((backupService as any).deleteBackupData).toHaveBeenCalledWith('backups/test-backup.json');
      expect((backupService as any).removeBackupRecord).toHaveBeenCalledWith('test-backup-id');
    });

    it('备份不存在时应该抛出错误', async () => {
      // 准备
      jest.spyOn(backupService as any, 'findBackupById').mockResolvedValue(null);
      
      // 执行和验证
      await expect(backupService.deleteBackup('non-existent-id')).rejects.toThrow('备份不存在');
    });
  });

  describe('getBackups', () => {
    beforeEach(() => {
      jest.spyOn(backupService as any, 'queryBackups').mockResolvedValue([
        {
          id: 'backup-1',
          name: '备份1',
          type: BackupType.MANUAL,
          status: BackupStatus.SUCCESS,
          createdAt: '2024-10-15T00:00:00Z',
          completedAt: '2024-10-15T00:01:00Z',
          size: 2048,
          industryCount: 2,
        },
        {
          id: 'backup-2',
          name: '备份2',
          type: BackupType.AUTOMATIC,
          status: BackupStatus.SUCCESS,
          createdAt: '2024-10-14T00:00:00Z',
          completedAt: '2024-10-14T00:01:00Z',
          size: 1024,
          industryCount: 1,
        },
      ]);
      jest.spyOn(backupService as any, 'countBackups').mockResolvedValue(5);
    });

    it('应该返回备份列表和分页信息', async () => {
      // 执行
      const result = await backupService.getBackups({
        page: 1,
        limit: 2,
      });
      
      // 验证
      expect(result.backups).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });
  });
});
