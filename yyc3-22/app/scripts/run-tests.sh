#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 脚本配置
TEST_ENV_FILE=".env.test"
LOG_FILE="./logs/test-run.log"
COVERAGE_DIR="./coverage"

# 清理函数
cleanup() {
    echo "[INFO] 清理测试环境..."
    # 可以在这里添加清理代码，比如停止测试数据库等
}

# 资源监控
check_system_health() {
    echo "[INFO] 检查系统健康状态..."
    # 检查内存使用情况（仅在Linux系统可用）
    if command -v free &> /dev/null; then
        local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        if [ $memory_usage -gt 85 ]; then
            echo "[ERROR] 内存使用率过高 ($memory_usage%)，测试可能会失败"
            exit 1
        fi
    fi
}

# 加载环境变量
load_environment() {
    echo "[INFO] 加载测试环境变量..."
    if [ -f "$TEST_ENV_FILE" ]; then
        export $(cat "$TEST_ENV_FILE" | grep -v '^#' | xargs)
        echo "[INFO] 已加载环境变量文件: $TEST_ENV_FILE"
    else
        echo "[WARNING] 未找到测试环境变量文件: $TEST_ENV_FILE"
        echo "[WARNING] 将使用默认环境变量"
    fi
}

# 安装依赖
install_dependencies() {
    echo "[INFO] 安装测试依赖..."
    npm ci --include=dev
}

# 运行测试
run_tests() {
    echo "[INFO] 开始执行测试..."
    
    # 创建日志目录
    mkdir -p ./logs
    
    # 运行单元测试
    echo "[INFO] 运行单元测试..."
    npm test -- --coverage --watchAll=false > "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[INFO] 单元测试通过！"
    else
        echo "[ERROR] 单元测试失败！查看日志: $LOG_FILE"
        tail -n 50 "$LOG_FILE"
        exit 1
    fi
    
    # 运行集成测试
    echo "[INFO] 运行集成测试..."
    npm run test:integration >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[INFO] 集成测试通过！"
    else
        echo "[ERROR] 集成测试失败！查看日志: $LOG_FILE"
        tail -n 50 "$LOG_FILE"
        exit 1
    fi
}

# 生成测试报告
generate_report() {
    echo "[INFO] 生成测试报告..."
    
    # 检查是否有coverage目录
    if [ -d "$COVERAGE_DIR" ]; then
        echo "[INFO] 测试覆盖率报告已生成在: $COVERAGE_DIR"
        echo "[INFO] 覆盖率摘要:"
        grep -A 10 "All files" "$COVERAGE_DIR/lcov-report/index.html" | head -n 15
    else
        echo "[WARNING] 未生成测试覆盖率报告"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "🚀 YYC3 自动化测试脚本"
    echo "========================================"
    
    check_system_health
    load_environment
    install_dependencies
    run_tests
    generate_report
    
    echo "========================================"
    echo "✅ 所有测试已成功完成！"
    echo "========================================"
}

# 执行主函数
main
