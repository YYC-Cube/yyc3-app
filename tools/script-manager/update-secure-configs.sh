#!/bin/bash
# =============================================================================
# 0379.email 项目 - 安全配置更新脚本
# 直接替换所有不安全的配置
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 生成安全密码
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# 备份原文件
backup_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$file" "$backup"
        log_info "已备份原文件: $backup"
    fi
}

# 主函数
main() {
    log_info "开始 0379.email 项目安全配置更新..."

    # 1. 更新 Redis 配置
    log_info "正在更新 Redis 配置..."
    local redis_config="/Users/yanyu/www/redis-config/config/redis-prod.conf"
    local redis_env="/Users/yanyu/www/redis-config/.env.example"

    if [[ -f "$redis_config" ]]; then
        backup_file "$redis_config"
        local new_redis_pass=$(generate_password 24)

        # 创建新的 Redis 配置
        cat > "$redis_config" << EOF
# Redis 生产配置 - 安全增强版
# 生成时间: $(date)

# 网络配置
bind 127.0.0.1
port 6379
protected-mode yes

# 安全配置
requirepass $new_redis_pass
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG ""
rename-command SHUTDOWN SHUTDOWN_NOW

# 内存配置
maxmemory 256mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log

# 客户端配置
timeout 300
tcp-keepalive 300
maxclients 1000

EOF
        log_success "Redis 配置已更新"
    fi

    if [[ -f "$redis_env" ]]; then
        backup_file "$redis_env"

        # 创建新的环境变量文件
        cat > "$redis_env" << EOF
# Redis 环境变量配置
# 生成时间: $(date)

# 开发环境配置
REDIS_DEV_HOST=localhost
REDIS_DEV_PORT=6379
REDIS_DEV_PASSWORD=redis_dev_password

# 生产环境配置
REDIS_PROD_HOST=localhost
REDIS_PROD_PORT=6379
REDIS_PROD_PASSWORD=$new_redis_pass

# 连接池配置
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
REDIS_CONNECT_TIMEOUT=10000

# 监控配置
REDIS_MONITORING_ENABLED=true
REDIS_HEALTH_CHECK_INTERVAL=30000

EOF
        log_success "Redis 环境变量已更新"
    fi

    # 2. 更新应用配置
    log_info "正在更新应用配置..."
    local app_env="/Users/yanyu/www/app/.env.example"

    if [[ -f "$app_env" ]]; then
        backup_file "$app_env"

        local jwt_secret=$(generate_password 64)
        local api_key=$(generate_password 32)
        local session_secret=$(generate_password 32)

        # 创建新的应用环境变量
        cat > "$app_env" << EOF
# 0379.email 应用环境变量配置
# 生成时间: $(date)

# 服务配置
PORT=3000
HOST=127.0.0.1
NODE_ENV=production

# 安全与认证
API_KEY=$api_key
JWT_SECRET=$jwt_secret
SESSION_SECRET=$session_secret
BCRYPT_ROUNDS=12

# 数据库连接
DB_URI=mongodb://localhost:27017/email
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=10000

# Redis 连接
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=请使用Redis生成的密码

# 日志与调试
LOG_LEVEL=info
LOG_FILE=/var/log/0379-email/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# 安全头配置
HELMET_ENABLED=true
CORS_ORIGIN=https://0379.email
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
UPLOAD_PATH=/var/www/uploads

# 邮件配置
SMTP_HOST=smtp.0379.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@0379.email
SMTP_PASSWORD=请设置SMTP密码

# 监控配置
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
MONITORING_ENDPOINT=/metrics

# SSL 配置
FORCE_HTTPS=true
SSL_CERT_PATH=/etc/nginx/ssl/0379.email.crt
SSL_KEY_PATH=/etc/nginx/ssl/0379.email.key

EOF
        log_success "应用配置已更新"
    fi

    # 3. 创建安全的 SSH 配置
    log_info "正在创建安全 SSH 配置..."
    local ssh_config="/Users/yanyu/www/ssh-config.secure"

    cat > "$ssh_config" << EOF
# 0379.email 项目 SSH 安全配置
# 请将此配置添加到 ~/.ssh/config

# 生产服务器配置 - yyc3-121
Host yyc3-121-prod
    HostName 8.130.127.121
    User yanyu
    IdentityFile ~/.ssh/id_rsa_0379_prod
    Port 22
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_0379

# NAS 服务器配置 - yyc3-45
Host yyc3-45-nas
    HostName 192.168.3.45
    User YYC
    IdentityFile ~/.ssh/id_rsa_0379_nas
    Port 57
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_0379

# 开发机配置 - yyc3-22
Host yyc3-22-dev
    HostName 192.168.3.22
    User yyc3-22
    IdentityFile ~/.ssh/id_rsa_0379_dev
    Port 22
    ConnectTimeout 30
    ServerAliveInterval 60

EOF
    log_success "SSH 安全配置已创建: $ssh_config"

    # 4. 生成密钥文件
    log_info "正在生成安全密钥..."
    local keys_dir="/Users/yanyu/www/keys"
    mkdir -p "$keys_dir"

    local redis_pass=$new_redis_pass
    local jwt_sec=$jwt_secret
    local api_k=$api_key
    local session_sec=$session_secret
    local admin_pass=$(generate_password 16)
    local smtp_pass=$(generate_password 24)

    # 创建生产密钥文件
    cat > "$keys_dir/production-secrets.env" << EOF
# 生产环境密钥 - 生成时间: $(date)
# 请妥善保管此文件，权限应设置为 600

# Redis 密码
REDIS_PASSWORD=$redis_pass

# JWT 密钥
JWT_SECRET=$jwt_sec

# API 密钥
API_KEY=$api_k

# 会话密钥
SESSION_SECRET=$session_sec

# 管理员密码
ADMIN_PASSWORD=$admin_pass

# SMTP 密码
SMTP_PASSWORD=$smtp_pass

# 数据库密码
DB_PASSWORD=$(generate_password 24)

# SSL 密钥密码
SSL_KEY_PASSWORD=$(generate_password 16)

EOF
    chmod 600 "$keys_dir/production-secrets.env"
    log_success "生产密钥已生成: $keys_dir/production-secrets.env"

    # 5. 创建安全检查脚本
    log_info "正在创建安全检查脚本..."
    local security_script="/Users/yanyu/www/scripts/security-check.sh"

    cat > "$security_script" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 - 安全检查脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查文件权限
check_file_permissions() {
    local file="$1"
    local expected_perm="$2"

    if [[ -f "$file" ]]; then
        local actual_perm=$(stat -f "%Mp%Lp" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
        if [[ "$actual_perm" == "$expected_perm" ]]; then
            log_success "文件权限正确: $file ($actual_perm)"
        else
            log_error "文件权限不正确: $file (当前: $actual_perm, 期望: $expected_perm)"
        fi
    else
        log_warning "文件不存在: $file"
    fi
}

# 检查端口配置
check_port_binding() {
    local port="$1"
    local description="$2"

    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        local binding=$(netstat -tuln 2>/dev/null | grep ":$port " | head -1)
        if [[ "$binding" =~ "0.0.0.0" ]]; then
            log_warning "端口 $port ($description) 绑定到所有接口"
        else
            log_success "端口 $port ($description) 绑定安全"
        fi
    else
        log_info "端口 $port ($description) 未监听"
    fi
}

# 检查环境变量
check_env_secrets() {
    local env_file="$1"

    if [[ -f "$env_file" ]]; then
        local insecure_patterns=(
            "your_.*_here"
            "change-this-password"
            "redis_yyc3"
            "your-jwt-secret"
            "123456"
            "password"
            "admin"
        )

        for pattern in "${insecure_patterns[@]}"; do
            if grep -q "$pattern" "$env_file"; then
                log_error "发现不安全的配置模式: $pattern 在 $env_file"
            fi
        done
    fi
}

# 主检查函数
main() {
    log_info "开始 0379.email 项目安全检查..."

    # 检查关键文件权限
    log_info "检查文件权限..."
    check_file_permissions "/Users/yanyu/www/keys/production-secrets.env" "600"
    check_file_permissions "/Users/yanyu/www/.env.production" "600"

    # 检查端口绑定
    log_info "检查端口绑定..."
    check_port_binding "3000" "API 服务"
    check_port_binding "3001" "管理面板"
    check_port_binding "6379" "Redis"

    # 检查环境变量安全性
    log_info "检查环境变量安全性..."
    check_env_secrets "/Users/yanyu/www/app/.env.example"
    check_env_secrets "/Users/yanyu/www/redis-config/.env.example"

    log_success "安全检查完成"
}

main "$@"
EOF

    chmod +x "$security_script"
    log_success "安全检查脚本已创建: $security_script"

    # 6. 显示生成的密钥
    log_warning "请保存以下重要密钥信息："
    echo "=============================================="
    echo "Redis 生产密码: $redis_pass"
    echo "JWT 密钥: $jwt_sec"
    echo "API 密钥: $api_k"
    echo "管理员密码: $admin_pass"
    echo "会话密钥: $session_sec"
    echo "SMTP 密码: $smtp_pass"
    echo "=============================================="
    echo "密钥文件位置: /Users/yanyu/www/keys/production-secrets.env"
    echo "SSH 配置文件: /Users/yanyu/www/ssh-config.secure"

    log_success "所有安全配置更新完成！"
    log_warning "请："
    log_warning "1. 查看生成的密钥文件"
    log_warning "2. 将 SSH 配置添加到 ~/.ssh/config"
    log_warning "3. 运行安全检查脚本: ./scripts/security-check.sh"
    log_warning "4. 更新服务器上的实际配置"
}

# 执行主函数
main "$@"