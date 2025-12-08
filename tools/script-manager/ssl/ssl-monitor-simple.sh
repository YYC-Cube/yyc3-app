#!/bin/bash

# =============================================================================
# 0379.email SSL证书监控脚本 - 简化版
# =============================================================================

set -euo pipefail

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/ssl"
REPORT_DIR="$PROJECT_ROOT/reports/ssl"

# 创建必要目录
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# 日志文件
LOG_FILE="$LOG_DIR/ssl-monitor.log"
REPORT_FILE="$REPORT_DIR/ssl-status-$(date +%Y%m%d-%H%M%S).json"

# 域名和证书路径配置
DOMAINS=(
    "0379.email"
    "api.0379.email"
    "admin.0379.email"
    "mail.0379.email"
    "wiki.0379.email"
)

CERT_PATHS=(
    "/Users/yanyu/www/ssl-certs/live/0379.email/fullchain.pem"
    "/Users/yanyu/www/ssl-certs/live/api.0379.email/fullchain.pem"
    "/Users/yanyu/www/ssl-certs/live/admin.0379.email/fullchain.pem"
    "/Users/yanyu/www/ssl-certs/live/mail.0379.email/fullchain.pem"
    "/Users/yanyu/www/ssl-certs/live/wiki.0379.email/fullchain.pem"
)

# 告警阈值（天）
WARNING_DAYS=30
CRITICAL_DAYS=7

# 颜色输出
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# 检查单个证书
check_certificate() {
    local domain="$1"
    local cert_path="$2"

    if [[ ! -f "$cert_path" ]]; then
        echo "$domain:ERROR - 证书文件不存在: $cert_path"
        return 1
    fi

    local expiry_date
    expiry_date=$(openssl x509 -in "$cert_path" -noout -enddate 2>/dev/null | cut -d= -f2)

    if [[ -z "$expiry_date" ]]; then
        echo "$domain:ERROR - 无法读取证书信息"
        return 1
    fi

    # macOS日期转换
    local expiry_timestamp
    expiry_timestamp=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    local current_timestamp
    current_timestamp=$(date +%s)
    local days_left
    days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))

    local status="OK"
    if [[ $days_left -lt $CRITICAL_DAYS ]]; then
        status="CRITICAL"
    elif [[ $days_left -lt $WARNING_DAYS ]]; then
        status="WARNING"
    fi

    echo "$domain:$status:$days_left:${expiry_date// /_SPAC_}:${cert_path}"
}

# 生成JSON报告
generate_report() {
    local results=("$@")
    local overall_status="ok"
    local certificates_json="["

    for i in "${!results[@]}"; do
        local result="${results[$i]}"
        IFS=':' read -r domain status days_left expiry_date cert_path <<< "$result"

        if [[ $i -gt 0 ]]; then
            certificates_json+=","
        fi

        # 处理ERROR状态
        if [[ "$status" == "ERROR" ]]; then
            certificates_json+="{\"domain\":\"$domain\",\"status\":\"error\",\"days_left\":null,\"expiry_date\":null,\"cert_path\":\"$cert_path\"}"
            if [[ "$overall_status" != "critical" ]]; then
                overall_status="error"
            fi
        else
            local expiry_date_fixed="${expiry_date//_SPAC_/ }"
            certificates_json+="{\"domain\":\"$domain\",\"status\":\"$(echo "$status" | tr '[:upper:]' '[:lower:]')\",\"days_left\":$days_left,\"expiry_date\":\"$expiry_date_fixed\",\"cert_path\":\"$cert_path\"}"

            if [[ "$status" == "CRITICAL" ]]; then
                overall_status="critical"
            elif [[ "$status" == "WARNING" && "$overall_status" != "critical" ]]; then
                overall_status="warning"
            fi
        fi
    done

    certificates_json+="]"

    local report_content
    report_content=$(cat << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall_status": "$overall_status",
    "total_domains": ${#DOMAINS[@]},
    "certificates": $certificates_json,
    "summary": {
        "warning_threshold": $WARNING_DAYS,
        "critical_threshold": $CRITICAL_DAYS
    }
}
EOF
)

    echo "$report_content" > "$REPORT_FILE"
    ln -sf "$(basename "$REPORT_FILE")" "$REPORT_DIR/ssl-status-latest.json"

    echo "$overall_status"
}

# 主函数
main() {
    log "INFO" "开始SSL证书监控检查"
    log "INFO" "监控域名数量: ${#DOMAINS[@]}"

    local results=()

    # 检查所有证书
    for i in "${!DOMAINS[@]}"; do
        local domain="${DOMAINS[$i]}"
        local cert_path="${CERT_PATHS[$i]}"
        local result
        result=$(check_certificate "$domain" "$cert_path")
        results+=("$result")

        log "INFO" "检查结果: $result"
    done

    # 生成报告
    local overall_status
    overall_status=$(generate_report "${results[@]}")

    log "INFO" "监控报告已生成: $REPORT_FILE"
    log "INFO" "整体状态: $overall_status"

    # 输出结果摘要
    echo -e "\n${BLUE}=== SSL证书监控结果摘要 ===${NC}"
    echo -e "检查时间: $(date "+%Y-%m-%d %H:%M:%S")"
    echo -e "监控域名数: ${#DOMAINS[@]}"
    echo -e "整体状态: $overall_status"

    for result in "${results[@]}"; do
        IFS=':' read -r domain status days_left expiry_date cert_path <<< "$result"
        expiry_date_display="${expiry_date//_SPAC_/ }"

        case "$status" in
            "OK")
                echo -e "  ${GREEN}✅ $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "WARNING")
                echo -e "  ${YELLOW}⚠️  $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "CRITICAL")
                echo -e "  ${RED}🚨 $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "ERROR")
                echo -e "  ${RED}❌ $domain${NC} - 证书错误"
                ;;
        esac
    done

    echo -e "\n📊 详细报告: $REPORT_FILE"
    echo -e "📝 日志文件: $LOG_FILE"

    # 返回退出码
    case "$overall_status" in
        "critical") exit 2 ;;
        "warning") exit 1 ;;
        *) exit 0 ;;
    esac
}

# 帮助信息
show_help() {
    cat << EOF
SSL证书监控脚本 - 简化版

用法:
    $0 [选项]

选项:
    -h, --help          显示帮助信息
    -d, --domains       列出监控域名

示例:
    $0                  # 执行监控检查
    $0 -d               # 列出监控域名

EOF
}

# 参数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--domains)
            echo "监控域名列表:"
            for domain in "${DOMAINS[@]}"; do
                echo "  - $domain"
            done
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main