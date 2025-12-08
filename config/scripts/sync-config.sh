#!/bin/bash

# =============================================================================
# 0379.email 配置同步脚本
# 从源项目目录同步配置到Consul和Vault
# =============================================================================

set -e

# 配置变量
CONSUL_ADDR="${CONSUL_ADDR:-consul:8500}"
VAULT_ADDR="${VAULT_ADDR:-vault:8200}"
VAULT_TOKEN="${VAULT_TOKEN:-vs-0379-email-root}"
SOURCE_DIR="/source"

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

# 检查Consul连接
check_consul() {
    log_info "检查Consul连接..."
    if curl -s "$CONSUL_ADDR/v1/status/leader" | grep -q "."; then
        log_success "Consul连接正常"
        return 0
    else
        log_error "Consul连接失败"
        return 1
    fi
}

# 检查Vault连接
check_vault() {
    log_info "检查Vault连接..."
    if curl -s "$VAULT_ADDR/v1/sys/health" -H "X-Vault-Token: $VAULT_TOKEN" | grep -q "initialized"; then
        log_success "Vault连接正常"
        return 0
    else
        log_error "Vault连接失败"
        return 1
    fi
}

# 同步服务配置到Consul
sync_services_to_consul() {
    log_info "同步服务配置到Consul..."

    # API服务配置
    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/api-service/config" \
        -d '{
            "port": 3000,
            "host": "localhost",
            "environment": "production",
            "database": {
                "host": "mariadb",
                "port": 3306,
                "name": "0379_email_prod"
            },
            "redis": {
                "host": "redis",
                "port": 6379
            }
        }' > /dev/null

    # 管理后台配置
    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/admin-service/config" \
        -d '{
            "port": 3001,
            "host": "localhost",
            "api_url": "http://localhost:3000",
            "environment": "production"
        }' > /dev/null

    # LLM服务配置
    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/llm-service/config" \
        -d '{
            "port": 8000,
            "host": "localhost",
            "environment": "production",
            "model_path": "/models",
            "max_tokens": 2048,
            "temperature": 0.7
        }' > /dev/null

    # 邮件服务配置
    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/mail-service/config" \
        -d '{
            "port": 3003,
            "host": "localhost",
            "environment": "production",
            "smtp": {
                "host": "smtp.0379.email",
                "port": 587,
                "user": "noreply@0379.email"
            }
        }' > /dev/null

    log_success "服务配置同步完成"
}

# 同步环境变量到Consul
sync_env_to_consul() {
    log_info "同步环境变量到Consul..."

    # 处理.env文件
    if [[ -f "$SOURCE_DIR/.env" ]]; then
        while IFS='=' read -r key value; do
            # 跳过注释和空行
            [[ $key =~ ^[[:space:]]*# ]] && continue
            [[ -z $key ]] && continue

            # URL编码value
            encoded_value=$(echo -n "$value" | jq -sRr @uri)

            curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/env/$key" \
                -d "$value" > /dev/null
        done < "$SOURCE_DIR/.env"
    fi

    # 处理各项目的环境配置
    for project_dir in "$SOURCE_DIR"/app/*/; do
        if [[ -d "$project_dir" ]]; then
            project_name=$(basename "$project_dir")
            if [[ -f "$project_dir/.env" ]]; then
                while IFS='=' read -r key value; do
                    [[ $key =~ ^[[:space:]]*# ]] && continue
                    [[ -z $key ]] && continue

                    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/projects/$project_name/env/$key" \
                        -d "$value" > /dev/null
                done < "$project_dir/.env"
            fi
        fi
    done

    log_success "环境变量同步完成"
}

# 同步密钥到Vault
sync_secrets_to_vault() {
    log_info "同步密钥到Vault..."

    # 启用Kv v2 secrets engine
    curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/secret" \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        -d '{"type": "kv-v2"}' > /dev/null 2>&1 || true

    # 数据库密钥
    curl -s -X PUT "$VAULT_ADDR/v1/secret/data/0379-email/database" \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        -d '{
            "data": {
                "mariadb_password": "UserSecurePass123456",
                "postgres_password": "PostgresSecurePass123456",
                "mongodb_password": "MongoSecurePass123456",
                "redis_password": "RedisSecurePass123456"
            }
        }' > /dev/null

    # JWT密钥
    curl -s -X PUT "$VAULT_ADDR/v1/secret/data/0379-email/jwt" \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        -d '{
            "data": {
                "secret": "JWTSecretKey0379Email2025",
                "algorithm": "HS256",
                "expiry": "24h"
            }
        }' > /dev/null

    # SMTP密钥
    curl -s -X PUT "$VAULT_ADDR/v1/secret/data/0379-email/smtp" \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        -d '{
            "data": {
                "password": "SMTPSecurePass123456",
                "user": "noreply@0379.email",
                "from_email": "noreply@0379.email"
            }
        }' > /dev/null

    # API密钥
    curl -s -X PUT "$VAULT_ADDR/v1/secret/data/0379-email/api-keys" \
        -H "X-Vault-Token: $VAULT_TOKEN" \
        -d '{
            "data": {
                "kong_admin": "admin-key-0379-email-2025",
                "kong_api": "api-key-0379-email-2025",
                "kong_llm": "llm-key-0379-email-2025",
                "kong_mail": "mail-key-0379-email-2025"
            }
        }' > /dev/null

    log_success "密钥同步完成"
}

# 同步端口配置
sync_port_config() {
    log_info "同步端口配置到Consul..."

    curl -s -X PUT "$CONSUL_ADDR/v1/kv/0379-email/network/ports" \
        -d '{
            "api_service": 3000,
            "admin_service": 3001,
            "llm_service": 3002,
            "mail_service": 3003,
            "redis": 6379,
            "mariadb": 3306,
            "postgres": 5432,
            "mongodb": 27017,
            "consul": 8500,
            "vault": 8200,
            "kong_admin": 8001,
            "kong_proxy": 8000,
            "prometheus": 9090,
            "grafana": 3005
        }' > /dev/null

    log_success "端口配置同步完成"
}

# 主函数
main() {
    log_info "开始配置同步..."

    # 检查连接
    check_consul || exit 1
    check_vault || exit 1

    # 执行同步
    sync_services_to_consul
    sync_env_to_consul
    sync_secrets_to_vault
    sync_port_config

    log_success "配置同步完成！"
}

# 执行主函数
main "$@"