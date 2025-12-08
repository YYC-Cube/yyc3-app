# 定义环境变量宏（默认开发环境）
ifdef(`ENV',,`define(ENV, dev)')dnl  # 若未定义ENV，默认dev

# 条件宏：根据环境设置参数
define(NGINX_PORT, ifelse(ENV, dev, 8080, test, 80, prod, 443))dnl
define(SERVER_NAME, ifelse(ENV, dev, "dev.example.com", test, "test.example.com", prod, "example.com"))dnl
define(LOG_PATH, ifelse(ENV, dev, "/var/log/nginx/dev", test, "/var/log/nginx/test", prod, "/var/log/nginx/prod"))dnl

# Nginx 配置主体（引用宏）
server {
    listen       NGINX_PORT;
    server_name  SERVER_NAME;

    access_log   LOG_PATH/access.log;
    error_log    LOG_PATH/error.log;

    location / {
        root   /var/www/ENV;  # 动态使用环境名作为目录
        index  index.html;
    }
}
