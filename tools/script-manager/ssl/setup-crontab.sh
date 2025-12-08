#!/bin/bash
# =============================================================================
# 0379.email 项目 - 设置 SSL 证书自动续期定时任务
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

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
RENEWAL_SCRIPT="$PROJECT_DIR/scripts/ssl/auto-renew-ssl.sh"

# 设置 Cron 任务
setup_crontab() {
    log_info "设置 SSL 证书自动续期定时任务..."
    
    # 创建临时 crontab 文件
    local temp_crontab
    temp_crontab=$(mktemp)
    
    # 添加现有的 crontab 内容
    if crontab -l 2>/dev/null; then
        crontab -l > "$temp_crontab"
    fi
    
    # 检查是否已经存在 SSL 续期任务
    if grep -q "auto-renew-ssl.sh" "$temp_crontab" 2>/dev/null; then
        log_warning "SSL 续期任务已存在，将更新配置"
        # 移除旧的 SSL 续期任务
        grep -v "auto-renew-ssl.sh" "$temp_crontab" > "${temp_crontab}.new"
        mv "${temp_crontab}.new" "$temp_crontab"
    fi
    
    # 添加 SSL 续期任务
    {
        echo ""
        echo "# =============================================================================
        # 0379.email SSL 证书自动续期"
        # 每天凌晨 2 点检查一次证书"
        echo "0 2 * * * $RENEWAL_SCRIPT >/dev/null 2>&1"
        echo "# 每周一凌晨 3 点强制检查并发送状态报告"
        echo "0 3 * * 1 $RENEWAL_SCRIPT --check-only >/dev/null 2>&1"
        echo "# ============================================================================="
    } >> "$temp_crontab"
    
    # 安装新的 crontab
    crontab "$temp_crontab"
    
    # 清理临时文件
    rm -f "$temp_crontab"
    
    log_success "定时任务设置完成"
}

# 验证 Cron 任务
verify_crontab() {
    log_info "验证定时任务配置..."
    
    if crontab -l | grep -q "auto-renew-ssl.sh"; then
        log_success "SSL 续期定时任务已正确配置"
        
        echo ""
        echo "当前的 SSL 续期定时任务:"
        crontab -l | grep "auto-renew-ssl.sh" | while read -r line; do
            echo "  $line"
        done
        echo ""
        
        # 显示下次执行时间
        echo "下次执行时间:"
        echo "  日常检查: 每天凌晨 2:00"
        echo "  周报检查: 每周一凌晨 3:00"
        
    else
        log_error "定时任务配置失败"
        exit 1
    fi
}

# 设置系统服务（可选）
setup_systemd_service() {
    log_info "创建 Systemd 服务（可选）..."
    
    local service_file="/etc/systemd/system/0379-email-ssl-renewal.service"
    local timer_file="/etc/systemd/system/0379-email-ssl-renewal.timer"
    
    # 创建服务文件
    if [[ $EUID -eq 0 ]]; then
        cat > "$service_file" << EOFSERVICE
[Unit]
Description=0379.email SSL Certificate Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=$RENEWAL_SCRIPT
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOFSERVICE
        
        # 创建定时器文件
        cat > "$timer_file" << EOFTIMER
[Unit]
Description=Run 0379.email SSL certificate renewal daily
Requires=0379-email-ssl-renewal.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
EOFTIMER
        
        # 重新加载 systemd
        systemctl daemon-reload
        
        # 启用并启动定时器
        systemctl enable 0379-email-ssl-renewal.timer
        systemctl start 0379-email-ssl-renewal.timer
        
        log_success "Systemd 服务已创建并启动"
        log_info "使用 'systemctl status 0379-email-ssl-renewal.timer' 查看状态"
    else
        log_warning "需要 root 权限创建 Systemd 服务"
    fi
}

# 显示测试命令
show_test_commands() {
    log_info "测试 SSL 续期配置..."
    echo ""
    echo "测试命令:"
    echo "  # 手动执行续期检查"
    echo "  sudo $RENEWAL_SCRIPT"
    echo ""
    echo "  # 仅检查证书状态"
    echo "  sudo $RENEWAL_SCRIPT --check-only"
    echo ""
    echo "  # 查看 Cron 任务"
    echo "  crontab -l"
    echo ""
    echo "  # 查看续期日志"
    echo "  tail -f $PROJECT_DIR/logs/ssl-renew.log"
    echo ""
}

# 主函数
main() {
    log_info "设置 0379.email SSL 证书自动续期定时任务..."
    echo ""
    
    setup_crontab
    verify_crontab
    setup_systemd_service
    show_test_commands
    
    log_success "🎉 SSL 证书自动续期定时任务设置完成！"
    echo ""
    echo "系统将自动："
    echo "  • 每天凌晨 2:00 检查证书是否需要续期"
    echo "  • 证书到期前 30 天自动执行续期"
    echo "  • 每周一生成状态报告"
    echo "  • 自动备份续期前的证书"
    echo "  • 续期后自动重启相关服务"
}

# 执行主函数
main "$@"
