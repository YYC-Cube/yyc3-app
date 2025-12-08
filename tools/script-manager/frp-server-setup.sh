#!/bin/bash
# =============================================================================
# FRP 服务端 (FRPS) 自启动配置脚本 - yyc3-121 服务器
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
FRP_DIR="/opt/frp"
FRP_USER="frp"
SERVICE_NAME="frps"
CONFIG_FILE="/opt/frp/conf/frps.toml"
LOG_DIR="/opt/frp/logs"
PID_FILE="/var/run/frps.pid"

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
    mkdir -p $FRP_DIR/{bin,conf,logs,scripts}
    mkdir -p $LOG_DIR
    chown -R $FRP_USER:$FRP_USER $FRP_DIR
    log_success "目录结构创建完成"
}

# 下载和安装FRP
install_frp() {
    log_info "下载和安装FRP..."

    if [[ ! -f "$FRP_DIR/bin/frps" ]]; then
        cd /tmp
        wget "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz"
        tar -xzf "frp_${FRP_VERSION}_linux_amd64.tar.gz"

        cp frp_${FRP_VERSION}_linux_amd64/frps $FRP_DIR/bin/
        cp frp_${FRP_VERSION}_linux_amd64/frpc $FRP_DIR/bin/
        chmod +x $FRP_DIR/bin/*

        rm -rf frp_${FRP_VERSION}_linux_amd64*
        cd $FRP_DIR

        chown -R $FRP_USER:$FRP_USER $FRP_DIR
        log_success "FRP安装完成"
    else
        log_warning "FRP已安装"
    fi
}

# 复制配置文件
setup_config() {
    log_info "设置FRP配置文件..."

    # 从项目目录复制配置文件
    if [[ -f "/Users/yanyu/www/NAS-frpc/frpc/frps.toml" ]]; then
        cp /Users/yanyu/www/NAS-frpc/frpc/frps.toml $CONFIG_FILE
        # 修正日志路径为生产环境路径
        sed -i 's|/Volume1/www/frpc/logs/frpc.log|/opt/frp/logs/frps.log|g' $CONFIG_FILE
    else
        log_error "FRP配置文件不存在"
        exit 1
    fi

    chown $FRP_USER:$FRP_USER $CONFIG_FILE
    chmod 644 $CONFIG_FILE
    log_success "配置文件设置完成"
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."

    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Frp Server Service
After=network.target

[Service]
Type=simple
User=$FRP_USER
Group=$FRP_USER
Restart=on-failure
RestartSec=5s
ExecStart=$FRP_DIR/bin/frps -c $CONFIG_FILE
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

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
$LOG_DIR/frps.log {
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
# FRP服务监控脚本

FRP_SERVICE="frps"
LOG_FILE="/opt/frp/logs/monitor.log"
ADMIN_URL="http://127.0.0.1:7500"

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

# 检查端口监听
check_port_listening() {
    if netstat -tuln | grep -q ":17000 "; then
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 端口监听正常" >> $LOG_FILE
        return 0
    else
        echo "$(date "+%Y-%m-%d %H:%M:%S") - 端口监听异常" >> $LOG_FILE
        return 1
    fi
}

# 检查连接数
check_connections() {
    connections=$(netstat -an | grep ":17000 " | wc -l)
    echo "$(date "+%Y-%m-%d %H:%M:%S") - 当前连接数: $connections" >> $LOG_FILE
}

# 执行检查
check_service_status
check_port_listening
check_connections
EOF

    chmod +x $FRP_DIR/scripts/monitor.sh
    chown $FRP_USER:$FRP_USER $FRP_DIR/scripts/monitor.sh

    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $FRP_DIR/scripts/monitor.sh") | crontab -

    log_success "监控脚本创建完成"
}

# 防火墙配置
setup_firewall() {
    log_info "配置防火墙规则..."

    # 检查防火墙状态
    if command -v ufw >/dev/null 2>&1; then
        # Ubuntu/Debian
        ufw allow 17000/tcp comment "FRP Server"
        ufw allow 7500/tcp comment "FRP Dashboard"
        ufw allow 9557/tcp comment "FRP SSH"
        log_success "UFW防火墙规则配置完成"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        # CentOS/RHEL
        firewall-cmd --permanent --add-port=17000/tcp --add-port=7500/tcp --add-port=9557/tcp
        firewall-cmd --reload
        log_success "firewalld防火墙规则配置完成"
    else
        log_warning "未检测到防火墙工具，请手动配置端口开放"
    fi
}

# 测试服务
test_service() {
    log_info "测试FRP服务..."

    # 启动服务
    systemctl start $SERVICE_NAME
    sleep 5

    # 检查服务状态
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "FRP服务启动成功"
    else
        log_error "FRP服务启动失败"
        systemctl status $SERVICE_NAME
        exit 1
    fi

    # 检查端口监听
    if netstat -tuln | grep -q ":17000 "; then
        log_success "FRP端口监听正常"
    else
        log_error "FRP端口监听异常"
        exit 1
    fi
}

# 显示状态信息
show_status() {
    log_info "服务状态信息:"
    echo "服务状态: $(systemctl is-active $SERVICE_NAME)"
    echo "开机自启: $(systemctl is-enabled $SERVICE_NAME)"
    echo "配置文件: $CONFIG_FILE"
    echo "日志文件: $LOG_DIR/frps.log"
    echo "管理面板: http://127.0.0.1:7500"

    # 显示端口监听
    echo -e "\n端口监听状态:"
    netstat -tuln | grep -E ":(17000|7500|9557)" || echo "无相关端口监听"
}

# 主函数
main() {
    echo "🔧 === FRP服务端自启动配置脚本 ===" && echo

    check_root

    log_info "开始配置FRP服务端自启动..."

    create_frp_user
    create_directories
    install_frp
    setup_config
    create_systemd_service
    setup_logrotate
    create_monitoring_script
    setup_firewall
    test_service
    show_status

    log_success "FRP服务端自启动配置完成！"
    echo
    echo "📋 管理命令:"
    echo "  启动服务: systemctl start $SERVICE_NAME"
    echo "  停止服务: systemctl stop $SERVICE_NAME"
    echo "  重启服务: systemctl restart $SERVICE_NAME"
    echo "  查看状态: systemctl status $SERVICE_NAME"
    echo "  查看日志: journalctl -u $SERVICE_NAME -f"
    echo "  配置文件: $CONFIG_FILE"
    echo "  管理面板: http://127.0.0.1:7500"
}

# 执行主函数
main "$@"