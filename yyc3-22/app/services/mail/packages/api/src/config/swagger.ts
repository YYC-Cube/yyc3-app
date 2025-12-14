/**
 * @file Swagger配置
 * @description API文档生成配置
 * @module swagger
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '0379邮件平台 API 文档',
      description: '0379邮件平台的RESTful API文档，提供用户认证、邮件管理、AI分析等功能',
      version: '1.0.0',
      contact: {
        name: 'YYC',
        email: 'yanyu@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3100',
        description: '开发环境',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用Bearer Token进行认证，格式为: Bearer {token}',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功',
              example: false,
            },
            message: {
              type: 'string',
              description: '错误信息',
              example: '请求的资源不存在',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '详细错误列表',
              example: ['邮箱格式不正确', '密码长度不能少于8位'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '时间戳',
            },
            requestId: {
              type: 'string',
              description: '请求ID',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功',
              example: true,
            },
            data: {
              type: 'object',
              description: '响应数据',
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '操作成功',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '时间戳',
            },
            requestId: {
              type: 'string',
              description: '请求ID',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // 指定API路由文件路径，用于自动生成文档
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

// 生成Swagger文档
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// 配置Swagger UI
export const swaggerDocsSetup = (app: Express, port: number) => {
  // 配置Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    customSiteTitle: '0379邮件平台 API 文档',
    customfavIcon: 'https://img.icons8.com/color/48/000000/email.png',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-newspaper.css',
    ],
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
    },
  }));

  return {
    docs: swaggerDocs,
    swaggerUiOptions: {
      customSiteTitle: '0379邮件平台 API 文档',
    },
  };
};

// 导出Swagger文档
export { swaggerDocs };
export default swaggerDocsSetup;