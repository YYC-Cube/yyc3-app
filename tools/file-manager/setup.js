#!/usr/bin/env node

/**
 * YYC³智能文件管理系统 - 一键安装配置脚本
 * 创建时间：2025-12-08
 * 维护团队：YYC3 AI Family
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

class SetupManager {
    constructor() {
        this.configPath = path.join(__dirname, 'config.json');
        this.defaultConfig = {
            wwwDir: '/Users/yanyu/www',
            workspaceDir: '/Users/yanyu/yyc3-workspace',
            nasConfig: {
                host: '192.168.1.12',
                user: 'yanyu',
                mountPoint: '/Volumes/NAS-YYC3',
                remotePath: '/volume1/YYC3-Backup'
            },
            sync: {
                interval: '*/5 * * * *',
                excludePatterns: ['node_modules', '.git', '*.log', 'tmp'],
                maxBackupVersions: 10
            },
            cleanup: {
                tempFileAge: 7 * 24 * 60 * 60 * 1000,
                logFileAge: 30 * 24 * 60 * 60 * 1000,
                backupRetentionDays: 90
            },
            notifications: {
                enabled: true,
                email: '',
                webhook: ''
            }
        };
    }

    async run() {
        console.log(chalk.cyan('\n🚀 YYC³智能文件管理系统安装配置\n'));

        try {
            // 检查Node.js版本
            await this.checkNodeVersion();

            // 安装依赖
            await this.installDependencies();

            // 检查现有配置
            const hasConfig = await this.checkExistingConfig();

            // 配置向导
            const config = hasConfig ? 
                await this.loadExistingConfig() : 
                await this.configurationWizard();

            // 保存配置
            await this.saveConfig(config);

            // 创建必要目录
            await this.createDirectories(config);

            // 检查NAS连接
            await this.testNASConnection(config);

            // 设置开机自启
            await this.setupAutoStart();

            // 完成安装
            this.showCompletionMessage();

        } catch (error) {
            console.error(chalk.red('❌ 安装失败:', error.message));
            process.exit(1);
        }
    }

    async checkNodeVersion() {
        const spinner = ora('检查Node.js版本...').start();
        
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

        if (majorVersion < 14) {
            spinner.fail('需要Node.js 14或更高版本');
            throw new Error(`当前版本: ${nodeVersion}, 需要v14+`);
        }

        spinner.succeed(`Node.js版本检查通过 (${nodeVersion})`);
    }

    async installDependencies() {
        const spinner = ora('安装依赖包...').start();

        try {
            await exec('npm install --production');
            spinner.succeed('依赖包安装完成');
        } catch (error) {
            spinner.fail('依赖包安装失败');
            throw error;
        }
    }

    async checkExistingConfig() {
        try {
            await fs.access(this.configPath);
            return true;
        } catch {
            return false;
        }
    }

    async loadExistingConfig() {
        const spinner = ora('加载现有配置...').start();
        
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            spinner.succeed('配置加载完成');
            return config;
        } catch (error) {
            spinner.fail('配置文件损坏，将重新配置');
            return this.configurationWizard();
        }
    }

    async configurationWizard() {
        console.log(chalk.yellow('📝 配置向导 - 请根据实际情况设置\n'));

        const questions = [
            {
                type: 'input',
                name: 'wwwDir',
                message: 'WWW目录路径:',
                default: this.defaultConfig.wwwDir,
                validate: input => input.length > 0 || '请输入有效的路径'
            },
            {
                type: 'input',
                name: 'workspaceDir',
                message: '工作空间目录路径:',
                default: this.defaultConfig.workspaceDir,
                validate: input => input.length > 0 || '请输入有效的路径'
            },
            {
                type: 'confirm',
                name: 'useNAS',
                message: '是否使用NAS备份?',
                default: true
            },
            {
                type: 'input',
                name: 'nasHost',
                message: 'NAS服务器地址:',
                default: this.defaultConfig.nasConfig.host,
                when: (answers) => answers.useNAS
            },
            {
                type: 'input',
                name: 'nasUser',
                message: 'NAS用户名:',
                default: this.defaultConfig.nasConfig.user,
                when: (answers) => answers.useNAS
            },
            {
                type: 'input',
                name: 'nasMountPoint',
                message: 'NAS挂载点:',
                default: this.defaultConfig.nasConfig.mountPoint,
                when: (answers) => answers.useNAS
            },
            {
                type: 'list',
                name: 'syncInterval',
                message: '同步频率:',
                choices: [
                    { name: '每5分钟', value: '*/5 * * * *' },
                    { name: '每15分钟', value: '*/15 * * * *' },
                    { name: '每30分钟', value: '*/30 * * * *' },
                    { name: '每小时', value: '0 * * * *' },
                    { name: '手动同步', value: null }
                ],
                default: '*/5 * * * *'
            },
            {
                type: 'confirm',
                name: 'autoCleanup',
                message: '是否启用自动清理?',
                default: true
            },
            {
                type: 'confirm',
                name: 'autoBackup',
                message: '是否启用自动备份?',
                default: true
            },
            {
                type: 'confirm',
                name: 'enableNotifications',
                message: '是否启用通知提醒?',
                default: false
            }
        ];

        const answers = await inquirer.prompt(questions);

        // 构建配置对象
        const config = { ...this.defaultConfig };
        
        config.wwwDir = answers.wwwDir;
        config.workspaceDir = answers.workspaceDir;
        config.nasConfig.host = answers.nasHost;
        config.nasConfig.user = answers.nasUser;
        config.nasConfig.mountPoint = answers.nasMountPoint;
        
        if (answers.syncInterval) {
            config.sync.interval = answers.syncInterval;
        }
        
        config.cleanup.enabled = answers.autoCleanup;
        config.backup.enabled = answers.autoBackup;
        config.notifications.enabled = answers.enableNotifications;

        return config;
    }

    async saveConfig(config) {
        const spinner = ora('保存配置...').start();
        
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            spinner.succeed('配置已保存');
        } catch (error) {
            spinner.fail('配置保存失败');
            throw error;
        }
    }

    async createDirectories(config) {
        const spinner = ora('创建必要目录...').start();

        const directories = [
            config.wwwDir,
            config.workspaceDir,
            path.join(config.wwwDir, 'logs'),
            path.join(config.wwwDir, 'backups'),
            path.join(config.wwwDir, 'temp'),
            path.join(config.nasConfig.mountPoint, 'backups'),
            path.join(config.nasConfig.mountPoint, 'sync')
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // 忽略NAS目录创建失败（可能未挂载）
                if (!dir.includes('/Volumes/')) {
                    throw error;
                }
            }
        }

        spinner.succeed('目录创建完成');
    }

    async testNASConnection(config) {
        const spinner = ora('测试NAS连接...').start();

        try {
            // 检查NAS是否可以ping通
            await exec(`ping -c 1 ${config.nasConfig.host}`);
            
            spinner.succeed('NAS连接正常');
            return true;

        } catch (error) {
            spinner.warn('NAS连接失败，但系统仍可正常使用');
            return false;
        }
    }

    async setupAutoStart() {
        const spinner = ora('配置开机自启...').start();

        try {
            // 创建启动脚本
            const launchAgentPath = path.join(process.env.HOME, 'Library/LaunchAgents/com.yyc3.filemanager.plist');
            
            const launchAgentContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.yyc3.filemanager</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/node</string>
        <string>${path.join(__dirname, 'SmartFileManager.js')}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${__dirname}</string>
    <key>StandardOutPath</key>
    <string>${path.join(__dirname, 'logs/filemanager.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(__dirname, 'logs/filemanager.err')}</string>
</dict>
</plist>`;

            await fs.writeFile(launchAgentPath, launchAgentContent);
            
            // 加载LaunchAgent
            await exec(`launchctl load ${launchAgentPath}`);
            
            spinner.succeed('开机自启配置完成');
        } catch (error) {
            spinner.warn('开机自启配置失败，可手动设置');
        }
    }

    showCompletionMessage() {
        console.log(chalk.green('\n🎉 YYC³智能文件管理系统安装完成！\n'));
        
        console.log(chalk.cyan('📋 快速开始:'));
        console.log(chalk.white('  启动系统:     npm start'));
        console.log(chalk.white('  扫描文件:     npm run scan'));
        console.log(chalk.white('  手动同步:     npm run sync'));
        console.log(chalk.white('  清理文件:     npm run cleanup'));
        console.log(chalk.white('  备份数据:     npm run backup'));
        console.log(chalk.white('  生成报告:     npm run report'));
        
        console.log(chalk.cyan('\n🔧 管理命令:'));
        console.log(chalk.white('  停止服务:     launchctl unload ~/Library/LaunchAgents/com.yyc3.filemanager.plist'));
        console.log(chalk.white('  重启服务:     launchctl unload ~/Library/LaunchAgents/com.yyc3.filemanager.plist && launchctl load ~/Library/LaunchAgents/com.yyc3.filemanager.plist'));
        console.log(chalk.white('  查看日志:     tail -f logs/filemanager.log'));
        
        console.log(chalk.cyan('\n📁 重要目录:'));
        console.log(chalk.white('  配置文件:     config.json'));
        console.log(chalk.white('  日志目录:     logs/'));
        console.log(chalk.white('  备份目录:     backups/'));
        console.log(chalk.white('  临时目录:     temp/'));
        
        console.log(chalk.yellow('\n⚠️  注意事项:'));
        console.log(chalk.white('  • 首次运行会进行文件扫描，可能需要几分钟时间'));
        console.log(chalk.white('  • 建议先运行 npm run scan 查看文件分布情况'));
        console.log(chalk.white('  • NAS连接失败时，系统仍可在本地正常工作'));
        console.log(chalk.white('  • 可通过修改 config.json 调整系统配置'));
        
        console.log(chalk.green('\n✨ 系统将自动在后台运行，享受智能文件管理体验！\n'));
    }
}

// 运行安装程序
if (require.main === module) {
    const setup = new SetupManager();
    setup.run();
}

module.exports = SetupManager;
