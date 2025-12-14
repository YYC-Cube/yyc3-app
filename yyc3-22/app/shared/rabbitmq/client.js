/**
 * @file RabbitMQ客户端模块
 * @description 实现RabbitMQ的连接管理、消息发送和接收功能
 * @module shared/rabbitmq/client
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

const amqp = require('amqplib');
const rabbitmqConfig = require('../../../config/rabbitmq');
const logger = require('../logger');

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  /**
   * 连接到RabbitMQ服务器
   */
  async connect() {
    try {
      logger.info('正在连接到RabbitMQ服务器...', { url: rabbitmqConfig.connection.url });
      
      // 建立连接
      this.connection = await amqp.connect(
        rabbitmqConfig.connection.url,
        rabbitmqConfig.connection.options
      );
      
      // 创建通道
      this.channel = await this.connection.createChannel();
      
      // 设置通道QoS（公平调度）
      await this.channel.prefetch(1);
      
      // 监听连接关闭事件
      this.connection.on('close', () => {
        this.isConnected = false;
        logger.error('RabbitMQ连接已关闭');
        this.handleReconnect();
      });
      
      // 监听连接错误事件
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ连接错误', { error: err.message });
      });
      
      // 初始化队列和交换机
      await this.initQueuesAndExchanges();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('成功连接到RabbitMQ服务器');
      
      return this;
    } catch (err) {
      logger.error('连接到RabbitMQ服务器失败', { error: err.message });
      this.handleReconnect();
      throw err;
    }
  }

  /**
   * 处理重连逻辑
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('达到最大重连尝试次数，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = rabbitmqConfig.connection.reconnectTimeInSeconds * 1000 * this.reconnectAttempts;
    
    logger.info(`将在 ${delay}ms 后尝试重连，尝试次数: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (err) {
        logger.error('重连失败', { error: err.message });
      }
    }, delay);
  }

  /**
   * 初始化队列和交换机
   */
  async initQueuesAndExchanges() {
    try {
      // 创建交换机
      for (const exchangeKey in rabbitmqConfig.exchanges) {
        const exchange = rabbitmqConfig.exchanges[exchangeKey];
        await this.channel.assertExchange(
          exchange.name,
          exchange.type,
          exchange.options
        );
        logger.info(`创建交换机成功: ${exchange.name} (${exchange.type})`);
      }
      
      // 创建队列
      for (const queueKey in rabbitmqConfig.queues) {
        const queue = rabbitmqConfig.queues[queueKey];
        await this.channel.assertQueue(
          queue.name,
          queue.options
        );
        logger.info(`创建队列成功: ${queue.name}`);
      }
      
      // 创建绑定
      for (const binding of rabbitmqConfig.bindings) {
        await this.channel.bindQueue(
          binding.queue,
          binding.exchange,
          binding.routingKey
        );
        logger.info(`绑定成功: ${binding.exchange} -> ${binding.queue} (${binding.routingKey})`);
      }
    } catch (err) {
      logger.error('初始化队列和交换机失败', { error: err.message });
      throw err;
    }
  }

  /**
   * 发送消息到队列
   * @param {string} queueName - 队列名称
   * @param {object} message - 消息内容
   * @param {object} options - 消息选项
   */
  async sendToQueue(queueName, message, options = {}) {
    if (!this.isConnected) {
      logger.error('RabbitMQ客户端未连接，无法发送消息');
      throw new Error('RabbitMQ客户端未连接');
    }
    
    try {
      const defaultOptions = {
        persistent: true,
        contentType: 'application/json',
      };
      
      const messageOptions = { ...defaultOptions, ...options };
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      await this.channel.sendToQueue(
        queueName,
        messageBuffer,
        messageOptions
      );
      
      logger.info('消息发送成功', { queueName, messageId: message.id || message.messageId });
      return true;
    } catch (err) {
      logger.error('发送消息失败', { queueName, error: err.message });
      throw err;
    }
  }

  /**
   * 发布消息到交换机
   * @param {string} exchangeName - 交换机名称
   * @param {string} routingKey - 路由键
   * @param {object} message - 消息内容
   * @param {object} options - 消息选项
   */
  async publish(exchangeName, routingKey, message, options = {}) {
    if (!this.isConnected) {
      logger.error('RabbitMQ客户端未连接，无法发布消息');
      throw new Error('RabbitMQ客户端未连接');
    }
    
    try {
      const defaultOptions = {
        persistent: true,
        contentType: 'application/json',
      };
      
      const messageOptions = { ...defaultOptions, ...options };
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      await this.channel.publish(
        exchangeName,
        routingKey,
        messageBuffer,
        messageOptions
      );
      
      logger.info('消息发布成功', { exchangeName, routingKey, messageId: message.id || message.messageId });
      return true;
    } catch (err) {
      logger.error('发布消息失败', { exchangeName, routingKey, error: err.message });
      throw err;
    }
  }

  /**
   * 订阅队列
   * @param {string} queueName - 队列名称
   * @param {function} handler - 消息处理函数
   * @param {object} options - 订阅选项
   */
  async consume(queueName, handler, options = {}) {
    if (!this.isConnected) {
      logger.error('RabbitMQ客户端未连接，无法订阅队列');
      throw new Error('RabbitMQ客户端未连接');
    }
    
    try {
      const defaultOptions = {
        noAck: false,
      };
      
      const consumeOptions = { ...defaultOptions, ...options };
      
      await this.channel.consume(
        queueName,
        async (msg) => {
          if (msg === null) {
            logger.error('接收到空消息');
            return;
          }
          
          try {
            const message = JSON.parse(msg.content.toString());
            logger.info('接收到消息', { queueName, messageId: message.id || message.messageId });
            
            // 调用消息处理函数
            await handler(message);
            
            // 确认消息
            if (!consumeOptions.noAck) {
              this.channel.ack(msg);
              logger.info('消息确认成功', { queueName, messageId: message.id || message.messageId });
            }
          } catch (err) {
            logger.error('处理消息失败', { queueName, error: err.message });
            
            // 拒绝消息并重新排队
            if (!consumeOptions.noAck) {
              this.channel.nack(msg, false, true);
              logger.info('消息已重新排队', { queueName });
            }
          }
        },
        consumeOptions
      );
      
      logger.info('已订阅队列', { queueName });
      return this;
    } catch (err) {
      logger.error('订阅队列失败', { queueName, error: err.message });
      throw err;
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      if (this.channel) {
        await this.channel.close();
        logger.info('RabbitMQ通道已关闭');
      }
      
      if (this.connection) {
        await this.connection.close();
        logger.info('RabbitMQ连接已关闭');
      }
      
      this.isConnected = false;
    } catch (err) {
      logger.error('关闭RabbitMQ连接失败', { error: err.message });
      throw err;
    }
  }

  /**
   * 获取客户端状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// 导出单例实例
const rabbitmqClient = new RabbitMQClient();

module.exports = rabbitmqClient;
