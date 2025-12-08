#!/bin/bash

# ===== Claude 协作工作流脚本 =====
# 版本: v3.0
# 最后更新: 2025-12-06
# 用途: Claude 和 YanYu 的协作工作环境管理

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
DRAFTS_AREA="$COLLABORATION_AREA/drafts"
REVIEWS_AREA="$COLLABORATION_AREA/reviews"
DECISIONS_AREA="$COLLABORATION_AREA/decisions"

# 创建必要目录
ensure_directories() {
    echo -e "${CYAN}📁 确保目录结构存在...${NC}"

    mkdir -p "$CLAUDE_WORKSPACE"/{sessions,context,memory,outputs,today-plans}
    mkdir -p "$COLLABORATION_AREA"/{shared,drafts,reviews,decisions,handoff}
    mkdir -p "$WORKSPACE_ROOT"/{logs,backups,temp}

    # 创建会话文件
    if [[ ! -f "$CLAUDE_WORKSPACE/.session" ]]; then
        cat > "$CLAUDE_WORKSPACE/.session" << EOF
CLAUDE_SESSION_ID: session_$(date +%Y%m%d-%H%M%S)_$(openssl rand -hex 4)
LAST_ACTIVE: $(date)
COLLABORATION_MODE: active
WORKSPACE_ROOT: $WORKSPACE_ROOT
CLAUDE_VERSION: 3.0
EOF
        echo -e "${GREEN}✅ 创建新会话文件${NC}"
    fi

    echo -e "${GREEN}✅ 目录结构检查完成${NC}"
}

# 显示欢迎信息
show_welcome() {
    echo -e "${CYAN}🤖 Claude 协作工作流${NC}"
    echo -e "${PURPLE}=====================================${NC}"
    echo -e "${BLUE}工作区根目录: $WORKSPACE_ROOT${NC}"
    echo -e "${BLUE}Claude工作区: $CLAUDE_WORKSPACE${NC}"
    echo -e "${BLUE}协作区域: $COLLABORATION_AREA${NC}"
    echo ""
}

# 检查会话状态
check_session_status() {
    echo -e "${BLUE}1️⃣ 检查会话状态...${NC}"

    if [[ -f "$CLAUDE_WORKSPACE/.session" ]]; then
        source "$CLAUDE_WORKSPACE/.session"
        echo -e "${GREEN}✅ 会话ID: $CLAUDE_SESSION_ID${NC}"
        echo -e "${GREEN}✅ 最后活跃: $LAST_ACTIVE${NC}"
        echo -e "${GREEN}✅ 协作模式: $COLLABORATION_MODE${NC}"
    else
        echo -e "${YELLOW}⚠️ 未找到会话文件，创建新会话${NC}"
    fi

    # 检查上次交接
    local latest_handoff
    latest_handoff=$(find "$HANDOFF_AREA" -name "handoff_*.json" -type f -exec ls -t {} + 2>/dev/null | head -1)

    if [[ -n "$latest_handoff" ]]; then
        echo -e "${GREEN}✅ 发现上次工作交接${NC}"
        echo -e "${YELLOW}📋 交接文件: $(basename "$latest_handoff")${NC}"

        # 显示交接内容摘要
        if command -v jq >/dev/null 2>&1; then
            echo -e "${CYAN}📊 上次工作摘要:${NC}"
            local next_steps
            next_steps=$(jq -r '.nextSteps[]? // empty' "$latest_handoff" 2>/dev/null)
            if [[ -n "$next_steps" ]]; then
                echo "$next_steps" | while read -r step; do
                    echo -e "  📝 $step"
                done
            fi

            # 显示环境状态
            echo -e "${CYAN}🔧 环境状态:${NC}"
            local services
            services=$(jq -r '.environmentState.runningServices[]? // empty' "$latest_handoff" 2>/dev/null)
            if [[ -n "$services" ]]; then
                echo "$services" | while read -r service; do
                    echo -e "  ✅ $service"
                done
            fi
        fi
    else
        echo -e "${YELLOW}⚠️ 未发现上次工作交接${NC}"
    fi
}

# 扫描协作区域
scan_collaboration_area() {
    echo -e "${BLUE}2️⃣ 扫描协作区域...${NC}"

    # 扫描共享项目
    if [[ -d "$SHARED_PROJECTS" ]]; then
        local project_count
        project_count=$(find "$SHARED_PROJECTS" -name "*.json" -type f | wc -l)
        echo -e "${CYAN}📁 共享项目: $project_count 个${NC}"

        if command -v jq >/dev/null 2>&1 && [[ $project_count -gt 0 ]]; then
            echo -e "${CYAN}项目列表:${NC}"
            find "$SHARED_PROJECTS" -name "*.json" -type f | while read -r project_file; do
                local project_name
                local project_status
                project_name=$(jq -r '.name // "Unknown"' "$project_file" 2>/dev/null)
                project_status=$(jq -r '.status // "unknown"' "$project_file" 2>/dev/null)
                local status_emoji="❓"

                case "$project_status" in
                    "draft") status_emoji="📝" ;;
                    "development") status_emoji="🚧" ;;
                    "review") status_emoji="👀" ;;
                    "complete") status_emoji="✅" ;;
                esac

                echo -e "  $status_emoji ${project_name} (${project_status})"
            done
        fi
    else
        echo -e "${YELLOW}⚠️ 共享项目目录不存在${NC}"
    fi

    # 扫描草稿区域
    if [[ -d "$DRAFTS_AREA" ]]; then
        local draft_count
        draft_count=$(find "$DRAFTS_AREA" -type f | wc -l)
        echo -e "${CYAN}📝 草稿文件: $draft_count 个${NC}"
    fi

    # 扫描审查区域
    if [[ -d "$REVIEWS_AREA" ]]; then
        local review_count
        review_count=$(find "$REVIEWS_AREA" -name "*.json" -type f | wc -l)
        echo -e "${CYAN}👀 待审查: $review_count 个${NC}"

        # 显示待处理审查
        if [[ $review_count -gt 0 ]] && command -v jq >/dev/null 2>&1; then
            find "$REVIEWS_AREA" -name "*.json" -type f | while read -r review_file; do
                local project_id
                project_id=$(jq -r '.projectId // "unknown"' "$review_file" 2>/dev/null)
                echo -e "  🔍 项目ID: $project_id"
            done
        fi
    fi
}

# 检查环境状态
check_environment_status() {
    echo -e "${BLUE}3️⃣ 检查环境状态...${NC}"

    echo -e "${CYAN}🔧 运行中的服务:${NC}"
    local services_found=0

    # 检查常用端口
    local port_services=(
        "3000:Web应用"
        "3001:管理面板"
        "3100:仪表板"
        "8000:API服务"
        "8001:邮件API"
        "8002:AI API"
        "9000:世界API"
        "5432:PostgreSQL"
        "6379:Redis"
        "9090:Prometheus"
        "3000:Grafana"
    )

    for port_service in "${port_services[@]}"; do
        local port="${port_service%%:*}"
        local service="${port_service##*:}"

        if lsof -i :$port >/dev/null 2>&1; then
            echo -e "  ✅ $service (端口: $port)"
            ((services_found++))
        else
            echo -e "  ❌ $service (端口: $port) - 未运行"
        fi
    done

    if [[ $services_found -eq 0 ]]; then
        echo -e "${YELLOW}⚠️ 没有检测到运行中的服务${NC}"
    else
        echo -e "${GREEN}✅ 发现 $services_found 个运行中的服务${NC}"
    fi

    # 检查Git状态
    if [[ -d "$WORKSPACE_ROOT/.git" ]]; then
        echo -e "${CYAN}📚 Git状态:${NC}"
        cd "$WORKSPACE_ROOT"

        local current_branch
        current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        echo -e "  🌿 当前分支: $current_branch"

        local git_status
        git_status=$(git status --porcelain 2>/dev/null)
        if [[ -n "$git_status" ]]; then
            local changes_count
            changes_count=$(echo "$git_status" | wc -l)
            echo -e "  📝 有 $changes_count 个未提交的更改"
        else
            echo -e "  ✅ 工作区干净"
        fi
    fi
}

# 检测文件变更
detect_file_changes() {
    echo -e "${BLUE}4️⃣ 检测文件变更...${NC}"

    local last_scan_file="$CLAUDE_WORKSPACE/.last-scan"
    local current_time=$(date +%s)

    if [[ -f "$last_scan_file" ]]; then
        local last_scan_time
        last_scan_time=$(cat "$last_scan_file" 2>/dev/null || echo "0")
        local time_diff=$((current_time - last_scan_time))

        if [[ $time_diff -lt 3600 ]]; then
            echo -e "${YELLOW}⏰ 上次扫描不到1小时前，跳过变更检测${NC}"
            return
        fi
    fi

    # 更新扫描时间
    echo "$current_time" > "$last_scan_file"

    # 检查协作区域的变更
    echo -e "${CYAN}📊 协作区域文件变更:${NC}"

    local recent_files=()
    local time_threshold=$((current_time - 86400)) # 24小时前

    # 查找最近修改的文件
    while IFS= read -r -d '' file; do
        local file_time
        file_time=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)

        if [[ $file_time -gt $time_threshold ]]; then
            recent_files+=("$file")
        fi
    done < <(find "$COLLABORATION_AREA" -type f -print0 2>/dev/null)

    if [[ ${#recent_files[@]} -gt 0 ]]; then
        echo -e "  📄 最近修改的文件 (${#recent_files[@]} 个):"
        for file in "${recent_files[@]}"; do
            local relative_path="${file#$COLLABORATION_AREA/}"
            local file_time
            file_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null)
            echo -e "    📝 $relative_path ($file_time)"
        done
    else
        echo -e "  ✅ 24小时内无文件变更"
    fi
}

# 生成今日工作计划
generate_today_plan() {
    echo -e "${BLUE}5️⃣ 生成今日工作计划...${NC}"

    local today_plan_file="$CLAUDE_WORKSPACE/today-plans/plan-$(date +%Y%m%d).md"

    # 检查是否已有今日计划
    if [[ -f "$today_plan_file" ]]; then
        echo -e "${YELLOW}📋 今日计划已存在: $(basename "$today_plan_file")${NC}"
        echo -e "${CYAN}最近10行内容:${NC}"
        tail -10 "$today_plan_file" | nl
        return
    fi

    # 获取上次交接信息
    local latest_handoff
    latest_handoff=$(find "$HANDOFF_AREA" -name "handoff_*.json" -type f -exec ls -t {} + 2>/dev/null | head -1)

    # 获取项目信息
    local projects_info=""
    if [[ -d "$SHARED_PROJECTS" ]]; then
        local project_count
        project_count=$(find "$SHARED_PROJECTS" -name "*.json" -type f | wc -l)
        projects_info="### 当前项目状态 ($project_count 个项目)"

        if [[ $project_count -gt 0 ]] && command -v jq >/dev/null 2>&1; then
            find "$SHARED_PROJECTS" -name "*.json" -type f | while read -r project_file; do
                local project_name
                local project_status
                local project_type
                project_name=$(jq -r '.name // "Unknown"' "$project_file" 2>/dev/null)
                project_status=$(jq -r '.status // "unknown"' "$project_file" 2>/dev/null)
                project_type=$(jq -r '.type // "unknown"' "$project_file" 2>/dev/null)
                projects_info="$projects_info\\n- **$project_name** ($project_type): $project_status"
            done
        fi
    fi

    # 获取待处理审查
    local reviews_info=""
    if [[ -d "$REVIEWS_AREA" ]]; then
        local review_count
        review_count=$(find "$REVIEWS_AREA" -name "*.json" -type f | wc -l)
        if [[ $review_count -gt 0 ]]; then
            reviews_info="### 待处理审查 ($review_count 个)"
        fi
    fi

    # 生成计划文件
    cat > "$today_plan_file" << EOF
# Claude 工作计划 - $(date +%Y-%m-%d)

## 🕐 会话信息
- **会话ID**: $(grep CLAUDE_SESSION_ID "$CLAUDE_WORKSPACE/.session" | cut -d: -f2 | tr -d ' ')
- **开始时间**: $(date)
- **工作区**: $WORKSPACE_ROOT

## 📋 上次工作交接
$(if [[ -n "$latest_handoff" ]] && command -v jq >/dev/null 2>&1; then
    echo "### 待完成任务"
    jq -r '.nextSteps[]? // empty' "$latest_handoff" 2>/dev/null | sed 's/^/- /' || echo "- 无记录"

    echo ""
    echo "### 环境状态"
    local services
    services=$(jq -r '.environmentState.runningServices[]? // empty' "$latest_handoff" 2>/dev/null | tr '\n' ', ')
    echo "- 运行服务: ${services%,}"
else
    echo "- 新会话开始"
fi)

## 🎯 今日优先级
1. **检查用户需求和反馈** - 查看是否有新的用户输入或审查要求
2. **继续进行中的项目开发** - 推进当前活跃的项目
3. **优化现有代码结构** - 提高代码质量和可维护性
4. **更新文档和配置** - 确保文档与代码同步
5. **测试和验证功能** - 确保代码质量

## 📝 重要决策记录
- 待记录...

## 🚧 项目状态
$projects_info

## 👀 待处理事项
$reviews_info

## 🔧 开发环境检查清单
- [ ] 数据库连接状态
- [ ] Redis缓存状态
- [ ] API服务运行状态
- [ ] 前端开发服务器状态
- [ ] Git状态检查

## 📊 今日指标
- **完成任务**: 0
- **代码行数**: 0
- **创建文件**: 0
- **修复Bug**: 0

## 🔄 工作流程
1. **上午 (9:00-12:00)**: 需求分析和规划
2. **下午 (14:00-18:00)**: 开发和实现
3. **晚上 (20:00-22:00)**: 测试和文档

## 📝 备注
- 保持与用户的沟通协作
- 及时更新工作状态
- 定期创建工作交接
- 关注代码质量和最佳实践

---
*由 Claude 自动生成 - $(date)*
EOF

    echo -e "${GREEN}✅ 今日工作计划已生成: $today_plan_file${NC}"
}

# 输出工作指令
show_work_instructions() {
    echo -e "${BLUE}6️⃣ Claude 工作指令:${NC}"
    echo -e "${PURPLE}=====================================${NC}"

    echo ""
    echo -e "${YELLOW}📖 查看今日计划:${NC}"
    echo -e "  ${CYAN}cat $CLAUDE_WORKSPACE/today-plans/plan-$(date +%Y%m%d).md${NC}"

    echo ""
    echo -e "${YELLOW}🤝 协作区域:${NC}"
    echo -e "  ${CYAN}共享项目: $SHARED_PROJECTS${NC}"
    echo -e "  ${CYAN}草稿区域: $DRAFTS_AREA${NC}"
    echo -e "  ${CYAN}审查区域: $REVIEWS_AREA${NC}"
    echo -e "  ${CYAN}交接记录: $HANDOFF_AREA${NC}"

    echo ""
    echo -e "${YELLOW}🔧 快速命令:${NC}"
    echo -e "  ${GREEN}./claude-handoff '完成内容描述'${NC} - 创建工作交接"
    echo -e "  ${GREEN}./claude-sync${NC} - 同步文件变更"
    echo -e "  ${GREEN}./claude-status${NC} - 查看工作状态"
    echo -e "  ${GREEN}./claude-review${NC} - 处理待审查项目"
    echo -e "  ${GREEN}./claude-clean${NC} - 清理临时文件"

    echo ""
    echo -e "${YELLOW}📊 当前状态:${NC}"

    # 显示活跃会话信息
    if [[ -f "$CLAUDE_WORKSPACE/.session" ]]; then
        local session_id
        session_id=$(grep CLAUDE_SESSION_ID "$CLAUDE_WORKSPACE/.session" | cut -d: -f2 | tr -d ' ')
        echo -e "  ${CYAN}会话ID: $session_id${NC}"

        local last_active
        last_active=$(grep LAST_ACTIVE "$CLAUDE_WORKSPACE/.session" | cut -d: -f2- | tr -d ' ')
        echo -e "  ${CYAN}最后活跃: $last_active${NC}"
    fi

    # 显示项目统计
    local project_count=0
    if [[ -d "$SHARED_PROJECTS" ]]; then
        project_count=$(find "$SHARED_PROJECTS" -name "*.json" -type f | wc -l)
    fi
    echo -e "  ${CYAN}活跃项目: $project_count 个${NC}"

    # 显示待处理审查
    local review_count=0
    if [[ -d "$REVIEWS_AREA" ]]; then
        review_count=$(find "$REVIEWS_AREA" -name "*.json" -type f | wc -l)
    fi
    echo -e "  ${CYAN}待审查: $review_count 个${NC}"

    echo ""
    echo -e "${GREEN}🎉 Claude 工作环境准备就绪！${NC}"
    echo -e "${CYAN}💡 建议首先查看今日工作计划，然后开始协作开发${NC}"
}

# 主函数
main() {
    # 确保在正确的工作目录
    cd "$WORKSPACE_ROOT" || {
        echo -e "${RED}❌ 无法切换到工作目录: $WORKSPACE_ROOT${NC}"
        exit 1
    }

    show_welcome
    ensure_directories
    check_session_status
    scan_collaboration_area
    check_environment_status
    detect_file_changes
    generate_today_plan
    show_work_instructions
}

# 执行主函数
main "$@"