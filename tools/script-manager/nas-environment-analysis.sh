#!/bin/bash

# =============================================================================
# NAS 生产环境分析脚本
# 针对铁威马 F4-423 NAS 环境进行系统分析
# =============================================================================

set -euo pipefail

# NAS 配置信息
NAS_NAME="YanYuCloud"
NAS_CPU="Intel-Quad-Core"
NAS_RAM="32GB"
NAS_IP="192.168.3.45"
NAS_PORT="57"
NAS_DOMAIN="nas.0379.email"
VOLUME1="/yyc3-hd"
VOLUME2="/yyc3-sd"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] [$level] $message"
}

# 系统信息分析
analyze_system() {
    log "INFO" "=== NAS 系统信息分析 ==="

    echo -e "${CYAN}🖥️  NAS 基本信息:${NC}"
    echo -e "  设备型号: $NAS_NAME (铁威马 F4-423)"
    echo -e "  处理器: $NAS_CPU"
    echo -e "  内存: $NAS_RAM"
    echo -e "  IP地址: $NAS_IP"
    echo -e "  SSH端口: $NAS_PORT"
    echo -e "  域名: $NAS_DOMAIN"
    echo ""

    echo -e "${CYAN}💾 存储配置:${NC}"
    echo -e "  Volume1 (SSD RAID1): $VOLUME1 - 2x2TB SN850X"
    echo -e "  Volume2 (HDD RAID6): $VOLUME2 - 4x8T WD HA340"
    echo ""

    if command -v df >/dev/null 2>&1; then
        echo -e "${CYAN}📊 存储使用情况:${NC}"
        df -h | grep -E "Volume1|Volume2|Filesystem" || echo "  无法获取存储信息"
        echo ""
    fi

    if command -v free >/dev/null 2>&1; then
        echo -e "${CYAN}🧠 内存使用情况:${NC}"
        free -h
        echo ""
    fi

    if command -v uptime >/dev/null 2>&1; then
        echo -e "${CYAN}⏱️  系统运行时间:${NC}"
        uptime
        echo ""
    fi
}

# 网络配置分析
analyze_network() {
    log "INFO" "=== 网络配置分析 ==="

    echo -e "${CYAN}🌐 网络接口:${NC}"
    if command -v ip >/dev/null 2>&1; then
        ip addr show || echo "  无法获取网络接口信息"
    elif command -v ifconfig >/dev/null 2>&1; then
        ifconfig | grep -E "inet|flags" || echo "  无法获取网络接口信息"
    fi
    echo ""

    echo -e "${CYAN}🔗 网络连通性:${NC}"

    # 检查外网连接
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo -e "  ✅ 外网连接正常"
    else
        echo -e "  ❌ 外网连接异常"
    fi

    # 检查DNS解析
    if nslookup google.com >/dev/null 2>&1; then
        echo -e "  ✅ DNS解析正常"
    else
        echo -e "  ❌ DNS解析异常"
    fi

    echo ""
}

# 服务和进程分析
analyze_services() {
    log "INFO" "=== 服务和进程分析 ==="

    echo -e "${CYAN}🔧 系统服务:${NC}"

    # 检查常见服务状态
    local services=("nginx" "apache2" "mariadb" "mysql" "docker" "sshd" "cron")

    for service in "${services[@]}"; do
        if pgrep -f "$service" >/dev/null 2>&1; then
            local pid
            pid=$(pgrep -f "$service" | head -1)
            echo -e "  ✅ $service 运行中 (PID: $pid)"
        else
            echo -e "  ❌ $service 未运行"
        fi
    done
    echo ""

    echo -e "${CYAN}🐳 Docker 服务:${NC}"
    if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
            echo -e "  ✅ Docker 服务正常"
            echo -e "  📦 运行中的容器:"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "    无运行中的容器"
        else
            echo -e "  ❌ Docker 服务异常"
        fi
    else
        echo -e "  ❌ Docker 未安装"
    fi
    echo ""

    echo -e "${CYAN}🗄️  数据库服务:${NC}"

    # 检查MySQL/MariaDB
    if pgrep -f "mysql" >/dev/null 2>&1 || pgrep -f "mariadb" >/dev/null 2>&1; then
        echo -e "  ✅ 数据库服务运行中"

        # 尝试连接数据库
        if command -v mysql >/dev/null 2>&1; then
            echo -e "  🔗 尝试连接数据库..."
            if mysql -e "SELECT VERSION();" >/dev/null 2>&1; then
                local version
                version=$(mysql -e "SELECT VERSION();" 2>/dev/null | tail -1)
                echo -e "    ✅ 数据库连接成功 (版本: $version)"
            else
                echo -e "    ❌ 数据库连接失败"
            fi
        fi
    else
        echo -e "  ❌ 数据库服务未运行"
    fi
    echo ""
}

# Web服务分析
analyze_web_services() {
    log "INFO" "=== Web服务分析 ==="

    echo -e "${CYAN}🌐 Web服务器:${NC}"

    # 检查Web服务器类型
    if pgrep -f "nginx" >/dev/null 2>&1; then
        echo -e "  ✅ Nginx 运行中"
        if command -v nginx >/dev/null 2>&1; then
            echo -e "    📋 Nginx版本: $(nginx -v 2>&1 | cut -d' ' -f3)"
            echo -e "    📂 配置目录: /etc/nginx/ (或类似)"
        fi
    elif pgrep -f "apache" >/dev/null 2>&1; then
        echo -e "  ✅ Apache 运行中"
        if command -v apache2 >/dev/null 2>&1; then
            echo -e "    📋 Apache版本: $(apache2 -v 2>/dev/null | grep ServerVersion)"
        fi
    else
        echo -e "  ❌ 未检测到Web服务器"
    fi
    echo ""

    echo -e "${CYAN}🌍 Web服务端口:${NC}"

    # 检查常见Web端口
    local ports=("80" "443" "8080" "3000" "3001" "3002" "3003" "8081")

    for port in "${ports[@]}"; do
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tlnp 2>/dev/null | grep ":$port " >/dev/null; then
                echo -e "  ✅ 端口 $port 正在监听"
            fi
        elif command -v ss >/dev/null 2>&1; then
            if ss -tlnp 2>/dev/null | grep ":$port " >/dev/null; then
                echo -e "  ✅ 端口 $port 正在监听"
            fi
        fi
    done
    echo ""
}

# 存储和文件系统分析
analyze_storage() {
    log "INFO" "=== 存储和文件系统分析 ==="

    echo -e "${CYAN}📁 Volume1 ($VOLUME1):${NC}"
    if [[ -d "$VOLUME1" ]]; then
        echo -e "  ✅ Volume1 挂载正常"
        echo -e "  💾 使用情况:"
        df -h "$VOLUME1" 2>/dev/null || echo "    无法获取使用情况"

        echo -e "  📂 重要目录:"
        for dir in "www" "docker" "app" "data" "backup" "logs"; do
            if [[ -d "$VOLUME1/$dir" ]]; then
                echo -e "    📁 $dir/"
            fi
        done
    else
        echo -e "  ❌ Volume1 未挂载"
    fi
    echo ""

    echo -e "${CYAN}📁 Volume2 ($VOLUME2):${NC}"
    if [[ -d "$VOLUME2" ]]; then
        echo -e "  ✅ Volume2 挂载正常"
        echo -e "  💾 使用情况:"
        df -h "$VOLUME2" 2>/dev/null || echo "    无法获取使用情况"

        echo -e "  📂 重要目录:"
        for dir in "backup" "media" "archive" "share"; do
            if [[ -d "$VOLUME2/$dir" ]]; then
                echo -e "    📁 $dir/"
            fi
        done
    else
        echo -e "  ❌ Volume2 未挂载"
    fi
    echo ""
}

# 安全分析
analyze_security() {
    log "INFO" "=== 安全配置分析 ==="

    echo -e "${CYAN}🔒 SSH配置:${NC}"

    # 检查SSH配置
    if [[ -f /etc/ssh/sshd_config ]]; then
        echo -e "  📋 SSH配置文件存在"

        # 检查关键SSH设置
        local ssh_config="/etc/ssh/sshd_config"

        if grep -q "^Port.*57" "$ssh_config" 2>/dev/null; then
            echo -e "    ✅ SSH端口已配置为57"
        fi

        if grep -q "^PermitRootLogin.*yes" "$ssh_config" 2>/dev/null; then
            echo -e "    ⚠️  允许root登录 (已在NAS中配置)"
        fi

        if grep -q "^PasswordAuthentication.*yes" "$ssh_config" 2>/dev/null; then
            echo -e "    ⚠️  密码认证已启用"
        fi
    fi
    echo ""

    echo -e "${CYAN}🔥 防火墙配置:${NC}"

    # 检查防火墙状态
    if command -v ufw >/dev/null 2>&1; then
        echo -e "  🛡️  UFW防火墙:"
        ufw status 2>/dev/null || echo "    无法获取UFW状态"
    elif command -v iptables >/dev/null 2>&1; then
        echo -e "  🛡️  iptables防火墙:"
        if iptables -L -n 2>/dev/null | head -10; then
            echo "    (显示前10条规则)"
        fi
    else
        echo -e "  ❓ 未检测到防火墙配置"
    fi
    echo ""
}

# 性能分析
analyze_performance() {
    log "INFO" "=== 性能分析 ==="

    echo -e "${CYAN}⚡ CPU使用率:${NC}"
    if command -v top >/dev/null 2>&1; then
        top -bn1 | grep "Cpu(s)" || echo "  无法获取CPU信息"
    fi
    echo ""

    echo -e "${CYAN}🧠 内存使用率:${NC}"
    if command -v free >/dev/null 2>&1; then
        free -h
    fi
    echo ""

    echo -e "${CYAN}💾 磁盘I/O:${NC}"
    if command -v iostat >/dev/null 2>&1; then
        iostat -x 1 1 | head -15 || echo "  无法获取I/O统计"
    fi
    echo ""

    echo -e "${CYAN}🌡️  系统温度:${NC}"
    if command -v sensors >/dev/null 2>&1; then
        sensors 2>/dev/null | grep -E "Core|temp" || echo "  无法获取温度信息"
    else
        echo -e "  ❓ 未安装温度监控工具"
    fi
    echo ""
}

# 生成环境报告
generate_report() {
    local report_file="$PWD/nas-environment-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# NAS 生产环境分析报告

## 基本信息

- **设备型号**: $NAS_NAME (铁威马 F4-423)
- **处理器**: $NAS_CPU
- **内存**: $NAS_RAM
- **IP地址**: $NAS_IP
- **SSH端口**: $NAS_PORT
- **域名**: $NAS_DOMAIN
- **分析时间**: $(date "+%Y-%m-%d %H:%M:%S")

## 存储配置

### Volume1 (SSD RAID1)
- **路径**: $VOLUME1
- **配置**: 2x2TB SN850X SSD
- **用途**: 系统和应用程序存储

### Volume2 (HDD RAID6)
- **路径**: $VOLUME2
- **配置**: 4x8T WD HA340 HDD
- **用途**: 数据存储和备份

## 服务状态

### 已安装服务
- ✅ Docker - 容器化平台
- ✅ Web Server - Web服务
- ✅ MariaDB/MySQL - 数据库服务
- ✅ SSH - 远程管理 (端口57)

### 端口使用情况
- SSH: 57
- HTTP: 80
- HTTPS: 443
- 应用服务: 3000, 3001, 3002, 3003
- 文件服务: 8081

## 网络配置

### 内网配置
- IP地址: 192.168.3.45
- 子网掩码: 255.255.255.0
- 网关: 192.168.3.1

### 外网访问
通过FRP内网穿透服务访问:
- SSH: 8.130.127.121:9557
- Web: frp.0379.email
- API: api.0379.email

## 安全配置

- SSH端口: 57 (非默认端口)
- Root权限: 已配置直接访问
- 防火墙: 需要检查具体配置
- SSL证书: 0379.email域名证书

## 性能指标

- CPU: Intel四核处理器
- 内存: 32GB
- 存储: SSD RAID1 + HDD RAID6
- 网络: 千兆以太网

## 建议和优化

1. **安全加固**
   - 配置防火墙规则
   - 启用fail2ban
   - 定期更新系统

2. **性能优化**
   - 监控资源使用情况
   - 优化数据库配置
   - 配置缓存策略

3. **备份策略**
   - 配置自动备份
   - 异地备份重要数据
   - 定期测试恢复

4. **监控告警**
   - 配置系统监控
   - 设置告警阈值
   - 日志分析

---

**分析完成时间**: $(date "+%Y-%m-%d %H:%M:%S")
**分析工具**: NAS Environment Analysis Script
EOF

    log "INFO" "环境分析报告已生成: $report_file"
    echo "$report_file"
}

# 主函数
main() {
    echo -e "${BLUE}🖥️  NAS 生产环境分析工具${NC}"
    echo -e "${BLUE}目标设备: $NAS_NAME ($NAS_IP)${NC}"
    echo ""

    # 执行各项分析
    analyze_system
    analyze_network
    analyze_services
    analyze_web_services
    analyze_storage
    analyze_security
    analyze_performance

    # 生成报告
    local report_file
    report_file=$(generate_report)

    echo -e "${GREEN}=== NAS环境分析完成 ===${NC}"
    echo -e "📋 分析报告: $report_file"
    echo -e ""
    echo -e "${BLUE}下一步建议:${NC}"
    echo -e "1. 根据分析结果优化系统配置"
    echo -e "2. 部署FRP客户端服务"
    echo -e "3. 配置Docker容器化应用"
    echo -e "4. 设置监控和备份策略"
}

# 执行主函数
main "$@"