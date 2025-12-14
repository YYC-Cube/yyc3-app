#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 脚本配置
ENV_FILE=".env"
LOG_FILE="./logs/deploy.log"
CURRENT_ENV_FILE=".current_env"
BLUE_COMPOSE="docker-compose.blue.yml"
GREEN_COMPOSE="docker-compose.green.yml"
NGINX_BLUE="nginx-blue.conf"
NGINX_GREEN="nginx-green.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# 清理函数
cleanup() {
    echo "[INFO] 清理部署环境..."
    # 可以在这里添加清理代码
}

# 加载环境变量
load_environment() {
    echo "[INFO] 加载部署环境变量..."
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        echo "[INFO] 已加载环境变量文件: $ENV_FILE"
    else
        echo "[ERROR] 未找到环境变量文件: $ENV_FILE"
        exit 1
    fi
}

# 检查当前活动环境
check_current_env() {
    echo "[INFO] 检查当前活动环境..."
    if [ -f "$CURRENT_ENV_FILE" ]; then
        CURRENT_ENV=$(cat "$CURRENT_ENV_FILE")
        echo "[INFO] 当前活动环境: $CURRENT_ENV"
    else
        echo "[INFO] 未找到当前环境标记文件，默认使用蓝色环境"
        CURRENT_ENV="blue"
        echo "$CURRENT_ENV" > "$CURRENT_ENV_FILE"
    fi
}

# 确定部署环境
determine_deploy_env() {
    check_current_env
    if [ "$CURRENT_ENV" = "blue" ]; then
        DEPLOY_ENV="green"
        DEPLOY_COMPOSE="$GREEN_COMPOSE"
        DEPLOY_NGINX="$NGINX_GREEN"
        OTHER_ENV="blue"
        OTHER_COMPOSE="$BLUE_COMPOSE"
    else
        DEPLOY_ENV="blue"
        DEPLOY_COMPOSE="$BLUE_COMPOSE"
        DEPLOY_NGINX="$NGINX_BLUE"
        OTHER_ENV="green"
        OTHER_COMPOSE="$GREEN_COMPOSE"
    fi
    echo "[INFO] 将部署到: $DEPLOY_ENV 环境"
    echo "[INFO] 当前活动环境: $OTHER_ENV"
}

# 拉取最新代码
pull_latest_code() {
    echo "[INFO] 拉取最新代码..."
    git pull origin main
}

# 构建Docker镜像
build_docker_images() {
    echo "[INFO] 构建Docker镜像..."
    TAG=$(git rev-parse --short HEAD)
    export TAG
    docker-compose -f "$DEPLOY_COMPOSE" build --no-cache
}

# 启动新环境
start_new_env() {
    echo "[INFO] 启动 $DEPLOY_ENV 环境..."
    docker-compose -f "$DEPLOY_COMPOSE" up -d
    
    # 等待服务启动
    echo "[INFO] 等待服务启动..."
    sleep 30
}

# 健康检查
health_check() {
    echo "[INFO] 对 $DEPLOY_ENV 环境进行健康检查..."
    
    # 确定API端口
    if [ "$DEPLOY_ENV" = "blue" ]; then
        API_PORT=3000
        ADMIN_PORT=3001
    else
        API_PORT=3100
        ADMIN_PORT=3101
    fi
    
    # 检查API服务
    echo "[INFO] 检查API服务 (端口: $API_PORT)..."
    if ! curl -f "http://localhost:$API_PORT/health"; then
        echo "[ERROR] API服务健康检查失败"
        echo "[INFO] 停止并清理 $DEPLOY_ENV 环境..."
        docker-compose -f "$DEPLOY_COMPOSE" down
        exit 1
    fi
    
    # 检查Admin服务
    echo "[INFO] 检查Admin服务 (端口: $ADMIN_PORT)..."
    if ! curl -f "http://localhost:$ADMIN_PORT/health"; then
        echo "[ERROR] Admin服务健康检查失败"
        echo "[INFO] 停止并清理 $DEPLOY_ENV 环境..."
        docker-compose -f "$DEPLOY_COMPOSE" down
        exit 1
    fi
    
    echo "[INFO] 健康检查通过！$DEPLOY_ENV 环境已准备就绪"
}

# 切换流量
switch_traffic() {
    echo "[INFO] 切换流量到 $DEPLOY_ENV 环境..."
    
    # 复制Nginx配置文件
    sudo cp "$DEPLOY_NGINX" "$NGINX_SITES_AVAILABLE/app.$DEPLOY_ENV"
    
    # 更新符号链接
    sudo ln -sf "$NGINX_SITES_AVAILABLE/app.$DEPLOY_ENV" "$NGINX_SITES_ENABLED/app"
    
    # 重新加载Nginx配置
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo nginx -s reload
        echo "[INFO] Nginx配置已更新并重新加载"
    else
        echo "[ERROR] Nginx配置测试失败，回滚到之前的配置"
        sudo ln -sf "$NGINX_SITES_AVAILABLE/app.$OTHER_ENV" "$NGINX_SITES_ENABLED/app"
        sudo nginx -s reload
        exit 1
    fi
    
    # 更新当前环境标记
    echo "$DEPLOY_ENV" > "$CURRENT_ENV_FILE"
    echo "[INFO] 流量已切换到 $DEPLOY_ENV 环境"
}

# 停止旧环境
stop_old_env() {
    echo "[INFO] 停止 $OTHER_ENV 环境..."
    docker-compose -f "$OTHER_COMPOSE" down
    echo "[INFO] $OTHER_ENV 环境已停止"
}

# 主函数
main() {
    echo "========================================"
    echo "🚀 YYC3 蓝绿部署脚本"
    echo "========================================"
    
    # 创建日志目录
    mkdir -p ./logs
    
    load_environment
    determine_deploy_env
    pull_latest_code
    build_docker_images
    start_new_env
    health_check
    switch_traffic
    stop_old_env
    
    echo "========================================"
    echo "✅ 蓝绿部署完成！当前活动环境: $DEPLOY_ENV"
    echo "========================================"
}

# 执行主函数
main
