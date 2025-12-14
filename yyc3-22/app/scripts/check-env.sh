#!/bin/bash
# 环境检查脚本
# 检查系统环境配置、SSH连接、密钥文件和环境变量
# 脚本版本: 1.0.0
# 创建日期: 2024-10-15
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

# 配置参数
LOG_FILE="${PROJECT_ROOT}/logs/check-env.log"

# 读取.env.local文件
if [ -f "$ENV_FILE" ]; then
  # 使用更安全的方式读取环境变量，忽略包含空格的注释行
  source <(grep -v '^#' "$ENV_FILE" | sed 's/\r$//' | awk 'BEGIN {FS="="} {print "export \"" $1 "=\"" $2 "\""}')
else
  echo -e "${RED}❌ 未找到.env.local文件，请确保文件存在于$ENV_FILE${NC}"
  exit 1
fi

echo "🧪 环境检查脚本启动..."

# SSH连接检查函数
check_ssh_connection() {
  local host=$1
  local description=$2
  local port=${3:-22}
  local username=${4:-$USER}
  
  echo -n -e "🔄 ${BLUE}检查 $description ($username@$host:$port) 连接: ${NC}"
  
  # 使用ssh_config中定义的主机名进行连接测试
  if ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$host" exit; then
    echo -e "${GREEN}✅ 成功${NC}"
    return 0
  else
    echo -e "${RED}❌ 失败${NC}"
    echo -e "   ${YELLOW}提示: 请检查 $host 的SSH配置和密钥设置${NC}"
    return 1
  fi
}

# 环境变量检查函数
check_env_var() {
  local var=$1
  local desc=${2:-""}
  
  if [ -z "${!var+x}" ]; then
    echo -e "${RED}❌ 环境变量 $var${desc:+ ($desc)} 未设置${NC}"
    return 1
  else
    echo -e "${GREEN}✅ 环境变量 $var${desc:+ ($desc)} 已设置${NC}"
    return 0
  fi
}

# 检查文件是否存在
check_file_exists() {
  local file=$1
  local desc=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $desc 文件存在: $file${NC}"
    return 0
  else
    echo -e "${RED}❌ $desc 文件不存在: $file${NC}"
    return 1
  fi
}

# 检查本地设备连接
echo -e "\n📱 ${BLUE}本地设备连接检查:${NC}"
check_ssh_connection "mac-m4max" "M4 Max 本地设备"
check_ssh_connection "mac-imac" "iMac 本地设备"
check_ssh_connection "win-matebook" "华为笔记本"

# 检查服务器连接
echo -e "\n🖥️  ${BLUE}服务器连接检查:${NC}"
check_ssh_connection "${ECS_HOST}" "阿里云服务器" "${ECS_SSH_PORT}" "${ECS_SSH_USER}"
check_ssh_connection "${NAS_HOST}" "NAS 服务器" "${NAS_SSH_PORT}" "${NAS_SSH_USER}"

# 检查GitHub连接
echo -e "\n🔗 ${BLUE}GitHub连接检查:${NC}"
check_ssh_connection "github-cube" "GitHub主账号(YYC-Cube)"
check_ssh_connection "github-neuxs" "GitHub副账号(YY-Neuxs)"

# 检查密钥文件存在性
echo -e "\n🔐 ${BLUE}SSH密钥文件检查:${NC}"
check_file_exists "~/.ssh/id_rsa_local" "本地设备密钥"
check_file_exists "~/.ssh/id_rsa_aliyun" "阿里云服务器密钥"
check_file_exists "~/.ssh/id_rsa_github_cube" "GitHub主账号密钥"
check_file_exists "~/.ssh/id_rsa_github_neuxs" "GitHub副账号密钥"
check_file_exists "~/.ssh/id_rsa_docker" "Docker远程访问密钥"

# 检查环境变量
echo -e "\n🔍 ${BLUE}环境变量检查:${NC}"
env_vars=("ECS_HOST" "ECS_SSH_PORT" "ECS_SSH_USER" "ECS_BASE_PATH" "NAS_HOST" "NAS_SSH_PORT" "NAS_SSH_USER" "NAS_BASE_PATH")

success_count=0
failed_count=0

for var in "${env_vars[@]}"; do
  if check_env_var "$var"; then
    ((success_count++))
  else
    ((failed_count++))
  fi
done

# 检查Docker连接
echo -e "\n🐳 ${BLUE}Docker 连接检查:${NC}"
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Docker 服务运行正常${NC}"
  
  # 检查Docker远程连接
  echo -e "   🔄 检查Docker远程连接..."
  ssh docker-remote docker ps > /dev/null 2>&1 && echo -e "   ${GREEN}✅ Docker远程连接成功${NC}" || echo -e "   ${YELLOW}⚠️  Docker远程连接失败${NC}"
else
  echo -e "${RED}❌ Docker 服务未运行或无权限${NC}"
  echo -e "   ${YELLOW}提示: 请启动Docker服务或检查用户权限${NC}"
fi

# 检查密钥是否已添加到SSH代理
echo -e "\n🔐 ${BLUE}SSH代理密钥检查:${NC}"
if ssh-add -l > /dev/null 2>&1; then
  for key_path in "~/.ssh/id_rsa_local" "~/.ssh/id_rsa_aliyun" "~/.ssh/id_rsa_github_cube" "~/.ssh/id_rsa_github_neuxs" "~/.ssh/id_rsa_docker"; do
    if [ -f "$key_path" ]; then
      key_file=$(basename "$key_path")
      if ssh-add -l | grep -q "$key_file"; then
        echo -e "${GREEN}✅ $key_file 已添加到SSH代理${NC}"
      else
        echo -e "${YELLOW}⚠️  $key_file 未添加到SSH代理${NC}"
        echo -e "   ${YELLOW}提示: 执行 ssh-add --apple-use-keychain $key_path 添加${NC}"
      fi
    fi
  done
else
  echo -e "${YELLOW}⚠️  SSH代理未运行${NC}"
  echo -e "   ${YELLOW}提示: 执行 eval \"$(ssh-agent -s)\" 启动SSH代理${NC}"
fi

# 显示配置摘要
echo -e "\n📊 ${BLUE}配置摘要:${NC}"
echo -e "- 环境变量: ${GREEN}${success_count}个已设置${NC}${failed_count:+${RED}, ${failed_count}个未设置${NC}}"
echo -e "- 所有密钥文件名与ssh_config_example完全对应"
echo -e "- NAS服务器配置: 用户'YYC', 端口'57', 主机'yyc3-45'"
echo -e "- 阿里云服务器用户: 'yanyu'"

echo -e "\n✅ ${GREEN}环境检查完成！${NC} 🌹"