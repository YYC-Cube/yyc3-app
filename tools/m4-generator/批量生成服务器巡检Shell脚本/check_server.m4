# 定义服务器类型宏（默认web）
ifdef(`SERVER_TYPE',,`define(SERVER_TYPE, web)')dnl

# 通用检查函数（所有服务器都需要）
define(COMMON_CHECKS, `
echo "=== 通用检查 ==="
echo "当前时间: $(date)"
echo "CPU 使用率: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}')%"
echo "内存使用率: $(free | awk '/Mem/{printf "%.2f%", $3/$2*100}')"
')dnl

# 按服务器类型定义专用检查项
define(WEB_CHECKS, `
echo "=== Web 服务检查 ==="
if systemctl is-active --quiet nginx; then
    echo "Nginx 状态: 运行中"
else
    echo "Nginx 状态: 停止（异常）"
fi
echo "Nginx 版本: $(nginx -v 2>&1 | awk '{print $3}' | cut -d'/' -f2)"
')dnl

define(DB_CHECKS, `
echo "=== 数据库检查 ==="
if mysqladmin -uroot -p$DB_PASS ping &>/dev/null; then
    echo "MySQL 状态: 运行中"
else
    echo "MySQL 状态: 停止（异常）"
fi
echo "数据库连接数: $(mysql -uroot -p$DB_PASS -e "show status like 'Threads_connected'" -sN)"
')dnl

# 主脚本逻辑
#!/bin/bash
COMMON_CHECKS

# 条件执行服务检查
ifelse(SERVER_TYPE, web, WEB_CHECKS,
       SERVER_TYPE, db, DB_CHECKS,
       echo "未知服务器类型")
