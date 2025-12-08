#!/bin/bash

# =============================================================================
# NAS 生产环境部署脚本
# 针对铁威马 F4-423 NAS 的完整部署方案
# =============================================================================

set -euo pipefail

# NAS 配置
NAS_NAME="YanYuCloud"
NAS_IP="192.168.3.45"
NAS_PORT="57"
NAS_USER="root"
VOLUME1="/yyc3-hd"
VOLUME2="/yyc3-sd"

# 本地项目路径
PROJECT_ROOT="/Users/yanyu/www"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] [$level] $message"
}

# 检查SSH连接
check_ssh_connection() {
    log "INFO" "检查NAS SSH连接: $NAS_USER@$NAS_IP:$NAS_PORT"

    if ssh -p $NAS_PORT -o ConnectTimeout=10 -o BatchMode=yes "$NAS_USER@$NAS_IP" "echo 'SSH连接成功'" >/dev/null 2>&1; then
        log "INFO" "✅ SSH连接正常"
        return 0
    else
        log "ERROR" "❌ SSH连接失败"
        return 1
    fi
}

# 在NAS上创建目录结构
create_nas_directories() {
    log "INFO" "在NAS上创建目录结构..."

    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
echo "开始创建NAS目录结构..."

# Volume1 (SSD) - 系统和应用
mkdir -p /yyc3-hd/{www/{html,api,admin,llm,mail},docker/{redis,nginx,mariadb,monitoring,files,backup},app/{api,admin,llm,mail},logs}

# Volume2 (HDD) - 数据和备份
mkdir -p /yyc3-sd/{share/{public,private,backup},backup/{daily,weekly,monthly},media/{videos,photos,music},archive}

# 设置权限
chmod 755 /yyc3-hd
chmod 755 /yyc3-sd
chmod -R 755 /yyc3-hd/www
chmod -R 755 /yyc3-sd/share

echo "NAS目录结构创建完成"
EOF

    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ NAS目录结构创建成功"
    else
        log "ERROR" "❌ NAS目录结构创建失败"
        return 1
    fi
}

# 部署FRP客户端到NAS
deploy_frp_client() {
    log "INFO" "部署FRP客户端到NAS..."

    # 复制FRP客户端文件
    log "INFO" "复制FRP客户端二进制文件..."
    scp -P $NAS_PORT "$PROJECT_ROOT/frpc/frpc" "$NAS_USER@$NAS_IP:/yyc3-hd/www/frpc/"

    # 复制配置文件
    log "INFO" "复制FRP客户端配置文件..."
    scp -P $NAS_PORT "$PROJECT_ROOT/frpc/frpc-nas.toml" "$NAS_USER@$NAS_IP:/yyc3-hd/www/frpc/frpc.toml"
    scp -P $NAS_PORT "$PROJECT_ROOT/frpc/ca.pem" "$NAS_USER@$NAS_IP:/yyc3-hd/www/frpc/"

    # 复制systemd服务文件
    log "INFO" "复制systemd服务文件..."
    scp -P $NAS_PORT "$PROJECT_ROOT/etc/systemd/system/frpc-nas.service" "$NAS_USER@$NAS_IP:/tmp/frpc.service"

    # 在NAS上安装服务
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
echo "开始安装FRP客户端服务..."

# 设置执行权限
chmod +x /yyc3-hd/www/frpc/frpc

# 创建日志目录
mkdir -p /yyc3-hd/www/frpc/logs

# 创建systemd服务目录
mkdir -p /etc/systemd/system

# 安装systemd服务
cp /tmp/frpc.service /etc/systemd/system/frpc.service
systemctl daemon-reload
systemctl enable frpc

# 验证配置文件
/yyc3-hd/www/frpc/frpc -c /yyc3-hd/www/frpc/frpc.toml --check

echo "FRP客户端安装完成"
EOF

    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ FRP客户端部署成功"
    else
        log "ERROR" "❌ FRP客户端部署失败"
        return 1
    fi
}

# 部署Docker环境
deploy_docker() {
    log "INFO" "部署Docker环境到NAS..."

    # 检查Docker是否已安装
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" "command -v docker >/dev/null 2>&1"
    local docker_installed=$?

    if [[ $docker_installed -ne 0 ]]; then
        log "WARNING" "Docker未安装，跳过Docker部署"
        log "INFO" "请手动在NAS上安装Docker"
        return 0
    fi

    # 复制Docker Compose文件
    log "INFO" "复制Docker Compose配置..."
    scp -P $NAS_PORT "$PROJECT_ROOT/docker/nas-docker-compose.yml" "$NAS_USER@$NAS_IP:/yyc3-hd/docker/docker-compose.yml"

    # 复制配置文件
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
echo "配置Docker环境..."

# 创建Redis配置
mkdir -p /yyc3-hd/docker/redis/conf
cat > /yyc3-hd/docker/redis/conf/redis.conf << 'RECONF'
bind 0.0.0.0
port 6379
requirepass redis123456
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
RECONF

# 创建MariaDB配置
mkdir -p /yyc3-hd/docker/mariadb/conf
cat > /yyc3-hd/docker/mariadb/conf/my.cnf << 'MARIA'
[mysqld]
bind-address = 0.0.0.0
port = 3306
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
query_cache_type = 1
query_cache_size = 64M
slow_query_log = 1
long_query_time = 2
MARIA

# 创建Nginx配置
mkdir -p /yyc3-hd/docker/nginx/conf
cp /yyc3-hd/docker/conf/nas-web.conf /yyc3-hd/docker/nginx/conf/default.conf

echo "Docker配置完成"
EOF

    log "INFO" "✅ Docker环境配置完成"
}

# 部署Web服务
deploy_web_services() {
    log "INFO" "部署Web服务到NAS..."

    # 复制Nginx配置
    log "INFO" "复制Nginx配置文件..."
    scp -P $NAS_PORT "$PROJECT_ROOT/configs/nginx/nas-web.conf" "$NAS_USER@$NAS_IP:/yyc3-hd/docker/nginx/conf/"

    # 创建基础HTML页面
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
echo "创建Web服务页面..."

# 创建主页
cat > /yyc3-hd/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YanYuCloud NAS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .service { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 YanYuCloud NAS 系统</h1>
        <div class="status">
            <h3>🟢 系统运行正常</h3>
            <p>存储空间: 高性能SSD + 大容量HDD</p>
            <p>服务状态: 所有核心服务在线</p>
        </div>
        <div class="services">
            <div class="service">📁 文件共享</div>
            <div class="service">🗄️ 数据库服务</div>
            <div class="service">🚀 API接口</div>
            <div class="service">🤖 AI服务</div>
        </div>
    </div>
</body>
</html>
HTML

echo "Web服务页面创建完成"
EOF

    log "INFO" "✅ Web服务部署完成"
}

# 启动和验证服务
start_and_verify() {
    log "INFO" "启动NAS服务并验证..."

    # 启动FRP客户端
    log "INFO" "启动FRP客户端..."
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" "systemctl start frpc && systemctl status frpc --no-pager"

    # 检查FRP连接状态
    log "INFO" "检查FRP连接状态..."
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
# 检查FRP进程
pgrep -f frpc

# 检查网络连接
ss -tlnp | grep :7400
echo "FRP客户端状态检查完成"
EOF

    # 启动Docker服务（如果已安装）
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" "command -v docker >/dev/null 2>&1 && docker-compose -f /yyc3-hd/docker/docker-compose.yml up -d" || log "INFO" "Docker未安装，跳过Docker启动"

    # 等待服务启动
    sleep 10

    # 验证服务
    log "INFO" "验证服务状态..."
    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
echo "=== 服务状态验证 ==="

# FRP服务状态
echo "FRP服务:"
systemctl is-active frpc

# 端口监听状态
echo -e "\n监听端口:"
ss -tlnp | grep -E ":(57|80|3000|3001|3002|3003|6379|3306|8081)"

# 磁盘使用情况
echo -e "\n磁盘使用:"
df -h | grep -E "Filesystem|yyc3"

# 内存使用
echo -e "\n内存使用:"
free -h
EOF
}

# 创建监控脚本
create_monitoring_script() {
    log "INFO" "创建NAS监控脚本..."

    ssh -p $NAS_PORT "$NAS_USER@$NAS_IP" << 'EOF'
cat > /yyc3-hd/scripts/nas-monitor.sh << 'MONITOR'
#!/bin/bash

# NAS系统监控脚本
LOG_FILE="/yyc3-hd/logs/nas-monitor.log"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

echo "[$DATE] === NAS系统监控 ===" >> $LOG_FILE

# 系统负载
echo "系统负载:" >> $LOG_FILE
uptime >> $LOG_FILE

# 内存使用
echo -e "\n内存使用:" >> $LOG_FILE
free -h >> $LOG_FILE

# 磁盘使用
echo -e "\n磁盘使用:" >> $LOG_FILE
df -h >> $LOG_FILE

# 服务状态
echo -e "\nFRP服务状态:" >> $LOG_FILE
systemctl is-active frpc >> $LOG_FILE

echo -e "\nDocker服务状态:" >> $LOG_FILE
docker ps --format "table {{.Names}}\t{{.Status}}" >> $LOG_FILE 2>/dev/null || echo "Docker未运行" >> $LOG_FILE

echo -e "\n=== 监控完成 ===\n" >> $LOG_FILE

# 清理旧日志（保留30天）
find /yyc3-hd/logs -name "*.log" -mtime +30 -delete
MONITOR

chmod +x /yyc3-hd/scripts/nas-monitor.sh

# 添加到crontab
echo "添加监控任务到crontab..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /yyc3-hd/scripts/nas-monitor.sh") | crontab -

echo "监控脚本创建完成"
EOF

    log "INFO" "✅ 监控脚本创建完成"
}

# 显示部署信息
show_deployment_info() {
    echo -e "\n${CYAN}=== NAS生产环境部署完成 ===${NC}"
    echo -e "🏠 NAS名称: $NAS_NAME"
    echo -e "🌐 IP地址: $NAS_IP"
    echo -e "🔌 SSH端口: $NAS_PORT"
    echo -e ""
    echo -e "${GREEN}🚀 已部署的服务:${NC}"
    echo -e "  ✅ FRP客户端 - 内网穿透"
    echo -e "  ✅ Web服务器 - Nginx"
    echo -e "  ✅ 基础HTML页面"
    echo -e "  ✅ 监控脚本"
    echo ""
    echo -e "${BLUE}📡 外网访问地址:${NC}"
    echo -e "  🌐 NAS管理: http://nas.0379.email"
    echo -e "  🔌 SSH访问: ssh -p 9557 yyc3@8.130.127.121"
    echo -e "  📁 文件共享: http://files.0379.email"
    echo -e "  🔌 API服务: http://api.0379.email"
    echo ""
    echo -e "${YELLOW}🔧 管理命令:${NC}"
    echo -e "  SSH连接: ssh -p $NAS_PORT $NAS_USER@$NAS_IP"
    echo -e "  FRP状态: systemctl status frpc"
    echo -e "  查看日志: journalctl -u frpc -f"
    echo -e "  系统监控: /yyc3-hd/scripts/nas-monitor.sh"
}

# 主函数
main() {
    echo -e "${BLUE}🖥️  NAS 生产环境部署工具${NC}"
    echo -e "${BLUE}目标设备: $NAS_NAME ($NAS_IP)${NC}"
    echo ""

    # 检查SSH连接
    if ! check_ssh_connection; then
        log "ERROR" "无法连接到NAS服务器"
        exit 1
    fi

    # 执行部署步骤
    create_nas_directories
    deploy_frp_client
    deploy_docker
    deploy_web_services
    start_and_verify
    create_monitoring_script

    # 显示部署信息
    show_deployment_info

    echo -e "\n${GREEN}🎉 NAS生产环境部署完成！${NC}"
}

# 显示帮助信息
show_help() {
    cat << EOF
NAS生产环境部署脚本

用法:
    $0 [选项]

选项:
    -h, --help        显示帮助信息
    -c, --check       仅检查SSH连接
    -f, --frp         仅部署FRP客户端
    -d, --docker      仅部署Docker环境
    -w, --web         仅部署Web服务
    -s, --start       仅启动和验证服务

NAS配置:
    设备型号: 铁威马 F4-423
    IP地址: $NAS_IP
    SSH端口: $NAS_PORT
    存储: SSD RAID1 + HDD RAID6

EOF
}

# 参数解析
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -c|--check)
        check_ssh_connection
        ;;
    -f|--frp)
        check_ssh_connection || exit 1
        deploy_frp_client
        ;;
    -d|--docker)
        check_ssh_connection || exit 1
        deploy_docker
        ;;
    -w|--web)
        check_ssh_connection || exit 1
        deploy_web_services
        ;;
    -s|--start)
        check_ssh_connection || exit 1
        start_and_verify
        ;;
    "")
        main
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac