#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 代码标准化检查脚本 v1.1.0
# 检查代码格式、命名规范、文件结构和代码质量

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认值
PROJECT_ROOT=""
APP_ROOT=""
OUTPUT_FORMAT="text"
FIX_ISSUES=false
VERBOSE=false
IGNORE_FILES=()
MAX_FILE_SIZE=1000000  # 1MB
MAX_LINE_LENGTH=100
CHECK_LIST=("format" "naming" "structure" "quality")

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local level_color=$NC
    
    case $level in
        "INFO") level_color=$BLUE ;;
        "SUCCESS") level_color=$GREEN ;;
        "WARNING") level_color=$YELLOW ;;
        "ERROR") level_color=$RED ;;
        "DEBUG") 
            if [ "$VERBOSE" = true ]; then
                level_color=$PURPLE
                echo -e "${timestamp} [${level_color}${level}${NC}] ${message}"
            fi
            return 0
            ;;
    esac
    
    echo -e "${timestamp} [${level_color}${level}${NC}] ${message}"
}

# 清理函数
cleanup() {
    log "INFO" "执行清理操作..."
    # 清理临时文件等
    log "INFO" "清理完成"
}

# 显示帮助信息
show_help() {
    echo -e "\n${YELLOW}使用方法:${NC} $0 [选项]"
    echo -e "\n${GREEN}选项:${NC}"
    echo -e "  -p, --project-root <路径>   指定项目根目录"
    echo -e "  -f, --format <格式>         输出格式 (text, json)"
    echo -e "  --fix                       自动修复问题（尽可能）"
    echo -e "  --verbose                   显示详细输出"
    echo -e "  --ignore-file <文件>        忽略特定文件（可多次使用）"
    echo -e "  --checks <检查项>           指定要执行的检查 (format,naming,structure,quality)"
    echo -e "  -h, --help                  显示帮助信息"
    echo -e "\n${GREEN}示例:${NC}"
    echo -e "  执行所有检查: $0"
    echo -e "  只检查格式和命名: $0 --checks format,naming"
    echo -e "  自动修复问题: $0 --fix"
    echo -e "  输出JSON格式: $0 --format json"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--project-root)
            PROJECT_ROOT="$2"
            shift 2
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --fix)
            FIX_ISSUES=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --ignore-file)
            IGNORE_FILES+=("$2")
            shift 2
            ;;
        --checks)
            IFS=',' read -ra CHECK_LIST <<< "$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log "ERROR" "未知选项 $1"
            show_help
            exit 1
            ;;
    esac
done

# 初始化项目根目录
init_project_root() {
    if [ -z "$PROJECT_ROOT" ]; then
        # 尝试从脚本路径推断项目根目录
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
    fi
    
    if [ ! -d "$PROJECT_ROOT" ]; then
        log "ERROR" "项目根目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    APP_ROOT="$PROJECT_ROOT/app"
    
    log "INFO" "项目根目录: $PROJECT_ROOT"
    log "INFO" "应用根目录: $APP_ROOT"
}

# 检查是否忽略文件
should_ignore_file() {
    local file=$1
    
    # 检查是否在忽略列表中
    for ignored in "${IGNORE_FILES[@]}"; do
        if [[ "$file" == *"$ignored"* ]]; then
            log "DEBUG" "忽略文件: $file"
            return 0
        fi
    done
    
    # 默认忽略的文件模式
    local default_ignores=( 
        "node_modules" 
        ".git" 
        ".github" 
        ".trae" 
        "dist" 
        "build" 
        "coverage" 
        ".next" 
        "*.log" 
        "*.tmp" 
        "*.temp" 
        "*.min.js" 
        "*.min.css"
    )
    
    for ignore in "${default_ignores[@]}"; do
        if [[ "$file" == *"$ignore"* ]]; then
            log "DEBUG" "忽略文件: $file"
            return 0
        fi
    done
    
    return 1
}

# 检查文件大小
check_file_size() {
    local file=$1
    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
    
    if [ "$size" -gt "$MAX_FILE_SIZE" ]; then
        log "WARNING" "文件过大: $file ($size 字节)"
        return 1
    fi
    
    return 0
}

# 检查代码格式
check_format() {
    log "INFO" "开始检查代码格式..."
    local issues_found=0
    
    # 检查 ESLint 配置
    if [ ! -f "$APP_ROOT/.eslintrc.js" ] && [ ! -f "$APP_ROOT/.eslintrc.json" ]; then
        log "WARNING" "未找到 ESLint 配置文件，跳过 ESLint 检查"
    else
        log "INFO" "运行 ESLint 检查..."
        cd "$APP_ROOT"
        if [ "$FIX_ISSUES" = true ]; then
            npx eslint . --fix --ext .js,.jsx,.ts,.tsx || issues_found=$?
        else
            npx eslint . --ext .js,.jsx,.ts,.tsx || issues_found=$?
        fi
    fi
    
    # 检查 Prettier 配置
    if [ ! -f "$APP_ROOT/.prettierrc" ] && [ ! -f "$APP_ROOT/.prettierrc.js" ] && [ ! -f "$APP_ROOT/.prettierrc.json" ]; then
        log "WARNING" "未找到 Prettier 配置文件，跳过 Prettier 检查"
    else
        log "INFO" "运行 Prettier 检查..."
        cd "$APP_ROOT"
        if [ "$FIX_ISSUES" = true ]; then
            npx prettier --write "**/*.{js,jsx,ts,tsx,json,md,yml}" || true
        else
            npx prettier --check "**/*.{js,jsx,ts,tsx,json,md,yml}" || issues_found=$?
        fi
    fi
    
    # 检查行长度
    log "INFO" "检查文件行长度..."
    find "$APP_ROOT" -type f -name "*.{js,jsx,ts,tsx}" -exec grep -l ".\{$((MAX_LINE_LENGTH + 1)),\}" {} \; | while read -r file; do
        if ! should_ignore_file "$file"; then
            log "ERROR" "文件行长度超过限制 ($MAX_LINE_LENGTH): $file"
            issues_found=$((issues_found + 1))
        fi
    done
    
    # 检查文件结尾的换行符
    log "INFO" "检查文件结尾换行符..."
    find "$APP_ROOT" -type f -name "*.{js,jsx,ts,tsx}" -exec sh -c 'test "$(tail -c 1 "$1")" && echo "$1"' _ {} \; | while read -r file; do
        if ! should_ignore_file "$file"; then
            log "ERROR" "文件末尾缺少换行符: $file"
            issues_found=$((issues_found + 1))
            if [ "$FIX_ISSUES" = true ]; then
                echo >> "$file"
                log "INFO" "已修复文件末尾换行符: $file"
            fi
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "代码格式检查通过"
        return 0
    else
        log "ERROR" "代码格式检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查命名规范
check_naming() {
    log "INFO" "开始检查命名规范..."
    local issues_found=0
    
    # 检查文件命名
    log "INFO" "检查文件命名..."
    find "$APP_ROOT" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
        if ! should_ignore_file "$file"; then
            filename=$(basename "$file")
            
            # 组件文件应该使用 PascalCase
            if [[ "$file" == *"components"* ]] || [[ "$file" == *"pages"* ]] || [[ "$file" == *"app"* ]]; then
                if ! [[ "$filename" =~ ^[A-Z][a-zA-Z0-9]*\.(js|jsx|ts|tsx)$ ]]; then
                    log "ERROR" "组件文件命名应使用 PascalCase: $file"
                    issues_found=$((issues_found + 1))
                fi
            # 其他文件应该使用 camelCase 或 kebab-case
            else
                if ! [[ "$filename" =~ ^[a-z][a-zA-Z0-9]*\.(js|jsx|ts|tsx)$ ]] && ! [[ "$filename" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(js|jsx|ts|tsx)$ ]]; then
                    log "WARNING" "文件命名建议使用 camelCase 或 kebab-case: $file"
                fi
            fi
        fi
    done
    
    # 检查类名 (PascalCase)
    log "INFO" "检查类名..."
    grep -r "class [a-zA-Z0-9_]*" "$APP_ROOT" --include="*.{js,jsx,ts,tsx}" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        class_name=$(echo "$line" | grep -o "class [a-zA-Z0-9_]*" | cut -d' ' -f2)
        
        if ! should_ignore_file "$file"; then
            if ! [[ "$class_name" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
                log "ERROR" "类名应使用 PascalCase: $class_name ($file)"
                issues_found=$((issues_found + 1))
            fi
        fi
    done
    
    # 检查函数/变量名 (camelCase)
    log "INFO" "检查函数和变量命名..."
    grep -r "function [a-zA-Z0-9_]*" "$APP_ROOT" --include="*.{js,jsx,ts,tsx}" | grep -v "class" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        func_name=$(echo "$line" | grep -o "function [a-zA-Z0-9_]*" | cut -d' ' -f2)
        
        if ! should_ignore_file "$file"; then
            if ! [[ "$func_name" =~ ^[a-z][a-zA-Z0-9]*$ ]]; then
                log "WARNING" "函数名建议使用 camelCase: $func_name ($file)"
            fi
        fi
    done
    
    # 检查常量命名 (UPPER_SNAKE_CASE)
    log "INFO" "检查常量命名..."
    grep -r "const [A-Z_0-9]*[[:space:]]*=[^=]" "$APP_ROOT" --include="*.{js,jsx,ts,tsx}" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        const_name=$(echo "$line" | grep -o "const [A-Z_0-9]*" | cut -d' ' -f2)
        
        if ! should_ignore_file "$file"; then
            # 跳过 let 和 var 声明
            if [[ "$line" == *"let"* ]] || [[ "$line" == *"var"* ]]; then
                continue
            fi
            
            if ! [[ "$const_name" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
                log "WARNING" "常量名建议使用 UPPER_SNAKE_CASE: $const_name ($file)"
            fi
        fi
    done
    
    # 检查接口命名 (I + PascalCase)
    log "INFO" "检查接口命名..."
    grep -r "interface [a-zA-Z0-9_]*" "$APP_ROOT" --include="*.ts" --include="*.tsx" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        interface_name=$(echo "$line" | grep -o "interface [a-zA-Z0-9_]*" | cut -d' ' -f2)
        
        if ! should_ignore_file "$file"; then
            if ! [[ "$interface_name" =~ ^I[A-Z][a-zA-Z0-9]*$ ]]; then
                log "WARNING" "接口名建议使用 I + PascalCase: $interface_name ($file)"
            fi
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "命名规范检查通过"
        return 0
    else
        log "ERROR" "命名规范检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查文件结构
check_structure() {
    log "INFO" "开始检查文件结构..."
    local issues_found=0
    
    # 检查必要的目录
    local required_dirs=( 
        "src" 
        "src/components" 
        "src/pages" 
        "src/styles" 
        "src/utils" 
        "src/types" 
        "public" 
        "tests" 
        ".github" 
        ".github/workflows" 
        "scripts"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$APP_ROOT/$dir" ]; then
            log "ERROR" "缺少必要目录: $APP_ROOT/$dir"
            issues_found=$((issues_found + 1))
        fi
    done
    
    # 检查必要的配置文件
    local required_files=( 
        "package.json" 
        "tsconfig.json" 
        ".gitignore" 
        ".eslintrc.js" 
        ".prettierrc"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$APP_ROOT/$file" ]; then
            log "WARNING" "缺少推荐配置文件: $APP_ROOT/$file"
        fi
    done
    
    # 检查 README.md
    if [ ! -f "$APP_ROOT/README.md" ]; then
        log "ERROR" "缺少 README.md 文件: $APP_ROOT/README.md"
        issues_found=$((issues_found + 1))
    else
        # 检查 README.md 内容
        if ! grep -q "项目说明\|功能特性\|安装说明\|使用方法" "$APP_ROOT/README.md"; then
            log "WARNING" "README.md 缺少推荐内容"
        fi
    fi
    
    # 检查 LICENSE 文件
    if [ ! -f "$APP_ROOT/LICENSE" ] && [ ! -f "$APP_ROOT/LICENSE.md" ]; then
        log "WARNING" "缺少 LICENSE 文件"
    fi
    
    # 检查测试文件
    log "INFO" "检查测试文件..."
    local test_issues=0
    find "$APP_ROOT/src" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -not -name "index.*" | while read -r file; do
        if ! should_ignore_file "$file"; then
            # 提取文件名，替换路径分隔符为下划线，添加 test 后缀
            base_name=$(basename "$file")
            name_without_ext="${base_name%.*}"
            expected_test_file="$APP_ROOT/tests/${name_without_ext}.test.js"
            
            if [ ! -f "$expected_test_file" ] && [ ! -f "${expected_test_file%.js}.ts" ]; then
                log "WARNING" "缺少对应的测试文件: $expected_test_file"
                test_issues=$((test_issues + 1))
            fi
        fi
    done
    
    if [ $test_issues -gt 0 ]; then
        log "WARNING" "发现 $test_issues 个源文件没有对应的测试文件"
    fi
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "文件结构检查通过"
        return 0
    else
        log "ERROR" "文件结构检查发现 $issues_found 个问题"
        return 1
    fi
}

# 检查代码质量
check_quality() {
    log "INFO" "开始检查代码质量..."
    local issues_found=0
    
    # 检查未使用的导入
    log "INFO" "检查未使用的导入..."
    cd "$APP_ROOT"
    npx eslint . --ext .js,.jsx,.ts,.tsx --rule "no-unused-vars: error" || issues_found=$?
    
    # 检查 console.log 语句
    log "INFO" "检查控制台日志语句..."
    grep -r "console\.log" "$APP_ROOT" --include="*.{js,jsx,ts,tsx}" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        if ! should_ignore_file "$file"; then
            log "WARNING" "发现 console.log 语句: $file"
        fi
    done
    
    # 检查 TODO 注释
    log "INFO" "检查 TODO 注释..."
    grep -r "TODO" "$APP_ROOT" --include="*.{js,jsx,ts,tsx}" | while read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        if ! should_ignore_file "$file"; then
            log "WARNING" "发现 TODO 注释: $file"
        fi
    done
    
    # 检查重复代码
    log "INFO" "检查重复代码..."
    if command -v jscpd >/dev/null 2>&1; then
        jscpd --pattern "**/*.{js,jsx,ts,tsx}" --ignore "node_modules" --min-lines 5 --min-tokens 30 "$APP_ROOT" || issues_found=$?
    else
        log "WARNING" "未安装 jscpd，跳过重复代码检查"
    fi
    
    # 检查依赖版本
    log "INFO" "检查依赖版本..."
    cd "$APP_ROOT"
    if command -v npm-check >/dev/null 2>&1; then
        npm-check --json || true
    else
        log "WARNING" "未安装 npm-check，跳过依赖版本检查"
    fi
    
    if [ $issues_found -eq 0 ]; then
        log "SUCCESS" "代码质量检查通过"
        return 0
    else
        log "ERROR" "代码质量检查发现 $issues_found 个问题"
        return 1
    fi
}

# 生成报告
generate_report() {
    local checks_passed=0
    local checks_failed=0
    local all_passed=true
    
    # 执行检查
    for check in "${CHECK_LIST[@]}"; do
        case "$check" in
            "format")
                check_format
                if [ $? -eq 0 ]; then
                    checks_passed=$((checks_passed + 1))
                else
                    checks_failed=$((checks_failed + 1))
                    all_passed=false
                fi
                ;;
            "naming")
                check_naming
                if [ $? -eq 0 ]; then
                    checks_passed=$((checks_passed + 1))
                else
                    checks_failed=$((checks_failed + 1))
                    all_passed=false
                fi
                ;;
            "structure")
                check_structure
                if [ $? -eq 0 ]; then
                    checks_passed=$((checks_passed + 1))
                else
                    checks_failed=$((checks_failed + 1))
                    all_passed=false
                fi
                ;;
            "quality")
                check_quality
                if [ $? -eq 0 ]; then
                    checks_passed=$((checks_passed + 1))
                else
                    checks_failed=$((checks_failed + 1))
                    all_passed=false
                fi
                ;;
            *)
                log "ERROR" "未知的检查项: $check"
                ;;
        esac
    done
    
    # 生成报告
    log "INFO" "========================================"
    log "INFO" "         标准化检查报告              "
    log "INFO" "========================================"
    log "INFO" "检查项总数: ${#CHECK_LIST[@]}"
    log "INFO" "通过项数: $checks_passed"
    log "INFO" "失败项数: $checks_failed"
    
    if [ "$all_passed" = true ]; then
        log "SUCCESS" "所有检查通过!"
        return 0
    else
        log "ERROR" "检查未全部通过，发现 $checks_failed 个失败项"
        return 1
    fi
}

# 主函数
main() {
    log "INFO" "========================================"
    log "INFO" "      代码标准化检查脚本 v1.1.0       "
    log "INFO" "========================================"
    
    # 初始化项目根目录
    init_project_root
    
    # 生成报告
    generate_report
    local report_status=$?
    
    return $report_status
}

# 执行主函数
main
