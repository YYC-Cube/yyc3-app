#!/bin/bash

# =============================================================================
# FRP 服务端部署脚本 - 部署到 yyc3-121
# =============================================================================

set -euo pipefail

# 配置变量
REMOTE_SERVER="yyc3-121"
REMOTE_USER="root"
REMOTE_PATH="/opt/frp"
LOCAL_PATH="/Users/yanyu/www/frps"

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
    log_info "检查本地FRP服务端文件..."

    if [[ ! -f "$LOCAL_PATH/frps" ]]; then
        log_error "FRP服务端二进制文件不存在: $LOCAL_PATH/frps"
        exit 1
    fi

    if [[ ! -f "$LOCAL_PATH/frps.toml" ]]; then
        log_error "FRP服务端配置文件不存在: $LOCAL_PATH/frps.toml"
        exit 1
    fi

    if [[ ! -x "$LOCAL_PATH/frps" ]]; then
        log_warn "FRP服务端二进制文件不可执行，正在修复权限..."
        chmod +x "$LOCAL_PATH/frps"
    fi

    log_info "本地文件检查完成"
}

# 测试SSH连接
test_ssh_connection() {
    log_info "测试到 $REMOTE_SERVER 的SSH连接..."

    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_USER@$REMOTE_SERVER" "echo 'SSH连接成功'" 2>/dev/null; then
        log_info "SSH连接测试成功"
    else
        log_error "无法连接到 $REMOTE_SERVER，请检查："
        log_error "1. 服务器地址是否正确"
        log_error "2. SSH密钥是否已配置"
        log_error "3. 网络连接是否正常"
        exit 1
    fi
}

# 在远程服务器上准备环境
prepare_remote_environment() {
    log_info "在远程服务器 $REMOTE_SERVER 上准备环境..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 停止可能运行的FRP服务
systemctl stop frps 2>/dev/null || true
pkill -f frps 2>/dev/null || true

# 创建目录结构
mkdir -p /opt/frp/{bin,logs,static,scripts}
mkdir -p /etc/frp

# 创建frp用户（如果不存在）
if ! id "frp" &>/dev/null; then
    useradd -r -s /bin/false frp
    log_info "创建frp用户"
fi

# 设置权限
chown -R frp:frp /opt/frp
chmod 755 /opt/frp

echo "远程环境准备完成"
EOF

    log_info "远程环境准备完成"
}

# 传输文件到远程服务器
transfer_files() {
    log_info "传输FRP服务端文件到 $REMOTE_SERVER..."

    # 传输二进制文件
    log_info "传输FRP服务端二进制文件..."
    scp "$LOCAL_PATH/frps" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/bin/"

    # 传输配置文件
    log_info "传输FRP服务端配置文件..."
    scp "$LOCAL_PATH/frps.toml" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/"

    # 传输其他必要文件
    if [[ -d "$LOCAL_PATH/static" ]]; then
        log_info "传输静态文件..."
        scp -r "$LOCAL_PATH/static"/* "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/static/"
    fi

    # 传输systemd服务文件
    if [[ -f "$LOCAL_PATH/scripts/frps.service" ]]; then
        log_info "传输systemd服务文件..."
        scp "$LOCAL_PATH/scripts/frps.service" "$REMOTE_USER@$REMOTE_SERVER:/etc/systemd/system/"
    fi

    log_info "文件传输完成"
}

# 配置远程服务
configure_remote_service() {
    log_info "配置远程FRP服务..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 设置权限
chmod +x /opt/frp/bin/frps
chmod 644 /opt/frp/frps.toml
chown -R frp:frp /opt/frp

# 创建日志文件
touch /opt/frp/logs/frps.log
chown frp:frp /opt/frp/logs/frps.log

# 重新加载systemd
systemctl daemon-reload

# 启用FRP服务
systemctl enable frps

echo "远程服务配置完成"
EOF

    log_info "远程服务配置完成"
}

# 启动FRP服务
start_frp_service() {
    log_info "启动FRP服务..."

    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
# 启动FRP服务
systemctl start frps

# 等待服务启动
sleep 3

# 检查服务状态
if systemctl is-active --quiet frps; then
    echo "FRP服务启动成功"
    systemctl status frps --no-pager -l
else
    echo "FRP服务启动失败"
    systemctl status frps --no-pager -l
    journalctl -u frps --no-pager -n 20
    exit 1
fi

# 检查端口监听
if netstat -tlnp | grep -q ":17000 "; then
    echo "FRP服务端口17000监听正常"
else
    echo "警告: FRP服务端口17000未监听"
fi

if netstat -tlnp | grep -q ":7500 "; then
    echo "FRP仪表板端口7500监听正常"
else
    echo "警告: FRP仪表板端口7500未监听"
fi
EOF

    if [[ $? -eq 0 ]]; then
        log_info "FRP服务启动成功"
    else
        log_error "FRP服务启动失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证FRP服务部署..."

    # 检查服务状态
    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
echo "=== FRP服务状态 ==="
systemctl status frps --no-pager

echo -e "\n=== 端口监听状态 ==="
netstat -tlnp | grep -E "(17000|7500)" || echo "未找到监听端口"

echo -e "\n=== 进程状态 ==="
ps aux | grep frps | grep -v grep || echo "未找到frps进程"

echo -e "\n=== 日志最后10行 ==="
tail -10 /opt/frp/logs/frps.log || echo "无法读取日志文件"
EOF

    log_info "部署验证完成"
}

# 主函数
main() {
    log_info "开始FRP服务端部署到 $REMOTE_SERVER..."

    check_local_files
    test_ssh_connection
    prepare_remote_environment
    transfer_files
    configure_remote_service
    start_frp_service
    verify_deployment

    log_info "FRP服务端部署完成！"
    log_info "访问信息："
    log_info "- 服务地址: $REMOTE_SERVER:17000"
    log_info "- 仪表板: http://$REMOTE_SERVER:7500"
    log_info "- 用户名: frp_admin"
    log_info "- 配置文件: /opt/frp/frps.toml"
    log_info "- 日志文件: /opt/frp/logs/frps.log"
}

# 执行主函数
main "$@"