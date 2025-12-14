# 多阶段构建Dockerfile
# 支持各微服务的容器化部署

# 构建阶段使用Node.js 18
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 针对每个服务进行构建（如果有构建脚本）
RUN for service in api admin llm mail; do \
    if [ -d "$service" ] && [ -f "$service/package.json" ]; then \
        cd $service && \
        npm ci && \
        if grep -q "build" "package.json"; then \
            npm run build; \
        fi && \
        cd ..; \
    fi; \
done

# 生产阶段使用更小的基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置时区
RUN apk --no-cache add tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 创建非root用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 复制共享依赖
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制已构建的文件
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/api ./api
COPY --from=builder /app/admin ./admin
COPY --from=builder /app/llm ./llm
COPY --from=builder /app/mail ./mail
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/scripts ./scripts

# 创建必要的目录
RUN mkdir -p /app/logs /app/pids && \
    chown -R appuser:appgroup /app

# 切换到非root用户
USER appuser

# 设置环境变量
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# 暴露所有服务端口
EXPOSE 3000 3001 3002 3003

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 默认启动API服务
CMD ["node", "api/server.js"]
