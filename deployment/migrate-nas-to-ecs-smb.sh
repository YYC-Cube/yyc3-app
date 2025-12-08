#!/bin/bash

# NAS迁移到阿里云ECS - 保持完全一致的SMB连接方式
# 目标：smb://8.130.127.121/ → smb://新的ECS_IP/

set -e

# 当前NAS信息 (您的现有配置)
CURRENT_NAS_IP="8.130.127.121"
CURRENT_SMB_PATH="smb://$CURRENT_NAS_IP/"

# 新ECS配置
NEW_ECS_IP="YOUR_NEW_ECS_IP_HERE"  # 设置您的新ECS公网IP
SHARED_NAME="shared"               # 保持与现有NAS一致的共享名
ECS_USER="root"
ECS_PASSWORD="YOUR_PASSWORD"
SHARED_PATH="/opt/nas-migration"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 NAS迁移到阿里云ECS - 保持SMB连接一致性${NC}"
echo "========================================================"
echo "当前NAS: $CURRENT_SMB_PATH"
echo "目标ECS: smb://$NEW_ECS_IP/"
echo "共享名称: $SHARED_NAME"
echo ""

# 检查配置
check_configuration() {
    echo -e "${BLUE}🔍 检查配置...${NC}"

    if [ "$NEW_ECS_IP" = "YOUR_NEW_ECS_IP_HERE" ]; then
        echo -e "${RED}❌ 请先设置新ECS的公网IP地址${NC}"
        echo "编辑此脚本，将 NEW_ECS_IP 设置为您的阿里云ECS公网IP"
        echo ""
        echo "示例: NEW_ECS_IP=\"47.98.123.456\""
        exit 1
    fi

    echo -e "${GREEN}✅ 配置检查通过${NC}"
    echo "迁移路径: $CURRENT_SMB_PATH → smb://$NEW_ECS_IP/"
}

# 测试当前NAS连接
test_current_nas() {
    echo -e "${BLUE}🔗 测试当前NAS连接...${NC}"

    if ping -c 1 "$CURRENT_NAS_IP" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 当前NAS网络连通正常${NC}"
        echo "连接地址: $CURRENT_SMB_PATH"
    else
        echo -e "${YELLOW}⚠️ 当前NAS网络不可达，但继续准备迁移${NC}"
    fi
}

# 测试新ECS连接
test_new_ecs() {
    echo -e "${BLUE}🚀 测试新ECS连接...${NC}"

    if ping -c 1 "$NEW_ECS_IP" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 新ECS网络连通正常${NC}"
        echo "连接地址: smb://$NEW_ECS_IP/"
    else
        echo -e "${RED}❌ 无法连接到新ECS: $NEW_ECS_IP${NC}"
        echo "请检查："
        echo "1. ECS公网IP是否正确"
        echo "2. ECS是否已启动"
        echo "3. 安全组是否配置正确"
        exit 1
    fi
}

# 生成ECS SMB配置脚本
generate_ecs_smb_config() {
    echo -e "${BLUE}📁 生成ECS SMB配置脚本...${NC}"

    cat > configure-ecs-smb.sh << EOF
#!/bin/bash
# 在ECS上配置与现有NAS完全一致的SMB服务

set -e

# ECS配置
SHARED_PATH="$SHARED_PATH"
SHARED_NAME="$SHARED_NAME"
SMB_USER="nasuser"
SMB_PASSWORD="NasMigration2024"

echo "🚀 在ECS上配置SMB服务"
echo "======================"

# 更新系统
yum update -y

# 安装Samba及相关工具
yum install -y samba samba-client samba-common cifs-utils

# 创建共享目录
mkdir -p \$SHARED_PATH
chmod 777 \$SHARED_PATH
chown -R nobody:nobody \$SHARED_PATH

# 备份原配置
cp /etc/samba/smb.conf /etc/samba/smb.conf.backup

# 配置Samba - 与现有NAS完全一致
cat > /etc/samba/smb.conf << 'SAMBAEOF'
[global]
    workgroup = WORKGROUP
    server string = YYC3 NAS Migration Server
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

[$SHARED_NAME]
    comment = YYC3 Shared Storage (NAS Migration)
    path = \$SHARED_PATH
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
useradd \$SMB_USER -s /sbin/nologin
echo -e "\${SMB_PASSWORD}\n\${SMB_PASSWORD}" | smbpasswd -a \$SMB_USER

# 设置SELinux (如果启用)
setsebool -P samba_enable_home_dirs on
setsebool -P samba_export_all_rw on

# 配置防火墙 - 开放SMB端口
systemctl start firewalld
systemctl enable firewalld

firewall-cmd --permanent --add-service=samba
firewall-cmd --permanent --add-service=smb
firewall-cmd --permanent --add-port=445/tcp
firewall-cmd --permanent --add-port=139/tcp
firewall-cmd --permanent --add-port=137/udp
firewall-cmd --permanent --add-port=138/udp
firewall-cmd --reload

# 启动并启用Samba服务
systemctl enable smb nmb
systemctl restart smb nmb

# 等待服务启动
sleep 3

# 验证SMB服务
systemctl status smb --no-pager
systemctl status nmb --no-pager

# 测试共享
smbclient -L localhost -N

echo ""
echo "✅ ECS SMB配置完成"
echo "===================="
echo "SMB服务地址: smb://$NEW_ECS_IP/"
echo "共享名称: $SHARED_NAME"
echo "本地挂载测试: mkdir -p /mnt/test && mount -t cifs //$NEW_ECS_IP/$SHARED_NAME /mnt/test -o guest"
echo ""
echo "SMB用户信息:"
echo "用户名: \$SMB_USER"
echo "密码: \${SMB_PASSWORD}"
EOF

    chmod +x configure-ecs-smb.sh
    echo -e "${GREEN}✅ ECS SMB配置脚本已生成: configure-ecs-smb.sh${NC}"
}

# 生成数据迁移脚本
generate_migration_script() {
    echo -e "${BLUE}📦 生成数据迁移脚本...${NC}"

    cat > migrate-nas-data.sh << EOF
#!/bin/bash
# NAS数据迁移脚本 - 从现有NAS迁移到ECS

set -e

# NAS和ECS配置
CURRENT_NAS_IP="$CURRENT_NAS_IP"
NEW_ECS_IP="$NEW_ECS_IP"
SHARED_NAME="$SHARED_NAME"
LOCAL_MOUNT_NAS="/mnt/nas-source"
LOCAL_MOUNT_ECS="/mnt/ecs-target"

echo "📦 NAS数据迁移到ECS"
echo "=================="

# 检查依赖
command -v rsync >/dev/null 2>&1 || { echo "需要安装rsync"; yum install -y rsync; }

# 创建本地挂载点
sudo mkdir -p \$LOCAL_MOUNT_NAS \$LOCAL_MOUNT_ECS

# 挂载当前NAS (只读)
echo "🔗 挂载当前NAS..."
sudo mount -t cifs //\$CURRENT_NAS_IP/\$LOCAL_MOUNT_NAS -o ro,guest || {
    echo "⚠️ 无法挂载当前NAS，请手动提供数据源"
    echo "您可以直接将数据复制到 \$LOCAL_MOUNT_ECS"
}

# 挂载ECS共享 (读写)
echo "🚀 挂载ECS共享..."
sudo mount -t cifs //\$NEW_ECS_IP/\$LOCAL_MOUNT_ECS -o rw,guest || {
    echo "❌ 无法挂载ECS共享，请检查SMB配置"
    exit 1
}

# 数据迁移
echo "📦 开始数据迁移..."
if [ -d "\$LOCAL_MOUNT_NAS" ] && [ "\$(ls -A \$LOCAL_MOUNT_NAS)" ]; then
    rsync -avh --progress \$LOCAL_MOUNT_NAS/ \$LOCAL_MOUNT_ECS/
    echo "✅ 数据迁移完成"
else
    echo "⚠️ NAS数据源为空，创建基础目录结构"
    mkdir -p \$LOCAL_MOUNT_ECS/{documents,downloads,projects,backups}
fi

# 卸载
sudo umount \$LOCAL_MOUNT_NAS \$LOCAL_MOUNT_ECS 2>/dev/null || true

echo "🎉 数据迁移完成！"
echo "新SMB地址: smb://\$NEW_ECS_IP/"
EOF

    chmod +x migrate-nas-data.sh
    echo -e "${GREEN}✅ 数据迁移脚本已生成: migrate-nas-data.sh${NC}"
}

# 生成Mac连接指南
generate_mac_connection_guide() {
    echo -e "${BLUE}🍎 生成Mac连接指南...${NC}"

    cat > mac-smb-connection-guide.md << EOF
# Mac SMB连接指南 - 从NAS迁移到ECS

## 🔄 迁移说明

### 迁移前
- 当前连接: \`smb://$CURRENT_NAS_IP/\`
- 访问方式: 访达 → 前往 → 连接服务器

### 迁移后
- 新的连接: \`smb://$NEW_ECS_IP/\`
- 访问方式: 完全相同！

---

## 📁 Mac连接方法

### 方法1: 访达连接 (推荐)
1. 打开**访达**
2. 菜单栏：**前往** → **连接服务器**
3. 输入服务器地址: \`smb://$NEW_ECS_IP/\`
4. 点击**连接**
5. 选择**访客**或输入用户名密码
6. 选择共享文件夹: \`$SHARED_NAME\`

### 方法2: 快捷键
1. 在访达中按 **⌘K**
2. 输入: \`smb://$NEW_ECS_IP/\`
3. 按回车连接

### 方法3: 添加到收藏夹
1. 按上述方法连接一次
2. 右键点击共享图标
3. 选择**添加到收藏夹**
4. 下次直接在收藏夹中点击

---

## 📂 挂载到桌面 (可选)

### 自动挂载到桌面
```bash
# 创建桌面挂载点
mkdir ~/Desktop/ECS-Shared

# 添加到开机启动项
echo "smb://$NEW_ECS_IP/$SHARED_NAME ~/Desktop/ECS-Shared" >> ~/Library/Preferences/com.apple.loginitems.plist
```

### 手动挂载命令
```bash
# 创建挂载点
sudo mkdir /mnt/ecs

# 挂载ECS共享
sudo mount -t smbfs //$NEW_ECS_IP/$SHARED_NAME /mnt/ecs

# 卸载
sudo umount /mnt/ecs
```

---

## 🔧 故障排除

### 连接失败
1. **检查网络**: \`ping $NEW_ECS_IP\`
2. **检查SMB服务**: 在ECS上运行 \`systemctl status smb\`
3. **检查防火墙**: 确保端口445开放

### 认证失败
1. 尝试**访客**连接
2. 使用用户名: \`nasuser\`, 密码: \`NasMigration2024\`
3. 检查ECS上SMB用户配置

### 权限问题
1. 在ECS上检查文件夹权限: \`ls -la $SHARED_PATH\`
2. 重新设置权限: \`chmod 777 $SHARED_PATH\`

---

## 📱 其他设备连接

### iOS设备
1. 打开**文件**App
2. 点击**浏览**
3. 点击**...** → **连接到服务器**
4. 输入: \`smb://$NEW_ECS_IP/\`

### Windows设备
1. 打开**文件资源管理器**
2. 在地址栏输入: \\\\\\\\$NEW_ECS_IP\\\\$SHARED_NAME
3. 或映射网络驱动器

### Android设备
1. 使用**Solid Explorer**等文件管理器
2. 添加网络位置: SMB/CIFS
3. 服务器: \`$NEW_ECS_IP\`
4. 共享: \`$SHARED_NAME\`

---

## 📊 迁移检查清单

- [ ] ECS SMB服务正常运行
- [ ] 防火墙端口已开放(445,139)
- [ ] Mac可以连接新SMB地址
- [ ] 数据迁移完成
- [ ] 所有设备都能访问
- [ ] 备份原NAS数据
- [ ] 更新所有设备上的NAS地址

---

## 🆘 技术支持

如果遇到问题，请检查：
1. ECS控制台：实例状态、安全组配置
2. 网络连通性：ping和telnet测试
3. SMB日志：\`/var/log/samba/\`

连接地址: \`smb://$NEW_ECS_IP/\`
EOF

    echo -e "${GREEN}✅ Mac连接指南已生成: mac-smb-connection-guide.md${NC}"
}

# 生成一键部署脚本
generate_one_click_deploy() {
    echo -e "${BLUE}🚀 生成一键部署脚本...${NC}"

    cat > deploy-nas-to-ecs.sh << EOF
#!/bin/bash
# 一键部署NAS到ECS迁移

echo "🚀 NAS到ECS一键迁移部署"
echo "========================"

if [ "\$1" = "" ]; then
    echo "用法: \$0 <ECS_IP地址>"
    echo "示例: \$0 47.98.123.456"
    exit 1
fi

ECS_IP="\$1"

echo "📡 目标ECS: \$ECS_IP"
echo "📁 保持SMB连接方式一致"
echo ""

# 传输配置脚本到ECS
echo "📤 传输配置脚本到ECS..."
scp configure-ecs-smb.sh root@\$ECS_IP:/tmp/

# 执行SMB配置
echo "⚙️ 在ECS上配置SMB服务..."
ssh root@\$ECS_IP "chmod +x /tmp/configure-ecs-smb.sh && /tmp/configure-ecs-smb.sh"

echo ""
echo "✅ ECS SMB服务配置完成！"
echo ""
echo "📋 新的SMB连接信息:"
echo "连接地址: smb://\$ECS_IP/"
echo "共享名称: $SHARED_NAME"
echo "用户名: nasuser"
echo "密码: NasMigration2024"
echo ""
echo "🍎 Mac连接方式:"
echo "访达 → 前往 → 连接服务器"
echo "输入: smb://\$ECS_IP/"
echo ""
echo "📦 下一步: 执行数据迁移"
echo "./migrate-nas-data.sh"
EOF

    chmod +x deploy-nas-to-ecs.sh
    echo -e "${GREEN}✅ 一键部署脚本已生成: deploy-nas-to-ecs.sh${NC}"
}

# 显示完整迁移流程
show_migration_plan() {
    echo ""
    echo -e "${BLUE}📋 完整迁移流程:${NC}"
    echo ""
    echo "🎯 目标: 保持与现有NAS完全一致的SMB连接体验"
    echo ""
    echo "📝 第一步: 配置ECS"
    echo "   ./deploy-nas-to-ecs.sh <您的ECS公网IP>"
    echo ""
    echo "📦 第二步: 数据迁移"
    echo "   ./migrate-nas-data.sh"
    echo ""
    echo "🍎 第三步: Mac连接测试"
    echo "   访达 → 前往 → 连接服务器"
    echo "   输入: smb://<您的ECS_IP>/"
    echo ""
    echo "📖 第四步: 查看连接指南"
    echo "   cat mac-smb-connection-guide.md"
    echo ""
    echo -e "${GREEN}🎉 迁移完成后，使用方式完全相同：${NC}"
    echo -e "${GREEN}   旧: smb://$CURRENT_NAS_IP/${NC}"
    echo -e "${GREEN}   新: smb://<您的ECS_IP>/${NC}"
}

# 主函数
main() {
    check_configuration
    test_current_nas
    test_new_ecs
    generate_ecs_smb_config
    generate_migration_script
    generate_mac_connection_guide
    generate_one_click_deploy
    show_migration_plan

    echo ""
    echo -e "${GREEN}✅ NAS到ECS迁移方案准备完成！${NC}"
    echo -e "${YELLOW}💡 提醒: 请先将脚本中的 NEW_ECS_IP 设置为您的阿里云ECS公网IP${NC}"
}

# 运行主函数
main "$@"