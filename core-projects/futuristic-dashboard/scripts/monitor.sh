#!/bin/bash
set -e

echo "📈 性能监控启动..."

# 应用健康状态
curl -s http://localhost:3000/api/health | jq

# 内存使用
MEMORY=$(ps aux | grep 'node' | awk '{sum+=$4} END {print sum}')
echo "🧠 内存使用: ${MEMORY}%"

# 磁盘使用
DISK=$(df -h / | awk 'NR==2 {print $5}')
echo "💾 磁盘使用: ${DISK}"

# CPU 使用
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
echo "⚙️ CPU 使用: ${CPU}%"

echo "✅ 性能监控完成"
