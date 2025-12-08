#!/bin/bash

# 8.152.195.33 连接诊断和故障排除脚本

ECS_IP="8.152.195.33"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 8.152.195.33 连接诊断${NC}"
echo "==============================="

# 网络连通性测试
echo -e "${BLUE}📡 网络连通性测试${NC}"
echo "=================="

echo "1. ICMP Ping测试..."
if ping -c 3 $ECS_IP >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Ping测试通过${NC}"
    ping -c 3 $ECS_IP | tail -1
else
    echo -e "${RED}❌ Ping测试失败${NC}"
    echo "服务器可能未开机或网络不通"
fi

echo ""
echo "2. 端口连通性测试..."

# 测试常用端口
declare -A PORTS=(
    ["22"]="SSH"
    ["80"]="HTTP"
    ["443"]="HTTPS"
    ["445"]="SMB"
    ["139"]="SMB"
    ["3389"]="RDP"
    ["3306"]="MySQL"
    ["5432"]="PostgreSQL"
)

for port in "${!PORTS[@]}"; do
    service_name="${PORTS[$port]}"
    if timeout 5 bash -c "</dev/tcp/$ECS_IP/$port}" 2>/dev/null; then
        echo -e "${GREEN}✅ 端口 $port ($service_name) 开放${NC}"
    else
        echo -e "${RED}❌ 端口 $port ($service_name) 关闭或不可达${NC}"
    fi
done

echo ""
echo -e "${BLUE}🔍 深度诊断${NC}"
echo "============"

echo "3. 域名解析测试..."
if nslookup $ECS_IP >/dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS解析正常${NC}"
else
    echo -e "${YELLOW}⚠️ DNS解析可能有问题${NC}"
fi

echo ""
echo "4. 路由追踪..."
if command -v traceroute >/dev/null 2>&1; then
    echo "路由路径到 $ECS_IP:"
    traceroute -m 10 $ECS_IP 2>/dev/null | head -5
    echo "..."
else
    echo -e "${YELLOW}⚠️ traceroute命令不可用${NC}"
fi

echo ""
echo -e "${BLUE}📋 故障排查建议${NC}"
echo "=================="

echo -e "${YELLOW}如果服务器不可达，请检查:${NC}"
echo ""
echo "1. 🖥️  服务器状态"
echo "   - 服务器是否已启动"
echo "   - 操作系统是否正常运行"
echo "   - 是否处于维护状态"
echo ""
echo "2. 🌐 网络配置"
echo "   - 公网IP是否正确: $ECS_IP"
echo "   - 安全组是否配置正确"
echo "   - 防火墙规则是否允许访问"
echo ""
echo "3. 🔐 云服务商配置"
echo "   - 阿里云ECS控制台检查实例状态"
echo "   - 确认带宽和网络配置"
echo "   - 检查是否欠费或被限制"
echo ""
echo "4. 📍 本地网络"
echo "   - 检查本地网络连接"
echo "   - 确认没有网络策略限制"
echo "   - 尝试使用VPN或其他网络"

echo ""
echo -e "${BLUE}🛠️ 手动验证步骤${NC}"
echo "=================="

echo "1. 在浏览器中访问:"
echo "   http://$ECS_IP"
echo "   https://$ECS_IP"
echo ""
echo "2. SSH连接测试:"
echo "   ssh root@$ECS_IP"
echo ""
echo "3. 使用其他工具测试:"
echo "   telnet $ECS_IP 22"
echo "   nc -zv $ECS_IP 22"

echo ""
echo -e "${GREEN}📞 联系技术支持${NC}"
echo "如果问题持续存在，请准备以下信息联系技术支持:"
echo "- 服务器IP: $ECS_IP"
echo "- 本地公网IP: $(curl -s ifconfig.me 2>/dev/null || echo '未知')"
echo "- 诊断时间: $(date)"
echo "- 错误信息: 服务器不可达"

echo ""
echo -e "${BLUE}🔄 重新测试${NC}"
echo "============"
echo "如需重新测试，请再次运行此脚本:"
echo "./8.152.195.33-connectivity-diagnostic.sh"