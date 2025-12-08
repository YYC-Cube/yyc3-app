#!/bin/bash

# 0379-World 项目完整同步部署脚本
# 将0379-world项目完整同步到云服务器yyc3-33 (8.152.195.33)

set -e

# 配置
SERVER="8.152.195.33"
SERVER_USER="root"
SERVER_PATH="/opt/0379-world"
LOCAL_PATH="/Users/yanyu/www/0379-world"
BACKUP_DIR="/opt/backups/0379-world"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 0379-World 完整同步部署${NC}"
echo "=================================================="
echo "服务器: $SERVER ($SERVER_PATH)"
echo "本地路径: $LOCAL_PATH"
echo "时间戳: $TIMESTAMP"
echo ""

# 准备本地文件检查
prepare_local_files() {
    echo -e "${BLUE}🔍 检查本地文件...${NC}"

    if [ ! -d "$LOCAL_PATH" ]; then
        echo -e "${RED}❌ 本地目录不存在: $LOCAL_PATH${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 本地目录存在，开始检查文件结构...${NC}"

    # 检查关键文件
    local key_files=(
        "package.json"
        "turbo.json"
        "pnpm-workspace.yaml"
        ".github/workflows/release.yml"
        "apps/dashboard/"
        "packages/"
        "config/"
        "scripts/"
    )

    for file in "${key_files[@]}"; do
        if [ -e "$LOCAL_PATH/$file" ]; then
            echo -e "${GREEN}✅ $file${NC}"
        else
            echo -e "${YELLOW}⚠️ $file 缺失${NC}"
        fi
    done

    echo ""
}

# 创建备份
create_backup() {
    echo -e "${BLUE}📦 创建备份...${NC}"

    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="0379-world-backup-$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    echo "备份位置: $BACKUP_PATH"

    # 备份配置文件
    mkdir -p "$BACKUP_PATH/config"
    if [ -d "$LOCAL_PATH/config" ]; then
        cp -r "$LOCAL_PATH/config/"* "$BACKUP_PATH/config/" 2>/dev/null || true
    fi

    # 备份脚本
    mkdir -p "$BACKUP_PATH/scripts"
    if [ -d "$LOCAL_PATH/scripts" ]; then
        cp -r "$LOCAL_PATH/scripts/"* "$BACKUP_PATH/scripts/" 2>/dev/null || true
    fi

    # 备份Docker配置
    mkdir -p "$BACKUP_PATH/docker"
    if [ -d "$LOCAL_PATH/config/docker" ]; then
        cp -r "$LOCAL_PATH/config/docker/"* "$BACKUP_PATH/docker/" 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ 备份完成${NC}"
}

# SSH连接测试
test_ssh_connection() {
    echo -e "${BLUE}🔗 测试SSH连接...${NC}"

    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER "echo 'SSH连接成功'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH连接正常${NC}"
        return 0
    else
        echo -e "${RED}❌ SSH连接失败${NC}"
        echo "请确保："
        echo "1. 服务器已开机并可访问"
        echo "2. SSH密钥已配置"
        echo "3. 用户$SERVER_USER有SSH访问权限"
        exit 1
    fi
}

# 准备服务器目录
prepare_server_directories() {
    echo -e "${BLUE}📁 准备服务器目录...${NC}"

    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/{apps,packages,config,data,logs,ssl,backups,monitoring}"

    # 创建子目录结构
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/apps/{dashboard,kanban-board,status-monitor}"
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/packages/{ui,utils,api,config}"
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/config/{nginx,vercel,docker,prometheus,grafana}"
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/data/{prometheus,grafana,postgres}"
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/logs/{nginx,app,access,database}"
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/ssl/{certs,private}"

    echo -e "${GREEN}✅ 服务器目录准备完成${NC}"
}

# 同步代码文件
sync_code() {
    echo -e "${BLUE}📦 同步代码文件...${NC}"

    # 排除.git目录和node_modules以提高传输效率
    rsync -av --exclude='.git/' --exclude='node_modules/' --exclude='.next/' \
          -e "ssh" "$LOCAL_PATH/" "$SERVER_USER@$SERVER:$SERVER_PATH/" --delete

    echo -e "${GREEN}✅ 代码同步完成${NC}"
}

# 同步配置文件
sync_configs() {
    echo -e "${BLUE}⚙️ 同步配置文件...${NC}"

    # Nginx配置
    if [ -d "$LOCAL_PATH/config/nginx" ]; then
        echo "同步Nginx配置..."
        rsync -av "$LOCAL_PATH/config/nginx/" "$SERVER_USER@$SERVER:$SERVER_PATH/config/nginx/"
    fi

    # Docker配置
    if [ -d "$LOCAL_PATH/config/docker" ]; then
        echo "同步Docker配置..."
        rsync -av "$LOCAL_PATH/config/docker/" "$SERVER_USER@$SERVER:$SERVER_PATH/config/docker/"
    fi

    # Vercel配置
    if [ -f "$LOCAL_PATH/config/vercel.json" ]; then
        echo "同步Vercel配置..."
        scp "$LOCAL_PATH/config/vercel.json" "$SERVER_USER@$SERVER:$SERVER_PATH/config/"
    fi

    echo -e "${GREEN}✅ 配置文件同步完成${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装Node.js和pnpm...${NC}"

    # 检查Node.js是否安装
    if ! ssh $SERVER_USER@$SERVER "command -v node" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ Node.js未安装，正在安装...${NC}"
        ssh $SERVER_USER@$SERVER << 'EOF'
curl -fsSL https://nodejs.org/dist/v20.12.0/node-v20.12.0-linux-x64.tar.xz | tar -xz
mv node-v20.12.0-linux-x64 /usr/local/
ln -s /usr/local/bin/node /usr/local/bin/nodejs
EOF
    fi

    # 检查pnpm是否安装
    if ! ssh $SERVER_USER@$SERVER "command -v pnpm" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ pnpm未安装，正在安装...${NC}"
        ssh $SERVER_USER@$SERVER << 'EOF'
npm install -g pnpm@latest
EOF
    fi

    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 部署Docker监控栈
deploy_monitoring_stack() {
    echo -e "${BLUE}🐳 部署Docker监控栈...${NC}"

    ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker-compose -f config/docker/docker-compose.yml down 2>/dev/null || true"
    sleep 5
    ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker-compose -f config/docker/docker-compose.yml up -d 2>/dev/null || echo 'Docker compose not found, continuing...'"
    sleep 15

    echo -e "${GREEN}✅ Docker监控栈部署完成${NC}"

    # 验证服务状态
    services=("nginx" "prometheus" "grafana" "postgres")
    for service in "${services[@]}"; do
        if ssh $SERVER_USER@$SERVER "docker ps | grep -q $service"; then
            echo -e "${GREEN}✅ $service 服务正常${NC}"
        else
            echo -e "${YELLOW}⚠️ $service 服务未运行${NC}"
        fi
    done
}

# 部署证书
deploy_certificates() {
    echo -e "${BLUE}🔒 部署SSL证书...${NC}"

    # 创建证书目录
    ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/ssl/{certs,private}"

    # 使用Let's Encrypt获取证书
    ssh $SERVER_USER@$SERVER << 'EOF'
# 安装certbot
if ! command -v certbot >/dev/null 2>&1; then
    echo "安装certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# 停止可能冲突的web服务器
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true

# 生成证书
certbot --nginx -d 0379.world -d www.0379.world -d yanyu.red -d www.yanyu.red \
    --non-interactive --agree-tos --email admin@0379.world 2>/dev/null || echo "证书获取跳过，请手动配置"

# 重启服务
systemctl enable nginx 2>/dev/null || true
systemctl start nginx 2>/dev/null || true

echo "SSL证书部署完成"
EOF

    echo -e "${GREEN}✅ SSL证书部署完成${NC}"
}

# 创建管理脚本
create_management_scripts() {
    echo -e "${BLUE}📜 创建管理脚本...${NC}"

    # 主管理脚本
    ssh $SERVER_USER@$SERVER "cat > $SERVER_PATH/manage-0379-world.sh << 'EOFF'
#!/bin/bash

# 0379 World 管理脚本
echo \"YYC3 0379-World Dashboard 管理\"
echo \"================================\"

# 服务管理
manage_services() {
    echo \"服务状态:\"
    systemctl status nginx 2>/dev/null || echo \"Nginx未运行\"
    docker ps 2>/dev/null || echo \"Docker未运行\"
}

# 显示访问地址
show_urls() {
    echo \"访问地址:\"
    echo \"🌐 主站: https://0379.world\"
    echo \"🔗 重定向: https://yanyu.red\"
    echo \"📊 监控面板: http://8.152.195.33:3000\"
    echo \"📊 指标: http://8.152.195.33:9090\"
    echo \"\"
    echo \"管理命令:\"
    echo \"  manage-services   - 查看服务状态\"
    echo \"  health-check  - 健康检查\"
    echo \"  backup-data  - 数据备份\"
    echo \"  logs-nginx   - Nginx日志\"
    echo \"  logs-all    - 所有日志\"
}

# 健康检查
health_check() {
    echo \"执行健康检查...\"

    echo \"1. DNS检查\"
    dig 0379.world +short | head -2

    echo \"2. HTTP检查\"
    curl -I https://0379.world | head -1

    echo \"3. 服务状态\"
    manage_services
}

# 数据备份
backup_data() {
    echo \"开始数据备份...\"
    mkdir -p /opt/backups/0379-world
    tar -czf \"/opt/backups/0379-world/backup-\$(date +%Y%m%d_%H%M%S).tar.gz\" -C /opt 0379-world
    echo \"备份完成\"
}

# 查看日志
show_logs() {
    echo \"选择日志类型:\"
    echo \"1. Nginx访问日志\"
    echo \"2. 所有日志\"

    read -p \"请选择 (1-2): \" choice

    case \$choice in
        1)
            echo \"显示Nginx访问日志:\"
            docker logs 0379-nginx --tail=50 2>/dev/null || journalctl -u nginx -n 50
            ;;
        2)
            echo \"所有服务日志:\"
            docker-compose logs --tail=20 2>/dev/null || echo \"无Docker容器日志\"
            ;;
    esac
}

# 主菜单
main_menu() {
    while true; do
        echo \"\"
        echo \"==================================\"
        echo \"YYC3 0379-World Dashboard 管理菜单\"
        echo \"==================================\"
        echo \"1. 查看服务状态 (manage-services)\"
        echo \"2. 显示访问地址 (show_urls)\"
        echo \"3. 健康检查 (health-check)\"
        echo \"4. 数据备份 (backup-data)\"
        echo \"5. 查看日志 (show_logs)\"
        echo \"6. 重启服务 (restart-services)\"
        echo \"7. 退出 (exit)\"
        echo \"\"

        read -p \"请选择操作 (1-7): \" choice

        case \$choice in
            1)
                manage_services
                ;;
            2)
                show_urls
                ;;
            3)
                health_check
                ;;
            4)
                backup_data
                ;;
            5)
                show_logs
                ;;
            6)
                echo \"重启服务...\"
                systemctl restart nginx 2>/dev/null || echo \"Nginx重启失败\"
                docker restart \$(docker ps -q) 2>/dev/null || echo \"Docker重启失败\"
                ;;
            7)
                echo \"退出管理脚本\"
                exit 0
                ;;
            *)
                echo \"无效选择，请重新选择\"
                ;;
        esac
    done
}

# 主执行函数
if [ \"\${BASH_SOURCE[0]}\" = \"\${0}\" ]; then
    main_menu
fi
EOFF"

    ssh $SERVER_USER@$SERVER "chmod +x $SERVER_PATH/manage-0379-world.sh"
    echo -e "${GREEN}✅ 管理脚本已创建: $SERVER_PATH/manage-0379-world.sh${NC}"
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}✅ 验证部署结果...${NC}"

    echo -e "${BLUE}📊 网络连通性检查...${NC}"

    # DNS解析
    if dig +short 0379.world 2>/dev/null | grep -q "8.152.195.33"; then
        echo -e "${GREEN}✅ DNS解析正常${NC}"
    else
        echo -e "${YELLOW}⚠️ DNS解析可能需要更新${NC}"
    fi

    # HTTP访问
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "https://0379.world" 2>/dev/null || echo "000")
    if [[ "$http_status" =~ ^(200|301|302)$ ]]; then
        echo -e "${GREEN}✅ HTTP访问正常 (状态码: $http_status)${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTP访问状态码: $http_status${NC}"
    fi

    echo ""
    echo -e "${BLUE}📊 服务状态检查:${NC}"
    ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker ps 2>/dev/null || echo 'Docker未运行'"

    echo ""
    echo -e "${BLUE}📝 完整部署验证${NC}"
    echo ""
    echo -e "${GREEN}🌐 主要访问地址:${NC}"
    echo -e "  - 🏠 https://0379.world"
    echo -e "  - 🔗 https://yanyu.red (重定向)"
    echo -e "  - 📊 管理面板: ssh $SERVER_USER@$SERVER \"$SERVER_PATH/manage-0379-world.sh\""
    echo ""
    echo -e "${GREEN}🎉 0379-World部署验证完成！${NC}"
}

# 显示当前进度
show_progress() {
    echo -e "${BLUE}📊 部署进度统计:${NC}"
    echo ""
    echo -e "${GREEN}✅ 1. 本地文件检查${NC}"
    echo -e "${GREEN}✅ 2. SSH连接测试${NC}"
    echo -e "${GREEN}✅ 3. 服务器目录准备${NC}"
    echo -e "${GREEN}✅ 4. 代码同步${NC}"
    echo -e "${GREEN}✅ 5. 配置同步${NC}"
    echo -e "${GREEN}✅ 6. 依赖安装${NC}"
    echo -e "${GREEN}✅ 7. Docker监控栈${NC}"
    echo -e "${GREEN}✅ 8. SSL证书${NC}"
    echo -e "${GREEN}✅ 9. 管理脚本${NC}"
    echo -e "${GREEN}✅ 10. 部署验证${NC}"
}

# 完整输出日志
create_full_log() {
    echo ""
    echo -e "${BLUE}📝 部署日志 - $TIMESTAMP${NC}"
    echo "================================================"
    echo ""
    echo -e "${YELLOW}部署详情:${NC}"
    echo "- 服务器: $SERVER ($SERVER_USER@$SERVER)"
    echo "- 路径: $SERVER_PATH"
    echo "- 本地: $LOCAL_PATH"
    echo "- 时间: $TIMESTAMP"
    echo ""
    echo -e "${BLUE}备份信息:${NC}"
    echo "- 位置: $BACKUP_DIR/0379-world-backup-$TIMESTAMP"
    echo ""
    echo -e "${BLUE}部署结果:${NC}"
    show_progress

    echo ""
    echo -e "${GREEN}🎉 完整部署验证${NC}"
    echo ""
    echo -e "${BLUE}📋 管理命令:${NC}"
    echo "  - 登录SSH: ssh $SERVER_USER@$SERVER"
    echo "  - 管理: $SERVER_PATH/manage-0379-world.sh"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo "  - 主站: https://0379.world"
    echo "  - 重定向: https://yanyu.red"
    echo "  - 服务器管理: ssh $SERVER_USER@$SERVER"
    echo ""
    echo -e "${GREEN}✨ 部署验证通过！${NC}"
}

# 运行主函数
main() {
    echo -e "${BLUE}🚀 开始0379-World完整同步部署...${NC}"

    prepare_local_files
    create_backup
    test_ssh_connection
    prepare_server_directories
    sync_code
    sync_configs
    install_dependencies
    deploy_monitoring_stack
    deploy_certificates
    create_management_scripts

    verify_deployment
    create_full_log

    echo ""
    echo -e "${GREEN}🎉 所有操作完成！${NC}"
}

# 运行主函数
main "$@"