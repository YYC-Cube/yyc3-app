/**
 * M4智能脚本生成器
 * YYC³ AI Family - 智能化M4宏处理和脚本生成系统
 * 邮箱: admin@0379.email
 */

import { serve } from "bun";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const PORT = 9558;

// M4模板库
const M4_TEMPLATES = {
    // Web应用部署模板
    web_deployment: `#!/bin/bash
# 自动生成的Web应用部署脚本
# YYC³ M4智能脚本生成器 - ${new Date().toISOString()}

set -e

# 配置变量
SERVICE_NAME="${service_name || 'my-app'}"
PORT="${port || '3000'}"
DOMAIN="${domain || 'example.com'}"
ENVIRONMENT="${environment || 'production'}"
BACKUP_PATH="${backup_path || '/var/backups'}"
DEPLOY_USER="${deploy_user || 'deploy'}"
GIT_REPO="${git_repo || ''}"

echo "🚀 开始部署 $SERVICE_NAME 到 $ENVIRONMENT 环境..."

# 检查必要工具
check_requirements() {
    local tools=("git" "npm" "nginx")
    for tool in "\${tools[@]}"; do
        if ! command -v \$tool &> /dev/null; then
            echo "❌ 工具 \$tool 未安装"
            exit 1
        fi
    done
    echo "✅ 环境检查通过"
}

# 创建备份
create_backup() {
    if [ -d "/var/www/\$SERVICE_NAME" ]; then
        echo "💾 创建应用备份..."
        mkdir -p \$BACKUP_PATH
        sudo cp -r "/var/www/\$SERVICE_NAME" "\$BACKUP_PATH/\$(date +%Y%m%d_%H%M%S)"
        echo "✅ 备份创建完成"
    fi
}

# 拉取代码
pull_code() {
    echo "📥 拉取最新代码..."
    if [ ! -d "/tmp/\$SERVICE_NAME" ]; then
        if [ -n "$GIT_REPO" ]; then
            git clone \$GIT_REPO /tmp/\$SERVICE_NAME
        else
            echo "❌ Git仓库地址未提供"
            exit 1
        fi
    else
        cd /tmp/\$SERVICE_NAME
        git pull origin main
    fi
    echo "✅ 代码拉取完成"
}

# 构建应用
build_app() {
    echo "🔨 构建应用..."
    cd /tmp/\$SERVICE_NAME
    npm ci --only=production
    npm run build
    echo "✅ 应用构建完成"
}

# 部署应用
deploy_app() {
    echo "📤 部署应用到生产环境..."
    sudo rm -rf "/var/www/\$SERVICE_NAME"
    sudo cp -r "/tmp/\$SERVICE_NAME" "/var/www/\$SERVICE_NAME"
    sudo chown -R www-data:www-data "/var/www/\$SERVICE_NAME"
    echo "✅ 应用部署完成"
}

# 配置Nginx
configure_nginx() {
    echo "⚙️ 配置Nginx..."
    sudo tee /etc/nginx/sites-available/\$SERVICE_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    root /var/www/$SERVICE_NAME/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # SSL配置
    # SSL证书配置请在生产环境中添加
}
EOF

    sudo ln -sf /etc/nginx/sites-available/\$SERVICE_NAME /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx配置完成"
}

# 健康检查
health_check() {
    echo "🏥 执行健康检查..."
    sleep 5

    if curl -f "http://\$DOMAIN/health" > /dev/null 2>&1; then
        echo "✅ 服务健康检查通过"
        return 0
    else
        echo "❌ 服务健康检查失败"
        return 1
    fi
}

# 清理临时文件
cleanup() {
    echo "🧹 清理临时文件..."
    rm -rf /tmp/\$SERVICE_NAME
    echo "✅ 清理完成"
}

# 主执行流程
main() {
    echo "=== YYC³ M4智能部署脚本执行开始 ==="

    check_requirements
    create_backup
    pull_code
    build_app
    deploy_app
    configure_nginx

    if health_check; then
        echo "🎉 部署成功完成！"
        echo "🌐 访问地址: http://\$DOMAIN"
    else
        echo "❌ 部署失败，请检查错误日志"
        exit 1
    fi

    cleanup
    echo "=== 部署脚本执行结束 ==="
}

# 错误处理
trap 'echo "❌ 部署过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@"
#!/bin/bash
# 自动生成的Web应用部署脚本
# YYC³ M4智能脚本生成器 - __TIMESTAMP__

set -e

# 配置变量
SERVICE_NAME="__SERVICE_NAME__"
PORT="__PORT__"
DOMAIN="__DOMAIN__"
ENVIRONMENT="__ENVIRONMENT__"
BACKUP_PATH="__BACKUP_PATH__"
DEPLOY_USER="__DEPLOY_USER__"
GIT_REPO="__GIT_REPO__"

echo "🚀 开始部署 $SERVICE_NAME 到 $ENVIRONMENT 环境..."

# 检查必要工具
check_requirements() {
    local tools=("git" "npm" "nginx")
    for tool in "\${tools[@]}"; do
        if ! command -v \$tool &> /dev/null; then
            echo "❌ 工具 \$tool 未安装"
            exit 1
        fi
    done
    echo "✅ 环境检查通过"
}

# 创建备份
create_backup() {
    if [ -d "/var/www/\$SERVICE_NAME" ]; then
        echo "💾 创建应用备份..."
        mkdir -p \$BACKUP_PATH
        sudo cp -r "/var/www/\$SERVICE_NAME" "\$BACKUP_PATH/\$(date +%Y%m%d_%H%M%S)"
        echo "✅ 备份创建完成"
    fi
}

# 拉取代码
pull_code() {
    echo "📥 拉取最新代码..."
    if [ ! -d "/tmp/\$SERVICE_NAME" ]; then
        git clone \$GIT_REPO /tmp/\$SERVICE_NAME
    else
        cd /tmp/\$SERVICE_NAME
        git pull origin main
    fi
    echo "✅ 代码拉取完成"
}

# 构建应用
build_app() {
    echo "🔨 构建应用..."
    cd /tmp/\$SERVICE_NAME
    npm ci --only=production
    npm run build
    echo "✅ 应用构建完成"
}

# 部署应用
deploy_app() {
    echo "📤 部署应用到生产环境..."
    sudo rm -rf "/var/www/\$SERVICE_NAME"
    sudo cp -r "/tmp/\$SERVICE_NAME" "/var/www/\$SERVICE_NAME"
    sudo chown -R www-data:www-data "/var/www/\$SERVICE_NAME"
    echo "✅ 应用部署完成"
}

# 配置Nginx
configure_nginx() {
    echo "⚙️ 配置Nginx..."
    sudo tee /etc/nginx/sites-available/\$SERVICE_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name __DOMAIN__;

    root /var/www/__SERVICE_NAME__/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:__PORT__;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
__SSL_CONFIG__
}
EOF

    sudo ln -sf /etc/nginx/sites-available/\$SERVICE_NAME /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx配置完成"
}

# 健康检查
health_check() {
    echo "🏥 执行健康检查..."
    sleep 5

    if curl -f "http://\$DOMAIN/health" > /dev/null 2>&1; then
        echo "✅ 服务健康检查通过"
        return 0
    else
        echo "❌ 服务健康检查失败"
        return 1
    fi
}

# 清理临时文件
cleanup() {
    echo "🧹 清理临时文件..."
    rm -rf /tmp/\$SERVICE_NAME
    echo "✅ 清理完成"
}

# 主执行流程
main() {
    echo "=== YYC³ M4智能部署脚本执行开始 ==="

    check_requirements
    create_backup
    pull_code
    build_app
    deploy_app
    configure_nginx

    if health_check; then
        echo "🎉 部署成功完成！"
        echo "🌐 访问地址: http://\$DOMAIN"
    else
        echo "❌ 部署失败，请检查错误日志"
        exit 1
    fi

    cleanup
    echo "=== 部署脚本执行结束 ==="
}

# 错误处理
trap 'echo "❌ 部署过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@"
`,

    // API服务模板
    api_service: `
# M4 API服务生成模板
divert(-1)
define(\`__SERVICE_NAME__', \`${SERVICE_NAME}\')dnl
define(\`__API_VERSION__', \`${API_VERSION}\')dnl
define(\`__DATABASE_TYPE__', \`${DATABASE_TYPE}\')dnl
define(\`__AUTH_METHOD__', \`${AUTH_METHOD}\')dnl
divert(0)dnl
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || __API_VERSION__;

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json());

// API路由
app.get('/api/v1/health', (req, res) => {
    res.json({
        service: '__SERVICE_NAME__',
        status: 'healthy',
        version: '__API_VERSION__',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/info', (req, res) => {
    res.json({
        name: '__SERVICE_NAME__',
        version: '__API_VERSION__',
        database: '__DATABASE_TYPE__',
        auth: '__AUTH_METHOD__'
    });
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 __SERVICE_NAME__ API服务已启动');
    console.log('📡 端口: ' + PORT);
    console.log('🏥 健康检查: http://localhost:' + PORT + '/api/v1/health');
});
`,

    // Docker容器模板
    docker_container: `
# M4 Docker容器生成模板
divert(-1)
define(\`__IMAGE_NAME__', \`${IMAGE_NAME}\')dnl
define(\`__CONTAINER_NAME__', \`${CONTAINER_NAME}\')dnl
define(\`__EXPOSED_PORT__', \`${EXPOSED_PORT}\')dnl
define(\`__ENVIRONMENT__', \`${ENVIRONMENT}\')dnl
divert(0)dnl
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置权限
USER nodejs

# 暴露端口
EXPOSE __EXPOSED_PORT__

# 环境变量
ENV NODE_ENV=__ENVIRONMENT__

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:__EXPOSED_PORT__/health || exit 1

# 启动命令
CMD ["node", "server.js"]
`,

    // 数据库迁移模板
    database_migration: `
# M4 数据库迁移模板
divert(-1)
define(\`__DB_NAME__', \`${DB_NAME}\')dnl
define(\`__DB_TYPE__', \`${DB_TYPE}\')dnl
define(\`__MIGRATION_VERSION__', \`${MIGRATION_VERSION}\')dnl
divert(0)dnl
#!/bin/bash
# 数据库迁移脚本
# YYC³ M4智能脚本生成器

set -e

DB_NAME="__DB_NAME__"
DB_TYPE="__DB_TYPE__"
MIGRATION_VERSION="__MIGRATION_VERSION__"

echo "🔄 开始执行 $DB_NAME 数据库迁移 v$MIGRATION_VERSION"

# 创建备份
create_backup() {
    echo "💾 创建数据库备份..."
    case $DB_TYPE in
        "postgresql")
            pg_dump $DB_NAME > backups/\${DB_NAME}_\$(date +%Y%m%d_%H%M%S).sql
            ;;
        "mysql")
            mysqldump $DB_NAME > backups/\${DB_NAME}_\$(date +%Y%m%d_%H%M%S).sql
            ;;
    esac
    echo "✅ 备份创建完成"
}

# 执行迁移
run_migration() {
    echo "🚀 执行迁移脚本..."
    # 这里添加具体的迁移逻辑
    echo "✅ 迁移执行完成"
}

main() {
    create_backup
    run_migration
    echo "🎉 数据库迁移完成"
}

main "$@"
`,

    // 监控脚本模板
    monitoring_script: `
# M4 监控脚本模板
divert(-1)
define(\`__SERVICE_NAME__', \`${SERVICE_NAME}\')dnl
define(\`__CHECK_INTERVAL__', \`${CHECK_INTERVAL}\')dnl
define(\`__ALERT_EMAIL__', \`${ALERT_EMAIL}\')dnl
define(\`__HEALTH_ENDPOINT__', \`${HEALTH_ENDPOINT}\')dnl
divert(0)dnl
#!/bin/bash
# 服务监控脚本
# YYC³ M4智能脚本生成器

SERVICE_NAME="__SERVICE_NAME__"
CHECK_INTERVAL=__CHECK_INTERVAL__
ALERT_EMAIL="__ALERT_EMAIL__"
HEALTH_ENDPOINT="__HEALTH_ENDPOINT__"

echo "👁️ 启动 $SERVICE_NAME 服务监控..."

monitor_service() {
    while true; do
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

        if curl -f -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            echo "✅ [$TIMESTAMP] $SERVICE_NAME 服务正常"
        else
            echo "❌ [$TIMESTAMP] $SERVICE_NAME 服务异常"
            echo "🚨 服务 $SERVICE_NAME 健康检查失败，请立即检查！" | mail -s "🚨 $SERVICE_NAME 服务告警" "$ALERT_EMAIL"
        fi

        sleep $CHECK_INTERVAL
    done
}

monitor_service
`
};

// 动态M4处理器类
class M4Processor {
    constructor() {
        this.templateCache = new Map();
        this.generationStats = {
            totalGenerated: 0,
            templateUsage: {},
            lastGenerated: null
        };
    }

    // 处理M4模板并生成脚本
    processTemplate(templateName, variables = {}) {
        try {
            const template = M4_TEMPLATES[templateName];
            if (!template) {
                throw new Error(`模板 ${templateName} 不存在`);
            }

            let processedContent = template;

            // 添加时间戳
            processedContent = processedContent.replace(/__TIMESTAMP__/g, new Date().toISOString());

            // 替换变量
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`__${key}__`, 'g');
                processedContent = processedContent.replace(regex, value);
            }

            // 处理条件M4宏
            processedContent = this.processM4Macros(processedContent, variables);

            // 更新统计
            this.generationStats.totalGenerated++;
            this.generationStats.templateUsage[templateName] =
                (this.generationStats.templateUsage[templateName] || 0) + 1;
            this.generationStats.lastGenerated = new Date().toISOString();

            return {
                success: true,
                content: processedContent,
                templateName,
                variables,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                templateName,
                variables,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 处理M4宏
    processM4Macros(content, variables) {
        // 处理ifdef宏
        content = content.replace(/ifdef\('__([A-Z_]+)__',\s*`([^`]*)',\s*`([^`]*)'\)dnl/g,
            (match, varName, trueContent, falseContent) => {
                return variables[varName.toLowerCase()] ? trueContent : falseContent;
            });

        // 处理简单的define宏
        content = content.replace(/define\(`__([A-Z_]+)__',\s*`([^`]*)'\)dnl/g,
            (match, varName, value) => {
                return variables[varName.toLowerCase()] || value;
            });

        // 移除divert宏
        content = content.replace(/divert\(-?\d+\)dnl/g, '');
        content = content.replace(/divert\(0\)dnl/g, '');

        return content;
    }

    // 保存生成的脚本
    saveScript(content, filename, outputPath = './generated') {
        try {
            const fullPath = join(outputPath, filename);

            // 确保输出目录存在
            if (!existsSync(outputPath)) {
                require('fs').mkdirSync(outputPath, { recursive: true });
            }

            writeFileSync(fullPath, content, 'utf8');

            return {
                success: true,
                path: fullPath,
                size: Buffer.byteLength(content, 'utf8'),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 获取模板列表
    getTemplateList() {
        return Object.keys(M4_TEMPLATES).map(name => ({
            name,
            description: this.getTemplateDescription(name),
            category: this.getTemplateCategory(name)
        }));
    }

    getTemplateDescription(name) {
        const descriptions = {
            web_deployment: "Web应用部署脚本模板",
            api_service: "API服务生成模板",
            docker_container: "Docker容器生成模板",
            database_migration: "数据库迁移脚本模板",
            monitoring_script: "监控脚本模板"
        };
        return descriptions[name] || "未定义描述";
    }

    getTemplateCategory(name) {
        const categories = {
            web_deployment: "部署",
            api_service: "API",
            docker_container: "容器化",
            database_migration: "数据库",
            monitoring_script: "监控"
        };
        return categories[name] || "其他";
    }

    // 获取生成统计
    getStats() {
        return {
            ...this.generationStats,
            availableTemplates: Object.keys(M4_TEMPLATES).length
        };
    }

    // 验证变量
    validateVariables(templateName, variables) {
        const requiredVars = this.getRequiredVariables(templateName);
        const missing = [];

        for (const varName of requiredVars) {
            if (!(varName in variables)) {
                missing.push(varName);
            }
        }

        return {
            valid: missing.length === 0,
            missing,
            required: requiredVars
        };
    }

    getRequiredVariables(templateName) {
        const requirements = {
            web_deployment: ['SERVICE_NAME', 'PORT', 'DOMAIN', 'ENVIRONMENT'],
            api_service: ['SERVICE_NAME', 'API_VERSION', 'DATABASE_TYPE'],
            docker_container: ['IMAGE_NAME', 'CONTAINER_NAME', 'EXPOSED_PORT'],
            database_migration: ['DB_NAME', 'DB_TYPE', 'MIGRATION_VERSION'],
            monitoring_script: ['SERVICE_NAME', 'CHECK_INTERVAL', 'HEALTH_ENDPOINT']
        };
        return requirements[templateName] || [];
    }
}

// 创建M4处理器实例
const m4Processor = new M4Processor();

// 启动服务器
const server = serve({
    port: PORT,
    routes: {
        "/": () => new Response(readFileSync(join(import.meta.dir, "m4-dashboard.html")), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
        }),

        "/styles.css": () => new Response(readFileSync(join(import.meta.dir, "m4-styles.css")), {
            headers: { "Content-Type": "text/css" }
        }),

        "/app.js": () => new Response(readFileSync(join(import.meta.dir, "m4-app.js")), {
            headers: { "Content-Type": "application/javascript" }
        }),

        // API路由
        "/api/templates": () => new Response(JSON.stringify(m4Processor.getTemplateList()), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        }),

        "/api/stats": () => new Response(JSON.stringify(m4Processor.getStats()), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        }),

        "/api/generate": async (request) => {
            try {
                const body = await request.json();
                const { templateName, variables, filename, outputPath } = body;

                // 验证变量
                const validation = m4Processor.validateVariables(templateName, variables);
                if (!validation.valid) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: `缺少必要变量: ${validation.missing.join(', ')}`,
                        validation
                    }), {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    });
                }

                // 处理模板
                const result = m4Processor.processTemplate(templateName, variables);

                if (!result.success) {
                    return new Response(JSON.stringify(result), {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    });
                }

                // 如果需要保存文件
                if (filename) {
                    const saveResult = m4Processor.saveScript(result.content, filename, outputPath);
                    result.saved = saveResult;
                }

                return new Response(JSON.stringify(result), {
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                });
            }
        },

        "/api/validate": async (request) => {
            try {
                const body = await request.json();
                const { templateName, variables } = body;

                const validation = m4Processor.validateVariables(templateName, variables);

                return new Response(JSON.stringify({
                    success: true,
                    validation,
                    templateInfo: {
                        name: templateName,
                        description: m4Processor.getTemplateDescription(templateName),
                        category: m4Processor.getTemplateCategory(templateName)
                    }
                }), {
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                });
            }
        },

        "/api/health": () => new Response(JSON.stringify({
            status: "healthy",
            service: "M4智能脚本生成器",
            port: PORT,
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            stats: m4Processor.getStats()
        }), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        })
    }
});

console.log(`\n🚀 M4智能脚本生成器已启动！`);
console.log(`📡 访问地址: http://localhost:${PORT}`);
console.log(`⚡ M4模板处理引擎已就绪`);
console.log(`📧 技术支持: admin@0379.email`);
console.log(`🎯 言启象限，语枢智能 - YYC³ AI Family\n`);