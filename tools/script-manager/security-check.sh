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
