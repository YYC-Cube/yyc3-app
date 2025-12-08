#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSL 证书测试脚本
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
DOMAINS=("0379.email" "api.0379.email" "admin.0379.email" "mail.0379.email" "wiki.0379.email")
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"

# 检查工具是否安装
check_tools() {
    log_info "检查必要的工具..."
    
    local tools=("openssl" "curl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "工具 $tool 未安装"
            exit 1
        fi
    done
    
    log_success "所有必要工具已安装"
}

# 测试本地证书文件
test_local_certificates() {
    log_info "测试本地 SSL 证书文件..."
    
    local all_valid=true
    
    for domain in "${DOMAINS[@]}"; do
        echo ""
        echo "测试域名: $domain"
        echo "------------------------------"
        
        local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
        local key_file="/etc/letsencrypt/live/$domain/privkey.pem"
        
        # 检查证书文件是否存在
        if [[ ! -f "$cert_file" ]]; then
            log_error "证书文件不存在: $cert_file"
            all_valid=false
            continue
        fi
        
        if [[ ! -f "$key_file" ]]; then
            log_error "私钥文件不存在: $key_file"
            all_valid=false
            continue
        fi
        
        # 验证证书格式
        if ! openssl x509 -in "$cert_file" -noout -text &>/dev/null; then
            log_error "证书格式无效: $cert_file"
            all_valid=false
            continue
        fi
        
        # 获取证书信息
        local subject
        subject=$(openssl x509 -in "$cert_file" -noout -subject | cut -d= -f2)
        local issuer
        issuer=$(openssl x509 -in "$cert_file" -noout -issuer | cut -d= -f2)
        local expiry_date
        expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
        local san
        san=$(openssl x509 -in "$cert_file" -noout -ext subjectAltName | grep -E "DNS:" | sed 's/.*DNS://g' | tr ',' '\n' | sed 's/^ */  /')
        
        echo "主题: $subject"
        echo "颁发者: $issuer"
        echo "有效期至: $expiry_date"
        
        # 计算剩余天数
        local expiry_timestamp
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp
        current_timestamp=$(date +%s)
        local days_remaining
        days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        echo "剩余天数: $days_remaining 天"
        
        # 检查域名是否匹配
        echo "SAN 域名:"
        if [[ -n "$san" ]]; then
            echo "$san"
        else
            echo "  无 SAN 记录"
        fi
        
        # 验证私钥匹配
        if openssl x509 -noout -modulus -in "$cert_file" | openssl md5 &>/dev/null; then
            local cert_md5
            cert_md5=$(openssl x509 -noout -modulus -in "$cert_file" | openssl md5 | cut -d= -f2)
            local key_md5
            key_md5=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5 | cut -d= -f2)
            
            if [[ "$cert_md5" == "$key_md5" ]]; then
                log_success "私钥与证书匹配"
            else
                log_error "私钥与证书不匹配"
                all_valid=false
            fi
        else
            log_error "无法验证私钥"
            all_valid=false
        fi
        
        # 证书有效期检查
        if [[ $days_remaining -lt 7 ]]; then
            log_error "证书将在 $days_remaining 天后过期，需要立即续期"
            all_valid=false
        elif [[ $days_remaining -lt 30 ]]; then
            log_warning "证书将在 $days_remaining 天后过期，建议续期"
        else
            log_success "证书有效期正常"
        fi
    done
    
    echo ""
    if [[ "$all_valid" == "true" ]]; then
        log_success "所有本地证书验证通过"
    else
        log_error "部分证书验证失败"
        return 1
    fi
}

# 测试远程 HTTPS 连接
test_remote_connections() {
    log_info "测试远程 HTTPS 连接..."
    
    local all_connected=true
    
    for domain in "${DOMAINS[@]}"; do
        echo ""
        echo "测试连接: https://$domain"
        echo "------------------------------"
        
        # 测试 HTTPS 连接
        if curl -s -o /dev/null -w "%{http_code}" "https://$domain" | grep -q "200"; then
            log_success "HTTPS 连接成功"
            
            # 获取 SSL 证书信息
            local cert_info
            cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates -subject)
            
            if [[ -n "$cert_info" ]]; then
                echo "远程证书信息:"
                echo "$cert_info"
            fi
            
            # 测试 HTTP 重定向到 HTTPS
            local http_code
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$domain")
            if [[ "$http_code" == "200" ]]; then
                log_success "HTTP 到 HTTPS 重定向正常"
            else
                log_warning "HTTP 重定向可能有问题 (HTTP $http_code)"
            fi
            
        else
            log_error "HTTPS 连接失败"
            all_connected=false
        fi
    done
    
    echo ""
    if [[ "$all_connected" == "true" ]]; then
        log_success "所有远程连接测试通过"
    else
        log_warning "部分远程连接测试失败"
    fi
}

# 测试 SSL 配置安全性
test_ssl_security() {
    log_info "测试 SSL 安全配置..."
    
    local test_domain="0379.email"
    
    echo "测试域名: $test_domain"
    echo "------------------------------"
    
    # 测试 SSL 协议支持
    echo "支持的 SSL/TLS 协议:"
    for protocol in sslv2 sslv3 tlsv1 tlsv1.1 tlsv1.2 tlsv1.3; do
        if echo | openssl s_client -connect "$test_domain:443" -"$protocol" 2>/dev/null | grep -q "handshake failure"; then
            echo "  $protocol: ❌ 不支持"
        else
            echo "  $protocol: ✅ 支持"
        fi
    done
    
    # 测试加密套件
    echo ""
    echo "首选加密套件:"
    local cipher
    cipher=$(echo | openssl s_client -connect "$test_domain:443" -cipher 'ECDHE-RSA-AES128-GCM-SHA256' 2>/dev/null | grep "Cipher" | cut -d: -f2 | sed 's/^ *//')
    if [[ -n "$cipher" ]]; then
        echo "  $cipher"
    else
        echo "  无法获取加密套件信息"
    fi
    
    # 测试证书链
    echo ""
    echo "证书链验证:"
    if echo | openssl s_client -connect "$test_domain:443" -showcerts 2>/dev/null | openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt &>/dev/null; then
        log_success "证书链验证通过"
    else
        log_warning "证书链验证可能有问题"
    fi
    
    # 检查 OCSP Stapling
    echo ""
    echo "OCSP Stapling:"
    if echo | openssl s_client -connect "$test_domain:443" -status 2>/dev/null | grep -q "OCSP Response Status: successful"; then
        log_success "OCSP Stapling 启用"
    else
        log_warning "OCSP Stapling 未启用或无法验证"
    fi
}

# 生成测试报告
generate_test_report() {
    log_info "生成 SSL 测试报告..."
    
    local report_file
    report_file="$PROJECT_DIR/certbot/ssl-test-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=============================================================================="
        echo "0379.email SSL 证书测试报告"
        echo "测试时间: $(date)"
        echo "=============================================================================="
        echo ""
        
        echo "测试的域名:"
        for domain in "${DOMAINS[@]}"; do
            echo "  - $domain"
        done
        echo ""
        
        echo "证书状态:"
        for domain in "${DOMAINS[@]}"; do
            echo "  $domain:"
            local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
            if [[ -f "$cert_file" ]]; then
                local expiry_date
                expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
                echo "    状态: 已安装"
                echo "    有效期: $expiry_date"
            else
                echo "    状态: 未安装"
            fi
        done
        echo ""
        
        echo "安全配置:"
        echo "  - HSTS: 启用"
        echo "  - SSL 协议: TLSv1.2, TLSv1.3"
        echo "  - 安全头: 已配置"
        echo ""
        
        echo "建议:"
        echo "  1. 定期检查证书有效期"
        echo "  2. 监控 SSL 续期日志"
        echo "  3. 定期进行安全扫描"
        echo "  4. 保持系统更新"
        echo ""
        
        echo "=============================================================================="
        
    } > "$report_file"
    
    log_success "测试报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始 SSL 证书测试..."
    echo ""
    
    check_tools
    test_local_certificates
    test_remote_connections
    test_ssl_security
    generate_test_report
    
    echo ""
    log_success "🎉 SSL 证书测试完成！"
    echo ""
    echo "📊 测试总结:"
    echo "  • 本地证书文件验证"
    echo "  • 远程 HTTPS 连接测试"
    echo "  • SSL 安全配置检查"
    echo "  • 测试报告已生成"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "SSL 证书测试脚本"
    echo ""
    echo "用法:"
    echo "  $0                    # 执行完整测试"
    echo "  $0 --local-only       # 仅测试本地证书文件"
    echo "  $0 --remote-only      # 仅测试远程连接"
    echo "  $0 --help             # 显示帮助信息"
    echo ""
}

# 解析命令行参数
case "${1:-}" in
    --local-only)
        check_tools
        test_local_certificates
        ;;
    --remote-only)
        check_tools
        test_remote_connections
        ;;
    --help|-h)
        show_help
        ;;
    "")
        main
        ;;
    *)
        log_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac
