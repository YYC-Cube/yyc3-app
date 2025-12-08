#!/bin/bash

# NAS部署模拟和备用方案 - 用于解决8.152.195.33连接问题

set -e

ECS_IP="8.152.195.33"
LOCAL_PORT_START=8450
SIMULATION_DIR="/tmp/nas-simulation"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔄 NAS部署模拟和备用方案${NC}"
echo "=============================="
echo "目标: 8.152.195.33"
echo "用途: SMB服务部署和连接测试"
echo ""

# 创建模拟环境
create_simulation_environment() {
    echo -e "${CYAN}🏗️ 创建本地NAS模拟环境${NC}"
    echo "=========================="

    mkdir -p "$SIMULATION_DIR"
    cd "$SIMULATION_DIR"

    # 创建模拟的SMB目录结构
    mkdir -p shared/{documents,downloads,projects,backups,temp}

    # 创建测试文件
    echo "NAS模拟环境 - $(date)" > shared/readme.txt
    echo "这是一个本地模拟的NAS环境" >> shared/readme.txt
    echo "用于测试和验证SMB配置" >> shared/readme.txt

    # 创建配置文件目录
    mkdir -p configs logs

    echo -e "${GREEN}✅ 模拟环境创建完成${NC}"
    echo "位置: $SIMULATION_DIR"
}

# 生成本地SMB服务器配置
generate_local_smb_config() {
    echo -e "${CYAN}⚙️ 生成本地SMB配置${NC}"
    echo "========================"

    cat > configs/smb.conf << 'EOF'
[global]
    workgroup = WORKGROUP
    server string = YYC3 NAS Simulation
    security = user
    map to guest = Bad User
    guest account = nobody
    create mask = 0664
    directory mask = 0775
    browsable = yes
    writable = yes

    # 性能优化
    socket options = TCP_NODELAY IPTOS_LOWDELAY SO_KEEPALIVE
    read raw = yes
    write raw = yes
    max xmit = 65535

[shared]
    comment = YYC3 Shared Storage (Simulation)
    path = /tmp/nas-simulation/shared
    browseable = yes
    writable = yes
    guest ok = yes
    read only = no
    create mask = 0664
    directory mask = 0775
    force user = nobody
    force group = nobody
EOF

    echo -e "${GREEN}✅ SMB配置文件已生成${NC}"
}

# 生成服务器端部署脚本
generate_server_deploy_script() {
    echo -e "${CYAN}📦 生成服务器部署脚本${NC}"
    echo "========================"

    cat > deploy-to-server.sh << EOF
#!/bin/bash
# 部署SMB服务到8.152.195.33

ECS_IP="$ECS_IP"
ECS_USER="root"

echo "🚀 部署SMB服务到 \$ECS_IP"
echo "========================"

# 检查连接
echo "📡 检查服务器连接..."
if ! ping -c 1 \$ECS_IP >/dev/null 2>&1; then
    echo "❌ 服务器不可达: \$ECS_IP"
    echo "请检查:"
    echo "1. 服务器是否已启动"
    echo "2. IP地址是否正确"
    echo "3. 网络连接是否正常"
    exit 1
fi

echo "✅ 服务器可达"

# 检查SSH
echo "🔑 检查SSH连接..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes \$ECS_USER@\$ECS_IP "echo SSH连接成功" >/dev/null 2>&1; then
    echo "❌ SSH连接失败"
    echo "请检查:"
    echo "1. SSH服务是否运行 (端口22)"
    echo "2. SSH密钥是否配置"
    echo "3. 安全组是否开放22端口"
    echo "4. 用户名是否正确: \$ECS_USER"
    exit 1
fi

echo "✅ SSH连接正常"

# 传输配置文件
echo "📤 传输SMB配置到服务器..."
cat > /tmp/smb-remote-setup.sh << 'REMOTE'
#!/bin/bash
# 远程服务器上的SMB设置脚本

set -e

echo "🔧 在服务器上配置SMB服务"

# 更新系统
if command -v apt >/dev/null 2>&1; then
    apt update
    apt install -y samba samba-common cifs-utils
elif command -v yum >/dev/null 2>&1; then
    yum update -y
    yum install -y samba samba-client samba-common cifs-utils
fi

# 创建共享目录
mkdir -p /opt/nas-shared
chmod 777 /opt/nas-shared
chown nobody:nobody /opt/nas-shared

# 备份现有配置
cp /etc/samba/smb.conf /etc/samba/smb.conf.backup 2>/dev/null || true

# 创建SMB配置
cat > /etc/samba/smb.conf << 'SAMBAEOF'
[global]
    workgroup = WORKGROUP
    server string = YYC3 NAS Server (8.152.195.33)
    security = user
    map to guest = Bad User
    guest account = nobody
    create mask = 0664
    directory mask = 0775
    browsable = yes
    writable = yes

    # 性能优化
    socket options = TCP_NODELAY IPTOS_LOWDELAY SO_KEEPALIVE
    read raw = yes
    write raw = yes
    max xmit = 65535

[shared]
    comment = YYC3 Shared Storage
    path = /opt/nas-shared
    browseable = yes
    writable = yes
    guest ok = yes
    read only = no
    create mask = 0664
    directory mask = 0775
    force user = nobody
    force group = nobody
SAMBAEOF

# 创建Samba用户
useradd nasuser -s /sbin/nologin 2>/dev/null || true
echo "NasUser2024" | smbpasswd -a nasuser -s

# 配置防火墙
if command -v firewall-cmd >/dev/null 2>&1; then
    systemctl start firewalld 2>/dev/null || true
    firewall-cmd --permanent --add-service=samba
    firewall-cmd --permanent --add-port=445/tcp
    firewall-cmd --permanent --add-port=139/tcp
    firewall-cmd --reload 2>/dev/null || true
fi

# 启动服务
systemctl enable smb nmb 2>/dev/null || true
systemctl restart smb nmb 2>/dev/null || true

# 创建测试文件
echo "SMB服务配置完成 - \$(date)" > /opt/nas-shared/test.txt

# 检查服务状态
sleep 3
systemctl status smb --no-pager | head -3

echo "✅ SMB服务配置完成"
echo "SMB地址: smb://$ECS_IP/"
echo "共享名: shared"
echo "用户: nasuser"
echo "密码: NasUser2024"
REMOTE

# 传输并执行远程脚本
scp /tmp/smb-remote-setup.sh \$ECS_USER@\$ECS_IP:/tmp/
ssh \$ECS_USER@\$ECS_IP "chmod +x /tmp/smb-remote-setup.sh && /tmp/smb-remote-setup.sh"

echo ""
echo "🎉 部署完成!"
echo "=============="
echo "SMB地址: smb://\$ECS_IP/"
echo "测试文件: /opt/nas-shared/test.txt"
EOF

    chmod +x deploy-to-server.sh
    echo -e "${GREEN}✅ 服务器部署脚本已生成${NC}"
    echo "文件: deploy-to-server.sh"
}

# 生成交互式配置工具
generate_interactive_tool() {
    echo -e "${CYAN}🛠️ 生成交互式配置工具${NC}"
    echo "=========================="

    cat > interactive-config.sh << 'EOF'
#!/bin/bash
# 交互式SMB配置工具

ECS_IP="8.152.195.33"

echo "🛠️ YYC3 NAS 交互式配置工具"
echo "========================"
echo ""

echo "📋 当前配置:"
echo "服务器IP: $ECS_IP"
echo "共享名称: shared"
echo "用户名: nasuser"
echo "密码: NasUser2024"
echo ""

echo "🎯 配置选项:"
echo "1. 测试服务器连接"
echo "2. 部署SMB服务"
echo "3. 验证SMB服务"
echo "4. 生成连接指南"
echo "5. 故障排除"
echo "6. 退出"
echo ""

while true; do
    read -p "请选择操作 (1-6): " choice

    case $choice in
        1)
            echo "📡 测试服务器连接..."
            if ping -c 1 $ECS_IP >/dev/null 2>&1; then
                echo "✅ 服务器可达"
            else
                echo "❌ 服务器不可达"
            fi
            ;;
        2)
            echo "🚀 部署SMB服务..."
            ./deploy-to-server.sh
            ;;
        3)
            echo "🔍 验证SMB服务..."
            if nc -zv $ECS_IP 445 2>/dev/null; then
                echo "✅ SMB端口445开放"
            else
                echo "❌ SMB端口445关闭"
            fi
            ;;
        4)
            echo "📖 生成连接指南..."
            echo "Mac连接步骤:"
            echo "1. 访达 → 前往 → 连接服务器"
            echo "2. 输入: smb://$ECS_IP/"
            echo "3. 选择guest或输入用户名密码"
            ;;
        5)
            echo "🔧 故障排除..."
            echo "1. 检查服务器IP: ping $ECS_IP"
            echo "2. 检查SSH连接: ssh root@$ECS_IP"
            echo "3. 检查防火墙: 端口445,139,22"
            echo "4. 检查SMB服务: systemctl status smb"
            ;;
        6)
            echo "👋 退出"
            exit 0
            ;;
        *)
            echo "❌ 无效选择，请重新选择"
            ;;
    esac
    echo ""
done
EOF

    chmod +x interactive-config.sh
    echo -e "${GREEN}✅ 交互式配置工具已生成${NC}"
}

# 生成验证脚本
generate_verification_script() {
    echo -e "${CYAN}🔍 生成验证脚本${NC}"
    echo "=================="

    cat > verify-smb-deployment.sh << EOF
#!/bin/bash
# SMB部署验证脚本

ECS_IP="$ECS_IP"

echo "🔍 SMB部署验证"
echo "=============="
echo "服务器: \$ECS_IP"
echo ""

# 基础连接测试
echo "📡 基础连接测试..."
if ping -c 1 \$ECS_IP >/dev/null 2>&1; then
    echo "✅ ICMP连通正常"
else
    echo "❌ ICMP连通失败"
fi

# 端口测试
echo ""
echo "🔌 端口连通性测试..."

declare -A PORTS=(
    ["22"]="SSH"
    ["80"]="HTTP"
    ["443"]="HTTPS"
    ["445"]="SMB"
    ["139"]="NetBIOS"
)

for port in "\${!PORTS[@]}"; do
    service="\${PORTS[\$port]}"
    if timeout 5 bash -c "</dev/tcp/\$ECS_IP/\$port>" 2>/dev/null; then
        echo "✅ 端口 \$port (\$service) - 开放"
    else
        echo "❌ 端口 \$port (\$service) - 关闭"
    fi
done

# SMB测试
echo ""
echo "🗂️ SMB服务测试..."
if smbclient -L \$ECS_IP -N 2>/dev/null >/dev/null; then
    echo "✅ SMB服务响应正常"
    echo "可用共享:"
    smbclient -L \$ECS_IP -N 2>/dev/null | grep "Sharename" -A 10
else
    echo "❌ SMB服务无响应"
fi

echo ""
echo "📋 连接信息总结:"
echo "==============="
echo "SMB地址: smb://\$ECS_IP/"
echo "共享名称: shared"
echo "用户名: nasuser"
echo "密码: NasUser2024"
echo ""

echo "🍎 Mac连接步骤:"
echo "1. 访达 → 前往 → 连接服务器"
echo "2. 输入: smb://\$ECS_IP/"
echo "3. 选择guest或输入用户名密码"
echo "4. 选择shared共享"
EOF

    chmod +x verify-smb-deployment.sh
    echo -e "${GREEN}✅ 验证脚本已生成${NC}"
}

# 生成Mac连接脚本
generate_mac_connection_script() {
    echo -e "${CYAN}🍎 生成Mac连接脚本${NC}"
    echo "======================"

    cat > connect-mac-smb.sh << 'EOF'
#!/bin/bash
# Mac SMB连接助手

ECS_IP="8.152.195.33"
SHARED_NAME="shared"
MOUNT_POINT="/mnt/nas-8.152.195.33"

echo "🍎 Mac SMB连接助手"
echo "=================="
echo "服务器: $ECS_IP"
echo "共享: $SHARED_NAME"
echo ""

# 检查服务器连通性
echo "📡 检查服务器连通性..."
if ping -c 1 $ECS_IP >/dev/null 2>&1; then
    echo "✅ 服务器可达"
else
    echo "❌ 服务器不可达，请检查网络"
    exit 1
fi

# 检查SMB端口
echo "🔌 检查SMB端口..."
if nc -zv $ECS_IP 445 2>/dev/null; then
    echo "✅ SMB端口445开放"
else
    echo "❌ SMB端口445关闭"
    exit 1
fi

# 创建挂载点
echo "📁 创建挂载点..."
sudo mkdir -p $MOUNT_POINT

# 挂载SMB共享
echo "🔗 挂载SMB共享..."
if sudo mount -t smbfs //guest@$ECS_IP/$SHARED_NAME $MOUNT_POINT; then
    echo "✅ SMB挂载成功"
    echo "挂载点: $MOUNT_POINT"
    echo ""
    echo "📂 访问文件:"
    ls -la $MOUNT_POINT
    echo ""
    echo "🔌 卸载命令:"
    echo "sudo umount $MOUNT_POINT"
else
    echo "❌ SMB挂载失败"
    echo "尝试使用用户名密码..."
    if sudo mount -t smbfs //nasuser@ECS_IP/$SHARED_NAME $MOUNT_POINT; then
        echo "✅ 用户认证挂载成功"
    else
        echo "❌ 所有挂载方式都失败"
        exit 1
    fi
fi
EOF

    chmod +x connect-mac-smb.sh
    echo -e "${GREEN}✅ Mac连接脚本已生成${NC}"
}

# 显示完成信息
show_completion_info() {
    echo ""
    echo -e "${GREEN}🎉 NAS部署方案生成完成！${NC}"
    echo "================================"
    echo ""
    echo -e "${BLUE}📁 生成的文件:${NC}"
    echo "1. deploy-to-server.sh - 服务器部署脚本"
    echo "2. interactive-config.sh - 交互式配置工具"
    echo "3. verify-smb-deployment.sh - 部署验证脚本"
    echo "4. connect-mac-smb.sh - Mac连接助手"
    echo ""
    echo -e "${BLUE}🚀 执行步骤:${NC}"
    echo "1. 测试服务器: ./verify-smb-deployment.sh"
    echo "2. 部署SMB: ./deploy-to-server.sh"
    echo "3. 验证服务: ./verify-smb-deployment.sh"
    echo "4. Mac连接: ./connect-mac-smb.sh"
    echo ""
    echo -e "${BLUE}📊 连接信息:${NC}"
    echo "服务器: $ECS_IP"
    echo "SMB地址: smb://$ECS_IP/"
    echo "共享名称: shared"
    echo "用户名: nasuser"
    echo "密码: NasUser2024"
    echo ""
    echo -e "${GREEN}✨ 现在您有了完整的SMB部署解决方案！${NC}"
}

# 主函数
main() {
    create_simulation_environment
    generate_local_smb_config
    generate_server_deploy_script
    generate_interactive_tool
    generate_verification_script
    generate_mac_connection_script
    show_completion_info
}

# 运行主函数
main "$@"