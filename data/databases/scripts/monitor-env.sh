# 连接信息
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=redis_yyc3

# 监控配置
export CHECK_INTERVAL=30  # 检查间隔（秒）
export LOG_FILE=/tmp/redis-monitor.log  # 日志文件路径
export ALERT_THRESHOLD=80  # 告警阈值（百分比）
export ENABLE_ALERTS=false  # 是否启用告警（true/false）

# 使用方法：
# 1. 复制为 monitor-env.sh
# 2. 修改配置
# 3. 运行：source monitor-env.sh && ./enhanced-monitor.sh