#!/bin/bash
set -e

echo "⏪ 开始回滚部署..."

# 获取最近的 Git 标签
LATEST_TAG=$(git describe --tags `git rev-list --tags --max-count=1`)
git checkout $LATEST_TAG

# 重建并启动
pnpm install
pnpm build
pnpm start &

# 健康检查
sleep 5
bash scripts/health-check.sh

echo "✅ 回滚完成：$LATEST_TAG"
