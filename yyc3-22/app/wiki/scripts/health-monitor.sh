#!/bin/bash
# scripts/health-monitor.sh

SERVICES=("api" "admin" "llm" "mail")
ALERT_EMAIL="admin@0379.email"

check_service_health() {
    local service=$1
    local port=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "https://${service}.0379.email/health")
    
    if [ "$response" -ne 200 ]; then
        echo "❌ Service $service is unhealthy (HTTP $response)"
        send_alert "$service" "$response"
        restart_service "$service"
    else
        echo "✅ Service $service is healthy"
    fi
}

send_alert() {
    local service=$1
    local status=$2
    local subject="ALERT: $service service is unhealthy"
    local body="Service: $service\nStatus: $status\nTime: $(date)"
    
    echo -e "$body" | mail -s "$subject" "$ALERT_EMAIL"
}

restart_service() {
    local service=$1
    echo "🔄 Restarting $service service..."
    
    pm2 restart "$service-server"
    
    if [ $? -eq 0 ]; then
        echo "✅ $service service restarted successfully"
    else
        echo "❌ Failed to restart $service service"
    fi
}

# 主监控循环
while true; do
    echo "$(date): Running health checks..."
    
    check_service_health "api" "3000"
    check_service_health "admin" "3001" 
    check_service_health "llm" "3002"
    check_service_health "mail" "3003"
    
    echo "----------------------------------------"
    sleep 60  # 每分钟检查一次
done