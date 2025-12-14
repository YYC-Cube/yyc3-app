#!/bin/bash
/**
 * @file 多节点部署脚本
 * @description 将应用部署到多个远程节点
 * @module scripts/deploy-multi
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

# 配置参数 - 使用动态路径
APP_VERSION="1.4.0"
ZIP_NAME="email-release-v${APP_VERSION}.zip"
REMOTE_DIR="/mnt/data/ww/app/"
TEMP_DIR="/tmp"
LOG_FILE="${PROJECT_ROOT}/logs/deploy-multi.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 节点定义 - 可以通过环境变量或配置文件覆盖
declare -A NODES=(
  ["aliyun"]="user@aliyun-host"
  ["local"]="user@localhost"
)

# 失败节点数组
failed_nodes=()

# 信号处理和清理函数
cleanup_on_exit() {
    echo -e "${BLUE}🧹 清理临时文件...${NC}"
    rm -f "${TEMP_DIR}/${ZIP_NAME}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署流程结束，清理完成" >> "$LOG_FILE"
}

trap "cleanup_on_exit" EXIT INT TERM

# 日志函数
log_message() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

# 打包本地内容
echo -e "${BLUE}📦 打包本地内容为 $ZIP_NAME...${NC}"
log_message "开始打包本地内容为 $ZIP_NAME"

cd "$PROJECT_ROOT"
zip -r "${TEMP_DIR}/${ZIP_NAME}" ./docs ./scripts ./helm ./html ./api ./admin ./llm ./mail

# 检查打包是否成功
if [ ! -f "${TEMP_DIR}/${ZIP_NAME}" ]; then
    echo -e "${RED}❌ 打包失败：$ZIP_NAME 未创建${NC}"
    log_message "打包失败：$ZIP_NAME 未创建"
    exit 1
fi

echo -e "${GREEN}✅ 打包成功，文件大小：$(du -sh "${TEMP_DIR}/${ZIP_NAME}" | cut -f1)${NC}"
log_message "打包成功，文件已创建"

# 分发并解压
for node in "${!NODES[@]}"; do
  echo -e "${BLUE}🚀 部署到节点：$node (${NODES[$node]})...${NC}"
  log_message "开始部署到节点：$node (${NODES[$node]})"
  
  # 上传文件
  echo -e "${YELLOW}  📤 上传文件...${NC}"
  if scp "${TEMP_DIR}/${ZIP_NAME}" "${NODES[$node]}":"/mnt/data/"; then
    # 解压文件
    echo -e "${YELLOW}  📦 解压文件...${NC}"
    if ssh "${NODES[$node]}" "mkdir -p $REMOTE_DIR && unzip -o /mnt/data/$ZIP_NAME -d $REMOTE_DIR"; then
      echo -e "${GREEN}  ✅ 节点 $node 部署成功${NC}"
      log_message "节点 $node 部署成功"
    else
      echo -e "${RED}  ❌ 节点 $node 解压失败${NC}"
      log_message "节点 $node 解压失败"
      # 继续尝试其他节点，但记录失败
      failed_nodes+=("$node")
    fi
  else
    echo -e "${RED}  ❌ 节点 $node 上传失败${NC}"
    log_message "节点 $node 上传失败"
    failed_nodes+=("$node")
  fi
done

# 显示部署结果
echo -e "\n${BLUE}📊 部署结果摘要:${NC}"
echo -e "  - 部署版本: v${APP_VERSION}"
echo -e "  - 部署节点总数: ${#NODES[@]}"

if [ ${#failed_nodes[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ 所有节点部署完成！${NC}"
  log_message "所有节点部署成功完成"
else
  echo -e "${YELLOW}⚠️  部分节点部署失败${NC}"
  echo -e "  失败节点: ${failed_nodes[*]}"
  log_message "部署完成，但有 ${#failed_nodes[@]} 个节点失败: ${failed_nodes[*]}"
  exit 1
fi

# 显示部署信息
echo -e "\n${BLUE}🔍 部署信息:${NC}"
echo -e "  - 部署文件: $ZIP_NAME"
echo -e "  - 远程目录: $REMOTE_DIR"
echo -e "  - 日志文件: $LOG_FILE"
echo -e "  - 版本号: v${APP_VERSION}"

echo -e "\n${GREEN}✅ 部署任务完成！${NC} 🌹"