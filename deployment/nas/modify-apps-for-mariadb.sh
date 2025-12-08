#!/bin/bash

# 修改应用配置以使用MariaDB/MySQL
# 适用于NAS上已有MariaDB的情况

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 修改应用配置以使用MariaDB/MySQL${NC}"
echo "=================================="

# MariaDB连接信息（请根据实际情况修改）
NAS_MARIADB_HOST="localhost"
NAS_MARIADB_PORT="3306"
NAS_MARIADB_USER="root"
NAS_MARIADB_PASSWORD="your_mariadb_password"

# 检查MariaDB连接
echo -e "${BLUE}🔍 测试MariaDB连接...${NC}"
if mysql -h$NAS_MARIADB_HOST -P$NAS_MARIADB_PORT -u$NAS_MARIADB_USER -p$NAS_MARIADB_PASSWORD -e "SELECT VERSION();" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ MariaDB连接成功${NC}"
else
    echo -e "${RED}❌ MariaDB连接失败，请检查连接信息${NC}"
    exit 1
fi

# 创建数据库和用户
echo -e "${BLUE}🏗️ 创建数据库和用户...${NC}"
mysql -h$NAS_MARIADB_HOST -P$NAS_MARIADB_PORT -u$NAS_MARIADB_USER -p$NAS_MARIADB_PASSWORD << 'EOF'

-- 创建应用数据库
CREATE DATABASE IF NOT EXISTS ai_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS future_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS kanban_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS status_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS api_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS grafana_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户
CREATE USER IF NOT EXISTS 'ai_app'@'%' IDENTIFIED BY 'ai_app_mariadb_2024';
CREATE USER IF NOT EXISTS 'future_app'@'%' IDENTIFIED BY 'future_app_mariadb_2024';
CREATE USER IF NOT EXISTS 'kanban_app'@'%' IDENTIFIED BY 'kanban_app_mariadb_2024';
CREATE USER IF NOT EXISTS 'monitor_app'@'%' IDENTIFIED BY 'monitor_app_mariadb_2024';
CREATE USER IF NOT EXISTS 'api_app'@'%' IDENTIFIED BY 'api_app_mariadb_2024';
CREATE USER IF NOT EXISTS 'grafana_app'@'%' IDENTIFIED BY 'grafana_app_mariadb_2024';

-- 授权
GRANT ALL PRIVILEGES ON ai_dashboard.* TO 'ai_app'@'%';
GRANT ALL PRIVILEGES ON future_dashboard.* TO 'future_app'@'%';
GRANT ALL PRIVILEGES ON kanban_board.* TO 'kanban_app'@'%';
GRANT ALL PRIVILEGES ON status_monitor.* TO 'monitor_app'@'%';
GRANT ALL PRIVILEGES ON api_gateway.* TO 'api_app'@'%';
GRANT ALL PRIVILEGES ON grafana_monitoring.* TO 'grafana_app'@'%';

FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✅ 数据库和用户创建完成${NC}"

# 为每个子域名创建MariaDB配置
create_mariadb_configs() {
    echo -e "${BLUE}📝 创建MariaDB配置文件...${NC}"

    SUBDOMAINS_BASE="/Users/yanyu/www/subdomains"

    # AI配置
    cat > $SUBDOMAINS_BASE/ai.yanyu.work/.env.mariadb << EOF
# AI Assistant - MariaDB Configuration
NODE_ENV=development
DOMAIN=ai.yanyu.work
PORT=3000

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=ai_dashboard
DATABASE_USER=ai_app
DATABASE_PASSWORD=ai_app_mariadb_2024

# 完整连接字符串
DATABASE_URL=mysql://ai_app:ai_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/ai_dashboard

# NAS Redis (如果已安装)
REDIS_URL=redis://localhost:6379

# AI Configuration
AI_API_KEY=your_openai_api_key_here
AI_MODEL_URL=https://api.openai.com/v1/chat/completions
MAX_CONCURRENT_USERS=100
SESSION_TIMEOUT=1800

# Security
JWT_SECRET=ai_jwt_secret_mariadb_2024
EOF

    # Future配置
    cat > $SUBDOMAINS_BASE/future.yanyu.work/.env.mariadb << EOF
# Future Dashboard - MariaDB Configuration
NODE_ENV=development
DOMAIN=future.yanyu.work
PORT=3010

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=future_dashboard
DATABASE_USER=future_app
DATABASE_PASSWORD=future_app_mariadb_2024

DATABASE_URL=mysql://future_app:future_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/future_dashboard

# NAS Redis
REDIS_URL=redis://localhost:6379

# Dashboard Configuration
THEME=dark
REAL_TIME_UPDATES=true
DATA_RETENTION_DAYS=30
MAX_WIDGETS_PER_USER=50
ENABLE_AI_INSIGHTS=true

# WebSocket Configuration
WEBSOCKET_PORT=3011
EOF

    # Kanban配置
    cat > $SUBDOMAINS_BASE/kanban.yanyu.work/.env.mariadb << EOF
# Kanban Board - MariaDB Configuration
NODE_ENV=development
DOMAIN=kanban.yanyu.work
PORT=3002

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=kanban_board
DATABASE_USER=kanban_app
DATABASE_PASSWORD=kanban_app_mariadb_2024

DATABASE_URL=mysql://kanban_app:kanban_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/kanban_board

# MongoDB (如果需要)
MONGODB_URL=mongodb://localhost:27017/kanban_board

# NAS Redis
REDIS_URL=redis://localhost:6379

# Kanban Configuration
MAX_BOARDS_PER_USER=20
MAX_CARDS_PER_BOARD=500
ENABLE_REAL_TIME=true
FILE_UPLOAD_MAX_SIZE=10M
ALLOW_ANONYMOUS_VIEW=false
EOF

    # Monitor配置
    cat > $SUBDOMAINS_BASE/monitor.yanyu.work/.env.mariadb << EOF
# Status Monitor - MariaDB Configuration
NODE_ENV=development
DOMAIN=monitor.yanyu.work
PORT=3001

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=status_monitor
DATABASE_USER=monitor_app
DATABASE_PASSWORD=monitor_app_mariadb_2024

DATABASE_URL=mysql://monitor_app:monitor_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/status_monitor

# NAS Redis
REDIS_URL=redis://localhost:6379

# Monitoring Configuration
CHECK_INTERVAL=30
MONITOR_TARGETS=localhost,google.com,baidu.com

# Alert Configuration
ALERT_WEBHOOK=
ALERT_EMAIL=admin@yyc3.local
EOF

    # API配置
    cat > $SUBDOMAINS_BASE/api.yanyu.work/.env.mariadb << EOF
# API Gateway - MariaDB Configuration
NODE_ENV=development
DOMAIN=api.yanyu.work
PORT=5010

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=api_gateway
DATABASE_USER=api_app
DATABASE_PASSWORD=api_app_mariadb_2024

DATABASE_URL=mysql://api_app:api_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/api_gateway

# MongoDB (如果需要)
MONGODB_URL=mongodb://localhost:27017/api_cache

# NAS Redis
REDIS_URL=redis://localhost:6379

# API Configuration
JWT_SECRET=api_jwt_secret_mariadb_2024
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
ENABLE_SWAGGER=true
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Authentication Configuration
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5
EOF

    # Grafana配置
    cat > $SUBDOMAINS_BASE/grafana.yanyu.work/.env.mariadb << EOF
# Grafana - MariaDB Configuration
DOMAIN=grafana.yanyu.work
PORT=4000

# MariaDB Database
DATABASE_TYPE=mysql
DATABASE_HOST=$NAS_MARIADB_HOST
DATABASE_PORT=$NAS_MARIADB_PORT
DATABASE_NAME=grafana_monitoring
DATABASE_USER=grafana_app
DATABASE_PASSWORD=grafana_app_mariadb_2024

DATABASE_URL=mysql://grafana_app:grafana_app_mariadb_2024@$NAS_MARIADB_HOST:$NAS_MARIADB_PORT/grafana_monitoring

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=grafana_mariadb_admin_2024
GF_USERS_ALLOW_SIGN_UP=false
GF_SERVER_DOMAIN=grafana.yanyu.work
GF_SERVER_ROOT_URL=https://grafana.yanyu.work

# Session Configuration (如果使用Redis)
GF_SESSION_PROVIDER=redis
GF_SESSION_PROVIDER_CONFIG=addr=localhost:6379

# NAS Redis
REDIS_URL=redis://localhost:6379
EOF

    echo -e "${GREEN}✅ MariaDB配置文件已创建${NC}"
}

# 创建数据库初始化SQL
create_init_sql() {
    echo -e "${BLUE}🔧 创建数据库初始化SQL...${NC}"

    # AI数据库初始化
    cat > $SUBDOMAINS_BASE/ai.yanyu.work/init-mariadb.sql << 'EOF'
-- AI Dashboard数据库初始化
USE ai_dashboard;

CREATE TABLE IF NOT EXISTS config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    messages JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 插入初始数据
INSERT INTO config (key_name, value) VALUES
('version', '1.0.0'),
('initialized', 'true'),
('max_concurrent_users', '100')
ON DUPLICATE KEY UPDATE value = VALUES(value);
EOF

    # Future数据库初始化
    cat > $SUBDOMAINS_BASE/future.yanyu.work/init-mariadb.sql << 'EOF'
-- Future Dashboard数据库初始化
USE future_dashboard;

CREATE TABLE IF NOT EXISTS widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSON,
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 4,
    height INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS widget_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    config_schema JSON,
    default_config JSON
);

-- 插入默认小部件类型
INSERT INTO widget_types (name, description, config_schema) VALUES
('chart', '图表小部件', '{"title": "string", "type": "string", "data": "array"}'),
('metric', '指标小部件', '{"title": "string", "value": "number", "unit": "string"}'),
('table', '表格小部件', '{"title": "string", "columns": "array", "data": "array"}')
ON DUPLICATE KEY UPDATE description = VALUES(description);
EOF

    # Kanban数据库初始化
    cat > $SUBDOMAINS_BASE/kanban.yanyu.work/init-mariadb.sql << 'EOF'
-- Kanban Board数据库初始化
USE kanban_board;

CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    column_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT DEFAULT 0,
    assignee VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- 插入默认看板
INSERT INTO boards (name, description, is_public) VALUES
('Default Board', 'Default kanban board', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
EOF

    echo -e "${GREEN}✅ 数据库初始化SQL已创建${NC}"
}

# 创建环境切换脚本
create_env_switcher() {
    echo -e "${YELLOW}🔄 创建环境切换脚本...${NC}"

    SUBDOMAINS_BASE="/Users/yanyu/www/subdomains"

    cat > $SUBDOMAINS_BASE/switch-to-mariadb.sh << 'EOF'
#!/bin/bash

# 切换到MariaDB环境
echo "🔄 切换所有子域名到MariaDB..."

SUBDOMAINS=(
    "ai.yanyu.work"
    "future.yanyu.work"
    "kanban.yanyu.work"
    "monitor.yanyu.work"
    "api.yanyu.work"
    "grafana.yanyu.work"
)

for subdomain in "${SUBDOMAINS[@]}"; do
    if [ -f "$subdomain/.env.mariadb" ]; then
        echo "切换 $subdomain 到MariaDB..."
        cp "$subdomain/.env.mariadb" "$subdomain/.env"
        echo "✅ $subdomain 已切换"
    else
        echo "⚠️ $subdomain MariaDB配置不存在"
    fi
done

echo "🎉 所有子域名已切换到MariaDB"
echo "请重启所有应用以使用新的数据库连接"
EOF

    chmod +x $SUBDOMAINS_BASE/switch-to-mariadb.sh

    echo -e "  ${GREEN}✅ MariaDB环境切换脚本已创建${NC}"
}

# 主函数
main() {
    create_mariadb_configs
    create_init_sql
    create_env_switcher

    echo ""
    echo -e "${GREEN}🎉 MariaDB配置完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 已创建的文件:${NC}"
    echo "  - ai.yanyu.work/.env.mariadb"
    echo "  - future.yanyu.work/.env.mariadb"
    echo "  - kanban.yanyu.work/.env.mariadb"
    echo "  - monitor.yanyu.work/.env.mariadb"
    echo "  - api.yanyu.work/.env.mariadb"
    echo "  - grafana.yanyu.work/.env.mariadb"
    echo ""
    echo -e "${BLUE}📝 数据库初始化脚本:${NC}"
    echo "  - ai.yanyu.work/init-mariadb.sql"
    echo "  - future.yanyu.work/init-mariadb.sql"
    echo "  - kanban.yanyu.work/init-mariadb.sql"
    echo ""
    echo -e "${BLUE}🔧 下一步操作:${NC}"
    echo "1. 运行数据库初始化: mysql -u root -p < ai.yanyu.work/init-mariadb.sql"
    echo "2. 切换到MariaDB: ./subdomains/switch-to-mariadb.sh"
    echo "3. 重启应用服务"
    echo "4. 验证连接正常"
    echo ""
    echo -e "${GREEN}✨ 现在可以使用NAS上的MariaDB了！${NC}"
}

# 如果需要，请在脚本开头设置正确的密码
if [ "$NAS_MARIADB_PASSWORD" = "your_mariadb_password" ]; then
    echo -e "${YELLOW}⚠️ 请在脚本中设置正确的MariaDB root密码${NC}"
    echo "编辑变量: NAS_MARIADB_PASSWORD"
    exit 1
fi

# 运行主函数
main "$@"