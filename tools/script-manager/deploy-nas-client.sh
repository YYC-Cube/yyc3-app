#!/bin/bash

# =============================================================================
# FRP NAS 客户端部署脚本 - 部署到 yyc3-45 (铁威马 F4-423 NAS)
# =============================================================================

set -euo pipefail

# 配置变量
REMOTE_SERVER="192.168.3.45"
REMOTE_USER="root"
REMOTE_PATH="/Volume1/www/frpc"
LOCAL_PATH="/Users/yanyu/www/frpc"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 检查本地文件
check_local_files() {
    log_info "检查本地FRP客户端文件..."

    if [[ ! -f "$LOCAL_PATH/frpc" ]]; then
        log_error "FRP客户端二进制文件不存在: $LOCAL_PATH/frpc"
        exit 1
    fi

    if [[ ! -f "$LOCAL_PATH/frpc-nas.toml" ]]; then
        log_error "FRP客户端配置文件不存在: $LOCAL_PATH/frpc-nas.toml"
        exit 1
    fi

    if [[ ! -f "$LOCAL_PATH/ca.pem" ]]; then
        log_error "CA证书文件不存在: $LOCAL_PATH/ca.pem"
        exit 1
    fi

    if [[ ! -x "$LOCAL_PATH/frpc" ]]; then
        log_warn "FRP客户端二进制文件不可执行，正在修复权限..."
        chmod +x "$LOCAL_PATH/frpc"
    fi

    log_info "本地文件检查完成"
}

# 检查NAS架构
check_nas_architecture() {
    log_info "检查NAS服务器架构..."

    local arch=$(ssh "$REMOTE_USER@$REMOTE_SERVER" "uname -m" 2>/dev/null || echo "unknown")

    case "$arch" in
        x86_64)
            log_info "NAS架构: x86_64 (兼容)"
            ;;
        aarch64|arm64)
            log_info "NAS架构: ARM64 (需要ARM64二进制文件)"
            # 检查是否需要下载ARM64版本
            if ! file "$LOCAL_PATH/frpc" | grep -q "ARM"; then
                log_warn "当前二进制文件与NAS架构不匹配，可能需要重新下载"
            fi
            ;;
        *)
            log_error "不支持的NAS架构: $arch"
            exit 1
            ;;
    esac

    log_info "架构检查完成"
}

# 测试SSH连接
test_ssh_connection() {
    log_info "测试到NAS $REMOTE_SERVER 的SSH连接..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_USER@$REMOTE_SERVER" "echo 'SSH连接成功'" 2>/dev/null; then
        log_info "SSH连接测试成功"
    else
        log_error "无法连接到NAS $REMOTE_SERVER，请检查："
        log_error "1. NAS地址是否正确 (当前: $REMOTE_SERVER)"
        log_error "2. SSH密钥是否已配置"
        log_error "3. NAS网络连接是否正常"
        log_error "4. NAS SSH服务是否启用"
        exit 1
    fi
}

# 在NAS上准备环境
prepare_nas_environment() {
    log_info "在NAS $REMOTE_SERVER 上准备环境..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 停止可能运行的FRP客户端服务
systemctl stop frpc 2>/dev/null || true
pkill -f frpc 2>/dev/null || true

# 创建目录结构
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp

# 检查是否需要创建frp用户（NAS可能不需要专用用户）
# id frp &>/dev/null || useradd -r -s /bin/false frp

# 设置目录权限
chmod 755 /Volume1/www/frpc
chmod 755 /Volume1/www/frpc/logs

echo "NAS环境准备完成"
EOF

    log_info "NAS环境准备完成"
}

# 传输文件到NAS
transfer_files_to_nas() {
    log_info "传输FRP客户端文件到NAS $REMOTE_SERVER..."

    # 传输二进制文件
    log_info "传输FRP客户端二进制文件..."
    scp "$LOCAL_PATH/frpc" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/"

    # 传输配置文件
    log_info "传输FRP客户端配置文件..."
    scp "$LOCAL_PATH/frpc-nas.toml" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/frpc.toml"

    # 传输CA证书
    log_info "传输CA证书文件..."
    scp "$LOCAL_PATH/ca.pem" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/"

    # 传输systemd服务文件（如果存在）
    if [[ -f "$LOCAL_PATH/scripts/frpc.service" ]]; then
        log_info "传输systemd服务文件..."
        scp "$LOCAL_PATH/scripts/frpc.service" "$REMOTE_USER@$REMOTE_SERVER:/etc/systemd/system/"
    fi

    log_info "文件传输完成"
}

# 配置NAS服务
configure_nas_service() {
    log_info "配置NAS FRP客户端服务..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 设置权限
chmod +x /Volume1/www/frpc/frpc
chmod 644 /Volume1/www/frpc/frpc.toml
chmod 644 /Volume1/www/frpc/ca.pem
chown -R root:root /Volume1/www/frpc

# 创建日志文件
touch /Volume1/www/frpc/logs/frpc.log
chmod 644 /Volume1/www/frpc/logs/frpc.log

# 创建systemd服务文件（如果不存在）
if [[ ! -f "/etc/systemd/system/frpc.service" ]]; then
    cat > /etc/systemd/system/frpc.service << 'SERVICE'
[Unit]
Description=Frp Client Service
After=network.target

[Service]
Type=simple
User=root
Group=root
Restart=on-failure
RestartSec=5s
ExecStart=/Volume1/www/frpc/frpc -c /Volume1/www/frpc/frpc.toml
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
ReadWritePaths=/Volume1/www/frpc/logs

[Install]
WantedBy=multi-user.target
SERVICE
fi

# 重新加载systemd
systemctl daemon-reload

# 启用FRP客户端服务
systemctl enable frpc

echo "NAS服务配置完成"
EOF

    log_info "NAS服务配置完成"
}

# 启动FRP客户端服务
start_frp_client() {
    log_info "启动NAS FRP客户端服务..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 启动FRP客户端服务
systemctl start frpc

# 等待服务启动
sleep 5

# 检查服务状态
if systemctl is-active --quiet frpc; then
    echo "FRP客户端服务启动成功"
    systemctl status frpc --no-pager -l
else
    echo "FRP客户端服务启动失败"
    systemctl status frpc --no-pager -l
    journalctl -u frpc --no-pager -n 20
    exit 1
fi

# 检查进程
if pgrep -f frpc > /dev/null; then
    echo "FRP客户端进程运行正常"
    ps aux | grep frpc | grep -v grep
else
    echo "警告: 未找到frpc进程"
fi
EOF

    if [[ $? -eq 0 ]]; then
        log_info "FRP客户端服务启动成功"
    else
        log_error "FRP客户端服务启动失败"
        exit 1
    fi
}

# 验证NAS部署
verify_nas_deployment() {
    log_info "验证NAS FRP客户端部署..."

    # 检查服务状态
    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
echo "=== FRP客户端服务状态 ==="
systemctl status frpc --no-pager

echo -e "\n=== 进程状态 ==="
ps aux | grep frpc | grep -v grep || echo "未找到frpc进程"

echo -e "\n=== 网络连接状态 ==="
netstat -an | grep ESTABLISHED | grep -E "(17000|8.130.127.121)" || echo "未找到到服务器的连接"

echo -e "\n=== 日志最后10行 ==="
tail -10 /Volume1/www/frpc/logs/frpc.log || echo "无法读取日志文件"

echo -e "\n=== 管理界面状态 ==="
netstat -tlnp | grep ":7400 " || echo "管理界面端口7400未监听"
EOF

    log_info "NAS部署验证完成"
}

# 显示部署信息
show_deployment_info() {
    log_info "NAS FRP客户端部署完成！"
    log_info ""
    log_info "访问信息："
    log_info "- NAS地址: $REMOTE_SERVER"
    log_info "- 服务端地址: 8.130.127.121:17000"
    log_info "- 管理界面: http://$REMOTE_SERVER:7400"
    log_info "- 管理用户名: nas_admin"
    log_info "- 配置文件: /Volume1/www/frpc/frpc.toml"
    log_info "- 日志文件: /Volume1/www/frpc/logs/frpc.log"
    log_info ""
    log_info "服务映射："
    log_info "- SSH: docker.0379.email:9557 -> NAS:57"
    log_info "- NAS管理: nas.0379.email -> NAS:80"
    log_info "- API服务: api.0379.email -> NAS:3000"
    log_info "- 管理面板: admin.0379.email -> NAS:3001"
    log_info "- LLM服务: llm.0379.email -> NAS:3002"
    log_info "- 邮件服务: mail.0379.email -> NAS:3003"
    log_info "- 数据库: mysql.0379.email:3307 -> NAS:3306"
    log_info "- 缓存: redis.0379.email:6378 -> NAS:6379"
    log_info "- 文件服务: files.0379.email -> NAS:8081"
}

# 主函数
main() {
    log_info "开始FRP NAS客户端部署到 $REMOTE_SERVER..."

    check_local_files
    check_nas_architecture
    test_ssh_connection
    prepare_nas_environment
    transfer_files_to_nas
    configure_nas_service
    start_frp_client
    verify_nas_deployment
    show_deployment_info
}

# 执行主函数
main "$@"