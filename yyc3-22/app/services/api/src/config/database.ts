/**
 * @file 数据库配置
 * @description 统一管理API服务的数据库连接配置
 * @module api/config
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { envConfig } from './env';
import mysql from 'mysql2/promise';

// 创建数据库连接池
const pool = mysql.createPool({
  host: envConfig.database.host,
  port: envConfig.database.port,
  user: envConfig.database.user,
  password: envConfig.database.password,
  database: envConfig.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 检查数据库连接
export async function checkDatabaseConnection(): Promise<{ status: string; error?: string }> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { status: 'connected' };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database connection error'
    };
  }
}

export default pool;
