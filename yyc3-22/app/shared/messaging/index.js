/**
 * @file 消息队列服务模块
 * @description 提供基于RabbitMQ的消息队列功能，支持发布/订阅模式、RPC调用和事件总线
 * @module messaging
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const { logger, getContext } = require('../logger');

/**
 * 消息队列服务类
 * 提供可靠的服务间通信机制
 */
class MessagingService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.rpcCallbacks = new Map();
    this.config = {
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchangeName: process.env.EXCHANGE_NAME || 'service.exchange',
      exchangeType: process.env.EXCHANGE_TYPE || 'topic',
      reconnectAttempts: process.env.RECONNECT_ATTEMPTS ? parseInt(process.env.RECONNECT_ATTEMPTS) : 5,
      reconnectDelay: process.env.RECONNECT_DELAY ? parseInt(process.env.RECONNECT_DELAY) : 5000,
      defaultTimeout: process.env.RPC_TIMEOUT ? parseInt(process.env.RPC_TIMEOUT) : 10000,
      prefetchCount: process.env.PREFETCH_COUNT ? parseInt(process.env.PREFETCH_COUNT) : 10
    };
    this.isInitialized = false;
    this.attempts = 0;
    this.reconnectTimeout = null;
    this.subscriptions = new Map();
    this.rpcQueueName = null;
  }

  /**
   * 初始化消息队列服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    try {
      if (this.isInitialized && this.connection) {
        return true;
      }

      logger.info('正在连接到RabbitMQ...', { url: this._maskUrl(this.config.url) });
      
      // 建立连接
      this.connection = await amqp.connect(this.config.url, {
        clientProperties: {
          applicationName: process.env.SERVICE_NAME || 'microservice',
          version: process.env.APP_VERSION || '1.0.0'
        },
        heartbeat: 60
      });
      
      // 创建通道
      this.channel = await this.connection.createChannel();
      
      // 设置预取数量，防止消费者过载
      await this.channel.prefetch(this.config.prefetchCount);
      
      // 声明交换机
      await this.channel.assertExchange(
        this.config.exchangeName, 
        this.config.exchangeType, 
        { durable: true }
      );
      
      // 创建RPC回复队列（临时队列）
      const replyQueue = await this.channel.assertQueue('', {
        exclusive: true,
        autoDelete: true
      });
      this.rpcQueueName = replyQueue.queue;
      
      // 监听RPC回复
      await this._setupRpcReplyListener();
      
      // 设置连接事件监听
      this._setupConnectionListeners();
      
      this.isInitialized = true;
      this.attempts = 0;
      
      logger.info('RabbitMQ连接成功建立', {
        exchangeName: this.config.exchangeName,
        rpcQueueName: this.rpcQueueName
      });
      
      // 恢复之前的订阅
      this._restoreSubscriptions();
      
      return true;
    } catch (error) {
      logger.error('初始化RabbitMQ连接失败:', error, {
        attempt: this.attempts + 1,
        maxAttempts: this.config.reconnectAttempts
      });
      
      // 尝试重新连接
      this._scheduleReconnect();
      return false;
    }
  }

  /**
   * 发布消息到交换机
   * @param {string} routingKey - 路由键
   * @param {object} message - 消息内容
   * @param {object} options - 发布选项
   * @returns {Promise<boolean>} 发布是否成功
   */
  async publish(routingKey, message, options = {}) {
    if (!this.isInitialized || !this.channel) {
      logger.warn('消息队列未初始化，无法发布消息', { routingKey });
      return false;
    }

    try {
      // 获取当前上下文信息
      const context = getContext();
      
      // 序列化消息并添加元数据
      const messageContent = {
        data: message,
        metadata: {
          timestamp: new Date().toISOString(),
          service: process.env.SERVICE_NAME || 'unknown',
          traceId: context?.traceId || uuidv4(),
          messageId: uuidv4()
        }
      };

      // 发布消息选项
      const publishOptions = {
        persistent: true,  // 持久化消息，防止服务器崩溃丢失
        timestamp: Date.now(),
        contentType: 'application/json',
        ...options
      };

      // 发布消息
      const result = this.channel.publish(
        this.config.exchangeName, 
        routingKey, 
        Buffer.from(JSON.stringify(messageContent)), 
        publishOptions
      );

      logger.info('消息发布成功', {
        routingKey,
        messageId: messageContent.metadata.messageId,
        traceId: messageContent.metadata.traceId,
        result
      });

      return result;
    } catch (error) {
      logger.error('发布消息失败:', error, { routingKey });
      return false;
    }
  }

  /**
   * 发送RPC请求
   * @param {string} routingKey - 路由键
   * @param {object} message - 请求消息
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<object>} 响应结果
   */
  async rpcCall(routingKey, message, timeout = this.config.defaultTimeout) {
    if (!this.isInitialized || !this.channel) {
      throw new Error('消息队列未初始化，无法发送RPC请求');
    }

    return new Promise((resolve, reject) => {
      // 生成唯一的correlationId
      const correlationId = uuidv4();
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.rpcCallbacks.delete(correlationId);
        reject(new Error(`RPC请求超时: ${routingKey}`));
      }, timeout);
      
      // 存储回调
      this.rpcCallbacks.set(correlationId, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
      
      // 获取当前上下文信息
      const context = getContext();
      
      // 构建请求消息
      const requestContent = {
        data: message,
        metadata: {
          timestamp: new Date().toISOString(),
          service: process.env.SERVICE_NAME || 'unknown',
          traceId: context?.traceId || uuidv4(),
          messageId: uuidv4()
        }
      };

      // 发送消息
      this.channel.publish(
        this.config.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(requestContent)),
        {
          persistent: true,
          correlationId,
          replyTo: this.rpcQueueName,
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );

      logger.debug('RPC请求已发送', {
        routingKey,
        correlationId,
        traceId: requestContent.metadata.traceId
      });
    });
  }

  /**
   * 订阅队列
   * @param {string} queueName - 队列名称
   * @param {string} routingKey - 路由键模式
   * @param {Function} handler - 消息处理函数
   * @param {object} options - 订阅选项
   * @returns {Promise<object>} 订阅信息
   */
  async subscribe(queueName, routingKey, handler, options = {}) {
    if (!this.isInitialized || !this.channel) {
      logger.warn('消息队列未初始化，保存订阅配置等待连接恢复', { queueName, routingKey });
      
      // 保存订阅，等待连接恢复时重新订阅
      this.subscriptions.set(queueName, { routingKey, handler, options });
      return { queueName, pending: true };
    }

    try {
      // 声明队列
      const queueOptions = {
        durable: true,  // 持久化队列
        autoDelete: options.autoDelete || false,
        ...options.queueOptions
      };
      
      await this.channel.assertQueue(queueName, queueOptions);
      
      // 绑定队列到交换机
      await this.channel.bindQueue(
        queueName, 
        this.config.exchangeName, 
        routingKey
      );
      
      // 消费消息
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;
        
        try {
          // 解析消息
          const content = JSON.parse(msg.content.toString());
          const { data, metadata } = content;
          
          logger.debug('收到消息', {
            queueName,
            routingKey: msg.fields.routingKey,
            messageId: metadata.messageId,
            traceId: metadata.traceId
          });
          
          // 调用处理函数
          await handler(data, {
            metadata,
            fields: msg.fields,
            properties: msg.properties
          });
          
          // 确认消息
          this.channel.ack(msg);
        } catch (error) {
          logger.error('处理消息失败:', error, {
            queueName,
            messageId: msg.properties.messageId || 'unknown'
          });
          
          // 根据配置决定是否重新入队
          if (options.requeueOnError !== false) {
            // 限制重入队列次数，避免无限循环
            const redelivered = msg.fields.redelivered;
            if (redelivered && options.maxRedeliveries && options.maxRedeliveries <= 3) {
              logger.warn('消息已多次重入队列，丢弃消息', {
                queueName,
                messageId: msg.properties.messageId || 'unknown',
                redelivered
              });
              this.channel.nack(msg, false, false); // 不重新入队
            } else {
              this.channel.nack(msg, false, true); // 重新入队
            }
          } else {
            this.channel.ack(msg); // 确认消息但不处理
          }
        }
      }, {
        noAck: false, // 手动确认
        ...options.consumeOptions
      });
      
      // 保存订阅信息
      this.subscriptions.set(queueName, { routingKey, handler, options });
      
      logger.info('成功订阅队列', { queueName, routingKey });
      
      return { queueName, routingKey, subscribed: true };
    } catch (error) {
      logger.error('订阅队列失败:', error, { queueName, routingKey });
      throw error;
    }
  }

  /**
   * 注册RPC处理器
   * @param {string} queueName - 队列名称
   * @param {Function} handler - 处理函数
   * @param {object} options - 处理器选项
   * @returns {Promise<object>} 注册信息
   */
  async registerRpcHandler(queueName, handler, options = {}) {
    // 包装RPC处理器
    const rpcHandler = async (data, msgInfo) => {
      try {
        // 调用实际处理函数
        const result = await handler(data, msgInfo);
        
        // 如果有replyTo和correlationId，发送回复
        if (msgInfo.properties.replyTo && msgInfo.properties.correlationId) {
          const context = getContext();
          
          const responseContent = {
            result,
            metadata: {
              timestamp: new Date().toISOString(),
              service: process.env.SERVICE_NAME || 'unknown',
              traceId: context?.traceId || msgInfo.metadata.traceId,
              requestId: msgInfo.metadata.messageId
            }
          };
          
          // 发送回复
          this.channel.sendToQueue(
            msgInfo.properties.replyTo,
            Buffer.from(JSON.stringify(responseContent)),
            {
              correlationId: msgInfo.properties.correlationId,
              contentType: 'application/json',
              timestamp: Date.now()
            }
          );
          
          logger.debug('RPC响应已发送', {
            queueName,
            correlationId: msgInfo.properties.correlationId,
            traceId: context?.traceId || msgInfo.metadata.traceId
          });
        }
      } catch (error) {
        logger.error('RPC处理失败:', error, {
          queueName,
          requestId: msgInfo.metadata.messageId
        });
        
        // 发送错误响应
        if (msgInfo.properties.replyTo && msgInfo.properties.correlationId) {
          const context = getContext();
          
          const errorResponse = {
            error: {
              message: error.message,
              code: error.code || 500
            },
            metadata: {
              timestamp: new Date().toISOString(),
              service: process.env.SERVICE_NAME || 'unknown',
              traceId: context?.traceId || msgInfo.metadata.traceId,
              requestId: msgInfo.metadata.messageId
            }
          };
          
          this.channel.sendToQueue(
            msgInfo.properties.replyTo,
            Buffer.from(JSON.stringify(errorResponse)),
            {
              correlationId: msgInfo.properties.correlationId,
              contentType: 'application/json',
              timestamp: Date.now()
            }
          );
        }
        
        // 根据选项决定是否向上抛出错误
        if (options.throwErrors !== false) {
          throw error;
        }
      }
    };
    
    // 使用标准订阅方法注册处理器
    return this.subscribe(queueName, queueName, rpcHandler, options);
  }

  /**
   * 发布事件到事件总线
   * @param {string} eventName - 事件名称
   * @param {object} payload - 事件数据
   * @returns {Promise<boolean>} 发布是否成功
   */
  async publishEvent(eventName, payload) {
    const routingKey = `events.${eventName}`;
    return this.publish(routingKey, payload, {
      headers: {
        eventType: eventName
      }
    });
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称，支持通配符
   * @param {Function} handler - 事件处理函数
   * @param {object} options - 订阅选项
   * @returns {Promise<object>} 订阅信息
   */
  async subscribeToEvent(eventName, handler, options = {}) {
    const routingKey = `events.${eventName}`;
    const queueName = options.queueName || `events.${eventName.replace(/\*/g, 'all')}.queue`;
    
    // 包装事件处理器
    const eventHandler = async (data, msgInfo) => {
      try {
        // 提取事件名称
        const actualEventName = msgInfo.fields.routingKey.replace('events.', '');
        
        logger.debug('收到事件', {
          eventName: actualEventName,
          routingKey: msgInfo.fields.routingKey,
          traceId: msgInfo.metadata.traceId
        });
        
        // 调用实际处理函数
        await handler(data, {
          eventName: actualEventName,
          metadata: msgInfo.metadata,
          timestamp: msgInfo.metadata.timestamp
        });
      } catch (error) {
        logger.error('处理事件失败:', error, {
          eventName,
          traceId: msgInfo.metadata.traceId
        });
        throw error; // 重新抛出以触发消息重入队列
      }
    };
    
    return this.subscribe(queueName, routingKey, eventHandler, {
      autoDelete: options.autoDelete || false,
      queueOptions: options.queueOptions || {},
      requeueOnError: options.requeueOnError !== false,
      maxRedeliveries: options.maxRedeliveries || 3
    });
  }

  /**
   * 关闭连接
   * @returns {Promise<void>}
   */
  async close() {
    try {
      // 清除重连定时器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      // 关闭通道和连接
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      this.isInitialized = false;
      this.subscriptions.clear();
      this.rpcCallbacks.clear();
      
      logger.info('RabbitMQ连接已关闭');
    } catch (error) {
      logger.error('关闭RabbitMQ连接失败:', error);
    }
  }

  /**
   * 设置RPC回复监听器
   * @private
   */
  async _setupRpcReplyListener() {
    await this.channel.consume(this.rpcQueueName, (msg) => {
      if (!msg) return;
      
      const correlationId = msg.properties.correlationId;
      const callback = this.rpcCallbacks.get(correlationId);
      
      if (callback) {
        try {
          const content = JSON.parse(msg.content.toString());
          callback(content);
        } catch (error) {
          logger.error('解析RPC回复失败:', error, { correlationId });
          callback({ error: { message: 'Invalid response format' } });
        } finally {
          // 移除回调
          this.rpcCallbacks.delete(correlationId);
        }
      } else {
        logger.warn('收到未识别的RPC回复', { correlationId });
      }
      
      // 确认消息
      this.channel.ack(msg);
    }, {
      noAck: false
    });
  }

  /**
   * 设置连接事件监听器
   * @private
   */
  _setupConnectionListeners() {
    // 连接关闭事件
    this.connection.on('close', () => {
      logger.warn('RabbitMQ连接已关闭');
      this.isInitialized = false;
      this._scheduleReconnect();
    });
    
    // 连接错误事件
    this.connection.on('error', (error) => {
      logger.error('RabbitMQ连接错误:', error);
    });
    
    // 阻塞事件
    this.connection.on('blocked', (reason) => {
      logger.warn('RabbitMQ连接被阻塞', { reason });
    });
    
    // 取消阻塞事件
    this.connection.on('unblocked', () => {
      logger.info('RabbitMQ连接已取消阻塞');
    });
  }

  /**
   * 安排重新连接
   * @private
   */
  _scheduleReconnect() {
    if (this.attempts >= this.config.reconnectAttempts) {
      logger.error(`已达到最大重连次数 (${this.config.reconnectAttempts})，停止尝试`);
      return;
    }
    
    this.attempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.attempts - 1); // 指数退避
    
    logger.info(`将在 ${delay}ms 后尝试重新连接 (第 ${this.attempts} 次尝试)`);
    
    this.reconnectTimeout = setTimeout(async () => {
      await this.initialize();
    }, delay);
  }

  /**
   * 恢复之前的订阅
   * @private
   */
  async _restoreSubscriptions() {
    logger.info(`恢复 ${this.subscriptions.size} 个消息订阅`);
    
    for (const [queueName, { routingKey, handler, options }] of this.subscriptions.entries()) {
      try {
        await this.subscribe(queueName, routingKey, handler, options);
      } catch (error) {
        logger.error('恢复订阅失败:', error, { queueName, routingKey });
      }
    }
  }

  /**
   * 屏蔽URL中的敏感信息
   * @private
   */
  _maskUrl(url) {
    // 移除URL中的密码
    return url.replace(/:([^@]+)@/g, ':****@');
  }

  /**
   * 获取连接状态
   * @returns {object} 连接状态信息
   */
  getConnectionStatus() {
    return {
      isConnected: this.isInitialized,
      url: this._maskUrl(this.config.url),
      exchange: this.config.exchangeName,
      reconnectAttempts: this.attempts,
      maxReconnectAttempts: this.config.reconnectAttempts,
      subscriptionCount: this.subscriptions.size
    };
  }
}

// 创建单例实例
const messagingService = new MessagingService();

// 优雅关闭处理
process.on('SIGINT', () => messagingService.close());
process.on('SIGTERM', () => messagingService.close());

// 导出服务
module.exports = {
  messagingService,
  initialize: () => messagingService.initialize(),
  publish: (routingKey, message, options) => messagingService.publish(routingKey, message, options),
  rpcCall: (routingKey, message, timeout) => messagingService.rpcCall(routingKey, message, timeout),
  subscribe: (queueName, routingKey, handler, options) => messagingService.subscribe(queueName, routingKey, handler, options),
  registerRpcHandler: (queueName, handler, options) => messagingService.registerRpcHandler(queueName, handler, options),
  publishEvent: (eventName, payload) => messagingService.publishEvent(eventName, payload),
  subscribeToEvent: (eventName, handler, options) => messagingService.subscribeToEvent(eventName, handler, options),
  close: () => messagingService.close(),
  getStatus: () => messagingService.getConnectionStatus()
};
