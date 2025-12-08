#!/bin/bash

# SSH连接设置脚本 - 0379-World云服务器部署
# 设置到8.152.195.33服务器的SSH访问

set -e

# 配置
SERVER="8.152.195.33"
SERVER_USER="root"
SSH_KEY_PATH="$HOME/.ssh/id_rsa_yyc3_0379"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔑 SSH连接设置 - 0379-World云服务器${NC}"
echo "============================================"
echo "服务器: $SERVER"
echo "用户: $SERVER_USER"
echo "密钥路径: $SSH_KEY_PATH"
echo ""

# 检查现有SSH密钥
check_existing_keys() {
    echo -e "${BLUE}🔍 检查现有SSH密钥...${NC}"

    if [ -f "$SSH_KEY_PATH" ]; then
        echo -e "${YELLOW}⚠️ SSH密钥已存在: $SSH_KEY_PATH${NC}"
        read -p "是否使用现有密钥? (y/n): " use_existing
        if [[ "$use_existing" =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✅ 使用现有SSH密钥${NC}"
            return 0
        else
            echo -e "${YELLOW}删除现有密钥...${NC}"
            rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
        fi
    fi

    echo -e "${GREEN}✅ SSH密钥检查完成${NC}"
}

# 创建SSH密钥
create_ssh_key() {
    if [ -f "$SSH_KEY_PATH" ]; then
        echo -e "${GREEN}✅ SSH密钥已存在，跳过创建${NC}"
        return 0
    fi

    echo -e "${BLUE}🔑 创建SSH密钥...${NC}"

    ssh-keygen -t rsa -b 4096 -C "yyc3-0379-deployment@$(date +%Y%m%d)" \
        -f "$SSH_KEY_PATH" -N ""

    echo -e "${GREEN}✅ SSH密钥创建完成${NC}"
    echo "公钥路径: $SSH_KEY_PATH.pub"
    echo "私钥路径: $SSH_KEY_PATH"
}

# 显示公钥
show_public_key() {
    echo -e "${BLUE}📋 SSH公钥内容:${NC}"
    echo "================================"
    cat "$SSH_KEY_PATH.pub"
    echo "================================"
    echo ""
}

# 配置SSH客户端
configure_ssh_client() {
    echo -e "${BLUE}⚙️ 配置SSH客户端...${NC}"

    # 添加到SSH配置文件
    if ! grep -q "Host yyc3-0379" ~/.ssh/config 2>/dev/null; then
        cat >> ~/.ssh/config << 'EOF'

# YYC3 0379-World 服务器配置
Host yyc3-0379
    HostName 8.152.195.33
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa_yyc3_0379
    StrictHostKeyChecking no
    UserKnownHostsFile ~/.ssh/known_hosts_yyc3_0379
    LogLevel INFO
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
        echo -e "${GREEN}✅ SSH配置已添加到 ~/.ssh/config${NC}"
    else
        echo -e "${YELLOW}⚠️ SSH配置已存在${NC}"
    fi

    # 设置正确的权限
    chmod 600 ~/.ssh/config
    chmod 600 "$SSH_KEY_PATH"
    chmod 644 "$SSH_KEY_PATH.pub"

    echo -e "${GREEN}✅ SSH客户端配置完成${NC}"
}

# 测试SSH连接
test_ssh_connection() {
    echo -e "${BLUE}🔗 测试SSH连接...${NC}"

    echo -e "${YELLOW}请手动执行以下步骤来设置SSH访问:${NC}"
    echo ""
    echo -e "${BLUE}步骤1: 复制公钥到服务器${NC}"
    echo "方法1 (推荐):"
    echo "  ssh-copy-id -i $SSH_KEY_PATH.pub root@$SERVER"
    echo ""
    echo "方法2 (手动):"
    echo "  1. 登录服务器: ssh root@$SERVER"
    echo "  2. 执行以下命令:"
    echo "     mkdir -p ~/.ssh"
    echo "     chmod 700 ~/.ssh"
    echo "     echo '$(cat $SSH_KEY_PATH.pub)' >> ~/.ssh/authorized_keys"
    echo "     chmod 600 ~/.ssh/authorized_keys"
    echo ""

    read -p "按回车键继续测试SSH连接..."

    # 尝试连接
    if ssh -o ConnectTimeout=10 -o BatchMode=yes yyc3-0379 "echo 'SSH连接成功'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH连接测试成功${NC}"
        return 0
    else
        echo -e "${RED}❌ SSH连接测试失败${NC}"
        echo -e "${YELLOW}请检查:${NC}"
        echo "1. 服务器IP是否正确: $SERVER"
        echo "2. SSH密钥是否已正确部署"
        echo "3. 服务器SSH服务是否运行"
        echo "4. 网络连接是否正常"
        return 1
    fi
}

# 创建连接测试脚本
create_connection_test() {
    echo -e "${BLUE}📜 创建连接测试脚本...${NC}"

    cat > ~/test-yyc3-connection.sh << 'EOF'
#!/bin/bash

# YYC3 0379-World 连接测试脚本
echo "🔗 测试到YYC3-0379服务器的连接..."
echo "=================================="

echo "1. 测试网络连通性..."
if ping -c 3 8.152.195.33 >/dev/null 2>&1; then
    echo "✅ 网络连通正常"
else
    echo "❌ 网络连通失败"
fi

echo ""
echo "2. 测试SSH连接..."
if ssh -o ConnectTimeout=10 yyc3-0379 "echo 'SSH连接成功'" 2>/dev/null; then
    echo "✅ SSH连接正常"
else
    echo "❌ SSH连接失败"
fi

echo ""
echo "3. 测试服务器状态..."
ssh yyc3-0379 << 'REMOTE'
    echo "服务器信息:"
    echo "- 操作系统: $(uname -s)"
    echo "- 内核版本: $(uname -r)"
    echo "- 运行时间: $(uptime -p)"
    echo "- 磁盘使用: $(df -h / | tail -1 | awk '{print $5}')"
    echo "- 内存使用: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
REMOTE

echo ""
echo "连接测试完成"
EOF

    chmod +x ~/test-yyc3-connection.sh
    echo -e "${GREEN}✅ 连接测试脚本已创建: ~/test-yyc3-connection.sh${NC}"
}

# 创建服务器初始配置脚本
create_server_config() {
    echo -e "${BLUE}📝 创建服务器初始配置脚本...${NC}"

    cat > ~/setup-yyc3-server.sh << 'EOF'
#!/bin/bash

# YYC3 0379-World 服务器初始配置脚本
# 在服务器上执行此脚本

set -e

echo "🚀 YYC3 0379-World 服务器初始化"
echo "==============================="

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装基础软件
echo "🔧 安装基础软件..."
apt install -y curl wget git unzip htop vim nano
apt install -y build-essential software-properties-common

# 安装Nginx
echo "🌐 安装Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 安装Docker
echo "🐳 安装Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# 安装Docker Compose
echo "🔗 安装Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装Node.js
echo "📦 安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装pnpm
echo "📦 安装pnpm..."
npm install -g pnpm

# 安装SSL证书工具
echo "🔒 安装Certbot..."
apt install -y certbot python3-certbot-nginx

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /opt/0379-world/{apps,packages,config,data,logs,ssl,backups}
mkdir -p /opt/0379-world/apps/{dashboard,kanban-board,status-monitor}
mkdir -p /opt/0379-world/packages/{ui,utils,api,config}
mkdir -p /opt/0379-world/config/{nginx,docker,prometheus,grafana}
mkdir -p /opt/0379-world/data/{prometheus,grafana,postgres}
mkdir -p /opt/0379-world/logs/{nginx,app,access,database}
mkdir -p /opt/0379-world/ssl/{certs,private}

# 设置权限
echo "🔐 设置目录权限..."
chown -R root:root /opt/0379-world
chmod 755 /opt/0379-world

# 安装PostgreSQL
echo "🐘 安装PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# 配置PostgreSQL
echo "⚙️ 配置PostgreSQL..."
sudo -u postgres psql << 'SQL'
    -- 修改密码
    ALTER USER postgres PASSWORD 'postgres_0379_2024';

    -- 创建应用用户
    CREATE USER yyc3_admin WITH PASSWORD 'yyc3_admin_2024' CREATEDB;
    CREATE USER yyc3_app WITH PASSWORD 'yyc3_app_2024';

    -- 创建数据库
    CREATE DATABASE yyc3_main OWNER yyc3_admin;
    CREATE DATABASE ai_dashboard OWNER yyc3_admin;
    CREATE DATABASE future_dashboard OWNER yyc3_admin;
    CREATE DATABASE kanban_board OWNER yyc3_admin;
    CREATE DATABASE status_monitor OWNER yyc3_admin;

    -- 授权
    GRANT ALL PRIVILEGES ON DATABASE yyc3_main TO yyc3_app;
    GRANT ALL PRIVILEGES ON DATABASE ai_dashboard TO yyc3_app;
    GRANT ALL PRIVILEGES ON DATABASE future_dashboard TO yyc3_app;
    GRANT ALL PRIVILEGES ON DATABASE kanban_board TO yyc3_app;
    GRANT ALL PRIVILEGES ON DATABASE status_monitor TO yyc3_app;
SQL

# 配置PostgreSQL远程访问
echo "🌐 配置PostgreSQL远程访问..."
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
cat >> /etc/postgresql/*/main/pg_hba.conf << 'EOF'

# YYC3 0379-World 远程访问配置
host    all             all             0.0.0.0/0               md5
EOF

systemctl restart postgresql

# 配置防火墙
echo "🔥 配置防火墙..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
ufw --force enable

# 显示安装结果
echo ""
echo "✅ 服务器初始化完成！"
echo ""
echo "📋 服务状态:"
systemctl is-active nginx && echo "✅ Nginx: 运行中" || echo "❌ Nginx: 未运行"
systemctl is-active docker && echo "✅ Docker: 运行中" || echo "❌ Docker: 未运行"
systemctl is-active postgresql && echo "✅ PostgreSQL: 运行中" || echo "❌ PostgreSQL: 未运行"
echo ""
echo "📊 连接信息:"
echo "- PostgreSQL: localhost:5432 (yyc3_admin/yyc3_admin_2024)"
echo "- 项目目录: /opt/0379-world"
echo "- Nginx配置: /etc/nginx/sites-available/"
echo ""
echo "🔗 下一步:"
echo "1. 配置域名DNS指向 8.152.195.33"
echo "2. 获取SSL证书: certbot --nginx -d 0379.world"
echo "3. 部署应用代码到 /opt/0379-world"
echo "4. 启动应用服务"
EOF

    chmod +x ~/setup-yyc3-server.sh
    echo -e "${GREEN}✅ 服务器配置脚本已创建: ~/setup-yyc3-server.sh${NC}"
}

# 显示下一步操作
show_next_steps() {
    echo ""
    echo -e "${BLUE}🎯 下一步操作:${NC}"
    echo ""
    echo -e "${YELLOW}1. 设置SSH密钥访问:${NC}"
    echo "   ssh-copy-id -i $SSH_KEY_PATH.pub root@$SERVER"
    echo "   或者手动复制公钥到服务器的 ~/.ssh/authorized_keys"
    echo ""
    echo -e "${YELLOW}2. 测试SSH连接:${NC}"
    echo "   ssh yyc3-0379"
    echo "   或者运行: ~/test-yyc3-connection.sh"
    echo ""
    echo -e "${YELLOW}3. 初始化服务器:${NC}"
    echo "   scp ~/setup-yyc3-server.sh yyc3-0379:/root/"
    echo "   ssh yyc3-0379 './setup-yyc3-server.sh'"
    echo ""
    echo -e "${YELLOW}4. 部署项目:${NC}"
    echo "   ./deployments/0379-world-sync.sh"
    echo ""
    echo -e "${YELLOW}5. 配置SSL证书:${NC}"
    echo "   ssh yyc3-0379 'certbot --nginx -d 0379.world -d yanyu.red'"
    echo ""
    echo -e "${GREEN}✨ SSH设置完成！现在可以开始部署0379-World项目了${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}🚀 开始SSH连接设置...${NC}"

    check_existing_keys
    create_ssh_key
    show_public_key
    configure_ssh_client

    if test_ssh_connection; then
        echo -e "${GREEN}🎉 SSH连接设置成功！${NC}"
    else
        echo -e "${YELLOW}⚠️ SSH连接需要手动配置${NC}"
    fi

    create_connection_test
    create_server_config
    show_next_steps

    echo ""
    echo -e "${GREEN}✅ 所有设置完成！${NC}"
}

# 运行主函数
main "$@"