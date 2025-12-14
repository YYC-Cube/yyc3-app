#!/bin/bash
# === 健康探针脚本 ===
# 用法：ping.sh <service_name> <port>
# 示例：ping.sh api 3000

set -euo pipefail
trap 'echo "[ERROR] 健康探针执行失败" >&2' ERR

SERVICE_NAME="${1:-}"
PORT="${2:-}"

if [[ -z "${SERVICE_NAME}" || -z "${PORT}" ]]; then
  echo "用法：$0 <service_name> <port>" >&2
  exit 1
fi

LOG_DIR="/Users/yanyu/0379.email/var/log"
LOG_FILE="${LOG_DIR}/${SERVICE_NAME}-health.log"
mkdir -p "${LOG_DIR}"

TIMESTAMP="$(date +'%Y-%m-%d %H:%M:%S')"
URL="http://127.0.0.1:${PORT}/api/healthcheck"

STATUS_CODE=$(curl -s -o /tmp/health-${SERVICE_NAME}.out -w '%{http_code}' "${URL}" || true)
RESPONSE=$(cat /tmp/health-${SERVICE_NAME}.out || echo "")

if [[ "${STATUS_CODE}" == "200" ]]; then
  echo "${TIMESTAMP} ${SERVICE_NAME} OK ${STATUS_CODE} ${URL} ${RESPONSE}" >> "${LOG_FILE}"
else
  echo "${TIMESTAMP} ${SERVICE_NAME} FAIL ${STATUS_CODE} ${URL} ${RESPONSE}" >> "${LOG_FILE}"
fi
