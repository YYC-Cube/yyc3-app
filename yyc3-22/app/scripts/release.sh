#!/bin/bash
set -e

# 🧩 版本号定义（可自动递增或手动传入）
VERSION=${1:-v1.3.0}
CHART_DIR="${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/helm"
OUTPUT_DIR="${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/releases"
CHANGELOG_JSON="${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/docs/changelog.json"
CHANGELOG_MD="${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/docs/changelog-diff.md"

echo "🚀 发布版本：$VERSION"

# 📦 打包 Helm Chart
echo "📦 打包 Helm Chart..."
mkdir -p "$OUTPUT_DIR"
helm package "$CHART_DIR" --version "$VERSION" --destination "$OUTPUT_DIR"

# 🧠 生成 changelog.json 与 changelog-diff.md
echo "🧠 生成 changelog 数据..."
bash "${SCRIPT_DIR:-$(dirname "$0")}"/gen-changelog.sh
bash "${SCRIPT_DIR:-$(dirname "$0")}"/update-changelog.sh "$VERSION"
bash "${SCRIPT_DIR:-$(dirname "$0")}"/compare-changelog.sh v1.2.0 "$VERSION" > "$CHANGELOG_MD"

# 🌐 推送 changelog 页面到 GitHub Pages 或 Wiki
echo "🌐 推送 changelog 页面..."
cp "${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/docs/changelog.html" /mnt/data/wiki/ || echo "⚠️ changelog.html 不存在，跳过复制"
cp "${PROJECT_ROOT:-$(dirname "$(dirname "$0")")}/docs/changelog-diff.html" /mnt/data/wiki/ || echo "⚠️ changelog-diff.html 不存在，跳过复制"
cp "$CHANGELOG_JSON" /mnt/data/wiki/ || echo "⚠️ changelog.json 不存在，跳过复制"
cp "$CHANGELOG_MD" /mnt/data/wiki/ || echo "⚠️ changelog-diff.md 不存在，跳过复制"

# 🐙 GitHub Release（需配置 GH_TOKEN）
if [ -n "$GH_TOKEN" ]; then
  echo "🐙 创建 GitHub Release..."
  gh release create "$VERSION" "$OUTPUT_DIR/email-services-$VERSION.tgz" --notes-file "$CHANGELOG_MD"
fi

# 🦊 GitLab Release（需配置 GITLAB_TOKEN 与 PROJECT_ID）
if [ -n "$GITLAB_TOKEN" ] && [ -n "$PROJECT_ID" ]; then
  echo "🦊 创建 GitLab Release..."
  curl --request POST \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    --form "name=$VERSION" \
    --form "tag_name=$VERSION" \
    --form "description=$(cat $CHANGELOG_MD)" \
    --form "file=@$OUTPUT_DIR/email-services-$VERSION.tgz" \
    "https://gitlab.com/api/v4/projects/$PROJECT_ID/releases"
fi

echo "✅ 发布完成：$VERSION"
