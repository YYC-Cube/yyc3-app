#!/bin/bash

# YYC3 AI Family 服务状态检查脚本
# 检查所有7个核心服务的运行状态和健康状态

echo "🚀 YYC3 AI Family 服务状态检查"
echo "=================================="

# 定义服务端口和名称
declare -A services=(
    [6600]="API Server"
    [6601]="Admin Console"
    [6602]="LLM Service"
    [6603]="Mail Service"
    [6604]="AI/FCP Service"
    [6605]="App Service"
    [6606]="Redis Cache"
)

# 定义服务域名
declare -A domains=(
    [6600]="api.0379.email"
    [6601]="admin.0379.email"
    [6602]="llm.0379.email"
    [6603]="mail.0379.email"
    [6604]="ai.0379.email"
    [6605]="app.0379.email"
    [6606]="redis.0379.email"
)

# 检查端口是否开放
check_port() {
    local port=$1
    local service_name=$2

    if timeout 5 bash -c "</dev/tcp/localhost/$port" 2>/dev/null; then
        echo "✅ $service_name (端口 $port): 运行中"
        return 0
    else
        echo "❌ $service_name (端口 $port): 未运行"
        return 1
    fi
}

# 检查健康状态
check_health() {
    local port=$1
    local service_name=$2

    local response=$(curl -s --max-time 5 "http://localhost:$port/health" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
        local status=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('status', 'unknown'))
except:
    print('invalid')
" 2>/dev/null)

        if [[ "$status" == "ok" ]]; then
            echo "   🟢 健康状态: 正常"
            return 0
        else
            echo "   🟡 健康状态: $status"
            return 1
        fi
    else
        echo "   🔴 健康状态: 无响应"
        return 1
    fi
}

# 获取服务信息
get_service_info() {
    local port=$1
    local service_name=$2
    local domain=${domains[$port]}

    local response=$(curl -s --max-time 5 "http://localhost:$port/" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
        local service=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('name', service_name))
    print(data.get('version', 'unknown'))
    print(data.get('environment', 'unknown'))
except:
    print(service_name)
    print('unknown')
    print('unknown')
" 2>/dev/null)

        local name=$(echo "$service" | sed -n '1p')
        local version=$(echo "$service" | sed -n '2p')
        local env=$(echo "$service" | sed -n '3p')

        echo "   📋 服务信息: $name v$version ($env)"
        echo "   🌐 域名服务: $domain"
    fi
}

echo ""
echo "📊 服务状态详情"
echo "---------------"

total_services=0
running_services=0
healthy_services=0

for port in "${!services[@]}"; do
    service_name="${services[$port]}"
    ((total_services++))

    echo ""
    if check_port "$port" "$service_name"; then
        ((running_services++))
        if check_health "$port" "$service_name"; then
            ((healthy_services++))
        fi
        get_service_info "$port" "$service_name"
    fi
done

echo ""
echo "📈 统计信息"
echo "-----------"
echo "总服务数: $total_services"
echo "运行服务: $running_services"
echo "健康服务: $healthy_services"
echo "运行率: $(( running_services * 100 / total_services ))%"
echo "健康率: $(( healthy_services * 100 / total_services ))%"

echo ""
echo "🔗 快速访问链接"
echo "---------------"

for port in "${!services[@]}"; do
    service_name="${services[$port]}"
    echo "$service_name: http://localhost:$port"
done

echo ""
echo "💡 YYC3 AI Family 域名服务"
echo "------------------------"
for port in "${!domains[@]}"; do
    domain="${domains[$port]}"
    echo "$domain -> http://localhost:$port"
done

echo ""
if [[ $healthy_services -eq $total_services ]]; then
    echo "🎉 YYC3 AI Family 所有服务运行正常！"
    exit 0
elif [[ $running_services -eq $total_services ]]; then
    echo "⚠️  YYC3 AI Family 所有服务已启动，但有健康问题"
    exit 1
else
    echo "🚨 YYC3 AI Family 部分服务未运行"
    exit 2
fi