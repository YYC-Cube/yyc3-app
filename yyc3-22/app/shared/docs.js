/**
 * @file 共享文档接口模块
 * @description 提供统一的 Swagger 文档支持
 * @module shared/docs
 * @author YYC
 * @version 1.0.0
 * @created 2025-11-02
 */

module.exports = {
  "swagger": "2.0",
  "info": {
    "title": "0379.email API",
    "version": "1.0.0",
    "description": "0379.email 多服务平台 API 文档"
  },
  "basePath": "/api",
  "paths": {
    "/hello": {
      "get": {
        "description": "返回服务欢迎信息",
        "responses": {
          "200": {
            "description": "Success",
            "examples": {
              "application/json": { "message": "Hello from service.0379.email!" }
            }
          }
        }
      }
    },
    "/status": {
      "get": {
        "description": "返回服务状态信息",
        "responses": {
          "200": {
            "description": "Success",
            "examples": {
              "application/json": { "status": "ok", "timestamp": 1630000000000, "uptime": 123.45 }
            }
          }
        }
      }
    },
    "/version": {
      "get": {
        "description": "返回服务版本信息",
        "responses": {
          "200": {
            "description": "Success",
            "examples": {
              "application/json": { "version": "1.0.0", "name": "service.0379.email" }
            }
          }
        }
      }
    },
    "/metrics": {
      "get": {
        "description": "返回服务性能指标",
        "responses": {
          "200": {
            "description": "Success",
            "examples": {
              "application/json": {
                "uptime": 1234,
                "memory": 45.67,
                "cpuUsage": { "user": 12345, "system": 6789 }
              }
            }
          }
        }
      }
    },
    "/healthcheck": {
      "get": {
        "description": "返回服务健康状态，用于 Nginx/监控系统",
        "responses": {
          "200": {
            "description": "Success",
            "examples": {
              "application/json": {
                "healthy": true,
                "service": "api",
                "timestamp": 1630000000000,
                "hostname": "server-hostname"
              }
            }
          }
        }
      }
    },
    "/docs": {
      "get": {
        "description": "返回 Swagger 文档 JSON",
        "responses": {
          "200": {
            "description": "Success",
            "schema": {
              "type": "object"
            }
          }
        }
      }
    }
  }
};