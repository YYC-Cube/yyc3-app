# Nginx 配置文件树结构

/etc/nginx/
├── conf.d/                 # 额外的配置文件目录
├── fastcgi.conf            # FastCGI 主配置文件
├── fastcgi_params          # FastCGI 参数文件
├── koi-utf                 # KOI8-R 到 UTF-8 字符映射
├── koi-win                 # KOI8-R 到 Windows-1251 字符映射
├── mime.types              # MIME 类型映射文件
├── modules-available/      # 可用的 Nginx 模块
├── modules-enabled/        # 已启用的 Nginx 模块
│   ├── 50-mod-mail.conf              # 邮件模块配置
│   ├── 50-mod-stream.conf            # 流处理模块配置
│   ├── 50-mod-http-image-filter.conf # HTTP 图片过滤模块
│   ├── 50-mod-http-xslt-filter.conf  # HTTP XSLT 过滤模块
│   ├── 50-mod-http-geoip2.conf       # HTTP GeoIP2 模块
│   └── 70-mod-stream-geoip2.conf     # 流处理 GeoIP2 模块
├── nginx.conf              # Nginx 主配置文件
├── proxy_params            # 代理参数文件
├── scgi_params             # SCGI 参数文件
├── sites-available/        # 可用的站点配置
│   ├── git.0379.email.conf
│   ├── llm.0379.email.conf
│   ├── mail.0379.email.conf
│   ├── dev.0379.email.conf
│   ├── nas.0379.email.conf
│   ├── db.0379.email.conf
│   ├── plex.0379.email.conf
│   ├── api.0379.email.redirect.conf
│   ├── api.0379.email.ssl.conf
│   ├── php.0379.email.conf
│   ├── analytics.0379.email.conf
│   ├── yyc.0379.email.conf
│   ├── doc.0379.email.conf
│   ├── docs.0379.email.conf
│   ├── files.0379.email.conf
│   ├── admin.0379.email.conf
│   ├── spns.0379.email.conf
│   ├── vpn.0379.email.conf
│   ├── www-multi.conf
│   ├── media.0379.email.conf
│   ├── data.0379.email.conf
│   ├── monitor.0379.email.conf
│   ├── api.0379.email.conf
│   ├── cloud.0379.email.conf
│   ├── nettrack.0379.email.conf
│   ├── api/                # API 相关配置子目录
│   │   └── api.0379.email.ssl.conf
│   ├── web.0379.email.conf
│   ├── default             # 默认站点配置
│   └── 0379.email.conf     # 主域名配置
├── sites-enabled/          # 已启用的站点配置（通常是到sites-available的符号链接）
│   ├── git.0379.email.conf
│   ├── llm.0379.email.conf
│   ├── mail.0379.email.conf
│   ├── dev.0379.email.conf
│   ├── nas.0379.email.conf
│   ├── db.0379.email.conf
│   ├── plex.0379.email.conf
│   ├── api.0379.email.redirect.conf
│   ├── api.0379.email.ssl.conf
│   ├── php.0379.email.conf
│   ├── <www.0379.email.conf>
│   ├── analytics.0379.email.conf
│   ├── yyc.0379.email.conf
│   ├── doc.0379.email.conf
│   ├── docs.0379.email.conf
│   ├── files.0379.email.conf
│   ├── admin.0379.email.conf
│   ├── spns.0379.email.conf
│   ├── vpn.0379.email.conf
│   ├── www-multi.conf
│   ├── media.0379.email.conf
│   ├── data.0379.email.conf
│   ├── monitor.0379.email.conf
│   ├── cloud.0379.email.conf
│   ├── nettrack.0379.email.conf
│   ├── web.0379.email.conf
│   └── default
├── snippets/               # 配置片段目录
│   ├── fastcgi-php.conf    # PHP FastCGI 配置片段
│   └── snakeoil.conf       # 自签名证书配置片段
├── uwsgi_params            # uWSGI 参数文件
└── win-utf                 # Windows-1251 到 UTF-8 字符映射

## 配置文件说明

- **nginx.conf**: Nginx 主配置文件，包含全局设置和工作进程配置
- **sites-available/**: 存放所有可用的站点配置文件，但不直接生效
- **sites-enabled/**: 存放通过符号链接启用的站点配置
- **conf.d/**: 存放额外的配置文件，通常在主配置中通过 include 引入
- **modules-enabled/**: 已启用的动态模块配置
- **snippets/**: 可重用的配置片段，方便在多个站点间共享配置

## 站点配置管理

站点配置遵循 "sites-available/sites-enabled" 模式：

1. 在 sites-available/ 中创建完整的站点配置
2. 通过符号链接将需要启用的站点配置链接到 sites-enabled/
3. 配置完成后运行 `nginx -t` 测试配置
4. 运行 `systemctl reload nginx` 重新加载配置

## 注意事项

- 服务器上已有多个子域名配置，覆盖了各种服务（git、llm、mail、api等）
- API 相关配置有特殊处理（redirect、ssl、子目录）
- 已启用了多个 Nginx 模块，包括邮件处理、流处理、图片过滤等

保持配置整洁，定期审计站点配置！ 🌹
