#!/bin/bash
CHART_NAME="email-services"
CHART_VERSION="1.0.0"
CHART_FILE="${CHART_NAME}-${CHART_VERSION}.tgz"
REMOTE_REPO_URL="https://your-helm-repo.example.com"

# 上传 Chart 文件
curl --data-binary "@${CHART_FILE}" ${REMOTE_REPO_URL}/${CHART_FILE}

# 更新 index.yaml（GitHub Pages 模式）
helm repo index . --url ${REMOTE_REPO_URL}

# OCI 模式（可选）
# helm push ${CHART_FILE} oci://your-oci-repo.example.com
