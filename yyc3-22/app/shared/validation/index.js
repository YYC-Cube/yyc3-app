/**
 * @file 请求验证模块
 * @description 提供强大的API输入验证、数据清洗、参数校验等功能，集成Zod支持
 * @module validation
 * @author YYC
 * @version 2.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

const logger = require('../logger');
const { getContext } = require('../logger');
const { z } = require('zod');
const { formatZodError } = require('./zod-schemas');

/**
 * 验证错误类
 */
class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.timestamp = new Date();
    this.context = getContext() || {};
  }
}

/**
 * 验证器类
 */
class Validator {
  constructor() {
    this.validators = new Map();
    this.sanitizers = new Map();
    this.customValidators = new Map();
    
    // 注册内置验证器
    this._registerBuiltInValidators();
    
    // 注册内置清洗器
    this._registerBuiltInSanitizers();
  }

  /**
   * 注册内置验证器
   * @private
   */
  _registerBuiltInValidators() {
    // 必填验证器
    this.validators.set('required', (value, options) => {
      const allowEmptyString = options?.allowEmptyString || false;
      const allowZero = options?.allowZero !== false;
      
      if (value === undefined || value === null) {
        return { valid: false, message: options?.message || '此字段是必填的' };
      }
      
      if (typeof value === 'string' && !allowEmptyString && value.trim() === '') {
        return { valid: false, message: options?.message || '字符串不能为空' };
      }
      
      if (typeof value === 'number' && !allowZero && value === 0) {
        return { valid: false, message: options?.message || '值不能为零' };
      }
      
      return { valid: true };
    });

    // 类型验证器
    this.validators.set('type', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true }; // 由required验证器处理null值
      }
      
      const expectedType = options?.type;
      if (!expectedType) {
        return { valid: false, message: '必须指定期望的类型' };
      }
      
      let isValid = false;
      
      if (typeof expectedType === 'string') {
        // 基本类型验证
        isValid = typeof value === expectedType;
        
        // 特殊处理数组类型
        if (expectedType === 'array' && Array.isArray(value)) {
          isValid = true;
        }
        
        // 特殊处理日期类型
        if (expectedType === 'date' && (value instanceof Date || !isNaN(Date.parse(value)))) {
          isValid = true;
        }
      } else if (expectedType instanceof RegExp) {
        // 正则表达式验证
        isValid = expectedType.test(String(value));
      } else if (typeof expectedType === 'function') {
        // 构造函数验证
        isValid = value instanceof expectedType;
      }
      
      return {
        valid: isValid,
        message: options?.message || `类型不匹配，期望: ${typeof expectedType === 'string' ? expectedType : '特定类型'}`
      };
    });

    // 长度验证器
    this.validators.set('length', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      const { min, max, message } = options || {};
      const length = typeof value === 'string' || Array.isArray(value) ? value.length : undefined;
      
      if (length === undefined) {
        return { valid: false, message: '无法获取值的长度' };
      }
      
      if (min !== undefined && length < min) {
        return { valid: false, message: message || `长度必须至少为 ${min}` };
      }
      
      if (max !== undefined && length > max) {
        return { valid: false, message: message || `长度不能超过 ${max}` };
      }
      
      return { valid: true };
    });

    // 范围验证器
    this.validators.set('range', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { valid: false, message: '值必须是数字' };
      }
      
      const { min, max, message } = options || {};
      
      if (min !== undefined && numValue < min) {
        return { valid: false, message: message || `值必须大于等于 ${min}` };
      }
      
      if (max !== undefined && numValue > max) {
        return { valid: false, message: message || `值必须小于等于 ${max}` };
      }
      
      return { valid: true };
    });

    // 枚举验证器
    this.validators.set('enum', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      const { values, message } = options || {};
      
      if (!Array.isArray(values)) {
        return { valid: false, message: '枚举值必须是数组' };
      }
      
      const isValid = values.includes(value);
      
      return {
        valid: isValid,
        message: message || `值必须是以下之一: ${values.join(', ')}`
      };
    });

    // 正则表达式验证器
    this.validators.set('pattern', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      const { pattern, message } = options || {};
      
      if (!(pattern instanceof RegExp)) {
        return { valid: false, message: 'pattern必须是正则表达式' };
      }
      
      const isValid = pattern.test(String(value));
      
      return {
        valid: isValid,
        message: message || '格式不正确'
      };
    });

    // 邮箱验证器
    this.validators.set('email', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailPattern.test(String(value));
      
      return {
        valid: isValid,
        message: options?.message || '请输入有效的邮箱地址'
      };
    });

    // 手机号码验证器
    this.validators.set('phone', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      // 简单的中国手机号验证
      const phonePattern = /^1[3-9]\d{9}$/;
      const isValid = phonePattern.test(String(value));
      
      return {
        valid: isValid,
        message: options?.message || '请输入有效的手机号码'
      };
    });

    // URL验证器
    this.validators.set('url', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      try {
        new URL(String(value));
        return { valid: true };
      } catch (error) {
        return {
          valid: false,
          message: options?.message || '请输入有效的URL'
        };
      }
    });

    // 唯一性验证器（需要异步实现）
    this.validators.set('unique', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      // 这是一个占位符，实际使用时需要传入一个检查唯一性的函数
      const { checkFn, message } = options || {};
      
      if (typeof checkFn !== 'function') {
        return { valid: false, message: '必须提供唯一性检查函数' };
      }
      
      // 这里返回一个需要异步处理的标志
      return { 
        valid: 'async', 
        checkFn,
        message: message || '值必须是唯一的'
      };
    });

    // 对象结构验证器
    this.validators.set('object', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { valid: false, message: options?.message || '值必须是对象' };
      }
      
      const { schema, message } = options || {};
      
      if (schema) {
        // 如果提供了模式，执行深度验证
        // 注意：这里只是标记需要递归验证，实际验证在主函数中处理
        return { 
          valid: 'recursive',
          schema,
          message: message || '对象结构验证失败'
        };
      }
      
      return { valid: true };
    });

    // 数组验证器
    this.validators.set('array', (value, options) => {
      if (value === undefined || value === null) {
        return { valid: true };
      }
      
      if (!Array.isArray(value)) {
        return { valid: false, message: options?.message || '值必须是数组' };
      }
      
      const { items, minItems, maxItems, message } = options || {};
      
      // 检查数组长度
      if (minItems !== undefined && value.length < minItems) {
        return { valid: false, message: message || `数组长度必须至少为 ${minItems}` };
      }
      
      if (maxItems !== undefined && value.length > maxItems) {
        return { valid: false, message: message || `数组长度不能超过 ${maxItems}` };
      }
      
      // 如果提供了项目模式，标记需要递归验证数组项
      if (items) {
        return { 
          valid: 'arrayItems',
          itemsSchema: items,
          message: message || '数组项验证失败'
        };
      }
      
      return { valid: true };
    });
  }

  /**
   * 注册内置清洗器
   * @private
   */
  _registerBuiltInSanitizers() {
    // 字符串修剪
    this.sanitizers.set('trim', (value) => {
      return typeof value === 'string' ? value.trim() : value;
    });

    // 转小写
    this.sanitizers.set('toLowerCase', (value) => {
      return typeof value === 'string' ? value.toLowerCase() : value;
    });

    // 转大写
    this.sanitizers.set('toUpperCase', (value) => {
      return typeof value === 'string' ? value.toUpperCase() : value;
    });

    // 转数字
    this.sanitizers.set('toNumber', (value) => {
      const num = Number(value);
      return isNaN(num) ? value : num;
    });

    // 转整数
    this.sanitizers.set('toInteger', (value) => {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    });

    // 转布尔值
    this.sanitizers.set('toBoolean', (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
      }
      if (typeof value === 'number') return value !== 0;
      return true;
    });

    // 转日期
    this.sanitizers.set('toDate', (value) => {
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    });

    // HTML转义
    this.sanitizers.set('escapeHtml', (value) => {
      if (typeof value !== 'string') return value;
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return value.replace(/[&<>"']/g, m => map[m]);
    });

    // 移除HTML标签
    this.sanitizers.set('stripHtml', (value) => {
      return typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value;
    });

    // 移除空格
    this.sanitizers.set('removeSpaces', (value) => {
      return typeof value === 'string' ? value.replace(/\s+/g, '') : value;
    });

    // 截断字符串
    this.sanitizers.set('truncate', (value, options) => {
      const { maxLength = 100, suffix = '...' } = options || {};
      if (typeof value === 'string' && value.length > maxLength) {
        return value.substring(0, maxLength - suffix.length) + suffix;
      }
      return value;
    });
  }

  /**
   * 注册自定义验证器
   * @param {string} name - 验证器名称
   * @param {Function} validatorFn - 验证函数
   * @returns {Validator} 实例本身（支持链式调用）
   */
  registerValidator(name, validatorFn) {
    if (typeof validatorFn !== 'function') {
      throw new Error('验证器必须是一个函数');
    }
    this.validators.set(name, validatorFn);
    return this;
  }

  /**
   * 注册自定义清洗器
   * @param {string} name - 清洗器名称
   * @param {Function} sanitizerFn - 清洗函数
   * @returns {Validator} 实例本身（支持链式调用）
   */
  registerSanitizer(name, sanitizerFn) {
    if (typeof sanitizerFn !== 'function') {
      throw new Error('清洗器必须是一个函数');
    }
    this.sanitizers.set(name, sanitizerFn);
    return this;
  }

  /**
   * 清洗数据
   * @param {any} value - 要清洗的值
   * @param {array|object|Function} sanitizers - 清洗器配置
   * @returns {any} 清洗后的值
   */
  sanitize(value, sanitizers) {
    if (!sanitizers || value === undefined || value === null) {
      return value;
    }

    let sanitizedValue = value;

    // 处理函数清洗器
    if (typeof sanitizers === 'function') {
      return sanitizers(sanitizedValue);
    }

    // 处理数组或对象形式的清洗器
    const sanitizerList = Array.isArray(sanitizers) ? sanitizers : [sanitizers];

    for (const sanitizer of sanitizerList) {
      if (typeof sanitizer === 'string') {
        // 使用预定义清洗器
        const sanitizerFn = this.sanitizers.get(sanitizer);
        if (sanitizerFn) {
          sanitizedValue = sanitizerFn(sanitizedValue);
        }
      } else if (typeof sanitizer === 'function') {
        // 使用自定义清洗器函数
        sanitizedValue = sanitizer(sanitizedValue);
      } else if (typeof sanitizer === 'object') {
        // 使用带选项的清洗器
        for (const [name, options] of Object.entries(sanitizer)) {
          const sanitizerFn = this.sanitizers.get(name);
          if (sanitizerFn) {
            sanitizedValue = sanitizerFn(sanitizedValue, options);
          }
        }
      }
    }

    return sanitizedValue;
  }

  /**
   * 验证单个值
   * @param {any} value - 要验证的值
   * @param {object} rules - 验证规则
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {object} 验证结果 { valid: boolean, errors: array }
   */
  validateValue(value, rules, fieldName = 'value') {
    const errors = [];

    // 执行清洗
    if (rules.sanitize) {
      value = this.sanitize(value, rules.sanitize);
    }

    // 遍历所有规则
    for (const [ruleName, options] of Object.entries(rules)) {
      if (ruleName === 'sanitize') continue; // 已经处理过清洗

      const validator = this.validators.get(ruleName) || this.customValidators.get(ruleName);
      
      if (validator) {
        const result = validator(value, options);
        
        if (result.valid === false) {
          errors.push({
            field: fieldName,
            rule: ruleName,
            message: result.message || `验证失败: ${ruleName}`
          });
        }
        // 对于特殊验证（异步/递归），这里不做处理，由上层验证函数处理
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue: value
    };
  }

  /**
   * 异步验证单个值（处理异步验证规则）
   * @param {any} value - 要验证的值
   * @param {object} rules - 验证规则
   * @param {string} fieldName - 字段名称
   * @returns {Promise<object>} 验证结果
   */
  async validateValueAsync(value, rules, fieldName = 'value') {
    // 先执行同步验证
    const syncResult = this.validateValue(value, rules, fieldName);
    
    if (!syncResult.valid) {
      return syncResult;
    }

    // 检查是否有异步验证规则
    const asyncValidations = [];
    
    for (const [ruleName, options] of Object.entries(rules)) {
      if (ruleName === 'sanitize') continue;

      const validator = this.validators.get(ruleName) || this.customValidators.get(ruleName);
      
      if (validator) {
        const result = validator(syncResult.sanitizedValue, options);
        
        if (result.valid === 'async' && result.checkFn) {
          asyncValidations.push({
            rule: ruleName,
            checkFn: result.checkFn,
            message: result.message,
            fieldName
          });
        }
      }
    }

    // 执行所有异步验证
    const errors = [];
    
    for (const validation of asyncValidations) {
      try {
        const isValid = await validation.checkFn(syncResult.sanitizedValue);
        
        if (!isValid) {
          errors.push({
            field: validation.fieldName,
            rule: validation.rule,
            message: validation.message
          });
        }
      } catch (error) {
        logger.error(`异步验证失败: ${validation.fieldName}`, { error: error.message });
        errors.push({
          field: validation.fieldName,
          rule: validation.rule,
          message: '验证过程中发生错误'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue: syncResult.sanitizedValue
    };
  }

  /**
   * 递归验证对象
   * @param {object} data - 要验证的数据对象
   * @param {object} schema - 验证模式
   * @param {string} prefix - 字段路径前缀
   * @returns {Promise<object>} 验证结果
   */
  async validateObject(data, schema, prefix = '') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      data = {};
    }

    const errors = [];
    const sanitizedData = {};
    const asyncValidations = [];

    // 遍历模式中的所有字段
    for (const [field, rules] of Object.entries(schema)) {
      const fieldPath = prefix ? `${prefix}.${field}` : field;
      const fieldValue = data[field];

      // 处理特殊规则：object和array的递归验证
      if (rules.object?.schema) {
        // 对象递归验证
        if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
          const nestedResult = await this.validateObject(fieldValue, rules.object.schema, fieldPath);
          
          if (!nestedResult.valid) {
            errors.push(...nestedResult.errors);
          } else {
            sanitizedData[field] = nestedResult.sanitizedData;
          }
        } else if (rules.required?.value !== false) {
          // 如果是必需字段但值不存在或类型错误
          errors.push({
            field: fieldPath,
            rule: 'object',
            message: '必须是一个有效的对象'
          });
        }
      } else if (rules.array?.itemsSchema) {
        // 数组递归验证
        if (Array.isArray(fieldValue)) {
          const arrayErrors = [];
          const sanitizedArray = [];
          
          for (let i = 0; i < fieldValue.length; i++) {
            const itemPath = `${fieldPath}[${i}]`;
            const itemResult = await this.validateObject(fieldValue[i], rules.array.itemsSchema, itemPath);
            
            if (!itemResult.valid) {
              arrayErrors.push(...itemResult.errors);
            } else {
              sanitizedArray.push(itemResult.sanitizedData);
            }
          }
          
          if (arrayErrors.length > 0) {
            errors.push(...arrayErrors);
          } else {
            sanitizedData[field] = sanitizedArray;
          }
        } else if (rules.required?.value !== false) {
          // 如果是必需字段但值不是数组
          errors.push({
            field: fieldPath,
            rule: 'array',
            message: '必须是一个有效的数组'
          });
        }
      } else {
        // 常规字段验证
        // 检查是否有异步验证器
        const hasAsyncValidator = Object.keys(rules).some(key => {
          const validator = this.validators.get(key) || this.customValidators.get(key);
          return validator && validator(fieldValue, rules[key]).valid === 'async';
        });

        if (hasAsyncValidator) {
          // 需要异步验证
          asyncValidations.push({
            field,
            fieldPath,
            value: fieldValue,
            rules
          });
        } else {
          // 同步验证
          const result = this.validateValue(fieldValue, rules, fieldPath);
          
          if (!result.valid) {
            errors.push(...result.errors);
          } else {
            // 只在验证通过时设置清洗后的值
            if (result.sanitizedValue !== undefined) {
              sanitizedData[field] = result.sanitizedValue;
            }
          }
        }
      }
    }

    // 执行所有异步字段验证
    for (const validation of asyncValidations) {
      const result = await this.validateValueAsync(validation.value, validation.rules, validation.fieldPath);
      
      if (!result.valid) {
        errors.push(...result.errors);
      } else {
        if (result.sanitizedValue !== undefined) {
          sanitizedData[validation.field] = result.sanitizedValue;
        }
      }
    }

    // 检查是否有未知字段（仅在启用严格模式时）
    if (schema._strict === true) {
      for (const field of Object.keys(data)) {
        if (!(field in schema)) {
          errors.push({
            field: prefix ? `${prefix}.${field}` : field,
            rule: '_strict',
            message: '未知字段'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
}

// 创建验证器实例
const validator = new Validator();

/**
   * 验证请求数据
   * @param {Request} req - Express请求对象
   * @param {object|z.ZodSchema} schema - 验证模式（支持自定义验证模式或Zod模式）
   * @returns {object} 验证结果 { isValid: boolean, errors: array, sanitizedData: object }
   */
  async function validate(req, schema) {
  try {
    // 收集所有请求数据
    const requestData = {
      ...req.body,
      ...req.query,
      ...req.params
    };

    // 判断是否为Zod模式
    if (schema instanceof z.ZodSchema || (schema.parse && typeof schema.parse === 'function')) {
      try {
        // 使用Zod进行验证
        const validatedData = schema.parse(requestData);
        return {
          isValid: true,
          errors: [],
          sanitizedData: validatedData
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatZodError(error);
          return {
            isValid: false,
            errors: formatted.error.details,
            sanitizedData: {}
          };
        }
        throw error;
      }
    }

    // 执行自定义验证器验证
    const result = await validator.validateObject(requestData, schema);

    // 将清洗后的数据应用回请求对象
    if (result.valid) {
      // 分别更新body、query和params
      Object.keys(req.body).forEach(key => {
        if (key in result.sanitizedData) {
          req.body[key] = result.sanitizedData[key];
        }
      });
      
      Object.keys(req.query).forEach(key => {
        if (key in result.sanitizedData) {
          req.query[key] = result.sanitizedData[key];
        }
      });
      
      Object.keys(req.params).forEach(key => {
        if (key in result.sanitizedData) {
          req.params[key] = result.sanitizedData[key];
        }
      });
    }

    return {
      isValid: result.valid,
      errors: result.errors,
      sanitizedData: result.sanitizedData
    };
  } catch (error) {
    logger.error('请求验证错误', { error: error.message });
    return {
      isValid: false,
      errors: [{ field: 'general', message: '验证过程中发生错误' }],
      sanitizedData: {}
    };
  }
}

/**
 * 创建验证中间件
 * @param {object} schema - 验证模式
 * @returns {Function} 中间件函数
 */
/**
   * 创建验证中间件
   * @param {object|z.ZodSchema} schema - 验证模式（支持自定义验证模式或Zod模式）
   * @param {Object} options - 中间件选项
   * @returns {Function} 中间件函数
   */
  function validationMiddleware(schema, options = {}) {
    return async (req, res, next) => {
      try {
        // 增强的日志记录
        logger.debug('开始验证请求', {
          path: req.path,
          method: req.method,
          schemaType: schema instanceof z.ZodSchema ? 'zod' : 'custom'
        });

        const result = await validate(req, schema);
        
        if (!result.isValid) {
          // 构造错误响应
          const errorResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '请求参数验证失败',
              details: result.errors
            },
            meta: {
              timestamp: new Date().toISOString(),
              traceId: getContext()?.traceId,
              requestId: req.id || getContext()?.requestId
            }
          };

          // 记录验证错误
          logger.warn('请求验证失败', {
            path: req.path,
            method: req.method,
            errors: result.errors,
            traceId: getContext()?.traceId,
            clientIp: req.ip || req.socket?.remoteAddress
          });

          // 返回400错误
          return res.status(400).json(errorResponse);
        }

        // 验证通过，记录成功日志
        logger.debug('请求验证成功', {
          path: req.path,
          method: req.method
        });

        // 验证通过，继续处理
        next();
      } catch (error) {
        logger.error('验证中间件错误', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method
        });
        next(error);
      }
    };
}

// 常用验证模式工厂函数
const schemas = {
  // 分页查询模式
  pagination: {
    page: {
      type: { type: 'number' },
      range: { min: 1 },
      sanitize: 'toInteger',
      default: 1
    },
    limit: {
      type: { type: 'number' },
      range: { min: 1, max: 100 },
      sanitize: 'toInteger',
      default: 20
    }
  },
  
  // ID参数模式
  idParam: {
    id: {
      required: true,
      pattern: /^[a-zA-Z0-9_-]{1,64}$/
    }
  },
  
  // 邮箱模式
  email: {
    email: {
      required: true,
      email: true,
      sanitize: ['trim', 'toLowerCase']
    }
  },
  
  // 密码模式
  password: {
    password: {
      required: true,
      length: { min: 8, max: 64 },
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/,
      message: '密码必须包含大小写字母、数字和特殊字符，长度8-64位'
    }
  }
};

// 导出核心功能
exports.validator = validator;
exports.validate = validate;
exports.validationMiddleware = validationMiddleware;
exports.ValidationError = ValidationError;
exports.schemas = schemas;
exports.registerValidator = validator.registerValidator.bind(validator);
exports.registerSanitizer = validator.registerSanitizer.bind(validator);

// 导出Zod相关功能
exports.z = z;
exports.zodSchemas = require('./zod-schemas');

// 导出便捷方法
exports.createValidationMiddleware = validationMiddleware;
exports.createZodMiddleware = require('./zod-schemas').createZodMiddleware;

/**
 * 安全验证工具函数
 * 用于敏感操作的额外验证
 */
exports.securityValidation = {
  /**
   * 验证操作是否为特权操作
   * @param {string} operation - 操作名称
   * @param {Array<string>} allowedRoles - 允许的角色列表
   * @returns {Function} 验证中间件
   */
  validatePrivilegedOperation: (operation, allowedRoles) => {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
          logger.warn('权限验证失败', {
            operation,
            userRole,
            requiredRoles: allowedRoles,
            userId: req.user?.id,
            path: req.path
          });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: '没有执行此操作的权限'
            }
          });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * 验证敏感数据访问
   * @param {Array<string>} allowedFields - 允许访问的字段列表
   * @returns {Function} 验证中间件
   */
  validateSensitiveDataAccess: (allowedFields = []) => {
    return (req, res, next) => {
      try {
        // 检查请求参数中是否包含敏感字段
        const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
        const requestedFields = [...Object.keys(req.query), ...Object.keys(req.body)];
        
        const invalidFields = requestedFields.filter(field => 
          sensitiveFields.includes(field) && !allowedFields.includes(field)
        );
        
        if (invalidFields.length > 0) {
          logger.warn('敏感字段访问尝试', {
            invalidFields,
            userId: req.user?.id,
            path: req.path
          });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'SENSITIVE_DATA_ACCESS',
              message: '访问敏感数据被拒绝'
            }
          });
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
};
