#!/bin/bash

# =============================================================================
# 域名验证和部署脚本
# 验证域名解析并创建最终的NAS部署指令
# =============================================================================

set -euo pipefail

# 配置变量
FRP_SERVER="8.130.127.121"
FRP_PORT="17000"
NAS_IP="192.168.3.45"
DEPLOYMENT_PACKAGE="/Users/yanyu/www/nas-frp-deployment"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# 验证FRP服务端状态
verify_frp_server() {
    log_step "验证FRP服务端状态..."

    if timeout 5 bash -c "</dev/tcp/$FRP_SERVER/$FRP_PORT" 2>/dev/null; then
        log_success "✅ FRP服务端 ($FRP_SERVER:$FRP_PORT) 连接正常"
        return 0
    else
        log_error "❌ FRP服务端连接失败"
        return 1
    fi
}

# 检查域名解析
check_domain_resolution() {
    log_step "检查域名解析配置..."

    local domains=("api.0379.email" "admin.0379.email" "llm.0379.email" "mail.0379.email" "nas.0379.email")
    local correct_count=0
    local total_count=${#domains[@]}

    for domain in "${domains[@]}"; do
        local resolved_ip=$(nslookup "$domain" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        echo -n "  $domain -> $resolved_ip: "

        if [[ "$resolved_ip" == "$FRP_SERVER" ]]; then
            echo "✅ 正确"
            ((correct_count++))
        else
            echo "❌ 错误 (期望: $FRP_SERVER)"
        fi
    done

    log_info "域名解析正确率: $correct_count/$total_count"
    if [[ $correct_count -eq $total_count ]]; then
        log_success "✅ 所有域名解析正确"
        return 0
    else
        log_warn "⚠️ 部分域名解析需要修正"
        return 1
    fi
}

# 创建最终部署包
create_final_deployment_package() {
    log_step "创建最终NAS部署包..."

    local final_package="/Users/yanyu/www/nas-final-deployment-package"
    rm -rf "$final_package"
    mkdir -p "$final_package"

    # 复制基础文件
    cp -r "$DEPLOYMENT_PACKAGE"/* "$final_package/"

    # 创建配置修正文件（使用正确的FRP服务器地址）
    cat > "$final_package/frpc-corrected.toml" << EOF
[common]
# =============================================================================
# FRP 客户端配置 - NAS 生产环境 (yyc3-45) - 最终版本
# 铁威马 F4-423 NAS 专用配置
# =============================================================================

# 连接服务端配置
server_addr = $FRP_SERVER
server_port = $FRP_PORT
token = "WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg="

# 客户端配置
user = "nas-yyc3-45-prod"
login_fail_exit = false
protocol = tcp
tls_enable = true
tls_trusted_ca_file = "/Volume1/www/frpc/ca.pem"

# 日志配置
log_file = /Volume1/www/frpc/logs/frpc.log
log_level = info
log_max_days = 30
log_file_path_size_mb = 500
log_compress = true

# 管理配置
admin_addr = 127.0.0.1
admin_port = 7400
admin_user = nas_admin
admin_pwd = "m5ODDD1oPMYKfhHG31A3tQ=="

# 连接池配置
pool_count = 10
tcp_mux = true
heartbeat_interval = 30
heartbeat_timeout = 90

# 服务映射配置
start = ssh,nas,api,admin,llm,mail

# SSH 服务
[ssh-nas]
type = tcp
local_ip = 127.0.0.1
local_port = 57
remote_port = 9557
use_encryption = true
use_compression = true

# NAS Web 管理界面
[nas-admin]
type = http
local_ip = 127.0.0.1
local_port = 80
custom_domains = nas.0379.email
subdomain = nas
use_encryption = true
use_compression = true

# API 服务
[api-service]
type = http
local_ip = 127.0.0.1
local_port = 3000
custom_domains = api.0379.email
subdomain = api
use_encryption = true
use_compression = true

# Admin 管理面板
[admin-service]
type = http
local_ip = 127.0.0.1
local_port = 3001
custom_domains = admin.0379.email
subdomain = admin
use_encryption = true
use_compression = true

# LLM 服务
[llm-service]
type = http
local_ip = 127.0.0.1
local_port = 3002
custom_domains = llm.0379.email
subdomain = llm
use_encryption = true
use_compression = true

# Mail 服务
[mail-service]
type = http
local_ip = 127.0.0.1
local_port = 3003
custom_domains = mail.0379.email
subdomain = mail
use_encryption = true
use_compression = true
EOF

    # 创建一键部署脚本
    cat > "$final_package/deploy.sh" << 'EOF'
#!/bin/bash

# =============================================================================
# NAS FRP客户端一键部署脚本
# =============================================================================

set -euo pipefail

echo "=== 0379.email NAS FRP客户端一键部署 ==="
echo "部署时间: $(date)"

# 检查权限
if [[ $EUID -ne 0 ]]; then
    echo "错误: 需要root权限运行此脚本"
    exit 1
fi

# 创建目录
echo "1. 创建目录结构..."
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp

# 停止现有服务
echo "2. 停止现有FRP服务..."
systemctl stop frpc 2>/dev/null || true
pkill -f frpc 2>/dev/null || true

# 复制文件
echo "3. 部署文件..."
cp frpc /Volume1/www/frpc/
cp frpc-corrected.toml /Volume1/www/frpc/frpc.toml
cp ca.pem /Volume1/www/frpc/
cp install.sh /Volume1/www/frpc/

# 设置权限
echo "4. 设置文件权限..."
chmod +x /Volume1/www/frpc/frpc
chmod +x /Volume1/www/frpc/install.sh
chmod 644 /Volume1/www/frpc/frpc.toml
chmod 644 /Volume1/www/frpc/ca.pem

# 创建systemd服务
echo "5. 配置系统服务..."
cat > /etc/systemd/system/frpc.service << 'EOL'
[Unit]
Description=Frp Client Service for NAS
After=network.target

[Service]
Type=simple
User=root
Group=root
Restart=on-failure
RestartSec=5s
ExecStart=/Volume1/www/frpc/frpc -c /Volume1/www/frpc/frpc.toml
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=frpc

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable frpc

# 测试配置
echo "6. 测试配置文件..."
cd /Volume1/www/frpc
if ./frpc verify -c frpc.toml; then
    echo "✅ 配置文件验证通过"
else
    echo "❌ 配置文件验证失败"
    exit 1
fi

# 启动服务
echo "7. 启动FRP服务..."
systemctl start frpc

# 等待启动
sleep 5

# 检查状态
echo "8. 检查服务状态..."
if systemctl is-active --quiet frpc; then
    echo "✅ FRP服务启动成功"
    systemctl status frpc --no-pager
else
    echo "❌ FRP服务启动失败"
    journalctl -u frpc -n 20
    exit 1
fi

echo "=== 部署完成 ==="
echo "管理界面: http://127.0.0.1:7400"
echo "日志查看: journalctl -u frpc -f"
echo "配置文件: /Volume1/www/frpc/frpc.toml"
EOF

    chmod +x "$final_package/deploy.sh"

    # 创建压缩包
    cd /Users/yanyu/www
    tar -czf nas-final-deployment.tar.gz nas-final-deployment-package/

    log_success "✅ 最终部署包创建完成: /Users/yanyu/www/nas-final-deployment.tar.gz"
}

# 创建DNS配置指令
create_dns_instructions() {
    log_step "创建DNS配置指令..."

    cat > /Users/yanyu/www/DNS_CONFIGURATION_INSTRUCTIONS.md << EOF
# DNS配置指令

## 当前状态
- FRP服务端: $FRP_SERVER:$FRP_PORT ✅ 运行中
- 需要配置的域名解析指向: $FRP_SERVER

## DNS配置清单

### 必须配置的A记录

| 主机记录 | 记录类型 | 记录值 | TTL | 状态 |
|---------|---------|--------|-----|------|
| api | A | $FRP_SERVER | 600 | 🔄 待配置 |
| admin | A | $FRP_SERVER | 600 | 🔄 待配置 |
| llm | A | $FRP_SERVER | 600 | 🔄 待配置 |
| mail | A | $FRP_SERVER | 600 | 🔄 待配置 |
| nas | A | $FRP_SERVER | 600 | 🔄 待配置 |

### 特殊服务域名

| 主机记录 | 记录类型 | 记录值 | 端口 | 用途 |
|---------|---------|--------|------|------|
| mysql | A | $FRP_SERVER | 3307 | 数据库外网访问 |
| redis | A | $FRP_SERVER | 6378 | 缓存外网访问 |
| files | A | $FRP_SERVER | - | 文件服务 |
| backup | A | $FRP_SERVER | - | 备份服务 |

## 配置步骤

### 1. 登录DNS服务商
- Cloudflare / 阿里云DNS / 腾讯云DNS等

### 2. 添加A记录
对每个域名添加A记录指向 $FRP_SERVER

### 3. 验证配置
\`\`\`bash
nslookup api.0379.email
# 应该返回 $FRP_SERVER
\`\`\`

### 4. 等待生效
DNS更改通常需要几分钟到几小时生效

## 测试验证
DNS配置完成后测试：
\`\`\`bash
# 测试域名解析
nslookup api.0379.email
nslookup admin.0379.email
nslookup llm.0379.email

# 测试HTTP访问 (NAS部署完成后)
curl http://api.0379.email/health
curl http://llm.0379.email/health
\`\`\`
EOF

    log_success "✅ DNS配置指令已创建: /Users/yanyu/www/DNS_CONFIGURATION_INSTRUCTIONS.md"
}

# 创建完整的NAS部署指南
create_complete_nas_guide() {
    log_step "创建完整的NAS部署指南..."

    cat > /Users/yanyu/www/COMPLETE_NAS_DEPLOYMENT_GUIDE.md << EOF
# NAS FRP客户端完整部署指南

## 🎯 部署目标
- 在NAS (192.168.3.45) 上部署FRP客户端
- 连接到FRP服务端 ($FRP_SERVER:$FRP_PORT)
- 实现外网域名访问: api.0379.email, admin.0379.email, llm.0379.email, mail.0379.email

## 📋 前置条件
- ✅ FRP服务端运行正常
- ✅ 域名解析已配置 (需要验证指向$FRP_SERVER)
- ✅ 部署包准备完成
- 🔄 NAS SSH访问需要启用

## 🚀 部署方法

### 方法1: SSH自动部署 (推荐)

#### 1.1 启用NAS SSH服务
1. 打开浏览器访问NAS管理界面
2. 登录NAS管理系统
3. 进入"控制面板" > "终端机"或"服务"
4. 启用SSH服务
5. 设置SSH端口 (默认22或57)
6. 保存设置

#### 1.2 执行自动部署
\`\`\`bash
# 在本地执行
scp -r /Users/yanyu/www/nas-final-deployment-package/* root@192.168.3.45:/tmp/
ssh root@192.168.3.45 "cd /tmp && chmod +x deploy.sh && ./deploy.sh"
\`\`\`

### 方法2: U盘手动部署

#### 2.1 准备U盘
1. 下载部署包: /Users/yanyu/www/nas-final-deployment.tar.gz
2. 解压到U盘
3. 将U盘插入NAS

#### 2.2 在NAS上执行
\`\`\`bash
# 通过SSH或物理终端访问NAS
cd /Volume1/USB_DRIVE/nas-final-deployment-package
./deploy.sh
\`\`\`

### 方法3: 手动分步部署

#### 3.1 创建目录
\`\`\`bash
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp
\`\`\`

#### 3.2 上传文件
将以下文件上传到 /Volume1/www/frpc/:
- frpc (二进制文件)
- frpc-corrected.toml (重命名为frpc.toml)
- ca.pem (证书文件)
- deploy.sh (部署脚本)

#### 3.3 执行部署
\`\`\`bash
cd /Volume1/www/frpc
chmod +x frpc deploy.sh
./deploy.sh
\`\`\`

## 🔧 部署后验证

### 1. 检查服务状态
\`\`\`bash
systemctl status frpc
ps aux | grep frpc
\`\`\`

### 2. 查看连接日志
\`\`\`bash
journalctl -u frpc -f
tail -f /Volume1/www/frpc/logs/frpc.log
\`\`\`

### 3. 测试管理界面
\`\`\`bash
# 本地访问
curl http://127.0.0.1:7400
\`\`\`

### 4. 验证外网访问
\`\`\`bash
# 测试域名访问
curl http://api.0379.email/health
curl http://llm.0379.email/health
\`\`\`

## 🌐 服务访问地址

部署成功后，可通过以下地址访问：

| 服务 | 外网地址 | 本地地址 | 状态 |
|------|----------|----------|------|
| SSH管理 | docker.0379.email:9557 | 192.168.3.45:57 | 🔄 部署后可用 |
| NAS管理 | nas.0379.email | 192.168.3.45:80 | 🔄 部署后可用 |
| API服务 | api.0379.email | 192.168.3.45:3000 | 🔄 部署后可用 |
| 管理面板 | admin.0379.email | 192.168.3.45:3001 | 🔄 部署后可用 |
| LLM服务 | llm.0379.email | 192.168.3.45:3002 | 🔄 部署后可用 |
| 邮件服务 | mail.0379.email | 192.168.3.45:3003 | 🔄 部署后可用 |

## ❗ 故障排除

### SSH连接问题
1. 确认NAS网络连接正常
2. 检查SSH服务是否启用
3. 验证防火墙设置
4. 尝试不同SSH端口 (22, 57, 2222)

### 服务启动失败
1. 检查配置文件: \`./frpc verify -c frpc.toml\`
2. 查看错误日志: \`journalctl -u frpc -n 20\`
3. 验证网络连接: \`telnet $FRP_SERVER $FRP_PORT\`

### 域名访问问题
1. 检查DNS解析: \`nslookup api.0379.email\`
2. 确认指向$FRP_SERVER
3. 验证FRP隧道连接状态
4. 检查本地服务是否运行

## 📞 技术支持

如遇到部署问题：
1. 检查FRP服务端状态
2. 验证网络连通性
3. 查看详细错误日志
4. 重新运行部署脚本

---

**部署完成后，整个0379.email系统将提供完整的外网访问能力！**

*最后更新: $(date)*
EOF

    log_success "✅ 完整NAS部署指南已创建: /Users/yanyu/www/COMPLETE_NAS_DEPLOYMENT_GUIDE.md"
}

# 主函数
main() {
    log_info "=== 域名验证和最终部署准备 ==="

    # 验证FRP服务端
    if ! verify_frp_server; then
        log_error "FRP服务端不可达，请检查网络连接"
        exit 1
    fi

    # 检查域名解析
    check_domain_resolution

    # 创建最终部署包
    create_final_deployment_package

    # 创建DNS配置指令
    create_dns_instructions

    # 创建完整部署指南
    create_complete_nas_guide

    log_info "=== 准备工作完成 ==="
    log_info ""
    log_info "📦 已创建文件："
    log_info "1. 最终部署包: /Users/yanyu/www/nas-final-deployment.tar.gz"
    log_info "2. DNS配置指南: /Users/yanyu/www/DNS_CONFIGURATION_INSTRUCTIONS.md"
    log_info "3. 完整部署指南: /Users/yanyu/www/COMPLETE_NAS_DEPLOYMENT_GUIDE.md"
    log_info ""
    log_info "🎯 下一步行动："
    log_info "1. 检查DNS解析是否指向 $FRP_SERVER"
    log_info "2. 在NAS上启用SSH服务"
    log_info "3. 部署最终部署包到NAS"
    log_info "4. 验证外网域名访问功能"
    log_info ""
    log_info "📋 部署完成后可访问："
    log_info "- api.0379.email/health"
    log_info "- admin.0379.email"
    log_info "- llm.0379.email/health"
    log_info "- mail.0379.email"
}

# 执行主函数
main "$@"