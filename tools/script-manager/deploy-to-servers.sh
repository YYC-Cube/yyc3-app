#!/bin/bash

# =============================================================================
# FRP 部署到生产服务器脚本
# 将FRP配置和二进制文件部署到对应的服务器
# =============================================================================

set -euo pipefail

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 服务器配置
FRPS_SERVER="yyc3-121"
FRPS_IP="8.130.127.121"
FRPS_USER="yyc3"

FRPC_SERVER="yyc3-45"
FRPC_IP="192.168.3.45"
FRPC_USER="root"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    local server="$1"
    local user="$2"
    local ip="$3"

    log "INFO" "检查SSH连接: $user@$ip"

    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$user@$ip" "echo 'SSH连接成功'" >/dev/null 2>&1; then
        log "INFO" "✅ SSH连接正常: $server"
        return 0
    else
        log "ERROR" "❌ SSH连接失败: $server"
        return 1
    fi
}

# 部署FRP服务端
deploy_frps() {
    log "INFO" "开始部署FRP服务端到 $FRPS_SERVER ($FRPS_IP)"

    # 创建远程目录
    ssh "$FRPS_USER@$FRPS_IP" "mkdir -p /home/$FRPS_USER/frp/{logs,config}"

    # 复制二进制文件
    log "INFO" "复制FRP服务端二进制文件..."
    scp "$PROJECT_ROOT/frps/frps" "$FRPS_USER@$FRPS_IP:/home/$FRPS_USER/frp/"

    # 复制配置文件
    log "INFO" "复制FRP服务端配置文件..."
    scp "$PROJECT_ROOT/frps/frps.toml" "$FRPS_USER@$FRPS_IP:/home/$FRPS_USER/frp/"

    # 复制systemd服务文件
    log "INFO" "复制systemd服务文件..."
    scp "$PROJECT_ROOT/etc/systemd/system/frps.service" "$FRPS_USER@$FRPS_IP:/tmp/frps.service"

    # 在远程服务器上安装服务
    ssh "$FRPS_USER@$FRPS_IP" << EOF
# 设置执行权限
chmod +x /home/$FRPS_USER/frp/frps

# 创建日志目录
mkdir -p /home/$FRPS_USER/frp/logs

# 安装systemd服务
sudo cp /tmp/frps.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable frps

# 验证配置文件语法
/home/$FRPS_USER/frp/frps -c /home/$FRPS_USER/frp/frps.toml --check || exit 1

echo "FRP服务端部署完成"
EOF

    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ FRP服务端部署成功"
    else
        log "ERROR" "❌ FRP服务端部署失败"
        return 1
    fi
}

# 部署FRP客户端
deploy_frpc() {
    log "INFO" "开始部署FRP客户端到 $FRPC_SERVER ($FRPC_IP)"

    # 创建远程目录
    ssh "$FRPC_USER@$FRPC_IP" "mkdir -p /Volume1/www/frpc/{logs,config}"

    # 复制二进制文件
    log "INFO" "复制FRP客户端二进制文件..."
    scp "$PROJECT_ROOT/frpc/frpc" "$FRPC_USER@$FRPC_IP:/Volume1/www/frpc/"

    # 复制配置文件
    log "INFO" "复制FRP客户端配置文件..."
    scp "$PROJECT_ROOT/frpc/frpc.toml" "$FRPC_USER@$FRPC_IP:/Volume1/www/frpc/"

    # 复制CA证书
    log "INFO" "复制CA证书..."
    scp "$PROJECT_ROOT/frpc/ca.pem" "$FRPC_USER@$FRPC_IP:/Volume1/www/frpc/"

    # 复制systemd服务文件
    log "INFO" "复制systemd服务文件..."
    scp "$PROJECT_ROOT/etc/systemd/system/frpc.service" "$FRPC_USER@$FRPC_IP:/tmp/frpc.service"

    # 在远程服务器上安装服务
    ssh "$FRPC_USER@$FRPC_IP" << EOF
# 设置执行权限
chmod +x /Volume1/www/frpc/frpc

# 创建日志目录
mkdir -p /Volume1/www/frpc/logs

# 安装systemd服务
cp /tmp/frpc.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable frpc

# 验证配置文件语法
/Volume1/www/frpc/frpc -c /Volume1/www/frpc/frpc.toml --check || exit 1

echo "FRP客户端部署完成"
EOF

    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ FRP客户端部署成功"
    else
        log "ERROR" "❌ FRP客户端部署失败"
        return 1
    fi
}

# 启动服务并验证
start_and_verify() {
    log "INFO" "启动FRP服务并验证..."

    # 启动FRP服务端
    log "INFO" "启动FRP服务端..."
    ssh "$FRPS_USER@$FRPS_IP" "sudo systemctl start frps && sudo systemctl status frps --no-pager"

    # 等待服务启动
    sleep 5

    # 启动FRP客户端
    log "INFO" "启动FRP客户端..."
    ssh "$FRPC_USER@$FRPC_IP" "systemctl start frpc && systemctl status frpc --no-pager"

    # 验证端口监听
    log "INFO" "验证服务端口监听..."
    ssh "$FRPS_USER@$FRPS_IP" "ss -tlnp | grep :17000"
    ssh "$FRPS_USER@$FRPS_IP" "ss -tlnp | grep :7500"

    # 检查服务状态
    log "INFO" "检查服务状态..."
    ssh "$FRPS_USER@$FRPS_IP" "sudo systemctl is-active frps"
    ssh "$FRPC_USER@$FRPC_IP" "systemctl is-active frpc"
}

# 显示连接信息
show_connection_info() {
    echo -e "\n${BLUE}=== FRP 内网穿透连接信息 ===${NC}"
    echo -e "🌐 服务端地址: $FRPS_IP:$FRPS_PORT"
    echo -e "🔧 管理仪表板: http://$FRPS_IP:7500"
    echo -e "📝 管理用户名: frp_admin"
    echo -e "🔑 管理密码: [已配置强密码]"
    echo -e ""
    echo -e "📋 映射的服务:"
    echo -e "  📡 SSH:      $FRPS_IP:9557 → 192.168.3.45:22"
    echo -e "  🌐 Web:      frp.0379.email → 192.168.3.45:80"
    echo -e "  🔌 API:      api.0379.email → 192.168.3.45:3000"
    echo -e "  ⚙️ Admin:    admin.0379.email → 192.168.3.45:3001"
    echo -e "  🤖 LLM:      llm.0379.email → 192.168.3.45:3002"
    echo -e "  📧 Mail:     mail.0379.email → 192.168.3.45:3003"
    echo -e "  🗄️ MySQL:    $FRPS_IP:3307 → 192.168.3.45:3306"
    echo -e "  🔄 Redis:    $FRPS_IP:6378 → 192.168.3.45:6379"
    echo -e "  📁 Files:    $FRPS_IP:8081 → 192.168.3.45:8080"
}

# 主函数
main() {
    log "INFO" "开始FRP生产环境部署"
    log "INFO" "项目路径: $PROJECT_ROOT"

    # 检查SSH连接
    if ! check_ssh_connection "$FRPS_SERVER" "$FRPS_USER" "$FRPS_IP"; then
        log "ERROR" "无法连接到FRP服务端服务器"
        exit 1
    fi

    if ! check_ssh_connection "$FRPC_SERVER" "$FRPC_USER" "$FRPC_IP"; then
        log "ERROR" "无法连接到FRP客户端服务器"
        exit 1
    fi

    # 部署服务端和客户端
    if ! deploy_frps; then
        exit 1
    fi

    if ! deploy_frpc; then
        exit 1
    fi

    # 启动服务并验证
    start_and_verify

    # 显示连接信息
    show_connection_info

    echo -e "\n${GREEN}=== FRP部署完成 ===${NC}"
    echo -e "📊 查看服务状态:"
    echo -e "  服务端: ssh $FRPS_USER@$FRPS_IP 'sudo systemctl status frps'"
    echo -e "  客户端: ssh $FRPC_USER@$FRPC_IP 'systemctl status frpc'"
    echo -e ""
    echo -e "📝 查看日志:"
    echo -e "  服务端: ssh $FRPS_USER@$FRPS_IP 'sudo journalctl -u frps -f'"
    echo -e "  客户端: ssh $FRPC_USER@$FRPC_IP 'journalctl -u frpc -f'"
}

# 显示帮助信息
show_help() {
    cat << EOF
FRP生产环境部署脚本

用法:
    $0 [选项]

选项:
    -h, --help        显示帮助信息
    -s, --server      仅部署服务端
    -c, --client      仅部署客户端
    --check           仅检查SSH连接
    --start           仅启动和验证服务

示例:
    $0                # 执行完整部署
    $0 --server       # 仅部署服务端
    $0 --client       # 仅部署客户端
    $0 --check        # 检查SSH连接

服务器配置:
    服务端: $FRPS_SERVER ($FRPS_IP)
    客户端: $FRPC_SERVER ($FRPC_IP)

EOF
}

# 参数解析
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--server)
        check_ssh_connection "$FRPS_SERVER" "$FRPS_USER" "$FRPS_IP" || exit 1
        deploy_frps
        ;;
    -c|--client)
        check_ssh_connection "$FRPC_SERVER" "$FRPC_USER" "$FRPC_IP" || exit 1
        deploy_frpc
        ;;
    --check)
        check_ssh_connection "$FRPS_SERVER" "$FRPS_USER" "$FRPS_IP"
        check_ssh_connection "$FRPC_SERVER" "$FRPC_USER" "$FRPC_IP"
        ;;
    --start)
        start_and_verify
        show_connection_info
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