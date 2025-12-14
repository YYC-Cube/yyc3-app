#!/bin/bash
/**
 * @file NAS同步脚本
 * @description 将本地数据同步到NAS存储设备
 * @module scripts/sync-to-nas
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

# === 脚本健康检查头 ===
set -euo pipefail

# 设置项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
ENV_FILE="${PROJECT_ROOT}/services/.env.local"

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 读取.env.local文件
if [ -f "$ENV_FILE" ]; then
  # 使用source+进程替换方法读取环境变量
  source <(grep -v '^#' "$ENV_FILE" | sed 's/\r$//' | awk 'BEGIN {FS="="} {print "export \"" $1 "=\"" $2 "\""}')
else
  echo -e "${RED}❌ 未找到.env.local文件，请确保文件存在于$ENV_FILE${NC}"
  exit 1
fi

# 配置参数 - 使用.env.local中的配置
LOCAL_DATA_DIR="${PROJECT_ROOT}/data"
NAS_USER="${NAS_SSH_USER}"
NAS_HOST="${NAS_HOST}"
NAS_PORT="${NAS_SSH_PORT}"
NAS_DIR="${NAS_BASE_PATH}"
LOG_FILE="${PROJECT_ROOT}/logs/sync-nas.log"
SSH_KEY="~/.ssh/id_rsa_local"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 系统健康检查
check_system_health() {
    echo -e "${BLUE}🔍 正在检查系统健康状态...${NC}"
    
    # 检查磁盘空间
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}❌ 磁盘空间不足，使用率: ${disk_usage}%${NC}"
        exit 1
    fi
    
    # 检查内存使用
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 95 ]; then
        echo -e "${RED}❌ 内存使用率过高: ${memory_usage}%${NC}"
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
    echo -e "${GREEN}✅ NAS 连接正常${NC}"
}

# 清理函数
cleanup() {
    # 在这里添加任何需要的清理逻辑
    echo -e "${BLUE}🧹 清理中...${NC}"
}

trap "cleanup" EXIT INT TERM

# 主函数
main() {
    echo -e "${BLUE}🚀 开始数据同步到 NAS...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始同步到 NAS..." >> "$LOG_FILE"
    
    # 执行健康检查
    check_system_health
    check_nas_connection
    
    # 确保本地数据目录存在
    if [ ! -d "$LOCAL_DATA_DIR" ]; then
        echo -e "${YELLOW}⚠️  本地数据目录不存在: $LOCAL_DATA_DIR${NC}"
        echo -e "${BLUE}📁 正在创建本地数据目录...${NC}"
        mkdir -p "$LOCAL_DATA_DIR"
    fi
    
    # 检查远程目录是否存在
    if ! ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "test -d $NAS_DIR"; then
        echo -e "${BLUE}📁 正在 NAS 上创建目标目录: $NAS_DIR${NC}"
        ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_DIR"
    fi
    
    # 使用 rsync 同步数据，添加进度显示
    echo -e "${YELLOW}📤 正在同步数据到 NAS...${NC}"
    rsync -avz --progress -e "ssh -i $SSH_KEY -p $NAS_PORT" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        "$LOCAL_DATA_DIR/" "$NAS_USER@$NAS_HOST:$NAS_DIR/"
    
    # 验证同步结果
    echo -e "${BLUE}✅ 同步完成！${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 同步完成" >> "$LOG_FILE"
    
    # 显示同步统计信息
    local local_count=$(find "$LOCAL_DATA_DIR" -type f | wc -l)
    local remote_count=$(ssh -i "$SSH_KEY" -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" "find $NAS_DIR -type f | wc -l")
    
    echo -e "${GREEN}📊 同步统计:${NC}"
    echo -e "  - 本地文件数: $local_count"
    echo -e "  - 远程文件数: $remote_count"
    
    # 检查是否有差异
    if [ "$local_count" -eq "$remote_count" ]; then
        echo -e "${GREEN}✅ 文件数量匹配${NC}"
    else
        echo -e "${YELLOW}⚠️ 文件数量不匹配，请检查同步结果${NC}"
    fi
    
    echo -e "\n${BLUE}📝 同步日志已保存到: $LOG_FILE${NC}"
}

# 执行主函数
main
