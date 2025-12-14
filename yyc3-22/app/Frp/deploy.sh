#!/bin/bash

# =============================================================================
# NAS FRP客户端一键部署脚本
# =============================================================================

set -euo pipefail

echo "=== 0379.email NAS FRP客户端一键部署 ==="
echo "部署时间: $(date)"
echo "FRP服务端: 8.152.195.33:17000"

# 检查权限
if [[ $EUID -ne 0 ]]; then
    echo "错误: 需要root权限运行此脚本"
    exit 1
fi

# 创建目录
echo "1. 创建目录结构..."
mkdir -p /Volume2/www/frpc/{logs,scripts}
mkdir -p /etc/frp

# 停止现有服务
echo "2. 停止现有FRP服务..."
systemctl stop frpc 2>/dev/null || true
pkill -f frpc 2>/dev/null || true

# 复制文件
echo "3. 部署文件..."
cp frpc /Volume2/www/frpc/
cp frpc-corrected.toml /Volume2/www/frpc/frpc.toml
cp ca.pem /Volume2/www/frpc/
cp install.sh /Volume2/www/frpc/

# 设置权限
echo "4. 设置文件权限..."
chmod +x /Volume2/www/frpc/frpc
chmod +x /Volume2/www/frpc/install.sh
chmod 644 /Volume2/www/frpc/frpc.toml
chmod 644 /Volume2/www/frpc/ca.pem

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
ExecStart=/Volume2/www/frpc/frpc -c /Volume2/www/frpc/frpc.toml
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
cd /Volume2/www/frpc
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

    # 显示连接信息
    echo ""
    echo "=== 连接信息 ==="
    echo "管理界面: http://127.0.0.1:7400"
    echo "日志查看: journalctl -u frpc -f"
    echo "配置文件: /Volume2/www/frpc/frpc.toml"
    echo ""
    echo "=== 外网访问地址 (DNS配置完成后) ==="
    echo "API服务: http://api.0379.email"
    echo "管理面板: http://admin.0379.email"
    echo "AI服务: http://llm.0379.email"
    echo "邮件服务: http://mail.0379.email"
    echo "NAS管理: http://nas.0379.email"
    echo "SSH管理: docker.0379.email:9557"
else
    echo "❌ FRP服务启动失败"
    journalctl -u frpc -n 20
    exit 1
fi

echo "=== 部署完成 ==="
echo "🎉 NAS FRP客户端部署成功！"
echo ""
echo "下一步："
echo "1. 确保DNS解析指向 8.152.195.33"
echo "2. 测试外网域名访问"
echo "3. 验证所有服务正常运行"