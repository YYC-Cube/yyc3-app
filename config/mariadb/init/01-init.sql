-- 0379.email 数据库初始化脚本

-- 创建应用数据库
CREATE DATABASE IF NOT EXISTS 0379_email_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS 0379_email_prod.users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'user', 'guest') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 创建配置表
CREATE TABLE IF NOT EXISTS 0379_email_prod.configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS 0379_email_prod.system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    log_level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL,
    message TEXT NOT NULL,
    context JSON,
    user_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_name (service_name),
    INDEX idx_log_level (log_level),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES 0379_email_prod.users(id) ON DELETE SET NULL
);

-- 插入默认管理员用户
INSERT IGNORE INTO 0379_email_prod.users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@0379.email', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', '系统管理员', 'admin');

-- 插入默认配置
INSERT IGNORE INTO 0379_email_prod.configurations (config_key, config_value, description) VALUES
('app_name', '0379.email 多项目协同智能平台', '应用程序名称'),
('app_version', '1.0.0', '应用程序版本'),
('maintenance_mode', 'false', '维护模式开关'),
('max_upload_size', '100MB', '最大文件上传大小'),
('session_timeout', '3600', '会话超时时间(秒)');