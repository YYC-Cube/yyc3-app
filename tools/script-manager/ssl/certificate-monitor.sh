#!/bin/bash

# =============================================================================
# 0379.email SSL证书监控脚本
# 监控所有域名的SSL证书状态，生成报告和告警
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
LOG_FILE="$LOG_DIR/certificate-monitor.log"
REPORT_FILE="$REPORT_DIR/ssl-status-$(date +%Y%m%d-%H%M%S).json"
HTML_REPORT="$REPORT_DIR/ssl-dashboard.html"

# 域名配置
DOMAINS=(
    "0379.email"
    "api.0379.email"
    "admin.0379.email"
    "mail.0379.email"
    "wiki.0379.email"
)

# 证书路径配置
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
NC='\033[0m' # No Color

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# 检查单个域名证书状态
check_domain_certificate() {
    local domain="$1"
    local cert_path="$2"

    log "INFO" "检查域名: $domain"

    if [[ ! -f "$cert_path" ]]; then
        log "ERROR" "证书文件不存在: $cert_path"
        echo '{"domain":"'"$domain"'","status":"error","message":"证书文件不存在","days_left":null,"expiry_date":null}'
        return 1
    fi

    # 获取证书过期时间
    local expiry_date
    expiry_date=$(openssl x509 -in "$cert_path" -noout -enddate 2>/dev/null | cut -d= -f2)

    if [[ -z "$expiry_date" ]]; then
        log "ERROR" "无法读取证书过期时间: $cert_path"
        echo '{"domain":"'"$domain"'","status":"error","message":"无法读取证书信息","days_left":null,"expiry_date":null}'
        return 1
    fi

    # 转换日期格式 - 处理macOS和Linux不同的date命令
    local expiry_timestamp
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        expiry_timestamp=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    else
        # Linux
        expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null)
    fi

    if [[ -z "$expiry_timestamp" ]]; then
        log "ERROR" "日期格式转换失败: $expiry_date"
        echo '{"domain":"'"$domain"'","status":"error","message":"日期格式转换失败","days_left":null,"expiry_date":"'"$expiry_date"'"}'
        return 1
    fi

    local current_timestamp
    current_timestamp=$(date +%s)
    local days_left
    days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))

    # 确定状态
    local status="ok"
    local level="INFO"

    if [[ $days_left -lt $CRITICAL_DAYS ]]; then
        status="critical"
        level="CRITICAL"
        log "CRITICAL" "$domain 证书将在 $days_left 天后过期！"
    elif [[ $days_left -lt $WARNING_DAYS ]]; then
        status="warning"
        level="WARNING"
        log "WARNING" "$domain 证书将在 $days_left 天后过期"
    else
        log "INFO" "$domain 证书正常，还有 $days_left 天过期"
    fi

    # 返回JSON格式结果
    echo "{\"domain\":\"$domain\",\"status\":\"$status\",\"days_left\":$days_left,\"expiry_date\":\"$expiry_date\",\"cert_path\":\"$cert_path\"}"
}

# 生成简单的HTML报告
generate_html_report() {
    local json_file="$1"
    local html_file="$2"

    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>0379.email SSL证书监控报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fa;
            color: #2c3e50;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .certificates-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        th {
            background-color: #34495e;
            color: white;
            font-weight: 600;
        }
        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-ok {
            background-color: #d4edda;
            color: #155724;
        }
        .badge-warning {
            background-color: #fff3cd;
            color: #856404;
        }
        .badge-critical {
            background-color: #f8d7da;
            color: #721c24;
        }
        .badge-error {
            background-color: #e2e3e5;
            color: #383d41;
        }
        .refresh-info {
            text-align: center;
            color: #7f8c8d;
            margin-top: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 0379.email SSL证书监控报告</h1>
            <p>实时监控所有域名的SSL证书状态</p>
        </div>

        <div class="certificates-table">
            <table>
                <thead>
                    <tr>
                        <th>域名</th>
                        <th>状态</th>
                        <th>剩余天数</th>
                        <th>过期时间</th>
                        <th>证书路径</th>
                    </tr>
                </thead>
                <tbody id="certificates-tbody">
                </tbody>
            </table>
        </div>

        <div class="refresh-info">
            <p>最后更新时间: <span id="last-update">-</span></p>
        </div>
    </div>

    <script>
        // 从JSON文件加载数据
        fetch('ssl-status-latest.json')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('certificates-tbody');
                tbody.innerHTML = '';

                data.certificates.forEach(cert => {
                    const row = tbody.insertRow();
                    row.insertCell(0).textContent = cert.domain;

                    const statusCell = row.insertCell(1);
                    const badge = document.createElement('span');
                    badge.className = 'status-badge badge-' + cert.status;
                    badge.textContent = cert.status === 'ok' ? '正常' :
                                       cert.status === 'warning' ? '警告' :
                                       cert.status === 'critical' ? '紧急' : '错误';
                    statusCell.appendChild(badge);

                    row.insertCell(2).textContent = cert.days_left !== null ? cert.days_left + ' 天' : '-';
                    row.insertCell(3).textContent = cert.expiry_date || '-';
                    row.insertCell(4).textContent = cert.cert_path || '-';
                });

                document.getElementById('last-update').textContent = new Date().toLocaleString('zh-CN');
            })
            .catch(error => console.error('加载数据失败:', error));
    </script>
</body>
</html>
EOF

    log "INFO" "HTML报告已生成: $html_file"
}

# 主监控函数
main() {
    log "INFO" "开始SSL证书监控检查"
    log "INFO" "监控域名数量: ${#DOMAINS[@]}"

    local temp_results="/tmp/ssl-cert-results-$$"
    local overall_status="ok"

    # 检查所有域名并收集结果
    for i in "${!DOMAINS[@]}"; do
        local domain="${DOMAINS[$i]}"
        local cert_path="${CERT_PATHS[$i]}"

        local cert_result
        cert_result=$(check_domain_certificate "$domain" "$cert_path")

        # 保存到临时文件
        echo "$cert_result" >> "$temp_results"

        # 解析状态确定整体状态
        local status
        status=$(echo "$cert_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")

        if [[ "$status" == "critical" ]]; then
            overall_status="critical"
        elif [[ "$status" == "error" || "$status" == "warning" ]]; then
            if [[ "$overall_status" != "critical" ]]; then
                overall_status="$status"
            fi
        fi
    done

    # 构建JSON数组
    local certificates_json="["
    local first=true
    while IFS= read -r line; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            certificates_json+=","
        fi
        certificates_json+="$line"
    done < "$temp_results"
    certificates_json+="]"

    # 清理临时文件
    rm -f "$temp_results"

    # 生成JSON报告
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

    # 保存报告
    echo "$report_content" > "$REPORT_FILE"

    # 创建最新报告链接
    ln -sf "$(basename "$REPORT_FILE")" "$REPORT_DIR/ssl-status-latest.json"

    log "INFO" "监控报告已生成: $REPORT_FILE"
    log "INFO" "整体状态: $overall_status"

    # 生成HTML报告
    generate_html_report "$REPORT_FILE" "$HTML_REPORT"

    # 输出结果摘要
    echo -e "\n${BLUE}=== SSL证书监控结果摘要 ===${NC}"
    echo -e "检查时间: $(date "+%Y-%m-%d %H:%M:%S")"
    echo -e "监控域名数: ${#DOMAINS[@]}"
    echo -e "整体状态: $overall_status"

    # 读取并解析证书结果
    for i in "${!DOMAINS[@]}"; do
        local domain="${DOMAINS[$i]}"
        local cert_path="${CERT_PATHS[$i]}"
        local cert_result
        cert_result=$(check_domain_certificate "$domain" "$cert_path")

        local status
        status=$(echo "$cert_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
        local days_left
        days_left=$(echo "$cert_result" | python3 -c "import sys, json; d=json.load(sys.stdin)['days_left']; print(d if d is not None else 'null')")

        case "$status" in
            "ok")
                echo -e "  ${GREEN}✅ $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "warning")
                echo -e "  ${YELLOW}⚠️  $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "critical")
                echo -e "  ${RED}🚨 $domain${NC} - 剩余 ${days_left} 天"
                ;;
            "error")
                echo -e "  ${RED}❌ $domain${NC} - 证书错误"
                ;;
        esac
    done

    echo -e "\n📊 详细报告: $REPORT_FILE"
    echo -e "🌐 HTML报告: $HTML_REPORT"
    echo -e "📝 日志文件: $LOG_FILE"

    # 根据状态返回退出码
    case "$overall_status" in
        "critical") exit 2 ;;
        "warning") exit 1 ;;
        *) exit 0 ;;
    esac
}

# 检查依赖
check_dependencies() {
    local missing_deps=()

    command -v openssl >/dev/null 2>&1 || missing_deps+=("openssl")
    command -v python3 >/dev/null 2>&1 || missing_deps+=("python3")

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "缺少依赖工具: ${missing_deps[*]}"
        echo -e "${RED}错误: 缺少必要的依赖工具${NC}"
        echo "请安装缺少的工具:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# 帮助信息
show_help() {
    cat << EOF
SSL证书监控脚本

用法:
    $0 [选项]

选项:
    -h, --help          显示此帮助信息
    -q, --quiet         静默模式，只输出错误信息
    -d, --domains       列出所有监控的域名
    --warning DAYS      设置警告阈值天数 (默认: $WARNING_DAYS)
    --critical DAYS     设置紧急阈值天数 (默认: $CRITICAL_DAYS)

示例:
    $0                  # 执行完整监控检查
    $0 --warning 60     # 设置60天警告阈值
    $0 --quiet          # 静默模式
    $0 -d               # 列出监控域名

EOF
}

# 参数解析
quiet_mode=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quiet)
            quiet_mode=true
            shift
            ;;
        -d|--domains)
            echo "监控域名列表:"
            for domain in "${DOMAINS[@]}"; do
                echo "  - $domain"
            done
            exit 0
            ;;
        --warning)
            WARNING_DAYS="$2"
            shift 2
            ;;
        --critical)
            CRITICAL_DAYS="$2"
            shift 2
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 静默模式设置
if [[ "$quiet_mode" == "true" ]]; then
    exec 1>"$LOG_DIR/certificate-monitor-silent.log"
fi

# 执行主函数
check_dependencies
main