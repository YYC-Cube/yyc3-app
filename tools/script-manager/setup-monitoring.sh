#!/bin/bash
# =============================================================================
# 0379.email 项目 - 监控配置脚本
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置 Grafana 数据源
setup_grafana_datasource() {
    log_info "配置 Grafana 数据源..."

    # 等待 Grafana 启动
    sleep 10

    # 创建 Prometheus 数据源
    curl -X POST \
        http://admin:admin123@localhost:3005/api/datasources \
        -H 'Content-Type: application/json' \
        -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "access": "proxy",
            "url": "http://prometheus:9090",
            "isDefault": true
        }' 2>/dev/null || log_error "数据源配置失败"

    log_success "Grafana 数据源配置完成"
}

# 创建简单仪表板
create_grafana_dashboard() {
    log_info "创建系统监控仪表板..."

    curl -X POST \
        http://admin:admin123@localhost:3005/api/dashboards/db \
        -H 'Content-Type: application/json' \
        -d '{
            "dashboard": {
                "id": null,
                "title": "0379.email 系统监控",
                "tags": ["0379-email"],
                "timezone": "browser",
                "panels": [
                    {
                        "id": 1,
                        "title": "容器状态",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": "up",
                                "legendFormat": "{{instance}}"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                    },
                    {
                        "id": 2,
                        "title": "Redis 连接",
                        "type": "stat",
                        "targets": [
                            {
                                "expr": "redis_connected_clients",
                                "legendFormat": "连接数"
                            }
                        ],
                        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                    }
                ],
                "time": {"from": "now-1h", "to": "now"},
                "refresh": "5s"
            },
            "overwrite": true
        }' 2>/dev/null || log_error "仪表板创建失败"

    log_success "Grafana 仪表板创建完成"
}

# 显示访问信息
show_access_info() {
    log_info "监控服务访问信息："
    echo ""
    echo "🔍 Prometheus: http://localhost:9090"
    echo "📊 Grafana: http://localhost:3005"
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo ""
    echo "🗃️  数据库管理工具："
    echo "   Redis Commander: http://localhost:8081"
    echo "   Mongo Express: http://localhost:8082"
    echo "   MailHog: http://localhost:8025"
    echo ""
}

# 主函数
main() {
    log_info "配置 0379.email 监控系统..."
    echo ""

    setup_grafana_datasource
    create_grafana_dashboard
    show_access_info

    log_success "🎉 监控系统配置完成！"
}

# 执行主函数
main
