#!/bin/bash
# 🚀 Docker构建脚本
# @file build.sh
# @description 简化Docker镜像的构建和推送流程
# @author YYC
# @version 1.0.0
# @created 2024-10-15

# 严格模式
set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 镜像名称
IMAGE_NAME="email-platform-api"
IMAGE_TAG="latest"
DOCKER_HUB_USERNAME="yourusername"

# 显示帮助信息
show_help() {
  echo -e "${BLUE}邮件平台Docker构建脚本${NC}"
  echo -e "\n用法: ./build.sh [选项]\n"
  echo -e "选项:"
  echo -e "  -h, --help          显示帮助信息"
  echo -e "  -t, --tag <标签>    指定镜像标签 (默认: latest)"
  echo -e "  -p, --push          构建并推送到Docker Hub"
  echo -e "  -d, --dev           构建开发环境镜像"
  echo -e "  -u, --username <用户名>  Docker Hub用户名"
  echo -e "  -f, --force         强制重新构建，不使用缓存"
  echo -e "\n示例:"
  echo -e "  ./build.sh -t v1.0.0 -p -u yourusername  # 构建并推送v1.0.0标签的镜像"
  echo -e "  ./build.sh -d                          # 构建开发环境镜像"
}

# 解析参数
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -t|--tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -d|--dev)
      DEV=true
      shift
      ;;
    -u|--username)
      DOCKER_HUB_USERNAME="$2"
      shift 2
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    *)
      echo -e "${RED}未知选项: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# 初始化变量
PUSH=${PUSH:-false}
DEV=${DEV:-false}
FORCE=${FORCE:-false}

# 构建镜像
build_image() {
  local dockerfile="Dockerfile"
  local image_label="生产环境"
  
  if [ "$DEV" = true ]; then
    dockerfile="Dockerfile.dev"
    image_label="开发环境"
    IMAGE_TAG="dev-${IMAGE_TAG}"
  fi
  
  echo -e "\n${BLUE}🚀 开始构建${image_label}镜像: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
  echo -e "${YELLOW}使用Dockerfile: ${dockerfile}${NC}"
  
  local build_opts=""
  if [ "$FORCE" = true ]; then
    build_opts="--no-cache"
  fi
  
  cd "$PROJECT_ROOT/api"
  docker build \
    -t "$IMAGE_NAME:$IMAGE_TAG" \
    -f "$dockerfile" \
    $build_opts \
    .
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 镜像构建成功: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
  else
    echo -e "\n${RED}❌ 镜像构建失败${NC}"
    exit 1
  fi
}

# 推送镜像
push_image() {
  if [ "$PUSH" != true ]; then
    return
  fi
  
  echo -e "\n${BLUE}📤 准备推送镜像到Docker Hub...${NC}"
  
  # 检查Docker Hub用户名
  if [ -z "$DOCKER_HUB_USERNAME" ]; then
    echo -e "${RED}❌ 请提供Docker Hub用户名${NC}"
    exit 1
  fi
  
  # 标记镜像
  local full_image_name="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
  echo -e "${YELLOW}标记镜像: ${IMAGE_NAME}:${IMAGE_TAG} -> ${full_image_name}${NC}"
  docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${full_image_name}"
  
  # 推送镜像
  echo -e "\n${BLUE}⏱️  推送镜像中...${NC}"
  docker push "${full_image_name}"
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 镜像推送成功: ${full_image_name}${NC}"
    echo -e "${BLUE}📋 使用镜像命令:${NC}"
    echo -e "  docker pull ${full_image_name}"
  else
    echo -e "\n${RED}❌ 镜像推送失败${NC}"
    exit 1
  fi
}

# 主函数
main() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}    📧 邮件平台Docker构建工具    ${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  # 检查Docker是否安装
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装或未在PATH中${NC}"
    exit 1
  fi
  
  # 构建镜像
  build_image
  
  # 推送镜像
  push_image
  
  echo -e "\n${GREEN}✅ 构建过程完成${NC}"
}

# 执行主函数
main