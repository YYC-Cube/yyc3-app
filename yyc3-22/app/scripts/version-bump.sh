#!/bin/bash
/**
 * @file 版本号更新脚本
 * @description 从changelog.json中提取最新版本号并自动递增patch位
 * @module scripts/version-bump
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

# === 脚本健康检查头 ===
set -euo pipefail

# 设置项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."

# 颜色定义
GREEN="\033[0;32m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}🔢 正在计算新版本号...${NC}"

# 从changelog.json中提取最新版本号
CHANGELOG_PATH="${PROJECT_ROOT}/docs/changelog.json"
if [ ! -f "$CHANGELOG_PATH" ]; then
    echo "警告: $CHANGELOG_PATH 不存在，使用默认版本 v0.0.0"
    LATEST="v0.0.0"
else
    LATEST=$(jq -r '.[0].version' "$CHANGELOG_PATH" 2>/dev/null || echo "v0.0.0")
fi

echo -e "${BLUE}📋 当前最新版本: $LATEST${NC}"

# 版本号递增处理
IFS='.' read -r MAJOR MINOR PATCH <<< "${LATEST#v}"
PATCH=$((PATCH + 1))
NEW_VERSION="v$MAJOR.$MINOR.$PATCH"

echo -e "${GREEN}🚀 新版本号: $NEW_VERSION${NC}"
echo "$NEW_VERSION"
