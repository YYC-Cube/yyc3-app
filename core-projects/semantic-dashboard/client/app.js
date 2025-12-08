/**
 * YYC³图形化语义应用面板 - 前端JavaScript
 * 智能脚本管理系统 - 实时数据可视化
 * 作者: YYC3 AI Family
 * 邮箱: admin@0379.email
 */

// 应用状态管理
const AppState = {
    websocket: null,
    isConnected: false,
    data: {
        services: {},
        systemInfo: {},
        scriptStats: {},
        lastUpdate: null
    },
    config: {
        updateInterval: 2000, // 2秒更新间隔
        maxLogEntries: 50,
        logPaused: false
    }
};

// 服务配置
const SERVICES_CONFIG = {
    api: { port: 6600, name: "API服务", icon: "🚀", color: "#3B82F6" },
    admin: { port: 6601, name: "管理后台", icon: "🎛️", color: "#10B981" },
    llm: { port: 6602, name: "LLM服务", icon: "🤖", color: "#8B5CF6" },
    mail: { port: 6603, name: "邮件服务", icon: "📧", color: "#F59E0B" },
    ai: { port: 6604, name: "AI服务", icon: "✨", color: "#EC4899" },
    app: { port: 6605, name: "前端应用", icon: "🖥️", color: "#14B8A6" },
    redis: { port: 6606, name: "缓存服务", icon: "💾", color: "#EF4444" },
    m4: { port: 9558, name: "M4脚本生成器", icon: "🔧", color: "#06B6D4" }
};

// 时间管理类
class TimeManager {
    constructor() {
        this.startTime = Date.now();
        this.initClock();
        this.initUptime();
    }

    initClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const clockElement = document.getElementById('current-time');
            if (clockElement) {
                clockElement.textContent = timeString;
            }
        };

        updateClock();
        setInterval(updateClock, 1000); // 每秒更新
    }

    initUptime() {
        const updateUptime = () => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);

            const uptimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const uptimeElement = document.getElementById('system-uptime');
            if (uptimeElement) {
                uptimeElement.textContent = uptimeString;
            }
        };

        updateUptime();
        setInterval(updateUptime, 1000); // 每秒更新
    }
}

// WebSocket管理类
class WebSocketManager {
    constructor() {
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.connect();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            AppState.websocket = new WebSocket(wsUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.handleReconnect();
        }
    }

    setupEventHandlers() {
        const ws = AppState.websocket;

        ws.onopen = () => {
            console.log('✅ WebSocket连接已建立');
            AppState.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('已连接', 'connected');
            this.addLogEntry('系统连接成功', 'success');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('消息解析失败:', error);
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket连接已关闭');
            AppState.isConnected = false;
            this.updateConnectionStatus('连接断开', 'disconnected');
            this.addLogEntry('系统连接断开', 'warning');
            this.handleReconnect();
        };

        ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            this.updateConnectionStatus('连接错误', 'error');
            this.addLogEntry('连接发生错误', 'error');
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'init':
            case 'update':
                AppState.data = { ...AppState.data, ...message.data };
                this.updateUI();
                break;
            case 'serviceStatus':
                if (AppState.data.services) {
                    AppState.data.services[message.data.service] = message.data;
                    this.updateServiceCard(message.data.service);
                }
                break;
            case 'actionResult':
                this.addLogEntry(message.data.message,
                    message.data.success ? 'success' : 'error');
                break;
        }
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateConnectionStatus(`重连中 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'reconnecting');

            setTimeout(() => {
                this.addLogEntry(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
                this.connect();
            }, this.reconnectDelay);
        } else {
            this.updateConnectionStatus('连接失败', 'failed');
            this.addLogEntry('无法建立连接，请刷新页面重试', 'error');
        }
    }

    updateConnectionStatus(text, status) {
        const statusElement = document.getElementById('connection-status');
        const statusDot = document.querySelector('.status-dot');

        if (statusElement) {
            statusElement.textContent = text;
        }

        if (statusDot) {
            statusDot.className = `status-dot ${status === 'connected' ? 'connected' : ''}`;
        }
    }

    sendMessage(message) {
        if (AppState.websocket && AppState.websocket.readyState === WebSocket.OPEN) {
            AppState.websocket.send(JSON.stringify(message));
        }
    }

    updateUI() {
        this.updateStats();
        this.updateServices();
        this.updateResources();
        this.updateLastUpdateTime();
    }

    updateStats() {
        const data = AppState.data;

        // 运行服务数
        const runningServices = Object.values(data.services || {})
            .filter(service => service.status === 'running').length;
        this.updateElement('services-running', runningServices);

        // 活跃连接数
        this.updateElement('active-connections', data.activeConnections || 0);

        // 脚本总数
        const totalScripts = data.scriptStats?.total || 0;
        this.updateElement('total-scripts', totalScripts);
    }

    updateServices() {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid || !AppState.data.services) return;

        servicesGrid.innerHTML = '';

        Object.entries(SERVICES_CONFIG).forEach(([serviceKey, config]) => {
            const serviceData = AppState.data.services[serviceKey] || { status: 'unknown' };
            const serviceCard = this.createServiceCard(serviceKey, config, serviceData);
            servicesGrid.appendChild(serviceCard);
        });
    }

    createServiceCard(serviceKey, config, serviceData) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.id = `service-${serviceKey}`;

        const statusClass = this.getStatusClass(serviceData.status);
        const responseTime = serviceData.responseTime || '--';
        const lastCheck = serviceData.lastCheck ?
            new Date(serviceData.lastCheck).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) : '--';

        card.innerHTML = `
            <div class="service-header">
                <div class="service-info">
                    <div class="service-icon" style="color: ${config.color}">
                        ${config.icon}
                    </div>
                    <div>
                        <div class="service-name">${config.name}</div>
                        <div class="service-status ${statusClass}">
                            <span class="status-indicator-dot"></span>
                            <span>${this.getStatusText(serviceData.status)}</span>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">端口 ${config.port}</div>
                </div>
            </div>
            <div class="service-details">
                <div class="detail-row">
                    <span>响应时间</span>
                    <span class="detail-value">${responseTime}ms</span>
                </div>
                <div class="detail-row">
                    <span>最后检查</span>
                    <span class="detail-value">${lastCheck}</span>
                </div>
                ${serviceData.error ? `
                    <div class="detail-row">
                        <span>错误信息</span>
                        <span class="detail-value" style="color: var(--danger-color)">${serviceData.error}</span>
                    </div>
                ` : ''}
            </div>
        `;

        // 添加点击事件
        card.addEventListener('click', () => {
            this.handleServiceClick(serviceKey, config);
        });

        return card;
    }

    updateServiceCard(serviceKey) {
        const card = document.getElementById(`service-${serviceKey}`);
        if (!card) return;

        const serviceData = AppState.data.services[serviceKey];
        const config = SERVICES_CONFIG[serviceKey];

        // 更新状态指示器
        const statusElement = card.querySelector('.service-status');
        const statusClass = this.getStatusClass(serviceData.status);
        statusElement.className = `service-status ${statusClass}`;

        // 更新状态文本
        const statusText = statusElement.querySelector('span:last-child');
        statusText.textContent = this.getStatusText(serviceData.status);

        // 更新响应时间
        const responseTimeElement = card.querySelector('.detail-row:nth-child(1) .detail-value');
        if (responseTimeElement && serviceData.responseTime) {
            responseTimeElement.textContent = `${serviceData.responseTime}ms`;
        }

        // 更新最后检查时间
        const lastCheckElement = card.querySelector('.detail-row:nth-child(2) .detail-value');
        if (lastCheckElement && serviceData.lastCheck) {
            lastCheckElement.textContent = new Date(serviceData.lastCheck).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        // 添加动画效果
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.5s ease';
        }, 10);
    }

    updateResources() {
        const systemInfo = AppState.data.systemInfo || {};

        // 更新内存使用
        if (systemInfo.memory) {
            const memoryUsage = systemInfo.memory.heapUsed || 0;
            const memoryTotal = systemInfo.memory.heapTotal || 1;
            const memoryPercent = Math.round((memoryUsage / memoryTotal) * 100);

            this.updateProgressBar('memory-bar', memoryPercent);
            this.updateElement('memory-info', `${(memoryUsage / 1024 / 1024).toFixed(1)}MB / ${(memoryTotal / 1024 / 1024).toFixed(1)}MB`);
        }

        // 更新响应时间
        const avgResponseTime = this.calculateAverageResponseTime();
        this.updateElement('response-time', `${avgResponseTime}ms`);

        // 更新系统负载
        const loadStatus = this.getSystemLoadStatus();
        this.updateElement('system-load', loadStatus);
    }

    updateLastUpdateTime() {
        const lastUpdate = AppState.data.lastUpdate;
        if (lastUpdate) {
            const updateElement = document.getElementById('last-update');
            if (updateElement) {
                updateElement.textContent = `最后更新: ${new Date(lastUpdate).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}`;
            }
        }
    }

    handleServiceClick(serviceKey, config) {
        this.addLogEntry(`点击服务: ${config.name}`, 'info');

        // 发送获取服务状态请求
        this.sendMessage({
            type: 'getServiceStatus',
            service: serviceKey
        });
    }

    getStatusClass(status) {
        switch (status) {
            case 'running': return 'status-running';
            case 'offline': return 'status-offline';
            case 'error': return 'status-error';
            default: return 'status-unknown';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'running': return '运行中';
            case 'offline': return '离线';
            case 'error': return '错误';
            default: return '未知';
        }
    }

    calculateAverageResponseTime() {
        const services = Object.values(AppState.data.services || {});
        const responseTimes = services
            .filter(service => service.responseTime)
            .map(service => service.responseTime);

        if (responseTimes.length === 0) return 0;

        const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        return Math.round(average);
    }

    getSystemLoadStatus() {
        const runningServices = Object.values(AppState.data.services || {})
            .filter(service => service.status === 'running').length;
        const totalServices = Object.keys(SERVICES_CONFIG).length;

        if (runningServices === totalServices) return '正常';
        if (runningServices > totalServices * 0.5) return '中等';
        return '高负载';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateProgressBar(id, percent) {
        const element = document.getElementById(id);
        if (element) {
            element.style.width = `${Math.min(100, percent)}%`;

            // 根据百分比改变颜色
            if (percent > 80) {
                element.style.background = 'linear-gradient(90deg, var(--danger-color), #F97316)';
            } else if (percent > 60) {
                element.style.background = 'linear-gradient(90deg, var(--warning-color), #FBBF24)';
            } else {
                element.style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
            }
        }
    }

    addLogEntry(message, type = 'info') {
        if (AppState.config.logPaused) return;

        const datastream = document.getElementById('datastream');
        if (!datastream) return;

        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const entry = document.createElement('div');
        entry.className = 'data-entry';
        entry.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <span class="message">${message}</span>
        `;

        // 添加到顶部
        datastream.insertBefore(entry, datastream.firstChild);

        // 限制日志条目数量
        const entries = datastream.querySelectorAll('.data-entry');
        if (entries.length > AppState.config.maxLogEntries) {
            entries[entries.length - 1].remove();
        }
    }
}

// 日志管理
class LogManager {
    constructor() {
        this.setupLogToggle();
    }

    setupLogToggle() {
        const toggleBtn = document.getElementById('toggle-logs');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                AppState.config.logPaused = !AppState.config.logPaused;
                toggleBtn.textContent = AppState.config.logPaused ? '继续日志' : '暂停日志';

                if (!AppState.config.logPaused) {
                    AppState.websocket?.send(JSON.stringify({ type: 'requestUpdate' }));
                }
            });
        }
    }
}

// 应用初始化
class App {
    constructor() {
        this.timeManager = null;
        this.wsManager = null;
        this.logManager = null;
        this.init();
    }

    init() {
        // 初始化时间管理器
        this.timeManager = new TimeManager();

        // 初始化日志管理器
        this.logManager = new LogManager();

        // 初始化WebSocket管理器
        this.wsManager = new WebSocketManager();

        // 设置定时器更新（作为WebSocket的备用）
        this.setupPeriodicUpdates();

        // 添加键盘快捷键
        this.setupKeyboardShortcuts();

        console.log('🚀 YYC³语义面板已初始化');
    }

    setupPeriodicUpdates() {
        // 每30秒请求一次完整状态更新（作为WebSocket的备用）
        setInterval(() => {
            if (!AppState.isConnected) {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        AppState.data = { ...AppState.data, ...data };
                        this.wsManager?.updateUI();
                    })
                    .catch(error => {
                        console.error('备用更新失败:', error);
                    });
            }
        }, 30000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + R: 手动刷新
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                location.reload();
            }

            // Ctrl/Cmd + L: 切换日志
            if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
                event.preventDefault();
                document.getElementById('toggle-logs')?.click();
            }

            // ESC: 清除日志
            if (event.key === 'Escape') {
                const datastream = document.getElementById('datastream');
                if (datastream) {
                    datastream.innerHTML = '';
                    this.wsManager?.addLogEntry('日志已清除', 'info');
                }
            }
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.yyc3App = new App();

    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && AppState.websocket?.readyState === WebSocket.CLOSED) {
            AppState.websocket?.send(JSON.stringify({ type: 'requestUpdate' }));
        }
    });

    // 添加页面关闭提示
    window.addEventListener('beforeunload', (event) => {
        if (AppState.isConnected) {
            event.preventDefault();
            event.returnValue = '确定要离开YYC³语义面板吗？';
        }
    });
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    AppState.websocket?.send(JSON.stringify({
        type: 'error',
        message: event.error.message,
        stack: event.error.stack
    }));
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    AppState.websocket?.send(JSON.stringify({
        type: 'error',
        message: `未处理的Promise拒绝: ${event.reason}`
    }));
});