#!/usr/bin/env node

/**
 * YYC³ 智能脚本生成和管理系统 - 核心引擎
 * 版本: v1.0.0
 * 创建时间: 2025-12-08
 * 维护团队: YYC3 AI Family
 */

const express = require('express');
const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');
const chalk = require('chalk') || console.log;
const ora = require('ora') || console.log;

class SmartScriptGenerator {
    constructor() {
        this.config = {
            port: process.env.PORT || 9000,
            wwwDir: '/Users/yanyu/www',
            workspaceDir: '/Users/yanyu/yyc3-workspace',
            nasMount: '/Volumes/NAS-YYC3',
            logDir: './logs',
            scriptsDir: './scripts/generated',
            templatesDir: './templates',
            tempDir: './temp'
        };

        this.app = express();
        this.services = new Map();
        this.scripts = new Map();
        this.deployments = new Map();
        this.cronJobs = new Map();

        this.initializeSystem();
    }

    async initializeSystem() {
        console.log(chalk.cyan('🚀 初始化YYC³智能脚本生成系统...'));

        // 创建必要目录
        await this.ensureDirectories();

        // 加载配置
        await this.loadConfiguration();

        // 设置Express应用
        this.setupExpress();

        // 初始化服务管理器
        this.initializeServiceManager();

        console.log(chalk.green('✅ 系统初始化完成'));
    }

    async ensureDirectories() {
        const dirs = [
            this.config.logDir,
            this.config.scriptsDir,
            this.config.templatesDir,
            this.config.tempDir,
            path.join(this.config.scriptsDir, 'deployments'),
            path.join(this.config.scriptsDir, 'monitoring'),
            path.join(this.config.scriptsDir, 'backups'),
            path.join(this.config.scriptsDir, 'utilities')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    setupExpress() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));

        // API路由
        this.app.get('/api/health', this.healthCheck.bind(this));
        this.app.get('/api/services', this.listServices.bind(this));
        this.app.post('/api/services', this.createService.bind(this));
        this.app.get('/api/services/:id', this.getService.bind(this));
        this.app.put('/api/services/:id', this.updateService.bind(this));
        this.app.delete('/api/services/:id', this.deleteService.bind(this));

        // 脚本管理API
        this.app.post('/api/scripts/generate', this.generateScript.bind(this));
        this.app.get('/api/scripts/:id', this.getScript.bind(this));
        this.app.put('/api/scripts/:id', this.updateScript.bind(this));
        this.app.post('/api/scripts/:id/execute', this.executeScript.bind(this));

        // 部署管理API
        this.app.post('/api/deploy', this.deployApplication.bind(this));
        this.app.post('/api/deploy/:id/rollback', this.rollbackDeployment.bind(this));
        this.app.get('/api/deploy/status', this.getDeploymentStatus.bind(this));

        // 监控管理API
        this.app.get('/api/monitor/apps', this.getApplicationsStatus.bind(this));
        this.app.get('/api/monitor/servers', this.getServersStatus.bind(this));
        this.app.get('/api/alerts', this.getAlerts.bind(this));
        this.app.post('/api/alerts/acknowledge', this.acknowledgeAlert.bind(this));

        // Web管理界面路由
        this.app.get('/', this.renderDashboard.bind(this));
        this.app.get('/services', this.renderServices.bind(this));
        this.app.get('/scripts', this.renderScripts.bind(this));
        this.app.get('/deployments', this.renderDeployments.bind(this));
        this.app.get('/monitoring', this.renderMonitoring.bind(this));
    }

    // 服务管理核心方法
    async createService(req, res) {
        try {
            const serviceConfig = req.body;

            // 验证配置
            if (!this.validateServiceConfig(serviceConfig)) {
                return res.status(400).json({ error: '服务配置无效' });
            }

            // 生成服务ID
            const serviceId = this.generateId();
            serviceConfig.id = serviceId;
            serviceConfig.createdAt = new Date().toISOString();

            // 存储服务配置
            this.services.set(serviceId, serviceConfig);

            // 生成标准脚本
            await this.generateServiceScripts(serviceConfig);

            console.log(chalk.green(`✅ 创建服务: ${serviceConfig.name} (${serviceId})`));

            res.json({
                success: true,
                service: serviceConfig,
                scripts: await this.getServiceScripts(serviceId)
            });
        } catch (error) {
            console.error(chalk.red('创建服务失败:'), error);
            res.status(500).json({ error: error.message });
        }
    }

    async generateServiceScripts(serviceConfig) {
        const scripts = {
            deployment: await this.generateDeploymentScript(serviceConfig),
            monitoring: await this.generateMonitoringScript(serviceConfig),
            backup: await this.generateBackupScript(serviceConfig),
            startup: await this.generateStartupScript(serviceConfig),
            health: await this.generateHealthCheckScript(serviceConfig)
        };

        // 保存脚本到文件
        for (const [type, content] of Object.entries(scripts)) {
            const scriptPath = path.join(
                this.config.scriptsDir,
                type,
                `${serviceConfig.name}_${type}.sh`
            );
            await fs.writeFile(scriptPath, content, 'utf8');
            await fs.chmod(scriptPath, '755');
        }

        this.scripts.set(serviceConfig.id, scripts);
        return scripts;
    }

    async generateDeploymentScript(serviceConfig) {
        const template = `#!/bin/bash
# 自动生成的部署脚本 - ${serviceConfig.name}
# 创建时间: ${new Date().toISOString()}
# 服务ID: ${serviceConfig.id}

set -e

# 配置变量
APP_NAME="${serviceConfig.name}"
SERVICE_ID="${serviceConfig.id}"
VERSION="${serviceConfig.version || '1.0.0'}"
REPO_URL="${serviceConfig.repository || ''}"
BRANCH="${serviceConfig.branch || 'main'}"

# 服务器配置
${serviceConfig.servers ? serviceConfig.servers.map(server => `
# ${server.name} 服务器
${server.name.toUpperCase()}_HOST="${server.host}"
${server.name.toUpperCase()}_PATH="${server.path}"
${server.name.toUpperCase()}_USER="${server.user || 'deploy'}"
`).join('\n') : ''}

echo "🚀 开始部署 $APP_NAME v$VERSION..."

# 函数：部署到指定服务器
deploy_to_server() {
    local server_name=\$1
    local server_host=\$(eval echo \$\${server_name^^}_HOST)
    local server_path=\$(eval echo \$\${server_name^^}_PATH)
    local server_user=\$(eval echo \$\${server_name^^}_USER)

    echo "📡 部署到 $server_name ($server_host)..."

    # 检查服务器连接
    ssh -o ConnectTimeout=10 \$server_user@\$server_host "echo '✅ 服务器连接成功'"

    # 创建备份
    echo "💾 创建备份..."
    ssh \$server_user@\$server_host "sudo mkdir -p /var/backups/\$APP_NAME && sudo cp -r \$server_path /var/backups/\$APP_NAME/\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

    # 如果有代码仓库，拉取最新代码
    if [ ! -z "\$REPO_URL" ]; then
        echo "📥 拉取最新代码..."
        if [ ! -d "temp_\$APP_NAME" ]; then
            git clone \$REPO_URL temp_\$APP_NAME
        fi
        cd temp_\$APP_NAME
        git pull origin \$BRANCH
        cd ..
    fi

    # 构建应用（根据类型）
    ${this.generateBuildCommands(serviceConfig)}

    # 上传文件
    echo "📤 上传文件到服务器..."
    ${serviceConfig.type === 'web' ? 'rsync -avz --delete dist/ build/ public/' : 'rsync -avz --exclude=".git" --exclude="node_modules" ./'}
    \$server_user@\$server_host:\$server_path/

    # 重启服务
    echo "🔄 重启服务..."
    ${this.generateRestartCommands(serviceConfig)}

    # 健康检查
    echo "🏥 执行健康检查..."
    sleep 5
    ${this.generateHealthCheckCommands(serviceConfig)}

    echo "✅ $server_name 部署完成！"
}

# 部署到所有配置的服务器
${serviceConfig.servers ? serviceConfig.servers.map(server => `deploy_to_server "${server.name}"`).join('\n') : 'echo "⚠️ 未配置部署服务器"'}

echo "🎉 $APP_NAME 部署完成！"
echo "📊 部署报告："
echo "   - 应用名称: $APP_NAME"
echo "   - 版本: $VERSION"
echo "   - 部署时间: $(date)"
echo "   - 服务器数量: ${serviceConfig.servers ? serviceConfig.servers.length : 0}
`;

        return template;
    }

    generateBuildCommands(serviceConfig) {
        switch (serviceConfig.type) {
            case 'web':
                return serviceConfig.framework === 'next'
                    ? 'npm run build'
                    : serviceConfig.framework === 'vue'
                    ? 'npm run build'
                    : 'npm run build';
            case 'api':
                return serviceConfig.runtime === 'node'
                    ? 'npm install --production'
                    : serviceConfig.runtime === 'python'
                    ? 'pip install -r requirements.txt'
                    : 'echo "跳过构建步骤"';
            default:
                return 'echo "跳过构建步骤"';
        }
    }

    generateRestartCommands(serviceConfig) {
        const servers = serviceConfig.servers || [];
        return servers.map(server => {
            return `ssh ${server.user || 'deploy'}@${server.host} "cd ${server.path} && ${
                serviceConfig.type === 'web'
                    ? 'pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js'
                    : serviceConfig.type === 'api'
                    ? 'pm2 restart api.service || pm2 start api.service'
                    : 'systemctl restart ' + serviceConfig.name
            }"`;
        }).join('\n    ');
    }

    generateHealthCheckCommands(serviceConfig) {
        const servers = serviceConfig.servers || [];
        return servers.map(server => {
            const protocol = server.ssl ? 'https' : 'http';
            const port = server.port || (serviceConfig.type === 'web' ? 80 : 3000);
            return `curl -f ${protocol}://${server.host}:${port}/health || exit 1`;
        }).join('\n    ');
    }

    async generateMonitoringScript(serviceConfig) {
        const script = `#!/bin/bash
# 自动生成的监控脚本 - ${serviceConfig.name}
# 创建时间: ${new Date().toISOString()}

APP_NAME="${serviceConfig.name}"
SERVICE_ID="${serviceConfig.id}"

# 监控配置
${serviceConfig.servers ? serviceConfig.servers.map(server => `
# ${server.name} 监控
${server.name.toUpperCase()}_URL="${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}"
`).join('\n') : ''}

ALERT_EMAIL="${serviceConfig.monitoring?.alertEmail || 'admin@0379.email'}"
CHECK_INTERVAL=30

echo "🔍 启动 $APP_NAME 监控服务..."
echo "📧 告警邮箱: $ALERT_EMAIL"
echo "⏰ 检查间隔: ${CHECK_INTERVAL}秒"

while true; do
    ${serviceConfig.servers ? serviceConfig.servers.map(server => `
    # 检查 ${server.name}
    if curl -f -s --max-time 10 ${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}/health >/dev/null 2>&1; then
        echo "✅ ${server.name} 健康检查通过 $(date)"
    else
        echo "❌ ${server.name} 健康检查失败 $(date)"
        echo "🚨 发送告警邮件..."
        echo "应用 $APP_NAME (${server.name}) 健康检查失败，请立即检查！\\n\\n检查时间: $(date)\\n检查URL: ${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}/health" | mail -s "🚨 $APP_NAME 健康检查告警" $ALERT_EMAIL
    fi
    `).join('\n    ') : 'echo "⚠️ 未配置监控服务器"'}

    sleep $CHECK_INTERVAL
done
`;
        return script;
    }

    async generateBackupScript(serviceConfig) {
        const script = `#!/bin/bash
# 自动生成的备份脚本 - ${serviceConfig.name}
# 创建时间: ${new Date().toISOString()}

APP_NAME="${serviceConfig.name}"
SERVICE_ID="${serviceConfig.id}"
BACKUP_ROOT="/var/backups"
RETENTION_DAYS=${serviceConfig.backup?.retentionDays || 7}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$APP_NAME/$TIMESTAMP"

echo "💾 开始备份 $APP_NAME..."

# 创建备份目录
${serviceConfig.servers ? serviceConfig.servers.map(server => `
# 备份 ${server.name}
echo "📦 备份 ${server.name}..."
ssh ${server.user || 'deploy'}@${server.host} "mkdir -p $BACKUP_DIR && rsync -av ${server.path}/ $BACKUP_DIR/app/"`).join('\n') : ''}

# 备份数据库（如果有配置）
${serviceConfig.database ? `
echo "🗄️ 备份数据库..."
${serviceConfig.database.postgresql ? `ssh ${serviceConfig.servers[0]?.user || 'deploy'}@${serviceConfig.servers[0]?.host} "pg_dump ${serviceConfig.database.postgresql.database} > $BACKUP_DIR/database.sql"` : ''}
${serviceConfig.database.mysql ? `ssh ${serviceConfig.servers[0]?.user || 'deploy'}@${serviceConfig.servers[0]?.host} "mysqldump ${serviceConfig.database.mysql.database} > $BACKUP_DIR/database.sql"` : ''}
${serviceConfig.database.redis ? `ssh ${serviceConfig.servers[0]?.user || 'deploy'}@${serviceConfig.servers[0]?.host} "redis-cli BGSAVE && cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis.rdb"` : ''}
` : ''}

# 备份配置文件
${serviceConfig.servers ? serviceConfig.servers.map(server => `
echo "⚙️ 备份 ${server.name} 配置文件..."
ssh ${server.user || 'deploy'}@${server.host} "mkdir -p $BACKUP_DIR/config && cp -r ${server.path}/.env* $BACKUP_DIR/config/ 2>/dev/null || true"`).join('\n') : ''}

# 清理过期备份
echo "🧹 清理过期备份..."
${serviceConfig.servers ? serviceConfig.servers.map(server => `
ssh ${server.user || 'deploy'}@${server.host} "find $BACKUP_ROOT -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true"`).join('\n') : ''}

echo "✅ 备份完成: $BACKUP_DIR"
echo "📊 备份信息："
echo "   - 应用名称: $APP_NAME"
echo "   - 备份时间: $(date)"
echo "   - 保留天数: $RETENTION_DAYS"
`;
        return script;
    }

    async generateStartupScript(serviceConfig) {
        const script = `#!/bin/bash
# 自动生成的启动脚本 - ${serviceConfig.name}
# 创建时间: ${new Date().toISOString()}

APP_NAME="${serviceConfig.name}"
SERVICE_ID="${serviceConfig.id}"
VERSION="${serviceConfig.version || '1.0.0'}"

echo "🚀 启动 $APP_NAME v$VERSION..."

# 检查环境
${serviceConfig.type === 'api' ? `
# API服务环境检查
echo "🔍 检查API服务环境..."
${serviceConfig.database ? `
# 数据库连接检查
${serviceConfig.database.postgresql ? `
echo "📊 检查PostgreSQL连接..."
pg_isready -h ${serviceConfig.database.postgresql.host} -p ${serviceConfig.database.postgresql.port} || {
    echo "❌ PostgreSQL连接失败"
    exit 1
}
` : ''}
${serviceConfig.database.redis ? `
echo "🔴 检查Redis连接..."
redis-cli -h ${serviceConfig.database.redis.host} -p ${serviceConfig.database.redis.port} ping || {
    echo "❌ Redis连接失败"
    exit 1
}
` : ''}
` : ''}
` : ''}

# 启动应用
${this.generateStartCommands(serviceConfig)}

echo "✅ $APP_NAME 启动成功！"
echo "📊 服务信息："
echo "   - 应用名称: $APP_NAME"
echo "   - 版本: $VERSION"
echo "   - 启动时间: $(date)"
${serviceConfig.servers ? serviceConfig.servers.map(server => `echo "   - ${server.name}: ${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}"`).join('\n') : ''}
`;
        return script;
    }

    generateStartCommands(serviceConfig) {
        switch (serviceConfig.type) {
            case 'web':
                return serviceConfig.framework === 'next'
                    ? `npm run dev`
                    : `npm start`;
            case 'api':
                return serviceConfig.runtime === 'node'
                    ? `NODE_ENV=production node server.js`
                    : serviceConfig.runtime === 'python'
                    ? `gunicorn app:app --bind 0.0.0.0:3000`
                    : `npm start`;
            default:
                return `npm start`;
        }
    }

    async generateHealthCheckScript(serviceConfig) {
        const script = `#!/bin/bash
# 自动生成的健康检查脚本 - ${serviceConfig.name}
# 创建时间: ${new Date().toISOString()}

APP_NAME="${serviceConfig.name}"
SERVICE_ID="${serviceConfig.id}"

echo "🏥 执行 $APP_NAME 健康检查..."

# 检查进程
if pgrep -f "$APP_NAME" > /dev/null; then
    echo "✅ 进程运行正常"
else
    echo "❌ 进程未运行"
    exit 1
fi

# 检查端口
${serviceConfig.servers ? serviceConfig.servers.map(server => `
# 检查 ${server.name} 端口 ${server.port || 80}
if lsof -i :${server.port || 80} > /dev/null 2>&1; then
    echo "✅ ${server.name} 端口 ${server.port || 80} 正常"
else
    echo "❌ ${server.name} 端口 ${server.port || 80} 未监听"
    exit 1
fi`).join('\n') : ''}

# HTTP健康检查
${serviceConfig.servers ? serviceConfig.servers.map(server => `
# HTTP检查 ${server.name}
if curl -f -s --max-time 10 ${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}/health >/dev/null 2>&1; then
    echo "✅ ${server.name} HTTP健康检查通过"
else
    echo "❌ ${server.name} HTTP健康检查失败"
    exit 1
fi`).join('\n') : ''}

# 数据库连接检查
${serviceConfig.database ? `
${serviceConfig.database.postgresql ? `
# PostgreSQL检查
if pg_isready -h ${serviceConfig.database.postgresql.host} -p ${serviceConfig.database.postgresql.port}; then
    echo "✅ PostgreSQL连接正常"
else
    echo "❌ PostgreSQL连接失败"
    exit 1
fi
` : ''}
${serviceConfig.database.redis ? `
# Redis检查
if redis-cli -h ${serviceConfig.database.redis.host} -p ${serviceConfig.database.redis.port} ping | grep -q PONG; then
    echo "✅ Redis连接正常"
else
    echo "❌ Redis连接失败"
    exit 1
fi
` : ''}
` : ''}

echo "✅ $APP_NAME 健康检查全部通过！"
`;
        return script;
    }

    // 验证服务配置
    validateServiceConfig(config) {
        const required = ['name', 'type'];
        for (const field of required) {
            if (!config[field]) {
                console.error(chalk.red(`缺少必需字段: ${field}`));
                return false;
            }
        }

        const validTypes = ['web', 'api', 'database', 'service'];
        if (!validTypes.includes(config.type)) {
            console.error(chalk.red(`无效的服务类型: ${config.type}`));
            return false;
        }

        return true;
    }

    // 生成唯一ID
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    // API路由处理器
    async healthCheck(req, res) {
        res.json({
            status: 'ok',
            service: 'YYC3 Smart Script Generator',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            services: {
                total: this.services.size,
                running: this.getRunningServicesCount(),
                deployed: this.getDeployedServicesCount()
            }
        });
    }

    async listServices(req, res) {
        const services = Array.from(this.services.values());
        res.json({ services });
    }

    async getService(req, res) {
        const { id } = req.params;
        const service = this.services.get(id);

        if (!service) {
            return res.status(404).json({ error: '服务不存在' });
        }

        const scripts = await this.getServiceScripts(id);
        res.json({ service, scripts });
    }

    async getServiceScripts(serviceId) {
        const scripts = this.scripts.get(serviceId);
        if (!scripts) return {};

        const result = {};
        for (const [type, content] of Object.entries(scripts)) {
            const scriptPath = path.join(this.config.scriptsDir, type, `${serviceId}_${type}.sh`);
            try {
                result[type] = {
                    path: scriptPath,
                    content: content,
                    exists: await fs.access(scriptPath).then(() => true).catch(() => false)
                };
            } catch (error) {
                result[type] = { path: scriptPath, content: '', exists: false };
            }
        }

        return result;
    }

    async updateService(req, res) {
        const { id } = req.params;
        const updates = req.body;

        const service = this.services.get(id);
        if (!service) {
            return res.status(404).json({ error: '服务不存在' });
        }

        // 更新服务配置
        Object.assign(service, updates);
        service.updatedAt = new Date().toISOString();

        // 重新生成脚本
        await this.generateServiceScripts(service);

        res.json({ success: true, service });
    }

    async deleteService(req, res) {
        const { id } = req.params;

        if (!this.services.has(id)) {
            return res.status(404).json({ error: '服务不存在' });
        }

        this.services.delete(id);
        this.scripts.delete(id);

        // 清理生成的脚本文件
        try {
            const scriptsPath = path.join(this.config.scriptsDir);
            const files = await fs.readdir(scriptsPath, { recursive: true });
            for (const file of files) {
                if (file.includes(id)) {
                    await fs.unlink(path.join(scriptsPath, file));
                }
            }
        } catch (error) {
            console.error(chalk.yellow('清理脚本文件时出错:'), error.message);
        }

        res.json({ success: true });
    }

    // 脚本执行API
    async executeScript(req, res) {
        const { id } = req.params;
        const { type, server, options = {} } = req.body;

        try {
            const service = this.services.get(id);
            if (!service) {
                return res.status(404).json({ error: '服务不存在' });
            }

            const scriptPath = path.join(this.config.scriptsDir, type, `${service.name}_${type}.sh`);

            // 执行脚本
            const result = await this.executeScriptFile(scriptPath, options);

            res.json({
                success: true,
                executionId: result.executionId,
                output: result.output,
                exitCode: result.exitCode
            });
        } catch (error) {
            console.error(chalk.red('脚本执行失败:'), error);
            res.status(500).json({ error: error.message });
        }
    }

    async executeScriptFile(scriptPath, options = {}) {
        const executionId = this.generateId();
        const logPath = path.join(this.config.logDir, `script_${executionId}.log`);

        return new Promise((resolve, reject) => {
            const args = options.dryRun ? ['-n'] : [];
            const child = spawn('bash', [scriptPath, ...args], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...options.env }
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                const fullOutput = output + (errorOutput ? '\nSTDERR:\n' + errorOutput : '');

                // 保存执行日志
                fs.writeFile(logPath, fullOutput).catch(err => {
                    console.error(chalk.yellow('保存执行日志失败:'), err.message);
                });

                resolve({
                    executionId,
                    output: fullOutput,
                    exitCode: code
                });
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    // 部署管理API
    async deployApplication(req, res) {
        const { appId, server, options = {} } = req.body;

        try {
            const service = this.services.get(appId);
            if (!service) {
                return res.status(404).json({ error: '服务不存在' });
            }

            const deploymentId = this.generateId();

            // 记录部署信息
            this.deployments.set(deploymentId, {
                id: deploymentId,
                appId,
                server,
                status: 'in_progress',
                startTime: new Date().toISOString(),
                options
            });

            // 执行部署脚本
            const scriptPath = path.join(this.config.scriptsDir, 'deployments', `${service.name}_deployment.sh`);
            const result = await this.executeScriptFile(scriptPath, {
                ...options,
                env: { DEPLOYMENT_ID: deploymentId, ...options.env }
            });

            // 更新部署状态
            const deployment = this.deployments.get(deploymentId);
            deployment.status = result.exitCode === 0 ? 'success' : 'failed';
            deployment.endTime = new Date().toISOString();
            deployment.output = result.output;

            res.json({
                success: result.exitCode === 0,
                deploymentId,
                deployment
            });
        } catch (error) {
            console.error(chalk.red('部署失败:'), error);
            res.status(500).json({ error: error.message });
        }
    }

    // Web界面渲染
    async renderDashboard(req, res) {
        const dashboardHtml = await this.generateDashboardHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(dashboardHtml);
    }

    async generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YYC³ 智能脚本管理系统</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #667eea; margin-bottom: 0.5rem; }
        .stat-card .value { font-size: 2rem; font-weight: bold; color: #333; }
        .services { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .services-header { background: #667eea; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .service-list { max-height: 400px; overflow-y: auto; }
        .service-item { padding: 1rem 1.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .service-item:last-child { border-bottom: none; }
        .service-name { font-weight: 600; color: #333; }
        .service-type { color: #666; font-size: 0.9rem; }
        .service-status { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .status-running { background: #d4edda; color: #155724; }
        .status-stopped { background: #f8d7da; color: #721c24; }
        .btn { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #5a6fd8; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 YYC³ 智能脚本管理系统</h1>
        <p>言启象限，语枢智能 - 应用级DevOps自动化平台</p>
    </div>

    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <h3>📊 总服务数</h3>
                <div class="value">${this.services.size}</div>
            </div>
            <div class="stat-card">
                <h3>✅ 运行中</h3>
                <div class="value">${this.getRunningServicesCount()}</div>
            </div>
            <div class="stat-card">
                <h3>🚀 已部署</h3>
                <div class="value">${this.getDeployedServicesCount()}</div>
            </div>
            <div class="stat-card">
                <h3>📜 生成脚本</h3>
                <div class="value">${this.scripts.size * 5}</div>
            </div>
        </div>

        <div class="services">
            <div class="services-header">
                <h2>🛠️ 服务管理</h2>
                <a href="/services" class="btn">管理服务</a>
            </div>
            <div class="service-list">
                ${Array.from(this.services.values()).map(service => `
                    <div class="service-item">
                        <div>
                            <div class="service-name">${service.name}</div>
                            <div class="service-type">${service.type} • v${service.version || '1.0.0'}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span class="service-status status-running">运行中</span>
                            <a href="/services/${service.id}" class="btn btn-secondary">详情</a>
                        </div>
                    </div>
                `).join('') || '<div class="service-item">暂无服务，<a href="/services">立即创建</a></div>'}
            </div>
        </div>
    </div>

    <script>
        // 定期更新状态
        setInterval(() => {
            fetch('/api/health')
                .then(response => response.json())
                .then(data => {
                    console.log('系统状态更新:', data);
                })
                .catch(error => console.error('状态更新失败:', error));
        }, 30000);
    </script>
</body>
</html>`;
    }

    // 辅助方法
    getRunningServicesCount() {
        // 这里应该实际检查服务运行状态
        return this.services.size;
    }

    getDeployedServicesCount() {
        return Array.from(this.services.values()).filter(s => s.servers && s.servers.length > 0).length;
    }

    initializeServiceManager() {
        console.log(chalk.blue('🔧 初始化服务管理器...'));

        // 初始化定时任务
        this.setupCronJobs();

        // 加载现有服务
        this.loadExistingServices();
    }

    setupCronJobs() {
        // 每5分钟检查服务健康状态
        const healthCheckJob = cron.schedule('*/5 * * * *', async () => {
            await this.performHealthChecks();
        }, { scheduled: false });

        this.cronJobs.set('healthCheck', healthCheckJob);
        healthCheckJob.start();

        // 每小时清理临时文件
        const cleanupJob = cron.schedule('0 * * * *', async () => {
            await this.performCleanup();
        }, { scheduled: false });

        this.cronJobs.set('cleanup', cleanupJob);
        cleanupJob.start();
    }

    async performHealthChecks() {
        console.log(chalk.blue('🏥 执行健康检查...'));

        for (const [id, service] of this.services) {
            try {
                await this.checkServiceHealth(service);
            } catch (error) {
                console.error(chalk.red(`健康检查失败 ${service.name}:`), error.message);
            }
        }
    }

    async checkServiceHealth(service) {
        if (!service.servers) return;

        for (const server of service.servers) {
            try {
                const response = await fetch(`${server.ssl ? 'https' : 'http'}://${server.host}:${server.port || 80}/health`, {
                    timeout: 5000
                });

                if (response.ok) {
                    console.log(chalk.green(`✅ ${service.name} (${server.name}) 健康检查通过`));
                } else {
                    console.log(chalk.yellow(`⚠️ ${service.name} (${server.name}) 健康检查异常: ${response.status}`));
                }
            } catch (error) {
                console.log(chalk.red(`❌ ${service.name} (${server.name}) 健康检查失败: ${error.message}`));
            }
        }
    }

    async performCleanup() {
        console.log(chalk.blue('🧹 执行清理任务...'));

        try {
            // 清理临时文件
            const tempFiles = await fs.readdir(this.config.tempDir);
            for (const file of tempFiles) {
                const filePath = path.join(this.config.tempDir, file);
                const stats = await fs.stat(filePath);

                // 删除超过1小时的临时文件
                if (Date.now() - stats.mtime.getTime() > 3600000) {
                    await fs.unlink(filePath);
                    console.log(chalk.gray(`删除临时文件: ${file}`));
                }
            }

            // 清理过期日志
            const logFiles = await fs.readdir(this.config.logDir);
            for (const file of logFiles) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.config.logDir, file);
                    const stats = await fs.stat(filePath);

                    // 删除超过7天的日志文件
                    if (Date.now() - stats.mtime.getTime() > 7 * 24 * 3600000) {
                        await fs.unlink(filePath);
                        console.log(chalk.gray(`删除过期日志: ${file}`));
                    }
                }
            }

            console.log(chalk.green('✅ 清理任务完成'));
        } catch (error) {
            console.error(chalk.red('清理任务失败:'), error.message);
        }
    }

    async loadExistingServices() {
        try {
            const servicesPath = path.join(this.config.scriptsDir, 'services.json');
            if (await fs.access(servicesPath).then(() => true).catch(() => false)) {
                const data = await fs.readFile(servicesPath, 'utf8');
                const services = JSON.parse(data);

                for (const service of services) {
                    this.services.set(service.id, service);
                }

                console.log(chalk.green(`✅ 加载了 ${services.length} 个现有服务`));
            }
        } catch (error) {
            console.error(chalk.yellow('加载现有服务失败:'), error.message);
        }
    }

    async loadConfiguration() {
        try {
            const configPath = './config.json';
            if (await fs.access(configPath).then(() => true).catch(() => false)) {
                const data = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(data);
                Object.assign(this.config, config);
                console.log(chalk.green('✅ 配置文件加载成功'));
            } else {
                // 创建默认配置文件
                await this.createDefaultConfig();
            }
        } catch (error) {
            console.error(chalk.red('配置文件加载失败:'), error.message);
        }
    }

    async createDefaultConfig() {
        const defaultConfig = {
            ...this.config,
            monitoring: {
                checkInterval: 300, // 5分钟
                alertEmail: 'admin@0379.email',
                slackWebhook: ''
            },
            backup: {
                retentionDays: 7,
                nasBackup: true,
                compression: true
            },
            security: {
                enableSSL: true,
                allowedIPs: ['127.0.0.1', '192.168.1.0/24'],
                apiKeyRequired: false
            }
        };

        await fs.writeFile('./config.json', JSON.stringify(defaultConfig, null, 2));
        console.log(chalk.green('✅ 默认配置文件创建成功'));
    }

    // 启动服务器
    start() {
        this.app.listen(this.config.port, '0.0.0.0', () => {
            console.log(chalk.green(`🚀 YYC³智能脚本生成系统已启动`));
            console.log(chalk.blue(`📊 管理界面: http://localhost:${this.config.port}`));
            console.log(chalk.blue(`🔌 API地址: http://localhost:${this.config.port}/api`));
            console.log(chalk.cyan('💡 使用 Ctrl+C 停止服务'));
        });
    }
}

// 启动应用
if (require.main === module) {
    const generator = new SmartScriptGenerator();
    generator.start().catch(error => {
        console.error(chalk.red('系统启动失败:'), error);
        process.exit(1);
    });
}

module.exports = SmartScriptGenerator;