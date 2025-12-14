#!/bin/bash

/**
 * @file deploy-to-cloud.sh
 * @description 云端部署脚本 - 自动化构建、部署和验证应用到云服务器
 * @module scripts
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

# === 脚本健康检查头 ===
set -euo pipefail

# 动态路径设置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# 配置参数
SERVER="yyc3-121"
USER="www"
APP_DIR="/ww/app"
LOG_FILE="${PROJECT_ROOT}/logs/deploy.log"
SSH_KEY="~/.ssh/id_rsa_aliyun"
DEPLOY_BRANCH="main"
MAX_DEPLOY_TIME=300 # 最大部署时间（秒）

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 系统健康检查
check_system_health() {
    echo -e "${BLUE}🔍 正在检查本地系统健康状态...${NC}"
    
    # 检查磁盘空间
    local disk_usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}❌ 磁盘空间不足，使用率: ${disk_usage}%${NC}"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if [ -n "$(cd "$PROJECT_ROOT" && git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  本地有未提交的更改${NC}"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    echo -e "${GREEN}✅ 本地系统健康状态良好 (Node.js: $node_version)${NC}"
}

# 连接检查
check_server_connection() {
    echo -e "${BLUE}🔌 正在检查服务器连接...${NC}"
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$USER@$SERVER" "echo connected" > /dev/null 2>&1; then
        echo -e "${RED}❌ 无法连接到服务器: $USER@$SERVER${NC}"
        echo -e "${YELLOW}ℹ️  请检查SSH密钥、网络连接或服务器状态${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 服务器连接正常${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}🔨 正在构建项目...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始构建项目..." >> "$LOG_FILE"
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 安装依赖
    echo -e "${BLUE}📦 正在安装依赖...${NC}"
    (cd "$PROJECT_ROOT" && npm ci) || (cd "$PROJECT_ROOT" && npm install) || {
        echo -e "${RED}❌ 依赖安装失败${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 依赖安装失败" >> "$LOG_FILE"
        exit 1
    }
    
    # 运行构建
    (cd "$PROJECT_ROOT" && npm run build) || {
        echo -e "${RED}❌ 构建失败${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 构建失败" >> "$LOG_FILE"
        exit 1
    }
    
    # 计算构建时间
    local end_time=$(date +%s)
    local build_time=$((end_time - start_time))
    
    echo -e "${GREEN}✅ 项目构建成功 (耗时: ${build_time}秒)${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 项目构建成功，耗时 ${build_time}秒" >> "$LOG_FILE"
}

# 上传文件
upload_files() {
    echo -e "${YELLOW}📤 正在上传文件到服务器...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始上传文件..." >> "$LOG_FILE"
    
    # 创建远程目录（如果不存在）
    ssh -i "$SSH_KEY" "$USER@$SERVER" "mkdir -p $APP_DIR"
    
    # 定义要排除的文件和目录
    local exclude_patterns=("node_modules" ".git" "logs" "*.tmp" "*.log" ".DS_Store" "*.swp")
    local exclude_args=""
    
    for pattern in "${exclude_patterns[@]}"; do
        exclude_args+=" --exclude='$pattern'"
    done
    
    # 使用rsync上传文件，显示进度
    rsync -avz --progress -e "ssh -i $SSH_KEY" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='*.swp' \
        "$PROJECT_ROOT/" "$USER@$SERVER:$APP_DIR/"
    
    echo -e "${GREEN}✅ 文件上传完成${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 文件上传完成" >> "$LOG_FILE"
}

# 服务器部署配置
server_deploy() {
    echo -e "${YELLOW}🔧 正在服务器上配置部署...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始服务器配置..." >> "$LOG_FILE"
    
    # 在服务器上执行的命令
    ssh -i "$SSH_KEY" "$USER@$SERVER" << EOF
set -e
cd $APP_DIR

# 安装生产依赖
echo 'Installing production dependencies...'
npm install --production --silent

# 创建必要的目录
mkdir -p logs data

# 检查环境变量文件
if [ ! -f .env ]; then
    echo 'Creating .env file from template...'
    if [ -f .env.example ]; then
        cp .env.example .env
        echo 'Warning: Please update .env file with correct values'
    else
        echo 'Error: .env.example not found'
        exit 1
    fi
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo 'Installing PM2...'
    npm install -g pm2
fi

# 创建或更新ecosystem配置
cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps : [{
    name: "0379.email",
    script: "npm",
    args: "start",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    }
  }]
};
PM2CONFIG

echo 'Server configuration completed'
EOF
    
    echo -e "${GREEN}✅ 服务器配置完成${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务器配置完成" >> "$LOG_FILE"
}

# 重启服务
restart_service() {
    echo -e "${YELLOW}🔄 正在重启服务...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始重启服务..." >> "$LOG_FILE"
    
    # 重启PM2服务
    ssh -i "$SSH_KEY" "$USER@$SERVER" "cd $APP_DIR && pm2 restart ecosystem.config.js"
    
    echo -e "${GREEN}✅ 服务重启完成${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务重启完成" >> "$LOG_FILE"
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}🔍 正在验证部署...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始验证部署..." >> "$LOG_FILE"
    
    # 检查服务状态
    local service_status=$(ssh -i "$SSH_KEY" "$USER@$SERVER" "cd $APP_DIR && pm2 status | grep '0379.email'")
    
    if echo "$service_status" | grep -q "online"; then
        echo -e "${GREEN}✅ 服务状态: 运行中${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务运行状态正常" >> "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  服务状态: 可能未正常启动${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 服务状态异常: $service_status" >> "$LOG_FILE"
        
        # 显示最近的日志
        echo -e "${BLUE}📋 最近的服务日志:${NC}"
        ssh -i "$SSH_KEY" "$USER@$SERVER" "cd $APP_DIR && pm2 logs 0379.email --lines 20"
    fi
    
    # 检查应用日志中的错误
    local error_count=$(ssh -i "$SSH_KEY" "$USER@$SERVER" "cd $APP_DIR && grep -i 'error\|fail' logs/* 2>/dev/null | wc -l")
    if [ "$error_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  检测到 $error_count 个潜在错误，请检查日志${NC}"
    fi
}

# 紧急回滚
rollback() {
    echo -e "${RED}🚨 执行紧急回滚...${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始回滚..." >> "$LOG_FILE"
    
    # 尝试回滚到之前的部署
    ssh -i "$SSH_KEY" "$USER@$SERVER" "cd $APP_DIR && pm2 rollback 0379.email || echo 'Rollback failed, trying to restart' && pm2 restart ecosystem.config.js"
    
    echo -e "${YELLOW}⚠️  回滚操作完成，请检查服务状态${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 回滚完成" >> "$LOG_FILE"
}

# 信号处理
handle_signal() {
    echo -e "\n${YELLOW}⚠️  收到中断信号，正在清理...${NC}"
    rollback
    exit 1
}

trap "handle_signal" INT TERM

# 主函数
main() {
    echo -e "${BLUE}🚀 开始部署到云服务器: $SERVER${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署流程开始" >> "$LOG_FILE"
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 执行检查
    check_system_health
    check_server_connection
    
    # 执行部署流程
    build_project
    upload_files
    server_deploy
    restart_service
    verify_deployment
    
    # 错误处理
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 部署失败!${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署失败" >> "$LOG_FILE"
        rollback
        exit 1
    fi
    
    # 计算总部署时间
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    echo -e "\n${GREEN}🎉 部署成功!${NC}"
    echo -e "${BLUE}📊 部署统计:${NC}"
    echo -e "  - 服务器: $USER@$SERVER"
    echo -e "  - 应用目录: $APP_DIR"
    echo -e "  - 部署时间: ${total_time}秒"
    echo -e "  - 日志文件: $LOG_FILE"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署成功完成，总耗时 ${total_time}秒" >> "$LOG_FILE"
}

# 执行主函数
main
