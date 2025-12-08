# PostgreSQL性能优化指南
## 基于"五高五标五化"理念

---

## 🚀 高性能优化策略

### 1. 内存优化 (High Performance)

```sql
-- 查看当前内存配置
SELECT name, setting, unit FROM pg_settings WHERE name LIKE '%mem%';

-- 动态调整内存参数
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';

-- 重新加载配置
SELECT pg_reload_conf();
```

**内存分配建议**:
- `shared_buffers`: 25% of RAM (4GB for 16GB RAM)
- `effective_cache_size`: 75% of RAM (12GB for 16GB RAM)
- `work_mem`: 1-4MB per connection * max_connections
- `maintenance_work_mem`: 10% of RAM for maintenance tasks

### 2. 查询优化 (High Performance)

```sql
-- 启用查询计划统计
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_functions = all;
ALTER SYSTEM SET track_timing = on;

-- 优化统计信息收集
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;

-- 查看慢查询
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. 索引优化 (High Performance)

```sql
-- 创建复合索引
CREATE INDEX CONCURRENTLY idx_user_email_status
ON users(email, status);

-- 创建部分索引
CREATE INDEX CONCURRENTLY idx_active_users
ON users(created_at) WHERE status = 'active';

-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 分析缺失的索引
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

---

## 🔒 高安全配置

### 1. 访问控制 (High Security)

```sql
-- 创建应用角色
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'read_password';

-- 最小权限原则
GRANT CONNECT ON DATABASE yyc3_platform TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 只读权限
GRANT CONNECT ON DATABASE yyc3_platform TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_policy ON users FOR ALL TO app_user
    USING (id = current_setting('app.current_user_id')::uuid);
```

### 2. 数据加密 (High Security)

```sql
-- 启用透明数据加密 (需要PostgreSQL扩展)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 字段级加密
CREATE TABLE sensitive_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_email BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 加密函数
CREATE OR REPLACE FUNCTION encrypt_email(email TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(email, 'encryption_key');
END;
$$ LANGUAGE plpgsql;

-- 解密函数
CREATE OR REPLACE FUNCTION decrypt_email(encrypted_email BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_email, 'encryption_key');
END;
$$ LANGUAGE plpgsql;
```

---

## ⚡ 高并发优化

### 1. 连接池配置 (High Concurrency)

```ini
# PgBouncer配置优化
[databases]
yyc3_platform = host=postgres-master port=5432 user=app_user

[pgbouncer]
listen_port = 6432
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 100
min_pool_size = 10
reserve_pool_size = 20
reserve_pool_timeout = 5
max_db_connections = 200
max_user_connections = 200

# 超时配置
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600
```

### 2. 并发控制

```sql
-- 设置并发连接数
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET superuser_reserved_connections = 3;

-- 工作进程配置
ALTER SYSTEM SET max_worker_processes = 8;
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;

-- 锁配置
ALTER SYSTEM SET deadlock_timeout = '1s';
ALTER SYSTEM SET lock_timeout = '30s';
```

---

## 🔄 高可用配置

### 1. 主从复制 (High Availability)

```sql
-- 主节点配置
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET wal_keep_segments = 64;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /nas/backup/postgres/archive/%f';

-- 创建复制用户
CREATE USER replica WITH REPLICATION ENCRYPTED PASSWORD 'replica_password';
GRANT CONNECT ON DATABASE yyc3_platform TO replica;

-- 查看复制状态
SELECT * FROM pg_stat_replication;
```

### 2. 故障切换

```bash
#!/bin/bash
# 自动故障切换脚本

MASTER_HOST="postgres-master"
SLAVE_HOSTS=("postgres-slave1" "postgres-slave2")

check_master() {
    if pg_isready -h "$MASTER_HOST" -p 5432 -U replica; then
        return 0
    else
        return 1
    fi
}

promote_slave() {
    local slave=$1
    echo "提升从节点 $slave 为主节点..."
    docker exec "$slave" pg_ctl -D /var/lib/postgresql/data/pgdata promote
    echo "$slave 已提升为主节点"
}

# 故障检测与切换
if ! check_master; then
    echo "主节点故障，启动故障切换..."
    for slave in "${SLAVE_HOSTS[@]}"; do
        if pg_isready -h "$slave" -p 5432 -U replica; then
            promote_slave "$slave"
            break
        fi
    done
fi
```

---

## 📊 高扩展配置

### 1. 水平分片 (High Scalability)

```sql
-- 创建分片表结构
CREATE TABLE users_shard_0 (LIKE users INCLUDING ALL);
CREATE TABLE users_shard_1 (LIKE users INCLUDING ALL);
CREATE TABLE users_shard_2 (LIKE users INCLUDING ALL);
CREATE TABLE users_shard_3 (LIKE users INCLUDING ALL);

-- 分片函数
CREATE OR REPLACE FUNCTION get_shard(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN 'users_shard_' || (mod(('x' || substring(user_id::text, 1, 8))::bigint, 4));
END;
$$ LANGUAGE plpgsql;

-- 插入路由
CREATE OR REPLACE FUNCTION insert_user_shard(user_data JSONB)
RETURNS UUID AS $$
DECLARE
    shard_name TEXT;
    user_id UUID;
BEGIN
    user_id := gen_random_uuid();
    shard_name := get_shard(user_id);

    EXECUTE format('INSERT INTO %I (id, email, status, created_at) VALUES ($1, $2, $3, $4)',
                   shard_name)
    USING user_id, user_data->>'email', user_data->>'status', NOW();

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. 读写分离

```sql
-- 创建读写分离视图
CREATE OR REPLACE FUNCTION get_user_data(user_id UUID)
RETURNS TABLE(id UUID, email TEXT, status TEXT, created_at TIMESTAMP) AS $$
BEGIN
    -- 优先从从节点读取
    PERFORM 1 FROM pg_stat_replication WHERE state = 'streaming' LIMIT 1;

    IF FOUND THEN
        RETURN QUERY EXECUTE format('SELECT * FROM users WHERE id = $1 LIMIT 1') USING user_id;
    ELSE
        -- 如果从节点不可用，从主节点读取
        RETURN QUERY SELECT * FROM users WHERE id = user_id LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 性能监控

### 1. 关键指标查询

```sql
-- 连接统计
SELECT datname, numbackends, xact_commit, xact_rollback, blks_read, blks_hit
FROM pg_stat_database
WHERE datname = 'yyc3_platform';

-- 表统计
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 索引统计
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 缓存命中率
SELECT
    (blks_hit::float / (blks_hit + blks_read) * 100) AS cache_hit_ratio,
    blks_hit,
    blks_read
FROM pg_stat_database
WHERE datname = 'yyc3_platform';
```

### 2. 自动化监控

```sql
-- 创建监控函数
CREATE OR REPLACE FUNCTION check_performance_metrics()
RETURNS TABLE(metric_name TEXT, metric_value NUMERIC, status TEXT) AS $$
BEGIN
    -- 连接数检查
    RETURN QUERY
    SELECT
        'connection_count',
        COUNT(*)::NUMERIC,
        CASE
            WHEN COUNT(*) < 180 THEN 'OK'
            WHEN COUNT(*) < 195 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM pg_stat_activity
    WHERE state = 'active';

    -- 缓存命中率
    RETURN QUERY
    SELECT
        'cache_hit_ratio',
        ROUND((blks_hit::float / (blks_hit + blks_read) * 100), 2),
        CASE
            WHEN (blks_hit::float / (blks_hit + blks_read)) > 0.95 THEN 'OK'
            WHEN (blks_hit::float / (blks_hit + blks_read)) > 0.90 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM pg_stat_database
    WHERE datname = 'yyc3_platform';

    -- 慢查询检查
    RETURN QUERY
    SELECT
        'slow_queries',
        COUNT(*)::NUMERIC,
        CASE
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM pg_stat_statements
    WHERE mean_time > 1000;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 运维自动化

### 1. 定时维护任务

```bash
#!/bin/bash
# PostgreSQL自动化维护脚本

# 自动VACUUM
docker exec postgres-master psql -U yyc_admin -d yyc3_platform -c "VACUUM ANALYZE;"

# 更新统计信息
docker exec postgres-master psql -U yyc_admin -d yyc3_platform -c "ANALYZE;"

# 重建索引
docker exec postgres-master psql -U yyc_admin -d yyc3_platform -c "REINDEX DATABASE yyc3_platform;"

# 检查数据库健康状态
docker exec postgres-master psql -U yyc_admin -d yyc3_platform -c "SELECT * FROM check_performance_metrics();"
```

### 2. 告警配置

```yaml
# Prometheus告警规则
groups:
  - name: postgres
    rules:
      - alert: PostgreSQLHighConnections
        expr: pg_stat_database_numbackends > 180
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL连接数过高"
          description: "PostgreSQL连接数: {{ $value }}"

      - alert: PostgreSQLSlowQueries
        expr: pg_stat_statements_mean_time > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL存在慢查询"
          description: "平均查询时间: {{ $value }}ms"
```

---

**文档版本**: v1.0
**更新时间**: 2025-11-11
**适用版本**: PostgreSQL 15+