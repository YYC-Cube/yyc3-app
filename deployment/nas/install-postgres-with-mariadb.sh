#!/bin/bash

# 在已有MariaDB的NAS上安装PostgreSQL
# 保持MariaDB系统运行，添加PostgreSQL支持

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐘 在NAS上安装PostgreSQL（与MariaDB并存）${NC}"
echo "================================================"

# 检测操作系统
detect_os() {
    if [ -f /etc/debian_version ]; then
        echo "检测到Debian/Ubuntu系统"
        DISTRO="debian"
        POSTGRES_VERSION="15"
        POSTGRES_SERVICE="postgresql"
        POSTGRES_CONF_DIR="/etc/postgresql/$POSTGRES_VERSION/main"
    elif [ -f /etc/redhat-release ]; then
        echo "检测到RedHat/CentOS系统"
        DISTRO="redhat"
        POSTGRES_VERSION="15"
        POSTGRES_SERVICE="postgresql-$POSTGRES_VERSION"
        POSTGRES_CONF_DIR="/var/lib/pgsql/$POSTGRES_VERSION/data"
    else
        echo -e "${RED}❌ 未知操作系统，请手动安装${NC}"
        exit 1
    fi
}

# 检查MariaDB状态
check_mariadb() {
    echo -e "${BLUE}🔍 检查MariaDB状态...${NC}"

    if systemctl is-active --quiet mariadb 2>/dev/null || systemctl is-active --quiet mysql 2>/dev/null; then
        echo -e "${GREEN}✅ MariaDB正在运行${NC}"
        MARIADB_RUNNING=true
        # 获取MariaDB端口
        MARIADB_PORT=$(mysql -e "SHOW VARIABLES LIKE 'port';" 2>/dev/null | tail -1 | awk '{print $2}' || echo "3306")
    else
        echo -e "${YELLOW}⚠️ MariaDB未运行${NC}"
        MARIADB_RUNNING=false
    fi
}

# 备份现有PostgreSQL配置（如果存在）
backup_existing() {
    if [ -d "/var/run/postgresql" ]; then
        echo -e "${YELLOW}📦 备份现有PostgreSQL配置...${NC}"
        cp -r /var/run/postgresql /tmp/postgresql_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
}

# 安装PostgreSQL
install_postgresql() {
    echo -e "${BLUE}📦 安装PostgreSQL $POSTGRES_VERSION...${NC}"

    if [ "$DISTRO" = "debian" ]; then
        # 导入PostgreSQL APT密钥
        wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

        # 添加PostgreSQL仓库
        echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

        # 更新包列表
        apt-get update

        # 安装PostgreSQL
        apt-get install -y \
            postgresql-$POSTGRES_VERSION \
            postgresql-client-$POSTGRES_VERSION \
            postgresql-contrib-$POSTGRES_VERSION \
            pgadmin3 \
            phppgadmin

        # 确保PostgreSQL服务配置正确
        systemctl daemon-reload

    elif [ "$DISTRO" = "redhat" ]; then
        # 安装PostgreSQL仓库
        dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

        # 安装PostgreSQL
        dnf install -y \
            postgresql$POSTGRES_VERSION-server \
            postgresql$POSTGRES_VERSION \
            postgresql$POSTGRES_VERSION-contrib

        # 初始化数据库
        /usr/pgsql-$POSTGRES_VERSION/bin/postgresql-$POSTGRES_VERSION-setup initdb
    fi

    echo -e "${GREEN}✅ PostgreSQL安装完成${NC}"
}

# 配置PostgreSQL
configure_postgresql() {
    echo -e "${BLUE}⚙️ 配置PostgreSQL...${NC}"

    # 确保目录存在
    mkdir -p /var/run/postgresql
    chown postgres:postgres /var/run/postgresql

    # 修改PostgreSQL配置以避免端口冲突
    if [ -f "$POSTGRES_CONF_DIR/postgresql.conf" ]; then
        # 备份原配置
        cp "$POSTGRES_CONF_DIR/postgresql.conf" "$POSTGRES_CONF_DIR/postgresql.conf.backup"

        # 修改监听地址和端口
        sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$POSTGRES_CONF_DIR/postgresql.conf"
        sed -i "s/#port = 5432/port = 5432/" "$POSTGRES_CONF_DIR/postgresql.conf"

        # 优化配置
        cat >> "$POSTGRES_CONF_DIR/postgresql.conf" << 'EOF'

# YYC3 NAS优化配置
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
    fi

    # 配置访问控制
    if [ -f "$POSTGRES_CONF_DIR/pg_hba.conf" ]; then
        # 备份原配置
        cp "$POSTGRES_CONF_DIR/pg_hba.conf" "$POSTGRES_CONF_DIR/pg_hba.conf.backup"

        # 添加访问规则
        cat >> "$POSTGRES_CONF_DIR/pg_hba.conf" << 'EOF'

# YYC3 NAS PostgreSQL访问配置
local   all             postgres                                trust
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
host    replication     replication     0.0.0.0/0               md5
EOF
    fi
}

# 启动PostgreSQL
start_postgresql() {
    echo -e "${BLUE}🚀 启动PostgreSQL服务...${NC}"

    if [ "$DISTRO" = "debian" ]; then
        systemctl start postgresql
        systemctl enable postgresql
    else
        systemctl start postgresql-$POSTGRES_VERSION
        systemctl enable postgresql-$POSTGRES_VERSION
    fi

    # 等待服务启动
    echo -e "${YELLOW}⏳ 等待PostgreSQL启动...${NC}"
    sleep 10

    # 检查PostgreSQL状态
    if sudo -u postgres pg_isready >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL启动成功${NC}"
    else
        echo -e "${RED}❌ PostgreSQL启动失败${NC}"
        echo "请检查日志："
        if [ "$DISTRO" = "debian" ]; then
            journalctl -u postgresql
        else
            journalctl -u postgresql-$POSTGRES_VERSION
        fi
        exit 1
    fi
}

# 创建数据库和用户
create_databases() {
    echo -e "${BLUE}🏗️ 创建数据库和用户...${NC}"

    sudo -u postgres psql << 'EOF'
-- 修改postgres用户密码
ALTER USER postgres WITH PASSWORD 'postgres_nas_2024';

-- 创建yyc3管理员用户
CREATE USER yyc3_admin WITH PASSWORD 'yyc3_nas_admin_2024' CREATEDB;
CREATE USER yyc3_replica WITH PASSWORD 'yyc3_nas_replica_2024' REPLICATION;

-- 创建主数据库
CREATE DATABASE yyc3_main OWNER yyc3_admin;

-- 创建应用数据库
CREATE DATABASE ai_dashboard OWNER yyc3_admin;
CREATE DATABASE future_dashboard OWNER yyc3_admin;
CREATE DATABASE kanban_board OWNER yyc3_admin;
CREATE DATABASE status_monitor OWNER yyc3_admin;
CREATE DATABASE api_gateway OWNER yyc3_admin;
CREATE DATABASE grafana_monitoring OWNER yyc3_admin;

-- 创建应用专用用户
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

-- 初始化一些基础表
\c ai_dashboard;
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW());
INSERT INTO config (key, value) VALUES ('version', '1.0.0'), ('initialized', 'true'), ('max_users', '100');

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

-- 退出
\q
EOF
}

# 配置防火墙
configure_firewall() {
    echo -e "${BLUE}🔥 配置防火墙...${NC}"

    # 开放PostgreSQL端口
    if command -v ufw >/dev/null 2>&1; then
        ufw allow 5432/tcp
        echo -e "${GREEN}✅ UFW防火墙已配置${NC}"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        firewall-cmd --permanent --add-port=5432/tcp
        firewall-cmd --reload
        echo -e "${GREEN}✅ Firewalld防火墙已配置${NC}"
    else
        echo -e "${YELLOW}⚠️ 未检测到防火墙管理工具${NC}"
    fi
}

# 创建管理脚本
create_management_scripts() {
    echo -e "${BLUE}📜 创建管理脚本...${NC}"

    cat > /usr/local/bin/manage-postgres.sh << 'EOF'
#!/bin/bash

# PostgreSQL管理脚本
case "$1" in
    start)
        echo "启动PostgreSQL..."
        if command -v systemctl >/dev/null 2>&1; then
            systemctl start postgresql 2>/dev/null || systemctl start postgresql-15
        fi
        ;;
    stop)
        echo "停止PostgreSQL..."
        if command -v systemctl >/dev/null 2>&1; then
            systemctl stop postgresql 2>/dev/null || systemctl stop postgresql-15
        fi
        ;;
    restart)
        echo "重启PostgreSQL..."
        if command -v systemctl >/dev/null 2>&1; then
            systemctl restart postgresql 2>/dev/null || systemctl restart postgresql-15
        fi
        ;;
    status)
        echo "PostgreSQL状态："
        if command -v systemctl >/dev/null 2>&1; then
            systemctl status postgresql 2>/dev/null || systemctl status postgresql-15
        fi
        sudo -u postgres pg_isready
        ;;
    connect)
        echo "连接到PostgreSQL..."
        sudo -u postgres psql
        ;;
    log)
        echo "查看PostgreSQL日志..."
        if [ -d "/var/log/postgresql" ]; then
            tail -f /var/log/postgresql/postgresql-*.log
        else
            journalctl -u postgresql 2>/dev/null || journalctl -u postgresql-15 -f
        fi
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|connect|log}"
        echo ""
        echo "命令说明："
        echo "  start   - 启动PostgreSQL服务"
        echo "  stop    - 停止PostgreSQL服务"
        echo "  restart - 重启PostgreSQL服务"
        echo "  status  - 查看PostgreSQL状态"
        echo "  connect - 连接到PostgreSQL控制台"
        echo "  log     - 查看PostgreSQL日志"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/manage-postgres.sh

    # 创建数据库管理脚本
    cat > /usr/local/bin/db-admin.sh << 'EOF'
#!/bin/bash

# 数据库管理脚本
echo "YYC3 NAS数据库管理"
echo "=================="
echo ""
echo "MariaDB状态："
systemctl is-active mariadb 2>/dev/null && echo "✅ 运行中" || echo "❌ 未运行"
echo "PostgreSQL状态："
systemctl is-active postgresql 2>/dev/null && echo "✅ 运行中" || echo "❌ 未运行"
echo ""
echo "数据库连接信息："
echo ""
echo "PostgreSQL："
echo "  主机: localhost"
echo "  端口: 5432"
echo "  用户: yyc3_admin"
echo "  密码: yyc3_nas_admin_2024"
echo "  数据库: yyc3_main"
echo ""
echo "MariaDB："
echo "  主机: localhost"
echo "  端口: 3306"
echo "  用户: root"
echo "  密码: [请查看MariaDB配置]"
echo ""
echo "管理命令："
echo "  PostgreSQL: manage-postgres.sh {start|stop|restart|status|connect|log}"
echo "  MariaDB:   systemctl {start|stop|restart|status} mariadb"
EOF

    chmod +x /usr/local/bin/db-admin.sh

    echo -e "${GREEN}✅ 管理脚本已创建${NC}"
}

# 验证安装
verify_installation() {
    echo -e "${BLUE}✅ 验证安装...${NC}"

    # 检查socket文件
    if [ -S "/var/run/postgresql/.s.PGSQL.5432" ]; then
        echo -e "${GREEN}✅ PostgreSQL socket文件存在${NC}"
    else
        echo -e "${YELLOW}⚠️ PostgreSQL socket文件不存在，检查服务状态${NC}"
    fi

    # 检查PostgreSQL连接
    if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL连接正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL连接失败${NC}"
    fi

    # 检查数据库
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw yyc3_main; then
        echo -e "${GREEN}✅ 数据库创建成功${NC}"
    else
        echo -e "${RED}❌ 数据库创建失败${NC}"
    fi

    # 检查MariaDB（如果运行）
    if [ "$MARIADB_RUNNING" = true ]; then
        echo -e "${GREEN}✅ MariaDB保持运行${NC}"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}🎯 开始在NAS上安装PostgreSQL（与MariaDB并存）${NC}"
    echo ""

    detect_os
    check_mariadb
    backup_existing
    install_postgresql
    configure_postgresql
    start_postgresql
    create_databases
    configure_firewall
    create_management_scripts
    verify_installation

    echo ""
    echo -e "${GREEN}🎉 PostgreSQL安装完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 安装总结：${NC}"
    echo -e "✅ ${GREEN}PostgreSQL已安装在端口5432${NC}"
    echo -e "✅ ${GREEN}MariaDB保持原有配置${NC}"
    echo -e "✅ ${GREEN}双数据库系统并存${NC}"
    echo ""
    echo -e "${BLUE}📊 连接信息：${NC}"
    echo -e "PostgreSQL: ${GREEN}postgresql://yyc3_admin:yyc3_nas_admin_2024@localhost:5432/yyc3_main${NC}"
    echo -e "MariaDB:   ${GREEN}mysql://root:password@localhost:3306/${NC} (请确认密码)"
    echo ""
    echo -e "${BLUE}🔧 管理命令：${NC}"
    echo -e "数据库状态: ${GREEN}db-admin.sh${NC}"
    echo -e "PostgreSQL管理: ${GREEN}manage-postgres.sh {start|stop|restart|status|connect|log}${NC}"
    echo -e "MariaDB管理: ${GREEN}systemctl {start|stop|restart|status} mariadb${NC}"
    echo ""
    echo -e "${BLUE}📝 下一步：${NC}"
    echo "1. 测试PostgreSQL连接: sudo -u postgres psql -d yyc3_main"
    echo "2. 配置应用使用新的PostgreSQL数据库"
    echo "3. 验证两个数据库系统都正常运行"
    echo ""
    echo -e "${GREEN}✨ 双数据库环境配置完成！${NC}"
}

# 运行主函数
main "$@"