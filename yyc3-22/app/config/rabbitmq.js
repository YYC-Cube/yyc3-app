/**
 * @file RabbitMQ配置文件
 * @description 配置RabbitMQ的连接参数和队列设置
 * @module config/rabbitmq
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

module.exports = {
  // RabbitMQ连接配置
  connection: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672',
    options: {
      heartbeat: 60,
      reconnectTimeInSeconds: 5,
      timeout: 20000,
    },
  },

  // 队列配置
  queues: {
    // 订单队列
    orders: {
      name: 'orders_queue',
      options: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 86400000, // 消息过期时间：24小时
          'x-max-length': 10000, // 队列最大长度
          'x-overflow': 'drop-head', // 溢出策略：丢弃最旧的消息
        },
      },
    },

    // 邮件队列
    emails: {
      name: 'emails_queue',
      options: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 3600000, // 消息过期时间：1小时
          'x-max-length': 5000, // 队列最大长度
        },
      },
    },

    // 通知队列
    notifications: {
      name: 'notifications_queue',
      options: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 1800000, // 消息过期时间：30分钟
          'x-max-length': 10000, // 队列最大长度
        },
      },
    },

    // 日志队列
    logs: {
      name: 'logs_queue',
      options: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-message-ttl': 604800000, // 消息过期时间：7天
          'x-max-length': 50000, // 队列最大长度
        },
      },
    },
  },

  // 交换机配置
  exchanges: {
    // 主交换机
    main: {
      name: 'main_exchange',
      type: 'direct',
      options: {
        durable: true,
        autoDelete: false,
      },
    },

    // 主题交换机
    topic: {
      name: 'topic_exchange',
      type: 'topic',
      options: {
        durable: true,
        autoDelete: false,
      },
    },

    // 扇形交换机
    fanout: {
      name: 'fanout_exchange',
      type: 'fanout',
      options: {
        durable: true,
        autoDelete: false,
      },
    },
  },

  // 绑定配置
  bindings: [
    // 订单队列绑定到主交换机
    {
      exchange: 'main_exchange',
      queue: 'orders_queue',
      routingKey: 'orders',
    },
    // 邮件队列绑定到主交换机
    {
      exchange: 'main_exchange',
      queue: 'emails_queue',
      routingKey: 'emails',
    },
    // 通知队列绑定到主交换机
    {
      exchange: 'main_exchange',
      queue: 'notifications_queue',
      routingKey: 'notifications',
    },
    // 日志队列绑定到主题交换机
    {
      exchange: 'topic_exchange',
      queue: 'logs_queue',
      routingKey: 'logs.*',
    },
  ],
};
