/**
 * @file 行业数据备份管理组件测试
 * @description 测试行业数据备份管理组件的功能和交互
 * @module components/industry/industry-backup-manager.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { IndustryBackupManager } from './industry-backup-manager';
import { IndustryBackupService } from '@/lib/industry/industry-backup-service';
import { BackupConfig, BackupStatus, BackupType } from '@/lib/industry/industry-backup-types';

// 模拟依赖
jest.mock('@/lib/industry/industry-backup-service');

// 模拟数据
const mockBackups: BackupConfig[] = [
  {
    id: 'backup-1',
    name: '季度备份_2024Q3',
    description: '第三季度行业配置备份',
    type: BackupType.MANUAL,
    status: BackupStatus.SUCCESS,
    industryCount: 10,
    size: 1024000,
    createdAt: '2024-09-30T10:00:00Z',
    completedAt: '2024-09-30T10:05:00Z',
    createdBy: 'admin',
    metadata: {},
  },
  {
    id: 'backup-2',
    name: '每周自动备份',
    description: '',
    type: BackupType.AUTOMATIC,
    status: BackupStatus.SUCCESS,
    industryCount: 10,
    size: 980000,
    createdAt: '2024-10-15T01:00:00Z',
    completedAt: '2024-10-15T01:03:00Z',
    createdBy: 'system',
    metadata: {},
  },
  {
    id: 'backup-3',
    name: '测试备份',
    description: '功能测试备份',
    type: BackupType.MANUAL,
    status: BackupStatus.FAILED,
    industryCount: 0,
    size: 0,
    createdAt: '2024-10-16T09:00:00Z',
    errorMessage: '备份过程中发生错误',
    createdBy: 'test-user',
    metadata: {},
  },
];

// 模拟 IndustryAdapter
const mockIndustryAdapter = {
  // 模拟必要的方法
};

// 模拟备份存储
const mockBackupStorage = {
  // 模拟必要的方法
};

// 测试套件
describe('IndustryBackupManager 组件', () => {
  let mockBackupService: jest.Mocked<IndustryBackupService>;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();

    // 设置模拟服务
    mockBackupService = new IndustryBackupService(mockIndustryAdapter, mockBackupStorage) as jest.Mocked<IndustryBackupService>;
    mockBackupService.getBackups.mockResolvedValue({
      backups: mockBackups,
      total: mockBackups.length,
    });

    // 模拟静态方法
    (IndustryBackupService as jest.MockedClass<typeof IndustryBackupService>).mockImplementation(() => mockBackupService);
  });

  // 测试组件渲染
  it('应该正确渲染组件并显示标题', async () => {
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 验证标题存在
    expect(screen.getByText('行业数据备份管理')).toBeInTheDocument();
    
    // 验证创建备份按钮存在
    expect(screen.getByText('创建备份')).toBeInTheDocument();
    
    // 等待备份列表加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
  });

  // 测试备份列表显示
  it('应该正确显示备份列表数据', async () => {
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待列表渲染
    await waitFor(() => {
      // 验证所有备份项都显示
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
      expect(screen.getByText('每周自动备份')).toBeInTheDocument();
      expect(screen.getByText('测试备份')).toBeInTheDocument();
      
      // 验证状态标签
      expect(screen.getByText('手动')).toBeInTheDocument();
      expect(screen.getByText('自动')).toBeInTheDocument();
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByText('失败')).toBeInTheDocument();
    });
  });

  // 测试创建备份对话框
  it('应该打开创建备份对话框并提交表单', async () => {
    // 模拟创建备份成功
    mockBackupService.createBackup.mockResolvedValue({
      success: true,
      backupId: 'new-backup-1',
    });
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 点击创建备份按钮
    fireEvent.click(screen.getByText('创建备份'));
    
    // 验证对话框打开
    expect(await screen.findByText('创建行业配置备份')).toBeInTheDocument();
    
    // 输入备份信息
    fireEvent.change(screen.getByLabelText('备份名称'), {
      target: { value: '新的备份测试' },
    });
    
    fireEvent.change(screen.getByLabelText('备份描述（可选）'), {
      target: { value: '测试备份描述' },
    });
    
    // 提交表单
    fireEvent.click(screen.getByText('创建备份'));
    
    // 验证服务调用
    await waitFor(() => {
      expect(mockBackupService.createBackup).toHaveBeenCalledWith({
        name: '新的备份测试',
        description: '测试备份描述',
        includeAllIndustries: true,
        type: BackupType.MANUAL,
      });
    });
    
    // 验证成功消息显示
    await waitFor(() => {
      expect(screen.getByText('备份创建成功')).toBeInTheDocument();
    });
  });

  // 测试恢复备份功能
  it('应该打开恢复备份对话框并执行恢复操作', async () => {
    // 模拟恢复备份成功
    mockBackupService.restoreBackup.mockResolvedValue({
      success: true,
      restoredCount: 10,
    });
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待列表加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
    
    // 查找第一行的恢复按钮
    const tableRow = screen.getByText('季度备份_2024Q3').closest('tr');
    const restoreButton = within(tableRow!).getByRole('button', { name: /恢复备份/ });
    
    // 点击恢复按钮
    fireEvent.click(restoreButton);
    
    // 验证恢复对话框打开
    expect(await screen.findByText('恢复备份')).toBeInTheDocument();
    
    // 确认恢复
    fireEvent.click(screen.getByText('确认恢复'));
    
    // 验证服务调用
    await waitFor(() => {
      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith('backup-1', {
        overwrite: false,
        createBackupBeforeRestore: true,
      });
    });
    
    // 验证成功消息显示
    await waitFor(() => {
      expect(screen.getByText(/成功恢复 \d+ 个行业配置/)).toBeInTheDocument();
    });
  });

  // 测试删除备份功能
  it('应该打开删除备份对话框并执行删除操作', async () => {
    // 模拟删除备份成功
    mockBackupService.deleteBackup.mockResolvedValue(undefined);
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待列表加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
    
    // 查找第一行的删除按钮
    const tableRow = screen.getByText('季度备份_2024Q3').closest('tr');
    const deleteButton = within(tableRow!).getByRole('button', { name: /删除备份/ });
    
    // 点击删除按钮
    fireEvent.click(deleteButton);
    
    // 验证删除对话框打开
    expect(await screen.findByText('删除备份')).toBeInTheDocument();
    
    // 确认删除
    fireEvent.click(screen.getByText('删除'));
    
    // 验证服务调用
    await waitFor(() => {
      expect(mockBackupService.deleteBackup).toHaveBeenCalledWith('backup-1');
    });
    
    // 验证成功消息显示
    await waitFor(() => {
      expect(screen.getByText('备份删除成功')).toBeInTheDocument();
    });
  });

  // 测试查看备份详情
  it('应该打开备份详情对话框', async () => {
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待列表加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
    
    // 查找第一行的详情按钮
    const tableRow = screen.getByText('季度备份_2024Q3').closest('tr');
    const detailsButton = within(tableRow!).getByRole('button', { name: /查看详情/ });
    
    // 点击详情按钮
    fireEvent.click(detailsButton);
    
    // 验证详情对话框打开
    expect(await screen.findByText('备份详情')).toBeInTheDocument();
    
    // 验证详情信息显示
    expect(screen.getByText('backup-1')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('第三季度行业配置备份')).toBeInTheDocument();
  });

  // 测试筛选功能
  it('应该能够按状态筛选备份列表', async () => {
    // 设置筛选后的模拟结果
    mockBackupService.getBackups.mockResolvedValueOnce({
      backups: mockBackups.filter(b => b.status === BackupStatus.SUCCESS),
      total: 2,
    });
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
    
    // 打开状态筛选下拉菜单
    fireEvent.click(screen.getByLabelText('状态'));
    
    // 选择"成功"选项
    const successOption = screen.getByText('成功');
    fireEvent.click(successOption);
    
    // 验证服务调用
    await waitFor(() => {
      expect(mockBackupService.getBackups).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        status: BackupStatus.SUCCESS,
      });
    });
  });

  // 测试空状态显示
  it('当没有备份时应该显示空状态', async () => {
    // 设置空的模拟结果
    mockBackupService.getBackups.mockResolvedValue({
      backups: [],
      total: 0,
    });
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 验证空状态显示
    await waitFor(() => {
      expect(screen.getByText('暂无备份记录')).toBeInTheDocument();
      expect(screen.getByText('点击"创建备份"按钮开始备份行业配置')).toBeInTheDocument();
    });
  });

  // 测试错误处理
  it('应该显示加载错误消息', async () => {
    // 设置错误的模拟结果
    mockBackupService.getBackups.mockRejectedValue(new Error('加载失败'));
    
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 验证错误消息显示
    await waitFor(() => {
      expect(screen.getByText('加载备份列表失败')).toBeInTheDocument();
    });
  });

  // 测试分页功能
  it('应该能够切换分页', async () => {
    render(<IndustryBackupManager industryAdapter={mockIndustryAdapter} backupStorage={mockBackupStorage} />);
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(screen.getByText('季度备份_2024Q3')).toBeInTheDocument();
    });
    
    // 由于只有1页，下一页按钮应该是禁用的
    const nextPageButton = screen.getByText('下一页');
    expect(nextPageButton).toBeDisabled();
  });
});
