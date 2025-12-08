#!/bin/bash
set -e

echo "🌐 使用 Vercel CLI 部署..."

# 检查 Vercel CLI 是否安装
if ! command -v vercel &> /dev/null; then
  echo "❌ 未安装 Vercel CLI，请先运行: pnpm add -g vercel"
  exit 1
fi

# 部署到 Vercel（自动识别项目）
vercel --prod

echo "✅ Vercel 部署完成"
