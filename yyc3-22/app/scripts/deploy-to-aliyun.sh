/**
 * @file 阿里云部署脚本
 * @description 将应用同步到阿里云服务器
 * @module scripts/deploy-to-aliyun
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
TARGET="${ECS_SSH_USER}@${ECS_HOST}"
REMOTE_DIR="${ECS_BASE_PATH}/"
LOG_FILE="${PROJECT_ROOT}/logs/deploy-aliyun.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 信号处理函数
cleanup_on_exit() {
    echo -e "${BLUE}🔚 部署流程结束${NC}"
    log_message "部署流程结束"
}

trap "cleanup_on_exit" EXIT INT TERM

# 检查连接
check_connection() {
    echo -e "${BLUE}🔍 检查与 $TARGET 的连接...${NC}"
    if ! ssh -q -p ${ECS_SSH_PORT} -o ConnectTimeout=5 "$TARGET" exit; then
        echo -e "${RED}❌ 无法连接到 $TARGET${NC}"
        log_message "连接失败: $TARGET"
        exit 1
    fi
    echo -e "${GREEN}✅ 连接成功${NC}"
}

# 确保远程目录存在
ensure_remote_dir() {
    echo -e "${BLUE}📁 确保远程目录存在...${NC}"
    if ! ssh -p ${ECS_SSH_PORT} "$TARGET" "mkdir -p '$REMOTE_DIR'"; then
        echo -e "${RED}❌ 无法创建远程目录 $REMOTE_DIR${NC}"
        log_message "创建远程目录失败: $REMOTE_DIR"
        exit 1
    fi
}

# 主部署函数
main() {
    echo -e "${BLUE}🚀 开始同步到阿里云服务器：$TARGET${NC}"
    log_message "开始部署到 $TARGET:$REMOTE_DIR"
    
    # 执行检查
    check_connection
    ensure_remote_dir
    
    # 开始同步
    echo -e "${YELLOW}📤 正在同步文件...${NC}"
    log_message "开始rsync同步"
    
    cd "$PROJECT_ROOT"
    if rsync -avz -e "ssh -p ${ECS_SSH_PORT}" --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        ./ "$TARGET:$REMOTE_DIR"; then
        
        echo -e "${GREEN}✅ 同步完成，远程路径：$REMOTE_DIR${NC}"
        log_message "同步成功完成"
        
        # 显示部署信息
        echo -e "\n${BLUE}📊 部署信息:${NC}"
        echo -e "  - 目标服务器: $TARGET"
        echo -e "  - 远程目录: $REMOTE_DIR"
        echo -e "  - 日志文件: $LOG_FILE"
        echo -e "\n${GREEN}✅ 部署任务完成！${NC} 🌹"
    else
        echo -e "${RED}❌ 同步失败${NC}"
        log_message "同步失败"
        exit 1
    fi
}

# 执行主函数
main
