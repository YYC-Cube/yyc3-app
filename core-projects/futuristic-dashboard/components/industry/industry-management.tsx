/**
 * @file 行业管理组件
 * @description 实现行业的增删改查功能界面
 * @module components/industry
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Industry, IndustryType, IndustryStatus, CreateIndustryRequest, UpdateIndustryRequest } from '@/types/industry';
import IndustryApiService from '@/lib/industry/industry-api';
import { useAuth } from '@/lib/auth/auth-context';
import { Alert, Button, Card, Checkbox, Dialog, Input, Select, Slider, Table, Tag, Tooltip, Switch } from '@/components/ui';
import { Trash2, Edit, Plus, Filter, RefreshCw, Check, X, ChevronDown, Search, Code, Cpu, Settings, Globe, BarChart2, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { IndustryExportService, ExportFormat } from '@/lib/industry/industry-export-service';
import { IndustryHistory } from './industry-history';
import { IndustryBackupManager } from './industry-backup-manager';

/**
 * 行业管理组件
 */
export default function IndustryManagement() {
  const { hasPermission } = useAuth();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<IndustryStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'csv' | 'excel'>('csv');
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'backup'>('details');
  const [formData, setFormData] = useState<CreateIndustryRequest>({
    name: '',
    description: '',
    subdomain: '',
    icon: 'database',
    theme: {
      primaryColor: 'rgb(var(--primary))',
          secondaryColor: 'rgb(var(--secondary-foreground))',
    },
    proxySettings: {
      enabled: false,
      endpoint: '',
      headers: {},
    },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 行业图标选项
  const iconOptions = [
    { value: 'database', label: '数据库' },
    { value: 'code', label: '代码' },
    { value: 'globe', label: '全球化' },
    { value: 'cpu', label: '计算' },
    { value: 'settings', label: '设置' },
    { value: 'bar-chart-2', label: '图表' },
  ];

  // 状态标签样式函数
  const getStatusTagStyle = (status: IndustryStatus) => {
    switch (status) {
      case 'active':
        return { className: 'bg-green-100 text-green-800', label: '活跃' };
      case 'inactive':
        return { className: 'bg-gray-100 text-gray-800', label: '停用' };
      case 'pending':
        return { className: 'bg-yellow-100 text-yellow-800', label: '待审核' };
      default:
        return { className: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  // 加载行业列表
  const loadIndustries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await IndustryApiService.getAllIndustries();
      setIndustries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载行业列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (hasPermission('manage_industries')) {
      loadIndustries();
    }
  }, [hasPermission]);

  // 过滤行业列表
  const filteredIndustries = industries.filter(industry => {
    const matchesSearch = industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         industry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || industry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 表单验证
  const validateForm = (data: CreateIndustryRequest): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) errors.name = '请输入行业名称';
    if (!data.description.trim()) errors.description = '请输入行业描述';
    if (!data.subdomain.trim()) {
      errors.subdomain = '请输入子域名';
    } else if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
      errors.subdomain = '子域名只能包含小写字母、数字和连字符';
    }
    if (!data.icon.trim()) errors.icon = '请选择图标';
    
    // 代理设置验证
    if (data.proxySettings?.enabled) {
      if (!data.proxySettings.endpoint?.trim()) {
        errors.proxyEndpoint = '请输入代理端点';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建行业
  const handleCreateIndustry = async () => {
    if (!validateForm(formData)) return;

    try {
      await IndustryApiService.createIndustry(formData);
      loadIndustries();
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建行业失败');
    }
  };

  // 编辑行业
  const handleEditIndustry = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description,
      subdomain: industry.subdomain,
      icon: industry.icon,
      theme: industry.theme || {
        primaryColor: 'rgb(var(--primary))',
          secondaryColor: 'rgb(var(--secondary-foreground))',
      },
      proxySettings: industry.proxySettings || {
        enabled: false,
        endpoint: '',
        headers: {},
      },
    });
    setFormErrors({});
    setShowEditDialog(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!validateForm(formData) || !editingIndustry) return;

    try {
      await IndustryApiService.updateIndustry(editingIndustry.id, formData);
      loadIndustries();
      setShowEditDialog(false);
      setEditingIndustry(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新行业失败');
    }
  };

  // 删除行业
  const handleDeleteIndustry = async (id: string) => {
    if (!confirm('确定要删除这个行业吗？此操作不可撤销。')) return;

    try {
      await IndustryApiService.deleteIndustry(id);
      loadIndustries();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除行业失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subdomain: '',
      icon: 'database',
      theme: {
        primaryColor: 'rgb(var(--primary))',
          secondaryColor: 'rgb(var(--secondary-foreground))',
      },
      proxySettings: {
        enabled: false,
        endpoint: '',
        headers: {},
      },
    });
    setFormErrors({});
  };

  // 导出行业数据
  const handleExport = async () => {
    try {
      setExportLoading(true);
      await IndustryExportService.exportIndustries(
        filteredIndustries,
        selectedExportFormat as ExportFormat
      );
      setShowExportModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出数据失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 检查权限
  if (!hasPermission('manage_industries')) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">行业管理</h2>
        <Alert variant="danger">
          您没有足够的权限访问此页面
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setError(null)}>
            <X size={16} />
          </Button>
        </Alert>
      )}

      {/* 标题栏 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">行业管理</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            新建行业
          </Button>
          <Button onClick={loadIndustries} variant="ghost">
            <RefreshCw size={16} />
          </Button>
          <Button onClick={() => setShowExportModal(true)} variant="ghost">
            <Download size={16} className="mr-2" />
            导出
          </Button>
          <Button variant="ghost" className="hidden sm:flex">
            <BarChart2 size={16} className="mr-2" />
            统计
          </Button>
        </div>
      </div>

      {/* 筛选和搜索区域 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <label htmlFor="industry-search-input" className="sr-only">搜索行业</label>
          <Input
            id="industry-search-input"
            placeholder="搜索行业名称或描述"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <label htmlFor="industry-status-filter" className="sr-only">行业状态</label>
          <Select
            id="industry-status-filter"
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">停用</option>
            <option value="pending">待审核</option>
          </Select>
          <Button variant="ghost" className="text-gray-500">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {/* 行业列表 */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">加载中...</div>
        ) : filteredIndustries.length === 0 ? (
          <div className="p-8 text-center">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">行业名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">子域名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIndustries.map((industry) => (
                  <tr key={industry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{industry.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{industry.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-1">{industry.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{industry.subdomain}.yyc3.com</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusTagStyle(industry.status).className}`}>
                        {getStatusTagStyle(industry.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditIndustry(industry)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteIndustry(industry.id)} className="text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 创建行业对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full p-6">
          <h3 className="text-xl font-bold mb-4">创建新行业</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">行业名称 *</label>
              <Input
                type="text"
                placeholder="输入行业名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">行业描述 *</label>
              <textarea
                className="w-full p-2 border rounded"
                placeholder="输入行业描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">子域名 *</label>
              <div className="flex">
                <Input
                  type="text"
                  placeholder="输入子域名"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  error={formErrors.subdomain}
                  className="rounded-r-none"
                />
                <span className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r">.yyc3.com</span>
              </div>
              {formErrors.subdomain && <p className="text-red-500 text-xs mt-1">{formErrors.subdomain}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">图标 *</label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">主题设置</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">主色调</label>
                  <Input
                    type="color"
                    value={formData.theme.primaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { ...formData.theme, primaryColor: e.target.value }
                    })}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">次色调</label>
                  <Input
                    type="color"
                    value={formData.theme.secondaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      theme: { ...formData.theme, secondaryColor: e.target.value }
                    })}
                    className="h-10 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">代理设置</label>
                <Switch
                  checked={formData.proxySettings.enabled}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    proxySettings: { ...formData.proxySettings, enabled: checked }
                  })}
                />
              </div>
              {formData.proxySettings.enabled && (
                <div className="space-y-3 pl-4 border-l">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">代理端点</label>
                    <Input
                      type="text"
                      placeholder="https://proxy.example.com"
                      value={formData.proxySettings.endpoint}
                      onChange={(e) => setFormData({
                        ...formData,
                        proxySettings: { ...formData.proxySettings, endpoint: e.target.value }
                      })}
                      error={formErrors.proxyEndpoint}
                    />
                    {formErrors.proxyEndpoint && <p className="text-red-500 text-xs mt-1">{formErrors.proxyEndpoint}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">自定义头部 (JSON)</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="请输入JSON格式的代理头部配置"
                      value={JSON.stringify(formData.proxySettings.headers, null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value);
                          setFormData({
                            ...formData,
                            proxySettings: { ...formData.proxySettings, headers }
                          });
                        } catch {}
                      }}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button onClick={handleCreateIndustry}>
              创建
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 编辑行业对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full p-6">
          <h3 className="text-xl font-bold mb-4">编辑行业</h3>
          
          {/* 标签页切换 */}
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                onClick={() => setActiveTab('details')}
              >
                基本信息
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                onClick={() => setActiveTab('history')}
              >
                <FileText size={16} className="inline mr-1" />
                操作历史
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'backup' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                onClick={() => setActiveTab('backup')}
              >
                <FileSpreadsheet size={16} className="inline mr-1" />
                数据备份
              </button>
            </div>
          </div>

          {/* 标签页内容 */}
          {activeTab === 'details' ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">行业名称 *</label>
                  <Input
                    type="text"
                    placeholder="输入行业名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={formErrors.name}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">行业描述 *</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="输入行业描述"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">子域名 *</label>
                  <div className="flex">
                    <Input
                      type="text"
                      placeholder="输入子域名"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                      error={formErrors.subdomain}
                      className="rounded-r-none"
                    />
                    <span className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r">.yyc3.com</span>
                  </div>
                  {formErrors.subdomain && <p className="text-red-500 text-xs mt-1">{formErrors.subdomain}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">图标 *</label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => {
                  setShowEditDialog(false);
                  setEditingIndustry(null);
                  setFormErrors({});
                }}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </>
          ) : activeTab === 'history' ? (
            <div className="min-h-[400px]">
              {editingIndustry && (
                <IndustryHistory
                  industryId={editingIndustry.id}
                  onVersionRollback={async (updatedIndustry) => {
                    // 更新编辑表单的数据
                    setFormData({
                      name: updatedIndustry.name,
                      description: updatedIndustry.description,
                      subdomain: updatedIndustry.subdomain,
                      icon: updatedIndustry.icon,
                      theme: updatedIndustry.theme || {
                        primaryColor: 'rgb(var(--primary))',
          secondaryColor: 'rgb(var(--secondary-foreground))',
                      },
                      proxySettings: updatedIndustry.proxySettings || {
                        enabled: false,
                        endpoint: '',
                        headers: {},
                      },
                    });
                    // 切换回详情标签
                    setActiveTab('details');
                  }}
                />
              )}
            </div>
          ) : activeTab === 'backup' ? (
            <div className="min-h-[400px]">
              <IndustryBackupManager industryId={editingIndustry?.id} />
            </div>
          ) : null}
        </div>
      </Dialog>

      {/* 导出模态框 */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">导出行业数据</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">导出格式</label>
              <Select
                value={selectedExportFormat}
                onValueChange={(value: 'csv' | 'excel') => setSelectedExportFormat(value)}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </Select>
            </div>
            
            <div className="text-sm text-gray-500">
              将导出 <strong>{filteredIndustries.length}</strong> 条行业数据
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={exportLoading}>
              {exportLoading ? '导出中...' : '导出'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
