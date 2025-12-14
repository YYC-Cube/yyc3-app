#!/usr/bin/env bash
# === 脚本健康检查头 ===
set -euo pipefail
trap 'echo "清理完成"' EXIT

# 用法：
#   ./init-folders.sh [目标根路径]
# 默认根路径为 /ww/app（可传入 ./ 用于在当前仓库下初始化结构）

ROOT_DIR="${1:-/ww/app}"

echo "🚀 初始化多服务平台目录到: ${ROOT_DIR}"

mkdir -p "${ROOT_DIR}"

# 服务目录
for svc in api admin llm mail; do
  mkdir -p "${ROOT_DIR}/${svc}"
  touch "${ROOT_DIR}/${svc}/server.js"
  touch "${ROOT_DIR}/${svc}/.env"
  touch "${ROOT_DIR}/${svc}/package.json"
  echo "✅ 初始化 ${svc}/server.js .env package.json"
done

# Helm 结构
mkdir -p "${ROOT_DIR}/helm/templates"
cat > "${ROOT_DIR}/helm/Chart.yaml" <<'YAML'
apiVersion: v2
name: email-services
version: 1.0.0
YAML
cat > "${ROOT_DIR}/helm/values.yaml" <<'YAML'
replicaCount: 1
image:
  repository: email-services
YAML

echo "✅ 初始化 Helm Chart 模板"

# 自动化脚本目录
mkdir -p "${ROOT_DIR}/scripts"
for f in init.sh push-helm.sh release.sh gen-changelog.sh compare-changelog.sh gitlab-release.sh; do
  touch "${ROOT_DIR}/scripts/${f}"
  chmod +x "${ROOT_DIR}/scripts/${f}" || true
done
echo "✅ 初始化脚本目录 scripts/"

# 文档目录与 changelog 页面
mkdir -p "${ROOT_DIR}/docs"
for f in changelog.html changelog-diff.html changelog.json changelog.css releases.md index.html; do
  touch "${ROOT_DIR}/docs/${f}"
done
echo "✅ 初始化 docs/ 文档与 changelog 页面"

# Wiki 页面结构
mkdir -p "${ROOT_DIR}/wiki/Services" "${ROOT_DIR}/wiki/Deployment" "${ROOT_DIR}/wiki/Docs" "${ROOT_DIR}/wiki/Security"
for f in Home.md Releases.md; do
  touch "${ROOT_DIR}/wiki/${f}"
done
for f in api-server.md admin-server.md llm-server.md mail-server.md; do
  touch "${ROOT_DIR}/wiki/Services/${f}"
done
for f in PM2.md Docker.md Helm.md CI-CD.md; do
  touch "${ROOT_DIR}/wiki/Deployment/${f}"
done
for f in Swagger.md Postman.md; do
  touch "${ROOT_DIR}/wiki/Docs/${f}"
done
for f in TLS.md Healthcheck.md; do
  touch "${ROOT_DIR}/wiki/Security/${f}"
done
echo "✅ 初始化 wiki/ 页面结构"

echo "🎉 完成目录初始化。可根据需要在 ${ROOT_DIR} 中补充内容。"