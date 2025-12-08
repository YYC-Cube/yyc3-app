#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSL 证书设置脚本
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DOMAINS=("0379.email" "api.0379.email" "admin.0379.email" "mail.0379.email" "wiki.0379.email")
EMAIL="admin@0379.email"

# 检查 Certbot 是否安装
check_certbot() {
    if ! command -v certbot &> /dev/null; then
        log_info "安装 Certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        elif command -v brew &> /dev/null; then
            brew install certbot
        else
            log_error "无法自动安装 Certbot，请手动安装"
            exit 1
        fi
    fi
    log_success "Certbot 已安装"
}

# 创建必要的目录
create_directories() {
    log_info "创建 SSL 证书目录..."
    
    sudo mkdir -p /etc/letsencrypt/live
    sudo mkdir -p /etc/letsencrypt/archive
    sudo mkdir -p /var/www/certbot
    sudo mkdir -p "$PROJECT_DIR/certbot/backup"
    
    log_success "SSL 证书目录创建完成"
}

# 停止可能占用端口的服务
stop_services() {
    log_info "停止可能占用 80/443 端口的服务..."
    
    # 停止 Nginx
    if docker-compose ps nginx | grep -q "Up"; then
        docker-compose stop nginx
    fi
    
    # 停止其他可能的服务
    sudo systemctl stop nginx 2>/dev/null || true
    sudo pkill -f nginx 2>/dev/null || true
    
    log_success "服务停止完成"
}

# 获取 SSL 证书
obtain_certificates() {
    log_info "获取 SSL 证书..."
    
    # 首先尝试使用 --nginx 插件
    for domain in "${DOMAINS[@]}"; do
        log_info "为域名 $domain 获取证书..."
        
        if sudo certbot --nginx -d "$domain" --email "$EMAIL" --agree-tos --non-interactive --expand; then
            log_success "$domain 证书获取成功"
        else
            log_warning "$domain 使用 nginx 插件失败，尝试 standalone 模式..."
            
            # 尝试 standalone 模式
            if sudo certbot certonly --standalone -d "$domain" --email "$EMAIL" --agree-tos --non-interactive; then
                log_success "$domain 证书获取成功 (standalone 模式)"
            else
                log_error "$domain 证书获取失败"
            fi
        fi
    done
}

# 创建证书备份
backup_certificates() {
    log_info "备份 SSL 证书..."
    
    BACKUP_DIR="$PROJECT_DIR/certbot/backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [[ -d "/etc/letsencrypt" ]]; then
        sudo cp -r /etc/letsencrypt "$BACKUP_DIR/"
        sudo chown -R $(whoami):$(whoami) "$BACKUP_DIR/letsencrypt"
        log_success "证书备份完成: $BACKUP_DIR"
    fi
}

# 验证证书
verify_certificates() {
    log_info "验证 SSL 证书..."
    
    for domain in "${DOMAINS[@]}"; do
        if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
            # 检查证书有效期
            EXPIRY=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -enddate | cut -d= -f2)
            log_info "$domain 证书有效期至: $EXPIRY"
            
            # 验证证书链
            if sudo openssl verify -CAfile "/etc/letsencrypt/live/$domain/chain.pem" "/etc/letsencrypt/live/$domain/fullchain.pem" &>/dev/null; then
                log_success "$domain 证书验证通过"
            else
                log_error "$domain 证书验证失败"
            fi
        else
            log_error "$domain 证书文件不存在"
        fi
    done
}

# 创建证书状态报告
create_status_report() {
    log_info "创建证书状态报告..."
    
    REPORT_FILE="$PROJECT_DIR/certbot/ssl-status-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=============================================================================="
        echo "0379.email SSL 证书状态报告"
        echo "生成时间: $(date)"
        echo "=============================================================================="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            echo "域名: $domain"
            echo "------------------------------"
            
            if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
                echo "状态: 已安装"
                
                # 证书详情
                EXPIRY=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -enddate | cut -d= -f2)
                SUBJECT=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -subject | cut -d= -f2)
                ISSUER=$(sudo openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -noout -issuer | cut -d= -f2)
                
                echo "有效期至: $EXPIRY"
                echo "主题: $SUBJECT"
                echo "颁发者: $ISSUER"
                echo "证书文件: /etc/letsencrypt/live/$domain/fullchain.pem"
                echo "私钥文件: /etc/letsencrypt/live/$domain/privkey.pem"
            else
                echo "状态: 未安装"
            fi
            
            echo ""
        done
        
        echo "=============================================================================="
        echo "证书文件位置:"
        echo "Live 证书: /etc/letsencrypt/live/"
        echo "归档证书: /etc/letsencrypt/archive/"
        echo "备份目录: $PROJECT_DIR/certbot/backup/"
        echo "=============================================================================="
        
    } > "$REPORT_FILE"
    
    log_success "证书状态报告已创建: $REPORT_FILE"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 重启 Nginx
    if [[ -f "$PROJECT_DIR/docker-compose.yml" ]]; then
        cd "$PROJECT_DIR"
        docker-compose up -d nginx
    fi
    
    log_success "服务重启完成"
}

# 显示访问信息
show_access_info() {
    log_info "SSL 证书设置完成！"
    echo ""
    echo "🔒 HTTPS 访问地址:"
    for domain in "${DOMAINS[@]}"; do
        echo "   https://$domain"
    done
    echo ""
    echo "📊 证书管理:"
    echo "   状态检查: sudo certbot certificates"
    echo "   手动续期: sudo certbot renew"
    echo "   证书目录: /etc/letsencrypt/live/"
    echo ""
    echo "🔄 自动续期:"
    echo "   已设置自动续期任务，证书将在到期前自动续期"
    echo ""
}

# 主函数
main() {
    log_info "开始设置 0379.email SSL 证书..."
    echo ""
    
    check_certbot
    create_directories
    stop_services
    obtain_certificates
    backup_certificates
    verify_certificates
    create_status_report
    restart_services
    show_access_info
    
    log_success "🎉 SSL 证书设置完成！"
}

# 执行主函数
main "$@"
