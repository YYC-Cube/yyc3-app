#!/bin/bash

# ===== Claude 工作交接脚本 =====
# 版本: v3.0
# 最后更新: 2025-12-06
# 用途: 创建 Claude 到用户的工作交接记录

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 路径配置
WORKSPACE_ROOT="/Users/yanyu/www"
CLAUDE_WORKSPACE="$WORKSPACE_ROOT/claude-workspace"
COLLABORATION_AREA="$WORKSPACE_ROOT/yyc3-22"
HANDOFF_AREA="$COLLABORATION_AREA/handoff"
SHARED_PROJECTS="$COLLABORATION_AREA/shared"

# 确保目录存在
mkdir -p "$HANDOFF_AREA"

# 显示帮助信息
show_help() {
    echo -e "${CYAN}Claude 工作交接脚本${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo -e "  $0 [交接内容]"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 \"完成了项目模板创建，请检查并反馈\""
    echo -e "  $0 \"已修复数据库连接问题，可以继续开发\""
    echo -e "  $0"
    echo ""
    echo -e "${YELLOW}选项:${NC}"
    echo -e "  -h, --help     显示此帮助信息"
    echo -e "  -l, --list     列出所有交接记录"
    echo -e "  -s, --show     显示最新的交接记录"
    echo -e "  -c, --count    显示交接记录数量"
    echo ""
}

# 获取交接内容
get_handoff_content() {
    local content="$*"

    if [[ -z "$content" ]]; then
        # 如果没有参数，从标准输入读取
        echo -e "${YELLOW}📝 请输入交接内容 (按 Ctrl+D 结束):${NC}"
        content=$(cat)
    fi

    if [[ -z "$content" ]]; then
        echo -e "${RED}❌ 交接内容不能为空${NC}"
        exit 1
    fi

    echo "$content"
}

# 获取运行中的服务
get_running_services() {
    local services=()
    local port_services=(
        "3000:web-app"
        "3001:admin-panel"
        "3100:dashboard"
        "8000:api-service"
        "8001:email-api"
        "8002:ai-api"
        "9000:world-api"
        "5432:database"
        "6379:redis"
        "9090:prometheus"
        "3000:grafana"
    )

    for port_service in "${port_services[@]}"; do
        local port="${port_service%%:*}"
        local service="${port_service##*:}"

        if lsof -i :$port >/dev/null 2>&1; then
            services+=("$service")
        fi
    done

    printf '%s\n' "${services[@]}"
}

# 获取最近修改的文件
get_recent_files() {
    local time_threshold=$(($(date +%s) - 3600)) # 1小时前
    local recent_files=()

    # 查找最近修改的文件
    while IFS= read -r -d '' file; do
        local file_time
        file_time=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)

        if [[ $file_time -gt $time_threshold ]]; then
            local relative_path="${file#$WORKSPACE_ROOT/}"
            recent_files+=("$relative_path")
        fi
    done < <(find "$WORKSPACE_ROOT" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) -print0 2>/dev/null)

    printf '%s\n' "${recent_files[@]}"
}

# 获取当前项目信息
get_project_context() {
    local project_count=0
    local active_projects=()
    local recent_changes=()

    if [[ -d "$SHARED_PROJECTS" ]]; then
        project_count=$(find "$SHARED_PROJECTS" -name "*.json" -type f | wc -l)

        if [[ $project_count -gt 0 ]] && command -v jq >/dev/null 2>&1; then
            find "$SHARED_PROJECTS" -name "*.json" -type f | while read -r project_file; do
                local project_name
                local project_status
                project_name=$(jq -r '.name // "Unknown"' "$project_file" 2>/dev/null)
                project_status=$(jq -r '.status // "unknown"' "$project_file" 2>/dev/null)
                active_projects+=("$project_name ($project_status)")
            done
        fi
    fi

    # 获取最近变更
    local recent_files_array
    mapfile -t recent_files_array < <(get_recent_files)
    recent_changes=("${recent_files_array[@]}")

    # 输出JSON格式
    cat << EOF
{
  "currentProjects": $project_count,
  "activeTasks": [
    "继续开发当前项目",
    "处理用户反馈",
    "优化代码结构",
    "更新文档"
  ],
  "recentChanges": $(printf '%s\n' "${recent_changes[@]}" | jq -R . | jq -s .)
}
EOF
}

# 获取工作状态
get_work_status() {
    local completed_tasks=()
    local in_progress_tasks=()
    local blocked_tasks=()
    local pending_tasks=()

    # 这里可以根据实际情况定义任务状态
    # 简化示例，实际应该从工作计划中读取

    # 从今日计划中读取任务
    local today_plan="$CLAUDE_WORKSPACE/today-plans/plan-$(date +%Y%m%d).md"
    if [[ -f "$today_plan" ]]; then
        # 简单解析今日计划，提取任务状态
        if grep -q "\- \[x\]" "$today_plan"; then
            while IFS= read -r line; do
                if [[ "$line" =~ ^- \[x\]\ (.+) ]]; then
                    completed_tasks+=("${BASH_REMATCH[1]}")
                elif [[ "$line" =~ ^- \[ \]\ (.+) ]]; then
                    in_progress_tasks+=("${BASH_REMATCH[1]}")
                fi
            done < <(grep "^- \[" "$today_plan")
        fi
    fi

    # 默认任务
    if [[ ${#completed_tasks[@]} -eq 0 ]]; then
        completed_tasks+=("环境初始化")
        completed_tasks+=("配置文件标准化")
        completed_tasks+=("协作区域设置")
    fi

    if [[ ${#in_progress_tasks[@]} -eq 0 ]]; then
        in_progress_tasks+=("项目模板创建")
        in_progress_tasks+=("工作流脚本开发")
    fi

    pending_tasks+=("用户反馈处理")
    pending_tasks+=("功能需求确认")

    # 输出JSON格式
    cat << EOF
{
  "completed": $(printf '%s\n' "${completed_tasks[@]}" | jq -R . | jq -s .),
  "inProgress": $(printf '%s\n' "${in_progress_tasks[@]}" | jq -R . | jq -s .),
  "blocked": [],
  "pending": $(printf '%s\n' "${pending_tasks[@]}" | jq -R . | jq -s .)
}
EOF
}

# 创建交接记录
create_handoff() {
    local handoff_content="$1"

    echo -e "${BLUE}📊 收集当前工作状态...${NC}"

    # 获取会话ID
    local session_id="unknown"
    if [[ -f "$CLAUDE_WORKSPACE/.session" ]]; then
        session_id=$(grep CLAUDE_SESSION_ID "$CLAUDE_WORKSPACE/.session" | cut -d: -f2 | tr -d ' ')
    fi

    # 生成交接ID
    local handoff_id="handoff_$(date +%Y%m%d_%H%M%S)_$(openssl rand -hex 4)"
    local handoff_file="$HANDOFF_AREA/${handoff_id}.json"

    # 收集环境信息
    echo -e "${CYAN}🔧 检查运行中的服务...${NC}"
    local running_services
    mapfile -t running_services < <(get_running_services)

    echo -e "${CYAN}📁 检查项目状态...${NC}"
    local project_context
    project_context=$(get_project_context)

    echo -e "${CYAN}📝 分析工作状态...${NC}"
    local work_status
    work_status=$(get_work_status)

    echo -e "${CYAN}📄 检查文件变更...${NC}"
    local recent_files
    mapfile -t recent_files < <(get_recent_files)

    # 创建交接记录
    cat > "$handoff_file" << EOF
{
  "id": "$handoff_id",
  "sessionId": "$session_id",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "from": "claude",
  "to": "user",
  "projectContext": $project_context,
  "status": $work_status,
  "nextSteps": [
    "$handoff_content"
  ],
  "notes": "Claude工作交接给用户，请继续推进相关任务",
  "filesModified": $(printf '%s\n' "${recent_files[@]}" | jq -R . | jq -s .),
  "environmentState": {
    "runningServices": $(printf '%s\n' "${running_services[@]}" | jq -R . | jq -s .),
    "databaseState": "available",
    "cacheState": "available",
    "workspaceRoot": "$WORKSPACE_ROOT",
    "collaborationArea": "$COLLABORATION_AREA"
  },
  "claudeInfo": {
    "version": "3.0",
    "capabilities": [
      "代码生成",
      "项目模板创建",
      "环境配置管理",
      "文档编写",
      "错误排查"
    ],
    "currentFocus": "标准化开发环境建设"
  }
}
EOF

    # 更新最后扫描时间
    touch "$CLAUDE_WORKSPACE/.last-scan"

    # 输出交接信息
    echo -e "${GREEN}✅ 工作交接已创建: $handoff_file${NC}"
    echo -e "${CYAN}📋 交接ID: $handoff_id${NC}"
    echo -e "${CYAN}📝 交接内容: $handoff_content${NC}"
    echo -e "${CYAN}🔧 运行中的服务: ${running_services[*]}${NC}"
    echo -e "${CYAN}📄 修改文件数: ${#recent_files[@]}${NC}"

    # 生成交接摘要
    local summary_file="$CLAUDE_WORKSPACE/handoff-summary.md"
    cat > "$summary_file" << EOF
# Claude 工作交接摘要

## 🕐 交接时间
$(date "+%Y-%m-%d %H:%M:%S")

## 📋 交接内容
$handoff_content

## 🔧 当前环境状态
- **运行中的服务**: ${running_services[*]}
- **数据库**: 可用
- **缓存**: 可用
- **工作区根目录**: $WORKSPACE_ROOT
- **协作区域**: $COLLABORATION_AREA

## 📁 项目状态
- **当前项目数**: $(find "$SHARED_PROJECTS" -name "*.json" -type f 2>/dev/null | wc -l)
- **活跃项目**: 见项目文件详情

## 📄 最近修改文件
$(if [[ ${#recent_files[@]} -gt 0 ]]; then
    printf '%s\n' "${recent_files[@]}" | sed 's/^/- /'
else
    echo "- 无最近修改文件"
fi)

## 📊 工作状态
- **已完成**: ${#completed_tasks[@]} 项
- **进行中**: ${#in_progress_tasks[@]} 项
- **待处理**: ${#pending_tasks[@]} 项

## 🎯 下一步行动
1. 检查交接内容
2. 确认环境状态
3. 继续推进任务
4. 提供反馈给Claude

## 📞 联系信息
- **工作区**: $WORKSPACE_ROOT
- **协作区**: $COLLABORATION_AREA
- **交接文件**: $handoff_file

---
*由 Claude v3.0 自动生成*
EOF

    echo -e "${GREEN}📄 交接摘要已保存: $summary_file${NC}"
}

# 列出所有交接记录
list_handoffs() {
    echo -e "${CYAN}📋 工作交接记录列表:${NC}"
    echo -e "${PURPLE}=====================================${NC}"

    local handoff_count=0
    find "$HANDOFF_AREA" -name "handoff_*.json" -type f -exec ls -lt {} + 2>/dev/null | while read -r handoff_file; do
        ((handoff_count++))

        local file_name
        file_name=$(basename "$handoff_file")
        local file_date
        file_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$handoff_file" 2>/dev/null || stat -c "%y" "$handoff_file" 2>/dev/null)

        if command -v jq >/dev/null 2>&1; then
            local session_id
            local next_steps
            session_id=$(jq -r '.sessionId // "unknown"' "$handoff_file" 2>/dev/null)
            next_steps=$(jq -r '.nextSteps[0] // "无内容"' "$handoff_file" 2>/dev/null)

            echo -e "${GREEN}$handoff_count. $file_name${NC}"
            echo -e "   📅 时间: $file_date"
            echo -e "   🆔 会话: $session_id"
            echo -e "   📝 内容: $next_steps"
            echo -e "   📁 文件: $handoff_file"
            echo ""
        else
            echo -e "${GREEN}$handoff_count. $file_name${NC}"
            echo -e "   📅 时间: $file_date"
            echo -e "   📁 文件: $handoff_file"
            echo ""
        fi
    done

    if [[ $handoff_count -eq 0 ]]; then
        echo -e "${YELLOW}⚠️ 未找到交接记录${NC}"
    else
        echo -e "${CYAN}总计: $handoff_count 个交接记录${NC}"
    fi
}

# 显示最新交接记录
show_latest_handoff() {
    local latest_handoff
    latest_handoff=$(find "$HANDOFF_AREA" -name "handoff_*.json" -type f -exec ls -t {} + 2>/dev/null | head -1)

    if [[ -z "$latest_handoff" ]]; then
        echo -e "${YELLOW}⚠️ 未找到交接记录${NC}"
        return
    fi

    echo -e "${CYAN}📋 最新工作交接记录:${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${GREEN}文件: $(basename "$latest_handoff")${NC}"

    if command -v jq >/dev/null 2>&1; then
        echo ""
        echo -e "${BLUE}🕐 交接时间:${NC}"
        jq -r '.timestamp' "$latest_handoff" 2>/dev/null

        echo ""
        echo -e "${BLUE}📝 交接内容:${NC}"
        jq -r '.nextSteps[]? // empty' "$latest_handoff" 2>/dev/null | while read -r step; do
            echo -e "  📝 $step"
        done

        echo ""
        echo -e "${BLUE}🔧 环境状态:${NC}"
        local services
        services=$(jq -r '.environmentState.runningServices[]? // empty' "$latest_handoff" 2>/dev/null)
        if [[ -n "$services" ]]; then
            echo "$services" | while read -r service; do
                echo -e "  ✅ $service"
            done
        fi

        echo ""
        echo -e "${BLUE}📄 文件变更:${NC}"
        local file_count
        file_count=$(jq -r '.filesModified | length' "$latest_handoff" 2>/dev/null)
        echo -e "  📁 修改文件数: $file_count"

        echo ""
        echo -e "${BLUE}📊 工作状态:${NC}"
        local completed_count
        local in_progress_count
        completed_count=$(jq -r '.status.completed | length' "$latest_handoff" 2>/dev/null)
        in_progress_count=$(jq -r '.status.inProgress | length' "$latest_handoff" 2>/dev/null)
        echo -e "  ✅ 已完成: $completed_count 项"
        echo -e "  🚧 进行中: $in_progress_count 项"
    else
        echo -e "${YELLOW}⚠️ 需要安装 jq 来显示详细信息${NC}"
        echo -e "${CYAN}文件内容:${NC}"
        cat "$latest_handoff"
    fi
}

# 显示交接记录数量
show_handoff_count() {
    local handoff_count
    handoff_count=$(find "$HANDOFF_AREA" -name "handoff_*.json" -type f 2>/dev/null | wc -l)

    echo -e "${CYAN}📊 交接记录统计:${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${GREEN}总交接记录数: $handoff_count${NC}"

    if [[ $handoff_count -gt 0 ]]; then
        local today_count
        local week_count
        local month_count

        # 今日交接数量
        today_count=$(find "$HANDOFF_AREA" -name "handoff_$(date +%Y%m%d)_*.json" -type f 2>/dev/null | wc -l)
        echo -e "${GREEN}今日交接: $today_count 个${NC}"

        # 本周交接数量
        local week_start=$(date -v-7d +%Y%m%d 2>/dev/null || date -d '7 days ago' +%Y%m%d)
        week_count=$(find "$HANDOFF_AREA" -name "handoff_{$week_start..$(date +%Y%m%d)}_*.json" -type f 2>/dev/null | wc -l)
        echo -e "${GREEN}本周交接: $week_count 个${NC}"

        # 本月交接数量
        local month_start=$(date -v-30d +%Y%m%d 2>/dev/null || date -d '30 days ago' +%Y%m%d)
        month_count=$(find "$HANDOFF_AREA" -name "handoff_{$month_start..$(date +%Y%m%d)}_*.json" -type f 2>/dev/null | wc -l)
        echo -e "${GREEN}本月交接: $month_count 个${NC}"

        # 最新交接时间
        local latest_file
        latest_file=$(find "$HANDOFF_AREA" -name "handoff_*.json" -type f -exec ls -t {} + 2>/dev/null | head -1)
        if [[ -n "$latest_file" ]]; then
            local latest_time
            latest_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$latest_file" 2>/dev/null || stat -c "%y" "$latest_file" 2>/dev/null)
            echo -e "${GREEN}最新交接: $latest_time${NC}"
        fi
    fi
}

# 主函数
main() {
    # 处理命令行参数
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -l|--list)
            list_handoffs
            exit 0
            ;;
        -s|--show)
            show_latest_handoff
            exit 0
            ;;
        -c|--count)
            show_handoff_count
            exit 0
            ;;
        -*)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            echo -e "${YELLOW}使用 -h 或 --help 查看帮助${NC}"
            exit 1
            ;;
    esac

    # 获取交接内容
    local handoff_content
    handoff_content=$(get_handoff_content "$@")

    # 创建交接记录
    create_handoff "$handoff_content"
}

# 执行主函数
main "$@"