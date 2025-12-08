#!/bin/bash
set -e

echo "🚧 开始预发布部署..."

# 切换到预发布分支
git checkout develop

# 安装依赖并构建
pnpm install
pnpm build

# 启动服务（预览模式）
pnpm start --preview &

# 健康检查
sleep 5
bash scripts/health-check.sh

echo "✅ 预发布部署完成"
