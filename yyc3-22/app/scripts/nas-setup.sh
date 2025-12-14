/**
 * @file NAS服务器SSH设置脚本
 * @description 配置NAS服务器的SSH访问设置（与ssh_config_example完全对应）
 * @module scripts/nas-setup
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
echo "🛠️ 设置NAS服务器SSH访问（系统管理员：YYC，主机名：yyc3-45）..."

# 创建授权密钥文件
echo "🔑 配置SSH目录和授权文件..."
mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

echo "📋 请将以下设备的公钥添加到 ~/.ssh/authorized_keys："
echo "1. M4 Max (yyc3-22) - id_rsa_local.pub"
echo "2. iMac M4 (yyc3-77) - id_rsa_local.pub"
echo "3. 华为笔记本 (yyc3-66) - id_rsa_local.pub"
echo "📌 注意：请确保使用 id_rsa_local.pub 文件的内容"

# 生成NAS自身的密钥（与ssh_config_example对应）
echo "🔐 生成NAS服务器的访问密钥..."
if [ ! -f ~/.ssh/id_rsa_local ]; then
    ssh-keygen -t ed25519 -f ~/.ssh/id_rsa_local -C "yyc3-nas-$(hostname)-$(date +%Y%m%d)" -N ""
    chmod 600 ~/.ssh/id_rsa_local
    chmod 644 ~/.ssh/id_rsa_local.pub
fi

# 端口配置提醒
echo "📡 端口配置确认："
echo "- SSH端口：57（非标准端口，与ssh_config_example一致）"
echo "- 请确保NAS防火墙允许端口57访问"

# 安全设置提醒
echo "🛡️ 安全设置提示："
echo "- 请禁用密码认证，只允许密钥认证"
echo "- 建议限制SSH登录的IP地址范围"
echo "- 定期更新系统和SSH服务"

echo "✅ NAS服务器SSH设置完成！"
echo "🔍 注意：用户名 'YYC' 和端口 '57' 已与ssh_config_example完全对应" 🌹