#!/bin/bash
# =============================================================================
# AI开发助手 - 快速与Claude交互
# =============================================================================

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_PATH="/Users/yanyu/www"

show_menu() {
    echo -e "${BLUE}=== YY-Cube AI开发助手 ===${NC}"
    echo "1. 代码审查和优化"
    echo "2. 项目状态分析"
    echo "3. 部署问题排查"
    echo "4. 架构设计建议"
    echo "5. 生成技术文档"
    echo "6. 自定义问题"
    echo "0. 退出"
    echo ""
}

ask_claude() {
    local prompt="$1"
    echo -e "${YELLOW}🤖 正在咨询Claude...${NC}"

    # 使用Claude Code CLI
    if command -v claude-code &> /dev/null; then
        cd "$PROJECT_PATH"
        claude-code "$prompt"
    else
        echo -e "${GREEN}请安装Claude Code CLI: curl -fsSL https://claude.ai/install.sh | sh${NC}"
        echo "或者访问: https://claude.ai/chat"
    fi
}

code_review() {
    echo -e "${BLUE}选择要审查的模块:${NC}"
    echo "1. API服务"
    echo "2. 管理后台"
    echo "3. LLM服务"
    echo "4. 邮件服务"
    echo "5. FRP配置"
    echo "6. 整体架构"

    read -p "请选择 [1-6]: " choice

    case $choice in
        1) ask_claude "请审查apps/api/目录下的代码，检查安全性、性能和最佳实践" ;;
        2) ask_claude "请审查apps/admin/目录下的代码，重点关注用户体验和安全性" ;;
        3) ask_claude "请审查apps/llm/目录下的Python代码，检查算法效率和错误处理" ;;
        4) ask_claude "请审查apps/mail/目录下的邮件服务代码，检查可靠性配置" ;;
        5) ask_claude "请审查FRP配置文件，检查安全性和性能优化空间" ;;
        6) ask_claude "请对整个0379.email多项目平台进行代码审查，识别潜在问题和改进建议" ;;
    esac
}

analyze_status() {
    ask_claude "请分析当前0379.email平台的运行状态：
1. 检查Docker容器状态
2. 分析FRP服务连通性
3. 评估系统资源使用情况
4. 识别可能的性能瓶颈
5. 提供优化建议"
}

troubleshoot() {
    echo -e "${BLUE}常见问题类型:${NC}"
    echo "1. 服务无法启动"
    echo "2. 网络连接问题"
    echo "3. 性能问题"
    echo "4. 配置错误"
    echo "5. 自定义问题描述"

    read -p "请选择 [1-5]: " choice

    case $choice in
        1) ask_claude "我的服务无法启动，请帮我排查可能的原因和解决方案" ;;
        2) ask_claude "FRP内网穿透连接有问题，请检查网络配置和连通性" ;;
        3) ask_claude "系统运行缓慢，请分析性能问题并提供优化建议" ;;
        4) ask_claude "配置文件可能有问题，请检查配置语法和逻辑错误" ;;
        5)
            read -p "请详细描述您遇到的问题: " problem
            ask_claude "我遇到以下问题需要排查: $problem"
            ;;
    esac
}

architecture_advice() {
    ask_claude "请基于当前的0379.email多项目协同平台，提供架构设计建议：
1. 微服务拆分优化
2. 数据库架构改进
3. 缓存策略建议
4. 安全架构加强
5. 可扩展性设计
6. 监控和日志系统优化"
}

generate_docs() {
    echo -e "${BLUE}选择要生成的文档类型:${NC}"
    echo "1. API接口文档"
    echo "2. 部署指南"
    echo "3. 运维手册"
    echo "4. 用户使用手册"
    echo "5. 故障排查指南"

    read -p "请选择 [1-5]: " choice

    case $choice in
        1) ask_claude "请基于apps/api/目录生成完整的API接口文档，包括端点、参数、响应格式等" ;;
        2) ask_claude "请生成详细的部署指南，包括环境要求、部署步骤、配置说明等" ;;
        3) ask_claude "请生成运维手册，包括日常维护、监控指标、故障处理等" ;;
        4) ask_claude "请生成用户使用手册，说明如何使用平台的各项功能" ;;
        5) ask_claude "请生成故障排查指南，包括常见问题、诊断步骤、解决方案等" ;;
    esac
}

# 主循环
while true; do
    show_menu
    read -t 30 -p "请选择操作 [0-6]: " choice  # 30秒超时
    echo ""

    # 处理空输入或超时
    if [[ -z "$choice" ]]; then
        echo -e "${YELLOW}未输入选项，继续显示菜单${NC}"
        continue
    fi

    case $choice in
        1) code_review ;;
        2) analyze_status ;;
        3) troubleshoot ;;
        4) architecture_advice ;;
        5) generate_docs ;;
        6)
            read -p "请输入您的问题: " custom_question
            ask_claude "$custom_question"
            ;;
        0)
            echo -e "${GREEN}感谢使用YY-Cube AI开发助手！${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}无效选项，请重新选择${NC}"
            ;;
    esac

    echo ""
    read -p "按回车键继续..."
done