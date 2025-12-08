/**
 * @file 行业统计仪表盘组件
 * @description 展示行业数据的统计和分析图表
 * @author YYC
 * @created 2024-10-15
 * @updated 2024-10-15
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, Divider, LinearProgress } from '@mui/material';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Warning, CheckCircle, TrendingUp, BarChart, Layers, Shield, Settings } from '@mui/icons-material';
import { IndustryStatsService, IndustryStats } from '@/lib/industry/industry-stats-service';

/**
 * 行业统计仪表板组件
 * 展示行业数据的统计和分析信息
 */
export const IndustryStatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<IndustryStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取统计数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 并行获取所有统计数据
        const [statsData, trendsData, distributionData, healthData] = await Promise.all([
          IndustryStatsService.getIndustryStats(),
          IndustryStatsService.getIndustryTrends(),
          IndustryStatsService.getIndustryTypeDistribution(),
          IndustryStatsService.getIndustryHealthReport()
        ]);
        
        setStats(statsData);
        setTrends(trendsData);
        setDistribution(distributionData);
        setHealthReport(healthData);
        setError(null);
      } catch (err) {
        console.error('获取行业统计数据失败:', err);
        setError('无法加载行业统计数据，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 渲染加载状态
  if (loading) {
    return (
      <div className="py-8 px-4">
        <Typography variant="h6" align="center">加载行业统计数据...</Typography>
        <LinearProgress className="mt-4" />
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="py-8 px-4">
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 600, bgcolor: 'rgb(var(--destructive) / 0.1)', borderColor: 'rgb(var(--destructive) / 0.5)', border: '1px solid' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'rgb(var(--destructive))', mr: 2 }} />
                <Typography variant="h6" color="error">数据加载失败</Typography>
              </Box>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        </Box>
      </div>
    );
  }

  // 获取健康状态颜色
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'rgb(var(--secondary-foreground))'; // 绿色
  if (score >= 60) return 'rgb(var(--primary))'; // 黄色
  return 'rgb(var(--destructive))'; // 红色
  };

  // 获取健康状态文本
  const getHealthText = (score: number) => {
    if (score >= 80) return '健康';
    if (score >= 60) return '一般';
    return '需要注意';
  };

  return (
    <div className="p-4">
      {/* 页面标题 */}
      <Typography variant="h4" component="h1" gutterBottom>
        行业数据统计分析
      </Typography>
      
      {/* 关键指标卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'rgb(var(--primary) / 0.1)', borderLeft: '4px solid rgb(var(--primary))' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                总行业数量
              </Typography>
              <Typography variant="h5" component="div" gutterBottom>
                {stats?.totalCount || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={16} sx={{ color: 'rgb(var(--primary))', mr: 1 }} />
                <Typography variant="body2">
                  所有已创建的行业
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'rgb(var(--secondary) / 0.5)', borderLeft: '4px solid rgb(var(--secondary-foreground))' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                活跃行业数量
              </Typography>
              <Typography variant="h5" component="div" gutterBottom>
                {stats?.activeCount || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle size={16} sx={{ color: 'rgb(var(--secondary-foreground))', mr: 1 }} />
                <Typography variant="body2">
                  当前正在使用的行业
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'rgb(var(--destructive) / 0.1)', borderLeft: '4px solid rgb(var(--destructive))' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                非活跃行业数量
              </Typography>
              <Typography variant="h5" component="div" gutterBottom>
                {stats?.inactiveCount || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning size={16} sx={{ color: 'rgb(var(--destructive))', mr: 1 }} />
                <Typography variant="body2">
                  未激活或已停用的行业
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'rgb(var(--accent) / 0.3)', borderLeft: '4px solid rgb(var(--primary))' }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                代理启用率
              </Typography>
              <Typography variant="h5" component="div" gutterBottom>
                {stats?.proxyEnabledRate || 0}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Settings size={16} sx={{ color: 'rgb(var(--primary))', mr: 1 }} />
                <Typography variant="body2">
                  已配置代理的行业比例
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 图表和报告区域 */}
      <Grid container spacing={3}>
        {/* 行业趋势图表 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 2, color: 'rgb(var(--primary))' }} />
                  行业数量趋势
                </Box>
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="newIndustries" 
                    stroke="rgb(var(--destructive))" 
                    name="新增行业" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activeIndustries" 
                    stroke="rgb(var(--secondary-foreground))" 
                    name="活跃行业" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 行业类型分布 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChart sx={{ mr: 2, color: 'rgb(var(--primary))' }} />
                  行业类型分布
                </Box>
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="rgb(var(--muted-foreground))"
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 健康状态报告 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Shield sx={{ mr: 2, color: getHealthColor(healthReport?.overallHealth || 0) }} />
                  系统健康状态报告
                </Box>
              </Typography>
              
              {/* 健康分数 */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">健康分数</Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: getHealthColor(healthReport?.overallHealth || 0) }}
                  >
                    {healthReport?.overallHealth || 0} / 100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={healthReport?.overallHealth || 0} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'rgb(var(--border))',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getHealthColor(healthReport?.overallHealth || 0)
                    }
                  }} 
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                  <Chip 
                    label={getHealthText(healthReport?.overallHealth || 0)} 
                    sx={{ 
                      bgcolor: getHealthColor(healthReport?.overallHealth || 0) + '20',
                      color: getHealthColor(healthReport?.overallHealth || 0),
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>
              </Box>
              
              {/* 问题列表 */}
              {healthReport?.issues && healthReport.issues.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>发现的问题</Typography>
                  {healthReport.issues.map((issue: any, index: number) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'rgb(var(--secondary))', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {issue.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Chip 
                          label={issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'} 
                          size="small" 
                          sx={{
                            bgcolor: issue.severity === 'high' ? 'rgb(var(--destructive) / 0.1)' :
          issue.severity === 'medium' ? 'rgb(var(--primary) / 0.1)' : 'rgb(var(--border))',
        color: issue.severity === 'high' ? 'rgb(var(--destructive))' :
          issue.severity === 'medium' ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))'
                          }}
                        />
                        <Typography variant="caption">
                          影响 {issue.affectedIndustries} 个行业
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* 改进建议 */}
              {healthReport?.recommendations && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>改进建议</Typography>
                  {healthReport.recommendations.map((rec: string, index: number) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                      <span sx={{ mr: 1, color: 'rgb(var(--secondary-foreground))' }}>•</span> {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 最近创建的行业 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Layers sx={{ mr: 2, color: 'rgb(var(--primary))' }} />
                  最近创建的行业
                </Box>
              </Typography>
              
              {stats?.recentlyCreated && stats.recentlyCreated.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.recentlyCreated.map((industry, index) => (
                    <Box 
                      key={industry.id} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgb(var(--secondary))', 
                        borderRadius: 1,
                        border: '1px solid rgb(var(--border))',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgb(var(--muted))',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }
                      }} 
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {industry.name}
                      </Typography>
                      <Box sx={{ display: 'flex', mt: 1, gap: 2 }}>
                        <Chip 
                          label={industry.status === 'active' ? '活跃' : '非活跃'} 
                          size="small" 
                          sx={{
                            bgcolor: industry.status === 'active' ? 'rgb(var(--secondary) / 0.5)' : 'rgb(var(--destructive) / 0.1)',
        color: industry.status === 'active' ? 'rgb(var(--secondary-foreground))' : 'rgb(var(--destructive))'
                          }}
                        />
                        <Chip 
                          label={industry.type} 
                          size="small" 
                          sx={{ bgcolor: 'rgb(var(--primary) / 0.1)', color: 'rgb(var(--primary))' }}
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        创建时间: {new Date(industry.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: 'rgb(var(--muted-foreground))' }}>
                        {industry.description && industry.description.length > 50 
                          ? industry.description.substring(0, 50) + '...' 
                          : industry.description || '无描述'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                  暂无行业数据
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default IndustryStatsDashboard;
