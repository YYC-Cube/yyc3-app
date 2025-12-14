#!/usr/bin/env bash
# === 脚本健康检查头 ===
set -euo pipefail

# 输出路径
OUTPUT_PATH="./docs/changelog.json"
TMP_FILE=$(mktemp)

# 函数：从 docs/releases.md 解析为 JSON
parse_releases_md() {
  local releases_md="./docs/releases.md"
  if [[ ! -f "$releases_md" ]]; then
    return 1
  fi

  # 解析格式：一级标题为版本号，列表项为变更
  # 示例：
  # ## v0.1.0 (2024-10-20)
  # - 新增：xx
  # - 修复：yy
  # 生成结构：[{version, date, changes:[{type, zh, en}]}]

  awk '\
    BEGIN { print "[" } \
    /^## / {
      if (count > 0) { print "," }
      # 提取版本与日期
      ver=$2; date=$3; gsub(/[()]/, "", date);
      printf "{\"version\":\"%s\",\"date\":\"%s\",\"changes\":[", ver, date
      change_open=1; first=1; next
    } \
    /^- / {
      line=$0; sub(/^- /, "", line)
      type="更新"
      if (line ~ /^新增/) type="新增"
      else if (line ~ /^修复/) type="修复"
      else if (line ~ /^优化/) type="优化"
      if (first==0) { printf "," } else { first=0 }
      printf "{\"type\":\"%s\",\"zh\":\"%s\",\"en\":\"%s\"}", type, line, line
      next
    } \
    /^$/ { next } \
    END {
      if (change_open==1) { printf "]" }
      print "]"
    }' "$releases_md" > "$TMP_FILE"

  return 0
}

# 函数：从 docs/versions/*.md 解析为 JSON（若存在）
parse_versions_folder() {
  local versions_dir="./docs/versions"
  if [[ ! -d "$versions_dir" ]]; then
    return 1
  fi

  echo "[" > "$TMP_FILE"
  local first=1
  for md in "$versions_dir"/v*.md; do
    [[ -f "$md" ]] || continue
    # 从文件头提取版本与日期
    local version date
    version=$(basename "$md" .md)
    date=$(grep -E "^date:" "$md" | head -n1 | awk -F': ' '{print $2}')
    [[ -z "${date:-}" ]] && date=$(date +%F)

    if [[ $first -eq 0 ]]; then echo "," >> "$TMP_FILE"; else first=0; fi
    echo "{\"version\":\"$version\",\"date\":\"$date\",\"changes\":[" >> "$TMP_FILE"

    local cfirst=1
    # 解析 `- ` 列表项作为变更
    while IFS= read -r line; do
      [[ "$line" =~ ^-\  ]] || continue
      entry=${line#- }
      type="更新"
      if [[ "$entry" == 新增* ]]; then type="新增"; fi
      if [[ "$entry" == 修复* ]]; then type="修复"; fi
      if [[ "$entry" == 优化* ]]; then type="优化"; fi
      if [[ $cfirst -eq 0 ]]; then echo "," >> "$TMP_FILE"; else cfirst=0; fi
      printf '{"type":"%s","zh":"%s","en":"%s"}' "$type" "$entry" "$entry" >> "$TMP_FILE"
    done < "$md"

    echo "]}" >> "$TMP_FILE"
  done
  echo "]" >> "$TMP_FILE"
  return 0
}

# 主流程：优先解析 versions 文件夹，其次 releases.md，最后生成占位
if parse_versions_folder; then
  :
elif parse_releases_md; then
  :
else
  # 生成占位 JSON
  cat > "$TMP_FILE" <<'JSON'
[
  {
    "version": "v0.0.0",
    "date": "2024-01-01",
    "changes": [
      { "type": "新增", "zh": "初始化项目结构", "en": "Initialize project structure" }
    ]
  }
]
JSON
fi

# 写出到目标路径
mkdir -p ./docs
mv "$TMP_FILE" "$OUTPUT_PATH"
echo "✅ 生成 changelog 至 $OUTPUT_PATH"
