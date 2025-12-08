#!/usr/bin/env node

/**
 * YYC³ NAS集成管理系统
 * 实现与NAS服务器的自动化连接、同步和备份
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const SmartFileManager = require('./SmartFileManager');

class NASIntegration extends SmartFileManager {
    constructor(config = {}) {
        super({
            ...config,
            nasConfig: {
                host: '192.168.1.12',
                httpPort: 8181,
                httpsPort: 5443,
                sftpPort: 22,
                shares: {
                    www: '/yyc3-www',
                    workspace: '/yyc3-workspace',
                    backup: '/yyc3-backup',
                    archives: '/yyc3-archives'
                },
                mountPoints: {
                    www: '/mnt/yyc3-www',
                    workspace: '/mnt/yyc3-workspace',
                    backup: '/mnt/yyc3-backup'
                },
                ...config.nasConfig
            }
        });

        this.isConnected = false;
        this.mountStatus = {};
    }

    /**
     * 初始化NAS集成
     */
    async initializeNAS() {
        console.log('🌐 初始化YYC³ NAS集成系统...');

        try {
            // 检查网络连接
            await this.checkNASConnection();

            // 如果连接成功，挂载共享目录
            if (this.isConnected) {
                await this.mountNASShares();
            }

            // 设置自动同步
            this.setupAutoSync();

            // 配置定时备份
            this.setupScheduledBackups();

            console.log('✅ NAS集成系统初始化完成');
            this.emit('nasInitialized');

        } catch (error) {
            console.error('❌ NAS集成初始化失败:', error);
            this.emit('nasError', error);
        }
    }

    /**
     * 检查NAS连接状态
     */
    async checkNASConnection() {
        const { host, httpPort, httpsPort } = this.config.nasConfig;

        console.log(`🔍 检查NAS服务器连接: ${host}`);

        try {
            // 检查网络连通性
            execSync(`ping -c 1 -W 5000 ${host}`, { stdio: 'ignore' });
            console.log('  ✅ 网络连接正常');

            // 检查HTTP服务
            try {
                execSync(`curl -s --connect-timeout 5 http://${host}:${httpPort}`, { stdio: 'ignore' });
                console.log(`  ✅ HTTP服务正常 (端口${httpPort})`);
            } catch {
                console.log(`  ❌ HTTP服务异常 (端口${httpPort})`);
            }

            // 检查HTTPS服务
            try {
                execSync(`curl -s --connect-timeout 5 -k https://${host}:${httpsPort}`, { stdio: 'ignore' });
                console.log(`  ✅ HTTPS服务正常 (端口${httpsPort})`);
            } catch {
                console.log(`  ❌ HTTPS服务异常 (端口${httpsPort})`);
            }

            // 检查SSH/SFTP服务
            try {
                execSync(`nc -z ${host} 22`, { stdio: 'ignore' });
                console.log('  ✅ SSH/SFTP服务正常 (端口22)');
            } catch {
                console.log('  ❌ SSH/SFTP服务异常 (端口22)');
            }

            this.isConnected = true;
            return true;

        } catch (error) {
            console.log('  ❌ 网络连接失败');
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 挂载NAS共享目录
     */
    async mountNASShares() {
        const { shares, mountPoints, host } = this.config.nasConfig;

        console.log('📁 挂载NAS共享目录...');

        // 创建挂载点
        for (const [name, mountPoint] of Object.entries(mountPoints)) {
            try {
                await fs.mkdir(mountPoint, { recursive: true });
            } catch (error) {
                console.warn(`创建挂载点失败: ${mountPoint}`, error.message);
            }
        }

        // 使用SSHFS挂载（更安全的方案）
        for (const [name, sharePath] of Object.entries(shares)) {
            const mountPoint = mountPoints[name];

            try {
                // 检查是否已经挂载
                const isMounted = await this.checkMountStatus(mountPoint);

                if (!isMounted) {
                    console.log(`  🔄 挂载 ${sharePath} -> ${mountPoint}`);

                    // 使用sshfs挂载
                    const mountCommand = `sshfs -o allow_other,default_permissions ${host}:${sharePath} ${mountPoint}`;
                    execSync(mountCommand, { stdio: 'pipe' });

                    console.log(`  ✅ 成功挂载: ${name}`);
                    this.mountStatus[name] = 'mounted';
                } else {
                    console.log(`  ✓ 已经挂载: ${name}`);
                    this.mountStatus[name] = 'mounted';
                }

            } catch (error) {
                console.error(`  ❌ 挂载失败: ${name}`, error.message);
                this.mountStatus[name] = 'failed';
            }
        }
    }

    /**
     * 检查挂载状态
     */
    async checkMountStatus(mountPoint) {
        try {
            const output = execSync('mount', { encoding: 'utf8' });
            return output.includes(mountPoint);
        } catch {
            return false;
        }
    }

    /**
     * 卸载NAS共享目录
     */
    async unmountNASShares() {
        const { mountPoints } = this.config.nasConfig;

        console.log('🔌 卸载NAS共享目录...');

        for (const [name, mountPoint] of Object.entries(mountPoints)) {
            try {
                const isMounted = await this.checkMountStatus(mountPoint);

                if (isMounted) {
                    console.log(`  🔌 卸载: ${name}`);
                    execSync(`umount ${mountPoint}`, { stdio: 'pipe' });
                    console.log(`  ✅ 成功卸载: ${name}`);
                    this.mountStatus[name] = 'unmounted';
                }

            } catch (error) {
                console.error(`  ❌ 卸载失败: ${name}`, error.message);
                this.mountStatus[name] = 'error';
            }
        }
    }

    /**
     * 同步到NAS
     */
    async syncToNAS(sourceDir, shareName, options = {}) {
        if (!this.isConnected) {
            throw new Error('NAS未连接');
        }

        const { mountPoints } = this.config.nasConfig;
        const targetDir = mountPoints[shareName];

        if (!targetDir) {
            throw new Error(`未知的共享名称: ${shareName}`);
        }

        console.log(`🔄 同步到NAS: ${sourceDir} -> ${shareName}`);

        try {
            await this.syncFiles(sourceDir, targetDir, {
                deleteExtra: options.deleteExtra || false,
                preserveTimestamps: true,
                exclude: [...this.config.excludedDirs, ...(options.exclude || [])]
            });

            // 记录同步日志
            await this.logOperation('sync_to_nas', {
                source: sourceDir,
                share: shareName,
                target: targetDir,
                options
            });

            this.emit('syncToNasCompleted', { sourceDir, shareName, targetDir });

        } catch (error) {
            console.error('❌ NAS同步失败:', error);
            this.emit('nasError', error);
            throw error;
        }
    }

    /**
     * 从NAS恢复
     */
    async restoreFromNAS(shareName, targetDir, options = {}) {
        if (!this.isConnected) {
            throw new Error('NAS未连接');
        }

        const { mountPoints } = this.config.nasConfig;
        const sourceDir = mountPoints[shareName];

        if (!sourceDir) {
            throw new Error(`未知的共享名称: ${shareName}`);
        }

        console.log(`📥 从NAS恢复: ${shareName} -> ${targetDir}`);

        try {
            await this.syncFiles(sourceDir, targetDir, {
                deleteExtra: options.deleteExtra || false,
                preserveTimestamps: true
            });

            // 记录恢复日志
            await this.logOperation('restore_from_nas', {
                share: shareName,
                target: targetDir,
                source: sourceDir,
                options
            });

            this.emit('restoreFromNasCompleted', { shareName, targetDir, sourceDir });

        } catch (error) {
            console.error('❌ NAS恢复失败:', error);
            this.emit('nasError', error);
            throw error;
        }
    }

    /**
     * 设置自动同步
     */
    setupAutoSync() {
        // 每30分钟同步一次重要目录
        setInterval(async () => {
            if (!this.isConnected) return;

            try {
                console.log('🔄 执行定时同步...');

                // 同步www目录
                await this.syncToNAS(this.config.wwwDir, 'www', {
                    deleteExtra: false,
                    exclude: ['node_modules', '.git', 'dist']
                });

                // 同步工作区
                await this.syncToNAS(this.config.workspaceDir, 'workspace', {
                    deleteExtra: false,
                    exclude: ['node_modules', '.git', 'dist', 'build']
                });

            } catch (error) {
                console.error('定时同步失败:', error.message);
            }
        }, 30 * 60 * 1000); // 30分钟
    }

    /**
     * 设置定时备份
     */
    setupScheduledBackups() {
        // 每天凌晨2点执行完整备份
        const scheduleBackup = () => {
            const now = new Date();
            const nextBackup = new Date();
            nextBackup.setHours(2, 0, 0, 0);

            // 如果已经过了今天的2点，则安排到明天
            if (now > nextBackup) {
                nextBackup.setDate(nextBackup.getDate() + 1);
            }

            const delay = nextBackup - now;
            console.log(`⏰ 下次备份时间: ${nextBackup.toLocaleString()}`);

            setTimeout(async () => {
                try {
                    console.log('🗄️ 执行定时备份...');
                    await this.performNASBackup();

                    // 递归安排下一次备份
                    scheduleBackup();
                } catch (error) {
                    console.error('定时备份失败:', error);
                    // 即使失败也要安排下一次备份
                    scheduleBackup();
                }
            }, delay);
        };

        scheduleBackup();
    }

    /**
     * 执行NAS备份
     */
    async performNASBackup() {
        const { mountPoints } = this.config.nasConfig;
        const backupDir = mountPoints.backup;

        if (!backupDir) {
            throw new Error('备份共享目录未配置');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `yyc3_backup_${timestamp}`;
        const backupPath = path.join(backupDir, backupName);

        console.log(`🗄️ 创建NAS备份: ${backupName}`);

        try {
            // 创建备份目录
            await fs.mkdir(backupPath, { recursive: true });

            // 备份www目录
            const wwwBackupPath = path.join(backupPath, 'www');
            await this.createFullBackup(this.config.wwwDir, wwwBackupPath);

            // 备份工作区
            const workspaceBackupPath = path.join(backupPath, 'workspace');
            await this.createFullBackup(this.config.workspaceDir, workspaceBackupPath);

            // 创建备份元数据
            const metadata = {
                timestamp: new Date().toISOString(),
                backupName,
                wwwSize: await this.getDirectorySize(this.config.wwwDir),
                workspaceSize: await this.getDirectorySize(this.config.workspaceDir),
                nasHost: this.config.nasConfig.host
            };

            await fs.writeFile(
                path.join(backupPath, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            console.log('✅ NAS备份完成');
            this.emit('nasBackupCompleted', { backupPath, metadata });

        } catch (error) {
            console.error('❌ NAS备份失败:', error);
            this.emit('nasError', error);
            throw error;
        }
    }

    /**
     * 获取目录大小
     */
    async getDirectorySize(dirPath) {
        try {
            const result = execSync(`du -sb "${dirPath}"`, { encoding: 'utf8' });
            return parseInt(result.split('\t')[0]);
        } catch {
            return 0;
        }
    }

    /**
     * 获取NAS状态
     */
    async getNASStatus() {
        const status = {
            connected: this.isConnected,
            host: this.config.nasConfig.host,
            mountStatus: this.mountStatus,
            lastSync: await this.getLastSyncTime(),
            lastBackup: await this.getLastBackupTime()
        };

        // 检查挂载点的实际状态
        for (const [name, mountPoint] of Object.entries(this.config.nasConfig.mountPoints)) {
            try {
                const isMounted = await this.checkMountStatus(mountPoint);
                const stats = await fs.stat(mountPoint);

                status.mountStatus[name] = {
                    mounted: isMounted,
                    path: mountPoint,
                    accessible: isMounted && stats.isDirectory()
                };
            } catch {
                status.mountStatus[name] = {
                    mounted: false,
                    path: mountPoint,
                    accessible: false
                };
            }
        }

        return status;
    }

    /**
     * 获取最后同步时间
     */
    async getLastSyncTime() {
        try {
            const logFile = path.join(this.config.backupDir, 'operations.log');
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.trim().split('\n');

            for (let i = lines.length - 1; i >= 0; i--) {
                const logEntry = JSON.parse(lines[i]);
                if (logEntry.operation === 'sync_to_nas') {
                    return new Date(logEntry.timestamp);
                }
            }
        } catch {
            // 忽略错误
        }

        return null;
    }

    /**
     * 重新连接NAS
     */
    async reconnectNAS() {
        console.log('🔄 重新连接NAS...');

        try {
            // 先卸载
            await this.unmountNASShares();

            // 等待一段时间
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 重新检查连接
            await this.checkNASConnection();

            // 如果连接成功，重新挂载
            if (this.isConnected) {
                await this.mountNASShares();
            }

            console.log('✅ NAS重新连接完成');
            this.emit('nasReconnected');

        } catch (error) {
            console.error('❌ NAS重新连接失败:', error);
            this.emit('nasError', error);
        }
    }

    /**
     * 优雅关闭
     */
    async shutdown() {
        console.log('👋 关闭NAS集成系统...');

        try {
            await this.unmountNASShares();
            console.log('✅ NAS集成系统已关闭');
        } catch (error) {
            console.error('❌ 关闭NAS集成系统失败:', error);
        }
    }
}

module.exports = NASIntegration;

// 如果直接运行此文件
if (require.main === module) {
    const nas = new NASIntegration();

    nas.on('nasInitialized', () => {
        console.log('🎉 YYC³ NAS集成系统已启动');

        // 定期检查连接状态
        setInterval(async () => {
            const status = await nas.getNASStatus();
            if (!status.connected) {
                console.log('⚠️ NAS连接断开，尝试重新连接...');
                await nas.reconnectNAS();
            }
        }, 60000); // 每分钟检查一次
    });

    nas.on('nasError', (error) => {
        console.error('💥 NAS系统错误:', error);
    });

    // 初始化系统
    nas.initializeNAS().catch(console.error);

    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('\n👋 正在关闭NAS集成系统...');
        await nas.shutdown();
        process.exit(0);
    });
}