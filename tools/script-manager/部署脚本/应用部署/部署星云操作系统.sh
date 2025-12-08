#!/bin/bash
set -e

echo "🚀 开始部署星云操作系统..."

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 启动服务（后台运行）
pnpm start &

# 健康检查
sleep 5
bash scripts/health-check.sh

echo "✅ 部署完成"
