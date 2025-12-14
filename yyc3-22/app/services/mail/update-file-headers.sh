#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 定义标准文件头模板
FILE_HEADER_TEMPLATE="/**
 * @file {filename}
 * @description {description}
 * @module {module}
 * @author YYC³ <admin@0379.email>
 * @version 1.0.0
 * @created 2024-10-26
 * @updated 2024-10-26
 */"

# 清理函数
cleanup() {
  echo "脚本执行完毕，正在清理..."
}

# 获取文件描述
get_file_description() {
  local file_path="$1"
  local file_name=$(basename "$file_path")
  
  case "$file_name" in
    "index.ts"|"index.js")
      echo "${file_path%/*} 模块主入口"
      ;;
    "layout.tsx"|"layout.jsx")
      echo "布局组件"
      ;;
    "page.tsx"|"page.jsx")
      echo "页面组件"
      ;;
    "*Routes.ts"|"*Routes.js")
      echo "路由配置"
      ;;
    "*Controller.ts"|"*Controller.js")
      echo "控制器"
      ;;
    "*Service.ts"|"*Service.js")
      echo "服务层"
      ;;
    "*Middleware.ts"|"*Middleware.js")
      echo "中间件"
      ;;
    "*Utils.ts"|"*Utils.js")
      echo "工具函数"
      ;;
    "*.types.ts"|"*.types.js"|"types.ts"|"types.js")
      echo "类型定义"
      ;;
    "*.config.ts"|"*.config.js"|"config.ts"|"config.js")
      echo "配置文件"
      ;;
    "*.test.ts"|"*.test.js"|"*.spec.ts"|"*.spec.js")
      echo "测试文件"
      ;;
    *)
      echo "${file_path} 文件"
      ;;
  esac
}

# 获取模块名
get_module_name() {
  local file_path="$1"
  local module_name=$(echo "$file_path" | sed -E 's/^\.\///; s/\.(tsx?|jsx?)$//; s/\//./g')
  echo "$module_name"
}

# 更新单个文件的文件头
update_file_header() {
  local file_path="$1"
  local file_name=$(basename "$file_path")
  local description=$(get_file_description "$file_path")
  local module=$(get_module_name "$file_path")
  
  # 创建临时文件
  local temp_file=$(mktemp)
  
  # 替换模板中的占位符
  local file_header="$FILE_HEADER_TEMPLATE"
  file_header=${file_header//{filename}/"$file_name"}
  file_header=${file_header//{description}/"$description"}
  file_header=${file_header//{module}/"$module"}
  
  # 检查文件是否已有文件头
  if grep -q "@file" "$file_path";
  then
    # 更新现有文件头 - 使用awk
    awk -v header="$file_header" '{
      if (/^\/\*\*/ && !in_header) {
        in_header = 1
        print header
        while (getline && !/^\*\//) {}
      } else if (!in_header) {
        print
      }
    }' "$file_path" > "$temp_file"
  else
    # 添加新文件头
    echo "$file_header" > "$temp_file"
    cat "$file_path" >> "$temp_file"
  fi
  
  # 更新文件中的项目名称
  sed -i '' 's/0379邮件平台/YYC³邮件平台/g' "$temp_file"
  
  # 替换原文件
  mv "$temp_file" "$file_path"
  
  echo "已更新文件头: $file_path"
}

# 主函数
main() {
  echo "开始更新文件头注释..."
  
  # 查找所有代码文件
  local files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./next/*" \
    -not -path "./.git/*"
  )
  
  local file_count=$(echo "$files" | wc -l | tr -d ' ')
  echo "找到 $file_count 个文件需要更新"
  
  # 遍历并更新每个文件
  local processed_count=0
  for file in $files;
  do
    update_file_header "$file"
    processed_count=$((processed_count + 1))
    
    # 显示进度
    if [ $((processed_count % 10)) -eq 0 ];
    then
      echo "已处理 $processed_count/$file_count 个文件"
    fi
  done
  
  echo "文件头更新完成，共处理 $processed_count 个文件"
}

# 执行主函数
main
