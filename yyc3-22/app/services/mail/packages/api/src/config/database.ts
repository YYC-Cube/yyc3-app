/**
 * @file PostgreSQL数据库配置
 * @description 企业级邮件平台PostgreSQL连接配置
 * @module database
 * @author YYC
 * @version 2.0.0
 * @created 2024-12-09
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/**
 * 数据库连接配置
 */
const dbConfig = {
  host: process.env.DB_HOST || '192.168.3.45',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'yyc3_email',
  user: process.env.DB_USER || 'yyc3_email',
  password: process.env.DB_PASSWORD || 'yyc3_admin',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  application_name: 'YYC3-Mail-Platform'
};

/**
 * 连接数据库
 */
export async function connectDB(): Promise<void> {
  try {
    pool = new Pool(dbConfig);

    // 测试连接
    const client = await pool.connect();
    const result = await client.query('SELECT version() as version, NOW() as connected_at');
    client.release();

    logger.info('✅ PostgreSQL连接成功', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      version: result.rows[0].version,
      connectedAt: result.rows[0].connected_at
    });

    // 初始化数据库表结构
    await initializeDatabase();

    // 启动连接池监控
    if (process.env.NODE_ENV === 'development') {
      startPoolMonitoring();
    }

  } catch (error) {
    logger.error('❌ PostgreSQL连接失败', error as Error);
    throw error;
  }
}

/**
 * 获取数据库连接池
 */
export function getDB(): Pool {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用connectDB()');
  }
  return pool;
}

/**
 * 执行SQL查询
 */
interface QueryOptions {
  name?: string;
  client?: PoolClient;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
  options?: QueryOptions
): Promise<QueryResult<T>> {
  const start = Date.now();
  const queryName = options?.name || 'unnamed_query';
  const queryClient = options?.client;

  try {
    if (!pool && !queryClient) {
      throw new Error('数据库连接池未初始化且未提供客户端');
    }

    const result = queryClient
      ? await queryClient.query<T>(text, params)
      : await (pool as Pool).query<T>(text, params);
    const duration = Date.now() - start;

    // 开发环境记录查询日志
    if (process.env.NODE_ENV === 'development') {
      logger.debug('SQL查询执行', {
        name: queryName,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        sql: text.length > 200 ? text.substring(0, 200) + '...' : text
      });
    }

    return result;
  } catch (error) {
    logger.error('SQL查询失败', {
      name: queryName,
      error: (error as Error).message,
      sql: text,
      params: params ? JSON.stringify(params) : null,
      duration: Date.now() - start
    });
    throw error;
  }
}

/**
 * 事务处理
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logger.debug('事务开始');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('事务提交成功');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('事务执行失败，已回滚', error as Error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 初始化数据库表结构
 */
async function initializeDatabase(): Promise<void> {
  const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      organization_id INTEGER REFERENCES organizations(id),
      settings JSONB DEFAULT '{}',
      last_login_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // 组织表
    `CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255) UNIQUE,
      settings JSONB DEFAULT '{}',
      subscription_plan VARCHAR(50) DEFAULT 'free',
      max_users INTEGER DEFAULT 10,
      max_emails_per_day INTEGER DEFAULT 1000,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // 邮件表
    `CREATE TABLE IF NOT EXISTS emails (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_email VARCHAR(255) NOT NULL,
      to_emails JSONB NOT NULL,
      cc_emails JSONB DEFAULT '[]',
      bcc_emails JSONB DEFAULT '[]',
      subject TEXT NOT NULL,
      body_text TEXT,
      body_html TEXT,
      attachments JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed', 'scheduled')),
      priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      sent_at TIMESTAMP WITH TIME ZONE,
      scheduled_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // 邮件模板表
    `CREATE TABLE IF NOT EXISTS email_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      subject_template TEXT NOT NULL,
      body_html_template TEXT NOT NULL,
      body_text_template TEXT,
      variables JSONB DEFAULT '[]',
      organization_id INTEGER REFERENCES organizations(id),
      is_system BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // 邮件队列表
    `CREATE TABLE IF NOT EXISTS email_queue (
      id BIGSERIAL PRIMARY KEY,
      email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      error_message TEXT,
      priority INTEGER DEFAULT 0,
      scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // 邮件统计表
    `CREATE TABLE IF NOT EXISTS email_stats (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      organization_id INTEGER REFERENCES organizations(id),
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(date, user_id)
    )`,

    // 系统日志表
    `CREATE TABLE IF NOT EXISTS system_logs (
      id BIGSERIAL PRIMARY KEY,
      level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
      message TEXT NOT NULL,
      meta JSONB DEFAULT '{}',
      user_id INTEGER REFERENCES users(id),
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  const indexes = [
    // 用户表索引
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',

    // 组织表索引
    'CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain)',

    // 邮件表索引
    'CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status)',
    'CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at)',
    'CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_emails_to_emails ON emails USING GIN(to_emails)',

    // 邮件队列表索引
    'CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)',
    'CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at)',
    'CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC)',

    // 邮件统计表索引
    'CREATE INDEX IF NOT EXISTS idx_email_stats_date ON email_stats(date)',
    'CREATE INDEX IF NOT EXISTS idx_email_stats_user_id ON email_stats(user_id)',

    // 系统日志表索引
    'CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)',
    'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)'
  ];

  // 创建表
  for (const tableSQL of tables) {
    try {
      await query(tableSQL);
      logger.debug(`表创建成功: ${tableSQL.split('CREATE TABLE IF NOT EXISTS')[1]?.split(' ')[0]}`);
    } catch (error) {
      logger.error('表创建失败', { sql: tableSQL, error: (error as Error).message });
      throw error;
    }
  }

  // 创建索引
  for (const indexSQL of indexes) {
    try {
      await query(indexSQL);
    } catch (error) {
      logger.warn('索引创建失败（可能已存在）', { sql: indexSQL, error: (error as Error).message });
    }
  }

  logger.info('📊 PostgreSQL数据库表结构初始化完成');
}

/**
 * 数据库健康检查
 */
export async function healthCheck(): Promise<any> {
  try {
    if (!pool) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection pool not initialized'
      };
    }

    const result = await query('SELECT 1 as healthy, version() as version');
    const poolStats = getPoolStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        version: result.rows[0].version,
        connected: true
      },
      pool: poolStats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    };
  }
}

/**
 * 获取连接池统计信息
 */
function getPoolStats(): any {
  if (!pool) return null;

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxCount: pool.options.max,
    minCount: pool.options.min,
    usagePercent: Math.round(((pool.totalCount - pool.idleCount) / pool.options.max) * 100)
  };
}

/**
 * 连接池监控
 */
let monitoringInterval: NodeJS.Timeout | null = null;

function startPoolMonitoring(): void {
  if (monitoringInterval) return;

  monitoringInterval = setInterval(() => {
    const stats = getPoolStats();
    if (stats) {
      if (stats.usagePercent > 80) {
        logger.warn('数据库连接池使用率过高', stats);
      }
    }
  }, 30000); // 30秒监控一次

  logger.info('数据库连接池监控已启动');
}

/**
 * 关闭数据库连接
 */
export async function closeDB(): Promise<void> {
  try {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }

    if (pool) {
      await pool.end();
      pool = null;
      logger.info('PostgreSQL连接池已关闭');
    }
  } catch (error) {
    logger.error('关闭数据库连接失败', error as Error);
    throw error;
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  await closeDB();
});

process.on('SIGINT', async () => {
  await closeDB();
});

export default {
  connectDB,
  getDB,
  query,
  transaction,
  healthCheck,
  closeDB
};