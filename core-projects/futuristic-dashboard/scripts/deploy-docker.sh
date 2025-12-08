#!/bin/bash
set -e

echo "🐳 开始 Docker 部署..."

# 构建镜像
docker build -t nebula-system .

# 启动容器
docker run -d -p 3000:3000 --name nebula-app nebula-system

# 健康检查
sleep 5
bash scripts/health-check.sh

echo "✅ Docker 部署完成"
