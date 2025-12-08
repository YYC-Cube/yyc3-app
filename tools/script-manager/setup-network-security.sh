#!/bin/bash
# =============================================================================
# 0379.email 项目 - 网络安全配置脚本
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

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NETWORK_DIR="$PROJECT_DIR/network-security"

# 创建目录
mkdir -p "$NETWORK_DIR"

# 创建防火墙配置
create_firewall_configs() {
    log_info "创建防火墙配置..."

    # iptables 规则配置
    cat > "$NETWORK_DIR/iptables-rules.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 iptables 防火墙规则
# =============================================================================

# 清空现有规则
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# 设置默认策略
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 允许本地回环
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# 允许已建立的连接
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH 访问控制 (仅允许特定IP)
# 替换为允许的IP地址列表
ALLOWED_SSH_IPS=(
    "192.168.3.0/24"    # 内网
    "10.0.0.0/8"        # 私有网络
    # "YOUR_OFFICE_IP/32"  # 办公室IP
)

for ip in "${ALLOWED_SSH_IPS[@]}"; do
    iptables -A INPUT -p tcp --dport 22 -s "$ip" -j ACCEPT
done

# Web 服务端口
iptables -A INPUT -p tcp --dport 80 -j ACCEPT   # HTTP
iptables -A INPUT -p tcp --dport 443 -j ACCEPT  # HTTPS

# 应用服务端口 (仅本地访问)
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT  # API
iptables -A INPUT -p tcp --dport 3001 -s 127.0.0.1 -j ACCEPT  # Admin
iptables -A INPUT -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT  # Redis
iptables -A INPUT -p tcp --dport 5432 -s 127.0.0.1 -j ACCEPT  # PostgreSQL

# 监控端口 (仅本地访问)
iptables -A INPUT -p tcp --dport 9090 -s 127.0.0.1 -j ACCEPT  # Prometheus
iptables -A INPUT -p tcp --dport 3002 -s 127.0.0.1 -j ACCEPT  # Grafana

# 防止DDoS攻击
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# 防止端口扫描
iptables -A INPUT -m recent --name portscan --rcheck --seconds 86400 -j DROP
iptables -A INPUT -m recent --name portscan --set -j LOG --log-prefix "Portscan:"
iptables -A INPUT -m recent --name portscan --set -j DROP

# 防止SYN洪水攻击
iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT

# 防止ICMP洪水攻击
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 5 -j ACCEPT

# 记录被拒绝的连接
iptables -A INPUT -j LOG --log-prefix "INPUT-DENIED: " --log-level 4
iptables -A FORWARD -j LOG --log-prefix "FORWARD-DENIED: " --log-level 4

echo "防火墙规则已应用"
EOF

    chmod +x "$NETWORK_DIR/iptables-rules.sh"

    # UFW 配置 (Ubuntu/Debian)
    cat > "$NETWORK_DIR/ufw-config.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 UFW 防火墙配置
# =============================================================================

# 重置 UFW
ufw --force reset

# 设置默认策略
ufw default deny incoming
ufw default allow outgoing

# 允许 SSH (仅特定IP)
ufw allow from 192.168.3.0/24 to any port 22
ufw allow from 10.0.0.0/8 to any port 22
# ufw allow from YOUR_OFFICE_IP to any port 22

# 允许 Web 服务
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# 启用 UFW
ufw --force enable

# 显示状态
ufw status verbose

echo "UFW 防火墙配置完成"
EOF

    chmod +x "$NETWORK_DIR/ufw-config.sh"

    # firewalld 配置 (CentOS/RHEL)
    cat > "$NETWORK_DIR/firewalld-config.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 firewalld 配置
# =============================================================================

# 启动 firewalld
systemctl enable firewalld
systemctl start firewalld

# 设置默认区域
firewall-cmd --set-default-zone=public

# 允许 SSH (仅特定IP)
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.3.0/24" service name="ssh" accept'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/8" service name="ssh" accept'
# firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="YOUR_OFFICE_IP/32" service name="ssh" accept'

# 允许 Web 服务
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# 创建内部服务区域
firewall-cmd --permanent --new-zone=internal
firewall-cmd --permanent --zone=internal --add-interface=docker0
firewall-cmd --permanent --zone=internal --add-port=3000/tcp  # API
firewall-cmd --permanent --zone=internal --add-port=3001/tcp  # Admin
firewall-cmd --permanent --zone=internal --add-port=6379/tcp  # Redis
firewall-cmd --permanent --zone=internal --add-port=5432/tcp  # PostgreSQL

# 限制连接频率
firewall-cmd --permanent --add-rich-rule='rule service name="http" limit value="100/m" accept'
firewall-cmd --permanent --add-rich-rule='rule service name="https" limit value="100/m" accept'

# 重新加载配置
firewall-cmd --reload

# 显示状态
firewall-cmd --list-all

echo "firewalld 配置完成"
EOF

    chmod +x "$NETWORK_DIR/firewalld-config.sh"

    log_success "防火墙配置脚本已创建"
}

# 创建 Fail2Ban 配置
create_fail2ban_config() {
    log_info "创建 Fail2Ban 配置..."

    cat > "$NETWORK_DIR/jail.local" << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
EOF

    # SSH 防护配置
    cat > "$NETWORK_DIR/fail2ban-ssh.conf" << 'EOF'
[Definition]
failregex = ^%(__prefix_line)s[iI] [[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\] .* authentication failure; .* rhost=<HOST>(?: port=\d+)?(?: user=\S+)?$
            ^%(__prefix_line)s[iI] [[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\] .* Did not receive identification string from <HOST>(?: port=\d+)?$
            ^%(__prefix_line)s[iI] [[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\] .* Received disconnect from <HOST>(?: port=\d+)?(?: \[preauth\])?$
            ^%(__prefix_line)s[iI] [[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\] .* Unable to negotiate with <HOST>(?: port=\d+)?: .*$
            ^%(__prefix_line)s[iI] [[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\] .* Bad protocol version identification '.*' from <HOST>(?: port=\d+)?$
ignoreregex =
EOF

    # Nginx 防护配置
    cat > "$NETWORK_DIR/fail2ban-nginx.conf" << 'EOF'
[Definition]
failregex = ^<HOST> -.*"(GET|POST|HEAD).*HTTP.*"(?:200|302|404|444|301|500).*$
            ^<HOST> -.*"(GET|POST|HEAD).*HTTP.*"$
ignoreregex = ^<HOST> -.*"(GET|POST|HEAD).*HTTP.*"(?:200|302|404|444|301|500).*".*"(?:Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider).*$
EOF

    log_success "Fail2Ban 配置已创建"
}

# 创建 DDoS 防护配置
create_ddos_protection() {
    log_info "创建 DDoS 防护配置..."

    # Nginx 速率限制配置
    cat > "$NETWORK_DIR/nginx-ddos.conf" << 'EOF'
# DDoS 防护配置

# 定义速率限制区域
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

# 连接限制区域
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

# 在 server 块中使用
server {
    # API 接口限制
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit_per_ip 10;
    }

    # 管理面板限制
    location /admin/ {
        limit_req zone=admin_limit burst=10 nodelay;
        limit_conn conn_limit_per_ip 5;
    }

    # 登录接口特殊限制
    location /api/auth/login {
        limit_req zone=login_limit burst=2 nodelay;
    }

    # 文件上传限制
    location /api/upload {
        limit_req zone=upload_limit burst=5 nodelay;
    }
}
EOF

    # 应用层 DDoS 防护脚本
    cat > "$NETWORK_DIR/ddos-protection.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目 DDoS 防护脚本
# =============================================================================

LOG_FILE="/var/log/ddos-protection.log"
BLOCK_DURATION=3600  # 封禁时长(秒)
THRESHOLD_REQUESTS=100  # 请求阈值
THRESHOLD_CONNECTIONS=50  # 连接阈值

# 记录日志
log_message() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
}

# 检查高频率IP
check_high_frequency_ips() {
    # 分析 Nginx 访问日志
    local high_freq_ips=$(awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | awk -v threshold="$THRESHOLD_REQUESTS" '$1 > threshold {print $2}')

    for ip in $high_freq_ips; do
        log_message "检测到高频IP: $ip"

        # 添加到 iptables 封禁列表
        iptables -A INPUT -s "$ip" -j DROP
        log_message "已封禁IP: $ip"

        # 设置自动解封
        echo "iptables -D INPUT -s $ip -j DROP" | at now + $((BLOCK_DURATION / 60)) minutes 2>/dev/null
    done
}

# 检查异常连接
check_abnormal_connections() {
    local suspicious_ips=$(netstat -an | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr | awk -v threshold="$THRESHOLD_CONNECTIONS" '$1 > threshold {print $2}')

    for ip in $suspicious_ips; do
        if [[ "$ip" != "0.0.0.0" ]] && [[ "$ip" != "::" ]]; then
            log_message "检测到异常连接IP: $ip"

            # 临时限制连接
            iptables -A INPUT -s "$ip" -p tcp --dport 80 -m limit --limit 10/minute -j ACCEPT
            iptables -A INPUT -s "$ip" -p tcp --dport 80 -j DROP
            log_message "已限制IP连接: $ip"
        fi
    done
}

# 清理过期封禁
cleanup_expired_blocks() {
    # 检查 iptables 规则并清理过期的
    # 这里可以添加更复杂的逻辑来管理封禁时间
    log_message "清理过期封禁规则"
}

# 主函数
main() {
    log_message "开始 DDoS 防护检查..."

    check_high_frequency_ips
    check_abnormal_connections
    cleanup_expired_blocks

    log_message "DDoS 防护检查完成"
}

main
EOF

    chmod +x "$NETWORK_DIR/ddos-protection.sh"

    log_success "DDoS 防护配置已创建"
}

# 创建网络监控配置
create_network_monitoring() {
    log_info "创建网络监控配置..."

    # 网络连接监控脚本
    cat > "$NETWORK_DIR/network-monitor.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目网络监控脚本
# =============================================================================

LOG_FILE="/var/log/network-monitor.log"
ALERT_THRESHOLD=1000  # 连接数阈值
PORT_SCAN_THRESHOLD=10  # 端口扫描阈值

log_message() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
}

# 监控网络连接
monitor_connections() {
    local total_connections=$(netstat -an | grep ESTABLISHED | wc -l)

    if [[ $total_connections -gt $ALERT_THRESHOLD ]]; then
        log_message "WARNING: 网络连接数过高: $total_connections"

        # 分析连接来源
        netstat -an | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr | head -10 >> "$LOG_FILE"
    fi
}

# 检测端口扫描
detect_port_scan() {
    local scan_attempt=$(netstat -an | grep SYN_RECV | wc -l)

    if [[ $scan_attempt -gt $PORT_SCAN_THRESHOLD ]]; then
        log_message "CRITICAL: 检测到可能的端口扫描: $scan_attempt SYN_RECV 连接"

        # 记录扫描源IP
        netstat -an | grep SYN_RECV | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -nr >> "$LOG_FILE"
    fi
}

# 监控带宽使用
monitor_bandwidth() {
    if command -v ifstat >/dev/null 2>&1; then
        local bandwidth_usage=$(ifstat 1 1 | tail -1 | awk '{print $2+$3}')
        local threshold_mb=100  # 100MB/s

        if (( $(echo "$bandwidth_usage > $threshold_mb" | bc -l) )); then
            log_message "WARNING: 带宽使用过高: ${bandwidth_usage}MB/s"
        fi
    fi
}

# 监控关键端口
monitor_critical_ports() {
    local critical_ports=(80 443 22 3000 3001 6379 5432)

    for port in "${critical_ports[@]}"; do
        local port_status=$(netstat -tuln | grep ":$port ")

        if [[ -z "$port_status" ]]; then
            log_message "CRITICAL: 关键端口 $port 未监听"
        fi
    done
}

# 主函数
main() {
    monitor_connections
    detect_port_scan
    monitor_bandwidth
    monitor_critical_ports
}

main
EOF

    chmod +x "$NETWORK_DIR/network-monitor.sh"

    # 网络性能监控脚本
    cat > "$NETWORK_DIR/network-performance.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目网络性能监控
# =============================================================================

LOG_FILE="/var/log/network-performance.log"

log_metric() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
}

# 检查网络延迟
check_latency() {
    local targets=("8.8.8.8" "1.1.1.1" "baidu.com")

    for target in "${targets[@]}"; do
        local latency=$(ping -c 3 "$target" 2>/dev/null | tail -1 | awk -F'/' '{print $5}' | cut -d. -f1)

        if [[ -n "$latency" ]]; then
            log_metric "LATENCY $target: ${latency}ms"

            if [[ $latency -gt 200 ]]; then
                log_metric "WARNING: 高延迟检测到 $target: ${latency}ms"
            fi
        fi
    done
}

# 检查网络吞吐量
check_throughput() {
    if command -v iperf3 >/dev/null 2>&1; then
        # 这里需要配置 iperf3 服务器
        log_metric "INFO: iperf3 可用，可进行吞吐量测试"
    fi
}

# 检查DNS解析
check_dns_resolution() {
    local domains=("0379.email" "google.com" "baidu.com")

    for domain in "${domains[@]}"; do
        local resolve_time=$(dig "$domain" | grep "Query time" | awk '{print $4}')

        if [[ -n "$resolve_time" ]]; then
            log_metric "DNS_RESOLVE $domain: ${resolve_time}ms"

            if [[ ${resolve_time%ms} -gt 1000 ]]; then
                log_metric "WARNING: DNS解析缓慢 $domain: $resolve_time"
            fi
        fi
    done
}

# 检查SSL握手时间
check_ssl_handshake() {
    if command -v openssl >/dev/null 2>&1; then
        local start_time=$(date +%s%N)
        openssl s_client -connect 0379.email:443 </dev/null 2>/dev/null | grep "Verify return code" >/dev/null
        local end_time=$(date +%s%N)
        local handshake_time=$(( (end_time - start_time) / 1000000 ))

        log_metric "SSL_HANDSHAKE: ${handshake_time}ms"

        if [[ $handshake_time -gt 1000 ]]; then
            log_metric "WARNING: SSL握手时间过长: ${handshake_time}ms"
        fi
    fi
}

# 主函数
main() {
    check_latency
    check_throughput
    check_dns_resolution
    check_ssl_handshake
}

main
EOF

    chmod +x "$NETWORK_DIR/network-performance.sh"

    log_success "网络监控配置已创建"
}

# 创建网络自动化配置
create_network_automation() {
    log_info "创建网络自动化配置..."

    # 自动化部署脚本
    cat > "$NETWORK_DIR/deploy-network-security.sh" << 'EOF'
#!/bin/bash
# =============================================================================
# 0379.email 项目网络安全自动化部署
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/debian_version ]]; then
        echo "debian"
    elif [[ -f /etc/redhat-release ]]; then
        echo "redhat"
    else
        echo "unknown"
    fi
}

# 配置防火墙
configure_firewall() {
    local os=$(detect_os)

    log_info "配置防火墙 (OS: $os)..."

    case $os in
        "debian")
            if command -v ufw >/dev/null 2>&1; then
                "$SCRIPT_DIR/ufw-config.sh"
            else
                log_error "UFW 未安装"
            fi
            ;;
        "redhat")
            if command -v firewall-cmd >/dev/null 2>&1; then
                "$SCRIPT_DIR/firewalld-config.sh"
            else
                "$SCRIPT_DIR/iptables-rules.sh"
            fi
            ;;
        *)
            log_error "不支持的操作系统"
            ;;
    esac
}

# 配置 Fail2Ban
configure_fail2ban() {
    log_info "配置 Fail2Ban..."

    # 安装 Fail2Ban
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y fail2ban
    elif command -v yum >/dev/null 2>&1; then
        yum install -y epel-release && yum install -y fail2ban
    fi

    # 复制配置文件
    if [[ -f /etc/fail2ban/jail.conf ]]; then
        cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    fi

    # 应用自定义配置
    if [[ -f "$SCRIPT_DIR/jail.local" ]]; then
        cp "$SCRIPT_DIR/jail.local" /etc/fail2ban/
    fi

    # 启动服务
    systemctl enable fail2ban
    systemctl restart fail2ban

    log_success "Fail2Ban 配置完成"
}

# 设置监控任务
setup_monitoring() {
    log_info "设置网络监控任务..."

    # 创建监控脚本目录
    mkdir -p /usr/local/bin/0379-network-monitor

    # 复制监控脚本
    cp "$SCRIPT_DIR"/*.sh /usr/local/bin/0379-network-monitor/ 2>/dev/null || true

    # 添加到 crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/0379-network-monitor/network-monitor.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/10 * * * * /usr/local/bin/0379-network-monitor/network-performance.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/2 * * * * /usr/local/bin/0379-network-monitor/ddos-protection.sh") | crontab -

    log_success "监控任务设置完成"
}

# 主函数
main() {
    log_info "开始部署网络安全配置..."

    configure_firewall
    configure_fail2ban
    setup_monitoring

    log_success "网络安全配置部署完成"

    # 显示状态
    echo ""
    log_info "服务状态检查:"
    systemctl status fail2ban --no-pager
    ufw status 2>/dev/null || firewall-cmd --state 2>/dev/null || iptables -L -n | head -10
}

main
EOF

    chmod +x "$NETWORK_DIR/deploy-network-security.sh"

    log_success "网络自动化配置已创建"
}

# 创建网络安全文档
create_network_documentation() {
    log_info "创建网络安全文档..."

    cat > "$NETWORK_DIR/../docs/NETWORK_SECURITY_GUIDE.md" << 'EOF'
# 0379.email 项目网络安全指南

## 概述

本文档描述了 0379.email 项目的网络安全配置和最佳实践。

## 网络架构

```
互联网
    ↓
防火墙 (UFW/iptables)
    ↓
负载均衡器 (Nginx)
    ↓
Web 应用层
    ├── API 服务 (3000)
    ├── 管理面板 (3001)
    └── 监控服务 (9090, 3002)
    ↓
数据层
    ├── Redis (6379)
    └── PostgreSQL (5432)
```

## 安全措施

### 1. 防火墙配置

#### 端口开放策略
- **80/tcp**: HTTP (所有IP)
- **443/tcp**: HTTPS (所有IP)
- **22/tcp**: SSH (仅允许特定IP)
- **内部端口**: 仅本地访问 (3000, 3001, 6379, 5432)

#### 使用方法
```bash
# Ubuntu/Debian
./network-security/ufw-config.sh

# CentOS/RHEL
./network-security/firewalld-config.sh

# 通用
./network-security/iptables-rules.sh
```

### 2. DDoS 防护

#### 速率限制
- API 接口: 10 请求/秒
- 管理面板: 5 请求/秒
- 登录接口: 1 请求/秒
- 文件上传: 2 请求/秒

#### 自动防护脚本
```bash
# 运行 DDoS 防护
./network-security/ddos-protection.sh

# 添加到定时任务
*/2 * * * * /path/to/ddos-protection.sh
```

### 3. 入侵检测 (Fail2Ban)

#### 保护的服务
- SSH: 3次失败后封禁1小时
- HTTP认证: 5次失败后封禁1小时
- 机器人检测: 2次失败后封禁24小时

#### 配置文件位置
- 主配置: `/etc/fail2ban/jail.local`
- 日志路径: `/var/log/fail2ban.log`

### 4. 网络监控

#### 监控指标
- 网络连接数
- 端口扫描检测
- 带宽使用情况
- DNS解析性能
- SSL握手时间

#### 监控脚本
```bash
# 网络连接监控
./network-security/network-monitor.sh

# 网络性能监控
./network-security/network-performance.sh
```

## 部署指南

### 自动化部署
```bash
# 一键部署所有网络安全配置
./network-security/deploy-network-security.sh
```

### 手动部署步骤

1. **配置防火墙**
   ```bash
   sudo ./network-security/ufw-config.sh  # Ubuntu
   sudo ./network-security/firewalld-config.sh  # CentOS
   ```

2. **安装和配置 Fail2Ban**
   ```bash
   sudo ./network-security/deploy-network-security.sh
   ```

3. **设置监控**
   ```bash
   # 复制监控脚本到系统目录
   sudo cp network-security/*.sh /usr/local/bin/

   # 添加定时任务
   crontab -e
   ```

## 应急响应

### DDoS 攻击响应
1. 立即运行 DDoS 防护脚本
2. 检查高频率 IP 并手动封禁
3. 启用更严格的速率限制
4. 考虑启用 CDN 服务

### 入侵检测响应
1. 检查 Fail2Ban 日志
2. 分析被封禁的 IP 地址
3. 加强认证机制
4. 更新密码和密钥

### 网络故障响应
1. 检查防火墙规则
2. 验证服务端口状态
3. 查看网络监控日志
4. 测试连通性

## 最佳实践

### 1. 定期维护
- 每周检查防火墙日志
- 每月更新封禁规则
- 季度安全评估

### 2. 监控告警
- 设置关键指标阈值
- 配置邮件/短信告警
- 建立值班制度

### 3. 备份和恢复
- 定期备份网络配置
- 测试恢复流程
- 文档化所有变更

## 故障排除

### 常见问题

#### 防火墙阻止合法访问
```bash
# 检查防火墙状态
sudo ufw status verbose
sudo iptables -L -n

# 临时添加规则
sudo ufw allow from IP_ADDRESS
```

#### Fail2Ban 误封
```bash
# 查看被封禁的 IP
sudo fail2ban-client status sshd

# 解封 IP
sudo fail2ban-client set sshd unbanip IP_ADDRESS
```

#### 高网络延迟
```bash
# 检查网络连接
ping 8.8.8.8
traceroute 8.8.8.8

# 检查带宽使用
iftop -i eth0
```

## 联系信息

如有网络安全问题，请联系：
- 安全团队邮箱: security@0379.email
- 紧急联系电话: [待填写]

---
*文档版本: 1.0*
*最后更新: $(date)*
EOF

    log_success "网络安全文档已创建"
}

# 主函数
main() {
    log_info "开始创建 0379.email 项目网络安全配置..."

    create_firewall_configs
    create_fail2ban_config
    create_ddos_protection
    create_network_monitoring
    create_network_automation
    create_network_documentation

    log_success "网络安全配置创建完成！"
    log_info "配置目录: $NETWORK_DIR"
    log_info "部署脚本: $NETWORK_DIR/deploy-network-security.sh"
    log_info "文档位置: $PROJECT_DIR/docs/NETWORK_SECURITY_GUIDE.md"

    log_warning "请："
    log_warning "1. 在服务器上运行: ./network-security/deploy-network-security.sh"
    log_warning "2. 根据实际环境调整配置参数"
    log_warning "3. 定期检查和维护网络安全设置"
}

# 显示帮助信息
show_help() {
    cat << EOF
0379.email 项目网络安全配置脚本

用法: $0 [选项]

选项:
    -h, --help     显示此帮助信息
    -f, --firewall 仅创建防火墙配置
    -d, --ddos     仅创建 DDoS 防护配置
    -m, --monitor  仅创建监控配置
    -a, --auto     仅创建自动化配置

示例:
    $0              # 创建所有配置
    $0 -f           # 仅创建防火墙配置
    $0 -d           # 仅创建 DDoS 防护

EOF
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--firewall)
            create_firewall_configs
            exit 0
            ;;
        -d|--ddos)
            create_ddos_protection
            exit 0
            ;;
        -m|--monitor)
            create_network_monitoring
            exit 0
            ;;
        -a|--auto)
            create_network_automation
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main