#!/bin/bash

# 修复版PostgreSQL安装脚本 - 适用于Ubuntu系统
# 修复lsb_release和仓库配置问题

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐘 修复版PostgreSQL安装脚本${NC}"
echo "================================"

# 获取Ubuntu版本信息
get_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        UBUNTU_CODENAME=$VERSION_CODENAME
        UBUNTU_VERSION=$VERSION_ID
        echo "检测到Ubuntu $UBUNTU_VERSION ($UBUNTU_CODENAME)"
    else
        echo -e "${YELLOW}⚠️ 无法检测Ubuntu版本，使用默认配置${NC}"
        UBUNTU_CODENAME="jammy"
        UBUNTU_VERSION="22.04"
    fi
}

# 备份现有配置
backup_existing() {
    echo -e "${BLUE}📦 备份现有配置...${NC}"

    if [ -d "/var/run/postgresql" ]; then
        cp -r /var/run/postgresql /tmp/postgresql_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        echo "已备份PostgreSQL运行目录"
    fi

    if [ -d "/etc/postgresql" ]; then
        cp -r /etc/postgresql /tmp/postgresql_config_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        echo "已备份PostgreSQL配置目录"
    fi
}

# 移除损坏的PostgreSQL仓库
remove_broken_repo() {
    echo -e "${BLUE}🗑️ 移除损坏的PostgreSQL仓库...${NC}"

    # 移除损坏的源文件
    rm -f /etc/apt/sources.list.d/pgdg.list

    # 移除损坏的密钥
    apt-key list | grep "PostgreSQL" | awk '{print $2}' | while read keyid; do
        apt-key del "$keyid" 2>/dev/null || true
    done

    echo "已清理损坏的PostgreSQL配置"
}

# 添加正确的PostgreSQL仓库
add_postgres_repo() {
    echo -e "${BLUE}📦 添加PostgreSQL仓库...${NC}"

    # 创建密钥目录
    mkdir -p /etc/apt/keyrings

    # 下载并添加PostgreSQL GPG密钥
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
        gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg

    # 添加PostgreSQL仓库
    echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt/ $UBUNTU_CODENAME-pgdg main" > \
        /etc/apt/sources.list.d/pgdg.list

    echo "已添加PostgreSQL仓库"
}

# 更新包管理器
update_packages() {
    echo -e "${BLUE}🔄 更新包管理器...${NC}"

    apt-get update
    echo "包管理器更新完成"
}

# 安装PostgreSQL
install_postgresql() {
    echo -e "${BLUE}📦 安装PostgreSQL...${NC}"

    # 安装PostgreSQL和相关工具
    apt-get install -y \
        postgresql \
        postgresql-contrib \
        postgresql-client-common \
        pgadmin3 \
        phppgadmin

    echo "PostgreSQL安装完成"
}

# 配置PostgreSQL
configure_postgresql() {
    echo -e "${BLUE}⚙️ 配置PostgreSQL...${NC}"

    # 确保目录存在并设置权限
    mkdir -p /var/run/postgresql
    chown postgres:postgres /var/run/postgresql
    chmod 755 /var/run/postgresql

    # 查找PostgreSQL配置目录
    PG_CONF_DIR=$(find /etc/postgresql -name "postgresql.conf" | head -1 | xargs dirname)
    if [ -z "$PG_CONF_DIR" ]; then
        PG_CONF_DIR="/etc/postgresql/*/main"
    fi

    echo "PostgreSQL配置目录: $PG_CONF_DIR"

    # 配置postgresql.conf
    if [ -f "$PG_CONF_DIR/postgresql.conf" ]; then
        # 备份原配置
        cp "$PG_CONF_DIR/postgresql.conf" "$PG_CONF_DIR/postgresql.conf.backup"

        # 修改配置
        sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf" || true
        sed -i "s/#port = 5432/port = 5432/" "$PG_CONF_DIR/postgresql.conf" || true

        # 添加优化配置
        cat >> "$PG_CONF_DIR/postgresql.conf" << 'EOF'

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

        echo "PostgreSQL配置文件已更新"
    fi

    # 配置pg_hba.conf
    if [ -f "$PG_CONF_DIR/pg_hba.conf" ]; then
        # 备份原配置
        cp "$PG_CONF_DIR/pg_hba.conf" "$PG_CONF_DIR/pg_hba.conf.backup"

        # 添加访问规则
        cat >> "$PG_CONF_DIR/pg_hba.conf" << 'EOF'

# YYC3 NAS PostgreSQL访问配置
local   all             postgres                                trust
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
host    replication     replication     0.0.0.0/0               md5
EOF

        echo "PostgreSQL访问控制配置已更新"
    fi
}

# 启动PostgreSQL服务
start_postgresql() {
    echo -e "${BLUE}🚀 启动PostgreSQL服务...${NC}"

    # 启用并启动服务
    systemctl enable postgresql
    systemctl start postgresql

    # 等待服务启动
    echo -e "${YELLOW}⏳ 等待PostgreSQL启动...${NC}"
    sleep 15

    # 检查服务状态
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL服务启动成功${NC}"
    else
        echo -e "${RED}❌ PostgreSQL服务启动失败${NC}"
        echo "查看服务状态："
        systemctl status postgresql
        echo "查看日志："
        journalctl -u postgresql -n 50
        exit 1
    fi
}

# 创建数据库和用户
create_databases() {
    echo -e "${BLUE}🏗️ 创建数据库和用户...${NC}"

    # 等待PostgreSQL完全启动
    sleep 10

    # 使用sudo -u postgres创建数据库和用户
    sudo -u postgres psql << 'EOF'
-- 设置postgres密码
ALTER USER postgres WITH PASSWORD 'postgres_nas_2024';

-- 创建管理员用户
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

-- 初始化基础表
\c ai_dashboard;
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW());
INSERT INTO config (key, value) VALUES ('version', '1.0.0'), ('initialized', 'true'), ('max_users', '100');

\c future_dashboard;
CREATE TABLE IF NOT EXISTS widgets (id SERIAL PRIMARY KEY, name TEXT, type TEXT, config JSON, created_at TIMESTAMP DEFAULT NOW());

\c kanban_board;
CREATE TABLE IF NOT EXISTS boards (id SERIAL PRIMARY KEY, name TEXT, description TEXT, created_at TIMESTAMP DEFAULT NOW());

\c status_monitor;
CREATE TABLE IF NOT EXISTS checks (id SERIAL PRIMARY KEY, name TEXT, url TEXT, status TEXT, last_check TIMESTAMP DEFAULT NOW());

\c api_gateway;
CREATE TABLE IF NOT EXISTS api_keys (id SERIAL PRIMARY KEY, key_hash TEXT, name TEXT, permissions JSON, created_at TIMESTAMP DEFAULT NOW());

\c grafana_monitoring;
CREATE TABLE IF NOT EXISTS dashboards (id SERIAL PRIMARY KEY, title TEXT, config JSON, created_at TIMESTAMP DEFAULT NOW());

-- 显示所有数据库
\l

-- 退出
\q
EOF

    echo "数据库和用户创建完成"
}

# 配置防火墙
configure_firewall() {
    echo -e "${BLUE}🔥 配置防火墙...${NC}"

    if command -v ufw >/dev/null 2>&1; then
        ufw allow 5432/tcp
        echo -e "${GREEN}✅ 防火墙已配置（开放5432端口）${NC}"
    else
        echo -e "${YELLOW}⚠️ 未检测到ufw防火墙${NC}"
    fi
}

# 创建管理脚本
create_management_scripts() {
    echo -e "${BLUE}📜 创建管理脚本...${NC}"

    # PostgreSQL管理脚本
    cat > /usr/local/bin/manage-postgres.sh << 'EOF'
#!/bin/bash

# PostgreSQL管理脚本
case "$1" in
    start)
        echo "启动PostgreSQL..."
        systemctl start postgresql
        ;;
    stop)
        echo "停止PostgreSQL..."
        systemctl stop postgresql
        ;;
    restart)
        echo "重启PostgreSQL..."
        systemctl restart postgresql
        ;;
    status)
        echo "PostgreSQL状态："
        systemctl status postgresql
        sudo -u postgres pg_isready
        ;;
    connect)
        echo "连接到PostgreSQL..."
        sudo -u postgres psql
        ;;
    log)
        echo "查看PostgreSQL日志..."
        journalctl -u postgresql -f
        ;;
    list)
        echo "PostgreSQL数据库列表："
        sudo -u postgres psql -l
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|connect|log|list}"
        echo ""
        echo "命令说明："
        echo "  start   - 启动PostgreSQL服务"
        echo "  stop    - 停止PostgreSQL服务"
        echo "  restart - 重启PostgreSQL服务"
        echo "  status  - 查看PostgreSQL状态"
        echo "  connect - 连接到PostgreSQL控制台"
        echo "  log     - 查看PostgreSQL日志"
        echo "  list    - 列出所有数据库"
        exit 1
        ;;
esac
EOF

    # 数据库管理脚本
    cat > /usr/local/bin/db-admin.sh << 'EOF'
#!/bin/bash

# 数据库管理脚本
echo "YYC3 NAS数据库管理"
echo "=================="
echo ""

echo "PostgreSQL状态："
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: 运行中"
    if [ -S "/var/run/postgresql/.s.PGSQL.5432" ]; then
        echo "✅ Socket文件: 存在"
    else
        echo "❌ Socket文件: 不存在"
    fi
else
    echo "❌ PostgreSQL: 未运行"
fi

echo ""
echo "PostgreSQL连接信息："
echo "  主机: localhost"
echo "  端口: 5432"
echo "  用户: postgres / yyc3_admin"
echo "  密码: postgres_nas_2024 / yyc3_nas_admin_2024"
echo ""

echo "管理命令："
echo "  PostgreSQL: manage-postgres.sh {start|stop|restart|status|connect|log|list}"
echo "  连接控制台: sudo -u postgres psql"
echo "  测试连接: manage-postgres.sh status"
EOF

    chmod +x /usr/local/bin/manage-postgres.sh
    chmod +x /usr/local/bin/db-admin.sh

    echo -e "${GREEN}✅ 管理脚本已创建${NC}"
}

# 验证安装
verify_installation() {
    echo -e "${BLUE}✅ 验证安装...${NC}"

    # 检查服务状态
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL服务运行正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL服务未运行${NC}"
        return 1
    fi

    # 检查socket文件
    if [ -S "/var/run/postgresql/.s.PGSQL.5432" ]; then
        echo -e "${GREEN}✅ PostgreSQL socket文件存在${NC}"
    else
        echo -e "${YELLOW}⚠️ PostgreSQL socket文件不存在${NC}"
        echo "等待socket文件创建..."
        sleep 5
    fi

    # 测试数据库连接
    if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL数据库连接正常${NC}"
    else
        echo -e "${RED}❌ PostgreSQL数据库连接失败${NC}"
        return 1
    fi

    # 检查应用数据库
    databases=("yyc3_main" "ai_dashboard" "future_dashboard" "kanban_board")
    for db in "${databases[@]}"; do
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$db"; then
            echo -e "${GREEN}✅ 数据库 $db 存在${NC}"
        else
            echo -e "${RED}❌ 数据库 $db 不存在${NC}"
        fi
    done

    return 0
}

# 主函数
main() {
    echo -e "${BLUE}🎯 开始修复PostgreSQL安装...${NC}"
    echo ""

    # 检查是否为root用户
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ 请以root用户运行此脚本${NC}"
        echo "使用: sudo ./install-postgres-ubuntu-fixed.sh"
        exit 1
    fi

    get_ubuntu_version
    backup_existing
    remove_broken_repo
    add_postgres_repo
    update_packages
    install_postgresql
    configure_postgresql
    start_postgresql
    create_databases
    configure_firewall
    create_management_scripts

    if verify_installation; then
        echo ""
        echo -e "${GREEN}🎉 PostgreSQL安装和配置完成！${NC}"
        echo ""
        echo -e "${BLUE}📋 安装总结：${NC}"
        echo -e "✅ ${GREEN}PostgreSQL已成功安装${NC}"
        echo -e "✅ ${GREEN}数据库和用户已创建${NC}"
        echo -e "✅ ${GREEN}远程访问已启用${NC}"
        echo ""
        echo -e "${BLUE}📊 连接信息：${NC}"
        echo -e "PostgreSQL: ${GREEN}postgresql://yyc3_admin:yyc3_nas_admin_2024@localhost:5432/yyc3_main${NC}"
        echo -e "管理员: ${GREEN}postgresql://postgres:postgres_nas_2024@localhost:5432/postgres${NC}"
        echo ""
        echo -e "${BLUE}🔧 管理命令：${NC}"
        echo -e "数据库状态: ${GREEN}db-admin.sh${NC}"
        echo -e "PostgreSQL管理: ${GREEN}manage-postgres.sh {start|stop|restart|status|connect|log|list}${NC}"
        echo ""
        echo -e "${BLUE}📝 下一步：${NC}"
        echo "1. 测试PostgreSQL连接: db-admin.sh"
        echo "2. 连接数据库: manage-postgres.sh connect"
        echo "3. 查看数据库列表: manage-postgres.sh list"
        echo "4. 配置应用使用新的PostgreSQL数据库"
        echo ""
        echo -e "${GREEN}✨ PostgreSQL现在可以正常使用了！${NC}"
    else
        echo -e "${RED}❌ 安装验证失败，请检查错误信息${NC}"
        exit 1
    fi
}

# 运行主函数
main "$@"