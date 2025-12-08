#!/bin/bash
# =============================================================================
# 0379.email 项目 - 综合安全监控脚本
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

log_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs/security"
MONITOR_LOG="$LOG_DIR/monitor.log"
ALERT_LOG="$LOG_DIR/alerts.log"
REPORT_DIR="$PROJECT_DIR/reports/security"

# 创建必要的目录
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# 服务器配置
declare -A SERVERS=(
    ["production"]="yyc3-121:8.130.127.121:22:yanyu"
    ["nas"]="yyc3-45:192.168.3.45:57:YYC"
    ["development"]="yyc3-22:192.168.3.22:22:yyc3-22"
)

# 安全级别阈值
declare -A THRESHOLDS=(
    ["failed_logins"]=10
    ["cpu_usage"]=80
    ["memory_usage"]=85
    ["disk_usage"]=90
    ["network_connections"]=1000
    ["suspicious_processes"]=5
)

# 日志函数
write_log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" >> "$MONITOR_LOG"
}

write_alert() {
    local severity="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$severity] $message" >> "$ALERT_LOG"

    # 根据严重程度输出
    case $severity in
        "CRITICAL")
            log_critical "$message"
            ;;
        "WARNING")
            log_warning "$message"
            ;;
        "INFO")
            log_info "$message"
            ;;
    esac
}

# 检查本地文件安全
check_local_file_security() {
    log_info "检查本地文件安全..."

    local issues=0

    # 检查敏感文件权限
    local sensitive_files=(
        "$PROJECT_DIR/keys/production-secrets.env"
        "$HOME/.ssh/id_rsa_0379_prod"
        "$HOME/.ssh/id_rsa_0379_nas"
        "$HOME/.ssh/id_rsa_0379_dev"
    )

    for file in "${sensitive_files[@]}"; do
        if [[ -f "$file" ]]; then
            local perm=$(stat -f "%Mp%Lp" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
            if [[ "$perm" != "600" ]]; then
                write_alert "WARNING" "敏感文件权限不安全: $file (当前: $perm, 应该: 600)"
                ((issues++))
            fi
        fi
    done

    # 检查硬编码密码
    local config_files=(
        "$PROJECT_DIR/app/.env.example"
        "$PROJECT_DIR/redis-config/.env.example"
        "$PROJECT_DIR/docker-compose.yml"
    )

    local insecure_patterns=(
        "redis_yyc3"
        "your-jwt-secret-change-in-production"
        "change-this-password"
        "password123"
        "admin123"
    )

    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            for pattern in "${insecure_patterns[@]}"; do
                if grep -q "$pattern" "$file" 2>/dev/null; then
                    write_alert "CRITICAL" "发现不安全配置模式: $pattern 在 $file"
                    ((issues++))
                fi
            done
        fi
    done

    if [[ $issues -eq 0 ]]; then
        write_log "INFO" "本地文件安全检查通过"
        log_success "本地文件安全检查通过"
    else
        write_log "WARNING" "发现 $issues 个文件安全问题"
        log_warning "发现 $issues 个文件安全问题"
    fi
}

# 检查服务器安全状态
check_server_security() {
    log_info "检查服务器安全状态..."

    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user <<< "$config"

        log_info "检查服务器: $hostname ($ip:$port)"

        # 检查 SSH 连接
        if ssh -o ConnectTimeout=10 -o BatchMode=yes "$hostname" "echo 'SSH连接正常'" 2>/dev/null; then
            write_log "INFO" "SSH连接正常: $hostname"

            # 执行远程安全检查
            check_remote_security "$hostname" "$ip" "$user"
        else
            write_alert "CRITICAL" "SSH连接失败: $hostname ($ip:$port)"
        fi
    done
}

# 远程安全检查
check_remote_security() {
    local hostname="$1"
    local ip="$2"
    local user="$3"

    # 创建远程检查脚本
    local remote_script='
set -euo pipefail

# 系统信息检查
os_info=$(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')
uptime_info=$(uptime -p 2>/dev/null || uptime)

# 登录失败检查
failed_logins=0
if command -v journalctl >/dev/null 2>&1; then
    failed_logins=$(journalctl -u sshd --since "1 hour ago" | grep "Failed password" | wc -l)
elif [[ -f /var/log/auth.log ]]; then
    failed_logins=$(grep "$(date '+%b %d')" /var/log/auth.log | grep "Failed password" | wc -l)
fi

# 系统资源使用
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk "{print \$2}" | cut -d% -f1)
memory_usage=$(free | grep Mem | awk "{printf \"%.0f\", (\$3/\$2) * 100.0}")
disk_usage=$(df / | tail -1 | awk "{print \$5}" | cut -d% -f1)

# 网络连接
network_connections=$(netstat -tuln 2>/dev/null | grep LISTEN | wc -l || ss -tuln | grep LISTEN | wc -l)

# 可疑进程
suspicious_procs=$(ps aux | grep -E "(nc|netcat|nmap|wireshark|tcpdump)" | grep -v grep | wc -l)

# 开放端口
open_ports=$(netstat -tuln 2>/dev/null | grep LISTEN | awk "{print \$4}" | cut -d: -f2 | sort -n | tr "\n" " " || ss -tuln | grep LISTEN | awk "{print \$4}" | cut -d: -f2 | sort -n | tr "\n" " ")

# 检查 SSH 配置
ssh_root_login=$(grep -c "^PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null || echo "0")
ssh_password_auth=$(grep -c "^PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null || echo "0")

# 检查防火墙状态
firewall_status="unknown"
if command -v ufw >/dev/null 2>&1; then
    firewall_status=$(ufw status | head -1)
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall_status="firewalld $(systemctl is-active firewalld)"
fi

# 检查正在运行的服务
running_services=$(systemctl list-units --type=service --state=running | wc -l)

# 输出 JSON 格式结果
cat << JSON_RESULT
{
    "os_info": "$os_info",
    "uptime": "$uptime_info",
    "failed_logins": $failed_logins,
    "cpu_usage": $cpu_usage,
    "memory_usage": $memory_usage,
    "disk_usage": $disk_usage,
    "network_connections": $network_connections,
    "suspicious_processes": $suspicious_procs,
    "open_ports": "$open_ports",
    "ssh_root_login_disabled": $ssh_root_login,
    "ssh_password_auth_disabled": $ssh_password_auth,
    "firewall_status": "$firewall_status",
    "running_services": $running_services
}
JSON_RESULT
'

    # 执行远程检查并解析结果
    local result=$(ssh "$hostname" "$remote_script" 2>/dev/null || echo '{}')

    if [[ -n "$result" ]]; then
        analyze_remote_security "$hostname" "$result"
    else
        write_alert "WARNING" "无法获取服务器安全信息: $hostname"
    fi
}

# 分析远程安全结果
analyze_remote_security() {
    local hostname="$1"
    local result="$2"

    # 解析 JSON (简化版本，实际应使用 jq)
    local failed_logins=$(echo "$result" | grep -o '"failed_logins": [0-9]*' | cut -d: -f2 | tr -d ' ')
    local cpu_usage=$(echo "$result" | grep -o '"cpu_usage": [0-9.]*' | cut -d: -f2 | tr -d ' ')
    local memory_usage=$(echo "$result" | grep -o '"memory_usage": [0-9]*' | cut -d: -f2 | tr -d ' ')
    local disk_usage=$(echo "$result" | grep -o '"disk_usage": [0-9]*' | cut -d: -f2 | tr -d ' ')
    local suspicious_procs=$(echo "$result" | grep -o '"suspicious_processes": [0-9]*' | cut -d: -f2 | tr -d ' ')
    local network_connections=$(echo "$result" | grep -o '"network_connections": [0-9]*' | cut -d: -f2 | tr -d ' ')

    # 检查阈值并生成告警
    local alerts=0

    if [[ $failed_logins -gt ${THRESHOLDS[failed_logins]} ]]; then
        write_alert "WARNING" "服务器 $hostname 登录失败次数过高: $failed_logins"
        ((alerts++))
    fi

    if [[ ${cpu_usage%.*} -gt ${THRESHOLDS[cpu_usage]} ]]; then
        write_alert "WARNING" "服务器 $hostname CPU 使用率过高: ${cpu_usage}%"
        ((alerts++))
    fi

    if [[ $memory_usage -gt ${THRESHOLDS[memory_usage]} ]]; then
        write_alert "WARNING" "服务器 $hostname 内存使用率过高: ${memory_usage}%"
        ((alerts++))
    fi

    if [[ $disk_usage -gt ${THRESHOLDS[disk_usage]} ]]; then
        write_alert "WARNING" "服务器 $hostname 磁盘使用率过高: ${disk_usage}%"
        ((alerts++))
    fi

    if [[ $suspicious_procs -gt ${THRESHOLDS[suspicious_processes]} ]]; then
        write_alert "CRITICAL" "服务器 $hostname 发现可疑进程: $suspicious_procs"
        ((alerts++))
    fi

    if [[ $network_connections -gt ${THRESHOLDS[network_connections]} ]]; then
        write_alert "WARNING" "服务器 $hostname 网络连接数过高: $network_connections"
        ((alerts++))
    fi

    if [[ $alerts -eq 0 ]]; then
        write_log "INFO" "服务器 $hostname 安全检查正常"
        log_success "服务器 $hostname 安全检查正常"
    fi
}

# 检查应用服务状态
check_application_security() {
    log_info "检查应用服务安全状态..."

    local services=(
        "0379.email:443"
        "api.0379.email:443"
        "admin.0379.email:443"
    )

    for service in "${services[@]}"; do
        local domain="${service%:*}"
        local port="${service#*:}"

        # SSL 证书检查
        if check_ssl_certificate "$domain" "$port"; then
            write_log "INFO" "SSL 证书正常: $domain:$port"
        else
            write_alert "WARNING" "SSL 证书异常: $domain:$port"
        fi

        # HTTPS 安全头检查
        check_security_headers "$domain" "$port"

        # 服务可用性检查
        check_service_availability "$domain" "$port"
    done
}

# 检查 SSL 证书
check_ssl_certificate() {
    local domain="$1"
    local port="$2"

    if command -v openssl >/dev/null 2>&1; then
        local cert_info=$(echo | openssl s_client -connect "$domain:$port" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

        if [[ -n "$cert_info" ]]; then
            local end_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_epoch=$(date -d "$end_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$end_date" +%s)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

            if [[ $days_until_expiry -lt 30 ]]; then
                write_alert "WARNING" "SSL 证书即将过期: $domain ($days_until_expiry 天)"
                return 1
            elif [[ $days_until_expiry -lt 0 ]]; then
                write_alert "CRITICAL" "SSL 证书已过期: $domain"
                return 1
            else
                return 0
            fi
        fi
    fi

    return 1
}

# 检查安全头
check_security_headers() {
    local domain="$1"
    local port="$2"

    if command -v curl >/dev/null 2>&1; then
        local headers=$(curl -s -I "https://$domain:$port" 2>/dev/null)

        local required_headers=(
            "strict-transport-security"
            "x-frame-options"
            "x-content-type-options"
            "x-xss-protection"
        )

        for header in "${required_headers[@]}"; do
            if ! echo "$headers" | grep -qi "$header"; then
                write_alert "WARNING" "缺少安全头 $header: $domain:$port"
            fi
        done
    fi
}

# 检查服务可用性
check_service_availability() {
    local domain="$1"
    local port="$2"

    if command -v curl >/dev/null 2>&1; then
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain:$port" 2>/dev/null)

        case $http_code in
            200)
                write_log "INFO" "服务正常: $domain:$port ($http_code)"
                ;;
            403|401)
                write_alert "WARNING" "服务访问受限: $domain:$port ($http_code)"
                ;;
            404)
                write_alert "WARNING" "服务未找到: $domain:$port ($http_code)"
                ;;
            000)
                write_alert "CRITICAL" "服务不可达: $domain:$port"
                ;;
            *)
                write_alert "WARNING" "服务异常: $domain:$port ($http_code)"
                ;;
        esac
    fi
}

# 生成安全报告
generate_security_report() {
    log_info "生成安全报告..."

    local report_file="$REPORT_DIR/security-report-$(date +%Y%m%d_%H%M%S).html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>0379.email 安全监控报告</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        .critical { background: #f8d7da; border-color: #f5c6cb; }
        .log { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e9ecef; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>0379.email 项目安全监控报告</h1>
        <p>生成时间: $(date)</p>
    </div>

    <div class="section">
        <h2>系统概览</h2>
        <div class="metric">监控服务器: ${#SERVERS[@]}</div>
        <div class="metric">检查项目: 10+</div>
        <div class="metric">报告周期: 实时</div>
    </div>

    <div class="section">
        <h2>最近告警</h2>
        <div class="log">
EOF

    # 添加最近告警
    if [[ -f "$ALERT_LOG" ]]; then
        tail -20 "$ALERT_LOG" >> "$report_file"
    else
        echo "暂无告警记录" >> "$report_file"
    fi

    cat >> "$report_file" << EOF
        </div>
    </div>

    <div class="section">
        <h2>服务器状态</h2>
        <table>
            <tr><th>服务器</th><th>地址</th><th>状态</th><th>最后检查</th></tr>
EOF

    # 添加服务器状态
    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user <<< "$config"

        local status="正常"
        local color="success"

        # 简单的状态检查
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$hostname" "echo 'ok'" 2>/dev/null; then
            status="离线"
            color="critical"
        fi

        echo "<tr><td>$hostname</td><td>$ip:$port</td><td class=\"$color\">$status</td><td>$(date)</td></tr>" >> "$report_file"
    done

    cat >> "$report_file" << EOF
        </table>
    </div>

    <div class="section">
        <h2>建议和后续步骤</h2>
        <ul>
            <li>定期检查和更新密钥</li>
            <li>监控系统资源使用情况</li>
            <li>保持系统和软件更新</li>
            <li>定期备份重要数据</li>
            <li>实施访问控制和审计</li>
        </ul>
    </div>
</body>
</html>
EOF

    write_log "INFO" "安全报告已生成: $report_file"
    log_success "安全报告已生成: $report_file"
}

# 发送告警通知
send_alert_notifications() {
    if [[ -f "$ALERT_LOG" ]]; then
        local critical_alerts=$(grep "CRITICAL" "$ALERT_LOG" | tail -5)
        local warning_alerts=$(grep "WARNING" "$ALERT_LOG" | tail -10)

        if [[ -n "$critical_alerts" ]]; then
            log_warning "发现严重告警，需要立即处理:"
            echo "$critical_alerts"
        fi

        if [[ -n "$warning_alerts" ]]; then
            log_info "发现警告告警:"
            echo "$warning_alerts"
        fi
    fi
}

# 清理旧日志
cleanup_old_logs() {
    log_info "清理旧日志..."

    # 保留最近30天的日志
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

    # 保留最近7天的报告
    find "$REPORT_DIR" -name "*.html" -mtime +7 -delete 2>/dev/null || true

    write_log "INFO" "旧日志清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 项目综合安全监控脚本

用法: $0 [选项]

选项:
    -h, --help          显示此帮助信息
    -l, --local         仅检查本地文件安全
    -s, --servers       仅检查服务器安全
    -a, --applications  仅检查应用服务
    -r, --report        仅生成报告
    -c, --continuous    连续监控模式
    -i, --interval      设置监控间隔 (秒，默认300)

示例:
    $0                  # 执行完整安全检查
    $0 -l               # 仅检查本地安全
    $0 -s               # 仅检查服务器
    $0 -c -i 60         # 连续监控，间隔60秒

EOF
}

# 主监控函数
main_monitor() {
    write_log "INFO" "开始安全监控检查..."

    check_local_file_security
    check_server_security
    check_application_security
    generate_security_report
    send_alert_notifications
    cleanup_old_logs

    write_log "INFO" "安全监控检查完成"
    log_success "安全监控检查完成"
}

# 连续监控模式
continuous_monitor() {
    local interval=${1:-300}

    log_info "启动连续监控模式，间隔: ${interval}秒"

    while true; do
        main_monitor
        log_info "下次检查时间: $(date -d "+$interval seconds" '+%Y-%m-%d %H:%M:%S')"
        sleep "$interval"
    done
}

# 解析命令行参数
mode="full"
interval=300

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -l|--local)
            mode="local"
            shift
            ;;
        -s|--servers)
            mode="servers"
            shift
            ;;
        -a|--applications)
            mode="applications"
            shift
            ;;
        -r|--report)
            mode="report"
            shift
            ;;
        -c|--continuous)
            mode="continuous"
            shift
            ;;
        -i|--interval)
            interval="$2"
            shift 2
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行对应模式
case $mode in
    "full")
        main_monitor
        ;;
    "local")
        check_local_file_security
        ;;
    "servers")
        check_server_security
        ;;
    "applications")
        check_application_security
        ;;
    "report")
        generate_security_report
        ;;
    "continuous")
        continuous_monitor "$interval"
        ;;
esac