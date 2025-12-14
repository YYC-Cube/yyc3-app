# 🔖 日志与错误处理系统指南

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

本文档详细说明如何在项目中使用统一的日志系统和错误处理机制。

## 目录

- [🔖 日志与错误处理系统指南](#-日志与错误处理系统指南)
  - [目录](#目录)
  - [日志系统](#日志系统)
    - [日志配置](#日志配置)
    - [基本日志记录](#基本日志记录)
    - [请求日志](#请求日志)
    - [错误日志](#错误日志)
    - [性能日志](#性能日志)
  - [错误处理](#错误处理)
    - [自定义错误类](#自定义错误类)
    - [错误处理中间件](#错误处理中间件)
    - [错误抛出与处理示例](#错误抛出与处理示例)
  - [服务集成](#服务集成)
    - [集成步骤](#集成步骤)
    - [最佳实践](#最佳实践)
  - [配置示例](#配置示例)
  - [📄 文档标尾 (Footer)](#-文档标尾-footer)

## 日志系统

### 日志配置

日志系统基于 `winston` 库实现，支持以下特性：

- 结构化JSON格式日志
- 按级别分离的日志文件
- 自动日志轮转（每个文件最大5MB，保留多个历史文件）
- 开发环境彩色控制台输出
- 异步日志写入，不阻塞主线程

日志文件位置：`/Users/yanyu/www/logs/`

### 基本日志记录

在任何需要记录日志的文件中，引入日志模块：

```javascript
const { logger } = require('../shared/logger');

// 不同级别的日志记录
logger.debug('这是一条调试日志');
logger.info('这是一条信息日志');
logger.warn('这是一条警告日志');
logger.error('这是一条错误日志');

// 记录对象信息
logger.info('用户登录', { userId: '123', username: 'testuser', ip: '192.168.1.1' });
```

### 请求日志

在 Express 应用中使用请求日志中间件：

```javascript
const { logRequest } = require('../shared/logger');

app.use(logRequest);
```

这将自动记录所有HTTP请求，包括：

- 请求方法和URL
- 状态码
- 响应时间
- IP地址
- 用户代理
- 请求参数和查询字符串
- 在开发环境或错误状态下记录请求体和响应体

### 错误日志

使用专门的错误日志函数记录详细的错误信息：

```javascript
const { logError } = require('../shared/logger');

try {
  // 可能抛出错误的代码
} catch (error) {
  logError(error, { 
    operation: 'database_query',
    entity: 'user',
    userId: '123'
  });
}
```

### 性能日志

记录关键操作的性能指标：

```javascript
const { logPerformance } = require('../shared/logger');

const startTime = Date.now();

// 执行操作
performHeavyOperation();

const duration = Date.now() - startTime;
logPerformance('heavy_operation', duration, { operationType: 'data_processing' });
```

## 错误处理

### 自定义错误类

系统提供了多种预定义的错误类，适用于不同场景：

```javascript
const { 
  AppError, 
  ValidationError, 
  AuthorizationError, 
  ForbiddenError, 
  NotFoundError 
} = require('../shared/errorHandler');
```

**使用示例：**

```javascript
// 验证错误
throw new ValidationError('请求参数无效', [
  { field: 'email', message: '邮箱格式不正确' },
  { field: 'password', message: '密码长度不能少于8位' }
]);

// 认证错误
throw new AuthorizationError('未授权访问，请登录');

// 资源未找到
throw new NotFoundError('用户不存在', { userId: '123' });
```

### 错误处理中间件

在 Express 应用中使用错误处理中间件：

```javascript
const { errorHandler, notFoundHandler } = require('../shared/errorHandler');

// 在所有路由定义之后添加
app.use(notFoundHandler); // 处理404错误
app.use(errorHandler);    // 处理所有其他错误
```

### 错误抛出与处理示例

在控制器中抛出错误：

```javascript
const { ValidationError, NotFoundError } = require('../shared/errorHandler');

async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // 验证数据
    if (!updateData.name || updateData.name.trim() === '') {
      throw new ValidationError('用户名不能为空', [{ field: 'name', message: '用户名不能为空' }]);
    }
    
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在', { userId });
    }
    
    // 更新用户
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    res.json({ status: 'success', data: updatedUser });
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
}
```

## 服务集成

### 集成步骤

将日志和错误处理系统集成到新服务中：

1. **设置环境变量**：

   ```javascript
   process.env.SERVICE_NAME = 'service_name'; // 例如 'api', 'admin', 'llm', 'mail'
   ```

2. **引入并初始化模块**：

   ```javascript
   const { logger, logRequest } = require('../shared/logger');
   const {
     errorHandler,
     notFoundHandler,
     setupGlobalErrorHandlers
   } = require('../shared/errorHandler');
   
   // 设置全局错误处理
   setupGlobalErrorHandlers();
   ```

3. **使用中间件**：

   ```javascript
   // 在路由之前使用请求日志中间件
   app.use(logRequest);
   
   // 定义路由...
   
   // 在所有路由之后使用错误处理中间件
   app.use(notFoundHandler);
   app.use(errorHandler);
   ```

4. **替换 console.log**：

   ```javascript
   // 使用 logger.info 替代 console.log
   logger.info('服务已启动');
   
   // 使用 logger.error 替代 console.error
   logger.error('发生错误');
   ```

5. **添加优雅关闭处理**：

   ```javascript
   process.on('SIGTERM', () => {
     logger.info('接收到SIGTERM信号，准备关闭服务');
     // 添加清理逻辑
     setTimeout(() => {
       logger.info('服务已关闭');
       process.exit(0);
     }, 1000);
   });
   ```

### 最佳实践

1. **始终使用结构化日志**：传递相关上下文信息作为第二个参数
2. **使用适当的日志级别**：debug、info、warn、error
3. **避免在生产环境日志中记录敏感信息**：密码、令牌等
4. **捕获所有可能的错误**：使用 try/catch 包装异步操作
5. **使用预定义的错误类**：而不是直接使用 Error 构造函数
6. **在错误处理中间件前注册所有路由**：确保所有错误都能被捕获

## 配置示例

完整的服务配置示例（参考 `api/server.js`）：

```javascript
const express = require('express');
const app = express();

// 设置环境变量
process.env.SERVICE_NAME = 'your_service_name';

// 引入共享模块
const { logger, logRequest } = require('../shared/logger');
const {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers
} = require('../shared/errorHandler');

// 设置全局错误处理
setupGlobalErrorHandlers();

// 中间件
app.use(express.json());
app.use(logRequest);

// 路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理中间件
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`服务运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('准备关闭服务');
  setTimeout(() => process.exit(0), 1000);
});

---

## 📄 文档标尾 (Footer)

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
