#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 资源监控
check_system_health() {
    local memory_usage=$(free -m 2>/dev/null | awk 'NR==2{printf "%.0f", $3*100/$2}' || echo "0")
    [ "$memory_usage" -gt 85 ] && echo "[警告] 内存使用过高: $memory_usage%" >&2
}

# 清理函数
cleanup() {
    # 清理临时文件等
    rm -f "$TEMP_FILE" 2>/dev/null
}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_green() {
    echo -e "${GREEN}$1${NC}"
}

echo_yellow() {
    echo -e "${YELLOW}$1${NC}"
}

echo_red() {
    echo -e "${RED}$1${NC}"
}

# 项目根目录
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/app"
REDIS_CONFIG_DIR="$ROOT_DIR/redis-config"
TEMP_FILE="$(mktemp)"

# 检查目录是否存在
check_directories() {
    if [ ! -d "$APP_DIR" ] || [ ! -d "$REDIS_CONFIG_DIR" ]; then
        echo_red "错误: 无法找到必要的项目目录"
        exit 1
    fi
}

# 读取源环境变量文件
sync_env_vars() {
    local source_env="$1"
    local target_env="$2"
    local backup="${target_env}.bak.$(date +%Y%m%d%H%M%S)"
    
    if [ ! -f "$source_env" ]; then
        echo_yellow "警告: 源环境变量文件不存在: $source_env"
        return 1
    fi
    
    # 创建目标文件的备份（如果存在）
    if [ -f "$target_env" ]; then
        cp "$target_env" "$backup"
        echo_green "已备份 $target_env 到 $backup"
    else
        # 确保目标目录存在
        mkdir -p "$(dirname "$target_env")"
    fi
    
    # 同步环境变量，但保留目标文件中的本地自定义变量
    if [ -f "$target_env" ]; then
        # 提取目标文件中的自定义变量（以CUSTOM_或LOCAL_开头的变量）
        grep -E '^(CUSTOM_|LOCAL_)' "$target_env" > "$TEMP_FILE"
        
        # 复制源文件，然后追加自定义变量
        cp "$source_env" "$target_env"
        if [ -s "$TEMP_FILE" ]; then
            echo "" >> "$target_env"
            echo "# 本地自定义变量（不会被同步覆盖）" >> "$target_env"
            cat "$TEMP_FILE" >> "$target_env"
            echo_green "已保留目标文件中的自定义变量"
        fi
    else
        # 直接复制源文件
        cp "$source_env" "$target_env"
    fi
    
    echo_green "已同步环境变量: $source_env -> $target_env"
    return 0
}

# 验证Redis密码一致性
verify_redis_password() {
    local redis_password="$1"
    local app_env="$2"
    local redis_config_env="$3"
    
    # 检查app环境文件中的REDIS_PASSWORD
    local app_redis_password=$(grep "^REDIS_PASSWORD=" "$app_env" | cut -d'=' -f2 | tr -d '\'\'\"\' | tr -d ' ')
    
    # 检查redis-config环境文件中的REDIS_PROD_PASSWORD
    local redis_config_redis_password=$(grep "^REDIS_PROD_PASSWORD=" "$redis_config_env" | cut -d'=' -f2 | tr -d '\'\'\"\' | tr -d ' ')
    
    if [ -n "$app_redis_password" ] && [ -n "$redis_config_redis_password" ] && [ "$app_redis_password" != "$redis_config_redis_password" ]; then
        echo_yellow "警告: Redis密码不一致!"
        echo_yellow "  app: $app_redis_password"
        echo_yellow "  redis-config: $redis_config_redis_password"
        return 1
    fi
    
    echo_green "Redis密码检查通过: $redis_password"
    return 0
}

# 同步API设置
sync_api_settings() {
    echo "=== 开始同步API设置 ==="
    
    # 定义环境变量文件路径
    local redis_config_env_example="$REDIS_CONFIG_DIR/.env.example"
    local redis_config_env_local="$REDIS_CONFIG_DIR/.env.local"
    local app_env_example="$APP_DIR/.env.example"
    local app_env_local="$APP_DIR/.env.local"
    local api_env_local="$REDIS_CONFIG_DIR/api/.env.local"
    local config_env="$REDIS_CONFIG_DIR/config/.env"
    local config_env_example="$REDIS_CONFIG_DIR/config/.env.example"
    
    # 同步环境变量文件
    echo "\n=== 同步环境变量文件 ==="
    sync_env_vars "$redis_config_env_example" "$redis_config_env_local"
    sync_env_vars "$redis_config_env_local" "$app_env_local"
    sync_env_vars "$redis_config_env_local" "$api_env_local"
    sync_env_vars "$config_env_example" "$config_env"
    
    # 从redis-config中获取生产密码
    local redis_prod_password="redis_yyc3" # 默认值
    if [ -f "$redis_config_env_local" ]; then
        local password=$(grep "^REDIS_PROD_PASSWORD=" "$redis_config_env_local" | cut -d'=' -f2 | tr -d '\'\'\"\' | tr -d ' ')
        if [ -n "$password" ]; then
            redis_prod_password="$password"
        fi
    fi
    
    # 确保所有环境文件都使用相同的Redis密码
    echo "\n=== 更新Redis密码一致性 ==="
    for env_file in "$app_env_local" "$api_env_local"; do
        if [ -f "$env_file" ]; then
            # 检查并更新REDIS_PASSWORD
            if grep -q "^REDIS_PASSWORD=" "$env_file"; then
                sed -i '' "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$redis_prod_password/" "$env_file"
            else
                echo "REDIS_PASSWORD=$redis_prod_password" >> "$env_file"
            fi
            echo_green "已更新 $env_file 中的REDIS_PASSWORD"
        fi
    done
    
    # 确保config/.env中的REDIS_PROD_PASSWORD一致
    if [ -f "$config_env" ]; then
        if grep -q "^REDIS_PROD_PASSWORD=" "$config_env"; then
            sed -i '' "s/^REDIS_PROD_PASSWORD=.*/REDIS_PROD_PASSWORD=$redis_prod_password/" "$config_env"
        else
            echo "REDIS_PROD_PASSWORD=$redis_prod_password" >> "$config_env"
        fi
        echo_green "已更新 $config_env 中的REDIS_PROD_PASSWORD"
    fi
    
    # 验证Redis密码一致性
    verify_redis_password "$redis_prod_password" "$app_env_local" "$redis_config_env_local"
    
    # 设置其他共享环境变量
    echo "\n=== 设置共享环境变量 ==="
    for env_file in "$app_env_local" "$api_env_local"; do
        if [ -f "$env_file" ]; then
            # 设置Redis连接参数
            sed -i '' "s/^REDIS_HOST=.*/REDIS_HOST=127.0.0.1/" "$env_file" || echo "REDIS_HOST=127.0.0.1" >> "$env_file"
            sed -i '' "s/^REDIS_PORT=.*/REDIS_PORT=6380/" "$env_file" || echo "REDIS_PORT=6380" >> "$env_file"
            
            # 设置API通信参数
            sed -i '' "s/^API_VERSION=.*/API_VERSION=v1/" "$env_file" || echo "API_VERSION=v1" >> "$env_file"
            sed -i '' "s/^LOG_LEVEL=.*/LOG_LEVEL=info/" "$env_file" || echo "LOG_LEVEL=info" >> "$env_file"
            
            echo_green "已更新共享环境变量: $env_file"
        fi
    done
    
    echo "\n=== API设置同步完成 ==="
}

# 创建符号链接，使两个项目共享redis-client库
create_shared_symlinks() {
    echo "\n=== 创建共享库符号链接 ==="
    
    local shared_lib_path="$ROOT_DIR/shared-lib/redis-client"
    local app_node_modules="$APP_DIR/node_modules/shared-redis-client"
    local redis_api_node_modules="$REDIS_CONFIG_DIR/api/node_modules/shared-redis-client"
    
    # 确保共享库路径存在
    if [ ! -d "$shared_lib_path" ]; then
        echo_yellow "警告: 共享库路径不存在: $shared_lib_path"
        return 1
    fi
    
    # 创建app的符号链接
    if [ ! -d "$APP_DIR/node_modules" ]; then
        mkdir -p "$APP_DIR/node_modules"
    fi
    
    if [ -e "$app_node_modules" ]; then
        if [ -L "$app_node_modules" ]; then
            echo_yellow "符号链接已存在: $app_node_modules"
        else
            echo_yellow "目标路径已存在且不是符号链接: $app_node_modules"
            echo_yellow "请手动处理此路径后重试"
        fi
    else
        ln -s "$shared_lib_path" "$app_node_modules"
        echo_green "已创建符号链接: $app_node_modules -> $shared_lib_path"
    fi
    
    # 创建redis-config/api的符号链接
    if [ ! -d "$REDIS_CONFIG_DIR/api/node_modules" ]; then
        mkdir -p "$REDIS_CONFIG_DIR/api/node_modules"
    fi
    
    if [ -e "$redis_api_node_modules" ]; then
        if [ -L "$redis_api_node_modules" ]; then
            echo_yellow "符号链接已存在: $redis_api_node_modules"
        else
            echo_yellow "目标路径已存在且不是符号链接: $redis_api_node_modules"
            echo_yellow "请手动处理此路径后重试"
        fi
    else
        ln -s "$shared_lib_path" "$redis_api_node_modules"
        echo_green "已创建符号链接: $redis_api_node_modules -> $shared_lib_path"
    fi
    
    return 0
}

# 更新Redis配置文件中的密码
update_redis_config_password() {
    echo "\n=== 更新Redis配置文件密码 ==="
    
    local redis_prod_conf="$REDIS_CONFIG_DIR/config/redis-prod.conf"
    local redis_prod_password="redis_yyc3" # 默认值
    
    # 从环境变量文件中获取密码
    local env_file="$REDIS_CONFIG_DIR/.env.local"
    if [ -f "$env_file" ]; then
        local password=$(grep "^REDIS_PROD_PASSWORD=" "$env_file" | cut -d'=' -f2 | tr -d '\'\'\"\' | tr -d ' ')
        if [ -n "$password" ]; then
            redis_prod_password="$password"
        fi
    fi
    
    # 更新redis-prod.conf中的密码
    if [ -f "$redis_prod_conf" ]; then
        # 备份配置文件
        local backup="${redis_prod_conf}.bak.$(date +%Y%m%d%H%M%S)"
        cp "$redis_prod_conf" "$backup"
        
        # 更新密码
        sed -i '' "s/^requirepass .*/requirepass $redis_prod_password/" "$redis_prod_conf"
        echo_green "已更新 $redis_prod_conf 中的密码，备份保存至 $backup"
        
        # 提示重启Redis服务以应用配置
        echo_yellow "请重启Redis服务以应用新的配置:"
        echo_yellow "  cd $REDIS_CONFIG_DIR && bash scripts/redis-manager.sh restart --mode docker --env prod"
    else
        echo_red "错误: Redis配置文件不存在: $redis_prod_conf"
    fi
}

# 验证API服务配置
verify_api_services() {
    echo "\n=== 验证API服务配置 ==="
    
    local issues_found=0
    
    # 检查app的Redis配置
    local app_redis_config="$APP_DIR/shared/redis/config.js"
    if [ ! -f "$app_redis_config" ]; then
        echo_red "错误: App Redis配置文件不存在: $app_redis_config"
        issues_found=1
    else
        echo_green "App Redis配置文件存在: $app_redis_config"
    fi
    
    # 检查redis-config/api的Redis服务
    local redis_api_service="$REDIS_CONFIG_DIR/api/services/redis.js"
    if [ ! -f "$redis_api_service" ]; then
        echo_red "错误: Redis API服务文件不存在: $redis_api_service"
        issues_found=1
    else
        echo_green "Redis API服务文件存在: $redis_api_service"
    fi
    
    # 检查环境变量文件
    for env_file in "$APP_DIR/.env.local" "$REDIS_CONFIG_DIR/.env.local" "$REDIS_CONFIG_DIR/api/.env.local" "$REDIS_CONFIG_DIR/config/.env"; do
        if [ ! -f "$env_file" ]; then
            echo_yellow "警告: 环境变量文件不存在: $env_file"
            issues_found=1
        else
            echo_green "环境变量文件存在: $env_file"
        fi
    done
    
    if [ "$issues_found" -eq 0 ]; then
        echo_green "所有API服务配置验证通过"
    else
        echo_yellow "发现 $issues_found 个配置问题，请检查并修复"
    fi
    
    return $issues_found
}

# 主函数
main() {
    check_system_health
    check_directories
    
    echo_green "开始同步API设置..."
    
    # 同步API设置
    sync_api_settings
    
    # 创建共享库符号链接
    create_shared_symlinks
    
    # 更新Redis配置文件密码
    update_redis_config_password
    
    # 验证API服务配置
    verify_api_services
    
    echo "\n=== API设置同步总结 ==="
    echo_green "✅ 环境变量已同步"
    echo_green "✅ Redis密码已统一"
    echo_green "✅ 共享库链接已创建"
    echo_green "✅ Redis配置已更新"
    echo_green "✅ API服务配置已验证"
    
    echo "\n🎯 请确保在两个项目中使用相同的Redis连接参数，"
    echo "🎯 并使用共享的redis-client库以保持一致性"
    echo "🎯 同步完成后，请重启相关服务以应用新配置"
}

# 执行主函数
main

# 返回退出码
exit 0
