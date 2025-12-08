#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSL 证书自动续期脚本
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
    echo -e "${BLUE}[$(date "+%Y-%m-%d %H:%M:%S")] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date "+%Y-%m-%d %H:%M:%S")] [SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date "+%Y-%m-%d %H:%M:%S")] [ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date "+%Y-%m-%d %H:%M:%S")] [WARNING]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_DIR/logs/ssl-renew.log"
DOMAINS=("0379.email" "api.0379.email" "admin.0379.email" "mail.0379.email" "wiki.0379.email")

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 日志记录函数
write_log() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
}

# 检查证书有效期
check_certificate_expiry() {
    local domain="$1"
    
    if [[ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        write_log "WARNING: $domain 证书文件不存在"
        return 1
    fi
    
    # 获取证书到期时间
    local expiry_date
    expiry_date=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -enddate | cut -d= -f2)
    
    # 转换为时间戳
    local expiry_timestamp
    expiry_timestamp=$(date -d "$expiry_date" +%s)
    
    # 当前时间戳
    local current_timestamp
    current_timestamp=$(date +%s)
    
    # 计算剩余天数
    local days_remaining
    days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    write_log "INFO: $domain 证书剩余有效天数: $days_remaining 天"
    
    # 如果剩余天数少于 30 天，需要续期
    if [[ $days_remaining -lt 30 ]]; then
        log_warning "$domain 证书将在 $days_remaining 天后到期，需要续期"
        write_log "WARNING: $domain 证书将在 $days_remaining 天后到期，需要续期"
        return 0
    fi
    
    return 1
}

# 续期证书
renew_certificates() {
    log_info "开始检查 SSL 证书续期..."
    write_log "INFO: 开始 SSL 证书检查和续期流程"
    
    local renewal_needed=false
    
    # 检查所有域名的证书
    for domain in "${DOMAINS[@]}"; do
        if check_certificate_expiry "$domain"; then
            renewal_needed=true
        fi
    done
    
    # 如果需要续期
    if [[ "$renewal" == "true" ]]; then
        log_info "开始续期 SSL 证书..."
        write_log "INFO: 开始执行证书续期"
        
        # 备份当前证书
        log_info "备份当前证书..."
        local backup_dir
        backup_dir="$PROJECT_DIR/certbot/backup/before-renewal-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        if [[ -d "/etc/letsencrypt" ]]; then
            sudo cp -r /etc/letsencrypt "$backup_dir/"
            sudo chown -R $(whoami):$(whoami) "$backup_dir/letsencrypt"
            write_log "INFO: 证书已备份到 $backup_dir"
        fi
        
        # 停止 Nginx
        log_info "停止 Nginx 服务..."
        if docker-compose ps nginx | grep -q "Up"; then
            docker-compose stop nginx
            write_log "INFO: Nginx 服务已停止"
        fi
        
        # 执行续期
        local renewal_success=false
        if sudo certbot renew --non-interactive --post-hook "echo '续期完成'"; then
            log_success "SSL 证书续期成功"
            write_log "SUCCESS: SSL 证书续期成功"
            renewal_success=true
        else
            log_error "SSL 证书续期失败"
            write_log "ERROR: SSL 证书续期失败"
        fi
        
        # 重启 Nginx
        log_info "重启 Nginx 服务..."
        cd "$PROJECT_DIR"
        docker-compose up -d nginx
        write_log "INFO: Nginx 服务已重启"
        
        # 验证续期后的证书
        if [[ "$renewal_success" == "true" ]]; then
            log_info "验证续期后的证书..."
            for domain in "${DOMAINS[@]}"; do
                if check_certificate_expiry "$domain"; then
                    # 检查证书是否真的更新了
                    if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
                        local new_expiry
                        new_expiry=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -enddate | cut -d= -f2)
                        log_success "$domain 证书已更新，新有效期: $new_expiry"
                        write_log "SUCCESS: $domain 证书已更新，新有效期: $new_expiry"
                    fi
                fi
            done
        fi
        
        # 发送通知（如果配置了）
        send_notification "$renewal_success"
        
    else
        log_info "所有证书都在有效期内，无需续期"
        write_log "INFO: 所有证书都在有效期内，无需续期"
    fi
}

# 发送通知
send_notification() {
    local success="$1"
    
    # 这里可以添加邮件、钉钉、企业微信等通知方式
    # 目前只记录日志
    if [[ "$success" == "true" ]]; then
        log_success "SSL 证书续期通知: 续期成功"
        write_log "NOTIFICATION: SSL 证书续期成功"
    else
        log_error "SSL 证书续期通知: 续期失败，需要手动处理"
        write_log "NOTIFICATION: SSL 证书续期失败，需要手动处理"
    fi
}

# 清理旧日志
cleanup_old_logs() {
    # 保留最近 30 天的日志
    find "$(dirname "$LOG_FILE")" -name "ssl-renew.log.*" -mtime +30 -delete 2>/dev/null || true
}

# 生成证书状态报告
generate_status_report() {
    local report_file
    report_file="$PROJECT_DIR/certbot/ssl-status-$(date +%Y%m%d).json"
    
    # 创建 JSON 格式的状态报告
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"domains\": ["
        
        local first=true
        for domain in "${DOMAINS[@]}"; do
            if [[ "$first" == "false" ]]; then
                echo ","
            fi
            first=false
            
            echo -n "    {"
            echo -n "\"domain\": \"$domain\","
            
            if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
                local expiry_date
                expiry_date=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -enddate | cut -d= -f2)
                local expiry_timestamp
                expiry_timestamp=$(date -d "$expiry_date" +%s)
                local current_timestamp
                current_timestamp=$(date +%s)
                local days_remaining
                days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                echo -n "\"status\": \"valid\","
                echo -n "\"expiry_date\": \"$expiry_date\","
                echo -n "\"days_remaining\": $days_remaining"
            else
                echo -n "\"status\": \"missing\","
                echo -n "\"expiry_date\": null,"
                echo -n "\"days_remaining\": 0"
            fi
            
            echo -n "}"
        done
        
        echo ""
        echo "  ]"
        echo "}"
    } > "$report_file"
    
    write_log "INFO: 证书状态报告已生成: $report_file"
}

# 主函数
main() {
    # 检查是否以 root 权限运行
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要 root 权限运行"
        echo "请使用: sudo $0"
        exit 1
    fi
    
    log_info "开始 SSL 证书自动续期检查..."
    write_log "INFO: ========== SSL 证书自动续期检查开始 =========="
    
    # 续期证书
    renew_certificates
    
    # 生成状态报告
    generate_status_report
    
    # 清理旧日志
    cleanup_old_logs
    
    log_success "SSL 证书自动续期检查完成"
    write_log "INFO: ========== SSL 证书自动续期检查完成 =========="
}

# 显示帮助信息
show_help() {
    echo "SSL 证书自动续期脚本"
    echo ""
    echo "用法:"
    echo "  $0                    # 执行证书续期检查"
    echo "  $0 --check-only       # 仅检查证书状态，不执行续期"
    echo "  $0 --help             # 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  sudo $0               # 推荐的执行方式"
    echo ""
}

# 解析命令行参数
case "${1:-}" in
    --check-only)
        # 仅检查证书状态
        for domain in "${DOMAINS[@]}"; do
            check_certificate_expiry "$domain"
        done
        ;;
    --help|-h)
        show_help
        ;;
    "")
        # 默认执行续期检查
        main
        ;;
    *)
        log_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac
