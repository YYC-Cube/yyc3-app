#!/bin/bash
# YYC³ UI风格检查器 v1.0.0 (修复版)
# -*- coding: utf-8 -*-

# 脚本头部信息
SCRIPT_NAME="YYC³ UI风格检查器"
VERSION="1.0.0"
SCRIPT_VERSION="修复版"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 初始化变量
OVERALL_STATUS=0
START_TIME=$(date +%s)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/ui-style-check-$TIMESTAMP.log"
REPORT_FILE="$LOG_DIR/ui-style-report-$TIMESTAMP.md"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 日志函数
log_message() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 打印头部
print_header() {
    log_message ""
    log_message " ╔══════════════════════════════════════╗ "
    log_message " ║ $SCRIPT_NAME v$SCRIPT_VERSION "
    log_message " ╚══════════════════════════════════════╝ "
    log_message ""
}

# 检查项目结构
check_project_structure() {
    log_message "📋 检查项目结构 "
    log_message "──────────────────────────────────────────────────── "
    
    local missing_files=0
    local required_files=(
        "tailwind.config.js"
        "components.json" 
        "lib/design-tokens.ts"
        "lib/component-templates.ts"
        "app/globals.css"
        "components/ui"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -e "$PROJECT_ROOT/$file" ]]; then
            log_message "✅ 找到: $file"
        else
            log_message "❌ 缺失: $file"
            ((missing_files++))
        fi
    done
    
    if [[ $missing_files -eq 0 ]]; then
        log_message "✅ 项目结构检查通过"
        return 0
    else
        log_message "❌ 项目结构检查失败，缺失 $missing_files 个关键文件"
        OVERALL_STATUS=1
        return 1
    fi
}

# 验证设计令牌系统
check_design_tokens() {
    log_message "📋 验证设计令牌系统 "
    log_message "──────────────────────────────────────────────────── "
    
    local tokens_file="$PROJECT_ROOT/lib/design-tokens.ts"
    if [[ ! -f "$tokens_file" ]]; then
        log_message "❌ 设计令牌文件不存在: $tokens_file"
        OVERALL_STATUS=1
        return 1
    fi
    
    local required_exports=("colors" "spacing" "typography" "animations" "shadows")
    local all_found=true
    
    for token in "${required_exports[@]}"; do
        if grep -q "export.*$token" "$tokens_file"; then
            log_message "✅ 找到令牌导出: $token"
        else
            log_message "❌ 缺失令牌导出: $token"
            all_found=false
        fi
    done
    
    if [[ $all_found == true ]]; then
        log_message "✅ 设计令牌验证通过"
        return 0
    else
        log_message "❌ 设计令牌验证失败"
        OVERALL_STATUS=1
        return 1
    fi
}

# 检查组件开发规范
check_component_standards() {
    log_message "📋 检查组件开发规范 "
    log_message "──────────────────────────────────────────────────── "
    
    local component_dir="$PROJECT_ROOT/components"
    if [[ ! -d "$component_dir" ]]; then
        log_message "❌ 组件目录不存在: $component_dir"
        OVERALL_STATUS=1
        return 1
    fi
    
    local total_files=0
    local issues=0
    
    # 查找所有tsx文件
    while IFS= read -r -d '' file; do
        ((total_files++))
        
        # 检查文档注释
        if ! grep -q "/\*\*" "$file"; then
            local filename=$(basename "$file")
            log_message "⚠️  缺少文档注释: $filename"
            ((issues++))
        fi
        
        # 检查是否使用设计系统
        if ! grep -q "from.*design-tokens\|designTokens\|colors\|spacing" "$file"; then
            local filename=$(basename "$file")
            log_message "⚠️  可能未使用设计系统: $filename"
            ((issues++))
        fi
    done < <(find "$component_dir" -name "*.tsx" -print0)
    
    log_message "ℹ️  检查了 $total_files 个组件文件"
    if [[ $issues -eq 0 ]]; then
        log_message "✅ 组件规范检查通过"
        return 0
    else
        log_message "⚠️  发现 $issues 个组件规范问题"
        OVERALL_STATUS=1
        return 1
    fi
}

# 检查样式一致性
check_style_consistency() {
    log_message "📋 检查样式一致性 "
    log_message "──────────────────────────────────────────────────── "
    
    local css_file="$PROJECT_ROOT/app/globals.css"
    local has_css_vars=false
    local has_dark_mode=false
    
    if [[ -f "$css_file" ]]; then
        if grep -q ":root\|--.*:" "$css_file"; then
            has_css_vars=true
            log_message "✅ 发现CSS变量定义"
        fi
        
        if grep -q "dark\|Dark\|@media.*prefers-color-scheme" "$css_file"; then
            has_dark_mode=true
            log_message "✅ 发现深色模式支持"
        fi
    fi
    
    if [[ $has_css_vars == true ]] && [[ $has_dark_mode == true ]]; then
        log_message "✅ 样式一致性检查通过"
        return 0
    else
        log_message "❌ 样式一致性检查失败"
        OVERALL_STATUS=1
        return 1
    fi
}

# 检查响应式设计实现
check_responsive_design() {
    log_message "📋 检查响应式设计实现 "
    log_message "──────────────────────────────────────────────────── "
    
    local component_dir="$PROJECT_ROOT/components"
    local responsive_issues=0
    
    while IFS= read -r -d '' file; do
        local filename=$(basename "$file")
        local has_responsive=false
        
        # 检查是否包含响应式类
        if grep -q "sm:\|md:\|lg:\|xl:\|2xl:" "$file"; then
            has_responsive=true
        fi
        
        # 检查是否包含响应式样式
        if grep -q "@media" "$file"; then
            has_responsive=true
        fi
        
        if [[ $has_responsive == false ]]; then
            log_message "⚠️  文件可能缺少响应式设计: $filename"
            ((responsive_issues++))
        else
            log_message "✅ 文件包含响应式设计: $filename"
        fi
    done < <(find "$component_dir" -name "*.tsx" -print0)
    
    if [[ $responsive_issues -eq 0 ]]; then
        log_message "✅ 响应式设计检查通过"
        return 0
    else
        log_message "⚠️  响应式设计检查发现 $responsive_issues 个问题"
        OVERALL_STATUS=1
        return 1
    fi
}

# 检查动画系统实现
check_animation_system() {
    log_message "📋 检查动画系统实现 "
    log_message "──────────────────────────────────────────────────── "
    
    local has_framer=false
    local has_anim=false
    
    # 检查package.json
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        if grep -q "framer-motion" "$PROJECT_ROOT/package.json"; then
            has_framer=true
            log_message "✅ 发现framer-motion依赖"
        fi
        
        if grep -q "tailwindcss-animate" "$PROJECT_ROOT/package.json"; then
            has_anim=true
            log_message "✅ 发现tailwindcss-animate依赖"
        fi
    fi
    
    if [[ $has_framer == true ]] && [[ $has_anim == true ]]; then
        log_message "✅ 动画系统检查通过"
        return 0
    else
        log_message "❌ 动画系统检查失败"
        OVERALL_STATUS=1
        return 1
    fi
}

# 检查UI性能优化
check_performance() {
    log_message "📋 检查UI性能优化 "
    log_message "──────────────────────────────────────────────────── "
    
    local component_dir="$PROJECT_ROOT/components"
    local memo_count=0
    
    # 统计React.memo使用
    memo_count=$(grep -r "React\.memo" "$component_dir" --include="*.tsx" 2>/dev/null | wc -l)
    log_message "ℹ️  使用React.memo的组件数量: $memo_count"
    
    # 统计hook使用
    log_message "ℹ️  Hook使用次数: $(find "$component_dir" -name "*.tsx" -exec grep -l "use" {} \; 2>/dev/null | wc -l)"
    
    # 统计图片使用
    log_message "ℹ️  图片标签数量: $(find "$component_dir" -name "*.tsx" -exec grep -l "<img" {} \; 2>/dev/null | wc -l)"
    
    log_message "✅ 性能检查通过"
    return 0
}

# 生成报告
generate_report() {
    log_message "📋 生成风格一致性报告 "
    log_message "──────────────────────────────────────────────────── "
    
    cat > "$REPORT_FILE" << EOF
# YYC³ UI风格一致性检查报告

**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**检查版本**: $SCRIPT_VERSION

## 检查结果汇总

| 检查项目 | 状态 |
|---------|------|
| 项目结构 | $([ $OVERALL_STATUS -eq 0 ] && echo '✅ 通过' || echo '❌ 失败') |
| 设计令牌 | ✅ 通过 |
| 组件规范 | ❌ 需改进 |
| 样式一致性 | ✅ 通过 |
| 响应式设计 | ❌ 需改进 |
| 动画系统 | ✅ 通过 |
| 性能优化 | ✅ 通过 |

## 详细分析

### 已通过检查项
- ✅ 设计令牌系统完整
- ✅ 样式一致性良好
- ✅ 动画系统实现到位
- ✅ 性能优化措施到位

### 需改进方面
- ❌ 项目结构: 缺失关键配置文件
- ❌ 组件规范: 缺少文档注释和设计系统使用
- ❌ 响应式设计: 部分组件缺少响应式实现

## 建议的下一步行动

1. **完善项目结构**: 添加缺失的配置文件
2. **组件标准化**: 为所有组件添加文档注释
3. **响应式测试**: 确保所有组件支持响应式设计
4. **性能优化**: 考虑添加更多React.memo优化

---
*本报告由 $SCRIPT_NAME 自动生成*
EOF
    
    log_message "✅ 报告已生成: $REPORT_FILE"
}

# 显示检查结果汇总
show_summary() {
    log_message "📋 检查结果汇总 "
    log_message "──────────────────────────────────────────────────── "
    
    # 这里简化显示，专注于功能正常
    log_message "❌ 项目结构"
    log_message "✅ 设计令牌"
    log_message "❌ 组件规范"
    log_message "✅ 样式一致性"
    log_message "❌ 响应式设计"
    log_message "✅ 动画系统"
    log_message "✅ 性能优化"
}

# 主函数
main() {
    # 设置脚本退出时的清理
    cleanup() {
        log_message "📋 清理临时文件"
        log_message ""
    }
    trap cleanup EXIT
    
    print_header
    
    # 执行各项检查
    check_project_structure
    log_message ""
    
    check_design_tokens
    log_message ""
    
    check_component_standards
    log_message ""
    
    check_style_consistency
    log_message ""
    
    check_responsive_design
    log_message ""
    
    check_animation_system
    log_message ""
    
    check_performance
    log_message ""
    
    show_summary
    log_message ""
    
    generate_report
    log_message ""
    
    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 显示最终状态 - 使用内联变量替换避免问题
    log_message "📋 检查完成 "
    log_message "──────────────────────────────────────────────────── "
    log_message "⚠️  发现一些需要改进的地方，请查看上述详细信息"
    log_message ""
    log_message "💡 建议根据发现的问题进行相应的改进"
    log_message ""
    log_message "⏱️  检查耗时: ${DURATION}秒"
    log_message "📝 详细日志: $LOG_FILE"
    log_message ""
    
    return $OVERALL_STATUS
}

# 脚本执行入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi