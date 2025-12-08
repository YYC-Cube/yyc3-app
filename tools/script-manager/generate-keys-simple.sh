#!/bin/bash
# =============================================================================
# 0379.email 项目 - 简化密钥生成脚本
# =============================================================================

set -euo pipefail

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

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KEYS_DIR="$PROJECT_DIR/keys"
SSH_DIR="$KEYS_DIR/ssh"
CERTS_DIR="$KEYS_DIR/certificates"
SECRETS_DIR="$KEYS_DIR/secrets"

# 创建必要的目录
mkdir -p "$SSH_DIR" "$CERTS_DIR" "$SECRETS_DIR"

# 生成强随机密钥
generate_strong_key() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# 生成SSH密钥对
generate_ssh_keypair() {
    local key_name="$1"
    local key_comment="$2"
    local key_path="$SSH_DIR/$key_name"

    log_info "生成SSH密钥对: $key_name"

    # 生成密钥对
    ssh-keygen -t ed25519 -b 4096 -f "$key_path" -N "" -C "$key_comment" 2>/dev/null

    # 设置权限
    chmod 600 "$key_path"
    chmod 644 "$key_path.pub"

    log_success "SSH密钥对生成完成: $key_name"
}

# 生成服务间通信密钥
generate_service_keys() {
    log_info "生成服务间通信密钥"

    # 生成JWT密钥
    local jwt_secret=$(generate_strong_key 64)
    echo "JWT_SECRET=$jwt_secret" > "$SECRETS_DIR/jwt.secret"
    chmod 600 "$SECRETS_DIR/jwt.secret"

    # 生成API密钥
    local api_key=$(generate_strong_key 32)
    echo "API_KEY=$api_key" > "$SECRETS_DIR/api.key"
    chmod 600 "$SECRETS_DIR/api.key"

    # 生成数据库密码
    local redis_password=$(generate_strong_key 24)
    local mongo_password=$(generate_strong_key 24)
    local postgres_password=$(generate_strong_key 24)

    cat > "$SECRETS_DIR/database.passwords" << EOF
# 数据库密码配置
REDIS_PASSWORD=$redis_password
MONGODB_PASSWORD=$mongo_password
POSTGRES_PASSWORD=$postgres_password
EOF
    chmod 600 "$SECRETS_DIR/database.passwords"

    # 生成服务间认证密钥
    local service_auth_key=$(generate_strong_key 48)
    echo "SERVICE_AUTH_KEY=$service_auth_key" > "$SECRETS_DIR/service_auth.key"
    chmod 600 "$SECRETS_DIR/service_auth.key"

    log_success "服务间通信密钥生成完成"
}

# 生成主要服务器SSH密钥
generate_server_ssh_keys() {
    log_info "生成服务器SSH密钥"

    # 生产服务器
    generate_ssh_keypair "yyc3-121_production" "0379-email-yyc3-121"
    generate_ssh_keypair "yyc3-121_backup" "0379-email-yyc3-121-backup"

    # NAS服务器
    generate_ssh_keypair "yyc3-45_storage" "0379-email-yyc3-45"
    generate_ssh_keypair "yyc3-45_backup" "0379-email-yyc3-45-backup"

    # 开发机
    generate_ssh_keypair "yyc3-22_development" "0379-email-yyc3-22"
    generate_ssh_keypair "yyc3-66_development" "0379-email-yyc3-66"
    generate_ssh_keypair "yyc3-77_development" "0379-email-yyc3-77"

    log_success "服务器SSH密钥生成完成"
}

# 生成简化SSL证书
generate_ssl_certificates() {
    log_info "生成自签名SSL证书"

    local domains=("0379.email" "api.0379.email" "admin.0379.email" "mail.0379.email" "wiki.0379.email")

    for domain in "${domains[@]}"; do
        log_info "生成域名证书: $domain"

        local domain_key="$CERTS_DIR/$domain.key"
        local domain_cert="$CERTS_DIR/$domain.crt"

        # 生成私钥
        openssl genrsa -out "$domain_key" 2048 2>/dev/null
        chmod 600 "$domain_key"

        # 生成自签名证书
        openssl req -new -x509 -key "$domain_key" -out "$domain_cert" -days 365 \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=0379.email/OU=IT/CN=$domain" 2>/dev/null
        chmod 644 "$domain_cert"

        log_success "域名证书生成完成: $domain"
    done

    log_success "SSL证书生成完成"
}

# 创建SSH配置文件
create_ssh_configs() {
    log_info "创建SSH配置文件"

    local ssh_config="$SSH_DIR/config"

    # 备份现有配置
    if [[ -f "$ssh_config" ]]; then
        cp "$ssh_config" "$ssh_config.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 创建新的SSH配置
    cat > "$ssh_config" << 'EOF'
# =============================================================================
# 0379.email 项目 SSH 配置
# 自动生成 - 请勿手动编辑
# =============================================================================

# 全局配置
Host *
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts
    IdentityFile ~/.ssh/id_rsa
    Compression yes
    CompressionLevel 6

# 生产服务器
Host yyc3-121
    HostName 8.130.127.121
    User yanyu
    Port 22
    IdentityFile ~/.ssh/yyc3-121_production
    PreferredAuthentications publickey
    PubkeyAuthentication yes
    PasswordAuthentication no

Host yyc3-121-backup
    HostName 8.130.127.121
    User yanyu
    Port 2222
    IdentityFile ~/.ssh/yyc3-121_backup

# NAS服务器
Host yyc3-45
    HostName 192.168.3.45
    User YYC
    Port 57
    IdentityFile ~/.ssh/yyc3-45_storage

Host yyc3-45-backup
    HostName 192.168.3.45
    User YYC
    Port 2222
    IdentityFile ~/.ssh/yyc3-45_backup

# 开发机
Host yyc3-22
    HostName 192.168.3.22
    User yyc3-22
    Port 22
    IdentityFile ~/.ssh/yyc3-22_development

Host yyc3-66
    HostName 192.168.3.66
    User yyc3-66
    Port 22
    IdentityFile ~/.ssh/yyc3-66_development

Host yyc3-77
    HostName 192.168.3.77
    User yyc3-77
    Port 22
    IdentityFile ~/.ssh/yyc3-77_development
EOF

    chmod 600 "$ssh_config"
    log_success "SSH配置文件创建完成: $ssh_config"
}

# 创建密钥分发脚本
create_key_distribution_script() {
    log_info "创建密钥分发脚本"

    local deploy_script="/Users/yanyu/www/scripts/distribute-ssh-keys.sh"

    cat > "$deploy_script" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSH密钥分发脚本
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYS_DIR="$SCRIPT_DIR/../keys/ssh"

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
        echo "错误: SSH公钥不存在: $pub_key"
        return 1
    fi

    echo "分发密钥到 $server_name ($ip:$port)..."

    # 使用ssh-copy-id分发密钥
    if ssh-copy-id -i "$pub_key" -p "$port" "$user@$ip" 2>/dev/null; then
        echo "成功: $server_name"

        # 验证连接
        if ssh -i "$KEYS_DIR/$key_name" -p "$port" -o ConnectTimeout=5 "$user@$ip" "echo '连接成功'" 2>/dev/null; then
            echo "验证成功: $server_name"
        else
            echo "验证失败: $server_name"
        fi
    else
        echo "失败: $server_name"
        echo "请手动执行: ssh-copy-id -i $pub_key -p $port $user@$ip"
    fi
}

# 分发所有密钥
echo "开始分发SSH密钥..."
for server_config in "${SERVERS[@]}"; do
    IFS=':' read -r server_name ip port user <<< "$server_config"
    distribute_key "$server_name" "$ip" "$port" "$user"
    sleep 1
done

echo "密钥分发完成！"
EOF

    chmod +x "$deploy_script"
    log_success "密钥分发脚本创建完成: $deploy_script"
}

# 显示生成的密钥信息
show_generated_keys_info() {
    log_info "生成的密钥信息"

    echo ""
    echo "🔑 SSH密钥:"
    find "$SSH_DIR" -name "*.pub" -exec echo "  {}" \;

    echo ""
    echo "🔐 SSL证书:"
    find "$CERTS_DIR" -name "*.crt" -exec echo "  {}" \;

    echo ""
    echo "🔒 服务密钥:"
    ls -la "$SECRETS_DIR/"

    echo ""
    echo "📋 重要文件:"
    echo "  SSH配置: $SSH_DIR/config"
    echo "  密钥分发脚本: $SCRIPTS_DIR/distribute-ssh-keys.sh"
}

# 主函数
main() {
    echo -e "${BLUE}🔐 0379.email 项目 - 密钥生成${NC}"
    echo ""

    # 生成各类密钥
    generate_service_keys
    generate_ssl_certificates
    generate_server_ssh_keys
    create_ssh_configs
    create_key_distribution_script

    # 显示结果
    show_generated_keys_info

    echo ""
    log_success "🎉 密钥生成完成！"
    echo ""
    echo -e "${YELLOW}⚠️  重要提示:${NC}"
    echo "1. 请妥善保存所有生成的密钥文件"
    echo "2. 执行密钥分发: ./scripts/distribute-ssh-keys.sh"
    echo "3. 将SSH配置添加到 ~/.ssh/config"
    echo ""
    echo -e "${BLUE}📁 密钥文件位置:${NC}"
    echo "  SSH密钥: $SSH_DIR"
    echo "  SSL证书: $CERTS_DIR"
    echo "  服务密钥: $SECRETS_DIR"
    echo ""
}

# 执行主函数
main