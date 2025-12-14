#!/usr/bin/env bun

/**
 * YYC³ PostgreSQL数据库连接测试
 * 测试数据库连接和基础操作
 */

import { Pool } from 'pg';

// 数据库配置
const dbConfig = {
  host: '192.168.3.45',
  port: 5432,
  database: 'yyc3_email',
  user: 'yyc3_email',
  password: 'yyc3_admin',
  ssl: false,
  connectionTimeoutMillis: 10000,
};

console.log('🔍 开始测试PostgreSQL数据库连接...');
console.log(`📍 主机: ${dbConfig.host}:${dbConfig.port}`);
console.log(`📊 数据库: ${dbConfig.database}`);
console.log(`👤 用户: ${dbConfig.user}`);

async function testDatabaseConnection() {
  const pool = new Pool(dbConfig);
  let client = null;

  try {
    console.log('\n🔄 正在连接数据库...');

    // 测试连接
    client = await pool.connect();
    console.log('✅ 数据库连接成功！');

    // 获取数据库版本
    const versionResult = await client.query('SELECT version() as version, NOW() as connected_at');
    console.log('📋 数据库版本:', versionResult.rows[0].version.split(',').shift());

    // 测试基础查询
    console.log('\n🔍 测试基础查询...');

    // 检查当前数据库
    const currentDb = await client.query('SELECT current_database() as db_name');
    console.log(`📊 当前数据库: ${currentDb.rows[0].db_name}`);

    // 检查用户权限
    const userPerms = await client.query('SELECT current_user as user, session_user as session');
    console.log(`👤 当前用户: ${userPerms.rows[0].user}`);

    // 检查表数量
    const tableCount = await client.query(`
      SELECT count(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(`📋 数据表数量: ${tableCount.rows[0].table_count}`);

    // 检查数据库大小
    const dbSize = await client.query(`
      SELECT pg_database_size(current_database()) as size_bytes
    `);
    const sizeInMB = Math.round(dbSize.rows[0].size_bytes / 1024 / 1024);
    console.log(`💾 数据库大小: ${sizeInMB} MB`);

    // 测试创建表
    console.log('\n🔧 测试表创建...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ 测试表创建成功');

    // 测试插入数据
    await client.query(`
      INSERT INTO test_connection (message)
      VALUES ($1)
      RETURNING id, message, created_at
    `, [`数据库测试 - ${new Date().toISOString()}`]);
    console.log('✅ 数据插入成功');

    // 测试查询数据
    const testData = await client.query(`
      SELECT * FROM test_connection
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`📊 测试表记录数: ${testData.rows.length}`);

    // 测试删除测试表
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log('🗑️  测试表清理完成');

    console.log('\n🎯 所有数据库测试通过！');
    console.log('🚀 YYC³邮件平台数据库连接正常');

  } catch (error) {
    console.error('\n❌ 数据库测试失败:');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);

    // 提供故障排除建议
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 建议:');
      console.log('  1. 检查PostgreSQL服务是否运行');
      console.log('  2. 验证主机地址和端口号');
      console.log('  3. 检查防火墙设置');
    } else if (error.code === '28P01') {
      console.log('\n💡 建议:');
      console.log('  1. 验证用户名和密码');
      console.log('  2. 检查用户权限');
      console.log('  3. 确认数据库存在');
    } else if (error.code === '3D000') {
      console.log('\n💡 建议:');
      console.log('  1. 创建数据库: CREATE DATABASE yyc3_email;');
      console.log('  2. 验证数据库名称拼写');
      console.log('  3. 检查用户是否有访问权限');
    }

    process.exit(1);

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('\n🔐 数据库连接已关闭');
  }
}

// 执行测试
testDatabaseConnection().catch(console.error);