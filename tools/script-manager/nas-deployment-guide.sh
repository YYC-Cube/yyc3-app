#!/bin/bash

# =============================================================================
# NAS 客户端自动化部署脚本 (yyc3-45)
# 铁威马 F4-423 NAS 专用
# =============================================================================

set -euo pipefail

# 配置变量
NAS_IP="192.168.3.45"
NAS_USER="root"
NAS_PATH="/Volume1/www/frpc"
DEPLOYMENT_PACKAGE="/Users/yanyu/www/nas-frp-deployment"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
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

# 检查部署包
check_deployment_package() {
    log_step "检查部署包文件..."

    if [[ ! -d "$DEPLOYMENT_PACKAGE" ]]; then
        log_error "部署包目录不存在: $DEPLOYMENT_PACKAGE"
        exit 1
    fi

    local required_files=("frpc" "frpc.toml" "ca.pem" "install.sh" "README.md")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$DEPLOYMENT_PACKAGE/$file" ]]; then
            log_error "部署包缺少必要文件: $file"
            exit 1
        fi
    done

    log_info "部署包文件检查完成"
}

# 创建连接测试脚本
create_connection_test_script() {
    log_step "创建NAS连接测试脚本..."

    cat > /tmp/nas-connectivity-test.sh << 'EOF'
#!/bin/bash

# NAS连接性测试脚本
NAS_IP="192.168.3.45"
NAS_PORTS="22 57 2222 80 443"

echo "=== NAS连接性测试 ==="
echo "NAS IP: $NAS_IP"

# Ping测试
echo -n "1. Ping测试: "
if ping -c 1 $NAS_IP &>/dev/null; then
    echo "✅ 成功"
else
    echo "❌ 失败"
    exit 1
fi

# 端口扫描测试
echo "2. 端口扫描测试:"
for port in $NAS_PORTS; do
    echo -n "   端口 $port: "
    if timeout 3 bash -c "</dev/tcp/$NAS_IP/$port" 2>/dev/null; then
        echo "✅ 开放"
    else
        echo "❌ 关闭/不可达"
    fi
done

echo "3. 网络路径信息:"
echo "   路由信息: $(netstat -rn | grep $NAS_IP | head -1 || echo '未找到路由')"
echo "   ARP信息: $(arp -n | grep $NAS_IP || echo '未找到ARP记录')"

echo "=== 测试完成 ==="
EOF

    chmod +x /tmp/nas-connectivity-test.sh
    log_info "连接测试脚本已创建: /tmp/nas-connectivity-test.sh"
}

# 创建手动部署指令
create_manual_deployment_instructions() {
    log_step "创建手动部署指令文档..."

    cat > /Users/yanyu/www/NAS_MANUAL_DEPLOYMENT.md << 'EOF'
# NAS 客户端手动部署指南

## 自动化执行命令

### 方法1: 直接SSH部署
```bash
# 如果SSH可用，执行以下命令：
scp -r /Users/yanyu/www/nas-frp-deployment/* root@192.168.3.45:/Volume1/www/frpc/
ssh root@192.168.3.45 "cd /Volume1/www/frpc && ./install.sh"
```

### 方法2: 使用SCP传输后手动安装
```bash
# 1. 传输部署包
scp /Users/yanyu/www/nas-frp-deployment.tar.gz root@192.168.3.45:/tmp/

# 2. SSH登录NAS
ssh root@192.168.3.45

# 3. 在NAS上执行以下命令：
cd /tmp
tar -xzf nas-frp-deployment.tar.gz
cd nas-frp-deployment
./install.sh
```

### 方法3: U盘部署
```bash
# 1. 将部署包复制到U盘
cp -r /Users/yanyu/www/nas-frp-deployment /Volumes/USB_DRIVE/

# 2. 将U盘插入NAS，通过SSH或终端执行：
cd /Volume1/USB_DRIVE/nas-frp-deployment
cp -r * /Volume1/www/frpc/
cd /Volume1/www/frpc
./install.sh
```

## NAS端手动操作步骤

如果无法SSH连接，请在NAS上手动执行以下操作：

### 1. 创建目录
```bash
mkdir -p /Volume1/www/frpc/{logs,scripts}
mkdir -p /etc/frp
```

### 2. 下载并传输文件
将以下文件传输到 `/Volume1/www/frpc/` 目录：
- frpc (二进制文件)
- frpc.toml (配置文件)
- ca.pem (证书文件)
- install.sh (安装脚本)

### 3. 设置权限
```bash
cd /Volume1/www/frpc
chmod +x frpc install.sh
chmod 644 frpc.toml ca.pem
```

### 4. 执行安装
```bash
./install.sh
```

## 验证部署

部署完成后，在NAS上执行以下验证命令：

```bash
# 检查服务状态
systemctl status frpc

# 查看实时日志
journalctl -u frpc -f

# 检查进程
ps aux | grep frpc

# 检查端口监听
netstat -tlnp | grep :7400

# 检查到服务器的连接
netstat -an | grep 8.130.127.121
```

## 服务地址

部署成功后，以下服务将可通过外网访问：

- SSH管理: docker.0379.email:9557
- NAS管理: nas.0379.email
- API服务: api.0379.email
- 管理面板: admin.0379.email
- LLM服务: llm.0379.email
- 邮件服务: mail.0379.email
- 数据库: mysql.0379.email:3307
- 缓存: redis.0379.email:6378
- 文件服务: files.0379.email

## 故障排除

### SSH连接问题
1. 确认NAS网络连接正常
2. 检查SSH服务是否启用
3. 尝试不同端口: 22, 57, 2222
4. 检查防火墙设置

### 服务启动失败
1. 检查配置文件语法: `./frpc -c frpc.toml -t`
2. 查看详细日志: `journalctl -u frpc -n 50`
3. 检查网络连接到服务器: `telnet 8.130.127.121 17000`

### 端口冲突
1. 检查端口占用: `netstat -tlnp | grep -E "(3000|3001|3002|3003)"`
2. 修改配置文件中的端口映射
EOF

    log_info "手动部署指令文档已创建: /Users/yanyu/www/NAS_MANUAL_DEPLOYMENT.md"
}

# 创建部署验证脚本
create_deployment_verification_script() {
    log_step "创建部署验证脚本..."

    cat > /tmp/nas-verification.sh << 'EOF'
#!/bin/bash

# NAS FRP客户端部署验证脚本
NAS_IP="192.168.3.45"
FRP_SERVER="8.130.127.121"

echo "=== NAS FRP客户端部署验证 ==="
echo "验证时间: $(date)"

# 1. 网络连通性验证
echo "1. 网络连通性验证:"
echo -n "   NAS可达性: "
if ping -c 1 $NAS_IP &>/dev/null; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo -n "   FRP服务器可达性: "
if ping -c 1 $FRP_SERVER &>/dev/null; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

echo -n "   FRP端口连通性: "
if timeout 3 bash -c "</dev/tcp/$FRP_SERVER/17000" 2>/dev/null; then
    echo "✅ 通过"
else
    echo "❌ 失败"
fi

# 2. 服务状态验证
echo "2. 服务状态验证:"
echo "   注意: 需要在NAS上执行以下命令验证"
echo "   systemctl status frpc"
echo "   ps aux | grep frpc"
echo "   netstat -tlnp | grep :7400"

# 3. 配置验证
echo "3. 配置文件验证:"
echo "   配置文件位置: /Volume1/www/frpc/frpc.toml"
echo "   日志文件位置: /Volume1/www/frpc/logs/frpc.log"
echo "   管理界面: http://$NAS_IP:7400"

# 4. 域名解析验证
echo "4. 域名解析验证 (需要配置完成后测试):"
domains=("api.0379.email" "admin.0379.email" "llm.0379.email" "mail.0379.email")
for domain in "${domains[@]}"; do
    echo -n "   $domain: "
    if nslookup $domain &>/dev/null; then
        echo "✅ 可解析"
    else
        echo "❌ 未解析或不可达"
    fi
done

echo "=== 验证完成 ==="
EOF

    chmod +x /tmp/nas-verification.sh
    log_info "部署验证脚本已创建: /tmp/nas-verification.sh"
}

# 主函数
main() {
    log_info "开始NAS客户端自动化部署准备..."
    log_info "目标NAS: $NAS_IP"

    check_deployment_package
    create_connection_test_script
    create_manual_deployment_instructions
    create_deployment_verification_script

    log_info "=== 部署准备完成 ==="
    log_info ""
    log_info "已创建以下文件："
    log_info "1. 连接测试脚本: /tmp/nas-connectivity-test.sh"
    log_info "2. 手动部署指南: /Users/yanyu/www/NAS_MANUAL_DEPLOYMENT.md"
    log_info "3. 部署验证脚本: /tmp/nas-verification.sh"
    log_info "4. 部署包目录: $DEPLOYMENT_PACKAGE"
    log_info ""
    log_info "执行下一步操作："
    log_info "1. 运行连接测试: /tmp/nas-connectivity-test.sh"
    log_info "2. 查看部署指南: cat /Users/yanyu/www/NAS_MANUAL_DEPLOYMENT.md"
    log_info "3. 手动部署或SSH自动部署到NAS"
}

# 执行主函数
main "$@"