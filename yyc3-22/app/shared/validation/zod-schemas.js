/**
 * @file Zod验证模式库
 * @description 使用Zod提供强大的类型安全验证模式
 * @module validation/zod-schemas
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const { z } = require('zod');
const logger = require('../logger');

/**
 * 创建通用的分页查询模式
 */
exports.paginationSchema = z.object({
  page: z.preprocess(val => parseInt(val), z.number().int().min(1).default(1)),
  limit: z.preprocess(val => parseInt(val), z.number().int().min(1).max(100).default(20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * ID参数模式
 */
exports.idParamSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, '无效的ID格式')
});

/**
 * UUID模式
 */
exports.uuidSchema = z.string().uuid('无效的UUID格式');

/**
 * 邮箱模式
 */
exports.emailSchema = z.object({
  email: z.string()
    .email('无效的邮箱地址')
    .transform(val => val.trim().toLowerCase())
});

/**
 * 强密码模式
 */
exports.passwordSchema = z.object({
  password: z.string()
    .min(12, '密码长度至少为12位')
    .max(64, '密码长度不能超过64位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,64}$/,
      '密码必须包含大小写字母、数字和特殊字符')
});

/**
 * 用户名模式
 */
exports.usernameSchema = z.object({
  username: z.string()
    .min(3, '用户名长度至少为3位')
    .max(50, '用户名长度不能超过50位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
});

/**
 * 手机号码模式（中国）
 */
exports.phoneSchema = z.object({
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '无效的手机号码')
});

/**
 * URL模式
 */
exports.urlSchema = z.object({
  url: z.string().url('无效的URL地址')
});

/**
 * 日期范围模式
 */
exports.dateRangeSchema = z.object({
  startDate: z.string().datetime('无效的开始日期格式'),
  endDate: z.string().datetime('无效的结束日期格式')
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: '结束日期必须大于等于开始日期',
  path: ['endDate']
});

/**
 * 文件上传模式
 */
exports.fileUploadSchema = z.object({
  fileName: z.string().min(1, '文件名不能为空'),
  fileType: z.string().min(1, '文件类型不能为空'),
  fileSize: z.number().min(1, '文件大小不能为0'),
  fileContent: z.string().base64('文件内容必须是base64编码')
});

/**
 * 多语言字段模式
 */
exports.translationSchema = z.record(
  z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, '无效的语言代码'),
  z.string().min(1, '翻译内容不能为空')
);

/**
 * 创建复合模式的工具函数
 * @param {Object} schemas - 要合并的模式对象
 * @returns {z.ZodObject} 合并后的模式
 */
exports.mergeSchemas = (...schemas) => {
  return schemas.reduce((merged, schema) => merged.merge(schema), z.object({}));
};

/**
 * 为模式添加分页支持
 * @param {z.ZodObject} schema - 基础模式
 * @returns {z.ZodObject} 包含分页的模式
 */
exports.withPagination = (schema) => {
  return exports.mergeSchemas(schema, exports.paginationSchema);
};

/**
 * 创建自定义验证错误
 * @param {z.ZodError} error - Zod错误对象
 * @returns {Object} 格式化的错误对象
 */
exports.formatZodError = (error) => {
  const formattedErrors = error.errors.map(err => {
    const field = err.path.join('.');
    logger.debug(`验证错误: ${field} - ${err.message}`);
    return {
      field,
      message: err.message,
      code: 'VALIDATION_ERROR'
    };
  });
  
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: '请求参数验证失败',
      details: formattedErrors
    },
    meta: {
      timestamp: new Date().toISOString(),
      errorCount: formattedErrors.length
    }
  };
};

/**
 * 创建Zod验证中间件
 * @param {z.ZodObject} schema - Zod验证模式
 * @param {Object} options - 选项
 * @returns {Function} 中间件函数
 */
exports.createZodMiddleware = (schema, options = {}) => {
  const { source = 'all' } = options;
  
  return (req, res, next) => {
    try {
      let dataToValidate = {};
      
      // 根据source选择要验证的数据
      if (source === 'all') {
        dataToValidate = {
          ...req.body,
          ...req.query,
          ...req.params
        };
      } else if (source === 'body') {
        dataToValidate = req.body;
      } else if (source === 'query') {
        dataToValidate = req.query;
      } else if (source === 'params') {
        dataToValidate = req.params;
      }
      
      // 执行验证
      const validatedData = schema.parse(dataToValidate);
      
      // 将验证后的数据附加到请求对象
      req.validatedData = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse = exports.formatZodError(error);
        
        // 记录验证错误
        logger.warn('Zod验证失败', {
          path: req.path,
          method: req.method,
          errors: errorResponse.error.details,
          traceId: req.traceId
        });
        
        return res.status(400).json(errorResponse);
      }
      
      // 非验证错误传递给错误处理器
      next(error);
    }
  };
};

/**
 * 示例：完整的用户创建模式
 */
exports.createUserSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, '用户名长度至少为3位')
      .max(50, '用户名长度不能超过50位')
      .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    email: z.string().email('无效的邮箱地址'),
    password: z.string()
      .min(12, '密码长度至少为12位')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
        '密码必须包含大小写字母、数字和特殊字符'),
    role: z.enum(['user', 'admin', 'manager']).optional().default('user'),
    profile: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().regex(/^1[3-9]\d{9}$/, '无效的手机号码').optional()
    }).optional().default({})
  })
});

/**
 * 示例：产品创建模式
 */
exports.createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, '产品名称不能为空'),
    description: z.string().optional(),
    price: z.number().min(0, '价格不能为负数'),
    stock: z.number().int().min(0, '库存不能为负数'),
    category: z.string().min(1, '分类不能为空'),
    tags: z.array(z.string().min(1)).optional().default([]),
    images: z.array(z.string().url()).optional().default([]),
    isActive: z.boolean().optional().default(true)
  })
});
