#!/bin/bash
# =============================================================================
# 0379.email 项目 - 多机互联密钥生成脚本
# 为所有服务器和服务生成SSH密钥和认证配置
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
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

# 服务器配置
declare -A SERVERS=(
    # 生产环境服务器
    ["yyc3-121"]="8.130.127.121:22:yanyu:production:阿里云华北6服务器"
    ["yyc3-121-backup"]="8.130.127.121:2222:yanyu:production-backup:阿里云备份端口"

    # NAS和存储服务器
    ["yyc3-45"]="192.168.3.45:57:YYC:storage:本地NAS服务器"
    ["yyc3-45-backup"]="192.168.3.45:2222:YYC:storage-backup:NAS备份端口"

    # 开发和测试服务器
    ["yyc3-22"]="192.168.3.22:22:yyc3-22:development:M4 Max开发机"
    ["yyc3-66"]="192.168.3.66:22:yyc3-66:development:开发机66"
    ["yyc3-77"]="192.168.3.77:22:yyc3-77:development:开发机77"

    # 监控和管理服务器
    ["monitor-01"]="192.168.3.100:22:monitor:monitoring:监控服务器1"
    ["monitor-02"]="192.168.3.101:22:monitor:monitoring:监控服务器2"

    # 数据库服务器
    ["db-master"]="192.168.3.50:22:dbuser:database:主数据库服务器"
    ["db-slave"]="192.168.3.51:22:dbuser:database:从数据库服务器"

    # API和应用服务器
    ["api-01"]="192.168.3.60:22:apiuser:application:API服务器1"
    ["api-02"]="192.168.3.61:22:apiuser:application:API服务器2"
    ["api-03"]="192.168.3.62:22:apiuser:application:API服务器3"

    # 负载均衡器
    ["lb-01"]="192.168.3.40:22:lbuser:loadbalancer:负载均衡器1"
    ["lb-02"]="192.168.3.41:22:lbuser:loadbalancer:负载均衡器2"
)

# 服务配置
declare -A SERVICES=(
    ["api-service"]="3000:API服务"
    ["admin-service"]="3001:管理面板"
    ["llm-service"]="3002:AI/LLM服务"
    ["mail-service"]="3003:邮件服务"
    ["wiki-service"]="3004:Wiki服务"
    ["monitoring"]="9090:Prometheus监控"
    ["grafana"]="3001:Grafana面板"
    ["redis"]="6379:Redis缓存"
    ["mongodb"]="27017:MongoDB数据库"
    ["postgresql"]="5432:PostgreSQL数据库"
    ["nginx"]="80:Nginx Web服务器"
    ["nginx-ssl"]="443:Nginx HTTPS"
    ["frp-server"]="7000:FRP服务端"
    ["frp-client"]="7400:FRP客户端"
)

# 生成强随机密钥
generate_strong_key() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# 生成SSH密钥对
generate_ssh_keypair() {
    local key_name="$1"
    local key_path="$SSH_DIR/$key_name"
    local key_comment="$2"

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
    log_step "生成服务间通信密钥"

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

# 生成SSL证书
generate_ssl_certificates() {
    log_step "生成SSL证书"

    # 创建CA证书
    local ca_key="$CERTS_DIR/ca.key"
    local ca_cert="$CERTS_DIR/ca.crt"

    if [[ ! -f "$ca_key" ]]; then
        log_info "生成CA证书"
        openssl genrsa -out "$ca_key" 4096
        openssl req -new -x509 -days 3650 -key "$ca_key" -out "$ca_cert" \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=0379.email/OU=IT/CN=0379.email CA"
        chmod 600 "$ca_key"
        chmod 644 "$ca_cert"
    fi

    # 生成域名证书
    local domains=("0379.email" "api.0379.email" "admin.0379.email" "mail.0379.email" "wiki.0379.email" "monitor.0379.email")

    for domain in "${domains[@]}"; do
        log_info "生成域名证书: $domain"

        local domain_key="$CERTS_DIR/$domain.key"
        local domain_csr="$CERTS_DIR/$domain.csr"
        local domain_cert="$CERTS_DIR/$domain.crt"

        # 生成私钥
        openssl genrsa -out "$domain_key" 2048
        chmod 600 "$domain_key"

        # 生成证书签名请求
        openssl req -new -key "$domain_key" -out "$domain_csr" \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=0379.email/OU=IT/CN=$domain"

        # 生成证书
        openssl x509 -req -in "$domain_csr" -CA "$ca_cert" -CAkey "$ca_key" \
            -CAcreateserial -out "$domain_cert" -days 365 \
            -extensions v3_req -extfile <(cat << EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = *.$domain
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

        # 清理临时文件
        rm -f "$domain_csr"
        chmod 644 "$domain_cert"

        log_success "域名证书生成完成: $domain"
    done

    log_success "SSL证书生成完成"
}

# 生成服务器SSH密钥
generate_server_ssh_keys() {
    log_step "生成服务器SSH密钥"

    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r ip port user env_type description <<< "$config"

        # 生成专用SSH密钥
        local key_name="${server_name}_${env_type}"
        local key_comment="0379-email-$server_name"

        generate_ssh_keypair "$key_name" "$key_comment"

        # 生成authorized_keys内容
        local pub_key="$SSH_DIR/$key_name.pub"
        if [[ -f "$pub_key" ]]; then
            # 创建服务器特定的authorized_keys
            mkdir -p "$SSH_DIR/authorized_keys/$server_name"
            cp "$pub_key" "$SSH_DIR/authorized_keys/$server_name/authorized_keys"
        fi
    done

    log_success "服务器SSH密钥生成完成"
}

# 生成服务间通信证书
generate_service_certificates() {
    log_step "生成服务间通信证书"

    for service_name in "${!SERVICES[@]}"; do
        local config="${SERVICES[$service_name]}"
        IFS=':' read -r port description <<< "$config"

        log_info "生成服务证书: $service_name ($description)"

        local service_key="$CERTS_DIR/services/$service_name.key"
        local service_cert="$CERTS_DIR/services/$service_name.crt"

        mkdir -p "$CERTS_DIR/services"

        # 生成服务私钥
        openssl genrsa -out "$service_key" 2048
        chmod 600 "$service_key"

        # 生成服务证书
        openssl req -new -x509 -key "$service_key" -out "$service_cert" -days 365 \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=0379.email/OU=Services/CN=$service_name"
        chmod 644 "$service_cert"

        log_success "服务证书生成完成: $service_name"
    done

    log_success "服务间通信证书生成完成"
}

# 创建SSH配置文件
create_ssh_configs() {
    log_step "创建SSH配置文件"

    local ssh_config="$SSH_DIR/config"

    # 备份现有配置
    if [[ -f "$ssh_config" ]]; then
        cp "$ssh_config" "$ssh_config.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 创建新的SSH配置
    cat > "$ssh_config" << EOF
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
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p
    ControlPersist 600

# 算法偏好
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521

EOF

    # 添加服务器配置
    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r ip port user env_type description <<< "$config"

        cat >> "$ssh_config" << EOF

# $description
Host $server_name
    HostName $ip
    User $user
    Port $port
    IdentityFile ~/.ssh/${server_name}_${env_type}
    PreferredAuthentications publickey
    PubkeyAuthentication yes
    PasswordAuthentication no
    ChallengeResponseAuthentication no

EOF

        # 添加特殊配置
        case $env_type in
            "production")
                cat >> "$ssh_config" << EOF
    # 生产服务器特殊配置
    PermitLocalCommand no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no

EOF
                ;;
            "storage")
                cat >> "$ssh_config" << EOF
    # 存储服务器特殊配置
    AllowTcpForwarding yes
    PermitLocalCommand yes

EOF
                ;;
            "development")
                cat >> "$ssh_config" << EOF
    # 开发机特殊配置
    AllowTcpForwarding yes
    PermitLocalCommand yes
    X11Forwarding yes

EOF
                ;;
        esac
    done

    chmod 600 "$ssh_config"
    log_success "SSH配置文件创建完成: $ssh_config"
}

# 创建密钥分发脚本
create_key_distribution_scripts() {
    log_step "创建密钥分发脚本"

    local deploy_script="$SCRIPTS_DIR/distribute-ssh-keys.sh"

    cat > "$deploy_script" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSH密钥分发脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYS_DIR="$SCRIPT_DIR/../keys/ssh"

# 服务器配置
declare -A SERVERS=(
EOF

    # 添加服务器配置到脚本
    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r ip port user env_type description <<< "$config"
        echo "    [\"$server_name\"]=\"$ip:$port:$user\"" >> "$deploy_script"
    done

    cat >> "$deploy_script" << 'EOF'
)

# 分发SSH密钥到指定服务器
distribute_key() {
    local server_name="$1"
    local config="${SERVERS[$server_name]}"

    if [[ -z "$config" ]]; then
        log_error "未知服务器: $server_name"
        return 1
    fi

    IFS=':' read -r ip port user env_type description <<< "$config"
    local key_name="${server_name}_${env_type}"
    local key_path="$KEYS_DIR/$key_name"
    local pub_key="$key_path.pub"

    if [[ ! -f "$pub_key" ]]; then
        log_error "SSH公钥不存在: $pub_key"
        return 1
    fi

    log_info "分发密钥到 $server_name ($ip:$port)"

    # 使用ssh-copy-id分发密钥
    if ssh-copy-id -i "$pub_key" -p "$port" "$user@$ip" 2>/dev/null; then
        log_success "密钥分发成功: $server_name"

        # 验证连接
        if ssh -i "$key_path" -p "$port" -o ConnectTimeout=5 "$user@$ip" "echo '连接成功'" 2>/dev/null; then
            log_success "连接验证成功: $server_name"
        else
            log_error "连接验证失败: $server_name"
            return 1
        fi
    else
        log_error "密钥分发失败: $server_name"
        log_info "请手动执行: ssh-copy-id -i $pub_key -p $port $user@$ip"
        return 1
    fi
}

# 分发所有密钥
distribute_all_keys() {
    log_info "开始分发所有SSH密钥..."

    local failed_servers=()

    for server_name in "${!SERVERS[@]}"; do
        if ! distribute_key "$server_name"; then
            failed_servers+=("$server_name")
        fi
        sleep 1  # 避免过于频繁的连接
    done

    if [[ ${#failed_servers[@]} -eq 0 ]]; then
        log_success "所有密钥分发成功！"
    else
        log_error "以下服务器密钥分发失败:"
        for server in "${failed_servers[@]}"; do
            echo "  - $server"
        done
        return 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email SSH密钥分发脚本

用法: $0 [选项]

选项:
    -h, --help     显示此帮助信息
    -a, --all      分发所有密钥
    -s, --server   分发指定服务器密钥

示例:
    $0              # 分发所有密钥
    $0 -s yyc3-121  # 仅分发yyc3-121的密钥

EOF
}

# 主函数
main() {
    local action="all"

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -a|--all)
                action="all"
                shift
                ;;
            -s|--server)
                action="server"
                server_name="$2"
                shift 2
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    case $action in
        "all")
            distribute_all_keys
            ;;
        "server")
            if [[ -z "${server_name:-}" ]]; then
                log_error "请指定服务器名称"
                show_help
                exit 1
            fi
            distribute_key "$server_name"
            ;;
    esac
}

# 执行主函数
main "$@"
EOF

    chmod +x "$deploy_script"
    log_success "密钥分发脚本创建完成: $deploy_script"
}

# 创建密钥管理文档
create_key_management_documentation() {
    log_step "创建密钥管理文档"

    local docs_dir="$PROJECT_DIR/docs/security"
    mkdir -p "$docs_dir"

    cat > "$docs_dir/KEY_MANAGEMENT.md" << EOF
# 0379.email 项目密钥管理指南

## 概述

本文档描述了 0379.email 项目的密钥生成、分发和管理流程。

## 密钥类型

### 1. SSH密钥
用于服务器间安全通信和访问控制。

#### 生成位置
\`keys/ssh/\`

#### 密钥命名规则
\`{servername}_{environment}\`
- 示例: \`yyc3-121_production\`

#### 使用方法
\`\`\`bash
# 连接到生产服务器
ssh yyc3-121

# 连接到NAS服务器
ssh yyc3-45
\`\`\`

### 2. SSL/TLS证书
用于HTTPS加密和服务间通信。

#### 生成位置
\`keys/certificates/\`

#### 证书类型
- **CA证书**: 根证书颁发机构
- **域名证书**: 用于Web服务的SSL证书
- **服务证书**: 用于服务间通信的证书

### 3. 服务认证密钥
用于服务间API调用和认证。

#### 生成位置
\`keys/secrets/\`

#### 密钥类型
- JWT密钥
- API密钥
- 数据库密码
- 服务间认证密钥

## 服务器配置

### 生产环境服务器
- **yyc3-121**: 8.130.127.121:22 (主服务器)
- **yyc3-121-backup**: 8.130.127.121:2222 (备份端口)

### 存储服务器
- **yyc3-45**: 192.168.3.45:57 (NAS服务器)
- **yyc3-45-backup**: 192.168.3.45:2222 (备份端口)

### 开发服务器
- **yyc3-22**: 192.168.3.22:22 (M4 Max开发机)
- **yyc3-66**: 192.168.3.66:22 (开发机66)
- **yyc3-77**: 192.168.3.77:22 (开发机77)

### 数据库服务器
- **db-master**: 192.168.3.50:22 (主数据库)
- **db-slave**: 192.168.3.51:22 (从数据库)

### 应用服务器
- **api-01**: 192.168.3.60:22 (API服务器1)
- **api-02**: 192.168.3.61:22 (API服务器2)
- **api-03**: 192.168.3.62:22 (API服务器3)

## 密钥生成流程

### 1. 自动生成
\`\`\`bash
# 生成所有密钥
./scripts/generate-multi-machine-keys.sh

# 分发所有SSH密钥
./scripts/distribute-ssh-keys.sh --all
\`\`\`

### 2. 手动生成特定密钥
\`\`\`bash
# 生成特定服务器SSH密钥
./scripts/generate-multi-machine-keys.sh --ssh yyc3-121

# 生成SSL证书
./scripts/generate-multi-machine-keys.sh --ssl

# 分发特定服务器密钥
./scripts/distribute-ssh-keys.sh --server yyc3-121
\`\`\`

## 密钥轮换

### 定期轮换
- **SSH密钥**: 每6个月
- **SSL证书**: 每年
- **数据库密码**: 每3个月
- **API密钥**: 每3个月

### 紧急轮换
当发生安全事件时，立即轮换所有相关密钥。

\`\`\`bash
# 紧急密钥轮换
./scripts/generate-multi-machine-keys.sh --emergency
./scripts/distribute-ssh-keys.sh --all
\`\`\`

## 安全最佳实践

### 1. 密钥存储
- 私钥文件权限设置为 600
- 公钥文件权限设置为 644
- 使用密码管理器存储密钥备份

### 2. 访问控制
- 实施最小权限原则
- 定期审计SSH访问日志
- 使用IP白名单限制访问

### 3. 监控和审计
- 监控SSH登录活动
- 记录密钥使用情况
- 设置异常访问告警

### 4. 备份和恢复
- 定期备份密钥文件
- 安全存储备份密钥
- 测试密钥恢复流程

## 故障排除

### SSH连接问题
\`\`\`bash
# 检查SSH配置
ssh -v yyc3-121

# 检查密钥权限
ls -la ~/.ssh/

# 重新分发密钥
./scripts/distribute-ssh-keys.sh --server yyc3-121
\`\`\`

### SSL证书问题
\`\`\`bash
# 检查证书有效期
openssl x509 -in keys/certificates/0379.email.crt -noout -dates

# 验证证书链
openssl verify keys/certificates/0379.email.crt
\`\`\`

### 密钥权限问题
\`\`\`bash
# 修复密钥权限
chmod 600 keys/ssh/*_*
chmod 644 keys/ssh/*.pub
chmod 600 keys/secrets/*
\`\`\`

## 应急响应

### 密钥泄露响应
1. 立即撤销泄露的密钥
2. 生成新的密钥对
3. 更新所有相关配置
4. 重新分发新密钥
5. 监控异常访问活动

### 自动化响应
\`\`\`bash
# 一键密钥轮换
./scripts/emergency-key-rotation.sh

# 安全检查
./scripts/security-check.sh
\`\`\`

## 联系信息

如有密钥管理问题，请联系：
- 安全团队: security@0379.email
- 运维团队: ops@0379.email

---
*文档版本: 1.0*
*最后更新: $(date)*
EOF

    log_success "密钥管理文档创建完成"
}

# 生成密钥管理脚本
generate_key_management_scripts() {
    log_step "生成密钥管理脚本"

    # 密钥轮换脚本
    cat > "$SCRIPTS_DIR/rotate-keys.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 - 密钥轮换脚本
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 轮换SSH密钥
rotate_ssh_keys() {
    log_info "轮换SSH密钥..."

    # 备份现有密钥
    if [[ -d "$SCRIPT_DIR/../keys/ssh" ]]; then
        cp -r "$SCRIPT_DIR/../keys/ssh" "$SCRIPT_DIR/../keys/ssh.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 生成新密钥
    "$SCRIPT_DIR/generate-multi-machine-keys.sh" --ssh

    # 分发新密钥
    "$SCRIPT_DIR/distribute-ssh-keys.sh" --all

    log_success "SSH密钥轮换完成"
}

# 轮换SSL证书
rotate_ssl_certificates() {
    log_info "轮换SSL证书..."

    # 备份现有证书
    if [[ -d "$SCRIPT_DIR/../keys/certificates" ]]; then
        cp -r "$SCRIPT_DIR/../keys/certificates" "$SCRIPT_DIR/../keys/certificates.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 生成新证书
    "$SCRIPT_DIR/generate-multi-machine-keys.sh" --ssl

    log_success "SSL证书轮换完成"
}

# 轮换服务密钥
rotate_service_keys() {
    log_info "轮换服务密钥..."

    # 备份现有密钥
    if [[ -d "$SCRIPT_DIR/../keys/secrets" ]]; then
        cp -r "$SCRIPT_DIR/../keys/secrets" "$SCRIPT_DIR/../keys/secrets.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 生成新密钥
    "$SCRIPT_DIR/generate-multi-machine-keys.sh" --secrets

    log_success "服务密钥轮换完成"
}

# 主函数
main() {
    case "${1:-all}" in
        "ssh")
            rotate_ssh_keys
            ;;
        "ssl")
            rotate_ssl_certificates
            ;;
        "secrets")
            rotate_service_keys
            ;;
        "all")
            rotate_ssh_keys
            rotate_ssl_certificates
            rotate_service_keys
            ;;
        *)
            echo "用法: $0 [ssh|ssl|secrets|all]"
            exit 1
            ;;
    esac
}

main "$@"
EOF

    chmod +x "$SCRIPT_DIR_DIR/rotate-keys.sh"

    log_success "密钥管理脚本生成完成"
}

# 显示生成的密钥信息
show_generated_keys_info() {
    log_step "生成的密钥信息"

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
    echo "  密钥轮换脚本: $SCRIPTS_DIR/rotate-keys.sh"
}

# 主函数
main() {
    echo -e "${BLUE}🔐 0379.email 项目 - 多机互联密钥生成${NC}"
    echo ""

    # 检查依赖
    if ! command -v openssl >/dev/null 2>&1; then
        log_error "OpenSSL 未安装，请先安装 OpenSSL"
        exit 1
    fi

    if ! command -v ssh-keygen >/dev/null 2>&1; then
        log_error "SSH 客户端未安装，请先安装 OpenSSH"
        exit 1
    fi

    # 生成各类密钥
    generate_service_keys
    generate_ssl_certificates
    generate_server_ssh_keys
    generate_service_certificates
    create_ssh_configs
    create_key_distribution_scripts
    generate_key_management_scripts
    create_key_management_documentation

    # 显示结果
    show_generated_keys_info

    echo ""
    log_success "🎉 多机互联密钥生成完成！"
    echo ""
    echo -e "${YELLOW}⚠️  重要提示:${NC}"
    echo "1. 请妥善保存所有生成的密钥文件"
    echo "2. 执行密钥分发: ./scripts/distribute-ssh-keys.sh --all"
    echo "3. 查看管理文档: docs/security/KEY_MANAGEMENT.md"
    echo "4. 定期轮换密钥: ./scripts/rotate-keys.sh"
    echo ""
    echo -e "${BLUE}📁 密钥文件位置:${NC}"
    echo "  SSH密钥: $SSH_DIR"
    echo "  SSL证书: $CERTS_DIR"
    echo "  服务密钥: $SECRETS_DIR"
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 项目 - 多机互联密钥生成脚本

用法: $0 [选项]

选项:
    -h, --help      显示此帮助信息
    --ssh-only      仅生成SSH密钥
    --ssl-only      仅生成SSL证书
    --secrets-only  仅生成服务密钥
    --no-distribute 不生成分发脚本

示例:
    $0                    # 生成所有密钥
    $0 --ssh-only         # 仅生成SSH密钥
    $0 --ssl-only         # 仅生成SSL证书
    $0 --secrets-only     # 仅生成服务密钥

EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --ssh-only)
            SSH_ONLY=true
            shift
            ;;
        --ssl-only)
            SSL_ONLY=true
            shift
            ;;
        --secrets-only)
            SECRETS_ONLY=true
            shift
            ;;
        --no-distribute)
            NO_DISTRIBUTE=true
            shift
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 根据选项执行生成
if [[ "${SSH_ONLY:-}" == "true" ]]; then
    generate_server_ssh_keys
    create_ssh_configs
    if [[ "${NO_DISTRIBUTE:-}" != "true" ]]; then
        create_key_distribution_scripts
    fi
    show_generated_keys_info
elif [[ "${SSL_ONLY:-}" == "true" ]]; then
    generate_ssl_certificates
    show_generated_keys_info
elif [[ "${SECRETS_ONLY:-}" == "true" ]]; then
    generate_service_keys
    show_generated_keys_info
else
    main
fi