#!/bin/bash

# YYC³智能脚本生成和管理系统 - 一键部署脚本
# 版本: v1.0.0
# 创建时间: 2025-12-08
# 支持环境: macOS, Linux

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 系统信息
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_NAME="YYC³智能脚本生成和管理系统"
VERSION="1.0.0"
INSTALL_DIR="/opt/yyc3-smart-system"
SERVICE_USER="yyc3"
PORT=9000

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    YYC³ 智能脚本生成和管理系统                      ║
║                      Smart Script Generator                     ║
║                                                              ║
║  版本: v1.0.0                           言启象限，语枢智能       ║
║  创建: 2025-12-08                        YYC³ AI Family          ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    echo -e "${BLUE}🔍 检查系统要求...${NC}"

    # 检查操作系统
    if [[ "$OSTYPE" != "darwin"* && "$OSTYPE" != "linux-gnu"* ]]; then
        echo -e "${RED}❌ 不支持的操作系统: $OSTYPE${NC}"
        exit 1
    fi

    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo -e "${YELLOW}请访问 https://nodejs.org 安装Node.js 14+${NC}"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="14.0.0"

    if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
        echo -e "${RED}❌ Node.js版本过低: $NODE_VERSION (需要 >= $REQUIRED_NODE_VERSION)${NC}"
        exit 1
    fi

    # 检查npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi

    # 检查磁盘空间
    AVAILABLE_SPACE=$(df -BG "$SCRIPT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 2 ]; then
        echo -e "${RED}❌ 磁盘空间不足 (需要至少2GB)${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 系统要求检查通过${NC}"
}

# 创建系统用户
create_service_user() {
    if [ "$EUID" -eq 0 ]; then
        echo -e "${BLUE}👤 创建系统用户: $SERVICE_USER${NC}"

        if ! id "$SERVICE_USER" &>/dev/null; then
            useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
            echo -e "${GREEN}✅ 用户创建成功: $SERVICE_USER${NC}"
        else
            echo -e "${YELLOW}⚠️ 用户已存在: $SERVICE_USER${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ 非root用户，跳过用户创建${NC}"
    fi
}

# 安装系统依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装系统依赖...${NC}"

    cd "$SCRIPT_DIR"

    # 安装Node.js依赖
    if [ -f "package.json" ]; then
        echo -e "${BLUE}安装Node.js依赖包...${NC}"
        npm install --production

        # 安装开发依赖（如果需要）
        if [ "$1" = "--dev" ]; then
            echo -e "${BLUE}安装开发依赖包...${NC}"
            npm install --development
        fi
    else
        echo -e "${YELLOW}⚠️ 未找到package.json，跳过依赖安装${NC}"
    fi

    # 创建必要目录
    echo -e "${BLUE}创建系统目录...${NC}"
    mkdir -p logs scripts generated temp backups config

    # 设置权限
    if [ "$EUID" -eq 0 ]; then
        chown -R "$SERVICE_USER:$SERVICE_USER" "$SCRIPT_DIR"
        chmod +x scripts/*.sh 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 配置系统
configure_system() {
    echo -e "${BLUE}⚙️ 配置系统...${NC}"

    # 生成配置文件
    if [ ! -f "config.json" ]; then
        echo -e "${BLUE}生成默认配置文件...${NC}"
        cat > config.json << EOF
{
  "system": {
    "name": "$SYSTEM_NAME",
    "version": "$VERSION",
    "port": $PORT,
    "host": "0.0.0.0",
    "environment": "production"
  },
  "paths": {
    "wwwDir": "/Users/yanyu/www",
    "workspaceDir": "/Users/yanyu/yyc3-workspace",
    "nasMount": "/Volumes/NAS-YYC3",
    "logDir": "./logs",
    "scriptsDir": "./scripts/generated",
    "tempDir": "./temp",
    "backupsDir": "./backups"
  },
  "services": {
    "api": {
      "port": 6600,
      "url": "api.0379.email"
    },
    "admin": {
      "port": 6601,
      "url": "admin.0379.email"
    },
    "llm": {
      "port": 6602,
      "url": "llm.0379.email"
    },
    "mail": {
      "port": 6603,
      "url": "mail.0379.email"
    },
    "ai": {
      "port": 6604,
      "url": "ai.0379.email"
    },
    "app": {
      "port": 6605,
      "url": "app.0379.email"
    },
    "redis": {
      "port": 6606,
      "url": "redis.0379.email"
    }
  },
  "servers": [
    {
      "name": "production",
      "host": "8.152.195.33",
      "user": "root",
      "path": "/opt/0379-email-platform",
      "ssl": true,
      "description": "阿里云生产服务器"
    },
    {
      "name": "staging",
      "host": "8.130.127.121",
      "user": "root",
      "path": "/opt/staging-0379",
      "ssl": false,
      "description": "腾讯云测试服务器"
    }
  ],
  "monitoring": {
    "checkInterval": 300,
    "alertEmail": "admin@0379.email",
    "slackWebhook": "",
    "thresholds": {
      "cpu": 80,
      "memory": 85,
      "disk": 90,
      "responseTime": 2000,
      "errorRate": 5
    }
  },
  "backup": {
    "retentionDays": 7,
    "nasBackup": true,
    "compression": true,
    "autoBackup": true
  },
  "security": {
    "enableSSL": true,
    "allowedIPs": ["127.0.0.1", "192.168.1.0/24"],
    "apiKeyRequired": false,
    "rateLimit": {
      "windowMs": 900000,
      "max": 100
    }
  },
  "ai": {
    "enabled": true,
    "models": {
      "faultDiagnosis": "gpt-4",
      "performanceOptimization": "claude-3-sonnet",
      "securityAnalysis": "gpt-3.5-turbo"
    },
    "autoRemediation": true,
    "learningEnabled": true
  }
}
EOF
        echo -e "${GREEN}✅ 配置文件生成完成${NC}"
    else
        echo -e "${YELLOW}⚠️ 配置文件已存在，跳过生成${NC}"
    fi

    # 创建环境文件
    if [ ! -f ".env" ]; then
        echo -e "${BLUE}创建环境变量文件...${NC}"
        cat > .env << EOF
# YYC³智能脚本生成系统环境变量
NODE_ENV=production
PORT=$PORT
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_smart_system
DB_USER=yyc3
DB_PASSWORD=your_db_password_here

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 邮件配置
SMTP_HOST=smtp.0379.email
SMTP_PORT=587
SMTP_USER=admin@0379.email
SMTP_PASSWORD=your_email_password_here

# API密钥 (如需要)
OPENAI_API_KEY=your_openai_key_here
CLAUDE_API_KEY=your_claude_key_here

# 安全配置
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# 日志配置
LOG_LEVEL=info
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
EOF
        echo -e "${GREEN}✅ 环境变量文件创建完成${NC}"
    fi
}

# 创建systemd服务
create_systemd_service() {
    if [ "$EUID" -eq 0 ] && command -v systemctl &> /dev/null; then
        echo -e "${BLUE}🔧 创建systemd服务...${NC}"

        cat > /etc/systemd/system/yyc3-smart-system.service << EOF
[Unit]
Description=YYC3 Smart Script Generator and Management System
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/node SmartScriptGenerator.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=yyc3-smart-system

# 安全配置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$SCRIPT_DIR/logs $SCRIPT_DIR/temp $SCRIPT_DIR/backups

[Install]
WantedBy=multi-user.target
EOF

        # 重新加载systemd
        systemctl daemon-reload

        echo -e "${GREEN}✅ systemd服务创建完成${NC}"
    else
        echo -e "${YELLOW}⚠️ 跳过systemd服务创建${NC}"
    fi
}

# 设置防火墙规则
setup_firewall() {
    if [ "$EUID" -eq 0 ]; then
        echo -e "${BLUE}🔥 配置防火墙规则...${NC}"

        # UFW (Ubuntu)
        if command -v ufw &> /dev/null; then
            ufw allow $PORT/tcp
            echo -e "${GREEN}✅ UFW防火墙规则已添加${NC}"
        fi

        # firewalld (CentOS/RHEL)
        if command -v firewall-cmd &> /dev/null; then
            firewall-cmd --permanent --add-port=$PORT/tcp
            firewall-cmd --reload
            echo -e "${GREEN}✅ firewalld防火墙规则已添加${NC}"
        fi
    fi
}

# 启动系统
start_system() {
    echo -e "${BLUE}🚀 启动YYC³智能脚本生成系统...${NC}"

    cd "$SCRIPT_DIR"

    # 检查端口是否被占用
    if lsof -i :$PORT &>/dev/null; then
        echo -e "${YELLOW}⚠️ 端口 $PORT 已被占用，尝试停止现有进程...${NC}"
        pkill -f "SmartScriptGenerator" || true
        sleep 2
    fi

    # 启动服务
    if [ "$EUID" -eq 0 ] && command -v systemctl &> /dev/null; then
        echo -e "${BLUE}使用systemd启动服务...${NC}"
        systemctl enable yyc3-smart-system
        systemctl start yyc3-smart-system

        # 检查服务状态
        if systemctl is-active --quiet yyc3-smart-system; then
            echo -e "${GREEN}✅ 服务启动成功${NC}"
        else
            echo -e "${RED}❌ 服务启动失败${NC}"
            systemctl status yyc3-smart-system
            exit 1
        fi
    else
        echo -e "${BLUE}使用Node.js直接启动服务...${NC}"
        nohup node SmartScriptGenerator.js > logs/startup.log 2>&1 &
        sleep 3

        # 检查进程
        if pgrep -f "SmartScriptGenerator" > /dev/null; then
            echo -e "${GREEN}✅ 服务启动成功${NC}"
        else
            echo -e "${RED}❌ 服务启动失败${NC}"
            cat logs/startup.log
            exit 1
        fi
    fi

    # 验证服务
    echo -e "${BLUE}验证服务状态...${NC}"
    sleep 5

    if curl -f -s http://localhost:$PORT/api/health > /dev/null; then
        echo -e "${GREEN}✅ 服务健康检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️ 服务健康检查失败，请检查日志${NC}"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo -e "${CYAN}"
    cat << EOF
╔══════════════════════════════════════════════════════════════╗
║                        部署完成信息                              ║
╚══════════════════════════════════════════════════════════════╝

🌟 系统信息:
   名称: $SYSTEM_NAME
   版本: $VERSION
   端口: $PORT
   用户: $SERVICE_USER

🌐 访问地址:
   管理界面: http://localhost:$PORT
   API接口:   http://localhost:$PORT/api
   健康检查:  http://localhost:$PORT/api/health

📁 重要路径:
   安装目录: $SCRIPT_DIR
   配置文件: $SCRIPT_DIR/config.json
   环境变量: $SCRIPT_DIR/.env
   日志目录: $SCRIPT_DIR/logs
   脚本目录: $SCRIPT_DIR/scripts/generated

🔧 管理命令:
EOF

    if [ "$EUID" -eq 0 ] && command -v systemctl &> /dev/null; then
        echo "   启动服务: systemctl start yyc3-smart-system"
        echo "   停止服务: systemctl stop yyc3-smart-system"
        echo "   重启服务: systemctl restart yyc3-smart-system"
        echo "   查看状态: systemctl status yyc3-smart-system"
        echo "   查看日志: journalctl -u yyc3-smart-system -f"
    else
        echo "   查看进程: ps aux | grep SmartScriptGenerator"
        echo "   停止服务: pkill -f SmartScriptGenerator"
        echo "   查看日志: tail -f logs/startup.log"
    fi

    cat << EOF
   手动启动: cd $SCRIPT_DIR && node SmartScriptGenerator.js

📧 联系方式:
   邮箱: admin@0379.email
   团队: YYC3 AI Family
   文档: https://docs.yyc3.com/smart-script-manager

🎉 部署完成！开始您的智能DevOps之旅！
EOF
    echo -e "${NC}"
}

# 主函数
main() {
    show_banner

    echo -e "${BLUE}开始部署 $SYSTEM_NAME...${NC}"
    echo ""

    # 解析参数
    DEV_MODE=false
    SKIP_DEPS=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                DEV_MODE=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --dev         开发模式安装（包含开发依赖）"
                echo "  --skip-deps   跳过依赖安装"
                echo "  --help, -h    显示帮助信息"
                exit 0
                ;;
            *)
                echo -e "${RED}未知参数: $1${NC}"
                exit 1
                ;;
        esac
    done

    # 执行部署步骤
    check_requirements

    if [ "$SKIP_DEPS" = false ]; then
        create_service_user
        install_dependencies $([ "$DEV_MODE" = true ] && echo "--dev" || echo "")
    fi

    configure_system
    create_systemd_service
    setup_firewall
    start_system
    show_deployment_info

    echo -e "${GREEN}🎉 部署成功完成！${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中发生错误，请检查日志${NC}"; exit 1' ERR

# 运行主函数
main "$@"