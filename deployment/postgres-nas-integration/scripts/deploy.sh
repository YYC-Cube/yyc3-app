#!/bin/bash
# =============================================================================
# PostgreSQL NAS集成部署脚本 - 五高五标五化实施
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
DEPLOY_DIR="/Users/yanyu/www/deployments/postgres-nas-integration"
NAS_DATA_BASE="/nas"
PROJECT_NAME="yyc3-postgres"
BACKUP_DIR="/nas/backup/postgres"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示标题
show_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}       PostgreSQL NAS集成部署 - 五高五标五化核心理念${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BLUE}部署时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}项目名称: ${PROJECT_NAME}${NC}"
    echo ""
}

# 检查部署环境
check_environment() {
    log_info "检查部署环境..."

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    # 检查NAS连接
    if [[ ! -d "$NAS_DATA_BASE" ]]; then
        log_warning "NAS挂载点 $NAS_DATA_BASE 不存在，尝试创建..."
        mkdir -p "$NAS_DATA_BASE"
        if [[ $? -ne 0 ]]; then
            log_error "无法创建NAS挂载点，请检查NAS连接状态"
            exit 1
        fi
    fi

    # 检查可用空间
    available_space=$(df -h "$NAS_DATA_BASE" | tail -1 | awk '{print $4}' | sed 's/G//')
    if (( $(echo "$available_space < 50" | bc -l) )); then
        log_warning "NAS可用空间不足50GB，当前可用: ${available_space}GB"
    else
        log_success "NAS存储空间充足，可用: ${available_space}GB"
    fi

    log_success "环境检查完成"
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."

    # NAS数据目录
    mkdir -p "$NAS_DATA_BASE/data/postgres/master"
    mkdir -p "$NAS_DATA_BASE/data/postgres/slave1"
    mkdir -p "$NAS_DATA_BASE/data/postgres/slave2"
    mkdir -p "$NAS_DATA_BASE/logs/postgres/master"
    mkdir -p "$NAS_DATA_BASE/logs/postgres/slave1"
    mkdir -p "$NAS_DATA_BASE/logs/postgres/slave2"
    mkdir -p "$NAS_DATA_BASE/data/redis"
    mkdir -p "$NAS_DATA_BASE/data/prometheus"
    mkdir -p "$NAS_DATA_BASE/data/grafana"
    mkdir -p "$NAS_DATA_BASE/data/pgadmin"
    mkdir -p "$BACKUP_DIR"

    # 本地配置目录
    mkdir -p "$DEPLOY_DIR/configs/postgresql"
    mkdir -p "$DEPLOY_DIR/configs/pgbouncer"
    mkdir -p "$DEPLOY_DIR/configs/redis"
    mkdir -p "$DEPLOY_DIR/configs/prometheus"
    mkdir -p "$DEPLOY_DIR/configs/grafana/provisioning"
    mkdir -p "$DEPLOY_DIR/configs/pgadmin"
    mkdir -p "$DEPLOY_DIR/scripts"

    # 设置权限
    chmod 755 "$NAS_DATA_BASE/data/postgres"/*
    chmod 755 "$NAS_DATA_BASE/logs/postgres"/*
    chmod 755 "$BACKUP_DIR"

    log_success "目录结构创建完成"
}

# 生成配置文件
generate_configs() {
    log_info "生成配置文件..."

    # PostgreSQL主节点配置
    cat > "$DEPLOY_DIR/configs/postgresql/postgresql.conf" << 'EOF'
# =============================================================================
# PostgreSQL 高性能配置 - 五高五标五化
# =============================================================================

# 连接配置
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# 内存配置 (高性能)
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 256MB
maintenance_work_mem = 1GB
max_stack_depth = 2MB

# WAL配置 (高可用)
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9
wal_writer_delay = 200ms
commit_delay = 0

# 复制配置 (高可用)
max_wal_senders = 10
max_replication_slots = 10
wal_keep_segments = 64
hot_standby = on

# 日志配置 (标准化)
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# 查询优化 (高性能)
random_page_cost = 1.1
effective_io_concurrency = 200
checkpoint_completion_target = 0.9

# 安全配置 (高安全)
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
password_encryption = scram-sha-256

# 自动清理
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
EOF

    # pg_hba.conf 访问控制
    cat > "$DEPLOY_DIR/configs/postgresql/pg_hba.conf" << 'EOF'
# PostgreSQL访问控制配置 (高安全)

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# 本地连接
local   all             all                                     trust

# Docker网络连接
host    all             all             172.20.0.0/16            md5

# 复制连接
host    replication     replica         172.20.0.0/16            md5

# SSL连接
hostssl all             all             0.0.0.0/0               md5
EOF

    # PgBouncer配置
    cat > "$DEPLOY_DIR/configs/pgbouncer/pgbouncer.ini" << 'EOF'
[databases]
yyc3_platform = host=postgres-master port=5432 user=yyc_admin

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/users.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = yyc_admin
stats_users = stats

# 连接池配置 (高性能)
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 50
max_user_connections = 50

# 超时配置
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600

# 日志配置
log_stats = 1
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
EOF

    # PgBouncer用户文件
    cat > "$DEPLOY_DIR/configs/pgbouncer/users.txt" << 'EOF'
"yyc_admin" "md5d6a3a1d6a3a1d6a3a1d6a3a1d6a3a1d"
"stats" "md55e884898da28047151d0e56f8dc62927"
EOF

    # Redis配置
    cat > "$DEPLOY_DIR/configs/redis/redis.conf" << 'EOF'
# Redis高性能配置

# 基础配置
port 6379
bind 0.0.0.0
protected-mode yes
requirepass YYC3@Redis2025!

# 内存配置 (高性能)
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# 持久化配置
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# 网络配置
tcp-keepalive 300
timeout 0
tcp-backlog 511

# 日志配置
loglevel notice
logfile /var/log/redis/redis.log

# 性能优化
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
EOF

    # Prometheus配置
    cat > "$DEPLOY_DIR/configs/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-master:5432', 'postgres-slave1:5432', 'postgres-slave2:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-cache:6379']

  - job_name: 'pgbouncer'
    static_configs:
      - targets: ['pgbouncer:6432']
EOF

    # 初始化脚本
    cat > "$DEPLOY_DIR/scripts/init-master.sh" << 'EOF'
#!/bin/bash
# PostgreSQL主节点初始化脚本

set -e

# 创建复制用户
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replica WITH REPLICATION ENCRYPTED PASSWORD '$POSTGRES_REPLICATION_PASSWORD';
    CREATE ROLE readonly WITH LOGIN;
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO readonly;
    GRANT USAGE ON SCHEMA public TO readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
EOSQL

echo "PostgreSQL主节点初始化完成"
EOF

    cat > "$DEPLOY_DIR/scripts/init-slave.sh" << 'EOF'
#!/bin/bash
# PostgreSQL从节点初始化脚本

set -e

# 等待主节点就绪
until pg_isready -h "$POSTGRES_MASTER_SERVICE" -p 5432 -U replica
do
  echo "等待主节点启动..."
  sleep 2
done

# 停止PostgreSQL服务
pg_ctl -D "$PGDATA" -m fast stop || true

# 清空数据目录
rm -rf "$PGDATA"/*

# 从主节点创建基础备份
pg_basebackup -h "$POSTGRES_MASTER_SERVICE" -D "$PGDATA" -U replica -v -P -W

# 创建恢复配置
cat > "$PGDATA/recovery.conf" << RECOVERY
standby_mode = 'on'
primary_conninfo = 'host=$POSTGRES_MASTER_SERVICE port=5432 user=replica'
trigger_file = '/tmp/postgresql.trigger'
RECOVERY

# 启动从节点
pg_ctl -D "$PGDATA" -l /var/log/postgresql/logfile start

echo "PostgreSQL从节点初始化完成"
EOF

    # 备份脚本
    cat > "$DEPLOY_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash
# PostgreSQL自动备份脚本

set -e

BACKUP_DIR="/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/yyc3_platform_backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "开始数据库备份: $TIMESTAMP"

# 创建备份
pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" --verbose --clean --if-exists > "$BACKUP_FILE"

# 压缩备份文件
gzip "$BACKUP_FILE"

echo "备份完成: $COMPRESSED_FILE"

# 清理旧备份 (保留7天)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "旧备份清理完成"
EOF

    # 设置脚本权限
    chmod +x "$DEPLOY_DIR/scripts"/*.sh

    log_success "配置文件生成完成"
}

# 部署服务
deploy_services() {
    log_info "部署PostgreSQL服务集群..."

    cd "$DEPLOY_DIR"

    # 设置环境变量
    export DB_PASSWORD="YYC3@Secure2025!"
    export REPLICATION_PASSWORD="Replica@2025!"
    export GRAFANA_PASSWORD="Admin@2025!"
    export PGADMIN_EMAIL="admin@0379.email"
    export PGADMIN_PASSWORD="Admin@2025!"

    # 拉取镜像
    log_info "拉取Docker镜像..."
    docker-compose pull

    # 启动服务
    log_info "启动服务集群..."
    docker-compose up -d

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30

    log_success "服务部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."

    # 检查容器状态
    log_info "检查容器状态:"
    docker-compose ps

    # 检查主节点连接
    log_info "测试主节点连接:"
    if docker exec postgres-master pg_isready -U yyc_admin -d yyc3_platform; then
        log_success "主节点连接正常"
    else
        log_error "主节点连接失败"
        return 1
    fi

    # 检查从节点复制状态
    log_info "检查从节点复制状态:"
    for slave in postgres-slave1 postgres-slave2; do
        if docker exec "$slave" pg_isready -U yyc_admin -d yyc3_platform; then
            log_success "$slave 连接正常"
        else
            log_warning "$slave 连接异常"
        fi
    done

    # 检查PgBouncer连接池
    log_info "测试PgBouncer连接池:"
    if docker exec pgbouncer psql -h localhost -p 6432 -U yyc_admin -d yyc3_platform -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "PgBouncer连接池正常"
    else
        log_warning "PgBouncer连接池异常"
    fi

    # 检查Redis缓存
    log_info "测试Redis缓存:"
    if docker exec redis-cache redis-cli ping | grep -q "PONG"; then
        log_success "Redis缓存正常"
    else
        log_warning "Redis缓存异常"
    fi

    log_success "部署验证完成"
}

# 显示访问信息
show_access_info() {
    log_info "服务访问信息:"
    echo ""
    echo -e "${CYAN}数据库服务:${NC}"
    echo "  主节点: postgres-master:5432"
    echo "  从节点1: postgres-slave1:5432"
    echo "  从节点2: postgres-slave2:5432"
    echo "  连接池:  pgbouncer:6432"
    echo "  缓存服务: redis-cache:6379"
    echo ""
    echo -e "${CYAN}管理界面:${NC}"
    echo "  pgAdmin: http://localhost:5050"
    echo "  Grafana: http://localhost:3001"
    echo "  Prometheus: http://localhost:9090"
    echo ""
    echo -e "${CYAN}登录信息:${NC}"
    echo "  数据库用户: yyc_admin / YYC3@Secure2025!"
    echo "  Grafana用户: admin / Admin@2025!"
    echo "  pgAdmin用户: admin@0379.email / Admin@2025!"
    echo ""
    echo -e "${CYAN}NAS存储路径:${NC}"
    echo "  数据目录: /nas/data/postgres/"
    echo "  日志目录: /nas/logs/postgres/"
    echo "  备份目录: /nas/backup/postgres/"
    echo ""
}

# 主函数
main() {
    show_header

    log_info "开始PostgreSQL NAS集成部署..."

    check_environment
    create_directories
    generate_configs
    deploy_services
    verify_deployment
    show_access_info

    log_success "PostgreSQL NAS集成部署完成！"
    echo ""
    echo -e "${GREEN}🎉 基于'五高五标五化'核心理念的PostgreSQL集群已成功部署！${NC}"
    echo ""
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"