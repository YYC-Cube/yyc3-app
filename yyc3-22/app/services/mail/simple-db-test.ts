#!/usr/bin/env bun

/**
 * 简单数据库测试 - 调试JSON解析问题
 */

import { Pool } from 'pg';

const dbConfig = {
  host: '192.168.3.45',
  port: 5432,
  database: 'yyc3_email',
  user: 'yyc3_email',
  password: 'yyc3_admin',
  ssl: false,
};

async function debugDatabase() {
  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    console.log('🔍 检查最新邮件记录...');
    const emails = await client.query('SELECT * FROM emails ORDER BY created_at DESC LIMIT 3');

    emails.rows.forEach((email, index) => {
      console.log(`\n邮件 ${index + 1}:`);
      console.log(`  ID: ${email.id}`);
      console.log(`  主题: ${email.subject}`);
      console.log(`  to_emails 类型: ${typeof email.to_emails}`);
      console.log(`  to_emails 值: ${email.to_emails}`);

      try {
        const parsed = JSON.parse(email.to_emails);
        console.log(`  解析成功: ${JSON.stringify(parsed)}`);
      } catch (parseError) {
        console.log(`  解析失败: ${parseError.message}`);
      }
    });

    client.release();

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await pool.end();
  }
}

debugDatabase().catch(console.error);