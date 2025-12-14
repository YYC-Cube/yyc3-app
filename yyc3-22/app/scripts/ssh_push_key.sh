#!/bin/bash
/**
 * @file SSH公钥分发脚本
 * @description 自动将本地SSH公钥分发到多台服务器
 * @module scripts/ssh_push_key
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

# === 脚本健康检查头 ===
set -euo pipefail
trap "echo 'SSH公钥分发操作已完成'" EXIT INT TERM

# 设置项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."

# 颜色定义
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

# 配置参数
PUBKEY="$HOME/.ssh/id_rsa.pub"  # 本地公钥路径
USER="root"  # 远程用户名

# 目标服务器列表
HOSTS=(
  "8.152.195.33"
  "192.168.3.45"
  "38.127.221.212"
  "10.0.0.11"
  "10.0.0.12"
)

echo -e "${BLUE}🚀 开始SSH公钥分发...${NC}"

# 检查公钥文件是否存在
if [ ! -f "$PUBKEY" ]; then
    echo -e "${RED}❌ 错误: 公钥文件不存在: $PUBKEY${NC}"
    echo -e "${YELLOW}💡 提示: 请先使用 ssh-keygen 生成SSH密钥对${NC}"
    exit 1
fi

echo -e "${BLUE}📋 使用公钥: $PUBKEY${NC}"
echo -e "${BLUE}👤 目标用户: $USER${NC}"

# 分发公钥
success_count=0
error_count=0

for HOST in "${HOSTS[@]}"; do
  echo -e "${BLUE}🔌 正在分发到 $HOST ...${NC}"
  if ssh-copy-id -i "$PUBKEY" "$USER@$HOST"; then
      echo -e "${GREEN}✅ $HOST: 公钥分发成功${NC}"
      success_count=$((success_count + 1))
  else
      echo -e "${RED}❌ $HOST: 公钥分发失败${NC}"
      error_count=$((error_count + 1))
  fi
done

echo -e "\n${BLUE}📊 分发结果统计:${NC}"
echo -e "${GREEN}✅ 成功: $success_count${NC}"
if [ $error_count -gt 0 ]; then
    echo -e "${RED}❌ 失败: $error_count${NC}"
fi
echo -e "\n${GREEN}✅ 公钥分发任务完成${NC}"

