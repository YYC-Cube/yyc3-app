#!/bin/bash
set -e

echo "🏥 开始健康检查..."

# 检查应用是否运行
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ 应用运行正常"
else
  echo "❌ 应用无响应"
  exit 1
fi

# 检查数据库连接（可选）
if curl -f http://localhost:3000/api/db-health > /dev/null 2>&1; then
  echo "✅ 数据库连接正常"
else
  echo "⚠️ 数据库连接异常"
fi

# 检查内存使用
MEMORY_USAGE=$(ps aux | grep 'node' | awk '{sum+=$4} END {print sum}')
echo "📊 内存使用: ${MEMORY_USAGE}%"
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
  echo "⚠️ 内存使用过高"
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "💾 磁盘使用: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "⚠️ 磁盘空间不足"
fi

echo "✅ 健康检查完成"
