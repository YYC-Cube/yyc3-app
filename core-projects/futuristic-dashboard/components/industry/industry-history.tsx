/**
 * @file 行业配置历史记录组件
 * @description 显示和管理行业配置的历史记录，支持版本比较和回滚
 * @module components/industry-history
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useEffect } from 'react';
import { Industry, IndustryConfigHistory } from '../../lib/industry/industry-types';
import { IndustryHistoryService } from '../../lib/industry/industry-history-service';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Chip
} from '@mui/material';
import { History, Restore, CompareArrows, Visibility, Refresh } from '@mui/icons-material';

interface IndustryHistoryProps {
  industryId: string;
  onVersionRollback: (industry: Industry) => void;
  operatorInfo: {
    id: string;
    name: string;
  };
}

type OperationType = 'create' | 'update' | 'delete' | 'rollback';

/**
 * @description 获取操作类型的中文名称
 */
const getOperationTypeName = (type: OperationType): string => {
  const typeMap: Record<OperationType, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    rollback: '回滚'
  };
  return typeMap[type] || type;
};

/**
 * @description 获取操作类型的颜色
 */
const getOperationTypeColor = (type: OperationType): string => {
  const colorMap: Record<OperationType, string> = {
    create: 'success',
    update: 'primary',
    delete: 'error',
    rollback: 'warning'
  };
  return colorMap[type] || 'default';
};

/**
 * @description 行业配置历史记录组件
 */
export const IndustryHistory: React.FC<IndustryHistoryProps> = ({
  industryId,
  onVersionRollback,
  operatorInfo
}) => {
  const [historyData, setHistoryData] = useState<IndustryConfigHistory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<IndustryConfigHistory | null>(null);
  const [compareVersion, setCompareVersion] = useState<IndustryConfigHistory | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  /**
   * @description 加载历史记录数据
   */
  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * rowsPerPage;
      const result = await IndustryHistoryService.getIndustryHistory(industryId, rowsPerPage, offset);
      
      setHistoryData(result.data);
      setTotalCount(result.total);
    } catch (err) {
      setError('加载历史记录失败，请重试');
      console.error('加载历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description 处理版本回滚
   */
  const handleRollback = async () => {
    if (!selectedVersion || !rollbackReason.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const request = {
        historyId: selectedVersion.id,
        reason: rollbackReason.trim()
      };
      
      const updatedIndustry = await IndustryHistoryService.rollbackToVersion(
        request,
        operatorInfo.id,
        operatorInfo.name
      );
      
      setSuccess('版本回滚成功');
      setShowRollbackDialog(false);
      setRollbackReason('');
      setSelectedVersion(null);
      
      // 通知父组件
      onVersionRollback(updatedIndustry);
      
      // 重新加载历史记录
      loadHistoryData();
    } catch (err) {
      setError('版本回滚失败，请重试');
      console.error('版本回滚失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description 显示回滚对话框
   */
  const showRollbackConfirm = (version: IndustryConfigHistory) => {
    setSelectedVersion(version);
    setShowRollbackDialog(true);
  };

  /**
   * @description 显示版本详情对话框
   */
  const showVersionDetails = (version: IndustryConfigHistory) => {
    setSelectedVersion(version);
    setShowVersionDialog(true);
  };

  /**
   * @description 开始版本比较
   */
  const startCompare = (version: IndustryConfigHistory) => {
    if (compareVersion) {
      // 已经选择了一个版本，开始比较
      setSelectedVersion(version);
      setShowCompareDialog(true);
      setCompareVersion(null);
    } else {
      // 选择第一个比较版本
      setCompareVersion(version);
    }
  };

  /**
   * @description 渲染版本详情
   */
  const renderVersionDetails = (version: IndustryConfigHistory) => {
    const { configData } = version;
    
    return (
      <div className="space-y-4">
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="subtitle1" className="font-bold mb-2">基本信息</Typography>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>名称:</strong> {configData.name}</div>
            <div><strong>编码:</strong> {configData.code}</div>
            <div><strong>类型:</strong> {configData.type}</div>
            <div><strong>状态:</strong> {configData.status}</div>
            <div><strong>子域名:</strong> {configData.subdomain}</div>
            <div><strong>图标:</strong> {configData.icon}</div>
          </div>
        </Box>
        
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="subtitle1" className="font-bold mb-2">描述</Typography>
          <div className="whitespace-pre-line">{configData.description}</div>
        </Box>
        
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="subtitle1" className="font-bold mb-2">代理配置</Typography>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>启用:</strong> {configData.proxyConfig.enabled ? '是' : '否'}</div>
            <div><strong>主机:</strong> {configData.proxyConfig.host}</div>
            <div><strong>端口:</strong> {configData.proxyConfig.port}</div>
            <div><strong>用户名:</strong> {configData.proxyConfig.username}</div>
            <div colSpan={2}><strong>密码:</strong> ********</div>
          </div>
        </Box>
        
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="subtitle1" className="font-bold mb-2">主题配置</Typography>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <strong>主色调:</strong>
              <div className="w-6 h-6 ml-2 inline-block rounded-full" style={{ backgroundColor: configData.theme.primaryColor }}></div>
            </div>
            <div>
              <strong>背景色:</strong>
              <div className="w-6 h-6 ml-2 inline-block rounded-full border border-gray-300" style={{ backgroundColor: configData.theme.backgroundColor }}></div>
            </div>
            <div>
              <strong>文字色:</strong>
              <div className="w-6 h-6 ml-2 inline-block rounded-full border border-gray-300" style={{ backgroundColor: configData.theme.textColor }}></div>
            </div>
          </div>
        </Box>
        
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="subtitle1" className="font-bold mb-2">操作信息</Typography>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>操作类型:</strong> {getOperationTypeName(version.operationType)}</div>
            <div><strong>操作描述:</strong> {version.operationDesc}</div>
            <div><strong>操作者:</strong> {version.operatorName}</div>
            <div><strong>操作时间:</strong> {new Date(version.createdAt).toLocaleString('zh-CN')}</div>
          </div>
        </Box>
      </div>
    );
  };

  /**
   * @description 渲染版本比较
   */
  const renderVersionCompare = () => {
    if (!selectedVersion || !compareVersion) return null;
    
    const diffs = IndustryHistoryService.compareVersions(compareVersion, selectedVersion);
    
    return (
      <div className="space-y-4">
        <Box className="flex justify-between items-center">
          <Typography variant="subtitle1" className="font-bold">版本比较</Typography>
          <div className="flex gap-2">
            <Chip 
              label={`版本1: ${new Date(compareVersion.createdAt).toLocaleString('zh-CN')}`}
              color="primary"
              size="small"
            />
            <Typography variant="body2">→</Typography>
            <Chip 
              label={`版本2: ${new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}`}
              color="secondary"
              size="small"
            />
          </div>
        </Box>
        
        {Object.keys(diffs).length === 0 ? (
          <Typography variant="body1" className="text-center text-gray-500">
            两个版本之间没有差异
          </Typography>
        ) : (
          <div className="space-y-4">
            {Object.entries(diffs).map(([key, diff]) => (
              <div key={key} className="p-4 border rounded-lg bg-gray-50">
                <Typography variant="subtitle2" className="font-bold mb-2">
                  {key === 'proxyConfig' ? '代理配置' : 
                   key === 'theme' ? '主题配置' : 
                   key === 'name' ? '名称' :
                   key === 'code' ? '编码' :
                   key === 'type' ? '类型' :
                   key === 'description' ? '描述' :
                   key === 'icon' ? '图标' :
                   key === 'status' ? '状态' :
                   key === 'subdomain' ? '子域名' : key}
                </Typography>
                
                {typeof diff.old === 'object' && diff.old !== null ? (
                  // 处理嵌套对象（如proxyConfig和theme）
                  <div className="space-y-2 pl-4">
                    {Object.entries(diff.old).map(([subKey, subDiff]) => (
                      <div key={subKey} className="flex flex-col">
                        <span className="text-sm text-gray-500">{subKey}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-red-600">{diff.old[subKey]}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600">{diff.new[subKey]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // 处理简单类型
                  <div className="flex items-center gap-4">
                    <span className="text-red-600">{diff.old}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600">{diff.new}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadHistoryData();
  }, [industryId, page]);

  return (
    <div className="industry-history-container">
      <Box className="mb-4 flex justify-between items-center">
        <Typography variant="h6" className="flex items-center gap-2">
          <History size={20} />
          配置历史记录
        </Typography>
        
        {compareVersion && (
          <Box className="flex gap-2">
            <Chip 
              label="已选择比较版本，请选择第二个版本" 
              color="info"
              onDelete={() => setCompareVersion(null)}
            />
          </Box>
        )}
      </Box>

      {loading && !selectedVersion && !showRollbackDialog && !showVersionDialog && !showCompareDialog ? (
        <Box className="flex justify-center py-8">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table aria-label="industry history table">
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell>操作时间</TableCell>
                  <TableCell>操作类型</TableCell>
                  <TableCell>操作描述</TableCell>
                  <TableCell>操作者</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((version) => (
                  <TableRow
                    key={version.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      {new Date(version.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getOperationTypeName(version.operationType)}
                        color={getOperationTypeColor(version.operationType) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{version.operationDesc}</TableCell>
                    <TableCell>{version.operatorName}</TableCell>
                    <TableCell align="right">
                      <Box className="flex gap-1 justify-end">
                        <Tooltip title="查看详情">
                          <Button 
                            size="small" 
                            onClick={() => showVersionDetails(version)}
                            color="primary"
                          >
                            <Visibility size={16} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title={compareVersion ? '与已选版本比较' : '选择比较版本'}>
                          <Button 
                            size="small" 
                            onClick={() => startCompare(version)}
                            color="secondary"
                          >
                            <CompareArrows size={16} />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="回滚到此版本">
                          <Button 
                            size="small" 
                            onClick={() => showRollbackConfirm(version)}
                            color="warning"
                          >
                            <Restore size={16} />
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 分页 */}
          <Box className="mt-4 flex justify-center">
            <Pagination
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* 版本详情对话框 */}
      <Dialog
        open={showVersionDialog}
        onClose={() => setShowVersionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          <span>版本详情</span>
          {selectedVersion && (
            <Typography variant="body2" color="textSecondary">
              {new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedVersion && renderVersionDetails(selectedVersion)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionDialog(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 版本比较对话框 */}
      <Dialog
        open={showCompareDialog}
        onClose={() => {
          setShowCompareDialog(false);
          setCompareVersion(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          <span>版本比较</span>
          <Button size="small" onClick={() => {
            setShowCompareDialog(false);
            setCompareVersion(null);
          }}>
            关闭
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {renderVersionCompare()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCompareDialog(false);
            setCompareVersion(null);
          }}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 版本回滚确认对话框 */}
      <Dialog
        open={showRollbackDialog}
        onClose={() => {
          setShowRollbackDialog(false);
          setRollbackReason('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="text-amber-600">确认回滚版本</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" className="mb-4">
            您确定要将行业配置回滚到此版本吗？
            <br />
            <br />
            <strong>回滚版本时间：</strong>
            {selectedVersion && new Date(selectedVersion.createdAt).toLocaleString('zh-CN')}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="请输入回滚原因（必填）"
            value={rollbackReason}
            onChange={(e) => setRollbackReason(e.target.value)}
            variant="outlined"
            required
            placeholder="请说明为什么需要回滚到这个版本..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRollbackDialog(false);
              setRollbackReason('');
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleRollback}
            color="warning"
            disabled={!rollbackReason.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Restore size={16} />}
          >
            确认回滚
          </Button>
        </DialogActions>
      </Dialog>

      {/* 错误提示 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* 成功提示 */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </div>
  );
};
