#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# start.sh - 全局启动脚本
# @description 项目统一启动入口，提供所有功能模块的标准化访问
# @author YYC
# @version 1.0.0
# @created 2024-11-07

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
LOG_DIR="${PROJECT_ROOT}/logs"
CONFIG_DIR="${PROJECT_ROOT}/config"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log_info() {
  echo -e "${GREEN}ℹ️  [INFO] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "${LOG_DIR}/start.log"
}

log_error() {
  echo -e "${RED}❌ [ERROR] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/error.log"
}

log_warn() {
  echo -e "${YELLOW}⚠️  [WARN] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "${LOG_DIR}/warn.log"
}

log_success() {
  echo -e "${GREEN}✅ [SUCCESS] $1${NC}"
}

# 显示主菜单
show_main_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🚀 0379.email 项目管理中心${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔧 初始化管理${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🌐 SSH配置管理${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🚀 部署管理${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}☁️  云服务器部署${NC} (yyc3-121)"
  echo -e "  ${GREEN}5.${NC} ${BLUE}💾 NAS同步管理${NC} (yyc3-45)"
  echo -e "  ${GREEN}6.${NC} ${BLUE}📄 文档管理${NC}"
  echo -e "  ${GREEN}7.${NC} ${BLUE}🔍 环境检查${NC}"
  echo -e "  ${GREEN}8.${NC} ${BLUE}⚙️  工具集${NC}"
  echo -e "  ${GREEN}9.${NC} ${BLUE}📊 项目状态${NC}"
  echo -e "  ${GREEN}a.${NC} ${BLUE}📦 发布管理${NC}"
  echo -e "  ${GREEN}b.${NC} ${BLUE}🔄 配置同步${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}📤 退出${NC}\n"
  echo -e "${CYAN}========================================${NC}\n"
}

# 初始化管理菜单
show_init_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🔧 初始化管理${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔧 项目初始化 (init.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🗝️  生成SSH密钥 (generate-keys-macos.sh/generate-keys-windows.ps1)${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🖥️  ECS服务器初始化 (ecs-init.sh)${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}📁 NAS服务器设置 (nas-setup.sh)${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-4]: " choice
  case "$choice" in
    1)
      log_info "执行项目初始化..."
      "${SCRIPT_DIR}/init.sh"
      ;;
    2)
      log_info "生成SSH密钥..."
      if [[ "$(uname)" == "Darwin" ]]; then
        "${SCRIPT_DIR}/generate-keys-macos.sh"
      elif [[ "$(uname)" == "MINGW"* || "$(uname)" == "CYGWIN"* ]]; then
        powershell -File "${SCRIPT_DIR}/generate-keys-windows.ps1"
      else
        log_warn "当前系统不支持自动选择密钥生成脚本，请手动选择"
        "${SCRIPT_DIR}/generate-keys-macos.sh"
      fi
      ;;
    3)
      log_info "ECS服务器初始化..."
      "${SCRIPT_DIR}/ecs-init.sh"
      ;;
    4)
      log_info "NAS服务器设置..."
      "${SCRIPT_DIR}/nas-setup.sh"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_init_menu
}

# SSH配置管理菜单
show_ssh_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🌐 SSH配置管理${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔧 设置SSH密钥 (setup-ssh-keys.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}📋 查看SSH配置示例${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🚀 推送SSH密钥到远程服务器${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-3]: " choice
  case "$choice" in
    1)
      log_info "设置SSH密钥..."
      "${SCRIPT_DIR}/setup-ssh-keys.sh"
      ;;
    2)
      log_info "查看SSH配置示例..."
      cat "${SCRIPT_DIR}/ssh_config_example"
      ;;
    3)
      log_info "推送SSH密钥到远程服务器..."
      "${SCRIPT_DIR}/ssh_push_key.sh"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_ssh_menu
}

# 部署管理菜单
show_deploy_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🚀 部署管理${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}📦 本地构建项目${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🚀 部署到开发环境${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🚀 部署到测试环境${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}🚀 部署到生产环境${NC}"
  echo -e "  ${GREEN}5.${NC} ${BLUE}↩️  回滚部署${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-5]: " choice
  case "$choice" in
    1)
      log_info "开始本地构建项目..."
      npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  构建命令执行失败${NC}"
      ;;
    2)
      log_info "部署到开发环境..."
      ./scripts/deploy-dev.sh 2>/dev/null || echo -e "${YELLOW}⚠️  部署脚本不存在${NC}"
      ;;
    3)
      log_info "部署到测试环境..."
      ./scripts/deploy-test.sh 2>/dev/null || echo -e "${YELLOW}⚠️  部署脚本不存在${NC}"
      ;;
    4)
      log_info "部署到生产环境..."
      ./scripts/deploy-prod.sh 2>/dev/null || echo -e "${YELLOW}⚠️  部署脚本不存在${NC}"
      ;;
    5)
      log_info "执行部署回滚..."
      ./scripts/rollback.sh 2>/dev/null || echo -e "${YELLOW}⚠️  回滚脚本不存在${NC}"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_deploy_menu
}

# 云服务器部署菜单
show_cloud_deploy_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}☁️  云服务器部署 (yyc3-121)${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🚀 部署到云服务器${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🔍 检查云服务器状态${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}📋 查看云服务器日志${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}🔌 连接到云服务器${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-4]: " choice
  case "$choice" in
    1)
      log_info "开始部署到云服务器..."
      ./scripts/deploy-to-cloud.sh
      ;;
    2)
      log_info "检查云服务器状态..."
      ssh -i ~/.ssh/id_rsa_aliyun yanyu@yyc3-121 'uptime && free -h && df -h'
      ;;
    3)
      log_info "查看云服务器应用日志..."
      ssh -i ~/.ssh/id_rsa_aliyun yanyu@yyc3-121 'cd /home/yanyu/ww/app && tail -n 50 logs/app.log'
      ;;
    4)
      log_info "连接到云服务器..."
      ssh -i ~/.ssh/id_rsa_aliyun yanyu@yyc3-121
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_cloud_deploy_menu
}

# NAS同步管理菜单
show_nas_sync_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}💾 NAS同步管理 (yyc3-45)${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}📤 同步数据到NAS${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}📦 备份到NAS${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🔍 检查NAS连接${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}🔌 连接到NAS${NC}"
  echo -e "  ${GREEN}5.${NC} ${BLUE}📋 查看NAS同步日志${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-5]: " choice
  case "$choice" in
    1)
      log_info "开始同步数据到NAS..."
      ./scripts/sync-to-nas.sh
      ;;
    2)
      log_info "开始备份到NAS..."
      ./scripts/backup-to-nas.sh
      ;;
    3)
      log_info "检查NAS连接..."
      ssh -i ~/.ssh/id_rsa_local -p 57 YYC@yyc3-45 'uptime'
      ;;
    4)
      log_info "连接到NAS..."
      ssh -i ~/.ssh/id_rsa_local -p 57 YYC@yyc3-45
      ;;
    5)
      log_info "查看NAS同步日志..."
      cat logs/sync-nas.log 2>/dev/null || echo -e "${YELLOW}⚠️  日志文件不存在${NC}"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_nas_sync_menu
}

# 发布管理菜单
show_release_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}📦 发布管理${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🚀 版本发布 (release.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}📝 生成更新日志 (gen-changelog.sh)${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}📊 比较更新日志 (compare-changelog.sh)${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}📄 生成更新日志差异 (gen-changelog-diff.sh)${NC}"
  echo -e "  ${GREEN}5.${NC} ${BLUE}🔄 更新更新日志 (update-changelog.sh)${NC}"
  echo -e "  ${GREEN}6.${NC} ${BLUE}🔖 版本号升级 (version-bump.sh)${NC}"
  echo -e "  ${GREEN}7.${NC} ${BLUE}🐙 GitLab发布 (gitlab-release.sh)${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-7]: " choice
  case "$choice" in
    1)
      log_info "版本发布..."
      "${SCRIPT_DIR}/release.sh"
      ;;
    2)
      log_info "生成更新日志..."
      "${SCRIPT_DIR}/gen-changelog.sh"
      ;;
    3)
      log_info "比较更新日志..."
      "${SCRIPT_DIR}/compare-changelog.sh"
      ;;
    4)
      log_info "生成更新日志差异..."
      "${SCRIPT_DIR}/gen-changelog-diff.sh"
      ;;
    5)
      log_info "更新更新日志..."
      "${SCRIPT_DIR}/update-changelog.sh"
      ;;
    6)
      log_info "版本号升级..."
      "${SCRIPT_DIR}/version-bump.sh"
      ;;
    7)
      log_info "GitLab发布..."
      "${SCRIPT_DIR}/gitlab-release.sh"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_release_menu
}

# 文档管理菜单
show_docs_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}📄 文档管理${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}📚 查看多机协同文档${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🔍 搜索文档${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}📋 查看SSH配置示例${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-3]: " choice
  case "$choice" in
    1)
      log_info "查看多机协同文档..."
      cat "${SCRIPT_DIR}/multi-machine-coordination.md"
      ;;
    2)
      read -p "请输入搜索关键词: " keyword
      log_info "搜索文档..."
      grep -r "$keyword" "${SCRIPT_DIR}" --include="*.md" --include="*.txt"
      ;;
    3)
      log_info "查看SSH配置示例..."
      cat "${SCRIPT_DIR}/ssh_config_example"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_docs_menu
}

# 环境检查菜单
show_env_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🔍 环境检查${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔧 运行环境检查脚本 (check-env.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}📊 系统资源检查${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🌐 网络连接检查${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-3]: " choice
  case "$choice" in
    1)
      log_info "运行环境检查脚本..."
      "${SCRIPT_DIR}/check-env.sh"
      ;;
    2)
      log_info "系统资源检查..."
      echo -e "${BLUE}\n=== CPU 信息 ===${NC}"
      top -l 1 | head -10
      echo -e "${BLUE}\n=== 内存信息 ===${NC}"
      vm_stat
      echo -e "${BLUE}\n=== 磁盘信息 ===${NC}"
      df -h
      ;;
    3)
      log_info "网络连接检查..."
      echo -e "${BLUE}\n=== 网络连接状态 ===${NC}"
      netstat -an | grep ESTABLISHED | wc -l
      echo -e "${BLUE}\n=== DNS 配置 ===${NC}"
      cat /etc/resolv.conf
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_env_menu
}

# 工具集菜单
show_utils_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}⚙️  工具集${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔄 配置同步 (sync-config.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🔍 比较更新日志 (compare-changelog.sh)${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}📝 版本号升级 (version-bump.sh)${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-3]: " choice
  case "$choice" in
    1)
      log_info "配置同步..."
      "${SCRIPT_DIR}/sync-config.sh"
      ;;
    2)
      log_info "比较更新日志..."
      "${SCRIPT_DIR}/compare-changelog.sh"
      ;;
    3)
      log_info "版本号升级..."
      "${SCRIPT_DIR}/version-bump.sh"
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_utils_menu
}

# 项目状态菜单
show_status_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}📊 项目状态${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}📁 项目目录结构${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}🐙 Git 状态${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}📋 已安装依赖列表${NC}"
  echo -e "  ${GREEN}4.${NC} ${BLUE}📝 最新更新日志${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-4]: " choice
  case "$choice" in
    1)
      log_info "项目目录结构..."
      find "$PROJECT_ROOT" -maxdepth 2 -type d | sort
      ;;
    2)
      log_info "Git 状态..."
      cd "$PROJECT_ROOT" && git status
      ;;
    3)
      log_info "已安装依赖列表..."
      if [ -f "${PROJECT_ROOT}/package.json" ]; then
        cat "${PROJECT_ROOT}/package.json" | grep -A 15 "dependencies"
      else
        log_warn "未找到 package.json"
      fi
      ;;
    4)
      log_info "最新更新日志..."
      if [ -f "${PROJECT_ROOT}/docs/changelog.md" ]; then
        head -n 50 "${PROJECT_ROOT}/docs/changelog.md"
      else
        log_warn "未找到 changelog.md"
      fi
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_status_menu
}

# 配置同步菜单
show_sync_menu() {
  clear
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${BLUE}🔄 配置同步${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "  ${GREEN}1.${NC} ${BLUE}🔄 运行配置同步脚本 (sync-config.sh)${NC}"
  echo -e "  ${GREEN}2.${NC} ${BLUE}📋 显示同步配置信息${NC}"
  echo -e "  ${GREEN}3.${NC} ${BLUE}🔍 验证配置文件完整性${NC}"
  echo -e "  ${GREEN}0.${NC} ${RED}↩️  返回主菜单${NC}\n"
  
  read -p "请选择操作 [0-3]: " choice
  case "$choice" in
    1)
      log_info "运行配置同步脚本..."
      "${SCRIPT_DIR}/sync-config.sh"
      ;;
    2)
      log_info "显示同步配置信息..."
      echo -e "${BLUE}\n=== 同步配置信息 ===${NC}"
      echo -e "项目根目录: ${PROJECT_ROOT}"
      echo -e "配置目录: ${CONFIG_DIR}"
      if [ -f "${CONFIG_DIR}/sync-config.json" ]; then
        cat "${CONFIG_DIR}/sync-config.json"
      else
        log_warn "未找到同步配置文件"
      fi
      ;;
    3)
      log_info "验证配置文件完整性..."
      if [ -d "$CONFIG_DIR" ]; then
        echo -e "${BLUE}\n=== 配置文件列表 ===${NC}"
        find "$CONFIG_DIR" -type f | sort
      else
        log_warn "配置目录不存在"
      fi
      ;;
    0)
      return
      ;;
    *)
      log_error "无效的选择"
      ;;
  esac
  
  read -p "按回车键继续..."
  show_sync_menu
}

# 主函数
main() {
  log_info "启动项目全局管理中心"
  
  while true; do
    show_main_menu
    read -p "请选择功能模块 [0-9]: " choice
    
    case "$choice" in
      1)
        show_init_menu
        ;;
      2)
        show_ssh_menu
        ;;
      3)
        show_deploy_menu
        ;;
      4)
        show_cloud_deploy_menu
        ;;
      5)
        show_nas_sync_menu
        ;;
      6)
        show_docs_menu
        ;;
      7)
        show_env_menu
        ;;
      8)
        show_utils_menu
        ;;
      9)
        show_status_menu
        ;;
      a|A)
        show_release_menu
        ;;
      b|B)
        show_sync_menu
        ;;
      0)
        log_success "退出项目全局管理中心"
        exit 0
        ;;
      *)
        log_error "无效的选择，请重新输入"
        read -p "按回车键继续..."
        ;;
    esac
  done
}

# 执行主函数
main "$@"
