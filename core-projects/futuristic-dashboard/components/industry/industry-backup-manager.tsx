/**
 * @file 行业数据备份管理组件
 * @description 提供行业配置数据的备份和恢复功能管理界面
 * @module components/industry/industry-backup-manager
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  LinearProgress,
  Alert,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Backup as BackupIcon,
  BackupTable as BackupTableIcon,
  CalendarToday,
  Clock,
  Delete,
  Download,
  FileDownload,
  Info,
  MoreVert,
  Refresh,
  Restore,
  Schedule,
  Settings,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { IndustryBackupService } from '@/lib/industry/industry-backup-service';
import {
  BackupConfig,
  BackupStatus,
  BackupType,
  BackupOptions,
  RestoreOptions,
  BackupQueryParams,
  BackupSchedule,
} from '@/lib/industry/industry-backup-types';
import { IndustryAdapter } from '@/lib/industry-adapter';
import { IndustryType } from '@/lib/industry-adapter';

interface IndustryBackupManagerProps {
  industryAdapter: IndustryAdapter;
  backupStorage: any;
}

export const IndustryBackupManager: React.FC<IndustryBackupManagerProps> = ({
  industryAdapter,
  backupStorage,
}) => {
  // 服务实例
  const backupService = new IndustryBackupService(industryAdapter, backupStorage);

  // 状态管理
  const [backups, setBackups] = useState<BackupConfig[]>([]);
  const [totalBackups, setTotalBackups] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupConfig | null>(null);
  
  // 对话框状态
  const [openCreateBackupDialog, setOpenCreateBackupDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBackupDetailsDialog, setOpenBackupDetailsDialog] = useState(false);
  
  // 表单状态
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [includeAllIndustries, setIncludeAllIndustries] = useState(true);
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryType[]>([]);
  
  // 恢复选项
  const [overwriteOnRestore, setOverwriteOnRestore] = useState(false);
  const [createBackupBeforeRestore, setCreateBackupBeforeRestore] = useState(true);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<BackupStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<BackupType | ''>('');
  
  // 加载备份列表
  const loadBackups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams: BackupQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };
      
      if (statusFilter) queryParams.status = statusFilter;
      if (typeFilter) queryParams.type = typeFilter;
      
      const result = await backupService.getBackups(queryParams);
      setBackups(result.backups);
      setTotalBackups(result.total);
    } catch (err) {
      setError('加载备份列表失败');
      console.error('加载备份列表错误:', err);
    } finally {
      setLoading(false);
    }
  }, [backupService, page, limit, statusFilter, typeFilter]);

  // 初始加载
  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // 创建备份
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      setError(null);
      
      const options: BackupOptions = {
        name: backupName || `行业配置备份_${new Date().toLocaleDateString()}`,
        description: backupDescription,
        includeAllIndustries,
        type: BackupType.MANUAL,
      };
      
      if (!includeAllIndustries && selectedIndustries.length > 0) {
        options.industryIds = selectedIndustries;
      }
      
      const result = await backupService.createBackup(options);
      
      if (result.success) {
        setSuccessMessage('备份创建成功');
        setOpenCreateBackupDialog(false);
        resetCreateBackupForm();
        loadBackups();
      } else {
        setError(result.error || '备份创建失败');
      }
    } catch (err) {
      setError('备份创建失败');
      console.error('创建备份错误:', err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 恢复备份
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      setIsRestoringBackup(true);
      setError(null);
      
      const options: RestoreOptions = {
        overwrite: overwriteOnRestore,
        createBackupBeforeRestore,
      };
      
      const result = await backupService.restoreBackup(selectedBackup.id, options);
      
      if (result.success) {
        setSuccessMessage(`成功恢复 ${result.restoredCount} 个行业配置`);
        setOpenRestoreDialog(false);
        loadBackups();
      } else {
        setError(result.error || '备份恢复失败');
      }
    } catch (err) {
      setError('备份恢复失败');
      console.error('恢复备份错误:', err);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // 删除备份
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await backupService.deleteBackup(selectedBackup.id);
      
      setSuccessMessage('备份删除成功');
      setOpenDeleteDialog(false);
      loadBackups();
    } catch (err) {
      setError('备份删除失败');
      console.error('删除备份错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 重置创建备份表单
  const resetCreateBackupForm = () => {
    setBackupName('');
    setBackupDescription('');
    setIncludeAllIndustries(true);
    setSelectedIndustries([]);
  };

  // 处理分页变更
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 获取状态显示文本
  const getStatusLabel = (status: BackupStatus) => {
    const labels = {
      [BackupStatus.SUCCESS]: '成功',
      [BackupStatus.IN_PROGRESS]: '进行中',
      [BackupStatus.FAILED]: '失败',
      [BackupStatus.SCHEDULED]: '已计划',
    };
    return labels[status] || status;
  };

  // 获取类型显示文本
  const getTypeLabel = (type: BackupType) => {
    const labels = {
      [BackupType.MANUAL]: '手动',
      [BackupType.AUTOMATIC]: '自动',
      [BackupType.CHANGE_TRIGGERED]: '变更触发',
    };
    return labels[type] || type;
  };

  // 获取状态颜色
  const getStatusColor = (status: BackupStatus) => {
    const colors = {
      [BackupStatus.SUCCESS]: 'success',
      [BackupStatus.IN_PROGRESS]: 'primary',
      [BackupStatus.FAILED]: 'error',
      [BackupStatus.SCHEDULED]: 'warning',
    };
    return colors[status] || 'default';
  };

  // 获取状态图标
  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case BackupStatus.SUCCESS:
        return <CheckCircle size={16} />;
      case BackupStatus.IN_PROGRESS:
        return <Refresh size={16} />;
      case BackupStatus.FAILED:
        return <Error size={16} />;
      case BackupStatus.SCHEDULED:
        return <Schedule size={16} />;
      default:
        return null;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 渲染备份操作菜单
  const renderBackupActions = (backup: BackupConfig) => {
    const isBackupRestorable = backup.status === BackupStatus.SUCCESS;
    
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <Tooltip title="查看详情">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedBackup(backup);
              setOpenBackupDetailsDialog(true);
            }}
          >
            <Info size={18} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="恢复备份">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedBackup(backup);
              setOpenRestoreDialog(true);
            }}
            disabled={!isBackupRestorable}
          >
            <Restore size={18} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="删除备份">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedBackup(backup);
              setOpenDeleteDialog(true);
            }}
            color="error"
          >
            <Delete size={18} />
          </IconButton>
        </Tooltip>
      </div>
    );
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* 标题和操作栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupTableIcon /> 行业数据备份管理
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={() => setOpenCreateBackupDialog(true)}
          sx={{ textTransform: 'none' }}
        >
          创建备份
        </Button>
      </Box>

      {/* 消息提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* 筛选栏 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={statusFilter}
            label="状态"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">全部</MenuItem>
            {Object.values(BackupStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>类型</InputLabel>
          <Select
            value={typeFilter}
            label="类型"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">全部</MenuItem>
            {Object.values(BackupType).map((type) => (
              <MenuItem key={type} value={type}>
                {getTypeLabel(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadBackups}
          disabled={loading}
          sx={{ marginLeft: 'auto' }}
        >
          刷新
        </Button>
      </Box>

      {/* 备份列表 */}
      <Card elevation={3}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>备份名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>行业数量</TableCell>
                <TableCell>大小</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // 加载状态
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ p: 2 }}>
                      <LinearProgress />
                      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        加载备份列表中...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                // 空状态
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                      <BackupIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                      <Typography variant="h6">暂无备份记录</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        点击"创建备份"按钮开始备份行业配置
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                // 备份列表
                backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>{backup.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(backup.type)}
                        size="small"
                        sx={{ backgroundColor: '#e3f2fd' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(backup.status)}
                        label={getStatusLabel(backup.status)}
                        color={getStatusColor(backup.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{backup.industryCount}</TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{formatDateTime(backup.createdAt)}</TableCell>
                    <TableCell align="right">
                      {renderBackupActions(backup)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* 分页信息 */}
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              共 {totalBackups} 个备份
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
              >
                上一页
              </Button>
              <Typography variant="body2">
                {page} / {Math.ceil(totalBackups / limit)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(totalBackups / limit) || loading}
              >
                下一页
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 创建备份对话框 */}
      <Dialog
        open={openCreateBackupDialog}
        onClose={() => {
          setOpenCreateBackupDialog(false);
          resetCreateBackupForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>创建行业配置备份</DialogTitle>
        <DialogContent>
          <DialogContentText>
            创建行业配置的备份，可用于数据恢复和版本控制。
          </DialogContentText>
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="备份名称"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              fullWidth
              placeholder="例如：季度备份_2024Q4"
            />
            
            <TextField
              label="备份描述（可选）"
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="描述此备份的用途或内容"
            />
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeAllIndustries}
                    onChange={(e) => setIncludeAllIndustries(e.target.checked)}
                  />
                }
                label="包含所有行业配置"
              />
              
              {!includeAllIndustries && (
                <Typography variant="body2" color="textSecondary">
                  注：选择特定行业功能将在后续版本中实现
                </Typography>
              )}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCreateBackupDialog(false);
              resetCreateBackupForm();
            }}
            disabled={isCreatingBackup}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={isCreatingBackup}
            startIcon={<BackupIcon />}
          >
            {isCreatingBackup ? '创建中...' : '创建备份'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 恢复备份对话框 */}
      <Dialog
        open={openRestoreDialog}
        onClose={() => setOpenRestoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>恢复备份</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Warning size={20} sx={{ mr: 1 }} />
            恢复操作可能会覆盖当前的行业配置，建议先创建备份。
          </Alert>
          
          {selectedBackup && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2">备份信息：</Typography>
              <Typography variant="body2">
                名称：{selectedBackup.name}
              </Typography>
              <Typography variant="body2">
                创建时间：{formatDateTime(selectedBackup.createdAt)}
              </Typography>
              <Typography variant="body2">
                包含行业数量：{selectedBackup.industryCount}
              </Typography>
            </Box>
          )}
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={overwriteOnRestore}
                  onChange={(e) => setOverwriteOnRestore(e.target.checked)}
                />
              }
              label="覆盖现有行业配置"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={createBackupBeforeRestore}
                  onChange={(e) => setCreateBackupBeforeRestore(e.target.checked)}
                />
              }
              label="恢复前创建当前配置的备份"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenRestoreDialog(false)}
            disabled={isRestoringBackup}
          >
            取消
          </Button>
          <Button
            onClick={handleRestoreBackup}
            variant="contained"
            disabled={isRestoringBackup}
            startIcon={<Restore />}
          >
            {isRestoringBackup ? '恢复中...' : '确认恢复'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除备份对话框 */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>删除备份</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除此备份吗？此操作不可撤销。
          </DialogContentText>
          
          {selectedBackup && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                备份名称：{selectedBackup.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteBackup}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={<Delete />}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 备份详情对话框 */}
      <Dialog
        open={openBackupDetailsDialog}
        onClose={() => setOpenBackupDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>备份详情</DialogTitle>
        <DialogContent>
          {selectedBackup && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6">基本信息</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">备份ID</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedBackup.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">状态</Typography>
                    <Chip
                      icon={getStatusIcon(selectedBackup.status)}
                      label={getStatusLabel(selectedBackup.status)}
                      color={getStatusColor(selectedBackup.status)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">类型</Typography>
                    <Typography variant="body2">
                      {getTypeLabel(selectedBackup.type)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">创建者</Typography>
                    <Typography variant="body2">
                      {selectedBackup.createdBy || '系统'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">创建时间</Typography>
                    <Typography variant="body2">
                      {formatDateTime(selectedBackup.createdAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">完成时间</Typography>
                    <Typography variant="body2">
                      {selectedBackup.completedAt
                        ? formatDateTime(selectedBackup.completedAt)
                        : '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">包含行业数量</Typography>
                    <Typography variant="body2">{selectedBackup.industryCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">备份大小</Typography>
                    <Typography variant="body2">{formatFileSize(selectedBackup.size)}</Typography>
                  </Box>
                </Box>
              </Box>
              
              {selectedBackup.description && (
                <Box>
                  <Typography variant="h6">描述</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2">{selectedBackup.description}</Typography>
                </Box>
              )}
              
              {selectedBackup.errorMessage && (
                <Box>
                  <Typography variant="h6" color="error">错误信息</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {selectedBackup.errorMessage}
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBackupDetailsDialog(false)}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
