# Docker 部署指南

## 概述

Docker 是一个开源的容器化平台，可以将应用程序及其依赖打包到一个轻量级、可移植的容器中。本指南将详细介绍如何使用 Docker 容器化部署邮件系统的各个服务，以及如何使用 Docker Compose 进行多容器协调管理。

## 环境要求

- Docker 19.03+ 或更高版本
- Docker Compose 1.25+ 或更高版本
- 足够的磁盘空间和内存

## 准备工作

### 安装 Docker

#### Ubuntu/Debian

```bash
# 更新软件包列表
apt-get update

# 安装 Docker 依赖
apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# 添加 Docker 存储库
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装 Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务
systemctl start docker
systemctl enable docker
```

#### CentOS/RHEL

```bash
# 安装 Docker 依赖
yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 存储库
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker Engine
yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务
systemctl start docker
systemctl enable docker
```

#### macOS

可以从 [Docker 官网](https://www.docker.com/products/docker-desktop) 下载并安装 Docker Desktop for Mac。

#### Windows

可以从 [Docker 官网](https://www.docker.com/products/docker-desktop) 下载并安装 Docker Desktop for Windows。

### 安装 Docker Compose

```bash
# 下载 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 创建软链接
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

## 服务 Dockerfile

为每个服务创建 Dockerfile，用于构建 Docker 镜像。

### API Server Dockerfile

创建 `/api-server/Dockerfile`：

```dockerfile
FROM node:14-alpine

# 创建工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY dist ./dist
COPY config ./config

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server.js"]
```

### Admin Server Dockerfile

创建 `/admin-server/Dockerfile`：

```dockerfile
FROM node:14-alpine

# 创建工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY dist ./dist
COPY config ./config
COPY frontend/build ./frontend/build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/server.js"]
```

### Mail Server Dockerfile

创建 `/mail-server/Dockerfile`：

```dockerfile
FROM node:14-alpine

# 创建工作目录
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY dist ./dist
COPY config ./config

# 创建附件目录
RUN mkdir -p /app/attachments

# 暴露端口
EXPOSE 3003

# 启动命令
CMD ["node", "dist/server.js"]
```

### LLM Server Dockerfile

创建 `/llm-server/Dockerfile`：

```dockerfile
FROM python:3.8-slim

# 创建工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3002

# 启动命令
CMD ["python", "main.py"]
```

## Docker Compose 配置

创建根目录下的 `docker-compose.yml` 文件，用于协调管理所有服务：

```yaml
version: '3.8'

services:
  # MongoDB 服务
  mongodb:
    image: mongo:4.4
    container_name: mongodb
    restart: always
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER:-admin}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD:-password}
      - MONGO_INITDB_DATABASE=email-system

  # Redis 服务
  redis:
    image: redis:6
    container_name: redis
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD:-password}

  # RabbitMQ 服务
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    restart: always
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER:-admin}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD:-password}

  # API Server
  api-server:
    build:
      context: ./api-server
      dockerfile: Dockerfile
    container_name: api-server
    restart: always
    depends_on:
      - mongodb
      - redis
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URL=mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-password}@mongodb:27017/email-system
      - REDIS_URL=redis://:${REDIS_PASSWORD:-password}@redis:6379

  # Admin Server
  admin-server:
    build:
      context: ./admin-server
      dockerfile: Dockerfile
    container_name: admin-server
    restart: always
    depends_on:
      - mongodb
      - redis
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGO_URL=mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-password}@mongodb:27017/email-system
      - REDIS_URL=redis://:${REDIS_PASSWORD:-password}@redis:6379

  # LLM Server
  llm-server:
    build:
      context: ./llm-server
      dockerfile: Dockerfile
    container_name: llm-server
    restart: always
    depends_on:
      - mongodb
      - redis
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - MONGO_URL=mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-password}@mongodb:27017/email-system
      - REDIS_URL=redis://:${REDIS_PASSWORD:-password}@redis:6379

  # Mail Server
  mail-server:
    build:
      context: ./mail-server
      dockerfile: Dockerfile
    container_name: mail-server
    restart: always
    depends_on:
      - mongodb
      - redis
      - rabbitmq
    ports:
      - "3003:3003"
    volumes:
      - mail_attachments:/app/attachments
    environment:
      - NODE_ENV=production
      - PORT=3003
      - MONGO_URL=mongodb://${MONGO_USER:-admin}:${MONGO_PASSWORD:-password}@mongodb:27017/email-system
      - REDIS_URL=redis://:${REDIS_PASSWORD:-password}@redis:6379
      - RABBITMQ_URL=amqp://${RABBITMQ_USER:-admin}:${RABBITMQ_PASSWORD:-password}@rabbitmq:5672

volumes:
  mongo_data:
  mongo_config:
  redis_data:
  rabbitmq_data:
  mail_attachments:
```

## 环境变量配置

创建 `.env` 文件，用于设置环境变量：

```dotenv
# MongoDB 配置
MONGO_USER=admin
MONGO_PASSWORD=your-secure-mongo-password

# Redis 配置
REDIS_PASSWORD=your-secure-redis-password

# RabbitMQ 配置
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your-secure-rabbitmq-password

# SMTP 配置（如果需要）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

## 构建和运行

### 构建镜像

在项目根目录下执行以下命令，构建所有服务的 Docker 镜像：

```bash
docker-compose build
```

### 运行容器

使用 Docker Compose 启动所有服务：

```bash
docker-compose up -d
```

参数说明：

- `-d`: 后台运行容器

### 查看状态

查看所有容器的运行状态：

```bash
docker-compose ps
```

查看服务日志：

```bash
docker-compose logs -f
```

查看特定服务日志：

```bash
docker-compose logs -f api-server
```

## 常见操作

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 更新服务

1. 更新代码
2. 重新构建镜像：

   ```bash
   docker-compose build
   ```

3. 重启服务：

   ```bash
   docker-compose up -d
   ```

### 进入容器

```bash
docker exec -it <container_name> /bin/sh
```

例如，进入 API Server 容器：

```bash
docker exec -it api-server /bin/sh
```

## 数据持久化

Docker Compose 配置中已设置了数据卷，用于持久化存储：

- `mongo_data`: MongoDB 数据
- `mongo_config`: MongoDB 配置
- `redis_data`: Redis 数据
- `rabbitmq_data`: RabbitMQ 数据
- `mail_attachments`: 邮件附件

## 性能优化建议

1. **使用多阶段构建**：优化 Dockerfile，减小镜像体积
2. **合理设置资源限制**：为容器设置 CPU 和内存限制
3. **使用健康检查**：配置容器健康检查，确保服务正常运行
4. **优化存储驱动**：选择适合的 Docker 存储驱动
5. **使用 Docker 镜像缓存**：合理安排 Dockerfile 指令顺序，提高构建效率

## 常见问题排查

1. **容器启动失败**
   - 检查环境变量配置
   - 查看容器日志：`docker-compose logs <service_name>`
   - 确认端口没有被占用

2. **服务间通信问题**
   - 检查网络配置
   - 确认服务名称与 `docker-compose.yml` 中配置一致
   - 验证依赖服务是否正常运行

3. **数据持久化问题**
   - 检查数据卷挂载是否正确
   - 确认文件权限设置

4. **性能问题**
   - 增加容器资源限制
   - 检查数据库查询性能
   - 监控容器资源使用情况：`docker stats`
