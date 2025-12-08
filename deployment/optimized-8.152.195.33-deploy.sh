#!/bin/bash

# 优化版8.152.195.33部署脚本 - 包含连接测试、错误处理和重试机制

set -e  # 遇到错误时退出，但我们可以处理特定错误

# 配置
ECS_IP="8.152.195.33"
ECS_USER="root"
TIMEOUT=10
RETRY_COUNT=3
RETRY_DELAY=5

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${CYAN}🔧 $1${NC}"; }

# 重试机制
retry_command() {
    local command="$1"
    local description="$2"
    local attempt=1

    while [ $attempt -le $RETRY_COUNT ]; do
        log_info "$description (尝试 $attempt/$RETRY_COUNT)"

        if eval "$command"; then
            log_success "$description - 成功"
            return 0
        else
            log_warning "$description - 失败 (尝试 $attempt/$RETRY_COUNT)"
            if [ $attempt -lt $RETRY_COUNT ]; then
                log_info "等待 $RETRY_DELAY 秒后重试..."
                sleep $RETRY_DELAY
            fi
        fi

        ((attempt++))
    done

    log_error "$description - 最终失败"
    return 1
}

# 网络连接测试
test_connectivity() {
    log_step "开始网络连接测试"
    echo "=================================="

    # 1. 基本ping测试
    log_info "测试ICMP连通性..."
    if ping -c 1 -W $TIMEOUT $ECS_IP >/dev/null 2>&1; then
        log_success "服务器可以ping通"
        ping_stats=$(ping -c 3 $ECS_IP 2>/dev/null | tail -1)
        echo "   Ping统计: $ping_stats"
    else
        log_warning "服务器无法ping通，但这可能不影响其他服务"
    fi

    # 2. 端口连通性测试
    log_info "测试端口连通性..."

    # 测试关键端口
    declare -A CRITICAL_PORTS=(
        ["22"]="SSH服务"
        ["80"]="HTTP服务"
        ["443"]="HTTPS服务"
    )

    declare -A OPTIONAL_PORTS=(
        ["445"]="SMB服务"
        ["139"]="NetBIOS"
        ["3389"]="RDP服务"
    )

    local critical_success=0
    local total_critical=${#CRITICAL_PORTS[@]}

    echo "关键端口测试:"
    for port in "${!CRITICAL_PORTS[@]}"; do
        service_name="${CRITICAL_PORTS[$port]}"
        if timeout $TIMEOUT bash -c "</dev/tcp/$ECS_IP/$port}" 2>/dev/null; then
            log_success "  端口 $port ($service_name) - 开放"
            ((critical_success++))
        else
            log_error "  端口 $port ($service_name) - 关闭"
        fi
    done

    echo ""
    echo "可选端口测试:"
    for port in "${!OPTIONAL_PORTS[@]}"; do
        service_name="${OPTIONAL_PORTS[$port]}"
        if timeout $TIMEOUT bash -c "</dev/tcp/$ECS_IP/$port}" 2>/dev/null; then
            log_success "  端口 $port ($service_name) - 开放"
        else
            log_warning "  端口 $port ($service_name) - 关闭"
        fi
    done

    # 判断是否有足够的关键端口可用
    if [ $critical_success -eq 0 ]; then
        log_warning "所有关键端口都不可用，可能需要配置安全组"
        return 1
    else
        log_success "检测到 $critical_success/$total_critical 个关键端口可用"
        return 0
    fi
}

# SSH连接测试
test_ssh_connection() {
    log_step "测试SSH连接"
    echo "=================="

    local ssh_cmd="ssh -o ConnectTimeout=$TIMEOUT -o BatchMode=yes $ECS_USER@$ECS_IP 'echo SSH连接成功'"

    if retry_command "$ssh_cmd" "SSH连接测试"; then
        log_success "SSH连接正常"
        return 0
    else
        log_error "SSH连接失败"
        echo "可能的原因:"
        echo "1. SSH服务未运行"
        echo "2. SSH密钥未配置"
        echo "3. 安全组未开放22端口"
        echo "4. 用户名或密码错误"
        return 1
    fi
}

# 生成优化的SMB配置脚本
generate_optimized_smb_config() {
    log_step "生成优化的SMB配置脚本"
    echo "==============================="

    cat > optimized-smb-server-config.sh << EOF
#!/bin/bash
# 优化的SMB服务器配置脚本 - 适用于8.152.195.33

set -e

# 配置变量
SHARED_PATH="/opt/nas-shared"
SHARED_NAME="shared"
SMB_USER="nasuser"
SMB_PASSWORD="NasUser2024"

echo "🚀 开始SMB服务配置"
echo "=================="

# 系统信息
echo "📋 系统信息:"
echo "操作系统: \$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "内核版本: \$(uname -r)"
echo "当前时间: \$(date)"
echo "主机名: \$(hostname)"
echo ""

# 检测系统类型
if [ -f /etc/redhat-release ]; then
    DISTRO="centos"
    PKG_MANAGER="yum"
    SMB_SERVICE="smb"
elif [ -f /etc/debian_version ]; then
    DISTRO="ubuntu"
    PKG_MANAGER="apt"
    SMB_SERVICE="smb"
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

echo "检测到系统类型: \$DISTRO"

# 更新系统包
echo "📦 更新系统包..."
if [ "\$DISTRO" = "centos" ]; then
    yum update -y
    yum install -y samba samba-client samba-common cifs-utils
else
    apt update
    apt install -y samba samba-common cifs-utils
fi

# 创建共享目录
echo "📁 创建共享目录..."
mkdir -p \$SHARED_PATH
chmod 777 \$SHARED_PATH
chown -R nobody:nobody \$SHARED_PATH

# 备份现有配置
echo "💾 备份现有SMB配置..."
cp /etc/samba/smb.conf /etc/samba/smb.conf.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 创建优化的SMB配置
echo "⚙️ 创建SMB配置..."
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
    deadtime = 15
    keepalive = 300

    # 日志配置
    log level = 1
    log file = /var/log/samba/log.%m
    max log size = 50

    # 安全配置
    lanman auth = no
    ntlm auth = yes
    client min protocol = SMB2
    server min protocol = SMB2

[\$SHARED_NAME]
    comment = YYC3 Shared Storage
    path = \$SHARED_PATH
    browseable = yes
    writable = yes
    guest ok = yes
    read only = no
    create mask = 0664
    directory mask = 0775
    force user = nobody
    force group = nobody

    # 共享特定配置
    vfs objects = full_audit
    full_audit:success = connect disconnect mkdir rmdir read write rename
    full_audit:failure = connect
    full_audit:prefix = %u|%I|%S
    full_audit:facility = local5
    full_audit:priority = notice
SAMBAEOF

# 创建Samba用户
echo "👤 创建Samba用户..."
if ! id "\$SMB_USER" &>/dev/null; then
    useradd \$SMB_USER -s /sbin/nologin -M
    echo "用户 \$SMB_USER 已创建"
fi

# 设置Samba密码
echo "🔐 设置Samba密码..."
echo -e "\$SMB_PASSWORD\n\$SMB_PASSWORD" | smbpasswd -a \$SMB_USER

# SELinux配置 (如果启用)
if command -v getenforce >/dev/null 2>&1; then
    if [ "\$(getenforce)" != "Disabled" ]; then
        echo "🔒 配置SELinux..."
        setsebool -P samba_enable_home_dirs on
        setsebool -P samba_export_all_rw on
        setsebool -P samba_create_home_dirs on
    fi
fi

# 配置防火墙
echo "🔥 配置防火墙..."
configure_firewall() {
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
        echo "⚠️ 未检测到防火墙管理工具"
        echo "请手动开放端口: 445, 139, 137, 138"
    fi
}

configure_firewall

# 启动Samba服务
echo "🚀 启动Samba服务..."
systemctl enable \$SMB_SERVICE nmb
systemctl restart \$SMB_SERVICE nmb

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 验证服务状态
echo "📊 验证服务状态..."
echo "SMB服务状态:"
systemctl status \$SMB_SERVICE --no-pager -l
echo ""
echo "NMB服务状态:"
systemctl status nmb --no-pager -l

# 测试SMB共享
echo "🔍 测试SMB共享..."
smbclient -L localhost -N

# 检查端口监听
echo "📡 检查端口监听..."
netstat -tlnp | grep -E ':(445|139)'

# 创建测试文件
echo "📝 创建测试文件..."
echo "SMB服务配置完成 - \$(date)" > \$SHARED_PATH/test-file.txt
echo "欢迎访问YYC3 NAS共享存储！" >> \$SHARED_PATH/test-file.txt

# 设置权限
chmod 666 \$SHARED_PATH/test-file.txt

echo ""
echo "🎉 SMB服务配置完成！"
echo "====================="
echo "服务器地址: $ECS_IP"
echo "SMB地址: smb://$ECS_IP/"
echo "共享名称: \$SHARED_NAME"
echo "共享路径: \$SHARED_PATH"
echo "用户名: \$SMB_USER"
echo "密码: \$SMB_PASSWORD"
echo ""

echo "🍎 Mac连接方式:"
echo "1. 访达 → 前往 → 连接服务器"
echo "2. 输入: smb://$ECS_IP/"
echo "3. 选择guest或输入用户名密码"
echo ""

echo "📂 测试连接:"
echo "本地测试: smbclient //localhost/\$SHARED_NAME -N"
echo "查看共享: ls \$SHARED_PATH/"
echo "测试文件: cat \$SHARED_PATH/test-file.txt"
EOF

    chmod +x optimized-smb-server-config.sh
    log_success "优化的SMB配置脚本已生成"
}

# 部署SMB服务
deploy_smb_service() {
    log_step "部署SMB服务到8.152.195.33"
    echo "==============================="

    # 传输配置脚本
    log_info "传输配置脚本到服务器..."
    if scp -o ConnectTimeout=$TIMEOUT optimized-smb-server-config.sh $ECS_USER@$ECS_IP:/tmp/; then
        log_success "配置脚本传输成功"
    else
        log_error "配置脚本传输失败"
        return 1
    fi

    # 执行配置脚本
    log_info "在服务器上执行SMB配置..."
    if ssh -o ConnectTimeout=$TIMEOUT $ECS_USER@$ECS_IP "chmod +x /tmp/optimized-smb-server-config.sh && /tmp/optimized-smb-server-config.sh"; then
        log_success "SMB服务配置完成"
        return 0
    else
        log_error "SMB服务配置失败"
        return 1
    fi
}

# 验证部署结果
verify_deployment() {
    log_step "验证SMB部署结果"
    echo "===================="

    # 测试SMB端口
    log_info "测试SMB端口连接..."
    if timeout $TIMEOUT bash -c "</dev/tcp/$ECS_IP/445"; then
        log_success "SMB端口445可访问"
    else
        log_warning "SMB端口445不可访问"
    fi

    # 提供连接信息
    echo ""
    log_success "部署完成！连接信息:"
    echo "================================"
    echo "🔗 SMB地址: smb://$ECS_IP/"
    echo "📁 共享名称: shared"
    echo "👤 用户名: nasuser"
    echo "🔐 密码: NasUser2024"
    echo ""
    echo "🍎 Mac连接步骤:"
    echo "1. 打开访达"
    echo "2. 前往 → 连接服务器"
    echo "3. 输入: smb://$ECS_IP/"
    echo "4. 选择guest或输入用户名密码"
    echo ""
}

# 生成故障排除指南
generate_troubleshooting_guide() {
    log_step "生成故障排除指南"
    echo "====================="

    cat > smb-troubleshooting-guide.md << EOF
# SMB服务故障排除指南

## 🚨 常见问题

### 1. 连接失败
**症状**: 无法连接到 smb://$ECS_IP/

**解决步骤**:
1. 检查网络: \`ping $ECS_IP\`
2. 检查端口: \`nc -zv $ECS_IP 445\`
3. 检查服务: \`systemctl status smb\`
4. 检查防火墙: 确保端口445开放

### 2. 认证失败
**症状**: 用户名密码错误

**解决步骤**:
1. 使用guest模式连接
2. 检查Samba用户: \`pdbedit -L\`
3. 重置密码: \`smbpasswd nasuser\`

### 3. 权限问题
**症状**: 无法创建或修改文件

**解决步骤**:
1. 检查目录权限: \`ls -la /opt/nas-shared\`
2. 重新设置权限: \`chmod 777 /opt/nas-shared\`
3. 检查SELinux: \`getenforce\`

### 4. 性能问题
**症状**: 文件传输缓慢

**解决步骤**:
1. 检查网络带宽
2. 调整SMB配置参数
3. 使用有线网络连接

## 🛠️ 快速修复命令

```bash
# 重启SMB服务
systemctl restart smb nmb

# 检查SMB状态
systemctl status smb

# 查看SMB日志
tail -f /var/log/samba/log.smbd

# 测试本地SMB连接
smbclient -L localhost -N

# 检查端口监听
netstat -tlnp | grep 445
```

## 📞 技术支持

如果问题仍然存在，请提供以下信息：
1. 错误信息截图
2. 网络环境描述
3. 服务器状态检查结果
EOF

    log_success "故障排除指南已生成"
}

# 主函数
main() {
    echo -e "${BLUE}🚀 8.152.195.33 优化部署脚本${NC}"
    echo "======================================="
    echo "目标: 部署SMB服务，实现与现有NAS一致的连接体验"
    echo ""

    # 1. 网络连接测试
    if ! test_connectivity; then
        log_warning "网络连接测试有问题，但继续尝试部署"
    fi

    # 2. SSH连接测试
    if ! test_ssh_connection; then
        log_error "SSH连接失败，无法继续部署"
        echo ""
        echo "🛠️ 解决方案:"
        echo "1. 检查服务器IP是否正确: $ECS_IP"
        echo "2. 确认服务器已启动"
        echo "3. 检查安全组配置(开放22端口)"
        echo "4. 配置SSH密钥认证"
        exit 1
    fi

    # 3. 生成配置脚本
    generate_optimized_smb_config

    # 4. 部署SMB服务
    if ! deploy_smb_service; then
        log_error "SMB服务部署失败"
        exit 1
    fi

    # 5. 验证部署
    verify_deployment

    # 6. 生成故障排除指南
    generate_troubleshooting_guide

    echo ""
    log_success "🎉 部署流程完成！"
    echo "=================="
    echo "现在可以通过Mac访达连接: smb://$ECS_IP/"
    echo ""
}

# 运行主函数
main "$@"