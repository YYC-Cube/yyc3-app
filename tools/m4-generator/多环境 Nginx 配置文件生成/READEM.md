# m4 处理脚本或代码文件的实际案例 
覆盖配置管理、代码生成、批量运维等场景，展示其在简化重复劳动、实现动态适配方面的价值。
### 案例 1：多环境 Nginx 配置文件生成
场景：一个 Web 应用需要在开发、测试、生产环境使用不同的域名、端口和日志路径，手动维护多份配置文件易出错。用 m4 可通过一套模板生成不同环境的配置。
#### 步骤 1：创建 m4 模板（nginx.conf.m4）
m4
```plaintext
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

```
#### 步骤 2：生成不同环境的配置文件
bash
```bash
# 生成开发环境配置（默认ENV=dev）
m4 nginx.conf.m4 -o nginx.dev.conf

# 生成测试环境配置（指定ENV=test）
m4 -D ENV=test nginx.conf.m4 -o nginx.test.conf

# 生成生产环境配置（指定ENV=prod）
m4 -D ENV=prod nginx.conf.m4 -o nginx.prod.conf
```
#### 生成结果示例（生产环境）
nginx.prod.conf 内容：
nginx
```nginx
server {
    listen       443;
    server_name  example.com;

    access_log   /var/log/nginx/prod/access.log;
    error_log    /var/log/nginx/prod/error.log;

    location / {
        root   /var/www/prod;
        index  index.html;
    }
}
```
优势：一套模板适配多环境，修改配置只需维护模板，避免手动同步多份文件