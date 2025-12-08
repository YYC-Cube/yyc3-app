#!/bin/bash
# =============================================================================
# 0379.email 项目 - SSH 安全配置脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 服务器配置
declare -A SERVERS=(
    ["production"]="yyc3-121:8.130.127.121:22:yanyu:id_rsa_0379_prod"
    ["nas"]="yyc3-45:192.168.3.45:57:YYC:id_rsa_0379_nas"
    ["development"]="yyc3-22:192.168.3.22:22:yyc3-22:id_rsa_0379_dev"
)

# 备份 SSH 配置
backup_ssh_config() {
    log_info "备份 SSH 配置..."

    local ssh_dir="$HOME/.ssh"
    local backup_dir="$ssh_dir/backup.$(date +%Y%m%d_%H%M%S)"

    if [[ -d "$ssh_dir" ]]; then
        mkdir -p "$backup_dir"
        cp -r "$ssh_dir"/* "$backup_dir/" 2>/dev/null || true
        log_success "SSH 配置已备份到: $backup_dir"
    fi
}

# 生成 SSH 密钥
generate_ssh_keys() {
    log_info "生成 SSH 密钥..."

    local ssh_dir="$HOME/.ssh"
    mkdir -p "$ssh_dir"
    chmod 700 "$ssh_dir"

    # 为每个服务器生成专用密钥
    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user key_name <<< "$config"

        local key_path="$ssh_dir/$key_name"
        local pub_key_path="$key_path.pub"

        if [[ ! -f "$key_path" ]]; then
            log_info "为 $server_name ($hostname) 生成 SSH 密钥..."

            ssh-keygen -t ed25519 -b 4096 -f "$key_path" -N "" -C "0379-email-$server_name"

            chmod 600 "$key_path"
            chmod 644 "$pub_key_path"

            log_success "密钥生成完成: $key_path"
        else
            log_info "密钥已存在: $key_path"
        fi
    done
}

# 创建安全 SSH 配置
create_ssh_config() {
    log_info "创建安全 SSH 配置..."

    local config_file="$HOME/.ssh/config"
    local secure_config_file="/Users/yanyu/www/ssh-config.secure"

    # 备份现有配置
    if [[ -f "$config_file" ]]; then
        cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 创建新的 SSH 配置
    cat > "$config_file" << 'EOF'
# =============================================================================
# 0379.email 项目 SSH 安全配置
# 自动生成 - 请勿手动编辑
# =============================================================================

# 全局配置
Host *
    # 连接设置
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3

    # 安全设置
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts
    IdentityFile ~/.ssh/id_rsa

    # 性能优化
    Compression yes
    CompressionLevel 6
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p
    ControlPersist 600

    # 算法偏好
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr
    MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
    KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521

EOF

    # 添加服务器特定配置
    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user key_name <<< "$config"

        cat >> "$config_file" << EOF

# $server_name 服务器配置
Host $hostname
    HostName $ip
    User $user
    Port $port
    IdentityFile ~/.ssh/$key_name
    PreferredAuthentications publickey
    PubkeyAuthentication yes
    PasswordAuthentication no
    ChallengeResponseAuthentication no

EOF

        # 特殊配置
        case $server_name in
            "production")
                cat >> "$config_file" << EOF
    # 生产服务器特殊配置
    PermitLocalCommand no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no

EOF
                ;;
            "nas")
                cat >> "$config_file" << EOF
    # NAS 服务器特殊配置
    AllowTcpForwarding yes
    PermitLocalCommand yes

EOF
                ;;
            "development")
                cat >> "$config_file" << EOF
    # 开发机特殊配置
    AllowTcpForwarding yes
    PermitLocalCommand yes
    X11Forwarding yes

EOF
                ;;
        esac
    done

    chmod 600 "$config_file"
    log_success "SSH 配置已更新: $config_file"
}

# 分发公钥到服务器
distribute_public_keys() {
    log_info "分发公钥到服务器..."

    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user key_name <<< "$config"

        local key_path="$HOME/.ssh/$key_name.pub"

        if [[ -f "$key_path" ]]; then
            log_info "分发公钥到 $hostname ($ip:$port)..."

            # 使用 ssh-copy-id 分发公钥
            if ssh-copy-id -i "$key_path" -p "$port" "$user@$ip" 2>/dev/null; then
                log_success "公钥分发成功: $hostname"
            else
                log_warning "公钥分发失败，请手动配置: $hostname"
                log_info "手动执行: ssh-copy-id -i $key_path -p $port $user@$ip"
            fi
        fi
    done
}

# 创建服务器安全配置脚本
create_server_security_scripts() {
    log_info "创建服务器安全配置脚本..."

    # 服务器安全加固脚本
    cat > "/Users/yanyu/www/scripts/harden-server.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 服务器安全加固脚本
# =============================================================================

set -euo pipefail

# 检查是否以 root 权限运行
if [[ $EUID -ne 0 ]]; then
   echo "此脚本需要 root 权限运行"
   exit 1
fi

# 更新系统
echo "更新系统包..."
yum update -y || apt-get update && apt-get upgrade -y

# 安装必要的安全工具
echo "安装安全工具..."
if command -v yum >/dev/null 2>&1; then
    yum install -y fail2ban ufw rkhunter chkrootkit
elif command -v apt-get >/dev/null 2>&1; then
    apt-get install -y fail2ban ufw rkhunter chkrootkit
fi

# SSH 安全配置
echo "配置 SSH 安全..."
backup_file /etc/ssh/sshd_config

# 禁用 root 登录
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 禁用密码认证
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# 更改默认 SSH 端口（可选）
# sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 限制 SSH 用户
echo "AllowUsers yanyu YYC" >> /etc/ssh/sshd_config

# 重启 SSH 服务
systemctl restart sshd

# 配置防火墙
echo "配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw reload
elif command -v firewall-cmd >/dev/null 2>&1; then
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# 配置 fail2ban
echo "配置 fail2ban..."
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
FAIL2BAN

systemctl enable fail2ban
systemctl start fail2ban

# 创建安全监控
echo "设置安全监控..."
cat > /usr/local/bin/security-monitor.sh << 'MONITOR'
#!/bin/bash
# 安全监控脚本

LOG_FILE="/var/log/security-monitor.log"

# 检查登录失败
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [[ $FAILED_LOGINS -gt 10 ]]; then
    echo "$(date): 警告 - 检测到 $FAILED_LOGINS 次登录失败" >> $LOG_FILE
fi

# 检查可疑进程
SUSPICIOUS_PROCS=$(ps aux | grep -E "(nc|netcat|nmap)" | grep -v grep | wc -l)
if [[ $SUSPICIOUS_PROCS -gt 0 ]]; then
    echo "$(date): 警告 - 检测到可疑进程" >> $LOG_FILE
fi

# 检查端口监听
UNUSUAL_PORTS=$(netstat -tuln | grep -E ":(4444|5555|6666|7777|8888|9999)")
if [[ -n "$UNUSUAL_PORTS" ]]; then
    echo "$(date): 警告 - 检测到异常端口监听: $UNUSUAL_PORTS" >> $LOG_FILE
fi
MONITOR

chmod +x /usr/local/bin/security-monitor.sh

# 添加到 crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/security-monitor.sh") | crontab -

echo "服务器安全加固完成！"
EOF

    chmod +x "/Users/yanyu/www/scripts/harden-server.sh"

    log_success "服务器安全脚本已创建"
}

# 验证 SSH 连接
verify_ssh_connections() {
    log_info "验证 SSH 连接..."

    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user key_name <<< "$config"

        log_info "测试连接到 $hostname..."

        if ssh -o ConnectTimeout=10 -o BatchMode=yes "$hostname" "echo '连接成功' && whoami && uptime" 2>/dev/null; then
            log_success "SSH 连接验证成功: $hostname"
        else
            log_error "SSH 连接失败: $hostname"
            log_info "请检查："
            log_info "1. 公钥是否已正确分发"
            log_info "2. 服务器地址和端口是否正确"
            log_info "3. 服务器 SSH 服务是否正常运行"
        fi
    done
}

# 创建 SSH 密钥管理文档
create_ssh_documentation() {
    log_info "创建 SSH 配置文档..."

    cat > "/Users/yanyu/www/docs/SSH_SECURITY_GUIDE.md" << 'EOF'
# SSH 安全配置指南

## 概述

本文档描述了 0379.email 项目的 SSH 安全配置。

## 服务器配置

### 生产服务器 (yyc3-121)
- **IP地址**: 8.130.127.121
- **端口**: 22
- **用户**: yanyu
- **密钥**: ~/.ssh/id_rsa_0379_prod

### NAS 服务器 (yyc3-45)
- **IP地址**: 192.168.3.45
- **端口**: 57
- **用户**: YYC
- **密钥**: ~/.ssh/id_rsa_0379_nas

### 开发机 (yyc3-22)
- **IP地址**: 192.168.3.22
- **端口**: 22
- **用户**: yyc3-22
- **密钥**: ~/.ssh/id_rsa_0379_dev

## 使用方法

### 连接到服务器
```bash
# 生产服务器
ssh yyc3-121

# NAS 服务器
ssh yyc3-45

# 开发机
ssh yyc3-22
```

### 文件传输
```bash
# 上传文件到生产服务器
scp file.txt yyc3-121:~/uploads/

# 从 NAS 下载文件
scp yyc3-45:~/data/file.txt ./

# 同步目录
rsync -avz local-dir/ yyc3-121:~/remote-dir/
```

## 安全注意事项

1. **密钥管理**
   - 私钥文件权限必须为 600
   - 公钥文件权限必须为 644
   - 定期轮换密钥

2. **访问控制**
   - 禁用密码认证
   - 使用 IP 白名单（推荐）
   - 监控登录日志

3. **审计和监控**
   - 定期检查登录日志
   - 监控异常活动
   - 使用 fail2ban 防护

## 故障排除

### 连接被拒绝
1. 检查服务器地址和端口
2. 验证 SSH 服务状态
3. 检查防火墙设置

### 认证失败
1. 确认密钥文件权限
2. 检查公钥是否正确分发
3. 验证用户名

### 连接超时
1. 检查网络连接
2. 验证防火墙规则
3. 检查服务器负载

## 脚本使用

### 重新配置 SSH
```bash
./scripts/setup-secure-ssh.sh
```

### 服务器安全加固
```bash
# 在服务器上执行
sudo ./scripts/harden-server.sh
```

### 安全检查
```bash
./scripts/security-check.sh
```
EOF

    log_success "SSH 安全文档已创建: /Users/yanyu/www/docs/SSH_SECURITY_GUIDE.md"
}

# 显示生成的密钥信息
show_key_info() {
    log_info "SSH 密钥信息："

    for server_name in "${!SERVERS[@]}"; do
        local config="${SERVERS[$server_name]}"
        IFS=':' read -r hostname ip port user key_name <<< "$config"

        echo "----------------------------------------"
        echo "服务器: $server_name ($hostname)"
        echo "地址: $ip:$port"
        echo "用户: $user"
        echo "密钥: ~/.ssh/$key_name"
        echo "公钥内容:"
        if [[ -f "$HOME/.ssh/$key_name.pub" ]]; then
            cat "$HOME/.ssh/$key_name.pub"
        fi
        echo ""
    done

    echo "请将公钥添加到对应服务器的 ~/.ssh/authorized_keys 文件中"
}

# 主函数
main() {
    log_info "开始 0379.email 项目 SSH 安全配置..."

    backup_ssh_config
    generate_ssh_keys
    create_ssh_config
    distribute_public_keys
    create_server_security_scripts
    create_ssh_documentation
    verify_ssh_connections
    show_key_info

    log_success "SSH 安全配置完成！"
    log_info "配置文件: $HOME/.ssh/config"
    log_info "文档位置: /Users/yanyu/www/docs/SSH_SECURITY_GUIDE.md"
    log_warning "请："
    log_warning "1. 检查 SSH 连接是否正常"
    log_warning "2. 在服务器上运行安全加固脚本"
    log_warning "3. 定期更新密钥和配置"
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 项目 SSH 安全配置脚本

用法: $0 [选项]

选项:
    -h, --help     显示此帮助信息
    -k, --keys     仅生成 SSH 密钥
    -c, --config   仅创建 SSH 配置
    -t, --test     仅测试 SSH 连接

示例:
    $0              # 执行完整配置
    $0 -k           # 仅生成密钥
    $0 -c           # 仅创建配置
    $0 -t           # 测试连接

EOF
}

# 解析命令行参数
action="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -k|--keys)
            action="keys"
            shift
            ;;
        -c|--config)
            action="config"
            shift
            ;;
        -t|--test)
            action="test"
            shift
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行对应操作
case $action in
    "full")
        main
        ;;
    "keys")
        generate_ssh_keys
        show_key_info
        ;;
    "config")
        create_ssh_config
        create_ssh_documentation
        ;;
    "test")
        verify_ssh_connections
        ;;
esac