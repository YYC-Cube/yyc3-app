#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSL 证书管理脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "=============================================================================="
    echo "🔐 0379.email SSL 证书管理系统"
    echo "=============================================================================="
    echo -e "${NC}"
}

# 显示菜单
show_menu() {
    echo -e "${PURPLE}请选择操作:${NC}"
    echo ""
    echo "  ${CYAN}1.${NC} 设置 SSL 证书"
    echo "  ${CYAN}2.${NC} 续期 SSL 证书"
    echo "  ${CYAN}3.${NC} 测试 SSL 配置"
    echo "  ${CYAN}4.${NC} 查看证书状态"
    echo "  ${CYAN}5.${NC} 设置自动续期"
    echo "  ${CYAN}6.${NC} 备份证书"
    echo "  ${CYAN}7.${NC} 配置安全头"
    echo "  ${CYAN}8.${NC} 启动 SSL 环境"
    echo "  ${CYAN}9.${NC} 生成报告"
    echo "  ${CYAN}0.${NC} 退出"
    echo ""
    echo -n "${YELLOW}请输入选项 [0-9]: ${NC}"
}

# 设置 SSL 证书
setup_ssl() {
    log_info "开始设置 SSL 证书..."
    "$SCRIPT_DIR/setup-ssl.sh"
}

# 续期 SSL 证书
renew_ssl() {
    log_info "开始续期 SSL 证书..."
    "$SCRIPT_DIR/auto-renew-ssl.sh"
}

# 测试 SSL 配置
test_ssl() {
    log_info "开始测试 SSL 配置..."
    "$SCRIPT_DIR/test-ssl.sh"
}

# 查看证书状态
show_certificate_status() {
    log_info "查看 SSL 证书状态..."
    
    echo ""
    echo "📊 证书状态概览:"
    echo "=========================================="
    
    for domain in "${DOMAINS[@]}"; do
        echo ""
        echo "🔗 域名: $domain"
        echo "------------------------------------------"
        
        local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
        
        if [[ -f "$cert_file" ]]; then
            # 证书基本信息
            local subject
            subject=$(sudo openssl x509 -in "$cert_file" -noout -subject | cut -d= -f2)
            local issuer
            issuer=$(sudo openssl x509 -in "$cert_file" -noout -issuer | cut -d= -f2)
            local expiry_date
            expiry_date=$(sudo openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
            local not_before
            not_before=$(sudo openssl x509 -in "$cert_file" -noout -startdate | cut -d= -f2)
            
            # 计算剩余天数
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_remaining
            days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            echo "状态: ✅ 有效"
            echo "颁发者: $issuer"
            echo "生效时间: $not_before"
            echo "过期时间: $expiry_date"
            echo "剩余天数: $days_remaining 天"
            
            # 状态指示
            if [[ $days_remaining -lt 7 ]]; then
                echo -e "⚠️  状态: ${RED}即将过期${NC}"
            elif [[ $days_remaining -lt 30 ]]; then
                echo -e "⚠️  状态: ${YELLOW}需要续期${NC}"
            else
                echo -e "✅ 状态: ${GREEN}正常${NC}"
            fi
            
        else
            echo -e "状态: ${RED}❌ 证书不存在${NC}"
        fi
    done
    
    echo ""
    echo "=========================================="
    echo "📁 证书文件位置: /etc/letsencrypt/live/"
    echo "📋 备份位置: $PROJECT_DIR/certbot/backup/"
    echo "📄 日志文件: $PROJECT_DIR/logs/ssl-renew.log"
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置 SSL 证书自动续期..."
    "$SCRIPT_DIR/setup-crontab.sh"
}

# 备份证书
backup_certificates() {
    log_info "备份 SSL 证书..."
    
    local backup_dir
    backup_dir="$PROJECT_DIR/certbot/backup/manual-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [[ -d "/etc/letsencrypt" ]]; then
        sudo cp -r /etc/letsencrypt "$backup_dir/"
        sudo chown -R $(whoami):$(whoami) "$backup_dir/letsencrypt"
        log_success "证书已备份到: $backup_dir"
        
        # 显示备份大小
        local backup_size
        backup_size=$(du -sh "$backup_dir" | cut -f1)
        echo "备份大小: $backup_size"
    else
        log_error "证书目录不存在"
    fi
}

# 配置安全头
configure_security_headers() {
    log_info "配置安全 HTTP 头..."
    
    local nginx_conf="$PROJECT_DIR/configs/nginx/conf.d/0379email.conf"
    
    if [[ -f "$nginx_conf" ]]; then
        echo ""
        echo "当前安全头配置:"
        echo "------------------------------------------"
        grep -A 10 "add_header.*Strict-Transport-Security" "$nginx_conf" || echo "HSTS 未配置"
        grep -A 5 "add_header.*X-Frame-Options" "$nginx_conf" || echo "X-Frame-Options 未配置"
        grep -A 5 "add_header.*X-Content-Type-Options" "$nginx_conf" || echo "X-Content-Type-Options 未配置"
        grep -A 5 "add_header.*X-XSS-Protection" "$nginx_conf" || echo "X-XSS-Protection 未配置"
        echo "------------------------------------------"
        
        log_success "安全头配置检查完成"
        echo ""
        echo "💡 提示: 如果需要更新安全头配置，请编辑以下文件:"
        echo "   $nginx_conf"
        echo ""
        echo "   然后重启 Nginx 服务:"
        echo "   docker-compose restart nginx"
    else
        log_error "Nginx 配置文件不存在"
    fi
}

# 启动 SSL 环境
start_ssl_environment() {
    log_info "启动 SSL 环境..."
    
    cd "$PROJECT_DIR"
    
    # 检查 Docker Compose 文件
    if [[ -f "docker-compose.ssl.yml" ]]; then
        echo "使用 SSL 配置启动服务..."
        docker-compose -f docker-compose.ssl.yml up -d
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 10
        
        # 检查服务状态
        echo ""
        echo "服务状态:"
        docker-compose -f docker-compose.ssl.yml ps
        
        log_success "SSL 环境启动完成"
        
        echo ""
        echo "🌐 访问地址:"
        for domain in "${DOMAINS[@]}"; do
            echo "   https://$domain"
        done
        
    else
        log_error "SSL 配置文件不存在: docker-compose.ssl.yml"
    fi
}

# 生成报告
generate_reports() {
    log_info "生成 SSL 管理报告..."
    
    local report_dir="$PROJECT_DIR/certbot/reports"
    mkdir -p "$report_dir"
    
    # 证书状态报告
    local status_report="$report_dir/certificate-status-$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "=============================================================================="
        echo "0379.email SSL 证书状态报告"
        echo "生成时间: $(date)"
        echo "=============================================================================="
        echo ""
        
        for domain in "${DOMAINS[@]}"; do
            echo "域名: $domain"
            echo "------------------------------"
            
            local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
            if [[ -f "$cert_file" ]]; then
                local expiry_date
                expiry_date=$(sudo openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
                echo "状态: 已安装"
                echo "有效期: $expiry_date"
            else
                echo "状态: 未安装"
            fi
            echo ""
        done
        
        echo "=============================================================================="
        
    } > "$status_report"
    
    # 配置摘要报告
    local config_report="$report_dir/configuration-summary-$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "=============================================================================="
        echo "0379.email SSL 配置摘要"
        echo "生成时间: $(date)"
        echo "=============================================================================="
        echo ""
        echo "域名列表:"
        for domain in "${DOMAINS[@]}"; do
            echo "  - $domain"
        done
        echo ""
        echo "配置文件:"
        echo "  - Nginx 主配置: $PROJECT_DIR/configs/nginx/nginx.conf"
        echo "  - 站点配置: $PROJECT_DIR/configs/nginx/conf.d/0379email.conf"
        echo "  - SSL 脚本: $SCRIPT_DIR/"
        echo "  - Docker 配置: $PROJECT_DIR/docker-compose.ssl.yml"
        echo ""
        echo "管理命令:"
        echo "  - 设置证书: $0"
        echo "  - 续期证书: $SCRIPT_DIR/auto-renew-ssl.sh"
        echo "  - 测试配置: $SCRIPT_DIR/test-ssl.sh"
        echo "  - 查看状态: sudo certbot certificates"
        echo ""
        
    } > "$config_report"
    
    log_success "报告已生成:"
    echo "  - 证书状态报告: $status_report"
    echo "  - 配置摘要报告: $config_report"
}

# 主菜单循环
main_menu() {
    show_banner
    
    while true; do
        show_menu
        read -r choice
        echo ""
        
        case $choice in
            1)
                setup_ssl
                ;;
            2)
                renew_ssl
                ;;
            3)
                test_ssl
                ;;
            4)
                show_certificate_status
                ;;
            5)
                setup_auto_renewal
                ;;
            6)
                backup_certificates
                ;;
            7)
                configure_security_headers
                ;;
            8)
                start_ssl_environment
                ;;
            9)
                generate_reports
                ;;
            0)
                log_info "退出 SSL 管理系统"
                break
                ;;
            *)
                log_error "无效选项，请重新选择"
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}按回车键继续...${NC}"
        read -r
        echo ""
    done
}

# 显示帮助信息
show_help() {
    echo "SSL 证书管理脚本"
    echo ""
    echo "用法:"
    echo "  $0                    # 启动交互式菜单"
    echo "  $0 setup             # 设置 SSL 证书"
    echo "  $0 renew             # 续期 SSL 证书"
    echo "  $0 test              # 测试 SSL 配置"
    echo "  $0 status            # 查看证书状态"
    echo "  $0 auto-renew        # 设置自动续期"
    echo "  $0 backup            # 备份证书"
    echo "  $0 security          # 配置安全头"
    echo "  $0 start             # 启动 SSL 环境"
    echo "  $0 report            # 生成报告"
    echo "  $0 --help            # 显示帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        setup)
            setup_ssl
            ;;
        renew)
            renew_ssl
            ;;
        test)
            test_ssl
            ;;
        status)
            show_certificate_status
            ;;
        auto-renew)
            setup_auto_renewal
            ;;
        backup)
            backup_certificates
            ;;
        security)
            configure_security_headers
            ;;
        start)
            start_ssl_environment
            ;;
        report)
            generate_reports
            ;;
        --help|-h)
            show_help
            ;;
        "")
            main_menu
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
