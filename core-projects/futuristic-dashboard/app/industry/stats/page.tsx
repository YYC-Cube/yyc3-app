/**
 * @file 行业统计页面
 * @description 展示行业数据统计和分析信息
 * @author YYC
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { Container, Typography, Box, Paper } from '@mui/material';

/**
 * 行业统计页面
 * 展示行业数据的统计和分析信息
 * 使用Next.js 14 App Router服务器组件
 */
async function IndustryStatsPage() {
  // 简化版本，避免MUI兼容性问题
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          行业数据统计分析
        </Typography>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(10, 10, 10, 0.05)' }}>
          <Typography variant="body1">
            该页面展示行业数据的统计和分析信息，包括行业数量、活跃度、类型分布等关键指标。
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default IndustryStatsPage;
