#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

# compare-changelog.sh - 版本更新日志比较工具
# @description 用于比较不同版本间的更新日志变化
# @author YYC
# @version 1.0.0
# @created 2024-11-07

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
NC="\033[0m" # No Color

# 配置参数 - 修复路径问题，确保正确引用文件
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
CHANGELOG_DIR="${PROJECT_ROOT}/docs"
CHANGELOG_FILE="${CHANGELOG_DIR}/changelog.md"
CHANGELOG_JSON="${CHANGELOG_DIR}/changelog.json"
VERSIONS_FILE="${CHANGELOG_DIR}/versions.json"
DIFF_OUTPUT="${CHANGELOG_DIR}/changelog-diff.md"
DIFF_HTML_OUTPUT="${CHANGELOG_DIR}/changelog-diff.html"
CSS_FILE="${CHANGELOG_DIR}/changelog.css"

# 显示帮助信息
show_help() {
  echo -e "${BLUE}📝 版本更新日志比较工具${NC}"
  echo -e "\n用法: $0 [选项] [版本1] [版本2]"
  echo -e "\n选项:"
  echo -e "  -h, --help            显示帮助信息"
  echo -e "  -l, --list            列出所有可用版本"
  echo -e "  -m, --markdown        生成Markdown格式的差异报告"
  echo -e "  -h, --html            生成HTML格式的差异报告"
  echo -e "  -v, --verbose         显示详细信息"
  echo -e "\n示例:"
  echo -e "  $0 v1.2.0 v1.3.0      比较v1.2.0和v1.3.0版本的变化"
  echo -e "  $0 -l                 列出所有可用版本"
  echo -e "  $0 -m v1.2.0 v1.3.0   生成Markdown格式的差异报告"
}

# 列出所有可用版本
list_versions() {
  if [ ! -f "$VERSIONS_FILE" ]; then
    echo -e "${RED}❌ 版本文件不存在: $VERSIONS_FILE${NC}"
    echo -e "${YELLOW}⚠️  尝试从changelog.md中提取版本信息...${NC}"
    
    if [ ! -f "$CHANGELOG_FILE" ]; then
      echo -e "${RED}❌ changelog.md不存在: $CHANGELOG_FILE${NC}"
      exit 1
    fi
    
    # 从changelog.md提取版本号
    versions=$(grep -E '^##\s+v?[0-9]+\.[0-9]+\.[0-9]+' "$CHANGELOG_FILE" | sed 's/^##\s*//' | sort -V -r)
    
    if [ -z "$versions" ]; then
      echo -e "${RED}❌ 无法从changelog.md中提取版本信息${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}✅ 可用版本列表:${NC}"
    echo -e "$versions"
    return 0
  fi
  
  # 从versions.json读取版本信息
  versions=$(jq -r '.versions[]' "$VERSIONS_FILE" | sort -V -r)
  
  echo -e "${GREEN}✅ 可用版本列表:${NC}"
  echo -e "$versions"
}

# 验证版本格式
validate_version() {
  local version=$1
  if [[ ! "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    echo -e "${RED}❌ 无效的版本格式: $version${NC}"
    echo -e "${YELLOW}⚠️  版本格式应为: v1.2.0 或 1.2.0${NC}"
    return 1
  fi
  return 0
}

# 确保版本以v开头
ensure_v_prefix() {
  local version=$1
  if [[ ! "$version" =~ ^v ]]; then
    echo "v$version"
  else
    echo "$version"
  fi
}

# 比较两个版本的更新日志
compare_versions() {
  local version1=$(ensure_v_prefix "$1")
  local version2=$(ensure_v_prefix "$2")
  local format="markdown"
  local verbose=false
  
  # 解析选项
  while [[ $# -gt 0 ]]; do
    case $1 in
      -m|--markdown)
        format="markdown"
        shift
        ;;
      -h|--html)
        format="html"
        shift
        ;;
      -v|--verbose)
        verbose=true
        shift
        ;;
      *)
        shift
        ;;
    esac
done
  
  # 验证版本
  validate_version "$version1" || exit 1
  validate_version "$version2" || exit 1
  
  echo -e "${BLUE}🔄 比较版本: $version1 → $version2${NC}"
  
  # 从changelog.md提取指定版本的内容
  extract_version_content() {
    local version=$1
    local start_line=$(grep -n "^##\s*$version" "$CHANGELOG_FILE" | cut -d':' -f1)
    
    if [ -z "$start_line" ]; then
      echo -e "${RED}❌ 未找到版本: $version${NC}"
      return 1
    fi
    
    # 查找下一个版本的起始行
    local next_line=$(grep -n "^##\s*v" "$CHANGELOG_FILE" | grep -A1 "^$start_line:" | tail -1 | cut -d':' -f1)
    
    if [ -z "$next_line" ]; then
      # 如果是最后一个版本，提取到文件末尾
      sed -n "$start_line,\$p" "$CHANGELOG_FILE"
    else
      # 提取两个版本之间的内容
      next_line=$((next_line - 1))
      sed -n "$start_line,$next_line p" "$CHANGELOG_FILE"
    fi
  }
  
  # 提取两个版本的内容
  local content1=$(extract_version_content "$version1")
  local content2=$(extract_version_content "$version2")
  
  if [ -z "$content1" ] || [ -z "$content2" ]; then
    echo -e "${RED}❌ 无法提取版本内容${NC}"
    exit 1
  fi
  
  # 创建临时文件
  local temp1=$(mktemp)
  local temp2=$(mktemp)
  
  echo "$content1" > "$temp1"
  echo "$content2" > "$temp2"
  
  # 生成差异报告
  if [ "$format" = "markdown" ]; then
    echo -e "${GREEN}📝 生成Markdown差异报告: $DIFF_OUTPUT${NC}"
    
    cat > "$DIFF_OUTPUT" << EOF
# 版本更新日志差异

## 比较: $version1 → $version2

### $version2 更新内容

$content2

### $version1 更新内容

$content1

### 直接比较

\`\`\`diff
$(diff -u "$temp1" "$temp2")
\`\`\`

*生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
EOF
    
    echo -e "${GREEN}✅ Markdown差异报告已生成: $DIFF_OUTPUT${NC}"
    
  elif [ "$format" = "html" ]; then
    echo -e "${GREEN}🌐 生成HTML差异报告: $DIFF_HTML_OUTPUT${NC}"
    
    # 确保CSS文件存在
    if [ ! -f "$CSS_FILE" ]; then
      echo -e "${YELLOW}⚠️ CSS文件不存在，创建默认样式...${NC}"
      cat > "$CSS_FILE" << EOF
/* 版本更新日志样式 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
}

h1, h2, h3 {
  color: #2c3e50;
}

.version-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.diff-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  overflow-x: auto;
}

pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.diff-add {
  color: #a6e22e;
}

.diff-remove {
  color: #f92672;
}

.diff-header {
  color: #66d9ef;
}

footer {
  text-align: center;
  margin-top: 40px;
  color: #7f8c8d;
  font-size: 14px;
}
EOF
    fi
    
    # 生成HTML报告
    cat > "$DIFF_HTML_OUTPUT" << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>版本更新日志差异 - $version1 → $version2</title>
  <link rel="stylesheet" href="changelog.css">
</head>
<body>
  <h1>版本更新日志差异</h1>
  
  <div class="version-section">
    <h2>比较: $version1 → $version2</h2>
  </div>
  
  <div class="version-section">
    <h2>$version2 更新内容</h2>
    <div>
      $(echo "$content2" | sed 's/\n/<br>/g' | sed 's/^##/\<h3\>\0\<\/h3\>/g' | sed 's/^###/\<h4\>\0\<\/h4\>/g' | sed 's/^\*/\<li\>\0\<\/li\>/g')
    </div>
  </div>
  
  <div class="version-section">
    <h2>$version1 更新内容</h2>
    <div>
      $(echo "$content1" | sed 's/\n/<br>/g' | sed 's/^##/\<h3\>\0\<\/h3\>/g' | sed 's/^###/\<h4\>\0\<\/h4\>/g' | sed 's/^\*/\<li\>\0\<\/li\>/g')
    </div>
  </div>
  
  <div class="diff-section">
    <h2>直接比较</h2>
    <pre>
      $(diff -u "$temp1" "$temp2" | sed 's/\+/\&lt;span class="diff-add"\&gt;\&amp;plus;\&lt;\/span\&gt;/g' | sed 's/-/\&lt;span class="diff-remove"\&gt;\&amp;minus;\&lt;\/span\&gt;/g' | sed 's/^@@/\&lt;span class="diff-header"\&gt;\&amp;at;\&amp;at;\&lt;\/span\&gt;/g')
    </pre>
  </div>
  
  <footer>
    <p>生成时间: $(date '+%Y-%m-%d %H:%M:%S')</p>
    <p>由 compare-changelog.sh 自动生成</p>
  </footer>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ HTML差异报告已生成: $DIFF_HTML_OUTPUT${NC}"
  fi
  
  # 清理临时文件
  rm -f "$temp1" "$temp2"
  
  if [ "$verbose" = true ]; then
    echo -e "\n${PURPLE}📊 比较统计:${NC}"
    echo -e "- 开始版本: $version1"
    echo -e "- 结束版本: $version2"
    echo -e "- 输出格式: $format"
    echo -e "- 输出文件: $([ $format = "markdown" ] && echo "$DIFF_OUTPUT" || echo "$DIFF_HTML_OUTPUT")"
  fi
  
  echo -e "\n${GREEN}✅ 版本比较完成！${NC} 🌹"
}

# 主函数
main() {
  # 检查必要的文件
  if [ ! -f "$CHANGELOG_FILE" ]; then
    echo -e "${RED}❌ changelog.md不存在: $CHANGELOG_FILE${NC}"
    echo -e "${YELLOW}⚠️  请确保changelog.md文件位于正确的位置${NC}"
    exit 1
  fi
  
  # 检查命令行参数
  if [ $# -eq 0 ]; then
    show_help
    exit 1
  fi
  
  # 处理选项
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -l|--list)
        list_versions
        exit 0
        ;;
      -m|--markdown)
        if [ $# -lt 3 ]; then
          echo -e "${RED}❌ 缺少版本参数${NC}"
          show_help
          exit 1
        fi
        compare_versions "$2" "$3" -m
        exit 0
        ;;
      -h|--html)
        if [ $# -lt 3 ]; then
          echo -e "${RED}❌ 缺少版本参数${NC}"
          show_help
          exit 1
        fi
        compare_versions "$2" "$3" -html
        exit 0
        ;;
      *)
        if [ $# -eq 2 ]; then
          compare_versions "$1" "$2"
          exit 0
        else
          echo -e "${RED}❌ 无效的参数组合${NC}"
          show_help
          exit 1
        fi
        ;;
    esac
    shift
  done
}

# 执行主函数
main "$@"
