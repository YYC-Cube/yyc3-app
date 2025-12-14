# 🚀 邮件平台API服务Dockerfile
# @file Dockerfile
# @description API服务的Docker容器构建配置
# @author YYC
# @version 1.0.0
# @created 2024-10-15

# ===== 构建阶段 =====
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY src/ ./src/
COPY tsconfig.json ./

# 构建项目
RUN npm run build

# ===== 运行阶段 =====
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制环境变量示例文件
COPY .env.example ./

# 设置文件权限
RUN chown -R appuser:nodejs /app

# 切换到非root用户
USER appuser

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1