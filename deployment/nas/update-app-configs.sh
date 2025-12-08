#!/bin/bash

# 更新自治子域名应用配置以使用NAS数据库
# 将本地应用的数据库连接指向NAS上的数据库服务

set -e

# 配置
NAS_ENV_FILE="/Users/yanyu/www/nas-deploy/nas-connection.env"
SUBDOMAINS_BASE="/Users/yanyu/www/subdomains"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 更新应用配置以使用NAS数据库${NC}"
echo "================================="

# 检查NAS环境文件是否存在
if [ ! -f "$NAS_ENV_FILE" ]; then
    echo -e "${RED}❌ NAS连接配置文件不存在: $NAS_ENV_FILE${NC}"
    echo "请先运行: ./postgres-on-nas.sh"
    exit 1
fi

# 加载NAS配置
source $NAS_ENV_FILE

echo -e "${BLUE}📋 NAS配置信息:${NC}"
echo -e "NAS Host: ${GREEN}$NAS_HOST${NC}"
echo -e "PostgreSQL: ${GREEN}postgresql://$NAS_POSTGRES_USER:****@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT${NC}"
echo -e "Redis: ${GREEN}redis://$NAS_REDIS_HOST:$NAS_REDIS_PORT${NC}"
echo -e "MongoDB: ${GREEN}mongodb://$NAS_MONGODB_HOST:$NAS_MONGODB_PORT${NC}"
echo ""

# 更新AI子域名配置
update_ai_config() {
    echo -e "${YELLOW}🤖 更新AI Assistant配置...${NC}"

    cat > $SUBDOMAINS_BASE/ai.yanyu.work/.env.nas << EOF
# AI Assistant - NAS Database Configuration
NODE_ENV=development
DOMAIN=ai.yanyu.work
PORT=3000

# NAS PostgreSQL Database
DATABASE_URL=postgresql://ai_app:ai_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/ai_dashboard

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# AI Configuration
AI_API_KEY=your_openai_api_key_here
AI_MODEL_URL=https://api.openai.com/v1/chat/completions
MAX_CONCURRENT_USERS=100
SESSION_TIMEOUT=1800

# Security
JWT_SECRET=ai_jwt_secret_nas_2024_random_string

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true
EOF

    echo -e "  ${GREEN}✅ AI Assistant配置已更新${NC}"
}

# 更新Future子域名配置
update_future_config() {
    echo -e "${YELLOW}🚀 更新Future Dashboard配置...${NC}"

    cat > $SUBDOMAINS_BASE/future.yanyu.work/.env.nas << EOF
# Future Dashboard - NAS Database Configuration
NODE_ENV=development
DOMAIN=future.yanyu.work
PORT=3010

# NAS PostgreSQL Database
DATABASE_URL=postgresql://future_app:future_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/future_dashboard

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# Dashboard Configuration
THEME=dark
REAL_TIME_UPDATES=true
DATA_RETENTION_DAYS=30
MAX_WIDGETS_PER_USER=50
ENABLE_AI_INSIGHTS=true

# WebSocket Configuration
WEBSOCKET_PORT=3011
WEBSOCKET_HOST=0.0.0.0

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true
EOF

    echo -e "  ${GREEN}✅ Future Dashboard配置已更新${NC}"
}

# 更新Kanban子域名配置
update_kanban_config() {
    echo -e "${YELLOW}📋 更新Kanban Board配置...${NC}"

    cat > $SUBDOMAINS_BASE/kanban.yanyu.work/.env.nas << EOF
# Kanban Board - NAS Database Configuration
NODE_ENV=development
DOMAIN=kanban.yanyu.work
PORT=3002

# NAS PostgreSQL (可选，主要使用MongoDB)
DATABASE_URL=postgresql://kanban_app:kanban_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/kanban_board

# NAS MongoDB
MONGODB_URL=mongodb://yyc3_mongo_admin:$NAS_MONGODB_PASSWORD@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT/kanban_board

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# Kanban Configuration
MAX_BOARDS_PER_USER=20
MAX_CARDS_PER_BOARD=500
ENABLE_REAL_TIME=true
FILE_UPLOAD_MAX_SIZE=10M
ALLOW_ANONYMOUS_VIEW=false

# File Server Configuration
FILE_SERVER_PORT=8080
FILE_SERVER_HOST=0.0.0.0
UPLOAD_DIR=./uploads

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true
EOF

    echo -e "  ${GREEN}✅ Kanban Board配置已更新${NC}"
}

# 更新Monitor子域名配置
update_monitor_config() {
    echo -e "${YELLOW}📊 更新Status Monitor配置...${NC}"

    cat > $SUBDOMAINS_BASE/monitor.yanyu.work/.env.nas << EOF
# Status Monitor - NAS Database Configuration
NODE_ENV=development
DOMAIN=monitor.yanyu.work
PORT=3001

# NAS PostgreSQL Database
DATABASE_URL=postgresql://monitor_app:monitor_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/status_monitor

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# InfluxDB (如果本地部署或使用NAS上的InfluxDB)
INFLUXDB_URL=http://$NAS_HOST:8086
INFLUXDB_TOKEN=monitor_influx_token_2024
INFLUXDB_ORG=yyc3
INFLUXDB_BUCKET=system_metrics

# Monitoring Configuration
CHECK_INTERVAL=30
MONITOR_TARGETS=$NAS_HOST,localhost,google.com,baidu.com
MONITOR_SUBNETS=192.168.100.0/24

# Alert Configuration
ALERT_WEBHOOK=$NAS_WEBHOOK_URL
ALERT_EMAIL=admin@yyc3.local

# Prometheus Configuration
PROMETHEUS_URL=http://$NAS_HOST:9090
PROMETHEUS_RETENTION=7d

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true
EOF

    echo -e "  ${GREEN}✅ Status Monitor配置已更新${NC}"
}

# 更新API子域名配置
update_api_config() {
    echo -e "${YELLOW}🔧 更新API Gateway配置...${NC}"

    cat > $SUBDOMAINS_BASE/api.yanyu.work/.env.nas << EOF
# API Gateway - NAS Database Configuration
NODE_ENV=development
DOMAIN=api.yanyu.work
PORT=5010

# NAS PostgreSQL Database
DATABASE_URL=postgresql://api_app:api_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/api_gateway

# NAS MongoDB
MONGODB_URL=mongodb://yyc3_mongo_admin:$NAS_MONGODB_PASSWORD@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT/api_cache

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# API Configuration
JWT_SECRET=api_jwt_secret_nas_2024_random_string
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
ENABLE_SWAGGER=true
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://$NAS_HOST:*

# Authentication Configuration
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5
PASSWORD_MIN_LENGTH=8

# API Service Configuration
API_TIMEOUT=30000
MAX_FILE_SIZE=50MB
ENABLE_COMPRESSION=true

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true

# Service Discovery
AI_SERVICE_URL=http://ai.yanyu.work:3000
FUTURE_SERVICE_URL=http://future.yanyu.work:3010
KANBAN_SERVICE_URL=http://kanban.yanyu.work:3002
MONITOR_SERVICE_URL=http://monitor.yanyu.work:3001
EOF

    echo -e "  ${GREEN}✅ API Gateway配置已更新${NC}"
}

# 更新Grafana子域名配置
update_grafana_config() {
    echo -e "${YELLOW}📈 更新Grafana配置...${NC}"

    cat > $SUBDOMAINS_BASE/grafana.yanyu.work/.env.nas << EOF
# Grafana - NAS Database Configuration
DOMAIN=grafana.yanyu.work
PORT=4000

# NAS PostgreSQL Database (Grafana使用)
DATABASE_URL=postgresql://grafana_app:grafana_app_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/grafana_monitoring

# NAS Redis
REDIS_URL=redis://:$NAS_REDIS_PASSWORD@$NAS_REDIS_HOST:$NAS_REDIS_PORT
REDIS_PASSWORD=$NAS_REDIS_PASSWORD

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=grafana_nas_admin_2024
GF_USERS_ALLOW_SIGN_UP=false
GF_SERVER_DOMAIN=grafana.yanyu.work
GF_SERVER_ROOT_URL=https://grafana.yanyu.work
GF_FEATURE_TOGGLES_ENABLE=publicDashboards

# Database Configuration
GF_DATABASE_TYPE=postgres
GF_DATABASE_HOST=$NAS_POSTGRES_HOST
GF_DATABASE_PORT=$NAS_POSTGRES_PORT
GF_DATABASE_NAME=grafana_monitoring
GF_DATABASE_USER=grafana_app
GF_DATABASE_PASSWORD=grafana_app_2024

# Session Configuration
GF_SESSION_PROVIDER=redis
GF_SESSION_PROVIDER_CONFIG=addr=$NAS_REDIS_HOST:$NAS_REDIS_PORT,password=$NAS_REDIS_PASSWORD,db=0

# SMTP Configuration (可选)
GF_SMTP_ENABLED=false
GF_SMTP_HOST=
GF_SMTP_USER=
GF_SMTP_PASSWORD=

# Alerting Configuration
GF_ALERTING_ENABLED=true
GF_ALERTING_EXECUTE_ALERTS=true

# NAS Connection Info
NAS_HOST=$NAS_HOST
NAS_DATABASE_SERVER=true

# External Datasources
POSTGRES_DATASOURCE_URL=postgresql://yyc3_admin:yyc3_nas_admin_2024@$NAS_POSTGRES_HOST:$NAS_POSTGRES_PORT/yyc3_main
MONGODB_DATASOURCE_URL=mongodb://yyc3_mongo_admin:yyc3_nas_mongo_2024@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT/
EOF

    echo -e "  ${GREEN}✅ Grafana配置已更新${NC}"
}

# 创建统一的环境切换脚本
create_env_switcher() {
    echo -e "${YELLOW}🔄 创建环境切换脚本...${NC}"

    cat > $SUBDOMAINS_BASE/switch-to-nas-databases.sh << 'EOF'
#!/bin/bash

# 切换到NAS数据库环境
echo "🔄 切换所有子域名到NAS数据库..."

SUBDOMAINS=(
    "ai.yanyu.work"
    "future.yanyu.work"
    "kanban.yanyu.work"
    "monitor.yanyu.work"
    "api.yanyu.work"
    "grafana.yanyu.work"
)

for subdomain in "${SUBDOMAINS[@]}"; do
    if [ -f "$subdomain/.env.nas" ]; then
        echo "切换 $subdomain 到NAS数据库..."
        cp "$subdomain/.env.nas" "$subdomain/.env"
        echo "✅ $subdomain 已切换"
    else
        echo "⚠️ $subdomain NAS配置不存在"
    fi
done

echo "🎉 所有子域名已切换到NAS数据库"
echo "请重启所有应用以使用新的数据库连接"
EOF

    cat > $SUBDOMAINS_BASE/switch-to-local-databases.sh << 'EOF'
#!/bin/bash

# 切换回本地数据库环境
echo "🔄 切换所有子域名到本地数据库..."

SUBDOMAINS=(
    "ai.yanyu.work"
    "future.yanyu.work"
    "kanban.yanyu.work"
    "monitor.yanyu.work"
    "api.yanyu.work"
    "grafana.yanyu.work"
)

for subdomain in "${SUBDOMAINS[@]}"; do
    if [ -f "$subdomain/.env.local" ]; then
        echo "切换 $subdomain 到本地数据库..."
        cp "$subdomain/.env.local" "$subdomain/.env"
        echo "✅ $subdomain 已切换"
    elif [ -f "$subdomain/.env" ]; then
        echo "⚠️ $subdomain 本地配置不存在，跳过"
    fi
done

echo "🎉 所有子域名已切换到本地数据库"
echo "请重启所有应用以使用新的数据库连接"
EOF

    chmod +x $SUBDOMAINS_BASE/switch-to-nas-databases.sh
    chmod +x $SUBDOMAINS_BASE/switch-to-local-databases.sh

    echo -e "  ${GREEN}✅ 环境切换脚本已创建${NC}"
}

# 创建连接测试脚本
create_connection_test() {
    echo -e "${YELLOW}🧪 创建连接测试脚本...${NC}"

    cat > $SUBDOMAINS_BASE/test-nas-connection.sh << EOF
#!/bin/bash

# 测试NAS数据库连接
echo "🧪 测试NAS数据库连接..."

# 加载NAS配置
source $NAS_ENV_FILE

echo "测试PostgreSQL连接..."
if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD=$NAS_POSTGRES_PASSWORD psql -h $NAS_POSTGRES_HOST -p $NAS_POSTGRES_PORT -U $NAS_POSTGRES_USER -d yyc3_main -c "SELECT version();" >/dev/null 2>&1; then
        echo "✅ PostgreSQL连接成功"
    else
        echo "❌ PostgreSQL连接失败"
    fi
else
    echo "⚠️ psql未安装，跳过PostgreSQL测试"
fi

echo "测试Redis连接..."
if command -v redis-cli >/dev/null 2>&1; then
    if REDISCLI_AUTH=$NAS_REDIS_PASSWORD redis-cli -h $NAS_REDIS_HOST -p $NAS_REDIS_PORT ping >/dev/null 2>&1; then
        echo "✅ Redis连接成功"
    else
        echo "❌ Redis连接失败"
    fi
else
    echo "⚠️ redis-cli未安装，跳过Redis测试"
fi

echo "测试MongoDB连接..."
if command -v mongosh >/dev/null 2>&1; then
    if mongosh "mongodb://$NAS_MONGODB_USER:$NAS_MONGODB_PASSWORD@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT/admin" --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo "✅ MongoDB连接成功"
    else
        echo "❌ MongoDB连接失败"
    fi
elif command -v mongo >/dev/null 2>&1; then
    if mongo "mongodb://$NAS_MONGODB_USER:$NAS_MONGODB_PASSWORD@$NAS_MONGODB_HOST:$NAS_MONGODB_PORT/admin" --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo "✅ MongoDB连接成功"
    else
        echo "❌ MongoDB连接失败"
    fi
else
    echo "⚠️ MongoDB客户端未安装，跳过MongoDB测试"
fi

echo "测试Web管理界面..."
echo "PgAdmin: $NAS_PGADMIN_URL"
echo "Redis Commander: $NAS_REDIS_COMMANDER_URL"
echo "MongoDB Express: $NAS_MONGO_EXPRESS_URL"
EOF

    chmod +x $SUBDOMAINS_BASE/test-nas-connection.sh

    echo -e "  ${GREEN}✅ 连接测试脚本已创建${NC}"
}

# 主函数
main() {
    # 检查NAS配置是否可用
    if [ -z "$NAS_HOST" ]; then
        echo -e "${RED}❌ NAS配置未加载，请检查 $NAS_ENV_FILE${NC}"
        exit 1
    fi

    # 更新所有子域名配置
    update_ai_config
    update_future_config
    update_kanban_config
    update_monitor_config
    update_api_config
    update_grafana_config

    # 创建辅助脚本
    create_env_switcher
    create_connection_test

    echo ""
    echo -e "${GREEN}🎉 所有应用配置已更新为使用NAS数据库！${NC}"
    echo ""
    echo -e "${BLUE}📋 已更新的配置文件:${NC}"
    echo "  - ai.yanyu.work/.env.nas"
    echo "  - future.yanyu.work/.env.nas"
    echo "  - kanban.yanyu.work/.env.nas"
    echo "  - monitor.yanyu.work/.env.nas"
    echo "  - api.yanyu.work/.env.nas"
    echo "  - grafana.yanyu.work/.env.nas"
    echo ""
    echo -e "${BLUE}🔧 辅助脚本:${NC}"
    echo "  - switch-to-nas-databases.sh (切换到NAS数据库)"
    echo "  - switch-to-local-databases.sh (切换到本地数据库)"
    echo "  - test-nas-connection.sh (测试NAS连接)"
    echo ""
    echo -e "${BLUE}📝 下一步操作:${NC}"
    echo "1. 测试NAS数据库连接: ./test-nas-connection.sh"
    echo "2. 切换到NAS数据库: ./switch-to-nas-databases.sh"
    echo "3. 重启所有应用服务"
    echo "4. 验证应用正常运行"
    echo ""
    echo -e "${GREEN}✨ NAS数据库集成配置完成！${NC}"
}

# 运行主函数
main "$@"