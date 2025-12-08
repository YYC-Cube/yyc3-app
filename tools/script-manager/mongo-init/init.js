// MongoDB 初始化脚本
db = db.getSiblingDB('0379email');

// 创建应用用户
db.createUser({
  user: 'app',
  pwd: '5LUg9loJ0io6e4R5PJ6lfmhd',
  roles: [
    {
      role: 'readWrite',
      db: '0379email'
    }
  ]
});

// 创建集合和索引
db.createCollection('users');
db.createCollection('emails');
db.createCollection('logs');

// 用户集合索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: 1 });

// 邮件集合索引
db.emails.createIndex({ message_id: 1 }, { unique: true });
db.emails.createIndex({ to: 1 });
db.emails.createIndex({ sent_at: 1 });

// 日志集合索引
db.logs.createIndex({ timestamp: 1 });
db.logs.createIndex({ level: 1 });

print('MongoDB initialization completed');
