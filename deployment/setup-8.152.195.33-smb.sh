#!/bin/bash

# 为8.152.195.33配置与现有NAS完全一致的SMB服务
# 目标：smb://8.152.195.33/ 替代 smb://8.130.127.121/

set -e

# 服务器配置
ECS_IP="8.152.195.33"
SHARED_NAME="shared"
ECS_USER="root"
SHARED_PATH="/opt/nas-shared"
SMB_USER="nasuser"
SMB_PASSWORD="NasUser2024"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 为8.152.195.33配置SMB服务${NC}"
echo "=================================="
echo "服务器IP: $ECS_IP"
echo "共享名称: $SHARED_NAME"
echo "访问地址: smb://$ECS_IP/"
echo ""

# 测试服务器连接
test_server_connection() {
    echo -e "${BLUE}🔗 测试服务器连接...${NC}"

    if ping -c 1 "$ECS_IP" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务器网络连通正常${NC}"
    else
        echo -e "${RED}❌ 无法连接到服务器: $ECS_IP${NC}"
        echo "请检查："
        echo "1. 服务器IP是否正确"
        echo "2. 服务器是否已启动"
        echo "3. 网络连接是否正常"
        exit 1
    fi
}

# 生成服务器端配置脚本
generate_server_config() {
    echo -e "${BLUE}📁 生成服务器SMB配置脚本...${NC}"

    cat > setup-8.152.195.33-smb-server.sh << EOF
#!/bin/bash
# 在8.152.195.33服务器上执行的SMB配置脚本

set -e

echo "🚀 在8.152.195.33上配置SMB服务"
echo "================================="

# 系统信息
echo "📋 系统信息:"
echo "操作系统: \$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "内核版本: \$(uname -r)"
echo "当前时间: \$(date)"
echo ""

# 更新系统
echo "📦 更新系统包..."
if command -v apt >/dev/null 2>&1; then
    apt update && apt upgrade -y
    apt install -y samba samba-common cifs-utils
elif command -v yum >/dev/null 2>&1; then
    yum update -y
    yum install -y samba samba-client samba-common cifs-utils
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

# 创建共享目录
echo "📁 创建共享目录..."
mkdir -p $SHARED_PATH
chmod 777 $SHARED_PATH
chown -R nobody:nobody $SHARED_PATH

# 备份并配置Samba
echo "⚙️ 配置Samba服务..."
cp /etc/samba/smb.conf /etc/samba/smb.conf.backup 2>/dev/null || true

# 创建与现有NAS兼容的SMB配置
cat > /etc/samba/smb.conf << 'SAMBAEOF'
[global]
    workgroup = WORKGROUP
    server string = YYC3 NAS Server (8.152.195.33)
    security = user
    map to guest = Bad User
    guest account = nobody
    create mask = 0664
    directory mask = 0775
    force create mode = 0664
    force directory mode = 0775
    browsable = yes
    writable = yes

    # 性能优化
    socket options = TCP_NODELAY IPTOS_LOWDELAY SO_KEEPALIVE
    read raw = yes
    write raw = yes
    max xmit = 65535

    # 日志配置
    log level = 1
    log file = /var/log/samba/log.%m
    max log size = 50

[$SHARED_NAME]
    comment = YYC3 Shared Storage
    path = $SHARED_PATH
    browseable = yes
    writable = yes
    guest ok = yes
    read only = no
    create mask = 0664
    directory mask = 0775
    force user = nobody
    force group = nobody

    # 权限设置
    vfs objects = full_audit
    full_audit:success = connect disconnect mkdir rmdir read write rename
    full_audit:failure = connect
    full_audit:prefix = %u|%I
    full_audit:facility = local5
    full_audit:priority = notice
SAMBAEOF

# 创建Samba用户
echo "👤 创建Samba用户..."
if ! id "$SMB_USER" &>/dev/null; then
    useradd $SMB_USER -s /sbin/nologin
fi

# 设置Samba密码
echo -e "$SMB_PASSWORD\n$SMB_PASSWORD" | smbpasswd -a $SMB_USER

# SELinux配置 (如果启用)
if command -v getenforce >/dev/null 2>&1; then
    if [ "\$(getenforce)" != "Disabled" ]; then
        echo "🔒 配置SELinux..."
        setsebool -P samba_enable_home_dirs on
        setsebool -P samba_export_all_rw on
    fi
fi

# 配置防火墙
echo "🔥 配置防火墙..."
if command -v firewall-cmd >/dev/null 2>&1; then
    systemctl start firewalld
    systemctl enable firewalld

    firewall-cmd --permanent --add-service=samba
    firewall-cmd --permanent --add-port=445/tcp
    firewall-cmd --permanent --add-port=139/tcp
    firewall-cmd --permanent --add-port=137/udp
    firewall-cmd --permanent --add-port=138/udp
    firewall-cmd --reload

    echo "✅ Firewalld防火墙配置完成"
elif command -v ufw >/dev/null 2>&1; then
    ufw allow 445/tcp
    ufw allow 139/tcp
    ufw allow 137/udp
    ufw allow 138/udp
    ufw reload

    echo "✅ UFW防火墙配置完成"
else
    echo "⚠️ 未检测到防火墙管理工具，请手动开放端口445,139"
fi

# 启动Samba服务
echo "🚀 启动Samba服务..."
systemctl enable smb nmb
systemctl restart smb nmb

# 等待服务启动
sleep 5

# 验证服务状态
echo "📊 验证服务状态..."
echo "SMB服务状态:"
systemctl status smb --no-pager -l
echo ""
echo "NMB服务状态:"
systemctl status nmb --no-pager -l
echo ""

# 测试SMB共享
echo "🔍 测试SMB共享..."
smbclient -L localhost -N

# 检查端口监听
echo "📡 检查端口监听..."
netstat -tlnp | grep -E ':(445|139)'

# 测试本地挂载
echo "🔧 测试本地挂载..."
mkdir -p /tmp/test-mount
if mount -t cifs //localhost/$SHARED_NAME /tmp/test-mount -o guest 2>/dev/null; then
    echo "✅ 本地挂载测试成功"
    umount /tmp/test-mount 2>/dev/null || true
else
    echo "⚠️ 本地挂载测试失败，但服务可能仍正常"
fi

echo ""
echo "🎉 SMB服务配置完成！"
echo "====================="
echo "服务器地址: $ECS_IP"
echo "SMB地址: smb://$ECS_IP/"
echo "共享名称: $SHARED_NAME"
echo "共享路径: $SHARED_PATH"
echo "用户名: $SMB_USER"
echo "密码: $SMB_PASSWORD"
echo ""
echo "🍎 Mac连接方式:"
echo "1. 访达 → 前往 → 连接服务器"
echo "2. 输入: smb://$ECS_IP/"
echo "3. 选择guest或输入用户名密码"
echo ""
echo "📂 在其他设备上连接:"
echo "iOS: 文件App → 连接服务器 → smb://$ECS_IP/"
echo "Windows: \\\\\\\\$ECS_IP\\\\$SHARED_NAME"
echo "Linux: smbclient //$ECS_IP/$SHARED_NAME -U $SMB_USER"
EOF

    chmod +x setup-8.152.195.33-smb-server.sh
    echo -e "${GREEN}✅ 服务器配置脚本已生成: setup-8.152.195.33-smb-server.sh${NC}"
}

# 生成一键部署脚本
generate_deploy_script() {
    echo -e "${BLUE}🚀 生成一键部署脚本...${NC}"

    cat > deploy-smb-to-8.152.195.33.sh << 'EOF'
#!/bin/bash
# 一键部署SMB服务到8.152.195.33

echo "🚀 一键部署SMB服务到8.152.195.33"
echo "=================================="

# 检查SSH连接
if ! ping -c 1 8.152.195.33 >/dev/null 2>&1; then
    echo "❌ 无法连接到8.152.195.33，请检查网络"
    exit 1
fi

echo "📡 传输配置脚本到服务器..."
scp setup-8.152.195.33-smb-server.sh root@8.152.195.33:/tmp/

echo "⚙️ 在服务器上执行SMB配置..."
ssh root@8.152.195.33 "chmod +x /tmp/setup-8.152.195.33-smb-server.sh && /tmp/setup-8.152.195.33-smb-server.sh"

echo ""
echo "✅ SMB服务部署完成！"
echo ""
echo "📋 连接信息:"
echo "SMB地址: smb://8.152.195.33/"
echo "共享名称: shared"
echo "用户名: nasuser"
echo "密码: NasUser2024"
echo ""
echo "🍎 Mac连接:"
echo "访达 → 前往 → 连接服务器 → smb://8.152.195.33/"
EOF

    chmod +x deploy-smb-to-8.152.195.33.sh
    echo -e "${GREEN}✅ 一键部署脚本已生成: deploy-smb-to-8.152.195.33.sh${NC}"
}

# 生成Mac连接指南
generate_mac_guide() {
    echo -e "${BLUE}🍎 生成Mac连接指南...${NC}"

    cat > mac-8.152.195.33-connection.md << EOF
# Mac连接8.152.195.33 SMB服务指南

## 🎯 连接目标
- **服务器**: 8.152.195.33
- **协议**: SMB/CIFS
- **共享名称**: shared
- **连接地址**: \`smb://8.152.195.33/\`

---

## 📱 连接步骤

### 方法1: 访达连接 (推荐)
1. 打开**访达**
2. 菜单栏：**前往** → **连接服务器** (快捷键 ⌘K)
3. 输入服务器地址: \`smb://8.152.195.33/\`
4. 点击**连接**
5. 选择连接方式：
   - **访客**: 如果允许匿名访问
   - **注册用户**: 使用以下凭据
     - 用户名: \`nasuser\`
     - 密码: \`NasUser2024\`
6. 选择共享: \`shared\`
7. 点击**连接**

### 方法2: 直接在地址栏输入
1. 打开**访达**
2. 按 **⌘Shift+G** 显示前往对话框
3. 输入: \`smb://8.152.195.33/shared\`
4. 按回车

### 方法3: 添加到收藏夹
1. 按上述方法连接一次
2. 连接成功后，右键点击桌面上的共享图标
3. 选择**添加到收藏夹**
4. 下次直接在收藏夹中点击访问

---

## 🔧 高级配置

### 自动挂载到桌面
\`\`\`bash
# 创建桌面挂载点
mkdir ~/Desktop/Server-Shared

# 创建自动连接脚本
cat > ~/Desktop/Connect-Server.sh << 'SCRIPT'
#!/bin/bash
mount_smbfs //nasuser@8.152.195.33/shared ~/Desktop/Server-Shared
SCRIPT

chmod +x ~/Desktop/Connect-Server.sh
\`\`\`

### 添加到登录项
1. **系统偏好设置** → **用户与群组** → **登录项**
2. 点击 **+** 添加 \`~/Desktop/Connect-Server.sh\`

---

## 📊 连接测试

### 测试命令
\`\`\`bash
# 测试网络连通性
ping 8.152.195.33

# 测试SMB端口
nc -zv 8.152.195.33 445

# 测试SMB共享
smbutil view //8.152.195.33
\`\`\`

### 验证连接成功
1. 在访达中看到服务器共享文件夹
2. 可以创建、编辑、删除文件
3. 文件传输速度正常

---

## 🛠️ 故障排除

### 连接失败
1. **检查网络**: \`ping 8.152.195.33\`
2. **检查端口**: \`nc -zv 8.152.195.33 445\`
3. **检查SMB服务**: 在服务器上运行 \`systemctl status smb\`

### 认证失败
1. 尝试**访客**模式
2. 确认用户名密码: \`nasuser\` / \`NasUser2024\`
3. 检查服务器SMB用户配置

### 权限问题
1. 检查文件夹权限
2. 尝试不同的挂载选项
3. 联系管理员检查SMB配置

### 性能问题
1. 使用有线网络连接
2. 检查服务器负载
3. 考虑使用NFS协议（需要额外配置）

---

## 📱 其他设备连接

### iPhone/iPad
1. 打开**文件**App
2. 点击**浏览**
3. 点击**...** → **连接到服务器**
4. 输入: \`smb://8.152.195.33/\`

### Windows PC
1. 打开**文件资源管理器**
2. 地址栏输入: \\\\\\\\\\\\\\\\\\\\\8.152.195.33\\\\\\\\\\\\shared
3. 或映射网络驱动器

### Android设备
1. 使用**Solid Explorer**等文件管理器
2. 添加网络位置 → SMB/CIFS
3. 服务器: \`8.152.195.33\`
4. 共享: \`shared\`

---

## 📞 技术支持

如果遇到连接问题，请检查：
1. 服务器防火墙配置
2. SMB服务运行状态
3. 网络连通性
4. 用户权限设置

**快速连接地址**: \`smb://8.152.195.33/\`
EOF

    echo -e "${GREEN}✅ Mac连接指南已生成: mac-8.152.195.33-connection.md${NC}"
}

# 显示执行步骤
show_execution_steps() {
    echo ""
    echo -e "${BLUE}📋 执行步骤:${NC}"
    echo ""
    echo "🚀 第一步: 一键部署SMB服务"
    echo "   ./deploy-smb-to-8.152.195.33.sh"
    echo ""
    echo "🍎 第二步: Mac连接测试"
    echo "   访达 → 前往 → 连接服务器"
    echo "   输入: smb://8.152.195.33/"
    echo ""
    echo "📖 第三步: 查看详细指南"
    echo "   cat mac-8.152.195.33-connection.md"
    echo ""
    echo -e "${GREEN}🎯 目标达成:${NC}"
    echo -e "${GREEN}   原: smb://8.130.127.121/${NC}"
    echo -e "${GREEN}   新: smb://8.152.195.33/${NC}"
    echo ""
    echo -e "${BLUE}📁 连接信息:${NC}"
    echo "   地址: smb://8.152.195.33/"
    echo "   用户: nasuser"
    echo "   密码: NasUser2024"
    echo "   共享: shared"
}

# 主函数
main() {
    test_server_connection
    generate_server_config
    generate_deploy_script
    generate_mac_guide
    show_execution_steps

    echo ""
    echo -e "${GREEN}✅ 8.152.195.33 SMB配置方案准备完成！${NC}"
    echo -e "${YELLOW}💡 现在可以执行部署了:${NC}"
    echo "   ./deploy-smb-to-8.152.195.33.sh"
}

# 运行主函数
main "$@"