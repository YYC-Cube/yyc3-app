### 案例 3：批量生成服务器巡检 Shell 脚本
场景：运维需要检查多台服务器的不同服务（如 Web 服务器查 Nginx，数据库服务器查 MySQL），用 m4 可根据服务器类型生成针对性巡检脚本。
#### 步骤 1：创建 m4 模板（check_server.m4）
m4
```plaintext
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

```
#### 步骤 2：生成不同服务器的巡检脚本
bash
```bash
# 生成 Web 服务器巡检脚本
m4 -D SERVER_TYPE=web check_server.m4 -o check_web.sh

# 生成数据库服务器巡检脚本（同时定义数据库密码）
m4 -D SERVER_TYPE=db -D DB_PASS=123456 check_server.m4 -o check_db.sh
```
#### 生成结果示例（数据库服务器）
check_db.sh 内容：
bash
```bash
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
```
优势：一份模板生成多类脚本，新增服务器类型时只需扩展 ifelse 条件，无需重写通用逻辑。