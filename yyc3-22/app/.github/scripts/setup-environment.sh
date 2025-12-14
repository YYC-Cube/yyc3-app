#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "echo '[INFO] 清理环境设置...'" EXIT INT TERM

# 环境变量设置函数
setup_environment() {
  local environment="${1:-development}"
  local project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
  
  echo "[INFO] 设置${environment}环境配置..."
  
  # 创建环境特定目录
  mkdir -p "${project_root}/config/${environment}"
  
  # 复制环境配置文件
  if [ -f "${project_root}/config/${environment}/.env" ]; then
    echo "[INFO] 使用现有的${environment}环境配置"
  else
    echo "[INFO] 创建默认的${environment}环境配置"
    touch "${project_root}/config/${environment}/.env"
  fi
  
  # 设置环境变量
  export NODE_ENV="${environment}"
  export PROJECT_ENV="${environment}"
  export LOG_LEVEL="info"
  
  # 根据环境设置不同的配置
  case "${environment}" in
    development)
      export DEBUG=true
      export API_ENDPOINT="http://localhost:3000/api"
      ;;
    staging)
      export DEBUG=false
      export API_ENDPOINT="https://staging.0379.email/api"
      ;;
    production)
      export DEBUG=false
      export API_ENDPOINT="https://0379.email/api"
      export NODE_ENV="production"
      ;;
  esac
  
  echo "[INFO] 环境配置设置完成: ${environment}"
  echo "[INFO] API端点: ${API_ENDPOINT}"
  
  # 返回配置信息
  echo "::set-output name=environment::${environment}"
  echo "::set-output name=api_endpoint::${API_ENDPOINT}"
  echo "::set-output name=node_env::${NODE_ENV}"
  
  return 0
}

# 健康检查函数
check_environment_health() {
  echo "[INFO] 执行环境健康检查..."
  
  # 检查Node.js版本
  if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js未安装"
    return 1
  fi
  
  local node_version=$(node -v)
  echo "[INFO] Node.js版本: ${node_version}"
  
  # 检查npm版本
  if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm未安装"
    return 1
  fi
  
  local npm_version=$(npm -v)
  echo "[INFO] npm版本: ${npm_version}"
  
  # 检查磁盘空间
  local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  echo "[INFO] 磁盘空间使用: ${disk_usage}%"
  
  if [ "${disk_usage}" -gt 90 ]; then
    echo "[WARNING] 磁盘空间紧张，可能影响构建"
  fi
  
  # 检查内存
  if command -v free &> /dev/null; then
    local memory_usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
    echo "[INFO] 内存使用: ${memory_usage}%"
    
    if [ "${memory_usage}" -gt 85 ]; then
      echo "[WARNING] 内存使用较高，可能影响性能"
    fi
  fi
  
  echo "[INFO] 环境健康检查完成"
  return 0
}

# 主函数
main() {
  local action="${1:-setup}"
  local environment="${2:-development}"
  
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] === 开始环境设置 ==="
  
  # 执行健康检查
  check_environment_health || {
    echo "[ERROR] 环境健康检查失败"
    return 1
  }
  
  # 执行环境设置
  if [ "${action}" = "setup" ]; then
    setup_environment "${environment}"
  fi
  
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] === 环境设置完成 ==="
  return 0
}

# 如果直接运行脚本，则执行主函数
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi