#!/bin/bash
# === Redis Sentinel健康检查脚本 ===
# 作者: YYC
# 版本: 1.0.0
# 创建时间: 2024-10-15
# 描述: 监控Redis Sentinel集群的健康状态

set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 配置参数
REDIS_PASSWORD="password"
SENTINEL_MASTER_NAME="mymaster"
SENTINEL_PORT=26379
MAX_MEMORY_USAGE=85  # 内存使用率阈值(%)
MAX_CPU_USAGE=80     # CPU使用率阈值(%)

# 日志文件
LOG_FILE="/var/log/redis-healthcheck.log"

# 初始化日志
init_log() {
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis健康检查开始" >> "$LOG_FILE"
}

# 清理资源
cleanup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis健康检查结束" >> "$LOG_FILE"
}

# 系统健康检查
check_system_health() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查系统健康状态" >> "$LOG_FILE"
    
    # 检查内存使用率
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt "$MAX_MEMORY_USAGE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 内存使用率过高 ($memory_usage%)" >> "$LOG_FILE"
        return 1
    fi
    
    # 检查CPU使用率
    local cpu_usage=$(top -l 1 | awk '/CPU usage:/ {print $3}' | cut -d '%' -f 1)
    if [ "${cpu_usage%%.*}" -gt "$MAX_CPU_USAGE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: CPU使用率过高 ($cpu_usage%)" >> "$LOG_FILE"
        return 1
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 系统健康状态正常" >> "$LOG_FILE"
    return 0
}

# 检查Redis主节点状态
check_redis_master() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查Redis主节点状态" >> "$LOG_FILE"
    
    # 获取主节点信息
    local master_info=$(redis-cli -h redis-master -p 6379 -a "$REDIS_PASSWORD" INFO server 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 无法连接到Redis主节点" >> "$LOG_FILE"
        return 1
    fi
    
    # 检查主节点角色
    local role=$(echo "$master_info" | grep -oP '(?<=role:)[^
]+')
    if [ "$role" != "master" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: Redis主节点角色异常 ($role)" >> "$LOG_FILE"
        return 1
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis主节点状态正常" >> "$LOG_FILE"
    return 0
}

# 检查Redis从节点状态
check_redis_slaves() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查Redis从节点状态" >> "$LOG_FILE"
    
    for slave in redis-slave1 redis-slave2; do
        # 连接从节点
        local slave_info=$(redis-cli -h "$slave" -p 6379 -a "$REDIS_PASSWORD" INFO server 2>/dev/null)
        if [ $? -ne 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 无法连接到Redis从节点 $slave" >> "$LOG_FILE"
            return 1
        fi
        
        # 检查从节点角色
        local role=$(echo "$slave_info" | grep -oP '(?<=role:)[^
]+')
        if [ "$role" != "slave" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: Redis从节点 $slave 角色异常 ($role)" >> "$LOG_FILE"
            return 1
        fi
        
        # 检查复制状态
        local replication_info=$(redis-cli -h "$slave" -p 6379 -a "$REDIS_PASSWORD" INFO replication 2>/dev/null)
        local master_link_status=$(echo "$replication_info" | grep -oP '(?<=master_link_status:)[^
]+')
        if [ "$master_link_status" != "up" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: Redis从节点 $slave 复制链接断开 ($master_link_status)" >> "$LOG_FILE"
            return 1
        fi
        
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis从节点 $slave 状态正常" >> "$LOG_FILE"
    done
    
    return 0
}

# 检查Redis Sentinel状态
check_redis_sentinels() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查Redis Sentinel状态" >> "$LOG_FILE"
    
    for sentinel in redis-sentinel1 redis-sentinel2 redis-sentinel3; do
        # 连接Sentinel
        local sentinel_info=$(redis-cli -h "$sentinel" -p "$SENTINEL_PORT" INFO server 2>/dev/null)
        if [ $? -ne 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 无法连接到Redis Sentinel $sentinel" >> "$LOG_FILE"
            return 1
        fi
        
        # 检查Sentinel状态
        local sentinel_status=$(redis-cli -h "$sentinel" -p "$SENTINEL_PORT" PING 2>/dev/null)
        if [ "$sentinel_status" != "PONG" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: Redis Sentinel $sentinel 响应异常 ($sentinel_status)" >> "$LOG_FILE"
            return 1
        fi
        
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis Sentinel $sentinel 状态正常" >> "$LOG_FILE"
    done
    
    # 检查Sentinel集群信息
    local cluster_info=$(redis-cli -h redis-sentinel1 -p "$SENTINEL_PORT" SENTINEL MASTER "$SENTINEL_MASTER_NAME" 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 无法获取Sentinel集群信息" >> "$LOG_FILE"
        return 1
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis Sentinel集群状态正常" >> "$LOG_FILE"
    return 0
}

# 检查Redis性能指标
check_redis_performance() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查Redis性能指标" >> "$LOG_FILE"
    
    local performance_info=$(redis-cli -h redis-master -p 6379 -a "$REDIS_PASSWORD" INFO stats 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: 无法获取Redis性能指标" >> "$LOG_FILE"
        return 1
    fi
    
    # 检查内存使用率
    local memory_info=$(redis-cli -h redis-master -p 6379 -a "$REDIS_PASSWORD" INFO memory 2>/dev/null)
    local used_memory_rss=$(echo "$memory_info" | grep -oP '(?<=used_memory_rss:)[0-9]+')
    local maxmemory=$(echo "$memory_info" | grep -oP '(?<=maxmemory:)[0-9]+')
    
    if [ "$maxmemory" -gt 0 ]; then
        local memory_usage_percent=$((used_memory_rss * 100 / maxmemory))
        if [ "$memory_usage_percent" -gt "$MAX_MEMORY_USAGE" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 告警: Redis内存使用率过高 ($memory_usage_percent%)" >> "$LOG_FILE"
            return 1
        fi
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis性能指标正常" >> "$LOG_FILE"
    return 0
}

# 主函数
main() {
    init_log
    
    # 系统健康检查
    if ! check_system_health; then
        exit 1
    fi
    
    # Redis主节点检查
    if ! check_redis_master; then
        exit 1
    fi
    
    # Redis从节点检查
    if ! check_redis_slaves; then
        exit 1
    fi
    
    # Redis Sentinel检查
    if ! check_redis_sentinels; then
        exit 1
    fi
    
    # Redis性能检查
    if ! check_redis_performance; then
        exit 1
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis集群健康检查通过" >> "$LOG_FILE"
    exit 0
}

# 执行主函数
main