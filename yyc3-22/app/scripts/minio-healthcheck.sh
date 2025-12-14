#!/bin/bash
# === MinIO健康检查脚本 ===
# @description 监控MinIO服务的运行状态、存储桶和文件系统
# @author YYC
# @version 1.0.0
# @created 2024-10-15

set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 配置参数
MINIO_ENDPOINT="http://localhost:9000"
MINIO_CONSOLE_ENDPOINT="http://localhost:9001"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password_yyc3"
HEALTH_CHECK_INTERVAL=10  # 秒
LOG_FILE="/var/log/minio-healthcheck.log"

# 资源使用阈值
MAX_MEMORY_USAGE=85  # %
MAX_CPU_USAGE=85     # %
MAX_DISK_USAGE=80    # %
MAX_LATENCY=500      # 毫秒

# 日志函数
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# 清理函数
cleanup() {
    log "INFO" "脚本执行结束，清理资源..."
}

# 系统健康检查
check_system_health() {
    log "INFO" "开始系统健康检查..."
    
    # 内存使用检查
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt "$MAX_MEMORY_USAGE" ]; then
        log "ERROR" "内存使用率过高: ${memory_usage}% > ${MAX_MEMORY_USAGE}%"
        return 1
    fi
    log "INFO" "内存使用率正常: ${memory_usage}%"
    
    # CPU使用检查
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{printf "%.0f", 100 - $1}')
    if [ "$cpu_usage" -gt "$MAX_CPU_USAGE" ]; then
        log "ERROR" "CPU使用率过高: ${cpu_usage}% > ${MAX_CPU_USAGE}%"
        return 1
    fi
    log "INFO" "CPU使用率正常: ${cpu_usage}%"
    
    # 磁盘使用检查
    local disk_usage=$(df -h / | grep "dev/" | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$MAX_DISK_USAGE" ]; then
        log "ERROR" "磁盘使用率过高: ${disk_usage}% > ${MAX_DISK_USAGE}%"
        return 1
    fi
    log "INFO" "磁盘使用率正常: ${disk_usage}%"
    
    log "INFO" "系统健康检查通过"
    return 0
}

# MinIO服务状态检查
check_minio_service() {
    log "INFO" "开始MinIO服务状态检查..."
    
    # 检查MinIO API端口
    if ! nc -z localhost 9000; then
        log "ERROR" "MinIO API端口9000未监听"
        return 1
    fi
    log "INFO" "MinIO API端口9000监听正常"
    
    # 检查MinIO Console端口
    if ! nc -z localhost 9001; then
        log "ERROR" "MinIO Console端口9001未监听"
        return 1
    fi
    log "INFO" "MinIO Console端口9001监听正常"
    
    # 检查MinIO服务状态
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" "$MINIO_ENDPOINT/minio/health/live")
    if [ "$health_status" -ne 200 ]; then
        log "ERROR" "MinIO服务状态异常: HTTP $health_status"
        return 1
    fi
    log "INFO" "MinIO服务状态正常"
    
    log "INFO" "MinIO服务状态检查通过"
    return 0
}

# MinIO API可用性检查
check_minio_api() {
    log "INFO" "开始MinIO API可用性检查..."
    
    # 检查S3 API可用性
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$MINIO_ENDPOINT" -H "Host: minio.example.com")
    if [ "$api_status" -ne 403 ]; then  # MinIO返回403表示API正常（需要认证）
        log "ERROR" "MinIO S3 API异常: HTTP $api_status"
        return 1
    fi
    log "INFO" "MinIO S3 API正常"
    
    # 使用mc工具检查（如果已安装）
    if command -v mc &> /dev/null; then
        # 配置mc客户端
        mc alias set yyc3-minio "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4
        
        # 列出存储桶
        local buckets=$(mc ls yyc3-minio 2>/dev/null | wc -l)
        if [ "$buckets" -eq 0 ]; then
            log "WARNING" "MinIO中没有存储桶"
        else
            log "INFO" "MinIO中有 $buckets 个存储桶"
        fi
    else
        log "WARNING" "mc工具未安装，跳过详细API检查"
    fi
    
    log "INFO" "MinIO API可用性检查通过"
    return 0
}

# 存储桶健康检查
check_minio_buckets() {
    log "INFO" "开始存储桶健康检查..."
    
    # 使用mc工具检查存储桶（如果已安装）
    if command -v mc &> /dev/null; then
        # 配置mc客户端
        mc alias set yyc3-minio "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4
        
        # 获取存储桶列表
        local buckets=$(mc ls yyc3-minio 2>/dev/null | awk '{print $5}')
        
        if [ -z "$buckets" ]; then
            log "WARNING" "没有找到存储桶"
            return 0
        fi
        
        # 检查每个存储桶
        for bucket in $buckets; do
            log "INFO" "检查存储桶: $bucket"
            
            # 检查存储桶是否可访问
            local bucket_status=$(mc stat yyc3-minio/$bucket 2>&1 | grep -c "ERROR")
            if [ "$bucket_status" -ne 0 ]; then
                log "ERROR" "存储桶 $bucket 不可访问"
                return 1
            fi
            
            # 检查存储桶大小
            local bucket_size=$(mc du -s yyc3-minio/$bucket 2>/dev/null | awk '{print $1}')
            if [ -n "$bucket_size" ]; then
                log "INFO" "存储桶 $bucket 大小: $bucket_size"
            fi
            
            # 检查存储桶中对象数量
            local object_count=$(mc ls -r yyc3-minio/$bucket 2>/dev/null | wc -l)
            log "INFO" "存储桶 $bucket 对象数量: $object_count"
        done
    else
        log "WARNING" "mc工具未安装，跳过存储桶详细检查"
    fi
    
    log "INFO" "存储桶健康检查通过"
    return 0
}

# 主函数
main() {
    log "INFO" "===== MinIO健康检查脚本开始执行 ====="
    
    # 执行健康检查
    local check_functions=(check_system_health check_minio_service check_minio_api check_minio_buckets)
    local check_results=()
    
    for check_func in "${check_functions[@]}"; do
        if "$check_func"; then
            check_results+=(0)
        else
            check_results+=(1)
        fi
        
        # 添加检查间隔
        if [ "$check_func" != "${check_functions[-1]}" ]; then
            sleep "$HEALTH_CHECK_INTERVAL"
        fi
    done
    
    # 检查结果统计
    local success_count=0
    local failure_count=0
    
    for result in "${check_results[@]}"; do
        if [ "$result" -eq 0 ]; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done
    
    log "INFO" "===== 健康检查结果统计 ====="
    log "INFO" "总检查项数: ${#check_functions[@]}"
    log "INFO" "通过检查项: $success_count"
    log "INFO" "失败检查项: $failure_count"
    
    if [ "$failure_count" -eq 0 ]; then
        log "INFO" "✅ 所有健康检查通过！"
        return 0
    else
        log "ERROR" "❌ 有 $failure_count 项健康检查失败！"
        return 1
    fi
}

# 脚本入口
if [ "$0" = "$BASH_SOURCE" ]; then
    main "$@"
fi
