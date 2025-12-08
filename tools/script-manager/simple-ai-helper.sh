#!/bin/bash
# =============================================================================
# 简化的AI开发助手
# =============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== YY-Cube AI助手简化版 ===${NC}"
echo ""

# 直接与Claude交互的示例命令
echo -e "${GREEN}可用的AI交互方式:${NC}"
echo ""
echo "1. 命令行直接提问:"
echo "   claude-code \"帮我检查FRP服务状态\""
echo ""

echo "2. 项目分析:"
echo "   claude-code \"分析0379.email项目架构\""
echo ""

echo "3. 代码审查:"
echo "   claude-code \"审查apps/api/目录代码\""
echo ""

echo "4. 部署帮助:"
echo "   claude-code \"如何部署微服务到生产环境\""
echo ""

echo "5. 故障排查:"
echo "   claude-code \"服务无法启动，请帮忙排查\""
echo ""

echo -e "${YELLOW}💡 提示: 在/Users/yanyu/www目录下运行上述命令获得最佳效果${NC}"
echo ""

# 提供一个互动选项
read -p "是否要现在向Claude提问? (y/n): " answer

if [[ "$answer" =~ ^[Yy]$ ]]; then
    echo ""
    read -p "请输入您的问题: " question
    echo ""

    if command -v claude-code &> /dev/null; then
        echo -e "${BLUE}🤖 正在咨询Claude...${NC}"
        cd /Users/yanyu/www
        claude-code "$question"
    else
        echo -e "${YELLOW}Claude Code CLI 未安装${NC}"
        echo "请访问: https://claude.ai/chat 使用Web版本"
        echo "或者安装: curl -fsSL https://claude.ai/install.sh | sh"
    fi
else
    echo -e "${GREEN}感谢使用！${NC}"
fi