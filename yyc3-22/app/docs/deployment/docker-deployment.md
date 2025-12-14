# Docker Compose 部署方式

## 配置文件

- **配置路径**：/Users/yanyu/www/yyc3-22/app/docker-compose.yml

## 配置示例

```yaml
version: '3.8'

services:
  api-server:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    container_name: api-server
    ports:
      - '6600:3000'
    volumes:
      - ./services/api:/app
    restart: always
    environment:
      - NODE_ENV=production
      - API_PORT=3000

  admin-server:
    build:
      context: ./services/admin
      dockerfile: Dockerfile
    container_name: admin-server
    ports:
      - '6601:3001'
    volumes:
      - ./services/admin:/app
    restart: always
    environment:
      - NODE_ENV=production
      - API_PORT=3001

  llm-server:
    build:
      context: ./services/llm
      dockerfile: Dockerfile
    container_name: llm-server
    ports:
      - '6602:3002'
    volumes:
      - ./services/llm:/app
    restart: always
    environment:
      - NODE_ENV=production
      - API_PORT=3002

  mail-server:
    build:
      context: ./services/mail
      dockerfile: Dockerfile
    container_name: mail-server
    ports:
      - '6603:3105'
    volumes:
      - ./services/mail:/app
    restart: always
    environment:
      - NODE_ENV=production
      - API_PORT=3105
```

## 服务 Dockerfile 示例

```dockerfile
# 使用 Node.js 官方镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
```

## 常用命令

### 构建并启动服务

```bash
docker-compose up -d
```

### 构建镜像

```bash
docker-compose build
```

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
docker-compose logs

# 查看特定服务日志
docker-compose logs api-server
```

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 进入容器

```bash
docker-compose exec api-server sh
```

## 环境变量配置

服务启动时可以通过环境变量配置以下参数：

- `NODE_ENV`: 运行环境 (production/development)
- `API_PORT`: 服务端口
- `API_HOST`: 服务主机地址
- `LOG_LEVEL`: 日志级别
