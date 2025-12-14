/**
 * @file 阿里云ECS服务器初始化脚本
 * @description 初始化阿里云ECS服务器环境配置（与ssh_config_example对应）
 * @module scripts/ecs-init
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

#!/bin/bash
# ECS服务器初始化脚本
set -euo pipefail

# 脚本版本
VERSION="1.0.0"

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
ENV_FILE="${PROJECT_ROOT}/services/.env.local"

# 读取.env.local文件
if [ -f "$ENV_FILE" ]; then
  # 使用更安全的方式读取环境变量，忽略包含空格的注释行
  while IFS='=' read -r key value; do
    # 跳过空行和注释行
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    # 移除value中的引号
    value=$(echo "$value" | sed -e 's/^[\'"]//' -e 's/[\'"]$//')
    # 导出环境变量
    export "$key=$value"
  done < "$ENV_FILE"
else
  echo "❌ 未找到.env.local文件，请确保文件存在于$ENV_FILE"
  exit 1
fi

# 服务器配置
SERVER_USER="${ECS_SSH_USER:-root}"
SERVER_HOME="/home/${SERVER_USER}"
APP_DIR="${ECS_BASE_PATH}"

echo "🚀 开始初始化阿里云ECS服务器..."

# 创建开发用户（与ssh_config_example完全对应）
echo "👤 创建开发用户 '${SERVER_USER}'..."
useradd -m -s /bin/bash ${SERVER_USER}
usermod -aG sudo ${SERVER_USER}

# 设置SSH目录
echo "🔑 配置SSH目录..."
mkdir -p ${SERVER_HOME}/.ssh
chmod 700 ${SERVER_HOME}/.ssh

echo "📋 请将开发设备的公钥添加到 /home/yanyu/.ssh/authorized_keys"
echo "🔧 完成后请运行以下命令："
echo "  chmod 600 /home/yanyu/.ssh/authorized_keys"
echo "  chown -R yanyu:yanyu /home/yanyu/.ssh"

# 安全配置 - 强化SSH安全
echo "🛡️ 配置SSH安全设置..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#AuthorizedKeysFile/AuthorizedKeysFile/' /etc/ssh/sshd_config

# 重启SSH服务
echo "🔄 重启SSH服务..."
systemctl restart sshd

echo "✅ ECS初始化完成！"
echo "📝 注意：请使用 'yanyu' 用户通过SSH连接服务器，与ssh_config_example配置完全一致" 🌹