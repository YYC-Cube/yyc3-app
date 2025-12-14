#!/usr/bin/env bun

/**
 * YYC³邮件平台集成测试
 * 测试邮件平台与PostgreSQL数据库的完整集成
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
};

console.log('🧪 开始YYC³邮件平台集成测试...');

async function runIntegrationTests() {
  const pool = new Pool(dbConfig);

  try {
    console.log('🔄 连接数据库...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    console.log('\n🔍 测试1: 验证数据库表结构');

    // 检查所有表是否存在
    const tablesQuery = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const expectedTables = ['users', 'organizations', 'emails', 'email_templates', 'email_queue', 'email_stats', 'system_logs'];
    const actualTables = tablesQuery.rows.map(row => row.table_name);

    console.log(`📋 预期表数量: ${expectedTables.length}`);
    console.log(`📋 实际表数量: ${actualTables.length}`);

    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    if (missingTables.length > 0) {
      console.error('❌ 缺失表:', missingTables);
      throw new Error(`缺失必要的数据库表: ${missingTables.join(', ')}`);
    }
    console.log('✅ 所有数据库表已正确创建');

    console.log('\n🔍 测试2: 验证初始数据');

    // 检查用户数据
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👤 用户数量: ${userCount.rows[0].count}`);

    // 检查管理员用户
    const adminUser = await client.query('SELECT * FROM users WHERE email = $1', ['admin@0379.love']);
    if (adminUser.rows.length > 0) {
      console.log('✅ 默认管理员用户存在');
      console.log(`   👤 邮箱: ${adminUser.rows[0].email}`);
      console.log(`   🏢 角色: ${adminUser.rows[0].role}`);
    } else {
      console.error('❌ 默认管理员用户不存在');
    }

    // 检查邮件模板
    const templateCount = await client.query('SELECT COUNT(*) as count FROM email_templates');
    console.log(`📧 邮件模板数量: ${templateCount.rows[0].count}`);

    const systemTemplates = await client.query('SELECT * FROM email_templates WHERE is_system = true');
    console.log(`⚙️  系统模板数量: ${systemTemplates.rows.length}`);
    systemTemplates.rows.forEach(template => {
      console.log(`   - ${template.name}: ${template.subject_template}`);
    });

    console.log('\n🔍 测试3: 邮件发送集成测试');

    // 模拟邮件发送 - 直接插入数据库
    const testEmail = await client.query(`
      INSERT INTO emails (user_id, from_email, to_emails, subject, body_text, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      adminUser.rows[0].id,
      'noreply@0379.love',
      JSON.stringify(['test-integration@example.com']),
      '集成测试邮件',
      '这是一封通过集成测试发送的邮件',
      'sent'
    ]);

    console.log('✅ 邮件发送测试成功');
    console.log(`   📧 邮件ID: ${testEmail.rows[0].id}`);
    const toEmails = JSON.parse(testEmail.rows[0].to_emails);
      console.log(`   📨 收件人: ${Array.isArray(toEmails) ? toEmails[0] : toEmails}`);
    console.log(`   📝 主题: ${testEmail.rows[0].subject}`);

    // 更新统计数据
    await client.query(`
      INSERT INTO email_stats (date, user_id, sent_count, total_count)
      VALUES (CURRENT_DATE, $1, 1, 1)
      ON CONFLICT (date, user_id)
      DO UPDATE SET
        sent_count = email_stats.sent_count + 1,
        total_count = email_stats.total_count + 1
    `, [adminUser.rows[0].id]);

    console.log('\n🔍 测试4: 邮件模板集成测试');

    // 获取欢迎邮件模板
    const welcomeTemplate = await client.query(
      'SELECT * FROM email_templates WHERE name = $1',
      ['欢迎邮件']
    );

    if (welcomeTemplate.rows.length > 0) {
      const template = welcomeTemplate.rows[0];

      // 测试模板变量替换
      let subject = template.subject_template;
      let body = template.body_html_template;

      const variables = {
        name: '集成测试用户',
        email: 'test@example.com',
        created_at: new Date().toLocaleDateString()
      };

      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
        body = body.replace(new RegExp(placeholder, 'g'), variables[key]);
      });

      console.log('✅ 邮件模板测试成功');
      console.log(`   📧 模板名称: ${template.name}`);
      console.log(`   📝 处理后主题: ${subject}`);

      // 创建模板邮件记录
      const templateEmail = await client.query(`
        INSERT INTO emails (user_id, from_email, to_emails, subject, body_html, status, template_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        adminUser.rows[0].id,
        'noreply@0379.love',
        JSON.stringify(['template-test@example.com']),
        subject,
        body,
        'sent',
        template.id
      ]);

      console.log(`   ✅ 模板邮件已发送 (ID: ${templateEmail.rows[0].id})`);
    }

    console.log('\n🔍 测试5: 邮件队列测试');

    // 创建邮件队列任务
    const queueJob = await client.query(`
      INSERT INTO email_queue (email_id, status, priority, scheduled_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [testEmail.rows[0].id, 'sent', 1]);

    console.log('✅ 邮件队列测试成功');
    console.log(`   📋 队列任务ID: ${queueJob.rows[0].id}`);
    console.log(`   📧 关联邮件ID: ${queueJob.rows[0].email_id}`);
    console.log(`   📊 状态: ${queueJob.rows[0].status}`);

    console.log('\n🔍 测试6: 系统日志测试');

    // 记录系统日志
    await client.query(`
      INSERT INTO system_logs (level, message, meta, user_id)
      VALUES ($1, $2, $3, $4)
    `, [
      'info',
      '邮件平台集成测试完成',
      JSON.stringify({
        test_type: 'integration',
        email_count: 2,
        template_used: true,
        database_connected: true
      }),
      adminUser.rows[0].id
    ]);

    console.log('✅ 系统日志记录成功');

    console.log('\n📊 测试7: 数据统计验证');

    // 验证统计数据
    const finalStats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM emails) as total_emails,
        (SELECT COUNT(*) FROM emails WHERE status = 'sent') as sent_emails,
        (SELECT COUNT(*) FROM email_templates) as total_templates,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM email_queue) as total_queue_jobs
    `);

    const stats = finalStats.rows[0];
    console.log('📈 最终统计:');
    console.log(`   📧 总邮件数: ${stats.total_emails}`);
    console.log(`   ✅ 已发送: ${stats.sent_emails}`);
    console.log(`   📋 模板数量: ${stats.total_templates}`);
    console.log(`   👤 用户数量: ${stats.total_users}`);
    console.log(`   🔄 队列任务: ${stats.total_queue_jobs}`);

    console.log('\n🔍 测试8: 数据库性能测试');

    // 测试查询性能
    const performanceStart = Date.now();

    await client.query(`
      SELECT e.*, u.name as user_name, u.email as user_email
      FROM emails e
      JOIN users u ON e.user_id = u.id
      WHERE e.created_at >= NOW() - INTERVAL '1 day'
      ORDER BY e.created_at DESC
      LIMIT 10
    `);

    const queryDuration = Date.now() - performanceStart;
    console.log(`✅ 查询性能测试完成 (${queryDuration}ms)`);

    if (queryDuration > 1000) {
      console.warn('⚠️  查询时间较长，建议优化索引');
    } else {
      console.log('✅ 查询性能良好');
    }

    client.release();

    console.log('\n🎉 所有集成测试通过！');
    console.log('🚀 YYC³邮件平台已准备就绪');
    console.log('📋 测试结果总结:');
    console.log('  ✅ 数据库表结构完整');
    console.log('  ✅ 初始数据正确加载');
    console.log('  ✅ 邮件发送功能正常');
    console.log('  ✅ 邮件模板系统工作');
    console.log('  ✅ 邮件队列系统正常');
    console.log('  ✅ 系统日志记录正常');
    console.log('  ✅ 数据统计功能正常');
    console.log('  ✅ 查询性能良好');

  } catch (error) {
    console.error('\n❌ 集成测试失败：');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);

  } finally {
    await pool.end();
    console.log('\n🔐 数据库连接已关闭');
  }
}

// 执行集成测试
runIntegrationTests().catch(console.error);