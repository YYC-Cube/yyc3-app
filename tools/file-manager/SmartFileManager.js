#!/usr/bin/env node

/**
 * YYC³ 智能文件管理系统
 * 实现自动化文件同步、去重、备份和清理
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const EventEmitter = require('events');

class SmartFileManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            baseDir: '/Users/yanyu',
            wwwDir: '/Users/yanyu/www',
            workspaceDir: '/Users/yanyu/yyc3-workspace',
            backupDir: '/Users/yanyu/backup',
            maxBackupAge: 30 * 24 * 60 * 60 * 1000, // 30天
            excludedDirs: ['.git', 'node_modules', '.pnpm', 'dist', 'build'],
            excludedFiles: ['.DS_Store', '*.log', '*.tmp'],
            ...config
        };

        this.fileHashes = new Map();
        this.duplicateFiles = new Map();
        this.syncQueue = [];
        this.isScanning = false;
    }

    /**
     * 系统初始化
     */
    async initialize() {
        console.log('🚀 初始化YYC³智能文件管理系统...');

        try {
            // 创建必要的目录
            await this.ensureDirectories();

            // 初始化数据库
            await this.initDatabase();

            // 启动监控服务
            this.startFileWatcher();

            // 扫描现有文件
            await this.scanAllDirectories();

            console.log('✅ 系统初始化完成');
            this.emit('initialized');
        } catch (error) {
            console.error('❌ 系统初始化失败:', error);
            this.emit('error', error);
        }
    }

    /**
     * 确保目录存在
     */
    async ensureDirectories() {
        const dirs = [
            this.config.backupDir,
            path.join(this.config.backupDir, 'snapshots'),
            path.join(this.config.backupDir, 'duplicates'),
            path.join(this.config.backupDir, 'archives'),
            path.join(this.config.wwwDir, '🔄 自动同步'),
            path.join(this.config.wwwDir, '🗂️ 智能归档')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    /**
     * 计算文件哈希值
     */
    async calculateFileHash(filePath) {
        try {
            const content = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (error) {
            console.warn(`无法计算文件哈希: ${filePath}`, error.message);
            return null;
        }
    }

    /**
     * 扫描单个目录
     */
    async scanDirectory(dirPath, options = {}) {
        const { maxDepth = 3, includeHidden = false } = options;
        const results = {
            files: [],
            directories: [],
            duplicates: [],
            size: 0
        };

        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });

            for (const item of items) {
                if (!includeHidden && item.name.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(dirPath, item.name);

                if (this.config.excludedDirs.some(excluded => item.name.includes(excluded))) {
                    continue;
                }

                try {
                    const stats = await fs.stat(fullPath);

                    if (item.isDirectory()) {
                        results.directories.push({
                            path: fullPath,
                            size: stats.size,
                            modified: stats.mtime
                        });

                        if (maxDepth > 0) {
                            const subResults = await this.scanDirectory(fullPath, {
                                maxDepth: maxDepth - 1,
                                includeHidden
                            });
                            results.files.push(...subResults.files);
                            results.directories.push(...subResults.directories);
                            results.duplicates.push(...subResults.duplicates);
                        }
                    } else if (item.isFile()) {
                        if (this.config.excludedFiles.some(pattern =>
                            item.name.match(new RegExp(pattern.replace(/\*/g, '.*')))
                        )) {
                            continue;
                        }

                        const fileHash = await this.calculateFileHash(fullPath);
                        const fileInfo = {
                            path: fullPath,
                            name: item.name,
                            size: stats.size,
                            modified: stats.mtime,
                            hash: fileHash
                        };

                        results.files.push(fileInfo);
                        results.size += stats.size;

                        // 检查重复文件
                        if (fileHash && this.fileHashes.has(fileHash)) {
                            const existing = this.fileHashes.get(fileHash);
                            results.duplicates.push({
                                original: existing,
                                duplicate: fileInfo
                            });

                            if (!this.duplicateFiles.has(fileHash)) {
                                this.duplicateFiles.set(fileHash, [existing]);
                            }
                            this.duplicateFiles.get(fileHash).push(fileInfo);
                        } else if (fileHash) {
                            this.fileHashes.set(fileHash, fileInfo);
                        }
                    }
                } catch (error) {
                    console.warn(`无法处理项目: ${fullPath}`, error.message);
                }
            }
        } catch (error) {
            console.error(`扫描目录失败: ${dirPath}`, error);
        }

        return results;
    }

    /**
     * 扫描所有相关目录
     */
    async scanAllDirectories() {
        if (this.isScanning) {
            console.log('⏳ 扫描正在进行中...');
            return;
        }

        this.isScanning = true;
        console.log('🔍 开始扫描所有目录...');

        const directories = [
            this.config.wwwDir,
            this.config.workspaceDir,
            path.join(this.config.baseDir, 'Downloads')
        ];

        const scanResults = {
            totalFiles: 0,
            totalSize: 0,
            duplicates: [],
            directories: {}
        };

        try {
            for (const dir of directories) {
                console.log(`📁 扫描目录: ${dir}`);
                const results = await this.scanDirectory(dir);

                scanResults.directories[dir] = results;
                scanResults.totalFiles += results.files.length;
                scanResults.totalSize += results.size;
                scanResults.duplicates.push(...results.duplicates);

                console.log(`  ✓ 文件: ${results.files.length}, 大小: ${this.formatBytes(results.size)}`);
            }

            // 生成扫描报告
            await this.generateScanReport(scanResults);

            // 处理重复文件
            if (scanResults.duplicates.length > 0) {
                await this.handleDuplicateFiles(scanResults.duplicates);
            }

            console.log('✅ 目录扫描完成');
            this.emit('scanCompleted', scanResults);

        } catch (error) {
            console.error('❌ 目录扫描失败:', error);
            this.emit('error', error);
        } finally {
            this.isScanning = false;
        }

        return scanResults;
    }

    /**
     * 处理重复文件
     */
    async handleDuplicateFiles(duplicates) {
        console.log(`🔄 发现 ${duplicates.length} 个重复文件组`);

        const duplicateDir = path.join(this.config.backupDir, 'duplicates');
        await fs.mkdir(duplicateDir, { recursive: true });

        for (const duplicate of duplicates) {
            try {
                const { original, duplicate: dupFile } = duplicate;

                // 创建重复文件记录
                const record = {
                    hash: dupFile.hash,
                    original: original.path,
                    duplicates: [dupFile.path],
                    timestamp: new Date().toISOString()
                };

                // 移动重复文件到备份目录
                const backupPath = path.join(duplicateDir, path.basename(dupFile.path));
                await fs.rename(dupFile.path, backupPath);

                console.log(`  📦 已移动重复文件: ${dupFile.path} -> ${backupPath}`);

                // 记录操作
                await this.logOperation('duplicate_removed', record);

            } catch (error) {
                console.warn(`处理重复文件失败: ${duplicate.duplicate.path}`, error.message);
            }
        }
    }

    /**
     * 智能同步文件
     */
    async syncFiles(sourceDir, targetDir, options = {}) {
        const {
            deleteExtra = false,
            preserveTimestamps = true,
            exclude = this.config.excludedDirs
        } = options;

        console.log(`🔄 开始同步: ${sourceDir} -> ${targetDir}`);

        try {
            const rsyncArgs = ['-av', '--progress'];

            if (deleteExtra) {
                rsyncArgs.push('--delete');
            }

            if (preserveTimestamps) {
                rsyncArgs.push('-t');
            }

            for (const pattern of exclude) {
                rsyncArgs.push(`--exclude=${pattern}`);
            }

            rsyncArgs.push(sourceDir + '/', targetDir + '/');

            const command = `rsync "${rsyncArgs.join('" "')}"`;
            console.log(`🔧 执行命令: ${command}`);

            const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });

            console.log('✅ 同步完成');
            await this.logOperation('sync_completed', {
                source: sourceDir,
                target: targetDir,
                result: result
            });

            this.emit('syncCompleted', { sourceDir, targetDir, result });

        } catch (error) {
            console.error('❌ 同步失败:', error);
            this.emit('error', error);
        }
    }

    /**
     * 启动文件监控
     */
    startFileWatcher() {
        try {
            const chokidar = require('chokidar');

            const watcher = chokidar.watch([
                path.join(this.config.wwwDir, '**/*'),
                path.join(this.config.workspaceDir, '**/*')
            ], {
                ignored: this.config.excludedDirs,
                persistent: true,
                ignoreInitial: true
            });

            watcher.on('change', async (filePath) => {
                console.log(`📝 文件变更: ${filePath}`);
                await this.queueSyncOperation(filePath);
            });

            watcher.on('add', async (filePath) => {
                console.log(`➕ 新增文件: ${filePath}`);
                await this.queueSyncOperation(filePath);
            });

            watcher.on('unlink', async (filePath) => {
                console.log(`➖ 删除文件: ${filePath}`);
                await this.queueSyncOperation(filePath, 'delete');
            });

            console.log('👁️ 文件监控已启动');

        } catch (error) {
            console.warn('文件监控启动失败，请安装chokidar: npm install chokidar');
        }
    }

    /**
     * 队列同步操作
     */
    async queueSyncOperation(filePath, operation = 'update') {
        this.syncQueue.push({
            path: filePath,
            operation,
            timestamp: Date.now()
        });

        // 延迟执行，避免频繁操作
        setTimeout(() => {
            this.processSyncQueue();
        }, 5000);
    }

    /**
     * 处理同步队列
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 处理 ${this.syncQueue.length} 个同步操作`);

        const operations = [...this.syncQueue];
        this.syncQueue = [];

        for (const op of operations) {
            try {
                // 这里可以实现具体的同步逻辑
                console.log(`  ✓ ${op.operation}: ${op.path}`);
            } catch (error) {
                console.warn(`同步操作失败: ${op.path}`, error.message);
            }
        }
    }

    /**
     * 自动备份
     */
    async createBackup(sourcePath, backupType = 'incremental') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${path.basename(sourcePath)}_${timestamp}_${backupType}`;
        const backupPath = path.join(this.config.backupDir, 'snapshots', backupName);

        console.log(`💾 创建备份: ${backupName}`);

        try {
            if (backupType === 'full') {
                await this.createFullBackup(sourcePath, backupPath);
            } else {
                await this.createIncrementalBackup(sourcePath, backupPath);
            }

            await this.cleanupOldBackups();

            console.log('✅ 备份完成');
            this.emit('backupCompleted', { sourcePath, backupPath, backupType });

        } catch (error) {
            console.error('❌ 备份失败:', error);
            this.emit('error', error);
        }
    }

    /**
     * 创建完整备份
     */
    async createFullBackup(sourcePath, backupPath) {
        const command = `cp -r "${sourcePath}" "${backupPath}"`;
        execSync(command);
    }

    /**
     * 创建增量备份
     */
    async createIncrementalBackup(sourcePath, backupPath) {
        const command = `rsync -av --link-dest="${path.dirname(backupPath)}/latest" "${sourcePath}/" "${backupPath}/"`;
        execSync(command);

        // 更新latest链接
        const latestPath = path.join(path.dirname(backupPath), 'latest');
        try {
            await fs.unlink(latestPath);
        } catch {}
        await fs.symlink(backupPath, latestPath);
    }

    /**
     * 清理旧备份
     */
    async cleanupOldBackups() {
        const snapshotsDir = path.join(this.config.backupDir, 'snapshots');

        try {
            const items = await fs.readdir(snapshotsDir);
            const now = Date.now();

            for (const item of items) {
                if (item === 'latest') continue;

                const itemPath = path.join(snapshotsDir, item);
                const stats = await fs.stat(itemPath);

                if (now - stats.mtime.getTime() > this.config.maxBackupAge) {
                    await fs.rm(itemPath, { recursive: true, force: true });
                    console.log(`  🗑️ 删除过期备份: ${item}`);
                }
            }
        } catch (error) {
            console.warn('清理备份失败:', error.message);
        }
    }

    /**
     * 生成扫描报告
     */
    async generateScanReport(results) {
        const reportPath = path.join(this.config.backupDir, `scan_report_${new Date().toISOString().split('T')[0]}.json`);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: results.totalFiles,
                totalSize: results.totalSize,
                duplicateGroups: results.duplicates.length,
                directoriesScanned: Object.keys(results.directories).length
            },
            details: results,
            recommendations: this.generateRecommendations(results)
        };

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 扫描报告已保存: ${reportPath}`);
    }

    /**
     * 生成优化建议
     */
    generateRecommendations(results) {
        const recommendations = [];

        // 基于重复文件的建议
        if (results.duplicates.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'high',
                title: '清理重复文件',
                description: `发现 ${results.duplicates.length} 个重复文件组，建议清理以节省存储空间`,
                action: 'run_cleanup_duplicates'
            });
        }

        // 基于目录大小的建议
        Object.entries(results.directories).forEach(([dir, data]) => {
            if (data.size > 1024 * 1024 * 1024) { // 1GB
                recommendations.push({
                    type: 'archive',
                    priority: 'medium',
                    title: '归档大文件目录',
                    description: `目录 ${dir} 占用 ${this.formatBytes(data.size)}，建议归档不常用文件`,
                    action: 'run_archive_large_files'
                });
            }
        });

        return recommendations;
    }

    /**
     * 记录操作日志
     */
    async logOperation(operation, data) {
        const logFile = path.join(this.config.backupDir, 'operations.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data
        };

        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    }

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取系统状态
     */
    async getSystemStatus() {
        return {
            isScanning: this.isScanning,
            queueLength: this.syncQueue.length,
            trackedFiles: this.fileHashes.size,
            duplicateGroups: this.duplicateFiles.size,
            lastBackup: await this.getLastBackupTime()
        };
    }

    /**
     * 获取最后备份时间
     */
    async getLastBackupTime() {
        try {
            const snapshotsDir = path.join(this.config.backupDir, 'snapshots');
            const items = await fs.readdir(snapshotsDir);

            let latestTime = null;
            for (const item of items) {
                if (item === 'latest') continue;

                const itemPath = path.join(snapshotsDir, item);
                const stats = await fs.stat(itemPath);

                if (!latestTime || stats.mtime > latestTime) {
                    latestTime = stats.mtime;
                }
            }

            return latestTime;
        } catch {
            return null;
        }
    }
}

module.exports = SmartFileManager;

// 如果直接运行此文件
if (require.main === module) {
    const manager = new SmartFileManager();

    manager.on('initialized', () => {
        console.log('🎉 YYC³智能文件管理系统已启动');
    });

    manager.on('scanCompleted', (results) => {
        console.log(`📊 扫描完成: ${results.totalFiles} 个文件, ${manager.formatBytes(results.totalSize)}`);
    });

    manager.on('error', (error) => {
        console.error('💥 系统错误:', error);
    });

    // 初始化系统
    manager.initialize().catch(console.error);

    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n👋 正在关闭系统...');
        process.exit(0);
    });
}