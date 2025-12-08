require('dotenv').config();
const express = require('express');
const app = express();
const statusRouter = require('./routes/status');
const redisService = require('./services/redis');

// 初始化 Redis（失败不阻塞 API 启动，但会在健康接口反映）
redisService.init()
  .then(() => console.log('[Redis] connected'))
  .catch((err) => console.warn('[Redis] not connected:', err.message));

app.use(express.json());
app.use('/status', statusRouter);

// 只有在直接运行此文件时才启动服务器
// 在测试环境中，我们只导出 app 对象
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
  });
}

// 导出 app 对象供测试使用
module.exports = app;
