#!/bin/bash
# =============================================================================
# FRP 客户端 (FRPC) 自启动配置脚本 - NAS服务器
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
FRP_VERSION="0.61.1"
FRP_DIR="/opt/frpc"
FRP_USER="frp"
SERVICE_NAME="frpc"
CONFIG_FILE="/opt/frpc/conf/frpc.toml"
LOG_DIR="/opt/frpc/logs"
PID_FILE="/var/run/frpc.pid"
SERVER_IP="8.130.127.121"
SERVER_PORT="17000"
TOKEN="WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg="
ADMIN_USER="frp_admin"
ADMIN_PWD="m5ODDD1oPMYKfhHG31A3tQ=="

# 本地服务映射配置
declare -A SERVICES=(
    ["api-0379"]="192.168.3.45,3000,5001,api.0379.email"
    ["llm-0379"]="192.168.3.45,8000,5002,llm.0379.email"
    ["admin-0379"]="192.168.3.45,3001,5003,admin.0379.email"
    ["mail-0379"]="192.168.3.45,3003,5004,mail.0379.email"
    ["nas-0379"]="192.168.3.45,80,5005,nas.0379.email"
    ["monitor-0379"]="192.168.3.45,3000,5006,monitor.0379.email"
    ["ssh-nas"]="192.168.3.45,22,9557,"
)

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 创建FRP用户
create_frp_user() {
    log_info "创建FRP用户..."
    if ! id "$FRP_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $FRP_DIR $FRP_USER
        log_success "FRP用户创建成功"
    else
        log_warning "FRP用户已存在"
    fi
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    mkdir -p $FRP_DIR/{bin,conf,logs,scripts,backups}
    mkdir -p $LOG_DIR
    chown -R $FRP_USER:$FRP_USER $FRP_DIR
    log_success "目录结构创建完成"
}

# 下载和安装FRP
install_frp() {
    log_info "下载和安装FRP客户端..."

    if [[ ! -f "$FRP_DIR/bin/frpc" ]]; then
        cd /tmp
        wget "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz"
        tar -xzf "frp_${FRP_VERSION}_linux_amd64.tar.gz"

        cp frp_${FRP_VERSION}_linux_amd64/frpc $FRP_DIR/bin/
        chmod +x $FRP_DIR/bin/frpc

        rm -rf frp_${FRP_VERSION}_linux_amd64*
        cd $FRP_DIR

        chown -R $FRP_USER:$FRP_USER $FRP_DIR
        log_success "FRP客户端安装完成"
    else
        log_warning "FRP客户端已安装"
    fi
}

# 生成配置文件
generate_config() {
    log_info "生成FRP客户端配置文件..."

    cat > $CONFIG_FILE << EOF
[common]
# =============================================================================
# FRP 客户端配置 - NAS服务器
# =============================================================================

# 服务器连接配置
server_addr = $SERVER_IP
server_port = $SERVER_PORT
token = "$TOKEN"
authentication_method = token
authenticate_heartbeats = true
authenticate_new_work_conns = true

# 客户端管理配置
admin_addr = 127.0.0.1
admin_port = 7400
admin_user = "$ADMIN_USER"
admin_pwd = "$ADMIN_PWD"

# 日志配置
log_file = $LOG_DIR/frpc.log
log_level = info
log_max_days = 7
tcp_mux = true
heartbeat_timeout = 60
heartbeat_interval = 30

# 连接池配置
pool_count = 5
tcp_mux = true
login_fail_exit = false
user = nas_client

# 启动加密
tls_enable = false

# =============================================================================
# 代理服务配置
# =============================================================================
EOF

    # 添加服务配置
    for service_name in "${!SERVICES[@]}"; do
        IFS=',' read -r local_ip local_port remote_port custom_domain <<< "${SERVICES[$service_name]}"

        cat >> $CONFIG_FILE << EOF

# $service_name 服务
[$service_name]
type = tcp
local_ip = $local_ip
local_port = $local_port
remote_port = $remote_port
use_encryption = true
use_compression = true
EOF

        # 如果有自定义域名，添加域名配置
        if [[ -n "$custom_domain" ]]; then
            echo "custom_domains = $custom_domain" >> $CONFIG_FILE
        fi
    done

    chown $FRP_USER:$FRP_USER $CONFIG_FILE
    chmod 644 $CONFIG_FILE
    log_success "配置文件生成完成"
}

# 备份现有配置
backup_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        backup_file="$FRP_DIR/backups/frpc.toml.backup.$(date +%Y%m%d_%H%M%S)"
        cp $CONFIG_FILE $backup_file
        log_info "现有配置已备份到: $backup_file"
    fi
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."

    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Frp Client Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$FRP_USER
Group=$FRP_USER
Restart=on-failure
RestartSec=10s
ExecStart=$FRP_DIR/bin/frpc -c $CONFIG_FILE
ExecReload=/bin/kill -s HUP \$MAINPID
ExecStop=/bin/kill -s TERM \$MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}
TimeoutStartSec=30
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    log_success "systemd服务创建完成"
}

# 创建日志轮转配置
setup_logrotate() {
    log_info "设置日志轮转..."

    cat > /etc/logrotate.d/${SERVICE_NAME} << EOF
$LOG_DIR/frpc.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $FRP_USER $FRP_USER
    postrotate
        systemctl reload ${SERVICE_NAME} > /dev/null 2>&1 || true
    endscript
}
EOF

    log_success "日志轮转设置完成"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."

    cat > $FRP_DIR/scripts/monitor.sh << 'EOF'
#!/bin/bash
# FRP客户端监控脚本

FRP_SERVICE="frpc"
LOG_FILE="/opt/frpc/logs/monitor.log"
SERVER_IP="8.130.127.121"
SERVER_PORT="17000"

# 检查服务状态
check_service_status() {
    if systemctl is-active --quiet $FRP_SERVICE; then
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 服务运行正常" >> $LOG_FILE
        return 0
    else
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 服务异常，尝试重启" >> $LOG_FILE
        systemctl restart $FRP_SERVICE
        return 1
    fi
}

# 检查服务器连接
check_server_connection() {
    if timeout 5 bash -c "</dev/tcp/$SERVER_IP/$SERVER_PORT"; then
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 服务器连接正常" >> $LOG_FILE
        return 0
    else
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 服务器连接异常" >> $LOG_FILE
        return 1
    fi
}

# 检查代理状态
check_proxy_status() {
    # 检查本地服务是否可达
    services=("192.168.3.45:3000" "192.168.3.45:3001" "192.168.3.45:8000" "192.168.3.45:3003")
    for service in "${services[@]}"; do
        if timeout 3 bash -c "</dev/tcp/$service"; then
            echo "$(date "+%Y-%m-%d %H:%M:%S") - 代理服务 $service 正常" >> $LOG_FILE
        else
            echo "$(date "+%Y-%m-%d %H:%M:%S") - 代理服务 $service 异常" >> $LOG_FILE
        fi
    done
}

# 检查系统资源
check_system_resources() {
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo "$(date "+%Y-%m-%d %H:%M:%S") - CPU使用率: $cpu_usage%, 内存使用率: $mem_usage%" >> $LOG_FILE
}

# 执行检查
check_service_status
check_server_connection
check_proxy_status
check_system_resources
EOF

    chmod +x $FRP_DIR/scripts/monitor.sh
    chown $FRP_USER:$FRP_USER $FRP_DIR/scripts/monitor.sh

    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $FRP_DIR/scripts/monitor.sh") | crontab -

    log_success "监控脚本创建完成"
}

# 创建健康检查脚本
create_health_check_script() {
    log_info "创建健康检查脚本..."

    cat > $FRP_DIR/scripts/health_check.sh << 'EOF'
#!/bin/bash
# FRP客户端健康检查脚本

FRP_SERVICE="frpc"
CONFIG_FILE="/opt/frpc/conf/frpc.toml"
ADMIN_URL="http://127.0.0.1:7400"

echo "=== FRP客户端健康检查 ==="
echo "检查时间: $(date)"
echo

# 检查服务状态
echo "1. 服务状态:"
if systemctl is-active --quiet $FRP_SERVICE; then
    echo "  ✅ 服务运行正常"
else
    echo "  ❌ 服务未运行"
    echo "  尝试启动服务..."
    systemctl start $FRP_SERVICE
    sleep 5
fi

# 检查配置文件
echo "2. 配置文件:"
if [[ -f "$CONFIG_FILE" ]]; then
    echo "  ✅ 配置文件存在: $CONFIG_FILE"
    echo "  配置文件大小: $(stat -c%s $CONFIG_FILE) 字节"
else
    echo "  ❌ 配置文件不存在"
fi

# 检查进程
echo "3. 进程状态:"
if pgrep -f "frpc -c" > /dev/null; then
    echo "  ✅ FRP进程正在运行"
    echo "  进程PID: $(pgrep -f 'frpc -c')"
else
    echo "  ❌ FRP进程未运行"
fi

# 检查端口连接
echo "4. 服务器连接:"
SERVER_IP=$(grep "server_addr" $CONFIG_FILE | cut -d' ' -f3 | tr -d '"')
SERVER_PORT=$(grep "server_port" $CONFIG_FILE | cut -d' ' -f3 | tr -d '"')

if timeout 5 bash -c "</dev/tcp/$SERVER_IP/$SERVER_PORT"; then
    echo "  ✅ 服务器连接正常 ($SERVER_IP:$SERVER_PORT)"
else
    echo "  ❌ 服务器连接失败 ($SERVER_IP:$SERVER_PORT)"
fi

# 检查代理服务
echo "5. 代理服务状态:"
local_services=("192.168.3.45:3000" "192.168.3.45:3001" "192.168.3.45:8000" "192.168.3.45:3003" "192.168.3.45:22")

for service in "${local_services[@]}"; do
    service_name=$(echo $service | cut -d: -f3)
    if [[ "$service_name" == "3000" ]]; then service_name="API服务"
    elif [[ "$service_name" == "3001" ]]; then service_name="管理后台"
    elif [[ "$service_name" == "8000" ]]; then service_name="AI服务"
    elif [[ "$service_name" == "3003" ]]; then service_name="邮件服务"
    elif [[ "$service_name" == "22" ]]; then service_name="SSH服务"
    fi

    if timeout 3 bash -c "</dev/tcp/$service"; then
        echo "  ✅ $service_name ($service) 可达"
    else
        echo "  ❌ $service_name ($service) 不可达"
    fi
done

# 显示日志
echo "6. 最近日志:"
if [[ -f "/opt/frpc/logs/frpc.log" ]]; then
    echo "  最近10行日志:"
    tail -10 /opt/frpc/logs/frpc.log | sed 's/^/    /'
else
    echo "  无日志文件"
fi

echo
echo "=== 健康检查完成 ==="
EOF

    chmod +x $FRP_DIR/scripts/health_check.sh
    chown $FRP_USER:$FRP_USER $FRP_DIR/scripts/health_check.sh
    log_success "健康检查脚本创建完成"
}

# 测试服务
test_service() {
    log_info "测试FRP客户端服务..."

    # 启动服务
    systemctl start $SERVICE_NAME
    sleep 10

    # 检查服务状态
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "FRP客户端服务启动成功"
    else
        log_error "FRP客户端服务启动失败"
        systemctl status $SERVICE_NAME
        journalctl -u $SERVICE_NAME --no-pager -n 20
        exit 1
    fi

    # 检查进程
    if pgrep -f "frpc -c" > /dev/null; then
        log_success "FRP进程运行正常"
    else
        log_error "FRP进程未运行"
        exit 1
    fi

    # 运行健康检查
    $FRP_DIR/scripts/health_check.sh
}

# 显示状态信息
show_status() {
    log_info "服务状态信息:"
    echo "服务状态: $(systemctl is-active $SERVICE_NAME)"
    echo "开机自启: $(systemctl is-enabled $SERVICE_NAME)"
    echo "配置文件: $CONFIG_FILE"
    echo "日志文件: $LOG_DIR/frpc.log"
    echo "管理面板: http://127.0.0.1:7400"
    echo "监控脚本: $FRP_DIR/scripts/monitor.sh"
    echo "健康检查: $FRP_DIR/scripts/health_check.sh"

    # 显示代理配置
    echo -e "\n📋 代理服务配置:"
    for service_name in "${!SERVICES[@]}"; do
        IFS=',' read -r local_ip local_port remote_port custom_domain <<< "${SERVICES[$service_name]}"
        echo "  $service_name: $local_ip:$local_port → :$remote_port"
        if [[ -n "$custom_domain" ]]; then
            echo "    域名: $custom_domain"
        fi
    done
}

# 主函数
main() {
    echo "🔧 === FRP客户端自启动配置脚本 ===" && echo

    check_root

    log_info "开始配置FRP客户端自启动..."

    backup_config
    create_frp_user
    create_directories
    install_frp
    generate_config
    create_systemd_service
    setup_logrotate
    create_monitoring_script
    create_health_check_script
    test_service
    show_status

    log_success "FRP客户端自启动配置完成！"
    echo
    echo "📋 管理命令:"
    echo "  启动服务: systemctl start $SERVICE_NAME"
    echo "  停止服务: systemctl stop $SERVICE_NAME"
    echo "  重启服务: systemctl restart $SERVICE_NAME"
    echo "  查看状态: systemctl status $SERVICE_NAME"
    echo "  查看日志: journalctl -u $SERVICE_NAME -f"
    echo "  配置文件: $CONFIG_FILE"
    echo "  管理面板: http://127.0.0.1:7400"
    echo "  健康检查: $FRP_DIR/scripts/health_check.sh"
    echo
    echo "🔍 监控检查:"
    echo "  手动监控: $FRP_DIR/scripts/monitor.sh"
    echo "  自动监控: 每5分钟执行一次 (crontab)"
}

# 执行主函数
main "$@"