#!/bin/bash

# =============================================================================
# 设置SSL证书监控定时任务
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_SCRIPT="$SCRIPT_DIR/ssl-monitor-cron.sh"

echo "设置SSL证书监控定时任务..."

# 检查脚本是否存在
if [[ ! -f "$CRON_SCRIPT" ]]; then
    echo "错误: 监控脚本不存在 $CRON_SCRIPT"
    exit 1
fi

# 创建cron任务
# 每天上午9点执行检查
(crontab -l 2>/dev/null; echo "# SSL证书监控 - 每天9点检查") | crontab -
(crontab -l 2>/dev/null; echo "0 9 * * * $CRON_SCRIPT") | crontab -

echo "✅ SSL证书监控定时任务已设置"
echo "📅 执行时间: 每天 09:00"
echo "📜 查看定时任务: crontab -l"
echo ""
echo "如需修改执行时间，请使用 crontab -e 编辑"
echo "常用时间设置:"
echo "  每小时检查: 0 * * * * $CRON_SCRIPT"
echo "  每天9点检查: 0 9 * * * $CRON_SCRIPT"
echo "  每周一9点检查: 0 9 * * 1 $CRON_SCRIPT"
echo "  每月1号9点检查: 0 9 1 * * $CRON_SCRIPT"