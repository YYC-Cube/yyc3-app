#!/bin/bash
# =============================================================================
# 0379.email 项目 - 安全密码生成脚本
# 生成随机强密码并更新配置文件
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

# 安全替换函数
safe_replace() {
    local file="$1"
    local old_pattern="$2"
    local new_value="$3"

    if [[ -f "$file" ]] && [[ -n "$new_value" ]]; then
        # 转义特殊字符
        local escaped_pattern=$(printf '%s\n' "$old_pattern" | sed -e 's/[]\/$*.^[]/\\&/g')
        local escaped_value=$(printf '%s\n' "$new_value" | sed -e 's/[]\/$*.^[]/\\&/g')

        sed -i.bak "s/${escaped_pattern}/${escaped_value}/g" "$file"
    fi
}

# 更新 Redis 配置
update_redis_config() {
    local redis_prod_config="/Users/yanyu/www/redis-config/config/redis-prod.conf"
    local redis_env_example="/Users/yanyu/www/redis-config/.env.example"

    if [[ -f "$redis_prod_config" ]]; then
        backup_file "$redis_prod_config"

        local new_redis_password=$(generate_password 24)

        # 更新 Redis 生产配置
        safe_replace "$redis_prod_config" "requirepass redis_yyc3" "requirepass $new_redis_password"

        log_success "Redis 生产密码已更新"
    fi

    if [[ -f "$redis_env_example" ]]; then
        backup_file "$redis_env_example"

        # 更新环境变量示例文件
        safe_replace "$redis_env_example" "REDIS_PROD_PASSWORD=redis_yyc3" "REDIS_PROD_PASSWORD=$new_redis_password"

        log_success "Redis 环境变量示例已更新"
    fi
}

# 更新应用环境变量
update_app_env() {
    local app_env_example="/Users/yanyu/www/app/.env.example"
    local api_env_example="/Users/yanyu/www/app/api/.env.example"

    local new_jwt_secret=$(generate_password 64)
    local new_admin_password=$(generate_password 16)
    local new_api_key=$(generate_password 32)

    # 更新主应用环境变量
    if [[ -f "$app_env_example" ]]; then
        backup_file "$app_env_example"

        safe_replace "$app_env_example" "your-jwt-secret-change-in-production" "$new_jwt_secret"
        safe_replace "$app_env_example" "change-this-password" "$new_admin_password"

        log_success "主应用环境变量已更新"
    fi

    # 更新API环境变量
    if [[ -f "$api_env_example" ]]; then
        backup_file "$api_env_example"

        safe_replace "$api_env_example" "your-jwt-secret-change-in-production" "$new_jwt_secret"
        safe_replace "$api_env_example" "change-this-password" "$new_admin_password"

        log_success "API环境变量已更新"
    fi
}

# 创建安全的环境变量模板
create_secure_env_template() {
    local secure_env_template="/Users/yanyu/www/.env.production.template"

    cat > "$secure_env_template" << 'EOF'
# =============================================================================
# 0379.email 项目 - 生产环境变量模板
# 请将此文件复制为 .env.production 并填入实际值
# =============================================================================

# 应用配置
NODE_ENV=production
PORT=3000
API_PORT=3001

# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/emaildb
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# JWT 配置
JWT_SECRET=YOUR_SECURE_JWT_SECRET
JWT_EXPIRES_IN=24h

# 管理员配置
ADMIN_EMAIL=admin@0379.email
ADMIN_PASSWORD=YOUR_SECURE_ADMIN_PASSWORD

# API 密钥
API_KEY=YOUR_SECURE_API_KEY

# CORS 配置
CORS_ORIGIN=https://0379.email

# 邮件服务配置
SMTP_HOST=smtp.0379.email
SMTP_PORT=587
SMTP_USER=noreply@0379.email
SMTP_PASSWORD=YOUR_SMTP_PASSWORD

# 监控配置
SENTRY_DSN=YOUR_SENTRY_DSN
LOG_LEVEL=info

# 安全配置
BCRYPT_ROUNDS=12
SESSION_SECRET=YOUR_SECURE_SESSION_SECRET
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/uploads

# SSL 配置
SSL_CERT_PATH=/etc/nginx/ssl/0379.email.crt
SSL_KEY_PATH=/etc/nginx/ssl/0379.email.key

# 监控端点
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
EOF

    log_success "安全的环境变量模板已创建: $secure_env_template"
}

# 生成生产环境密钥文件
generate_production_keys() {
    local keys_dir="/Users/yanyu/www/keys"
    mkdir -p "$keys_dir"

    # 生成各种密钥
    local redis_password=$(generate_password 24)
    local jwt_secret=$(generate_password 64)
    local admin_password=$(generate_password 16)
    local api_key=$(generate_password 32)
    local session_secret=$(generate_password 32)
    local smtp_password=$(generate_password 24)

    # 创建密钥文件
    cat > "$keys_dir/secrets.env" << EOF
# 生产环境密钥 - 生成时间: $(date)
REDIS_PASSWORD=$redis_password
JWT_SECRET=$jwt_secret
ADMIN_PASSWORD=$admin_password
API_KEY=$api_key
SESSION_SECRET=$session_secret
SMTP_PASSWORD=$smtp_password
EOF

    chmod 600 "$keys_dir/secrets.env"
    log_success "生产环境密钥已生成: $keys_dir/secrets.env"

    # 显示生成的密钥（供手动复制）
    log_warning "请保存以下密钥到安全的地方："
    echo "=================================="
    echo "Redis 密码: $redis_password"
    echo "JWT 密钥: $jwt_secret"
    echo "管理员密码: $admin_password"
    echo "API 密钥: $api_key"
    echo "会话密钥: $session_secret"
    echo "SMTP 密码: $smtp_password"
    echo "=================================="
}

# 主函数
main() {
    log_info "开始 0379.email 项目安全密码生成..."

    # 检查是否在正确的目录
    if [[ ! -d "/Users/yanyu/www" ]]; then
        log_error "错误: 未找到 www 目录"
        exit 1
    fi

    # 执行各项更新
    update_redis_config
    update_app_env
    create_secure_env_template
    generate_production_keys

    log_success "安全密码生成完成！"
    log_warning "请检查备份文件并更新实际生产环境配置"
    log_warning "建议将生成的密钥保存到密码管理器中"
}

# 执行主函数
main "$@"