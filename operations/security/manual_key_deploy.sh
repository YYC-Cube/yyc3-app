#!/bin/bash
# =============================================================================
# 手动SSH密钥分发脚本
# =============================================================================

set -e

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 服务器列表
SERVERS=(
    "yyc3-121:yanyu@8.130.127.121:22"
    "yyc3-121-backup:yanyu@8.130.127.121:2222"
    "yyc3-45:YYC@192.168.3.45:57"
)

# 密钥路径
KEY_DIR="/Users/yanyu/security/keys/ssh"

# 显示标题
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}       SSH密钥手动分发工具${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# 显示可用服务器
log_info "可用的服务器列表:"
for server_info in "${SERVERS[@]}"; do
    server_name=$(echo "$server_info" | cut -d':' -f1)
    connection=$(echo "$server_info" | cut -d':' -f2-)
    echo "  - $server_name ($connection)"
done
echo ""

# 查找服务器连接信息
find_server_info() {
    local server_name="$1"
    for server_info in "${SERVERS[@]}"; do
        local name=$(echo "$server_info" | cut -d':' -f1)
        if [[ "$name" == "$server_name" ]]; then
            echo "$server_info"
            return 0
        fi
    done
    return 1
}

# 分发单个服务器密钥
distribute_key() {
    local server_name="$1"
    local server_info=$(find_server_info "$server_name")

    if [[ -z "$server_info" ]]; then
        log_error "未找到服务器: $server_name"
        return 1
    fi

    local connection=$(echo "$server_info" | cut -d':' -f2-)
    local user=$(echo "$connection" | cut -d'@' -f1)
    local host_port=$(echo "$connection" | cut -d'@' -f2)
    local host=$(echo "$host_port" | cut -d':' -f1)
    local port=$(echo "$host_port" | cut -d':' -f2)
    local public_key="$KEY_DIR/public/${server_name}.pub"

    if [[ ! -f "$public_key" ]]; then
        log_error "公钥文件不存在: $public_key"
        return 1
    fi

    log_info "尝试分发密钥到: $server_name ($connection)"

    # 方法1: 尝试使用ssh-copy-id
    if ssh-copy-id -f -i "$public_key" -p "$port" "$user@$host" 2>/dev/null; then
        log_success "密钥分发成功: $server_name"
        return 0
    fi

    # 方法2: 手动复制
    log_warning "ssh-copy-id失败，尝试手动分发..."

    # 读取公钥内容
    local key_content=$(cat "$public_key")

    if ssh -p "$port" -o StrictHostKeyChecking=no "$user@$host" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$key_content' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" 2>/dev/null; then
        log_success "手动密钥分发成功: $server_name"
        return 0
    fi

    # 方法3: 提供手动操作指导
    log_error "自动分发失败，请手动执行:"
    echo "echo '$key_content' | ssh -p $port $user@$host 'cat >> ~/.ssh/authorized_keys'"
    echo ""
    echo "或者登录服务器手动添加:"
    echo "1. ssh -p $port $user@$host"
    echo "2. mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "3. echo '$key_content' >> ~/.ssh/authorized_keys"
    echo "4. chmod 600 ~/.ssh/authorized_keys"

    return 1
}

# 测试连接
test_connection() {
    local server_name="$1"
    local server_info=$(find_server_info "$server_name")

    if [[ -z "$server_info" ]]; then
        log_error "未找到服务器: $server_name"
        return 1
    fi

    local connection=$(echo "$server_info" | cut -d':' -f2-)
    local user=$(echo "$connection" | cut -d'@' -f1)
    local host_port=$(echo "$connection" | cut -d'@' -f2)
    local host=$(echo "$host_port" | cut -d':' -f1)
    local port=$(echo "$host_port" | cut -d':' -f2)
    local private_key="$KEY_DIR/private/${server_name}"

    log_info "测试连接: $server_name"

    if ssh -i "$private_key" -p "$port" -o StrictHostKeyChecking=no -o BatchMode=yes "$user@$host" "echo '连接成功'" 2>/dev/null; then
        log_success "连接测试成功: $server_name"
        return 0
    else
        log_warning "连接测试失败: $server_name (可能需要先完成密钥分发)"
        return 1
    fi
}

# 主菜单
case "${1:-}" in
    "all")
        log_info "分发所有服务器密钥..."
        for server_info in "${SERVERS[@]}"; do
            server_name=$(echo "$server_info" | cut -d':' -f1)
            distribute_key "$server_name"
            echo ""
        done
        ;;
    "test")
        log_info "测试所有服务器连接..."
        for server_info in "${SERVERS[@]}"; do
            server_name=$(echo "$server_info" | cut -d':' -f1)
            test_connection "$server_name"
            echo ""
        done
        ;;
    "list")
        log_info "显示所有服务器公钥:"
        for server_info in "${SERVERS[@]}"; do
            server_name=$(echo "$server_info" | cut -d':' -f1)
            connection=$(echo "$server_info" | cut -d':' -f2-)
            echo ""
            echo -e "${YELLOW}服务器: $server_name${NC}"
            echo "连接: $connection"
            echo "公钥:"
            cat "$KEY_DIR/public/${server_name}.pub" 2>/dev/null || echo "  公钥文件不存在"
        done
        ;;
    *)
        server_name="${1:-}"
        server_exists=false
        for server_info in "${SERVERS[@]}"; do
            name=$(echo "$server_info" | cut -d':' -f1)
            if [[ "$name" == "$server_name" ]]; then
                server_exists=true
                break
            fi
        done

        if [[ -n "$server_name" ]] && [[ "$server_exists" == true ]]; then
            # 分发指定服务器密钥
            distribute_key "$server_name"
            echo ""
            # 自动测试连接
            test_connection "$server_name"
        else
            echo "用法: $0 [命令] [服务器名]"
            echo ""
            echo "命令:"
            echo "  all              分发所有服务器密钥"
            echo "  test             测试所有服务器连接"
            echo "  list             显示所有服务器公钥"
            echo "  [服务器名]        分发指定服务器密钥"
            echo ""
            echo "可用服务器:"
            for server_info in "${SERVERS[@]}"; do
                server_name=$(echo "$server_info" | cut -d':' -f1)
                connection=$(echo "$server_info" | cut -d':' -f2-)
                echo "  - $server_name ($connection)"
            done
            echo ""
            echo "示例:"
            echo "  $0 yyc3-121      # 分发yyc3-121密钥"
            echo "  $0 all           # 分发所有密钥"
            echo "  $0 test          # 测试所有连接"
        fi
        ;;
esac