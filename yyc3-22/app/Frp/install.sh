#!/bin/bash

# =============================================================================
# FRP NAS 客户端自动安装脚本
# 适用于铁威马 F4-423 NAS (yyc3-45)
# =============================================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
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

# 停止现有服务
stop_existing_service() {
    log_info "停止现有的FRP服务..."
    systemctl stop frpc 2>/dev/null || true
    pkill -f frpc 2>/dev/null || true
    sleep 2
}

# 设置文件权限
set_permissions() {
    log_info "设置文件权限..."
    chmod +x /Volume2/www/frpc/frpc
    chmod 644 /Volume2/www/frpc/frpc.toml
    chmod 644 /Volume2/www/frpc/ca.pem
    chown -R root:root /Volume2/www/frpc
}

# 创建systemd服务文件
create_systemd_service() {
    log_info "创建systemd服务文件..."

    cat > /etc/systemd/system/frpc.service << 'EOF'
[Unit]
Description=Frp Client Service for NAS
After=network.target

[Service]
Type=simple
User=root
Group=root
Restart=on-failure
RestartSec=5s
ExecStart=/Volume2/www/frpc/frpc -c /Volume2/www/frpc/frpc.toml
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=frpc

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/Volume2/www/frpc/logs

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
}

# 测试配置文件
test_configuration() {
    log_info "测试配置文件..."
    if /Volume2/www/frpc/frpc -c /Volume2/www/frpc/frpc.toml -t; then
        log_info "配置文件测试通过"
    else
        log_error "配置文件测试失败"
        exit 1
    fi
}

# 启用并启动服务
start_service() {
    log_info "启用并启动FRP服务..."
    systemctl enable frpc
    systemctl start frpc

    # 等待服务启动
    sleep 5

    if systemctl is-active --quiet frpc; then
        log_info "FRP服务启动成功"
    else
        log_error "FRP服务启动失败"
        systemctl status frpc --no-pager -l
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."

    # 检查进程
    if pgrep -f frpc > /dev/null; then
        log_info "FRP进程运行正常"
    else
        log_warn "未找到FRP进程"
    fi

    # 检查端口
    if netstat -tlnp | grep -q ":7400 "; then
        log_info "管理界面端口7400监听正常"
    else
        log_warn "管理界面端口7400未监听"
    fi

    # 显示服务状态
    systemctl status frpc --no-pager

    log_info "部署验证完成"
}

# 主函数
main() {
    log_info "开始FRP NAS客户端安装..."

    check_root
    stop_existing_service
    set_permissions
    create_systemd_service
    test_configuration
    start_service
    verify_deployment

    log_info "FRP NAS客户端安装完成！"
    log_info ""
    log_info "管理信息："
    log_info "- 服务状态: systemctl status frpc"
    log_info "- 实时日志: journalctl -u frpc -f"
    log_info "- 管理界面: http://192.168.3.45:7400"
    log_info "- 配置文件: /Volume2/www/frpc/frpc.toml"
}

# 执行主函数
main "$@"