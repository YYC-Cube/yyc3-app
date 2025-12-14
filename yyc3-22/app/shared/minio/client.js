/**
 * @file MinIO客户端模块
 * @description 实现MinIO的文件上传、下载、删除等功能
 * @module shared/minio/client
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const Minio = require('minio');
const minioConfig = require('../../../config/minio');
const logger = require('../logger');

class MinIOClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * 初始化MinIO客户端
   */
  async initialize() {
    try {
      logger.info('正在初始化MinIO客户端...', {
        endpoint: minioConfig.connection.endPoint,
        port: minioConfig.connection.port,
        useSSL: minioConfig.connection.useSSL,
      });

      // 创建MinIO客户端实例
      this.client = new Minio.Client({
        endPoint: minioConfig.connection.endPoint,
        port: minioConfig.connection.port,
        useSSL: minioConfig.connection.useSSL,
        accessKey: minioConfig.connection.accessKey,
        secretKey: minioConfig.connection.secretKey,
        region: minioConfig.connection.region,
      });

      // 检查连接
      await this.checkConnection();

      // 初始化存储桶
      await this.initBuckets();

      this.isConnected = true;
      logger.info('MinIO客户端初始化成功');

      return this;
    } catch (err) {
      logger.error('MinIO客户端初始化失败', { error: err.message });
      throw err;
    }
  }

  /**
   * 检查MinIO连接
   */
  async checkConnection() {
    try {
      // 检查MinIO服务器状态
      await this.client.bucketExists('test-bucket-do-not-delete');
      logger.info('MinIO服务器连接正常');
    } catch (err) {
      // 忽略特定错误，因为测试桶可能不存在
      if (err.code !== 'NoSuchBucket') {
        logger.error('MinIO服务器连接失败', { error: err.message });
        throw err;
      }
      logger.info('MinIO服务器连接正常（测试桶不存在）');
    }
  }

  /**
   * 初始化存储桶
   */
  async initBuckets() {
    try {
      for (const bucketKey in minioConfig.buckets) {
        const bucket = minioConfig.buckets[bucketKey];

        // 检查存储桶是否存在
        const exists = await this.client.bucketExists(bucket.name);

        if (!exists) {
          // 创建存储桶
          await this.client.makeBucket(bucket.name, minioConfig.connection.region);
          logger.info(`创建存储桶成功: ${bucket.name}`);

          // 设置存储桶ACL
          await this.client.setBucketPolicy(bucket.name, this.getBucketPolicy(bucket.name, bucket.acl));
          logger.info(`设置存储桶ACL成功: ${bucket.name} (${bucket.acl})`);

          // 启用版本控制
          if (bucket.options.versioning) {
            await this.client.enableVersioning(bucket.name);
            logger.info(`启用版本控制成功: ${bucket.name}`);
          }

          // 启用对象锁定
          if (bucket.options.objectLocking) {
            await this.client.enableObjectLocking(bucket.name);
            logger.info(`启用对象锁定成功: ${bucket.name}`);
          }
        } else {
          logger.info(`存储桶已存在: ${bucket.name}`);
        }
      }
    } catch (err) {
      logger.error('初始化存储桶失败', { error: err.message });
      throw err;
    }
  }

  /**
   * 获取存储桶策略
   * @param {string} bucketName - 存储桶名称
   * @param {string} acl - 访问控制列表
   */
  getBucketPolicy(bucketName, acl) {
    if (acl === 'public-read') {
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      });
    }

    // 默认私有策略
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [],
    });
  }

  /**
   * 上传文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} objectName - 对象名称
   * @param {string|Buffer} file - 文件路径或Buffer
   * @param {object} options - 上传选项
   */
  async uploadFile(bucketName, objectName, file, options = {}) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      logger.info('上传文件', { bucketName, objectName });

      // 检查文件大小
      if (options.size && options.size > minioConfig.upload.maxSize) {
        throw new Error(`文件大小超过限制: ${options.size} > ${minioConfig.upload.maxSize}`);
      }

      // 检查文件类型
      if (options.contentType && !minioConfig.upload.allowedTypes.includes(options.contentType)) {
        throw new Error(`不支持的文件类型: ${options.contentType}`);
      }

      // 上传文件
      await this.client.putObject(bucketName, objectName, file, options);

      logger.info('文件上传成功', { bucketName, objectName });

      // 获取文件URL
      const url = await this.getFileUrl(bucketName, objectName);

      return { url, bucketName, objectName };
    } catch (err) {
      logger.error('文件上传失败', { bucketName, objectName, error: err.message });
      throw err;
    }
  }

  /**
   * 下载文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} objectName - 对象名称
   * @param {string} filePath - 文件路径
   */
  async downloadFile(bucketName, objectName, filePath) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      logger.info('下载文件', { bucketName, objectName, filePath });

      // 下载文件
      await this.client.fGetObject(bucketName, objectName, filePath);

      logger.info('文件下载成功', { bucketName, objectName, filePath });

      return { filePath, bucketName, objectName };
    } catch (err) {
      logger.error('文件下载失败', { bucketName, objectName, filePath, error: err.message });
      throw err;
    }
  }

  /**
   * 删除文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} objectName - 对象名称
   */
  async deleteFile(bucketName, objectName) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      logger.info('删除文件', { bucketName, objectName });

      // 删除文件
      await this.client.removeObject(bucketName, objectName);

      logger.info('文件删除成功', { bucketName, objectName });

      return { bucketName, objectName };
    } catch (err) {
      logger.error('文件删除失败', { bucketName, objectName, error: err.message });
      throw err;
    }
  }

  /**
   * 获取文件URL
   * @param {string} bucketName - 存储桶名称
   * @param {string} objectName - 对象名称
   * @param {number} expiry - 过期时间（秒）
   */
  async getFileUrl(bucketName, objectName, expiry = 3600) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // 获取文件URL
      const url = await this.client.presignedGetObject(bucketName, objectName, expiry);

      logger.info('获取文件URL成功', { bucketName, objectName, url });

      return url;
    } catch (err) {
      logger.error('获取文件URL失败', { bucketName, objectName, error: err.message });
      throw err;
    }
  }

  /**
   * 获取文件元数据
   * @param {string} bucketName - 存储桶名称
   * @param {string} objectName - 对象名称
   */
  async getFileMetadata(bucketName, objectName) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // 获取文件元数据
      const metadata = await this.client.statObject(bucketName, objectName);

      logger.info('获取文件元数据成功', { bucketName, objectName });

      return metadata;
    } catch (err) {
      logger.error('获取文件元数据失败', { bucketName, objectName, error: err.message });
      throw err;
    }
  }

  /**
   * 列出存储桶中的文件
   * @param {string} bucketName - 存储桶名称
   * @param {string} prefix - 前缀
   * @param {string} delimiter - 分隔符
   */
  async listFiles(bucketName, prefix = '', delimiter = '/') {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      logger.info('列出存储桶中的文件', { bucketName, prefix, delimiter });

      // 列出文件
      const objects = [];
      const stream = this.client.listObjectsV2(bucketName, prefix, true, delimiter);

      for await (const obj of stream) {
        objects.push(obj);
      }

      logger.info('列出文件成功', { bucketName, count: objects.length });

      return objects;
    } catch (err) {
      logger.error('列出文件失败', { bucketName, prefix, delimiter, error: err.message });
      throw err;
    }
  }

  /**
   * 复制文件
   * @param {string} srcBucket - 源存储桶
   * @param {string} srcObject - 源对象
   * @param {string} destBucket - 目标存储桶
   * @param {string} destObject - 目标对象
   */
  async copyFile(srcBucket, srcObject, destBucket, destObject) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      logger.info('复制文件', { srcBucket, srcObject, destBucket, destObject });

      // 复制文件
      await this.client.copyObject(destBucket, destObject, `/${srcBucket}/${srcObject}`);

      logger.info('文件复制成功', { srcBucket, srcObject, destBucket, destObject });

      return { srcBucket, srcObject, destBucket, destObject };
    } catch (err) {
      logger.error('文件复制失败', { srcBucket, srcObject, destBucket, destObject, error: err.message });
      throw err;
    }
  }

  /**
   * 获取客户端状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      endpoint: minioConfig.connection.endPoint,
      port: minioConfig.connection.port,
      useSSL: minioConfig.connection.useSSL,
      region: minioConfig.connection.region,
    };
  }
}

// 导出单例实例
const minioClient = new MinIOClient();

module.exports = minioClient;
