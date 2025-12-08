#!/bin/bash

# =============================================================================
# 0379.email 多项目协同智能平台 - 高级功能服务部署脚本
# 部署LLM AI服务、邮件服务、监控服务等高级功能
# =============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_feature() {
    echo -e "${PURPLE}[FEATURE]${NC} $1"
}

log_ai() {
    echo -e "${CYAN}[AI]${NC} $1"
}

# 显示部署横幅
show_banner() {
    echo -e "${CYAN}"
    echo "🤖 0379.email 多项目协同智能平台 - 高级功能服务部署"
    echo "=================================================================="
    echo "🚀 即将部署的高级功能服务："
    echo "   🤖 LLM AI服务     - 智能对话和文本生成"
    echo "   📧 邮件服务       - 邮件发送和管理"
    echo "   📊 监控服务       - Prometheus + Grafana"
    echo "   🔧 开发工具       - Redis Commander等"
    echo "=================================================================="
    echo -e "${NC}"
}

# 检查核心服务状态
check_core_services() {
    log_info "检查核心服务状态..."

    # 检查核心服务是否运行
    local core_services=("redis" "mariadb" "api-service" "admin-service" "nginx")
    local failed_services=()

    for service in "${core_services[@]}"; do
        if ! docker-compose -f docker-compose-progressive.yml ps | grep -q "Up.*$service"; then
            failed_services+=($service)
        fi
    done

    if [ ${#failed_services[@]} -ne 0 ]; then
        log_error "以下核心服务未运行: ${failed_services[*]}"
        log_info "请先启动核心服务: ./deploy-core-services.sh"
        exit 1
    fi

    log_success "所有核心服务正常运行"
}

# 检查端口占用
check_ports() {
    log_info "检查高级功能服务端口占用..."

    local ports=(3002 3003 9090 3005 8081)
    local port_conflicts=()

    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            port_conflicts+=($port)
        fi
    done

    if [ ${#port_conflicts[@]} -ne 0 ]; then
        log_warning "以下端口已被占用: ${port_conflicts[*]}"
        log_info "将尝试清理冲突进程..."

        for port in "${port_conflicts[@]}"; do
            local pid=$(lsof -ti:$port 2>/dev/null || true)
            if [ -n "$pid" ]; then
                log_warning "停止占用端口 $port 的进程 (PID: $pid)"
                kill -9 $pid 2>/dev/null || true
            fi
        done
    fi

    log_success "端口检查完成"
}

# 部署LLM AI服务
deploy_llm_service() {
    log_feature "部署 LLM AI 服务..."

    # 检查LLM服务文件
    if [ ! -f "simple-llm-server.py" ]; then
        log_error "simple-llm-server.py 文件不存在"
        return 1
    fi

    if [ ! -f "llm-requirements.txt" ]; then
        log_error "llm-requirements.txt 文件不存在"
        return 1
    fi

    log_ai "启动 LLM AI 服务容器..."
    docker-compose -f docker-compose-progressive.yml up -d llm-service

    # 等待服务启动
    log_info "等待 LLM 服务启动..."
    sleep 20

    # 检查服务状态
    if docker-compose -f docker-compose-progressive.yml ps | grep -q "llm-service.*Up"; then
        log_success "🤖 LLM AI 服务部署成功"

        # 测试服务健康检查
        sleep 10
        if curl -s http://localhost:3002/health &> /dev/null; then
            log_success "🤖 LLM 服务健康检查通过"
        else
            log_warning "🤖 LLM 服务健康检查失败，但容器正在运行"
        fi
    else
        log_error "🤖 LLM AI 服务部署失败"
        return 1
    fi
}

# 部署邮件服务
deploy_mail_service() {
    log_feature "部署邮件服务..."

    # 检查邮件服务文件
    if [ ! -f "simple-mail-server.js" ]; then
        log_error "simple-mail-server.js 文件不存在"
        return 1
    fi

    log_info "启动邮件服务容器..."
    docker-compose -f docker-compose-progressive.yml up -d mail-service

    # 等待服务启动
    log_info "等待邮件服务启动..."
    sleep 15

    # 检查服务状态
    if docker-compose -f docker-compose-progressive.yml ps | grep -q "mail-service.*Up"; then
        log_success "📧 邮件服务部署成功"

        # 测试服务健康检查
        sleep 5
        if curl -s http://localhost:3003/health &> /dev/null; then
            log_success "📧 邮件服务健康检查通过"
        else
            log_warning "📧 邮件服务健康检查失败，但容器正在运行"
        fi
    else
        log_error "📧 邮件服务部署失败"
        return 1
    fi
}

# 部署监控服务
deploy_monitoring_services() {
    log_feature "部署监控服务..."

    log_info "启动 Prometheus 监控服务..."
    docker-compose -f docker-compose-progressive.yml --profile monitoring up -d prometheus

    # 等待Prometheus启动
    sleep 10

    log_info "启动 Grafana 可视化服务..."
    docker-compose -f docker-compose-progressive.yml --profile monitoring up -d grafana

    # 等待Grafana启动
    sleep 15

    # 检查监控服务状态
    local prometheus_running=false
    local grafana_running=false

    if docker-compose -f docker-compose-progressive.yml ps | grep -q "prometheus.*Up"; then
        prometheus_running=true
        log_success "📊 Prometheus 监控服务部署成功"
    else
        log_warning "📊 Prometheus 部署失败（可能是网络问题）"
    fi

    if docker-compose -f docker-compose-progressive.yml ps | grep -q "grafana.*Up"; then
        grafana_running=true
        log_success "📈 Grafana 可视化服务部署成功"
    else
        log_warning "📈 Grafana 部署失败（可能是网络问题）"
    fi

    # 如果监控服务部署成功，测试访问
    if [ "$prometheus_running" = true ]; then
        sleep 5
        if curl -s http://localhost:9090/-/healthy &> /dev/null; then
            log_success "📊 Prometheus 健康检查通过"
        fi
    fi

    if [ "$grafana_running" = true ]; then
        sleep 5
        if curl -s http://localhost:3005/api/health &> /dev/null; then
            log_success "📈 Grafana 健康检查通过"
        fi
    fi
}

# 部署开发工具
deploy_dev_tools() {
    log_feature "部署开发工具..."

    log_info "启动 Redis Commander..."
    docker-compose -f docker-compose-progressive.yml --profile tools up -d redis-commander

    # 等待服务启动
    sleep 10

    # 检查服务状态
    if docker-compose -f docker-compose-progressive.yml ps | grep -q "redis-commander.*Up"; then
        log_success "🔧 Redis Commander 部署成功"

        # 测试服务
        sleep 5
        if curl -s http://localhost:8081 &> /dev/null; then
            log_success "🔧 Redis Commander 访问正常"
        fi
    else
        log_warning "🔧 Redis Commander 部署失败（可能是网络问题）"
    fi
}

# 显示服务状态
show_advanced_status() {
    log_info "高级功能服务状态总览:"
    echo ""

    # 显示所有运行的服务
    echo "=== 所有服务状态 ==="
    docker-compose -f docker-compose-progressive.yml ps
    echo ""

    # 显示高级功能服务访问地址
    echo "=== 高级功能服务访问地址 ==="
    echo "🤖 LLM AI服务:    http://localhost:3002"
    echo "📧 邮件服务:      http://localhost:3003"
    echo "📊 Prometheus:    http://localhost:9090"
    echo "📈 Grafana:       http://localhost:3005"
    echo "🔧 Redis Cmd:     http://localhost:8081"
    echo ""

    # 显示健康检查端点
    echo "=== 健康检查端点 ==="
    echo "🤖 LLM健康检查:   http://localhost:3002/health"
    echo "📧 邮件健康检查:  http://localhost:3003/health"
    echo "📊 Prometheus:    http://localhost:9090/-/healthy"
    echo "📈 Grafana:       http://localhost:3005/api/health"
    echo ""

    # 显示功能演示端点
    echo "=== 功能演示端点 ==="
    echo "🤖 LLM模型列表:   http://localhost:3002/api/models"
    echo "🤖 LLM聊天测试:   curl -X POST http://localhost:3002/api/chat -H 'Content-Type: application/json' -d '{\"message\":\"你好\"}'"
    echo "📧 邮件模板:      http://localhost:3003/templates"
    echo "📧 邮件验证:      curl -X POST http://localhost:3003/validate -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\"}'"
    echo ""
}

# 测试高级功能
test_advanced_features() {
    log_info "测试高级功能服务..."

    # 测试LLM服务
    echo "=== 测试 LLM AI 服务 ==="
    if curl -s http://localhost:3002/health | grep -q "ok"; then
        log_success "🤖 LLM 服务响应正常"

        # 测试模型列表
        if curl -s http://localhost:3002/api/models | grep -q "models"; then
            log_success "🤖 LLM 模型接口正常"
        fi

        # 测试聊天功能
        local chat_response=$(curl -s -X POST http://localhost:3002/api/chat \
            -H "Content-Type: application/json" \
            -d '{"message":"你好"}')
        if echo "$chat_response" | grep -q "response"; then
            log_success "🤖 LLM 聊天功能正常"
        fi
    else
        log_warning "🤖 LLM 服务未响应"
    fi

    # 测试邮件服务
    echo "=== 测试邮件服务 ==="
    if curl -s http://localhost:3003/health | grep -q "ok"; then
        log_success "📧 邮件服务响应正常"

        # 测试邮件验证
        if curl -s -X POST http://localhost:3003/validate \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com"}' | grep -q "valid"; then
            log_success "📧 邮件验证功能正常"
        fi

        # 测试邮件模板
        if curl -s http://localhost:3003/templates | grep -q "templates"; then
            log_success "📧 邮件模板功能正常"
        fi
    else
        log_warning "📧 邮件服务未响应"
    fi

    echo ""
}

# 生成使用指南
generate_usage_guide() {
    log_info "生成高级功能使用指南..."

    cat > ADVANCED_SERVICES_USAGE.md << 'EOF'
# 🚀 0379.email 高级功能服务使用指南

## 🤖 LLM AI 服务

### 基本信息
- **访问地址**: http://localhost:3002
- **健康检查**: http://localhost:3002/health
- **服务端口**: 3002

### API端点
```bash
# 获取模型列表
curl http://localhost:3002/api/models

# 文本生成
curl -X POST http://localhost:3002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"请介绍一下0379.email平台","max_tokens":100}'

# 对话聊天
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好，我想了解平台功能"}'

# 服务状态
curl http://localhost:3002/api/status
```

## 📧 邮件服务

### 基本信息
- **访问地址**: http://localhost:3003
- **健康检查**: http://localhost:3003/health
- **服务端口**: 3003

### API端点
```bash
# 邮件验证
curl -X POST http://localhost:3003/validate \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 发送单封邮件
curl -X POST http://localhost:3003/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "text": "这是一封测试邮件",
    "html": "<h1>测试邮件</h1><p>这是HTML内容</p>"
  }'

# 批量发送邮件
curl -X POST http://localhost:3003/send-batch \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {"to": "user1@example.com", "subject": "主题1", "text": "内容1"},
      {"to": "user2@example.com", "subject": "主题2", "text": "内容2"}
    ]
  }'

# 获取邮件模板
curl http://localhost:3003/templates

# 服务状态
curl http://localhost:3003/status
```

## 📊 监控服务

### Prometheus
- **访问地址**: http://localhost:9090
- **健康检查**: http://localhost:9090/-/healthy
- **功能**: 指标收集和存储

### Grafana
- **访问地址**: http://localhost:3005
- **用户名**: admin
- **密码**: GrafanaSecurePass123456
- **功能**: 数据可视化和监控面板

## 🔧 开发工具

### Redis Commander
- **访问地址**: http://localhost:8081
- **功能**: Redis可视化管理工具
- **连接**: 自动连接到Redis实例

## 🎯 快速测试

### 一键测试所有服务
```bash
# 测试LLM服务
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'

# 测试邮件验证
curl -X POST http://localhost:3003/validate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 检查服务状态
curl http://localhost:3002/health
curl http://localhost:3003/health
```

EOF

    log_success "高级功能使用指南已生成: ADVANCED_SERVICES_USAGE.md"
}

# 主函数
main() {
    show_banner

    # 检查运行环境
    if [ ! -f "docker-compose-progressive.yml" ]; then
        log_error "docker-compose-progressive.yml 文件不存在"
        exit 1
    fi

    # 执行部署步骤
    check_core_services
    check_ports

    # 部署高级功能服务
    deploy_llm_service || log_warning "LLM服务部署失败，继续部署其他服务"
    deploy_mail_service || log_warning "邮件服务部署失败，继续部署其他服务"
    deploy_monitoring_services
    deploy_dev_tools

    # 等待所有服务启动
    log_info "等待所有高级功能服务启动..."
    sleep 20

    # 显示状态和测试
    show_advanced_status
    test_advanced_features
    generate_usage_guide

    echo ""
    log_success "🎉 高级功能服务部署完成！"
    echo ""
    log_info "📖 使用指南:"
    echo "1. 查看详细使用指南: cat ADVANCED_SERVICES_USAGE.md"
    echo "2. 查看服务状态: docker-compose -f docker-compose-progressive.yml ps"
    echo "3. 查看服务日志: docker-compose -f docker-compose-progressive.yml logs -f [service-name]"
    echo "4. 访问Web界面: http://localhost:3002 (LLM) / http://localhost:3003 (邮件)"
    echo ""
    log_info "🚀 下一步: 运行完整平台功能验证"
}

# 运行主函数
main "$@"