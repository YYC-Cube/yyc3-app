#!/bin/bash
# =============================================================================
# 0379.email 多机SSH密钥管理器
# 完整的SSH密钥生成、分发、轮换和管理系统
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
KEYS_ROOT="$PROJECT_ROOT/security/keys"
SSH_KEYS_DIR="$KEYS_ROOT/ssh"
CONFIG_DIR="$KEYS_ROOT/config"
BACKUP_DIR="$KEYS_ROOT/backup"
LOG_DIR="$KEYS_ROOT/logs"

# 创建目录结构
create_directories() {
    log_info "创建密钥管理目录结构..."

    mkdir -p "$SSH_KEYS_DIR"/{private,public,authorized_keys}
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$BACKUP_DIR"/{ssh,config}
    mkdir -p "$LOG_DIR"

    chmod 700 "$SSH_KEYS_DIR/private"
    chmod 755 "$SSH_KEYS_DIR"/{public,authorized_keys}
    chmod 700 "$BACKUP_DIR"
    chmod 755 "$LOG_DIR"

    log_success "目录结构创建完成"
}

# 服务器配置数据库
SERVERS_CONFIG="$CONFIG_DIR/servers.json"

# 初始化服务器配置
init_servers_config() {
    if [[ ! -f "$SERVERS_CONFIG" ]]; then
        log_info "初始化服务器配置..."

        cat > "$SERVERS_CONFIG" << 'EOF'
{
  "production": {
    "yyc3-121": {
      "hostname": "8.130.127.121",
      "port": 22,
      "user": "yanyu",
      "description": "阿里云华北6生产服务器",
      "environment": "production",
      "role": "master"
    },
    "yyc3-121-backup": {
      "hostname": "8.130.127.121",
      "port": 2222,
      "user": "yanyu",
      "description": "阿里云备份端口",
      "environment": "production",
      "role": "backup"
    }
  },
  "storage": {
    "yyc3-45": {
      "hostname": "192.168.3.45",
      "port": 57,
      "user": "YYC",
      "description": "本地NAS服务器",
      "environment": "storage",
      "role": "nas_master"
    },
    "yyc3-45-backup": {
      "hostname": "192.168.3.45",
      "port": 2222,
      "user": "YYC",
      "description": "NAS备份端口",
      "environment": "storage",
      "role": "nas_backup"
    }
  },
  "development": {
    "yyc3-22": {
      "hostname": "192.168.3.22",
      "port": 22,
      "user": "yyc3-22",
      "description": "M4 Max开发机",
      "environment": "development",
      "role": "dev_primary"
    },
    "yyc3-66": {
      "hostname": "192.168.3.66",
      "port": 22,
      "user": "yyc3-66",
      "description": "开发机66",
      "environment": "development",
      "role": "dev_secondary"
    },
    "yyc3-77": {
      "hostname": "192.168.3.77",
      "port": 22,
      "user": "yyc3-77",
      "description": "开发机77",
      "environment": "development",
      "role": "dev_testing"
    }
  },
  "monitoring": {
    "monitor-01": {
      "hostname": "192.168.3.100",
      "port": 22,
      "user": "monitor",
      "description": "监控服务器1",
      "environment": "monitoring",
      "role": "monitor_primary"
    },
    "monitor-02": {
      "hostname": "192.168.3.101",
      "port": 22,
      "user": "monitor",
      "description": "监控服务器2",
      "environment": "monitoring",
      "role": "monitor_secondary"
    }
  },
  "database": {
    "db-master": {
      "hostname": "192.168.3.50",
      "port": 22,
      "user": "dbuser",
      "description": "主数据库服务器",
      "environment": "database",
      "role": "db_master"
    },
    "db-slave": {
      "hostname": "192.168.3.51",
      "port": 22,
      "user": "dbuser",
      "description": "从数据库服务器",
      "environment": "database",
      "role": "db_slave"
    }
  },
  "application": {
    "api-01": {
      "hostname": "192.168.3.60",
      "port": 22,
      "user": "apiuser",
      "description": "API服务器1",
      "environment": "application",
      "role": "api_primary"
    },
    "api-02": {
      "hostname": "192.168.3.61",
      "port": 22,
      "user": "apiuser",
      "description": "API服务器2",
      "environment": "application",
      "role": "api_secondary"
    },
    "api-03": {
      "hostname": "192.168.3.62",
      "port": 22,
      "user": "apiuser",
      "description": "API服务器3",
      "environment": "application",
      "role": "api_tertiary"
    },
    "lb-01": {
      "hostname": "192.168.3.40",
      "port": 22,
      "user": "lbuser",
      "description": "负载均衡器1",
      "environment": "application",
      "role": "lb_primary"
    },
    "lb-02": {
      "hostname": "192.168.3.41",
      "port": 22,
      "user": "lbuser",
      "description": "负载均衡器2",
      "environment": "application",
      "role": "lb_secondary"
    }
  }
}
EOF

        log_success "服务器配置初始化完成"
    fi
}

# 生成强随机密钥
generate_strong_key() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/\n" | cut -c1-"$length"
}

# 生成SSH密钥对
generate_ssh_keypair() {
    local server_name="$1"
    local key_type="${2:-ed25519}"
    local key_bits="${3:-4096}"

    local key_name="${server_name}"
    local private_key="$SSH_KEYS_DIR/private/${key_name}"
    local public_key="$SSH_KEYS_DIR/public/${key_name}.pub"
    local comment="0379-email-${server_name}-$(date +%Y%m%d)"

    log_info "生成SSH密钥对: $key_name ($key_type)"

    # 备份现有密钥
    if [[ -f "$private_key" ]]; then
        cp "$private_key" "$BACKUP_DIR/ssh/${key_name}.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 生成新的密钥对
    case "$key_type" in
        "ed25519")
            ssh-keygen -t ed25519 -f "$private_key" -N "" -C "$comment" 2>/dev/null
            ;;
        "rsa")
            ssh-keygen -t rsa -b "$key_bits" -f "$private_key" -N "" -C "$comment" 2>/dev/null
            ;;
        *)
            log_error "不支持的密钥类型: $key_type"
            return 1
            ;;
    esac

    # 设置权限
    chmod 600 "$private_key"
    chmod 644 "$public_key"

    # 复制公钥到authorized_keys目录
    mkdir -p "$SSH_KEYS_DIR/authorized_keys/$server_name"
    cp "$public_key" "$SSH_KEYS_DIR/authorized_keys/$server_name/authorized_keys"

    log_success "SSH密钥对生成完成: $key_name"
    echo "$public_key"
}

# 批量生成所有服务器密钥
generate_all_keys() {
    log_step "批量生成所有服务器SSH密钥"

    local generated_keys=()

    # 读取服务器配置
    for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
        echo "处理环境: $env"

        for server_name in $(jq -r ".${env} | keys[]" "$SERVERS_CONFIG"); do
            echo "生成服务器密钥: $server_name"

            local hostname=$(jq -r ".${env}[\"${server_name}\"].hostname" "$SERVERS_CONFIG")
            local user=$(jq -r ".${env}[\"${server_name}\"].user" "$SERVERS_CONFIG")

            local pub_key=$(generate_ssh_keypair "$server_name")
            generated_keys+=("$server_name:$hostname:$user:$pub_key")
        done
    done

    log_success "所有服务器SSH密钥生成完成"

    # 生成密钥索引文件
    cat > "$CONFIG_DIR/key_index.json" << EOF
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_keys": ${#generated_keys[@]},
  "keys": [
EOF

    for i in "${!generated_keys[@]}"; do
        local key_info="${generated_keys[$i]}"
        IFS=':' read -r server hostname user pub_key <<< "$key_info"

        echo "    {" >> "$CONFIG_DIR/key_index.json"
        echo "      \"server\": \"$server\"," >> "$CONFIG_DIR/key_index.json"
        echo "      \"hostname\": \"$hostname\"," >> "$CONFIG_DIR/key_index.json"
        echo "      \"user\": \"$user\"," >> "$CONFIG_DIR/key_index.json"
        echo "      \"public_key\": \"$(cat "$SSH_KEYS_DIR/public/${server}.pub")\"" >> "$CONFIG_DIR/key_index.json"
        echo -n "    }" >> "$CONFIG_DIR/key_index.json"

        if [[ $i -lt $((${#generated_keys[@]} - 1)) ]]; then
            echo "," >> "$CONFIG_DIR/key_index.json"
        else
            echo "" >> "$CONFIG_DIR/key_index.json"
        fi
    done

    echo "  ]" >> "$CONFIG_DIR/key_index.json"
    echo "}" >> "$CONFIG_DIR/key_index.json"

    log_success "密钥索引文件生成完成: $CONFIG_DIR/key_index.json"
}

# 测试服务器连接
test_server_connection() {
    local server_name="$1"
    local hostname="$2"
    local port="$3"
    local user="$4"

    log_info "测试服务器连接: $server_name ($hostname:$port)"

    # 使用nc测试端口连通性
    if timeout 5 nc -z "$hostname" "$port" 2>/dev/null; then
        log_success "端口连通性测试通过: $hostname:$port"

        # 测试SSH连接（不使用密钥，只测试服务）
        if timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no \
            -p "$port" "$user@$hostname" "echo 'SSH服务正常'" 2>/dev/null; then
            log_success "SSH服务测试通过: $server_name"
            return 0
        else
            log_warning "SSH服务测试失败: $server_name (服务存在但需要密钥认证)"
            return 1
        fi
    else
        log_error "端口连通性测试失败: $hostname:$port"
        return 1
    fi
}

# 批量测试所有服务器连接
test_all_connections() {
    log_step "批量测试所有服务器连接"

    local total_servers=0
    local reachable_servers=0
    local unreachable_servers=()

    for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
        for server_name in $(jq -r ".${env} | keys[]" "$SERVERS_CONFIG"); do
            local hostname=$(jq -r ".${env}[\"${server_name}\"].hostname" "$SERVERS_CONFIG")
            local port=$(jq -r ".${env}[\"${server_name}\"].port" "$SERVERS_CONFIG")
            local user=$(jq -r ".${env}[\"${server_name}\"].user" "$SERVERS_CONFIG")

            ((total_servers++))

            if test_server_connection "$server_name" "$hostname" "$port" "$user"; then
                ((reachable_servers++))
            else
                unreachable_servers+=("$server_name")
            fi
        done
    done

    log_info "连接测试完成:"
    echo "  总服务器数: $total_servers"
    echo "  可达服务器: $reachable_servers"
    echo "  不可达服务器: ${#unreachable_servers[@]}"

    if [[ ${#unreachable_servers[@]} -gt 0 ]]; then
        log_warning "不可达的服务器:"
        for server in "${unreachable_servers[@]}"; do
            echo "  - $server"
        done
    fi

    return $((total_servers - reachable_servers))
}

# 分发SSH密钥到单个服务器
distribute_key_to_server() {
    local server_name="$1"
    local hostname="$2"
    local port="$3"
    local user="$4"
    local force="${5:-false}"

    local private_key="$SSH_KEYS_DIR/private/${server_name}"
    local public_key="$SSH_KEYS_DIR/public/${server_name}.pub"

    if [[ ! -f "$private_key" ]] || [[ ! -f "$public_key" ]]; then
        log_error "密钥文件不存在: $server_name"
        return 1
    fi

    log_info "分发SSH密钥到: $server_name ($user@$hostname:$port)"

    # 使用ssh-copy-id分发密钥
    if ssh-copy-id -i "$public_key" -p "$port" -o StrictHostKeyChecking=no "$user@$hostname" 2>/dev/null; then
        log_success "密钥分发成功: $server_name"

        # 验证SSH连接
        if ssh -i "$private_key" -p "$port" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
            "$user@$hostname" "echo 'SSH密钥认证成功' && whoami" 2>/dev/null; then
            log_success "SSH密钥认证验证成功: $server_name"

            # 在目标服务器上配置SSH
            configure_server_ssh "$server_name" "$hostname" "$port" "$user" "$private_key"

            return 0
        else
            log_error "SSH密钥认证验证失败: $server_name"
            return 1
        fi
    else
        log_error "密钥分发失败: $server_name"
        log_info "请手动执行: ssh-copy-id -i $public_key -p $port $user@$hostname"

        if [[ "$force" == "true" ]]; then
            log_info "尝试手动配置..."
            manual_distribute_key "$server_name" "$hostname" "$port" "$user" "$public_key"
        fi

        return 1
    fi
}

# 手动分发密钥（当ssh-copy-id不可用时）
manual_distribute_key() {
    local server_name="$1"
    local hostname="$2"
    local port="$3"
    local user="$4"
    local public_key="$5"

    log_info "手动分发密钥到: $server_name"

    # 读取公钥内容
    local pub_key_content=$(cat "$public_key")

    # 创建临时脚本
    local temp_script="/tmp/setup_ssh_${server_name}.sh"
    cat > "$temp_script" << EOF
#!/bin/bash
# 在目标服务器上执行

set -e

# 创建.ssh目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 添加公钥到authorized_keys
echo '$pub_key_content' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 设置SSH配置
cat >> ~/.ssh/config << 'SSHEOF'

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking yes
SSHEOF

# 设置权限
chmod 600 ~/.ssh/config

echo "SSH配置完成"
EOF

    # 传输并执行脚本
    if scp -P "$port" "$temp_script" "$user@$hostname:/tmp/"; then
        ssh -p "$port" "$user@$hostname" "chmod +x /tmp/setup_ssh_${server_name}.sh && /tmp/setup_ssh_${server_name}.sh"
        log_success "手动密钥分发完成: $server_name"
    else
        log_error "手动密钥分发失败: $server_name"
    fi

    # 清理临时文件
    rm -f "$temp_script"
    ssh -p "$port" "$user@$hostname" "rm -f /tmp/setup_ssh_${server_name}.sh" 2>/dev/null || true
}

# 配置服务器SSH设置
configure_server_ssh() {
    local server_name="$1"
    local hostname="$2"
    local port="$3"
    local user="$4"
    local private_key="$5"

    log_info "配置服务器SSH设置: $server_name"

    # 在目标服务器上执行安全配置
    ssh -i "$private_key" -p "$port" "$user@$hostname" << 'EOF'
# 配置SSH安全设置

# 备份原始配置
if [[ -f /etc/ssh/sshd_config ]]; then
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
fi

# 安全SSH配置
cat > /tmp/sshd_security_config << 'SSHEOF'
# SSH安全配置
Port 22
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
MaxSessions 10
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
PrintMotd no
Banner /etc/ssh/banner

# 日志配置
SyslogFacility AUTHPRIV
LogLevel INFO

# 子系统配置
Subsystem sftp /usr/lib/openssh/sftp-server
SSHEOF

# 应用配置
if [[ -f /tmp/sshd_security_config ]]; then
    # 合并配置（保留自定义配置）
    grep -v -f <(grep -E '^(Port|Protocol|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config) /etc/ssh/sshd_config > /etc/ssh/sshd_config.new
    cat /tmp/sshd_security_config >> /etc/ssh/sshd_config.new
    mv /etc/ssh/sshd_config.new /etc/ssh/sshd_config

    # 重启SSH服务
    systemctl restart sshd || systemctl restart ssh || service ssh restart

    echo "SSH安全配置应用完成"
fi

# 创建登录横幅
cat > /etc/ssh/banner << 'BANNEREOF'
================================================================================
                    0379.email 安全服务器
         未经授权的访问将被记录并追究法律责任
                         $(date)
================================================================================
BANNEREOF

echo "服务器安全配置完成"
EOF

    log_success "服务器SSH配置完成: $server_name"
}

# 批量分发所有密钥
distribute_all_keys() {
    log_step "批量分发所有SSH密钥"

    local total_servers=0
    local success_servers=0
    local failed_servers=()

    # 首先测试所有连接
    log_info "首先测试服务器连通性..."
    test_all_connections

    # 分发密钥
    for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
        for server_name in $(jq -r ".${env} | keys[]" "$SERVERS_CONFIG"); do
            local hostname=$(jq -r ".${env}[\"${server_name}\"].hostname" "$SERVERS_CONFIG")
            local port=$(jq -r ".${env}[\"${server_name}\"].port" "$SERVERS_CONFIG")
            local user=$(jq -r ".${env}[\"${server_name}\"].user" "$SERVERS_CONFIG")

            ((total_servers++))

            if distribute_key_to_server "$server_name" "$hostname" "$port" "$user"; then
                ((success_servers++))
            else
                failed_servers+=("$server_name")
            fi

            sleep 2  # 避免过于频繁的连接
        done
    done

    log_info "密钥分发完成:"
    echo "  总服务器数: $total_servers"
    echo "  成功分发: $success_servers"
    echo "  失败分发: ${#failed_servers[@]}"

    if [[ ${#failed_servers[@]} -gt 0 ]]; then
        log_warning "分发失败的服务器:"
        for server in "${failed_servers[@]}"; do
            echo "  - $server"
        done
        return 1
    else
        log_success "所有服务器密钥分发成功！"
        return 0
    fi
}

# 生成本地SSH配置文件
generate_local_ssh_config() {
    log_step "生成本地SSH配置文件"

    local ssh_config="$HOME/.ssh/config_0379"

    # 备份现有配置
    if [[ -f "$HOME/.ssh/config" ]]; then
        cp "$HOME/.ssh/config" "$HOME/.ssh/config.backup.$(date +%Y%m%d_%H%M%S)"
    fi

    # 创建新的SSH配置
    cat > "$ssh_config" << 'EOF'
# =============================================================================
# 0379.email 项目 SSH 配置
# 自动生成 - $(date)
# =============================================================================

# 全局配置
Host *
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts_0379
    IdentityFile ~/.ssh/id_rsa
    Compression yes
    CompressionLevel 6
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p
    ControlPersist 600
    SendEnv LANG LC_*

    # 安全算法配置
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
    MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,umac-128-etm@openssh.com
    KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521,ecdh-sha2-nistp384,ecdh-sha2-nistp256

EOF

    # 添加服务器配置
    for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
        for server_name in $(jq -r ".${env} | keys[]" "$SERVERS_CONFIG"); do
            local hostname=$(jq -r ".${env}[\"${server_name}\"].hostname" "$SERVERS_CONFIG")
            local port=$(jq -r ".${env}[\"${server_name}\"].port" "$SERVERS_CONFIG")
            local user=$(jq -r ".${env}[\"${server_name}\"].user" "$SERVERS_CONFIG")
            local description=$(jq -r ".${env}[\"${server_name}\"].description" "$SERVERS_CONFIG")
            local environment=$(jq -r ".${env}[\"${server_name}\"].environment" "$SERVERS_CONFIG")
            local role=$(jq -r ".${env}[\"${server_name}\"].role" "$SERVERS_CONFIG")

            cat >> "$ssh_config" << EOF

# $description
Host $server_name
    HostName $hostname
    User $user
    Port $port
    IdentityFile ~/.ssh/keys/ssh/private/${server_name}
    PreferredAuthentications publickey
    PubkeyAuthentication yes
    PasswordAuthentication no
    ChallengeResponseAuthentication no

EOF

            # 根据环境类型添加特殊配置
            case "$environment" in
                "production")
                    cat >> "$ssh_config" << EOF
    # 生产服务器限制
    PermitLocalCommand no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no

EOF
                    ;;
                "storage")
                    cat >> "$ssh_config" << EOF
    # 存储服务器配置
    AllowTcpForwarding yes
    PermitLocalCommand yes

EOF
                    ;;
                "development")
                    cat >> "$ssh_config" << EOF
    # 开发服务器配置
    AllowTcpForwarding yes
    PermitLocalCommand yes
    X11Forwarding yes

EOF
                    ;;
            esac
        done
    done

    chmod 600 "$ssh_config"
    log_success "本地SSH配置文件生成完成: $ssh_config"

    # 创建符号链接
    if [[ ! -L "$HOME/.ssh/config" ]] || [[ ! -f "$HOME/.ssh/config" ]]; then
        ln -sf "$ssh_config" "$HOME/.ssh/config"
        log_info "创建SSH配置符号链接"
    fi
}

# 密钥轮换功能
rotate_keys() {
    local server_name="${1:-}"

    log_step "执行SSH密钥轮换"

    if [[ -n "$server_name" ]]; then
        # 轮换单个服务器密钥
        log_info "轮换单个服务器密钥: $server_name"

        # 备份现有密钥
        cp "$SSH_KEYS_DIR/private/$server_name" "$BACKUP_DIR/ssh/${server_name}.old.$(date +%Y%m%d_%H%M%S)"
        cp "$SSH_KEYS_DIR/public/$server_name.pub" "$BACKUP_DIR/ssh/${server_name}.pub.old.$(date +%Y%m%d_%H%M%S)"

        # 生成新密钥
        local hostname=$(jq -r ".production[\"${server_name}\"].hostname" "$SERVERS_CONFIG" 2>/dev/null)
        if [[ -z "$hostname" ]]; then
            hostname=$(jq -r "keys[] as \$env | .[\$env] | .[$server_name].hostname" "$SERVERS_CONFIG")
        fi

        local port=$(jq -r ".production[\"${server_name}\"].port" "$SERVERS_CONFIG" 2>/dev/null)
        if [[ -z "$port" ]]; then
            port=$(jq -r "keys[] as \$env | .[\$env] | .[$server_name].port" "$SERVERS_CONFIG")
        fi

        local user=$(jq -r ".production[\"${server_name}\"].user" "$SERVERS_CONFIG" 2>/dev/null)
        if [[ -z "$user" ]]; then
            user=$(jq -r "keys[] as \$env | .[\$env] | .[$server_name].user" "$SERVERS_CONFIG")
        fi

        generate_ssh_keypair "$server_name"

        # 重新分发密钥
        if [[ -n "$hostname" && -n "$port" && -n "$user" ]]; then
            distribute_key_to_server "$server_name" "$hostname" "$port" "$user" "true"
        fi

        log_success "单个服务器密钥轮换完成: $server_name"
    else
        # 轮换所有密钥
        log_warning "轮换所有服务器密钥将中断现有连接，确认继续吗？"
        read -p "输入 'YES' 继续: " confirm

        if [[ "$confirm" != "YES" ]]; then
            log_info "操作已取消"
            return 0
        fi

        # 备份所有现有密钥
        cp -r "$SSH_KEYS_DIR" "$BACKUP_DIR/ssh/all_keys.backup.$(date +%Y%m%d_%H%M%S)"

        # 重新生成所有密钥
        generate_all_keys

        # 重新分发所有密钥
        distribute_all_keys

        # 重新生成本地配置
        generate_local_ssh_config

        log_success "所有服务器密钥轮换完成"
    fi
}

# 安全检查功能
security_audit() {
    log_step "执行SSH密钥安全审计"

    local issues_found=()

    # 检查密钥文件权限
    log_info "检查密钥文件权限..."
    for key in "$SSH_KEYS_DIR"/private/*; do
        if [[ -f "$key" ]]; then
            local perms=$(stat -c "%a" "$key")
            if [[ "$perms" != "600" ]]; then
                issues_found+=("私钥权限不安全: $key ($perms)")
                chmod 600 "$key"
            fi
        fi
    done

    for key in "$SSH_KEYS_DIR"/public/*.pub; do
        if [[ -f "$key" ]]; then
            local perms=$(stat -c "%a" "$key")
            if [[ "$perms" != "644" ]]; then
                issues_found+=("公钥权限不安全: $key ($perms)")
                chmod 644 "$key"
            fi
        fi
    done

    # 检查配置文件权限
    if [[ -f "$SERVERS_CONFIG" ]]; then
        local perms=$(stat -c "%a" "$SERVERS_CONFIG")
        if [[ "$perms" != "600" ]]; then
            issues_found+=("配置文件权限不安全: $SERVERS_CONFIG ($perms)")
            chmod 600 "$SERVERS_CONFIG"
        fi
    fi

    # 检查目录权限
    local dir_perms=$(stat -c "%a" "$SSH_KEYS_DIR/private")
    if [[ "$dir_perms" != "700" ]]; then
        issues_found+=("私钥目录权限不安全: $SSH_KEYS_DIR/private ($dir_perms)")
        chmod 700 "$SSH_KEYS_DIR/private"
    fi

    # 检查过期密钥
    log_info "检查密钥有效期..."
    local current_date=$(date +%s)
    local key_age_limit=$((365 * 24 * 3600))  # 1年

    for key in "$SSH_KEYS_DIR"/private/*; do
        if [[ -f "$key" ]]; then
            local file_date=$(stat -c "%Y" "$key")
            local key_age=$((current_date - file_date))

            if [[ $key_age -gt $key_age_limit ]]; then
                local days_old=$((key_age / (24 * 3600)))
                issues_found+=("密钥过期: $(basename "$key") (${days_old}天)")
            fi
        fi
    done

    # 报告结果
    log_info "安全审计完成:"
    if [[ ${#issues_found[@]} -eq 0 ]]; then
        log_success "未发现安全问题"
    else
        log_warning "发现 ${#issues_found[@]} 个安全问题:"
        for issue in "${issues_found[@]}"; do
            echo "  ⚠️  $issue"
        done
    fi

    # 生成审计报告
    local audit_report="$LOG_DIR/security_audit_$(date +%Y%m%d_%H%M%S).log"
    cat > "$audit_report" << EOF
0379.email SSH密钥安全审计报告
审计时间: $(date)
审计员: $(whoami)
总问题数: ${#issues_found[@]}

问题详情:
EOF

    for issue in "${issues_found[@]}"; do
        echo "- $issue" >> "$audit_report"
    done

    log_success "安全审计报告已生成: $audit_report"
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 多机SSH密钥管理器

用法: $0 [命令] [选项]

命令:
    generate     生成所有SSH密钥
    distribute   分发SSH密钥到所有服务器
    test         测试所有服务器连接
    config       生成本地SSH配置文件
    rotate       轮换SSH密钥
    audit        执行安全审计
    status       显示当前状态
    help         显示此帮助信息

选项:
    --server NAME     指定单个服务器名称
    --env ENV         指定环境 (production/storage/development/monitoring/database/application)
    --force           强制执行操作
    --dry-run         仅显示将要执行的操作

示例:
    $0 generate                     # 生成所有密钥
    $0 generate --server yyc3-121  # 仅生成yyc3-121的密钥
    $0 distribute                    # 分发所有密钥
    $0 distribute --server yyc3-45 # 仅分发yyc3-45的密钥
    $0 test                         # 测试所有连接
    $0 rotate --server yyc3-121    # 轮换yyc3-121的密钥
    $0 audit                        # 执行安全审计

环境说明:
    production    - 生产环境服务器
    storage       - 存储服务器(NAS)
    development   - 开发服务器
    monitoring    - 监控服务器
    database      - 数据库服务器
    application   - 应用服务器

EOF
}

# 显示当前状态
show_status() {
    log_step "显示当前状态"

    echo ""
    echo -e "${CYAN}密钥统计:${NC}"
    echo "  私钥数量: $(find "$SSH_KEYS_DIR/private" -type f | wc -l)"
    echo "  公钥数量: $(find "$SSH_KEYS_DIR/public" -type f | wc -l)"
    echo "  授权目录: $(find "$SSH_KEYS_DIR/authorized_keys" -type d | wc -l)"

    echo ""
    echo -e "${CYAN}服务器配置:${NC}"
    if [[ -f "$SERVERS_CONFIG" ]]; then
        local total_servers=$(jq '[.. | keys | length] | add' "$SERVERS_CONFIG")
        echo "  总服务器数: $total_servers"

        for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
            local count=$(jq ".${env} | keys | length" "$SERVERS_CONFIG")
            echo "  $env: $count 个服务器"
        done
    else
        echo "  配置文件不存在"
    fi

    echo ""
    echo -e "${CYAN}文件位置:${NC}"
    echo "  密钥目录: $SSH_KEYS_DIR"
    echo "  配置文件: $SERVERS_CONFIG"
    echo "  备份目录: $BACKUP_DIR"
    echo "  日志目录: $LOG_DIR"

    echo ""
    echo -e "${CYAN}备份情况:${NC}"
    if [[ -d "$BACKUP_DIR" ]]; then
        echo "  SSH备份: $(find "$BACKUP_DIR/ssh" -type f 2>/dev/null | wc -l) 个文件"
        echo "  最新备份: $(ls -lt "$BACKUP_DIR/ssh" 2>/dev/null | head -2 | tail -1 | awk '{print $9}' || echo "无")"
    fi
}

# 主函数
main() {
    local command=""
    local options=()
    local options_str=""

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            generate|distribute|test|config|rotate|audit|status|help)
                command="$1"
                shift
                ;;
            --*)
                # 处理带值的选项
                case "$1" in
                    --server|--env)
                        if [[ $# -lt 2 ]]; then
                            log_error "选项 $1 需要参数值"
                            exit 1
                        fi
                        options+=("$1" "$2")
                        shift 2
                        ;;
                    --force|--dry-run)
                        options+=("$1")
                        shift
                        ;;
                    *)
                        log_error "未知选项: $1"
                        show_help
                        exit 1
                        ;;
                esac
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 构建options字符串用于检查
    if [[ ${#options[@]} -gt 0 ]]; then
        options_str="${options[*]}"
    else
        options_str=""
    fi

    # 初始化
    create_directories
    init_servers_config

    # 执行命令
    case "$command" in
        "generate")
            log_info "=== 生成SSH密钥 ==="
            if [[ -n "$options_str" ]] && [[ "$options_str" =~ "--server" ]]; then
                # 处理单个服务器
                server_name=$(echo "$options_str" | grep -o -- "--server [^[:space:]]*" | cut -d' ' -f2)
                if [[ -n "$server_name" ]]; then
                    generate_ssh_keypair "$server_name"
                fi
            else
                generate_all_keys
            fi
            ;;
        "distribute")
            log_info "=== 分发SSH密钥 ==="
            if [[ -n "$options_str" ]] && [[ "$options_str" =~ "--server" ]]; then
                # 处理单个服务器
                server_name=$(echo "$options_str" | grep -o -- "--server [^[:space:]]*" | cut -d' ' -f2)
                if [[ -n "$server_name" ]]; then
                    # 从配置中获取服务器信息
                    for env in $(jq -r 'keys[]' "$SERVERS_CONFIG"); do
                        if jq -e ".${env}[\"${server_name}\"]" "$SERVERS_CONFIG" >/dev/null; then
                            hostname=$(jq -r ".${env}[\"${server_name}\"].hostname" "$SERVERS_CONFIG")
                            port=$(jq -r ".${env}[\"${server_name}\"].port" "$SERVERS_CONFIG")
                            user=$(jq -r ".${env}[\"${server_name}\"].user" "$SERVERS_CONFIG")
                            distribute_key_to_server "$server_name" "$hostname" "$port" "$user"
                            break
                        fi
                    done
                fi
            else
                distribute_all_keys
            fi
            ;;
        "test")
            log_info "=== 测试服务器连接 ==="
            test_all_connections
            ;;
        "config")
            log_info "=== 生成本地SSH配置 ==="
            generate_local_ssh_config
            ;;
        "rotate")
            log_info "=== 轮换SSH密钥 ==="
            if [[ -n "$options_str" ]] && [[ "$options_str" =~ "--server" ]]; then
                server_name=$(echo "$options_str" | grep -o -- "--server [^[:space:]]*" | cut -d' ' -f2)
                rotate_keys "$server_name"
            else
                rotate_keys
            fi
            ;;
        "audit")
            log_info "=== 执行安全审计 ==="
            security_audit
            ;;
        "status")
            show_status
            ;;
        "help"|"")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 检查依赖
check_dependencies() {
    local missing_deps=()

    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi

    if ! command -v ssh >/dev/null 2>&1; then
        missing_deps+=("openssh-client")
    fi

    if ! command -v ssh-keygen >/dev/null 2>&1; then
        missing_deps+=("openssh-client")
    fi

    if ! command -v ssh-copy-id >/dev/null 2>&1; then
        missing_deps+=("openssh-client")
    fi

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "缺少依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
}

# 执行检查和主函数
check_dependencies
main "$@"