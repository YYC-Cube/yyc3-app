#!/bin/bash

# 阿里云ECS存储服务设置脚本
# 支持SMB/NFS/WebDAV/FTP多种连接方式

set -e

# 配置
ECS_IP="YOUR_ECS_IP_HERE"
ECS_USER="root"
ECS_PASSWORD="YOUR_ECS_PASSWORD"
SHARED_PATH="/opt/yyc3-shared"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 阿里云ECS存储服务配置${NC}"
echo "================================"
echo "ECS地址: $ECS_IP"
echo "共享路径: $SHARED_PATH"
echo ""

# 检查ECS连接
check_ecs_connection() {
    echo -e "${BLUE}🔍 检查ECS连接...${NC}"

    if [ "$ECS_IP" = "YOUR_ECS_IP_HERE" ]; then
        echo -e "${RED}❌ 请先设置ECS_IP地址${NC}"
        echo "编辑脚本，将 YOUR_ECS_IP_HERE 替换为实际ECS公网IP"
        exit 1
    fi

    if ping -c 1 "$ECS_IP" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ ECS网络连通正常${NC}"
    else
        echo -e "${RED}❌ 无法连接到ECS: $ECS_IP${NC}"
        exit 1
    fi
}

# 生成SMB配置脚本
generate_smb_setup() {
    echo -e "${BLUE}📁 生成SMB配置脚本...${NC}"

    cat > setup-smb-on-ecs.sh << EOF
#!/bin/bash
# 在ECS上执行的SMB安装脚本

# 安装Samba
yum install -y samba samba-client

# 创建共享目录
mkdir -p $SHARED_PATH
chmod 777 $SHARED_PATH

# 配置Samba
cat >> /etc/samba/smb.conf << 'SAMBAEOF'

[yyc3-shared]
    comment = YYC3 Project Shared Storage
    path = $SHARED_PATH
    browseable = yes
    writable = yes
    guest ok = yes
    read only = no
    create mask = 0664
    directory mask = 0775
SAMBAEOF

# 设置Samba用户密码
echo -e "设置smb用户密码..."
smbpasswd -a $ECS_USER

# 启动Samba服务
systemctl enable smb nmb
systemctl start smb nmb

# 配置防火墙
firewall-cmd --permanent --add-service=samba
firewall-cmd --reload

echo "✅ SMB配置完成"
echo "Mac访达连接: smb://$ECS_IP/yyc3-shared"
EOF

    chmod +x setup-smb-on-ecs.sh
    echo -e "${GREEN}✅ SMB配置脚本已生成: setup-smb-on-ecs.sh${NC}"
}

# 生成NFS配置脚本
generate_nfs_setup() {
    echo -e "${BLUE}🔄 生成NFS配置脚本...${NC}"

    cat > setup-nfs-on-ecs.sh << EOF
#!/bin/bash
# 在ECS上执行的NFS安装脚本

# 安装NFS服务
yum install -y nfs-utils

# 创建共享目录
mkdir -p $SHARED_PATH
chmod 777 $SHARED_PATH

# 配置NFS共享
cat >> /etc/exports << NFSEOF
$SHARED_PATH *(rw,sync,no_subtree_check,no_root_squash)
NFSEOF

# 启动NFS服务
systemctl enable rpcbind nfs-server
systemctl start rpcbind nfs-server

# 重新加载exports配置
exportfs -ra

# 配置防火墙
firewall-cmd --permanent --add-service=nfs
firewall-cmd --permanent --add-service=mountd
firewall-cmd --permanent --add-service=rpc-bind
firewall-cmd --reload

echo "✅ NFS配置完成"
echo "Mac连接方式:"
echo "1. 终端: sudo mount -t nfs $ECS_IP:$SHARED_PATH /mnt/ecs"
echo "2. 访达: nfs://$ECS_IP$SHARED_PATH"
EOF

    chmod +x setup-nfs-on-ecs.sh
    echo -e "${GREEN}✅ NFS配置脚本已生成: setup-nfs-on-ecs.sh${NC}"
}

# 生成WebDAV配置脚本
generate_webdav_setup() {
    echo -e "${BLUE}🌐 生成WebDAV配置脚本...${NC}"

    cat > setup-webdav-on-ecs.sh << EOF
#!/bin/bash
# 在ECS上执行的WebDAV安装脚本

# 安装Apache和WebDAV模块
yum install -y httpd

# 启用WebDAV模块
cat > /etc/httpd/conf.d/webdav.conf << 'WEBDAVEOF'
LoadModule dav_module modules/mod_dav.so
LoadModule dav_fs_module modules/mod_dav_fs.so
LoadModule dav_lock_module modules/mod_dav_lock.so

DAVLockDB /var/lib/dav/lockdb

<VirtualHost *:80>
    ServerName webdav.yyc3.local
    DocumentRoot /var/www/webdav

    <Directory /var/www/webdav>
        DAV On
        Options +Indexes
        AuthType Basic
        AuthName "YYC3 WebDAV"
        AuthUserFile /etc/httpd/webdav.passwd
        Require valid-user
    </Directory>
</VirtualHost>
WEBDAVEOF

# 创建WebDAV目录
mkdir -p /var/www/webdav
mkdir -p /var/lib/dav
chown -R apache:apache /var/www/webdav /var/lib/dav

# 创建用户密码
htpasswd -c /etc/httpd/webdav.passwd $ECS_USER

# 启动Apache
systemctl enable httpd
systemctl start httpd

# 配置防火墙
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

echo "✅ WebDAV配置完成"
echo "Mac访达连接: http://$ECS_IP/webdav/"
echo "用户名: $ECS_USER"
EOF

    chmod +x setup-webdav-on-ecs.sh
    echo -e "${GREEN}✅ WebDAV配置脚本已生成: setup-webdav-on-ecs.sh${NC}"
}

# 生成Mac连接指南
generate_mac_connection_guide() {
    echo -e "${BLUE}📖 生成Mac连接指南...${NC}"

    cat > mac-connection-guide.md << 'EOF'
# Mac连接阿里云ECS存储指南

## 🔄 SMB连接 (推荐，类似您的NAS)

### 1. 在访达中连接
```
前往 -> 连接服务器
输入: smb://ECS_IP地址/yyc3-shared
```

### 2. 在终端挂载
```bash
# 创建挂载点
sudo mkdir /mnt/ecs-smb

# 挂载SMB共享
sudo mount -t smbfs //ECS_IP地址/yyc3-shared /mnt/ecs-smb
```

## 🌐 NFS连接 (Linux原生，性能更好)

### 1. 在访达中连接
```
前往 -> 连接服务器
输入: nfs://ECS_IP地址/opt/yyc3-shared
```

### 2. 在终端挂载
```bash
# 创建挂载点
sudo mkdir /mnt/ecs-nfs

# 挂载NFS共享
sudo mount -t nfs ECS_IP地址:/opt/yyc3-shared /mnt/ecs-nfs
```

## 📡 WebDAV连接 (HTTP协议)

### 1. 在访达中连接
```
前往 -> 连接服务器
输入: http://ECS_IP地址/webdav/
```

### 2. 使用第三方客户端
- **Cyberduck**: 免费的WebDAV客户端
- **ForkLift**: 强大的文件管理器
- **Commander One**: Mac双栏文件管理器

## 🔒 SFTP连接 (安全文件传输)

### 1. 在访达中连接
```
前往 -> 连接服务器
输入: sftp://root@ECS_IP地址/
```

### 2. 使用专用客户端
- **FileZilla**: 免费FTP/SFTP客户端
- **Transmit**: 专业的Mac文件传输工具
- **Terminal**: 命令行sftp

## 📱 移动设备连接

### iOS
- **File.app**: 内置支持SMB/WebDAV
- **Documents by Readdle**: 支持多种协议

### Android
- **Solid Explorer**: 支持SMB/NFS/WebDAV
- **X-plore File Manager**: 多协议支持

## 🔧 自动挂载配置

### 开机自动挂载 (macOS)
```bash
# 编辑fstab
sudo vifs

# 添加挂载条目
ECS_IP地址:/opt/yyc3-shared /mnt/ecs nfs auto,nolock,hard,intr 0 0
```

## 📊 性能对比

| 协议 | 速度 | 兼容性 | 安全性 | 推荐场景 |
|------|------|--------|--------|----------|
| SMB | 中等 | 最好 | 中等 | 日常文件共享 |
| NFS | 最快 | 好 | 低 | 开发环境同步 |
| WebDAV | 慢 | 很好 | 高 | 跨平台访问 |
| SFTP | 中等 | 很好 | 最高 | 安全文件传输 |

## 🛠️ 故障排除

### SMB连接问题
1. 检查防火墙：端口445, 139
2. 确认Samba服务运行：`systemctl status smb`
3. 检查SELinux：`setenforce 0`

### NFS连接问题
1. 检查rpcbind服务：`systemctl status rpcbind`
2. 确认exports配置：`exportfs -v`
3. 检查防火墙：端口2049, 111

### WebDAV连接问题
1. 检查Apache状态：`systemctl status httpd`
2. 确认认证配置：`htpasswd /etc/httpd/webdav.passwd username`
3. 检查权限：`chown -R apache:apache /var/www/webdav`
EOF

    echo -e "${GREEN}✅ Mac连接指南已生成: mac-connection-guide.md${NC}"
}

# 生成一键部署脚本
generate_one_click_deploy() {
    echo -e "${BLUE}🚀 生成一键部署脚本...${NC}"

    cat > deploy-all-storage.sh << EOF
#!/bin/bash
# 一键部署所有存储服务到ECS

echo "🚀 YYC3阿里云ECS存储服务一键部署"
echo "================================"

if [ "\$1" = "" ]; then
    echo "用法: \$0 <ECS_IP地址>"
    echo "示例: \$0 47.98.123.456"
    exit 1
fi

ECS_IP="\$1"

echo "📡 连接到ECS: \$ECS_IP"

# 传输脚本到ECS
scp setup-smb-on-ecs.sh root@\$ECS_IP:/tmp/
scp setup-nfs-on-ecs.sh root@\$ECS_IP:/tmp/
scp setup-webdav-on-ecs.sh root@\$ECS_IP:/tmp/

# 执行SMB安装
echo "📁 安装SMB服务..."
ssh root@\$ECS_IP "chmod +x /tmp/setup-smb-on-ecs.sh && /tmp/setup-smb-on-ecs.sh"

# 执行NFS安装
echo "🔄 安装NFS服务..."
ssh root@\$ECS_IP "chmod +x /tmp/setup-nfs-on-ecs.sh && /tmp/setup-nfs-on-ecs.sh"

# 执行WebDAV安装
echo "🌐 安装WebDAV服务..."
ssh root@\$ECS_IP "chmod +x /tmp/setup-webdav-on-ecs.sh && /tmp/setup-webdav-on-ecs.sh"

echo "✅ 所有存储服务部署完成！"
echo ""
echo "📋 连接地址:"
echo "SMB: smb://\$ECS_IP/yyc3-shared"
echo "NFS: nfs://\$ECS_IP/opt/yyc3-shared"
echo "WebDAV: http://\$ECS_IP/webdav/"
EOF

    chmod +x deploy-all-storage.sh
    echo -e "${GREEN}✅ 一键部署脚本已生成: deploy-all-storage.sh${NC}"
}

# 显示使用说明
show_usage() {
    echo -e "${BLUE}📖 使用说明:${NC}"
    echo ""
    echo "1. 📝 设置ECS信息:"
    echo "   编辑脚本，将 ECS_IP 设置为您的ECS公网IP"
    echo ""
    echo "2. 🚀 一键部署:"
    echo "   ./deploy-all-storage.sh <ECS_IP地址>"
    echo ""
    echo "3. 📁 手动部署 (选择其中一种):"
    echo "   - SMB: ./setup-smb-on-ecs.sh"
    echo "   - NFS: ./setup-nfs-on-ecs.sh"
    echo "   - WebDAV: ./setup-webdav-on-ecs.sh"
    echo ""
    echo "4. 📖 查看连接指南:"
    echo "   cat mac-connection-guide.md"
    echo ""
    echo -e "${YELLOW}⚠️ 注意: 请确保ECS安全组已开放相应端口${NC}"
    echo "   SMB: 445, 139"
    echo "   NFS: 2049, 111"
    echo "   WebDAV: 80, 443"
}

# 主函数
main() {
    check_ecs_connection
    generate_smb_setup
    generate_nfs_setup
    generate_webdav_setup
    generate_mac_connection_guide
    generate_one_click_deploy
    show_usage

    echo ""
    echo -e "${GREEN}🎉 所有配置脚本已生成完成！${NC}"
}

# 运行主函数
main "$@"