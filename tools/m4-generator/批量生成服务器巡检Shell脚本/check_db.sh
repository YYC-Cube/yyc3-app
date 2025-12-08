#!/bin/bash

echo "=== 通用检查 ==="
echo "当前时间: $(date)"
echo "CPU 使用率: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}')%"
echo "内存使用率: $(free | awk '/Mem/{printf "%.2f%", $3/$2*100}')"

echo "=== 数据库检查 ==="
if mysqladmin -uroot -p123456 ping &>/dev/null; then
    echo "MySQL 状态: 运行中"
else
    echo "MySQL 状态: 停止（异常）"
fi
echo "数据库连接数: $(mysql -uroot -p123456 -e "show status like 'Threads_connected'" -sN)"