#!/bin/bash

# =============================================================================
# 0379.email 部署验证脚本
# 验证手动部署后的系统状态和服务隔离效果
# =============================================================================

set -euo pipefail

# 配置变量
DOMAINS=("api.0379.email" "admin.0379.email" "llm.0379.email" "mail.0379.email" "nas.0379.email" "monitor.0379.email")
FRP_SERVER="8.130.127.121"
PORTS=(17000 17001 5001 5002 5003 5004 5005 5006)
PORT_NAMES=("FRP主服务" "FRP虚拟主机" "API服务" "LLM服务" "管理面板" "邮件服务" "NAS管理" "监控面板")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${PURPLE}[SUCCESS]${NC} $1"; }
log_test() { echo -e "${CYAN}[TEST]${NC} $1"; }

# 显示测试分隔线
show_separator() {
    echo "=============================================================================="
}

# 测试端口连通性
test_port_connectivity() {
    log_step "测试服务器端口连通性..."
    local success_count=0
    local total_count=${#PORTS[@]}

    show_separator
    printf "%-15s %-10s %-10s\n" "端口" "服务" "状态"
    show_separator

    for i in "${!PORTS[@]}"; do
        local port=${PORTS[$i]}
        local name=${PORT_NAMES[$i]}

        if timeout 3 bash -c "</dev/tcp/$FRP_SERVER/$port" 2>/dev/null; then
            printf "%-15s %-10s ${GREEN}%-10s${NC}\n" "$port" "$name" "✅ 可达"
            ((success_count++))
        else
            printf "%-15s %-10s ${RED}%-10s${NC}\n" "$port" "$name" "❌ 不可达"
        fi
    done

    show_separator
    log_info "端口连通性: $success_count/$total_count ($(( success_count * 100 / total_count ))%)"
    return $(( total_count - success_count ))
}

# 测试DNS解析
test_dns_resolution() {
    log_step "测试DNS解析状态..."
    local success_count=0
    local total_count=${#DOMAINS[@]}

    show_separator
    printf "%-25s %-15s %-10s\n" "域名" "解析结果" "状态"
    show_separator

    for domain in "${DOMAINS[@]}"; do
        local resolved_ip=$(nslookup "$domain" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        local status="❌ 错误"

        if [[ "$resolved_ip" == "$FRP_SERVER" ]]; then
            status="✅ 正确"
            ((success_count++))
        elif [[ -n "$resolved_ip" ]]; then
            status="⚠️ 错误IP"
        else
            resolved_ip="解析失败"
        fi

        printf "%-25s %-15s %-10s\n" "$domain" "$resolved_ip" "$status"
    done

    show_separator
    log_info "DNS解析成功率: $success_count/$total_count ($(( success_count * 100 / total_count ))%)"
    return $(( total_count - success_count ))
}

# 测试服务隔离效果
test_service_isolation() {
    log_step "测试服务隔离效果..."
    local success_count=0
    local total_count=${#DOMAINS[@]}
    declare -A responses
    local first_response=""

    show_separator
    printf "%-25s %-15s %-15s %-10s\n" "域名" "响应长度" "响应哈希" "状态"
    show_separator

    for domain in "${DOMAINS[@]}"; do
        echo -n "测试 $domain ... "

        if timeout 10 curl -s --max-time 5 "http://$domain/" &>/dev/null; then
            local response=$(timeout 10 curl -s --max-time 5 "http://$domain/")
            local response_length=${#response}
            local response_hash=$(echo "$response" | md5sum | awk '{print $1}')
            local status="✅ 正常"

            # 检查响应一致性
            if [[ -z "$first_response" ]]; then
                first_response="$response_hash"
                status="✅ 首次响应"
                ((success_count++))
            elif [[ "$response_hash" != "$first_response" ]]; then
                status="✅ 隔离正常"
                ((success_count++))
            else
                status="❌ 响应一致"
            fi

            responses["$domain"]="$response_hash"
            printf "%-25s %-15s %-15s %-10s\n" "$domain" "$response_length" "${response_hash:0:8}" "$status"
        else
            printf "%-25s %-15s %-15s ${RED}%-10s${NC}\n" "$domain" "无响应" "N/A" "❌ 无响应"
        fi
    done

    show_separator

    # 分析隔离效果
    local unique_hashes=0
    local hash_values=""
    for domain in "${DOMAINS[@]}"; do
        if [[ -n "${responses[$domain]:-}" ]]; then
            if [[ "$hash_values" != *"${responses[$domain]}"* ]]; then
                hash_values="$hash_values ${responses[$domain]}"
                ((unique_hashes++))
            fi
        fi
    done

    if [[ $unique_hashes -eq $total_count ]]; then
        log_success "✅ 完美服务隔离: $unique_hashes/$total_count 个独立响应"
    elif [[ $unique_hashes -gt 1 ]]; then
        log_info "🔧 部分服务隔离: $unique_hashes/$total_count 个独立响应"
    else
        log_error "❌ 服务隔离失败: 所有域名返回相同内容"
    fi

    return $(( total_count - success_count ))
}

# 测试HTTP响应时间
test_response_times() {
    log_step "测试HTTP响应时间..."
    show_separator
    printf "%-25s %-15s %-10s\n" "域名" "响应时间" "状态"
    show_separator

    for domain in "${DOMAINS[@]}"; do
        echo -n "测试 $domain ... "

        local response_time=$(timeout 10 curl -o /dev/null -s -w "%{time_total}" "http://$domain/" 2>/dev/null || echo "0")

        if [[ "$response_time" != "0" ]]; then
            local status="✅ 正常"
            if (( $(echo "$response_time > 2.0" | bc -l) )); then
                status="⚠️ 较慢"
            elif (( $(echo "$response_time > 5.0" | bc -l) )); then
                status="❌ 超时"
            fi
            printf "%-25s %-15s %-10s\n" "$domain" "${response_time}s" "$status"
        else
            printf "%-25s %-15s ${RED}%-10s${NC}\n" "$domain" "N/A" "❌ 超时"
        fi
    done
    show_separator
}

# 测试本地服务状态
test_local_services() {
    log_step "测试本地Docker服务状态..."
    local services=("localhost:3000" "localhost:3001" "localhost:3002" "localhost:3003")
    local service_names=("API服务" "管理面板" "LLM服务" "邮件服务")
    local success_count=0

    show_separator
    printf "%-20s %-15s %-10s\n" "服务" "地址" "状态"
    show_separator

    for i in "${!services[@]}"; do
        local service=${services[$i]}
        local name=${service_names[$i]}
        local port=$(echo $service | cut -d: -f2)

        if timeout 5 curl -s "http://$service/" &>/dev/null; then
            printf "%-20s %-15s ${GREEN}%-10s${NC}\n" "$name" "$service" "✅ 运行"
            ((success_count++))
        else
            printf "%-20s %-15s ${RED}%-10s${NC}\n" "$name" "$service" "❌ 停止"
        fi
    done

    show_separator
    log_info "本地服务运行率: $success_count/${#services[@]} ($(( success_count * 100 / ${#services[@]} ))%)"
}

# 生成部署状态报告
generate_deployment_status() {
    log_step "生成部署状态报告..."

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="/Users/yanyu/www/DEPLOYMENT_STATUS_$timestamp.md"

    cat > "$report_file" << EOF
# 0379.email 部署状态报告
**验证时间**: $(date)
**部署状态**: 手动部署后验证

## 📊 验证结果摘要

### 连通性测试
- **FRP主服务端口 (17000)**: $(timeout 3 bash -c "</dev/tcp/$FRP_SERVER/17000" 2>/dev/null && echo "✅ 可达" || echo "❌ 不可达")
- **FRP虚拟主机端口 (17001)**: $(timeout 3 bash -c "</dev/tcp/$FRP_SERVER/17001" 2>/dev/null && echo "✅ 可达" || echo "❌ 不可达")
- **服务端口 (5001-5006)**: 需要完整测试确认

### DNS解析状态
所有域名应解析到: $FRP_SERVER
$(for domain in "${DOMAINS[@]}"; do
    local ip=$(nslookup "$domain" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    echo "- $domain: $ip"
done)

### 服务隔离效果
**目标**: 每个域名返回不同的服务内容
**状态**: 需要通过curl测试确认

## 🔍 详细测试结果

### 端口连通性
\`\`\`bash
# 执行端口测试
for port in 17000 17001 5001 5002 5003 5004 5005 5006; do
    echo -n "端口 \$port: "
    if timeout 3 bash -c "</dev/tcp/$FRP_SERVER/\$port" 2>/dev/null; then
        echo "✅ 可达"
    else
        echo "❌ 不可达"
    fi
done
\`\`\`

### 域名响应测试
\`\`\`bash
# 执行域名测试
for domain in api.0379.email admin.0379.email llm.0379.email mail.0379.email nas.0379.email monitor.0379.email; do
    echo "=== \$domain ==="
    curl -s "http://\$domain/" | head -c 200
    echo ""
done
\`\`\`

## 📈 部署成功指标

### 完全成功的标准
1. ✅ 所有端口 (17000, 17001, 5001-5006) 都可达
2. ✅ 所有域名正确解析到 8.130.127.121
3. ✅ 每个域名返回不同的服务内容
4. ✅ 响应时间 < 2秒
5. ✅ 本地服务正常运行

### 部署问题诊断
如果发现问题，请检查：
1. FRP服务端配置是否正确部署
2. nginx虚拟主机配置是否生效
3. NAS客户端配置是否更新
4. 防火墙和安全组设置
5. DNS传播状态

## 📞 故障排除

### 常见问题
1. **端口不可达**: 检查服务状态和防火墙设置
2. **域名无响应**: 检查nginx配置和FRP连接
3. **服务未隔离**: 检查nginx虚拟主机配置
4. **响应慢**: 检查网络连接和服务负载

### 调试命令
\`\`\`bash
# 检查FRP服务状态
ssh root@$FRP_SERVER 'systemctl status frps'

# 检查nginx状态
ssh root@$FRP_SERVER 'systemctl status nginx'

# 检查FRP客户端状态
ssh -p 9557 YYC@192.168.3.45 'ps aux | grep frpc'

# 查看实时日志
ssh root@$FRP_SERVER 'tail -f /opt/frp/logs/frps.log'
\`\`\`

---

**报告生成时间**: $(date)
**下次验证时间**: 建议部署后30分钟再次验证
EOF

    log_success "✅ 部署状态报告已生成: $report_file"
}

# 主函数
main() {
    log_info "=== 0379.email 部署验证脚本 ==="
    log_info "验证时间: $(date)"
    log_info "目标: 验证手动部署后的系统状态"
    echo ""

    local total_errors=0

    # 执行各项测试
    test_port_connectivity
    ((total_errors+=$?))
    echo ""

    test_dns_resolution
    ((total_errors+=$?))
    echo ""

    test_service_isolation
    ((total_errors+=$?))
    echo ""

    test_response_times
    echo ""

    test_local_services
    echo ""

    # 生成报告
    generate_deployment_status
    echo ""

    # 总结
    log_info "=== 验证完成 ==="
    if [[ $total_errors -eq 0 ]]; then
        log_success "🎉 所有测试通过！部署成功！"
        log_info "系统状态: 完全正常运行"
    else
        log_warn "⚠️ 发现 $total_errors 个问题，需要进一步检查"
        log_info "请查看上述测试结果和生成的报告"
    fi

    echo ""
    log_info "📋 生成的文件:"
    log_info "- 部署状态报告: /Users/yanyu/www/DEPLOYMENT_STATUS_*.md"
    log_info "- 配置文件包: /Users/yanyu/www/0379-email-configs.tar.gz"
    log_info "- 手动部署指南: /Users/yanyu/www/MANUAL_DEPLOYMENT_GUIDE.md"
}

# 执行主函数
main "$@"