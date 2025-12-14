/**
 * @file NAS备份脚本
 * @description 将本地项目数据备份到NAS存储设备
 * @module scripts/backup-to-nas
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# 设置项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 配置参数
APP_DIR="${PROJECT_ROOT}"
BACKUP_NAME="email-backup-$(date +%Y%m%d)"
BACKUP_FILE="$BACKUP_NAME.tar.gz"
TEMP_DIR="/tmp"
NAS_USER="YYC"
NAS_HOST="yyc3-45"
NAS_PORT="57"
NAS_BACKUP_DIR="/volume2/email-backup"
LOG_FILE="${PROJECT_ROOT}/logs/backup-nas.log"
SSH_KEY="~/.ssh/id_rsa_local"
RETENTION_DAYS=30

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 系统健康检查
check_system_health() {
    echo -e "${BLUE}🔍 正在检查系统健康状态...${NC}"
    
    # 检查磁盘空间
    local disk_usage=$(df -h $TEMP_DIR | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        echo -e "${RED}❌ 临时目录磁盘空间不足，使用率: ${disk_usage}%${NC}"
        exit 1
    fi
    
    # 检查可用空间是否足够创建备份
    local app_size=$(du -s "$APP_DIR" | cut -f1)
    local temp_free=$(df -k "$TEMP_DIR" | awk 'NR==2 {print $4}')
    
    # 检查是否有足够空间（需要2倍于应用大小的空间）
    if [ "$temp_free" -lt $((app_size * 2)) ]; then
        echo -e "${RED}❌ 临时目录空间不足，无法创建备份${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 系统健康状态良好${NC}"
}

# 连接检查
check_nas_connection() {
    echo -e "${BLUE}🔌 正在检查 NAS 连接...${NC}"
    if ! ssh -i "$SSH_KEY" -p "$NAS_PORT" -o ConnectTimeout=10 "$NAS_USER@$NAS_HOST" "echo connected" > /dev/null 2>&1; then
        echo -e "${RED}❌ 无法连接到 NAS 服务器: $NAS_USER@$NAS_HOST:$NAS_PORT${NC}"
        exit 1
    fi
    
    # 检查NAS备份目录是否存在
    if ! ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "test -d $NAS_BACKUP_DIR"; then
        echo -e "${BLUE}📁 正在 NAS 上创建备份目录: $NAS_BACKUP_DIR${NC}"
        ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_BACKUP_DIR"
    fi
    
    # 检查NAS存储空间
    local nas_free=$(ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "df -k $NAS_BACKUP_DIR | awk 'NR==2 {print $4}'")
    if [ "$nas_free" -lt $((app_size * 2)) ]; then
        echo -e "${YELLOW}⚠️  NAS 存储空间不足，建议清理旧备份${NC}"
    fi
    
    echo -e "${GREEN}✅ NAS 连接正常${NC}"
}

# 创建备份
create_backup() {
    echo -e "${YELLOW}📦 正在创建备份文件: $BACKUP_FILE${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始创建备份..." >> "$LOG_FILE"
    
    # 计算备份前的文件数
    local pre_backup_count=$(find "$APP_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/logs/*" | wc -l)
    
    # 创建备份文件
    cd "$TEMP_DIR"
    time tar -czf "$BACKUP_FILE" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='*.swp'
    
    # 检查备份文件是否创建成功
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 备份文件创建失败${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件创建失败" >> "$LOG_FILE"
        exit 1
    fi
    
    # 获取备份文件大小
    local backup_size=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ 备份文件创建成功，大小: $backup_size${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件创建完成: $BACKUP_FILE, 大小: $backup_size" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件包含文件数: $pre_backup_count" >> "$LOG_FILE"
}

# 上传备份到NAS
upload_backup() {
    echo -e "${BLUE}📤 正在上传备份到 NAS...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始上传到 NAS..." >> "$LOG_FILE"
    
    # 上传备份文件，显示进度
    scp -i "$SSH_KEY" -P "$NAS_PORT" -v "$BACKUP_FILE" "$NAS_USER@$NAS_HOST:$NAS_BACKUP_DIR/" 2>&1 | \
    grep -E 'Bytes|bytes' | \
    awk '{
        if ($1 ~ /Bytes/) {
            total=$1;
        } else if ($1 ~ /bytes/) {
            current=$1;
            percent=current*100/total;
            printf "\r🔄 上传进度: %.2f%%", percent;
        }
    }'
    echo -e "\n${GREEN}✅ 备份上传完成${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份上传完成" >> "$LOG_FILE"
}

# 清理旧备份
cleanup_old_backups() {
    echo -e "${YELLOW}🧹 正在清理 $RETENTION_DAYS 天前的旧备份...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始清理旧备份..." >> "$LOG_FILE"
    
    # 在NAS上删除旧备份
    ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "find $NAS_BACKUP_DIR -name 'email-backup-*.tar.gz' -type f -mtime +$RETENTION_DAYS -delete"
    
    # 检查剩余的备份数量
    local remaining_backups=$(ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "find $NAS_BACKUP_DIR -name 'email-backup-*.tar.gz' -type f | wc -l")
    echo -e "${GREEN}✅ 旧备份清理完成，当前保留 $remaining_backups 个备份${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 旧备份清理完成，剩余备份数: $remaining_backups" >> "$LOG_FILE"
}

# 验证备份完整性
verify_backup() {
    echo -e "${BLUE}🔍 正在验证备份完整性...${NC}"
    
    # 检查备份文件是否可访问
    if ! ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "test -f $NAS_BACKUP_DIR/$BACKUP_FILE"; then
        echo -e "${RED}❌ 备份验证失败：无法找到远程备份文件${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份验证失败：远程文件不存在" >> "$LOG_FILE"
        exit 1
    fi
    
    # 获取远程文件大小并验证
    local local_size=$(du -k "$TEMP_DIR/$BACKUP_FILE" | cut -f1)
    local remote_size=$(ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "du -k $NAS_BACKUP_DIR/$BACKUP_FILE | cut -f1")
    
    if [ "$local_size" -eq "$remote_size" ]; then
        echo -e "${GREEN}✅ 备份验证成功：文件大小匹配${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份验证成功：文件大小匹配" >> "$LOG_FILE"
    else
        echo -e "${RED}❌ 备份验证失败：文件大小不匹配${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份验证失败：文件大小不匹配 (本地: $local_size KB, 远程: $remote_size KB)" >> "$LOG_FILE"
        exit 1
    fi
}

# 清理临时文件
cleanup_temp() {
    echo -e "${BLUE}🧹 正在清理临时文件...${NC}"
    rm -f "$TEMP_DIR/$BACKUP_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 临时文件清理完成" >> "$LOG_FILE"
}

# 信号处理
cleanup_on_exit() {
    cleanup_temp
    echo -e "${BLUE}🔚 备份流程结束${NC}"
}

trap "cleanup_on_exit" EXIT INT TERM

# 主函数
main() {
    echo -e "${BLUE}🚀 开始备份流程...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份流程开始" >> "$LOG_FILE"
    
    # 执行检查
    check_system_health
    check_nas_connection
    
    # 执行备份流程
    create_backup
    upload_backup
    verify_backup
    cleanup_old_backups
    cleanup_temp
    
    echo -e "\n${GREEN}✅ 备份任务完成！${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份任务成功完成" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件: $NAS_BACKUP_DIR/$BACKUP_FILE" >> "$LOG_FILE"
    
    # 显示备份摘要
    echo -e "\n${BLUE}📊 备份摘要:${NC}"
    echo -e "  - 备份名称: $BACKUP_FILE"
    echo -e "  - 备份大小: $(du -sh "$TEMP_DIR/$BACKUP_FILE" 2>/dev/null || echo "N/A")"
    echo -e "  - 备份位置: $NAS_USER@$NAS_HOST:$NAS_BACKUP_DIR"
    echo -e "  - 日志文件: $LOG_FILE"
    echo -e "  - 保留策略: 最近 $RETENTION_DAYS 天"
}

# 执行主函数
main
