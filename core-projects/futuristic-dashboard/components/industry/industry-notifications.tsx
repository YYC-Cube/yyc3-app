/**
 * @file 行业配置变更通知组件
 * @description 显示和管理行业配置变更通知
 * @component IndustryNotifications
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Divider,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Toolbar,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Bell,
  BellOff,
  CheckCircle,
  Delete,
  DeleteOutline,
  ChevronDown,
  ChevronRight,
  Info,
  Warning,
  Error,
  Settings,
  MarkChatRead,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  IndustryNotification,
  NotificationStatus,
  NotificationPriority,
  NotificationChangeType,
  NotificationQueryParams,
  NotificationSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest
} from '../../lib/industry/industry-notification-types';
import { industryNotificationService } from '../../lib/industry/industry-notification-service';

// 通知优先级对应的样式和图标
const priorityConfig = {
  [NotificationPriority.HIGH]: { color: 'error', icon: <Error fontSize="small" /> },
  [NotificationPriority.MEDIUM]: { color: 'warning', icon: <Warning fontSize="small" /> },
  [NotificationPriority.LOW]: { color: 'info', icon: <Info fontSize="small" /> }
};

// 通知类型对应的标签文本
const notificationTypeLabels: Record<NotificationChangeType, string> = {
  [NotificationChangeType.CREATE]: '行业创建',
  [NotificationChangeType.UPDATE]: '行业更新',
  [NotificationChangeType.DELETE]: '行业删除',
  [NotificationChangeType.STATUS_CHANGE]: '状态变更',
  [NotificationChangeType.BULK_OPERATION]: '批量操作',
  [NotificationChangeType.ROLLBACK]: '配置回滚',
  [NotificationChangeType.PERFORMANCE_ALERT]: '性能告警',
  [NotificationChangeType.SYSTEM]: '系统通知'
};

interface IndustryNotificationsProps {
  onNotificationClick?: (notification: IndustryNotification) => void;
  initialIndustryId?: string;
  showSidePanel?: boolean;
}

/**
 * 行业配置变更通知组件
 */
export const IndustryNotifications: React.FC<IndustryNotificationsProps> = ({
  onNotificationClick,
  initialIndustryId,
  showSidePanel = true
}) => {
  // 状态管理
  const [notifications, setNotifications] = useState<IndustryNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState<NotificationQueryParams>({
    page: currentPage,
    limit: pageSize,
    industryIds: initialIndustryId ? [initialIndustryId] : undefined,
    status: undefined,
    priority: undefined,
    changeTypes: undefined,
    startDate: undefined,
    endDate: undefined
  });

  // 加载通知数据
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await industryNotificationService.getNotifications({
        ...filters,
        page: currentPage,
        limit: pageSize
      });
      
      setNotifications(response.notifications);
      setTotalCount(response.total);
      setAllSelected(false);
      setSelectedIds([]);
    } catch (err) {
      console.error('加载通知失败:', err);
      setError('加载通知失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // 加载用户订阅
  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await industryNotificationService.getUserSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('加载订阅失败:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadNotifications();
    loadSubscriptions();
  }, [loadNotifications, loadSubscriptions]);

  // 处理状态变化
  const handleStatusChange = async (ids: string[], status: NotificationStatus) => {
    try {
      await industryNotificationService.updateNotificationStatus({
        notificationIds: ids,
        status
      });
      
      // 更新本地状态
      setNotifications(prev => 
        prev.map(notification => 
          ids.includes(notification.id) 
            ? { ...notification, status } 
            : notification
        )
      );
      
      // 清除选中
      setSelectedIds([]);
      setAllSelected(false);
      
      // 显示成功消息
      showSnackbar(
        status === NotificationStatus.READ ? '标记已读成功' : '状态更新成功',
        'success'
      );
    } catch (err) {
      console.error('更新通知状态失败:', err);
      showSnackbar('更新状态失败，请重试', 'error');
    }
  };

  // 处理删除
  const handleDelete = async (ids: string[]) => {
    try {
      await industryNotificationService.deleteBulkNotifications(ids);
      
      // 更新本地状态
      setNotifications(prev => prev.filter(notification => !ids.includes(notification.id)));
      setTotalCount(prev => Math.max(0, prev - ids.length));
      
      // 清除选中
      setSelectedIds([]);
      setAllSelected(false);
      setConfirmDeleteOpen(false);
      
      // 显示成功消息
      showSnackbar('通知删除成功', 'success');
    } catch (err) {
      console.error('删除通知失败:', err);
      showSnackbar('删除失败，请重试', 'error');
    }
  };

  // 处理选择变更
  const handleSelectChange = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 处理全选
  const handleSelectAllChange = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
    setAllSelected(!allSelected);
  };

  // 处理分页变更
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // 处理筛选变更
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // 重置到第一页
  };

  // 处理应用筛选
  const handleApplyFilters = () => {
    setFilterOpen(false);
    loadNotifications();
  };

  // 处理重置筛选
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: pageSize,
      industryIds: initialIndustryId ? [initialIndustryId] : undefined,
      status: undefined,
      priority: undefined,
      changeTypes: undefined,
      startDate: undefined,
      endDate: undefined
    });
    setCurrentPage(1);
    setFilterOpen(false);
  };

  // 处理通知点击
  const handleNotificationClick = (notification: IndustryNotification) => {
    // 如果是未读状态，先标记为已读
    if (notification.status === NotificationStatus.UNREAD) {
      handleStatusChange([notification.id], NotificationStatus.READ);
    }
    
    // 调用外部回调
    if (onNotificationClick) {
      onNotificationClick(notification);
    } else {
      // 否则切换详情显示
      setShowDetailsId(showDetailsId === notification.id ? null : notification.id);
    }
  };

  // 创建/更新订阅
  const handleSubscriptionSave = async (request: CreateSubscriptionRequest) => {
    try {
      if (subscriptions.length > 0) {
        // 更新现有订阅
        await industryNotificationService.updateSubscription(
          subscriptions[0].id,
          request as UpdateSubscriptionRequest
        );
      } else {
        // 创建新订阅
        await industryNotificationService.createSubscription(request);
      }
      
      setSubscriptionOpen(false);
      loadSubscriptions();
      showSnackbar('订阅设置已保存', 'success');
    } catch (err) {
      console.error('保存订阅失败:', err);
      showSnackbar('保存订阅失败，请重试', 'error');
    }
  };

  // 显示消息提示
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  return (
    <Box className="h-full flex flex-col">
      {/* 工具栏 */}
      <Toolbar className="flex-wrap gap-2 p-3">
        <Typography variant="h6" component="div" className="flex-grow">
          行业配置变更通知
        </Typography>
        
        <div className="flex flex-wrap gap-2">
          <Tooltip title="刷新">
            <IconButton onClick={loadNotifications} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="筛选">
            <IconButton onClick={() => setFilterOpen(true)}>
              <FilterList />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="订阅设置">
            <IconButton onClick={() => setSubscriptionOpen(true)}>
              <Settings />
            </IconButton>
          </Tooltip>
          
          {selectedIds.length > 0 && (
            <>
              <Tooltip title="标记为已读">
                <IconButton onClick={() => handleStatusChange(selectedIds, NotificationStatus.READ)}>
                  <MarkChatRead />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="删除所选">
                <IconButton onClick={() => setConfirmDeleteOpen(true)} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </Toolbar>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" className="m-3">
          {error}
          <IconButton color="inherit" size="small" onClick={() => setError(null)}>
            <DeleteOutline />
          </IconButton>
        </Alert>
      )}

      {/* 加载状态 */}
      {loading && (
        <Box className="flex-grow flex items-center justify-center p-8">
          <CircularProgress />
        </Box>
      )}

      {/* 通知列表 */}
      {!loading && notifications.length === 0 && !error && (
        <Box className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <BellOff fontSize="large" color="disabled" />
          <Typography variant="h6" className="mt-4">
            暂无通知
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            当行业配置发生变更时，这里会显示相关通知
          </Typography>
        </Box>
      )}

      {/* 通知表格 */}
      {!loading && notifications.length > 0 && (
        <TableContainer component={Paper} className="flex-grow">
          <Table aria-label="通知表格">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    onChange={handleSelectAllChange}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < notifications.length}
                  />
                </TableCell>
                <TableCell>标题</TableCell>
                <TableCell>行业</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>优先级</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <TableRow
                    className={`cursor-pointer hover:bg-gray-50 ${notification.status === NotificationStatus.UNREAD ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => handleSelectChange(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={notification.status === NotificationStatus.UNREAD ? 'bold' : 'normal'}>
                        {notification.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{notification.industryName}</TableCell>
                    <TableCell>
                      <Chip
                        label={notificationTypeLabels[notification.changeType] || notification.changeType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={priorityConfig[notification.priority]?.color || 'default'}
                        icon={priorityConfig[notification.priority]?.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.status === NotificationStatus.READ ? '已读' : '未读'}
                        size="small"
                        color={notification.status === NotificationStatus.READ ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(notification.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.status === NotificationStatus.UNREAD) {
                            handleStatusChange([notification.id], NotificationStatus.READ);
                          }
                        }}
                      >
                        {notification.status === NotificationStatus.READ ? (
                          <CheckCircle size="small" color="success" />
                        ) : (
                          <Bell size="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([notification.id]);
                          setConfirmDeleteOpen(true);
                        }}
                      >
                        <DeleteOutline size="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  {/* 通知详情展开 */}
                  {showDetailsId === notification.id && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Card variant="outlined" className="m-2">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              变更详情
                            </Typography>
                            {notification.changeDetails && notification.changeDetails.length > 0 ? (
                              <Box className="pl-4">
                                {notification.changeDetails.map((detail, index) => (
                                  <Box key={index} className="mb-2">
                                    <Typography variant="body2" fontWeight="bold">
                                      {detail.displayName || detail.field}:
                                    </Typography>
                                    {detail.oldValue === undefined ? (
                                      <Typography variant="body2" color="success.main">
                                        新增: {String(detail.newValue)}
                                      </Typography>
                                    ) : detail.newValue === undefined ? (
                                      <Typography variant="body2" color="error.main">
                                        删除: {String(detail.oldValue)}
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2">
                                        <span className="text-gray-500">{String(detail.oldValue)}</span>
                                        {' → '}
                                        <span className="text-primary">{String(detail.newValue)}</span>
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                无变更详情
                              </Typography>
                            )}
                            
                            {notification.message && (
                              <Box className="mt-4">
                                <Typography variant="subtitle1" gutterBottom>
                                  消息内容
                                </Typography>
                                <Typography variant="body2">
                                  {notification.message}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 分页 */}
      {!loading && totalCount > pageSize && (
        <Box className="p-3 flex justify-center">
          <Pagination
            count={Math.ceil(totalCount / pageSize)}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            color="primary"
          />
        </Box>
      )}

      {/* 筛选对话框 */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>筛选通知</DialogTitle>
        <DialogContent>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth>
              <InputLabel>状态</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                label="状态"
                displayEmpty
              >
                <MenuItem value="">全部状态</MenuItem>
                <MenuItem value={NotificationStatus.UNREAD}>未读</MenuItem>
                <MenuItem value={NotificationStatus.READ}>已读</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>优先级</InputLabel>
              <Select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                label="优先级"
                displayEmpty
              >
                <MenuItem value="">全部优先级</MenuItem>
                <MenuItem value={NotificationPriority.HIGH}>高</MenuItem>
                <MenuItem value={NotificationPriority.MEDIUM}>中</MenuItem>
                <MenuItem value={NotificationPriority.LOW}>低</MenuItem>
              </Select>
            </FormControl>

            {/* 可以根据需要添加更多筛选条件 */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters} color="inherit">
            重置
          </Button>
          <Button onClick={handleApplyFilters} color="primary" variant="contained">
            应用
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除选中的 {selectedIds.length} 条通知吗？此操作不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">
            取消
          </Button>
          <Button onClick={() => handleDelete(selectedIds)} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 订阅设置对话框 */}
      <Dialog
        open={subscriptionOpen}
        onClose={() => setSubscriptionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>通知订阅设置</DialogTitle>
        <DialogContent>
          {/* 这里可以添加更复杂的订阅设置UI */}
          <Typography paragraph>
            配置您希望接收的行业配置变更通知类型。
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={subscriptions.length > 0 && subscriptions[0].enabled}
                onChange={(e) => handleSubscriptionSave({
                  userId: 'current-user',
                  enabled: e.target.checked,
                  notificationTypes: [NotificationChangeType.UPDATE, NotificationChangeType.STATUS_CHANGE],
                  priorityFilter: NotificationPriority.MEDIUM
                })}
              />
            }
            label="启用通知"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscriptionOpen(false)} color="inherit">
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
