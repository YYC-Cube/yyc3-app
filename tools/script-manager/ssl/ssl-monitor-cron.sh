#!/bin/bash

# =============================================================================
# SSL证书监控 - Cron任务包装脚本
# 用于定时执行SSL证书监控检查
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/ssl-monitor-simple.sh"
LOG_FILE="$PROJECT_ROOT/logs/ssl/cron-execution.log"

# 执行监控检查
{
    echo "=========================================="
    echo "SSL证书监控检查 - $(date "+%Y-%m-%d %H:%M:%S")"
    echo "=========================================="

    "$MONITOR_SCRIPT"

    exit_code=$?
    echo ""
    echo "退出码: $exit_code"

    if [[ $exit_code -eq 0 ]]; then
        echo "状态: 所有证书正常"
    elif [[ $exit_code -eq 1 ]]; then
        echo "状态: 有证书即将过期"
    elif [[ $exit_code -eq 2 ]]; then
        echo "状态: 有证书紧急过期或错误"
    fi

    echo ""
} >> "$LOG_FILE" 2>&1

# 如果有紧急情况，发送邮件通知（如果配置了邮件服务）
if [[ $? -eq 2 ]] && command -v mail >/dev/null 2>&1; then
    echo "SSL证书紧急告警！请立即检查证书状态。" | mail -s "SSL证书紧急告警 - $(date '+%Y-%m-%d')" admin@0379.email
fi