#!/bin/bash
# 生成更新日志差异
set -e

# 设置正确的路径
PROJECT_ROOT="$(dirname "$(dirname "$0")")"
INPUT="$PROJECT_ROOT/docs/changelog.json"
OUTPUT="docs/changelog-diff.md"

# 获取最近两个版本
VERSIONS=( $(jq -r '.[].version' "$INPUT") )
LATEST=${VERSIONS[0]}
PREV=${VERSIONS[1]}

# 提取变更项
CHANGES_LATEST_ZH=$(jq -r ".[0].changes.zh[]" "$INPUT")
CHANGES_PREV_ZH=$(jq -r ".[1].changes.zh[]" "$INPUT")
CHANGES_LATEST_EN=$(jq -r ".[0].changes.en[]" "$INPUT")
CHANGES_PREV_EN=$(jq -r ".[1].changes.en[]" "$INPUT")

# 差异计算函数
diff_items() {
  echo "$1" | sort > /tmp/a.txt
  echo "$2" | sort > /tmp/b.txt
  ADDED=$(comm -23 /tmp/a.txt /tmp/b.txt)
  REMOVED=$(comm -13 /tmp/a.txt /tmp/b.txt)
  echo "$ADDED" > /tmp/added.txt
  echo "$REMOVED" > /tmp/removed.txt
}

# 中文差异
diff_items "$CHANGES_LATEST_ZH" "$CHANGES_PREV_ZH"
ADDED_ZH=$(cat /tmp/added.txt)
REMOVED_ZH=$(cat /tmp/removed.txt)

# 英文差异
diff_items "$CHANGES_LATEST_EN" "$CHANGES_PREV_EN"
ADDED_EN=$(cat /tmp/added.txt)
REMOVED_EN=$(cat /tmp/removed.txt)

# 输出 Markdown
cat <<EOF > "$OUTPUT"
# Changelog 差异对比：$PREV → $LATEST

## 中文变更项
$(echo "$ADDED_ZH" | sed 's/^/- 新增：/g')
$(echo "$REMOVED_ZH" | sed 's/^/- 删除：/g')

## English Changes
$(echo "$ADDED_EN" | sed 's/^/- Added: /g')
$(echo "$REMOVED_EN" | sed 's/^/- Removed: /g')
EOF

echo "✅ changelog-diff.md 已生成：$PREV → $LATEST"
