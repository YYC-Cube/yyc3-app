/**
 * @file 配置文件同步脚本
 * @description 跨系统配置文件同步脚本（与ssh_config_example完全对应）
 * @module scripts/sync-config
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

# 同步选项配置
RSYNC_OPTS="-avz --exclude='*.key' --exclude='*.pub' --exclude='.DS_Store' --delete"

echo "🔄 开始同步配置文件到所有设备..."

sync_to_remote() {
    local host=$1
    local src_path=$2
    local dest_path=$3
    local display_name=$4
    
    echo "📤 正在同步到 $display_name ($host)..."
    
    if [[ "$OSTYPE" == "darwin"* || "$OSTYPE" == "linux-gnu"* ]]; then
        if rsync $RSYNC_OPTS "$src_path" "$host:$dest_path"; then
            echo "✅ 成功同步到 $display_name"
        else
            echo "❌ 同步到 $display_name 失败"
        fi
    else
        # Windows使用scp
        if scp -r "$src_path" "$host:$dest_path"; then
            echo "✅ 成功同步到 $display_name"
        else
            echo "❌ 同步到 $display_name 失败"
        fi
    fi
}

# 定义要同步的文件
CONFIG_FILES=("~/.ssh/config" "~/.env" "$PROJECT_ROOT/scripts/")

# 同步到本地设备（与ssh_config_example完全对应）
echo "🏠 同步到本地设备..."

# 同步到M4 Max
sync_to_remote "local-macbook-m4max" "${CONFIG_FILES[0]}" "~/.ssh/" "M4 Max"
sync_to_remote "local-macbook-m4max" "${CONFIG_FILES[1]}" "~/." "M4 Max"
sync_to_remote "local-macbook-m4max" "${CONFIG_FILES[2]}" "~/scripts/" "M4 Max"

# 同步到iMac M4
sync_to_remote "local-imac-m4" "${CONFIG_FILES[0]}" "~/.ssh/" "iMac M4"
sync_to_remote "local-imac-m4" "${CONFIG_FILES[1]}" "~/." "iMac M4"
sync_to_remote "local-imac-m4" "${CONFIG_FILES[2]}" "~/scripts/" "iMac M4"

# 同步到华为笔记本
sync_to_remote "local-huawei" "${CONFIG_FILES[0]}" "~/.ssh/" "华为笔记本"
sync_to_remote "local-huawei" "${CONFIG_FILES[1]}" "~/." "华为笔记本"
sync_to_remote "local-huawei" "${CONFIG_FILES[2]}" "~/scripts/" "华为笔记本"

# 同步到NAS服务器
echo "📁 同步到NAS服务器..."
sync_to_remote "local-nas" "${CONFIG_FILES[0]}" "~/.ssh/" "NAS服务器"
sync_to_remote "local-nas" "${CONFIG_FILES[1]}" "~/." "NAS服务器"

# 同步到阿里云服务器
echo "☁️ 同步到阿里云服务器..."
sync_to_remote "aliyun-ecs-33" "${CONFIG_FILES[0]}" "~/.ssh/" "阿里云华北2服务器"
sync_to_remote "aliyun-ecs-33" "${CONFIG_FILES[1]}" "~/." "阿里云华北2服务器"

sync_to_remote "aliyun-ecs-121" "${CONFIG_FILES[0]}" "~/.ssh/" "阿里云华北6服务器"
sync_to_remote "aliyun-ecs-121" "${CONFIG_FILES[1]}" "~/." "阿里云华北6服务器"

echo "✅ 配置文件同步操作完成！"
echo "🔍 注意：已排除密钥文件，所有主机名称与ssh_config_example完全对应" 🌹