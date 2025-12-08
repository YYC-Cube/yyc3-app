#!/bin/bash
# =============================================================================
# yyc3-121 NAS 集成脚本
# 将yyc3-121服务器挂载到NAS，并配置内网穿透
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
NAS_IP="192.168.3.45"
YYC3_121_IP="8.130.127.121"
SSH_USER="root"
SSH_KEY="$HOME/.ssh/yyc3-121_production"
NAS_MOUNT_POINT="/mnt/yyc3-121"

log_info "开始 yyc3-121 到 NAS 的集成配置..."

# 1. 创建NAS挂载点
log_info "创建NAS挂载点..."
ssh $NAS_IP "mkdir -p $NAS_MOUNT_POINT || true"

# 2. 配置SSH免密登录
log_info "配置SSH免密登录..."
if [ ! -f "$SSH_KEY" ]; then
    log_error "SSH密钥文件不存在: $SSH_KEY"
    exit 1
fi

chmod 600 "$SSH_KEY"
ssh-copy-id -i "$SSH_KEY" "$SSH_USER@$YYC3_121_IP" || log_warning "SSH密钥可能已经配置过"

# 3. 测试SSH连接
log_info "测试SSH连接到 yyc3-121..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_USER@$YYC3_121_IP" "echo 'SSH连接成功'" || {
    log_error "无法连接到 yyc3-121 服务器"
    exit 1
}

# 4. 在NAS上安装sshfs
log_info "在NAS上安装sshfs..."
ssh $NAS_IP "which sshfs || (apt-get update && apt-get install -y sshfs)" || {
    log_warning "无法在NAS上安装sshfs，请手动安装"
}

# 5. 创建挂载脚本
log_info "创建自动挂载脚本..."
cat > /tmp/mount-yyc3-121.sh << 'EOF'
#!/bin/bash
# NAS上挂载yyc3-121的脚本

NAS_IP="192.168.3.45"
YYC3_121_IP="8.130.127.121"
SSH_USER="root"
SSH_KEY="/root/.ssh/yyc3-121_production"
MOUNT_POINT="/mnt/yyc3-121"

# 确保密钥权限正确
chmod 600 $SSH_KEY

# 创建挂载点
mkdir -p $MOUNT_POINT

# 卸载已存在的挂载
umount $MOUNT_POINT 2>/dev/null || true

# 执行挂载
sshfs -o allow_other,default_permissions,IdentityFile=$SSH_KEY $SSH_USER@$YYC3_121_IP:/ $MOUNT_POINT

if [ $? -eq 0 ]; then
    echo "yyc3-121 成功挂载到 $MOUNT_POINT"
    df -h $MOUNT_POINT
else
    echo "挂载失败，请检查日志"
    exit 1
fi
EOF

# 6. 复制挂载脚本到NAS
scp -i "$SSH_KEY" /tmp/mount-yyc3-121.sh $SSH_USER@$YYC3_121_IP:/tmp/
scp /tmp/mount-yyc3-121.sh $NAS_IP:/root/

# 7. 复制SSH密钥到NAS
scp -i "$SSH_KEY" "$SSH_KEY" $NAS_IP:/root/.ssh/yyc3-121_production
ssh $NAS_IP "chmod 600 /root/.ssh/yyc3-121_production"

# 8. 在NAS上执行挂载
log_info "在NAS上执行挂载操作..."
ssh $NAS_IP "chmod +x /root/mount-yyc3-121.sh && /root/mount-yyc3-121.sh"

# 9. 创建systemd服务实现开机自动挂载
log_info "创建自动挂载服务..."
cat > /tmp/yyc3-121-mount.service << 'EOF'
[Unit]
Description=Mount yyc3-121 to NAS
After=network.target

[Service]
Type=oneshot
ExecStart=/root/mount-yyc3-121.sh
User=root
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# 复制服务文件到NAS
scp /tmp/yyc3-121-mount.service $NAS_IP:/etc/systemd/system/
ssh $NAS_IP "systemctl daemon-reload && systemctl enable yyc3-121-mount.service"

# 10. 更新FRP配置以支持NAS服务
log_info "更新FRP配置..."
cat > /tmp/frpc-nas-integration.toml << 'EOF'
[common]
server_addr = 8.130.127.121
server_port = 17000
token = "WJ5VzBplwxbSkGMenv9d5vizYb51PHdpWARJ34NnsNg="
authentication_method = token
authenticate_heartbeats = true
authenticate_new_work_conns = true

user = nas_client
admin_addr = 127.0.0.1
admin_port = 7400
admin_user = frp_admin
admin_pwd = "m5ODDD1oPMYKfhHG31A3tQ=="

log_file = /Volume1/www/frpc/logs/frpc.log
log_level = info
log_max_days = 7
tcp_mux = true
heartbeat_timeout = 60
heartbeat_interval = 30
tls_enable = false

# API服务 (本地)
[api-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3000
remote_port = 5001
custom_domains = api.0379.email

# LLM服务 (本地)
[llm-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 8000
remote_port = 5002
custom_domains = llm.0379.email

# 管理面板 (本地)
[admin-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3001
remote_port = 5003
custom_domains = admin.0379.email

# 邮件服务 (本地)
[mail-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3003
remote_port = 5004
custom_domains = mail.0379.email

# NAS管理界面 (本地)
[nas-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 80
remote_port = 5005
custom_domains = nas.0379.email

# 监控面板 (本地)
[monitor-0379]
type = tcp
local_ip = 192.168.3.45
local_port = 3000
remote_port = 5006
custom_domains = monitor.0379.email

# yyc3-121 文件管理服务 (通过挂载点)
[yyc3-121-files]
type = tcp
local_ip = 192.168.3.45
local_port = 8080
remote_port = 5010
custom_domains = files.0379.email

# yyc3-121 数据库服务 (通过挂载点)
[yyc3-121-db]
type = tcp
local_ip = 192.168.3.45
local_port = 3306
remote_port = 5011
custom_domains = db.0379.email
EOF

# 11. 备份原配置并更新
ssh $NAS_IP "cp /Volume1/www/frpc/frpc.toml /Volume1/www/frpc/frpc.toml.backup.$(date +%Y%m%d_%H%M%S)"
scp /tmp/frpc-nas-integration.toml $NAS_IP:/Volume1/www/frpc/frpc.toml

# 12. 重启FRP服务
log_info "重启FRP服务以应用新配置..."
ssh $NAS_IP "systemctl restart frpc || /Volume1/www/frpc/frpc -c /Volume1/www/frpc/frpc.toml &"

# 13. 验证集成
log_info "验证集成状态..."
echo "=== NAS 挂载状态 ==="
ssh $NAS_IP "df -h | grep yyc3-121 || echo '挂载未成功'"

echo "=== FRP 服务状态 ==="
ssh $NAS_IP "ps aux | grep frpc | grep -v grep || echo 'FRP服务未运行'"

echo "=== 服务连接测试 ==="
timeout 5 bash -c "</dev/tcp/192.168.3.45/3000" && echo "✓ API服务可达" || echo "✗ API服务不可达"
timeout 5 bash -c "</dev/tcp/192.168.3.45/3001" && echo "✓ Admin服务可达" || echo "✗ Admin服务不可达"

log_success "yyc3-121 到 NAS 集成配置完成！"
log_info "服务访问地址："
log_info "  - API: api.0379.email:5001"
log_info "  - 管理面板: admin.0379.email:5003"
log_info "  - LLM服务: llm.0379.email:5002"
log_info "  - 邮件服务: mail.0379.email:5004"
log_info "  - NAS管理: nas.0379.email:5005"
log_info "  - 监控面板: monitor.0379.email:5006"
log_info "  - 文件管理: files.0379.email:5010 (yyc3-121)"
log_info "  - 数据库: db.0379.email:5011 (yyc3-121)"

# 清理临时文件
rm -f /tmp/mount-yyc3-121.sh /tmp/yyc3-121-mount.service /tmp/frpc-nas-integration.toml

log_success "集成配置脚本执行完成！"