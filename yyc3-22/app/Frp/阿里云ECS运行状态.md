# 阿里云ECS运行状态

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

[root@yyc3-33 frps]# firewall-cmd --reloadss -tulpn | grep -E '80|443|5001|5002|5003|5004|5005|5006'^C
[root@yyc3-33 frps]# ss -tulpn | grep -E '80|443|5001|5002|5003|5004|5005|5006'
udp   UNCONN 0      0                [::]:111           [::]:*users:(("rpcbind",pid=513,fd=7),("systemd",pid=1,fd=80))
tcp   LISTEN 0      511           0.0.0.0:443        0.0.0.0:*    users:(("nginx",pid=153501,fd=27),("nginx",pid=153500,fd=27),("nginx",pid=808,fd=27))
tcp   LISTEN 0      511           0.0.0.0:3100       0.0.0.0:*users:(("node /opt/0379-",pid=94380,fd=20))
tcp   LISTEN 0      511           0.0.0.0:80         0.0.0.0:*    users:(("nginx",pid=153501,fd=26),("nginx",pid=153500,fd=26),("nginx",pid=808,fd=26))
tcp   LISTEN 0      511                 *:8088             *:*    users:(("/usr/sbin/httpd",pid=91166,fd=4),("/usr/sbin/httpd",pid=91165,fd=4),("/usr/sbin/httpd",pid=91164,fd=4),("/usr/sbin/httpd",pid=726,fd=4))
tcp   LISTEN 0      511*:8089             *:*    users:(("/usr/sbin/httpd",pid=91166,fd=6),("/usr/sbin/httpd",pid=91165,fd=6),("/usr/sbin/httpd",pid=91164,fd=6),("/usr/sbin/httpd",pid=726,fd=6))
tcp   LISTEN 0      32768               *:4443             *:*    users:(("frps",pid=91905,fd=8))
tcp   LISTEN 0      32768*:18080            *:*    users:(("frps",pid=91905,fd=7))
tcp   LISTEN 0      32768               *:5001             *:*    users:(("frps",pid=91905,fd=11))
tcp   LISTEN 0      32768*:5002             *:*    users:(("frps",pid=91905,fd=13))
tcp   LISTEN 0      32768               *:5003             *:*    users:(("frps",pid=91905,fd=14))
tcp   LISTEN 0      32768*:5004             *:*    users:(("frps",pid=91905,fd=15))
tcp   LISTEN 0      32768               *:5005             *:*    users:(("frps",pid=91905,fd=16))
tcp   LISTEN 0      32768*:5006             *:*    users:(("frps",pid=91905,fd=12))
[root@yyc3-33 frps]# ps aux | grep nginx
root         808  0.0  0.2  32476  8576 ?        Ss   Nov03   0:05 nginx: master process /usr/sbin/nginx
nginx     153500  0.0  0.2  36312  8336 ?        S    11:58   0:00 nginx: worker process
nginx     153501  0.0  0.3  36832 11996 ?        S    11:58   0:00 nginx: worker process
root      155027  0.0  0.0 221500   912 pts/0    S+   18:18   0:00 grep --color=auto nginx
[root@yyc3-33 frps]# systemctl status nginx
● nginx.service - The nginx HTTP and reverse proxy server
   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; vendor preset: disabled)
   Active: active (running) since Mon 2025-11-03 11:37:44 CST; 1 months 9 days ago
 Main PID: 808 (nginx)
    Tasks: 3 (limit: 22546)
   Memory: 16.8M
   CGroup: /system.slice/nginx.service
           ├─   808 nginx: master process /usr/sbin/nginx
           ├─153500 nginx: worker process
           └─153501 nginx: worker process

Dec 08 13:49:03 yyc3-33 systemd[1]: Reloading The nginx HTTP and reverse proxy server.
Dec 08 13:49:03 yyc3-33 systemd[1]: Reloaded The nginx HTTP and reverse proxy server.
Dec 08 13:49:38 yyc3-33 systemd[1]: Reloading The nginx HTTP and reverse proxy server.
Dec 08 13:49:38 yyc3-33 systemd[1]: Reloaded The nginx HTTP and reverse proxy server.
Dec 08 13:53:04 yyc3-33 systemd[1]: Reloading The nginx HTTP and reverse proxy server.
Dec 08 13:53:04 yyc3-33 systemd[1]: Reloaded The nginx HTTP and reverse proxy server.
Dec 08 13:53:43 yyc3-33 systemd[1]: Reloading The nginx HTTP and reverse proxy server.
Dec 08 13:53:43 yyc3-33 systemd[1]: Reloaded The nginx HTTP and reverse proxy server.
Dec 08 14:01:31 yyc3-33 systemd[1]: Reloading The nginx HTTP and reverse proxy server.
Dec 08 14:01:31 yyc3-33 systemd[1]: Reloaded The nginx HTTP and reverse proxy server.
[root@yyc3-33 frps]# cat /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
worker_rlimit_nofile 65536;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    reset_timedout_connection on;
    server_tokens off;               # 隐藏版本信息
    client_max_body_size 512M;       # 根据需要调整上传限制

    # 连接/超时优化
    client_body_timeout 15s;
    client_header_timeout 15s;
    send_timeout 30s;
    large_client_header_buffers 4 16k;

    # Gzip（对静态资源启用）
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_buffers 16 8k;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 代理与缓冲默认优化（可被虚拟主机覆盖）
    proxy_buffer_size 16k;
    proxy_buffers 8 64k;
    proxy_busy_buffers_size 128k;
    proxy_read_timeout 120s;
    proxy_send_timeout 60s;
    proxy_connect_timeout 10s;

    # 防止 sub_filter 被 gzip 干扰：在需要替换的 location 已设置 proxy_set_header Accept-Encoding ""
    # include 下游虚拟主机配置
    include /etc/nginx/conf.d/*.conf;
}

[root@yyc3-33 frps]#cat frps.toml
[common]
bind_addr = "0.0.0.0"
bind_port = 7001
dashboard_port = 7500
dashboard_user = "yyc3"
dashboard_pwd = "my151001"
token = "yyc3_nas"
allow_ports = [5001,5002,5003,5004,5005,5006,6000]
vhost_http_port = 18080
vhost_https_port = 4443
subdomain_host = "0379.email"
log_file = "/root/frps/frps.log"
log_level = "warn"
cert_file = "/etc/letsencrypt/live/0379.email/fullchain.pem"
key_file = "/etc/letsencrypt/live/0379.email/privkey.pem"
tls_protocols = ["TLSv1.2","TLSv1.3"]

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」
