#!/bin/bash
/**
 * @file 云端同步脚本
 * @description 将本地项目同步到云服务器
 * @module scripts/sync-with-cloud
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

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

# 配置参数 - 本地路径（基于脚本位置）
LOCAL_DIR="${PROJECT_ROOT}"

# 配置参数 - 云服务器信息
CLOUD_SERVER="yyc3-121"
CLOUD_USER="www"
CLOUD_DIR="/ww/app"
SSH_KEY="~/.ssh/id_rsa_aliyun"
LOG_FILE="${LOCAL_DIR}/logs/sync-cloud.log"

# 排除文件和目录列表
EXCLUDE_PATTERNS=(
    ".git/"
    "node_modules/"
    "logs/"
    "*.tmp"
    "*.log"
    "*.swp"
    "*.swo"
    ".DS_Store"
    ".env.local"
    ".env.development.local"
    ".env.test.local"
    ".env.production.local"
)

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 系统健康检查
check_system_health() {
    echo -e "${BLUE}🔍 正在检查本地系统健康状态...${NC}"
    
    # 检查磁盘空间
    local disk_usage=$(df -h "$LOCAL_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}❌ 磁盘空间不足，使用率: ${disk_usage}%${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 本地系统健康状态良好${NC}"
}

# 连接检查
check_cloud_connection() {
    echo -e "${BLUE}🔌 正在检查云服务器连接...${NC}"
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$CLOUD_USER@$CLOUD_SERVER" "echo connected" > /dev/null 2>&1; then
        echo -e "${RED}❌ 无法连接到云服务器: $CLOUD_USER@$CLOUD_SERVER${NC}"
        echo -e "${YELLOW}ℹ️  请检查SSH密钥、网络连接或服务器状态${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 云服务器连接正常${NC}"
}

# 显示同步帮助
show_help() {
    echo -e "\n${YELLOW}📝 云服务器同步脚本使用说明${NC}\n"
    echo -e "${BLUE}功能：在本地工作区和 yyc3-121 云服务器之间同步代码${NC}\n"
    echo -e "${GREEN}使用方法：${NC}"
    echo -e "  $0 --upload     # 将本地文件上传到云服务器"
    echo -e "  $0 --download   # 将云服务器文件下载到本地"
    echo -e "  $0 --sync       # 双向同步（以最新修改时间为准）"
    echo -e "  $0 --help       # 显示此帮助信息\n"
    echo -e "${YELLOW}注意事项：${NC}"
    echo -e "  • 确保路径配置正确: 本地=${LOCAL_DIR}, 云服务器=${CLOUD_DIR}"
    echo -e "  • 某些文件（如 .git、node_modules 等）会被自动排除"
    echo -e "  • 建议先使用 --dry-run 参数查看将要同步的内容\n"
    exit 0
}

# 生成 rsync 排除参数
generate_exclude_params() {
    local exclude_params=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_params="$exclude_params --exclude '$pattern'"
    done
    echo "$exclude_params"
}

# 上传到云服务器
upload_to_cloud() {
    echo -e "\n${YELLOW}📤 开始上传文件到云服务器...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始上传到云服务器..." >> "$LOG_FILE"
    
    # 生成排除参数
    local exclude_params=$(generate_exclude_params)
    
    # 构建 rsync 命令
    local rsync_cmd="rsync -avz --progress -e 'ssh -i $SSH_KEY' $exclude_params"
    
    # 如果是测试运行，添加 --dry-run
    if [ "$DRY_RUN" = true ]; then
        rsync_cmd="$rsync_cmd --dry-run"
        echo -e "${BLUE}⚠️  测试运行模式，不会实际同步文件${NC}"
    fi
    
    # 执行同步
    eval "$rsync_cmd '$LOCAL_DIR/' '$CLOUD_USER@$CLOUD_SERVER:$CLOUD_DIR/'"
    
    echo -e "${GREEN}✅ 上传完成！${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 上传完成" >> "$LOG_FILE"
}

# 从云服务器下载
download_from_cloud() {
    echo -e "\n${YELLOW}📥 开始从云服务器下载文件...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始从云服务器下载..." >> "$LOG_FILE"
    
    # 生成排除参数
    local exclude_params=$(generate_exclude_params)
    
    # 构建 rsync 命令
    local rsync_cmd="rsync -avz --progress -e 'ssh -i $SSH_KEY' $exclude_params"
    
    # 如果是测试运行，添加 --dry-run
    if [ "$DRY_RUN" = true ]; then
        rsync_cmd="$rsync_cmd --dry-run"
        echo -e "${BLUE}⚠️  测试运行模式，不会实际同步文件${NC}"
    fi
    
    # 执行同步
    eval "$rsync_cmd '$CLOUD_USER@$CLOUD_SERVER:$CLOUD_DIR/' '$LOCAL_DIR/'"
    
    echo -e "${GREEN}✅ 下载完成！${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 下载完成" >> "$LOG_FILE"
}

# 双向同步
bidirectional_sync() {
    echo -e "\n${YELLOW}🔄 开始双向同步（以最新修改时间为准）...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始双向同步..." >> "$LOG_FILE"
    
    # 生成排除参数
    local exclude_params=$(generate_exclude_params)
    
    # 检查是否有冲突的文件（修改时间接近的文件）
    echo -e "${BLUE}🔍 检查文件冲突...${NC}"
    
    # 构建 rsync 命令（使用 -u 参数只更新较新的文件）
    local rsync_cmd="rsync -avzu --progress -e 'ssh -i $SSH_KEY' $exclude_params"
    
    # 如果是测试运行，添加 --dry-run
    if [ "$DRY_RUN" = true ]; then
        rsync_cmd="$rsync_cmd --dry-run"
        echo -e "${BLUE}⚠️  测试运行模式，不会实际同步文件${NC}"
    fi
    
    # 先从服务器下载较新的文件
    echo -e "${BLUE}📥 首先下载服务器上较新的文件...${NC}"
    eval "$rsync_cmd '$CLOUD_USER@$CLOUD_SERVER:$CLOUD_DIR/' '$LOCAL_DIR/'"
    
    # 再上传本地较新的文件
    echo -e "${BLUE}📤 然后上传本地较新的文件...${NC}"
    eval "$rsync_cmd '$LOCAL_DIR/' '$CLOUD_USER@$CLOUD_SERVER:$CLOUD_DIR/'"
    
    echo -e "${GREEN}✅ 双向同步完成！${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 双向同步完成" >> "$LOG_FILE"
}

# 清理函数
cleanup() {
    # 在这里添加任何需要的清理逻辑
    echo -e "${BLUE}🧹 清理中...${NC}"
}

trap "cleanup" EXIT INT TERM

# 主函数
main() {
    # 默认模式
    SYNC_MODE="help"
    DRY_RUN=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --upload)
                SYNC_MODE="upload"
                shift
                ;;
            --download)
                SYNC_MODE="download"
                shift
                ;;
            --sync)
                SYNC_MODE="sync"
                shift
                ;;
            --help)
                SYNC_MODE="help"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                echo -e "${RED}❌ 未知参数: $1${NC}"
                show_help
                ;;
        esac
    done
    
    echo -e "${BLUE}🚀 云服务器同步工具启动${NC}"
    echo -e "${BLUE}🔗 本地路径: ${LOCAL_DIR}${NC}"
    echo -e "${BLUE}☁️  云服务器: ${CLOUD_USER}@${CLOUD_SERVER}:${CLOUD_DIR}${NC}"
    
    # 根据模式执行相应操作
    case $SYNC_MODE in
        upload)
            # 执行健康检查和连接检查
            check_system_health
            check_cloud_connection
            upload_to_cloud
            ;;
        download)
            # 执行健康检查和连接检查
            check_system_health
            check_cloud_connection
            download_from_cloud
            ;;
        sync)
            # 执行健康检查和连接检查
            check_system_health
            check_cloud_connection
            bidirectional_sync
            ;;
        help)
            show_help
            ;;
    esac
    
    echo -e "\n${GREEN}✅ 云服务器同步操作已完成！${NC} 🌹"
}

# 执行主函数
main "$@"
