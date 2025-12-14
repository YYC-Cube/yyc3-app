/**
 * @file MinIO配置文件
 * @description 配置MinIO的连接参数和存储桶设置
 * @module config/minio
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

module.exports = {
  // MinIO连接配置
  connection: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'password',
    region: process.env.MINIO_REGION || 'us-east-1',
  },

  // 存储桶配置
  buckets: {
    // 公共存储桶
    public: {
      name: process.env.MINIO_PUBLIC_BUCKET || 'public',
      options: {
        objectLocking: false,
        versioning: false,
      },
      acl: 'public-read',
    },

    // 私有存储桶
    private: {
      name: process.env.MINIO_PRIVATE_BUCKET || 'private',
      options: {
        objectLocking: false,
        versioning: true,
      },
      acl: 'private',
    },

    // 临时存储桶
    temp: {
      name: process.env.MINIO_TEMP_BUCKET || 'temp',
      options: {
        objectLocking: false,
        versioning: false,
      },
      acl: 'private',
    },

    // 归档存储桶
    archive: {
      name: process.env.MINIO_ARCHIVE_BUCKET || 'archive',
      options: {
        objectLocking: true,
        versioning: true,
      },
      acl: 'private',
    },
  },

  // 文件上传配置
  upload: {
    // 最大文件大小 (bytes)
    maxSize: parseInt(process.env.MINIO_MAX_SIZE || '104857600'), // 100MB
    
    // 允许的文件类型
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/gzip',
      'text/plain',
      'text/csv',
    ],
    
    // 分块上传配置
    multipart: {
      chunkSize: parseInt(process.env.MINIO_CHUNK_SIZE || '5242880'), // 5MB
      maxParts: parseInt(process.env.MINIO_MAX_PARTS || '10000'),
      uploadTimeout: parseInt(process.env.MINIO_UPLOAD_TIMEOUT || '3600000'), // 1 hour
    },
  },

  // 缓存配置
  cache: {
    enabled: process.env.MINIO_CACHE_ENABLED === 'true',
    expiry: parseInt(process.env.MINIO_CACHE_EXPIRY || '3600'), // 1 hour
  },

  // 生命周期配置
  lifecycle: {
    enabled: process.env.MINIO_LIFECYCLE_ENABLED === 'true',
    rules: {
      // 临时文件自动删除
      temp: {
        enabled: true,
        prefix: '',
        daysToExpire: 7,
      },
      // 归档文件自动转换存储类别
      archive: {
        enabled: true,
        prefix: '',
        daysToArchive: 30,
      },
    },
  },

  // 加密配置
  encryption: {
    enabled: process.env.MINIO_ENCRYPTION_ENABLED === 'true',
    type: process.env.MINIO_ENCRYPTION_TYPE || 'server-side',
  },
};
