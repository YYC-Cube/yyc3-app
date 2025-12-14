/**
 * @file API验证中间件模块
 * @description 统一的API输入验证解决方案，集成Zod和自定义验证
 * @module api/middleware/validation
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const logger = require('../../shared/logger');
const { validationMiddleware, createZodMiddleware, schemas, zodSchemas } = require('../../shared/validation');
const { ValidationError } = require('../../shared/errorHandler');

/**
 * API验证中间件集合
 * 提供统一的验证入口和常用验证规则
 */
class ApiValidator {
  constructor() {
    this._registerCustomValidators();
  }

  /**
   * 注册自定义验证器
   * @private
   */
  _registerCustomValidators() {
    // 这里可以添加API特定的自定义验证器
    logger.debug('API验证中间件初始化完成');
  }

  /**
   * 创建请求验证中间件
   * @param {object|z.ZodSchema} schema - 验证模式
   * @param {Object} options - 配置选项
   * @returns {Function} 中间件函数
   */
  createValidator(schema, options = {}) {
    const { type = 'auto', source = 'all' } = options;
    
    // 根据类型选择合适的验证中间件
    if (type === 'zod' || (schema && schema._def && schema.parse)) {
      // 使用Zod验证中间件
      return createZodMiddleware(schema, { source });
    } else {
      // 使用自定义验证中间件
      return validationMiddleware(schema, options);
    }
  }

  /**
   * 批量验证多个数据源
   * @param {Object} config - 验证配置
   * @returns {Function} 复合验证中间件
   */
  validateMultiple(config = {}) {
    return async (req, res, next) => {
      try {
        const validationPromises = [];
        const results = {};

        // 处理每个数据源的验证
        for (const [source, schema] of Object.entries(config)) {
          if (schema && req[source]) {
            validationPromises.push(
              (async () => {
                try {
                  const validator = this.createValidator(schema, { source });
                  // 创建一个虚拟的next函数来捕获验证结果
                  await new Promise((resolve, reject) => {
                    validator(req, res, (err) => {
                      if (err) reject(err);
                      else resolve();
                    });
                  });
                  results[source] = true;
                } catch (error) {
                  results[source] = { error };
                  throw error; // 立即抛出错误以停止验证
                }
              })()
            );
          }
        }

        // 并行执行所有验证
        await Promise.all(validationPromises);
        
        // 所有验证通过
        next();
      } catch (error) {
        // 处理验证错误
        next(error);
      }
    };
  }

  /**
   * 懒加载验证
   * 只有当特定条件满足时才执行验证
   * @param {Function} condition - 返回布尔值的条件函数
   * @param {object|z.ZodSchema} schema - 验证模式
   * @param {Object} options - 配置选项
   * @returns {Function} 条件验证中间件
   */
  conditionalValidation(condition, schema, options = {}) {
    const validator = this.createValidator(schema, options);
    
    return (req, res, next) => {
      try {
        const shouldValidate = typeof condition === 'function' 
          ? condition(req, res)
          : !!condition;
        
        if (shouldValidate) {
          // 执行验证
          validator(req, res, next);
        } else {
          // 跳过验证
          logger.debug('条件验证跳过', { 
            path: req.path,
            method: req.method 
          });
          next();
        }
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 参数存在性验证中间件
   * 确保特定参数存在于请求中
   * @param {string[]} requiredParams - 必需的参数列表
   * @param {string} source - 验证源 ('body', 'query', 'params')
   * @returns {Function} 中间件函数
   */
  requireParams(requiredParams, source = 'body') {
    return (req, res, next) => {
      try {
        const data = req[source] || {};
        const missingParams = requiredParams.filter(param => !(param in data));
        
        if (missingParams.length > 0) {
          const error = new ValidationError(
            '缺少必需参数',
            { missingParams },
            missingParams.map(param => ({
              field: param,
              message: `参数 ${param} 是必需的`,
              code: 'MISSING_REQUIRED_PARAM'
            }))
          );
          return next(error);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 安全输入过滤中间件
   * 过滤可能的恶意输入
   * @param {string[]} fields - 需要过滤的字段列表
   * @param {string} source - 数据来源
   * @returns {Function} 中间件函数
   */
  sanitizeInput(fields = [], source = 'body') {
    return (req, res, next) => {
      try {
        const data = req[source] || {};
        
        // 过滤HTML标签等恶意内容
        for (const field of fields) {
          if (data[field] && typeof data[field] === 'string') {
            // 基本的HTML标签过滤
            data[field] = data[field]
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;');
          }
        }
        
        next();
      } catch (error) {
        logger.error('输入过滤失败', { error: error.message });
        next(error);
      }
    };
  }
}

// 创建验证器实例
const apiValidator = new ApiValidator();

// 导出常用验证规则
exports.idValidator = apiValidator.createValidator(zodSchemas.idParamSchema, { source: 'params' });
exports.paginationValidator = apiValidator.createValidator(zodSchemas.paginationSchema, { source: 'query' });
exports.emailValidator = apiValidator.createValidator(zodSchemas.emailSchema, { source: 'body' });
exports.passwordValidator = apiValidator.createValidator(zodSchemas.passwordSchema, { source: 'body' });

// 导出验证器类和实例
exports.ApiValidator = ApiValidator;
exports.apiValidator = apiValidator;
exports.createValidator = apiValidator.createValidator.bind(apiValidator);
exports.validateMultiple = apiValidator.validateMultiple.bind(apiValidator);
exports.conditionalValidation = apiValidator.conditionalValidation.bind(apiValidator);
exports.requireParams = apiValidator.requireParams.bind(apiValidator);
exports.sanitizeInput = apiValidator.sanitizeInput.bind(apiValidator);

// 导出原始验证功能
exports.validationMiddleware = validationMiddleware;
exports.createZodMiddleware = createZodMiddleware;
exports.schemas = schemas;
exports.zodSchemas = zodSchemas;

/**
 * @example
 * // 使用示例
 * const { createValidator, idValidator } = require('./middleware/validation');
 * const { z } = require('../../shared/validation');
 * 
 * // 创建自定义Zod模式
 * const userSchema = z.object({
 *   username: z.string().min(3).max(50),
 *   email: z.string().email()
 * });
 * 
 * // 应用验证中间件
 * app.post('/api/users', createValidator(userSchema), userController.create);
 * app.get('/api/users/:id', idValidator, userController.getById);
 */