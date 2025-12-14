#!/bin/bash
set -e

# 设置正确的路径
PROJECT_ROOT="$(dirname "$(dirname "$0")")"
VERSION=${1:-v1.4.0}
DATE=$(date +%Y-%m-%d)

# 从文件读取变更项
CHANGES_ZH=( $(cat "$PROJECT_ROOT/docs/changes.zh.txt") )
CHANGES_EN=( $(cat "$PROJECT_ROOT/docs/changes.en.txt") )

# 构建 JSON 片段
NEW_ENTRY=$(jq -n \
  --arg version "$VERSION" \
  --arg date "$DATE" \
  --argjson zh "$(printf '%s\n' "${CHANGES_ZH[@]}" | jq -R . | jq -s .)" \
  --argjson en "$(printf '%s\n' "${CHANGES_EN[@]}" | jq -R . | jq -s .)" \
  '{version: $version, date: $date, changes: {zh: $zh, en: $en}}')

# 插入到 changelog.json 开头
jq --argjson new "$NEW_ENTRY" '[$new] + .' "$PROJECT_ROOT/docs/changelog.json" > "$PROJECT_ROOT/docs/changelog.tmp.json" && mv "$PROJECT_ROOT/docs/changelog.tmp.json" "$PROJECT_ROOT/docs/changelog.json"

echo "✅ changelog.json 已更新：$VERSION"
