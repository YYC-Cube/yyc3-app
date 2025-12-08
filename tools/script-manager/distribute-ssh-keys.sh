#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSH密钥分发脚本
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYS_DIR="$SCRIPT_DIR/../keys/ssh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 服务器配置
SERVERS=(
    "yyc3-121:8.130.127.121:22:yanyu"
    "yyc3-45:192.168.3.45:57:YYC"
    "yyc3-22:192.168.3.22:22:yyc3-22"
)

# 分发SSH密钥
distribute_key() {
    local server_name="$1"
    local ip="$2"
    local port="$3"
    local user="$4"
    local key_name="${server_name}_${user}"

    local pub_key="$KEYS_DIR/$key_name.pub"

    if [[ ! -f "$pub_key" ]]; then
        log_error "SSH公钥不存在: $pub_key"
        return 1
    fi

    log_info "分发密钥到 $server_name ($ip:$port)..."

    # 使用ssh-copy-id分发密钥
    if ssh-copy-id -i "$pub_key" -p "$port" "$user@$ip" 2>/dev/null; then
        log_success "密钥分发成功: $server_name"

        # 验证连接
        if ssh -i "$KEYS_DIR/$key_name" -p "$port" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$user@$ip" "echo '连接成功'" 2>/dev/null; then
            log_success "连接验证成功: $server_name"
        else
            log_error "连接验证失败: $server_name"
        fi
    else
        log_error "密钥分发失败: $server_name"
        echo "请手动执行: ssh-copy-id -i $pub_key -p $port $user@$ip"
    fi
}

# 分发所有密钥
echo "开始分发SSH密钥..."
for server_config in "${SERVERS[@]}"; do
    IFS=':' read -r server_name ip port user <<< "$server_config"
    distribute_key "$server_name" "$ip" "$port" "$user"
    echo ""
done

log_success "密钥分发完成！"
