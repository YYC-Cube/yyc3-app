#!/bin/bash

# 在NAS上安装PostgreSQL服务器
# 适用于Debian/Ubuntu系统

set -e

echo "🐘 在NAS上安装PostgreSQL..."
echo "=============================="

# 检测操作系统
if [ -f /etc/debian_version ]; then
    echo "检测到Debian/Ubuntu系统"
    DISTRO="debian"
elif [ -f /etc/redhat-release ]; then
    echo "检测到RedHat/CentOS系统"
    DISTRO="redhat"
else
    echo "未知操作系统，请手动安装"
    exit 1
fi

# 更新包管理器
echo "更新包管理器..."
if [ "$DISTRO" = "debian" ]; then
    apt-get update
    apt-get upgrade -y
else
    yum update -y
fi

# 安装PostgreSQL
echo "安装PostgreSQL 15..."
if [ "$DISTRO" = "debian" ]; then
    # 添加PostgreSQL官方APT仓库
    apt-get install -y wget ca-certificates
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    apt-get update

    # 安装PostgreSQL
    apt-get install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
else
    # RHEL/CentOS安装
    dnf install -y postgresql15-server postgresql15
    /usr/pgsql-15/bin/postgresql-15-setup initdb
fi

# 启动PostgreSQL服务
echo "启动PostgreSQL服务..."
if [ "$DISTRO" = "debian" ]; then
    systemctl start postgresql
    systemctl enable postgresql
else
    systemctl start postgresql-15
    systemctl enable postgresql-15
fi

# 设置密码和创建数据库
echo "配置PostgreSQL..."
sudo -u postgres psql << 'EOF'
-- 修改postgres用户密码
ALTER USER postgres PASSWORD 'postgres_nas_2024';

-- 创建yyc3用户和数据库
CREATE USER yyc3_admin WITH PASSWORD 'yyc3_nas_admin_2024' CREATEDB;
CREATE DATABASE yyc3_main OWNER yyc3_admin;
GRANT ALL PRIVILEGES ON DATABASE yyc3_main TO yyc3_admin;

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

-- 退出
\q
EOF

# 配置PostgreSQL接受远程连接
echo "配置远程连接..."
if [ "$DISTRO" = "debian" ]; then
    POSTGRESQL_CONF="/etc/postgresql/15/main/postgresql.conf"
    PG_HBA_CONF="/etc/postgresql/15/main/pg_hba.conf"
else
    POSTGRESQL_CONF="/var/lib/pgsql/15/data/postgresql.conf"
    PG_HBA_CONF="/var/lib/pgsql/15/data/pg_hba.conf"
fi

# 修改配置文件
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" $POSTGRESQL_CONF
sed -i "s/#port = 5432/port = 5432/" $POSTGRESQL_CONF

# 添加主机认证
cat >> $PG_HBA_CONF << 'EOF'

# YYC3 NAS远程连接配置
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
EOF

# 重启PostgreSQL
echo "重启PostgreSQL服务..."
if [ "$DISTRO" = "debian" ]; then
    systemctl restart postgresql
else
    systemctl restart postgresql-15
fi

# 配置防火墙
echo "配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 5432/tcp
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port=5432/tcp
    firewall-cmd --reload
fi

# 测试连接
echo "测试PostgreSQL连接..."
sleep 5

if sudo -u postgres pg_isready >/dev/null 2>&1; then
    echo "✅ PostgreSQL安装成功并运行正常"
    echo ""
    echo "📋 连接信息："
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: yyc3_main"
    echo "User: yyc3_admin"
    echo "Password: yyc3_nas_admin_2024"
    echo ""
    echo "🔗 完整连接字符串："
    echo "postgresql://yyc3_admin:yyc3_nas_admin_2024@localhost:5432/yyc3_main"
    echo ""
    echo "🏠 如果需要从其他机器连接，使用NAS的IP地址替换localhost"
else
    echo "❌ PostgreSQL启动失败"
    echo "请检查日志："
    if [ "$DISTRO" = "debian" ]; then
        journalctl -u postgresql
    else
        journalctl -u postgresql-15
    fi
fi

# 创建管理脚本
cat > /usr/local/bin/manage-postgres.sh << 'EOF'
#!/bin/bash

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
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/manage-postgres.sh

echo ""
echo "🎉 PostgreSQL安装完成！"
echo ""
echo "🔧 管理命令："
echo "启动: manage-postgres.sh start"
echo "停止: manage-postgres.sh stop"
echo "重启: manage-postgres.sh restart"
echo "状态: manage-postgres.sh status"
echo ""
echo "📊 客户端连接："
echo "psql -h localhost -U yyc3_admin -d yyc3_main"
echo "密码: yyc3_nas_admin_2024"