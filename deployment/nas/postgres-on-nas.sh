#!/bin/bash

# YYC3-45 NAS PostgreSQL 部署脚本
# 在NAS上部署PostgreSQL服务，为自治子域名提供数据库支持

set -e

# 配置
NAS_USER="root"
NAS_HOST="yyc3-45"
NAS_DEPLOY_PATH="/opt/yyc3-databases"
LOCAL_NAS_PATH="/Users/yanyu/www/nas-deploy"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🗄️ YYC3-45 NAS PostgreSQL 部署${NC}"
echo "================================="
echo "NAS主机: $NAS_HOST"
echo "部署路径: $NAS_DEPLOY_PATH"
echo ""

# 检查SSH连接
check_ssh_connection() {
    echo -e "${BLUE}🔍 检查SSH连接...${NC}"
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $NAS_USER@$NAS_HOST "echo 'SSH连接成功'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH连接正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 无法连接到NAS: $NAS_HOST${NC}"
        echo "请确保："
        echo "1. NAS已开机并可访问"
        echo "2. SSH密钥已配置"
        echo "3. 用户$NAS_USER有SSH访问权限"
        exit 1
    fi
}

# 准备NAS目录结构
prepare_nas_directories() {
    echo -e "${BLUE}📁 准备NAS目录结构...${NC}"

    ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DEPLOY_PATH/{postgresql,data,config,logs,backups,init}"

    # 创建数据目录
    ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DEPLOY_PATH/data/{postgresql,redis,mongodb}"
    ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DEPLOY_PATH/logs/{postgresql,redis,mongodb}"
    ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DEPLOY_PATH/backups/{daily,weekly,monthly}"

    echo -e "${GREEN}✅ NAS目录结构创建完成${NC}"
}

# 创建NAS Docker Compose配置
create_nas_docker_compose() {
    echo -e "${BLUE}🐳 创建NAS Docker Compose配置...${NC}"

    cat << 'EOF' > /tmp/nas-docker-compose.yml
version: '3.8'

services:
  # PostgreSQL 主数据库
  postgres-primary:
    image: postgres:15-alpine
    container_name: nas-postgres-primary
    restart: unless-stopped
    environment:
      - POSTGRES_DB=yyc3_main
      - POSTGRES_USER=yyc3_admin
      - POSTGRES_PASSWORD=yyc3_nas_admin_2024
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - ./data/postgresql:/var/lib/postgresql/data
      - ./config/postgresql/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./config/postgresql/pg_hba.conf:/etc/postgresql/pg_hba.conf
      - ./init:/docker-entrypoint-initdb.d
      - ./logs/postgresql:/var/log/postgresql
    networks:
      - nas-network
    ports:
      - "5432:5432"
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U yyc3_admin -d yyc3_main"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 只读副本
  postgres-replica:
    image: postgres:15-alpine
    container_name: nas-postgres-replica
    restart: unless-stopped
    environment:
      - POSTGRES_MASTER_SERVICE=postgres-primary
      - POSTGRES_USER=yyc3_replica
      - POSTGRES_PASSWORD=yyc3_nas_replica_2024
      - POSTGRES_DB=yyc3_replica
      - PGUSER=postgres
    volumes:
      - ./data/postgresql-replica:/var/lib/postgresql/data
      - ./logs/postgresql-replica:/var/log/postgresql
    networks:
      - nas-network
    ports:
      - "5433:5432"
    depends_on:
      - postgres-primary
    command: |
      bash -c "
      if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
        pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U replication -v -P -W
        echo 'standby_mode = on' >> /var/lib/postgresql/data/recovery.conf
        echo 'primary_conninfo = ''host=postgres-primary port=5432 user=replication''' >> /var/lib/postgresql/data/recovery.conf
      fi
      postgres
      "

  # Redis 缓存
  redis-primary:
    image: redis:7-alpine
    container_name: nas-redis-primary
    restart: unless-stopped
    command: redis-server /etc/redis/redis.conf --appendonly yes --requirepass yyc3_nas_redis_2024
    volumes:
      - ./data/redis:/data
      - ./config/redis/redis.conf:/etc/redis/redis.conf
      - ./logs/redis:/var/log/redis
    networks:
      - nas-network
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis 副本
  redis-replica:
    image: redis:7-alpine
    container_name: nas-redis-replica
    restart: unless-stopped
    command: redis-server /etc/redis/redis.conf --appendonly yes --requirepass yyc3_nas_redis_2024 --replicaof redis-primary 6379
    volumes:
      - ./data/redis-replica:/data
      - ./config/redis/redis-replica.conf:/etc/redis/redis.conf
      - ./logs/redis-replica:/var/log/redis
    networks:
      - nas-network
    ports:
      - "6380:6379"
    depends_on:
      - redis-primary

  # MongoDB
  mongodb:
    image: mongo:7
    container_name: nas-mongodb
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=yyc3_mongo_admin
      - MONGO_INITDB_ROOT_PASSWORD=yyc3_nas_mongo_2024
      - MONGO_INITDB_DATABASE=yyc3_mongo_main
    volumes:
      - ./data/mongodb:/data/db
      - ./init/mongo-init:/docker-entrypoint-initdb.d
      - ./logs/mongodb:/var/log/mongodb
    networks:
      - nas-network
    ports:
      - "27017:27017"
    command: mongod --auth --replSet rs0

  # PgAdmin (Web管理界面)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: nas-pgadmin
    restart: unless-stopped
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@yyc3.local
      - PGADMIN_DEFAULT_PASSWORD=yyc3_pgadmin_2024
    volumes:
      - ./data/pgadmin:/var/lib/pgadmin
    networks:
      - nas-network
    ports:
      - "5050:80"
    depends_on:
      - postgres-primary

  # Redis Commander (Redis管理界面)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: nas-redis-commander
    restart: unless-stopped
    environment:
      - REDIS_HOSTS=local:nas-redis-primary:6379:0:yyc3_nas_redis_2024
    networks:
      - nas-network
    ports:
      - "8081:8081"
    depends_on:
      - redis-primary

  # MongoDB Express (Mongo管理界面)
  mongo-express:
    image: mongo-express:latest
    container_name: nas-mongo-express
    restart: unless-stopped
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=yyc3_mongo_admin
      - ME_CONFIG_MONGODB_ADMINPASSWORD=yyc3_nas_mongo_2024
      - ME_CONFIG_MONGODB_URL=mongodb://yyc3_mongo_admin:yyc3_nas_mongo_2024@mongodb:27017/
    networks:
      - nas-network
    ports:
      - "8082:8081"
    depends_on:
      - mongodb

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  mongodb_data:
    driver: local

networks:
  nas-network:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.100.0/24
EOF

    # 上传Docker Compose配置
    scp /tmp/nas-docker-compose.yml $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/docker-compose.yml

    echo -e "${GREEN}✅ NAS Docker Compose配置已创建${NC}"
}

# 创建数据库初始化脚本
create_database_init_scripts() {
    echo -e "${BLUE}🔧 创建数据库初始化脚本...${NC}"

    # PostgreSQL初始化脚本
    cat << 'EOF' > /tmp/init-postgres.sql
-- 创建自治子域名数据库
CREATE DATABASE ai_dashboard;
CREATE DATABASE future_dashboard;
CREATE DATABASE kanban_board;
CREATE DATABASE status_monitor;
CREATE DATABASE api_gateway;
CREATE DATABASE grafana_monitoring;
CREATE DATABASE yyc3_main;

-- 创建应用用户
CREATE USER ai_app WITH PASSWORD 'ai_app_2024';
CREATE USER future_app WITH PASSWORD 'future_app_2024';
CREATE USER kanban_app WITH PASSWORD 'kanban_app_2024';
CREATE USER monitor_app WITH PASSWORD 'monitor_app_2024';
CREATE USER api_app WITH PASSWORD 'api_app_2024';
CREATE USER grafana_app WITH PASSWORD 'grafana_app_2024';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ai_dashboard TO ai_app;
GRANT ALL PRIVILEGES ON DATABASE future_dashboard TO future_app;
GRANT ALL PRIVILEGES ON DATABASE kanban_board TO kanban_app;
GRANT ALL PRIVILEGES ON DATABASE status_monitor TO monitor_app;
GRANT ALL PRIVILEGES ON DATABASE api_gateway TO api_app;
GRANT ALL PRIVILEGES ON DATABASE grafana_monitoring TO grafana_app;

-- 创建复制用户
CREATE USER replication WITH REPLICATION ENCRYPTED PASSWORD 'replication_2024';
GRANT CONNECT ON DATABASE yyc3_main TO replication;

-- 初始化一些基础表
\c ai_dashboard;
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW());
INSERT INTO config (key, value) VALUES ('version', '1.0.0'), ('initialized', 'true');

\c future_dashboard;
CREATE TABLE IF NOT EXISTS widgets (id SERIAL PRIMARY KEY, name TEXT, type TEXT, config JSONB, created_at TIMESTAMP DEFAULT NOW());

\c kanban_board;
CREATE TABLE IF NOT EXISTS boards (id SERIAL PRIMARY KEY, name TEXT, description TEXT, created_at TIMESTAMP DEFAULT NOW());

\c status_monitor;
CREATE TABLE IF NOT EXISTS checks (id SERIAL PRIMARY KEY, name TEXT, url TEXT, status TEXT, last_check TIMESTAMP DEFAULT NOW());

\c api_gateway;
CREATE TABLE IF NOT EXISTS api_keys (id SERIAL PRIMARY KEY, key_hash TEXT, name TEXT, permissions JSONB, created_at TIMESTAMP DEFAULT NOW());

\c grafana_monitoring;
CREATE TABLE IF NOT EXISTS dashboards (id SERIAL PRIMARY KEY, title TEXT, config JSONB, created_at TIMESTAMP DEFAULT NOW());
EOF

    # MongoDB初始化脚本
    cat << 'EOF' > /tmp/init-mongo.js
// MongoDB初始化脚本
db = db.getSiblingDB('kanban_board');

db.createCollection('boards');
db.createCollection('cards');
db.createCollection('users');

// 插入初始数据
db.boards.insertOne({
    name: 'default',
    description: 'Default kanban board',
    created: new Date(),
    columns: ['To Do', 'In Progress', 'Done']
});

db = db.getSiblingDB('api_cache');

db.createCollection('cache');
db.createCollection('sessions');

// 创建索引
db.cache.createIndex({ key: 1 }, { unique: true });
db.cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
EOF

    # 创建本地目录并上传脚本
    mkdir -p $LOCAL_NAS_PATH/init
    cp /tmp/init-postgres.sql $LOCAL_NAS_PATH/init/
    cp /tmp/init-mongo.js $LOCAL_NAS_PATH/init/

    # 上传到NAS
    scp -r $LOCAL_NAS_PATH/init/* $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/init/

    echo -e "${GREEN}✅ 数据库初始化脚本已创建${NC}"
}

# 创建配置文件
create_config_files() {
    echo -e "${BLUE}⚙️ 创建配置文件...${NC}"

    # PostgreSQL配置
    cat << 'EOF' > /tmp/postgresql.conf
# PostgreSQL配置文件
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
shared_preload_libraries = 'pg_stat_statements'
track_activity_query_size = 2048
pg_stat_statements.track = all
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
EOF

    # PostgreSQL访问控制
    cat << 'EOF' > /tmp/pg_hba.conf
# PostgreSQL访问控制配置
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5
host    replication     replication     0.0.0.0/0               md5
host    all             all             ::/0                    md5
EOF

    # Redis配置
    cat << 'EOF' > /tmp/redis.conf
# Redis配置文件
bind 0.0.0.0
port 6379
timeout 0
keepalive 300
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
EOF

    # 创建配置目录并上传
    ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DEPLOY_PATH/config/{postgresql,redis}"

    scp /tmp/postgresql.conf $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/config/postgresql/
    scp /tmp/pg_hba.conf $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/config/postgresql/
    scp /tmp/redis.conf $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/config/redis/
    scp /tmp/redis.conf $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/config/redis/redis-replica.conf

    echo -e "${GREEN}✅ 配置文件已创建${NC}"
}

# 创建备份脚本
create_backup_scripts() {
    echo -e "${BLUE}💾 创建备份脚本...${NC}"

    cat << 'EOF' > /tmp/nas-backup.sh
#!/bin/bash

# NAS数据库备份脚本
BACKUP_DIR="/opt/yyc3-databases/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL备份
echo "开始PostgreSQL备份..."
docker exec nas-postgres-primary pg_dumpall -U yyc3_admin > $BACKUP_DIR/daily/postgres_full_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/daily/postgres_full_$DATE.sql

# MongoDB备份
echo "开始MongoDB备份..."
docker exec nas-mongodb mongodump --out $BACKUP_DIR/daily/mongodb_$DATE --gzip

# Redis备份
echo "开始Redis备份..."
docker exec nas-redis-primary redis-cli BGSAVE
docker cp nas-redis-primary:/data/dump.rdb $BACKUP_DIR/daily/redis_$DATE.rdb

# 清理旧备份（保留7天）
find $BACKUP_DIR/daily -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR/daily -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR/daily -name "mongodb_*" -mtime +7 -exec rm -rf {} +

echo "备份完成: $DATE"
EOF

    # 上传备份脚本
    scp /tmp/nas-backup.sh $NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/backup.sh
    ssh $NAS_USER@$NAS_HOST "chmod +x $NAS_DEPLOY_PATH/backup.sh"

    # 设置定时备份
    ssh $NAS_USER@$NAS_HOST "(crontab -l 2>/dev/null; echo '0 2 * * * $NAS_DEPLOY_PATH/backup.sh') | crontab -"

    echo -e "${GREEN}✅ 备份脚本已创建并设置定时任务${NC}"
}

# 部署并启动服务
deploy_and_start() {
    echo -e "${BLUE}🚀 部署并启动NAS数据库服务...${NC}"

    # 检查Docker是否安装
    if ! ssh $NAS_USER@$NAS_HOST "command -v docker" >/dev/null 2>&1; then
        echo -e "${YELLOW}📦 Docker未安装，正在安装...${NC}"
        ssh $NAS_USER@$NAS_HOST << 'EOF'
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
usermod -aG docker root
rm get-docker.sh
EOF
    fi

    # 检查Docker Compose是否安装
    if ! ssh $NAS_USER@$NAS_HOST "command -v docker-compose" >/dev/null 2>&1; then
        echo -e "${YELLOW}📦 Docker Compose未安装，正在安装...${NC}"
        ssh $NAS_USER@$NAS_HOST << 'EOF'
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
EOF
    fi

    # 启动服务
    ssh $NAS_USER@$NAS_HOST "cd $NAS_DEPLOY_PATH && docker-compose down"
    ssh $NAS_USER@$NAS_HOST "cd $NAS_DEPLOY_PATH && docker-compose up -d"

    # 等待服务启动
    echo -e "${BLUE}⏳ 等待服务启动...${NC}"
    sleep 30

    # 检查服务状态
    echo -e "${BLUE}🔍 检查服务状态...${NC}"
    ssh $NAS_USER@$NAS_HOST "cd $NAS_DEPLOY_PATH && docker-compose ps"
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}✅ 验证NAS部署...${NC}"

    # 检查PostgreSQL
    if ssh $NAS_USER@$NAS_HOST "docker exec nas-postgres-primary pg_isready -U yyc3_admin" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL 运行正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL 启动失败${NC}"
    fi

    # 检查Redis
    if ssh $NAS_USER@$NAS_HOST "docker exec nas-redis-primary redis-cli ping" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis 运行正常${NC}"
    else
        echo -e "${RED}❌ Redis 启动失败${NC}"
    fi

    # 检查MongoDB
    if ssh $NAS_USER@$NAS_HOST "docker exec nas-mongodb mongo --eval 'db.runCommand({ping: 1})'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 运行正常${NC}"
    else
        echo -e "${RED}❌ MongoDB 启动失败${NC}"
    fi
}

# 创建连接配置
create_connection_configs() {
    echo -e "${BLUE}🔗 创建应用连接配置...${NC}"

    # 获取NAS IP地址
    NAS_IP=$(ssh $NAS_USER@$NAS_HOST "hostname -I | awk '{print \$1}'")

    cat << EOF > $LOCAL_NAS_PATH/nas-connection.env
# NAS数据库连接配置
NAS_HOST=$NAS_IP
NAS_POSTGRES_HOST=$NAS_IP
NAS_POSTGRES_PORT=5432
NAS_POSTGRES_USER=yyc3_admin
NAS_POSTGRES_PASSWORD=yyc3_nas_admin_2024
NAS_POSTGRES_REPLICA_HOST=$NAS_IP
NAS_POSTGRES_REPLICA_PORT=5433

# Redis配置
NAS_REDIS_HOST=$NAS_IP
NAS_REDIS_PORT=6379
NAS_REDIS_PASSWORD=yyc3_nas_redis_2024

# MongoDB配置
NAS_MONGODB_HOST=$NAS_IP
NAS_MONGODB_PORT=27017
NAS_MONGODB_USER=yyc3_mongo_admin
NAS_MONGODB_PASSWORD=yyc3_nas_mongo_2024

# 管理界面
NAS_PGADMIN_URL=http://$NAS_IP:5050
NAS_REDIS_COMMANDER_URL=http://$NAS_IP:8081
NAS_MONGO_EXPRESS_URL=http://$NAS_IP:8082

# 应用数据库连接字符串
AI_DATABASE_URL=postgresql://ai_app:ai_app_2024@$NAS_IP:5432/ai_dashboard
FUTURE_DATABASE_URL=postgresql://future_app:future_app_2024@$NAS_IP:5432/future_dashboard
KANBAN_DATABASE_URL=postgresql://kanban_app:kanban_app_2024@$NAS_IP:5432/kanban_board
MONITOR_DATABASE_URL=postgresql://monitor_app:monitor_app_2024@$NAS_IP:5432/status_monitor
API_DATABASE_URL=postgresql://api_app:api_app_2024@$NAS_IP:5432/api_gateway
GRAFANA_DATABASE_URL=postgresql://grafana_app:grafana_app_2024@$NAS_IP:5432/grafana_monitoring

# MongoDB连接
KANBAN_MONGODB_URL=mongodb://yyc3_mongo_admin:yyc3_nas_mongo_2024@$NAS_IP:27017/kanban_board
API_MONGODB_URL=mongodb://yyc3_mongo_admin:yyc3_nas_mongo_2024@$NAS_IP:27017/api_cache
EOF

    echo -e "${GREEN}✅ 连接配置已创建: $LOCAL_NAS_PATH/nas-connection.env${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}🎯 开始在NAS (yyc3-45) 上部署PostgreSQL...${NC}"

    # 创建本地目录
    mkdir -p $LOCAL_NAS_PATH

    check_ssh_connection
    prepare_nas_directories
    create_nas_docker_compose
    create_database_init_scripts
    create_config_files
    create_backup_scripts
    deploy_and_start
    verify_deployment
    create_connection_configs

    echo ""
    echo -e "${GREEN}🎉 NAS PostgreSQL部署完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 NAS服务信息:${NC}"
    source $LOCAL_NAS_PATH/nas-connection.env
    echo -e "🐘 PostgreSQL 主库: ${GREEN}postgresql://$NAS_POSTGRES_USER:$NAS_POSTGRES_PASSWORD@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/yyc3_main${NC}"
    echo -e "🐘 PostgreSQL 副本: ${GREEN}postgresql://$NAS_POSTGRES_USER:$NAS_POSTGRES_PASSWORD@$NAS_POSTGRES_REPLICA_HOST:$NAS_POSTGRES_REPLICA_PORT/yyc3_main${NC}"
    echo -e "🔴 Redis: ${GREEN}redis://$NAS_REDIS_HOST:$NAS_REDIS_PORT${NC}"
    echo -e "🍃 MongoDB: ${GREEN}mongodb://$NAS_MONGODB_USER:$NAS_MONGODB_PASSWORD@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT${NC}"
    echo ""
    echo -e "${BLUE}🖥️ 管理界面:${NC}"
    echo -e "📊 PgAdmin: ${GREEN}$NAS_PGADMIN_URL${NC} (admin@yyc3.local / yyc3_pgadmin_2024)"
    echo -e "🔴 Redis Commander: ${GREEN}$NAS_REDIS_COMMANDER_URL${NC}"
    echo -e "🍃 MongoDB Express: ${GREEN}$NAS_MONGO_EXPRESS_URL${NC}"
    echo ""
    echo -e "${BLUE}📝 下一步:${NC}"
    echo "1. 更新本地应用的数据库连接配置"
    echo "2. 测试NAS数据库连接"
    echo "3. 配置数据同步策略（如需要）"
    echo "4. 设置监控和告警"
    echo ""
    echo -e "${GREEN}✨ NAS数据库服务已就绪！${NC}"
}

# 运行主函数
main "$@"