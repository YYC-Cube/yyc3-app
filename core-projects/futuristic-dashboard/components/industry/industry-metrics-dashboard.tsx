/**
 * @file 行业API性能监控仪表盘组件
 * @description 展示行业API性能监控数据、趋势图表和告警信息
 * @module industry-metrics-dashboard
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Refresh as RefreshIcon,
  ChevronDown as ChevronDownIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { IndustryMetricsService } from '../../lib/industry/industry-metrics-service';
import { PerformanceDashboardData, ApiPerformanceTrend, PerformanceAlert } from '../../lib/industry/industry-metrics-types';

// 时间范围选项
const TIME_RANGES = [
  { label: '过去1小时', value: '1h' },
  { label: '过去6小时', value: '6h' },
  { label: '过去12小时', value: '12h' },
  { label: '过去24小时', value: '24h' },
  { label: '过去7天', value: '7d' },
  { label: '过去30天', value: '30d' }
];

// 图表类型选项
const CHART_TYPES = [
  { label: '响应时间', value: 'response_time' },
  { label: '请求数量', value: 'request_count' },
  { label: '成功率', value: 'success_rate' },
  { label: '错误率', value: 'error_rate' }
];

// 格式化日期时间
const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化大数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// 获取告警严重程度样式
const getSeverityStyles = (severity: 'info' | 'warning' | 'critical') => {
  switch (severity) {
    case 'critical':
      return { color: 'error.main', bgColor: 'rgba(244, 67, 54, 0.1)' };
    case 'warning':
      return { color: 'warning.main', bgColor: 'rgba(255, 193, 7, 0.1)' };
    case 'info':
      return { color: 'primary.main', bgColor: 'rgba(33, 150, 243, 0.1)' };
    default:
      return { color: 'text.secondary', bgColor: 'rgba(0, 0, 0, 0.04)' };
  }
};

// 获取告警图标
const getAlertIcon = (severity: 'info' | 'warning' | 'critical') => {
  switch (severity) {
    case 'critical':
      return <AlertCircleIcon sx={{ color: 'error.main', fontSize: 18 }} />;
    case 'warning':
      return <AlertCircleIcon sx={{ color: 'warning.main', fontSize: 18 }} />;
    case 'info':
      return <AlertCircleIcon sx={{ color: 'primary.main', fontSize: 18 }} />;
    default:
      return <AlertCircleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />;
  }
};

interface IndustryMetricsDashboardProps {
  industryId?: string;
}

export const IndustryMetricsDashboard: React.FC<IndustryMetricsDashboardProps> = ({ industryId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<PerformanceDashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedChartType, setSelectedChartType] = useState('response_time');
  const [activeTab, setActiveTab] = useState(0);
  
  const metricsService = new IndustryMetricsService();
  
  // 计算时间范围
  const calculateTimeRange = (range: string): { startTime: Date; endTime: Date } => {
    const endTime = new Date();
    const startTime = new Date();
    
    switch (range) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(startTime.getHours() - 6);
        break;
      case '12h':
        startTime.setHours(startTime.getHours() - 12);
        break;
      case '24h':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setMonth(startTime.getMonth() - 1);
        break;
      default:
        startTime.setDate(startTime.getDate() - 1);
    }
    
    return { startTime, endTime };
  };
  
  // 加载数据
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { startTime, endTime } = calculateTimeRange(selectedTimeRange);
      const data = await metricsService.getPerformanceDashboardData(startTime, endTime);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载和时间范围变化时重新加载数据
  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);
  
  // 处理刷新
  const handleRefresh = () => {
    loadDashboardData();
  };
  
  // 处理告警解决
  const handleResolveAlert = async (alertId: string) => {
    try {
      await metricsService.resolvePerformanceAlert(alertId);
      // 重新加载数据
      loadDashboardData();
    } catch (err) {
      setError('解决告警失败');
    }
  };
  
  // 获取选中的趋势数据
  const getSelectedTrendData = (): ApiPerformanceTrend | undefined => {
    if (!dashboardData?.recentTrends || dashboardData.recentTrends.length === 0) {
      return undefined;
    }
    return dashboardData.recentTrends[0];
  };
  
  // 渲染主要图表
  const renderMainChart = () => {
    const trendData = getSelectedTrendData();
    if (!trendData || !trendData.dataPoints.length) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1">暂无趋势数据</Typography>
        </Box>
      );
    }
    
    const chartData = trendData.dataPoints.map(point => ({
      timestamp: formatDateTime(point.timestamp),
      response_time: point.averageResponseTime,
      request_count: point.requestCount,
      success_rate: point.successRate,
      error_rate: 100 - point.successRate
    }));
    
    let ChartComponent: any = LineChart;
    let DataComponent: any = Line;
    
    if (selectedChartType === 'request_count') {
      ChartComponent = BarChart;
      DataComponent = Bar;
    } else if (selectedChartType === 'success_rate' || selectedChartType === 'error_rate') {
      ChartComponent = AreaChart;
      DataComponent = Area;
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            interval={Math.ceil(chartData.length / 10)}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={
              <Typography 
                variant="caption" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle' }}
              >
                {selectedChartType === 'response_time' && '响应时间(ms)'}
                {selectedChartType === 'request_count' && '请求数量'}
                {selectedChartType === 'success_rate' && '成功率(%)'}
                {selectedChartType === 'error_rate' && '错误率(%)'}
              </Typography>
            }
          />
          <RechartsTooltip 
            formatter={(value: number) => {
              if (selectedChartType === 'response_time') return [`${value.toFixed(2)} ms`, '响应时间'];
              if (selectedChartType === 'request_count') return [`${value}`, '请求数量'];
              if (selectedChartType === 'success_rate' || selectedChartType === 'error_rate') 
                return [`${value.toFixed(2)}%`, selectedChartType === 'success_rate' ? '成功率' : '错误率'];
              return [value, ''];
            }}
          />
          <Legend />
          <DataComponent 
            type="monotone" 
            dataKey={selectedChartType} 
            stroke={selectedChartType === 'error_rate' ? '#f44336' : '#2196f3'}
            fill={selectedChartType === 'success_rate' ? 'rgba(76, 175, 80, 0.2)' : 
                  selectedChartType === 'error_rate' ? 'rgba(244, 67, 54, 0.2)' : 'none'}
            strokeWidth={2}
            name={
              selectedChartType === 'response_time' ? '响应时间' :
              selectedChartType === 'request_count' ? '请求数量' :
              selectedChartType === 'success_rate' ? '成功率' : '错误率'
            }
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };
  
  // 渲染性能指标卡片
  const renderMetricCards = () => {
    if (!dashboardData?.summary) return null;
    
    const { summary } = dashboardData;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">总请求量</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" fontWeight="bold">{formatNumber(summary.totalRequests)}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                总调用次数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">平均响应时间</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" fontWeight="bold">{summary.averageResponseTime}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>ms</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                所有API的平均响应时间
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">成功率</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ color: summary.overallSuccessRate > 95 ? 'success.main' : 'warning.main' }}
                >
                  {summary.overallSuccessRate}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                请求成功的比例
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">活跃行业</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" fontWeight="bold">{summary.activeIndustriesCount}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                有API调用的行业数量
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // 渲染API性能表格
  const renderApiPerformanceTable = () => {
    if (!dashboardData?.industryMetrics || dashboardData.industryMetrics.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">暂无API性能数据</Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>行业</TableCell>
              <TableCell>API路径</TableCell>
              <TableCell>方法</TableCell>
              <TableCell align="right">请求次数</TableCell>
              <TableCell align="right">平均响应时间(ms)</TableCell>
              <TableCell align="right">成功率</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardData.industryMetrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell>{metric.industryName}</TableCell>
                <TableCell>{metric.apiPath}</TableCell>
                <TableCell>
                  <Chip 
                    label={metric.httpMethod} 
                    size="small" 
                    sx={{ 
                      bgcolor: 
                        metric.httpMethod === 'GET' ? 'primary.light' :
                        metric.httpMethod === 'POST' ? 'success.light' :
                        metric.httpMethod === 'PUT' ? 'warning.light' :
                        metric.httpMethod === 'DELETE' ? 'error.light' : 'default' 
                    }} 
                  />
                </TableCell>
                <TableCell align="right">{metric.requestCount.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <span style={{
                    color: metric.averageResponseTime > 500 ? '#f44336' :
                           metric.averageResponseTime > 200 ? '#ff9800' : '#4caf50'
                  }}>
                    {metric.averageResponseTime.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <span style={{
                    color: metric.successRate < 95 ? '#f44336' :
                           metric.successRate < 98 ? '#ff9800' : '#4caf50'
                  }}>
                    {metric.successRate.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="text">查看详情</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // 渲染告警列表
  const renderAlertsList = () => {
    if (!dashboardData?.activeAlerts || dashboardData.activeAlerts.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 48, mb: 2 }} />
          <Typography variant="body1">暂无活跃告警</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {dashboardData.activeAlerts.map((alert) => {
          const severityStyles = getSeverityStyles(alert.severity);
          return (
            <Card key={alert.id} sx={{ mb: 2, bgcolor: severityStyles.bgColor }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {getAlertIcon(alert.severity)}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {alert.industryName} - {alert.apiPath}
                      </Typography>
                      <Typography variant="body2">{alert.description}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                        <Chip 
                          label={alert.alertType === 'response_time' ? '响应时间' : 
                                 alert.alertType === 'error_rate' ? '错误率' : '请求突增'} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(0,0,0,0.04)' }} 
                        />
                        <Chip 
                          label={`${alert.currentValue}${alert.alertType === 'response_time' ? 'ms' : '%'} / ${alert.threshold}${alert.alertType === 'response_time' ? 'ms' : '%'}`} 
                          size="small" 
                          color={alert.severity === 'critical' ? 'error' : 'warning'} 
                          variant="outlined" 
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <ClockIcon sx={{ fontSize: 14, mr: 0.5 }} /> 
                      {formatDateTime(alert.triggeredAt)}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      标记为已解决
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };
  
  // 渲染主内容
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="error">加载失败</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{error}</Typography>
          <Button variant="contained" onClick={handleRefresh}>
            <RefreshIcon sx={{ mr: 1 }} /> 重试
          </Button>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        {/* 指标卡片 */}
        {renderMetricCards()}
        
        {/* 图表区域 */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">性能趋势</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>图表类型</InputLabel>
                  <Select
                    value={selectedChartType}
                    label="图表类型"
                    onChange={(e) => setSelectedChartType(e.target.value as string)}
                  >
                    {CHART_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                  刷新
                </Button>
              </Box>
            </Box>
            {renderMainChart()}
          </CardContent>
        </Card>
        
        {/* 标签页内容 */}
        <Box sx={{ mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="API性能" />
            <Tab label="活跃告警" />
          </Tabs>
          
          {activeTab === 0 && renderApiPerformanceTable()}
          {activeTab === 1 && renderAlertsList()}
        </Box>
      </Box>
    );
  };
  
  return (
    <Box>
      {/* 页面头部 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {industryId ? '行业API性能监控' : '整体API性能监控'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={selectedTimeRange}
              label="时间范围"
              onChange={(e) => setSelectedTimeRange(e.target.value as string)}
            >
              {TIME_RANGES.map(range => (
                <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            size="small"
            sx={{ display: 'none', md: 'inline-flex' }}
          >
            导出报告
          </Button>
          <IconButton size="small">
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {/* 主内容 */}
      {renderContent()}
    </Box>
  );
};
