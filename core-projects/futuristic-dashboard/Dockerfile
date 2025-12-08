# 使用 Node.js 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --frozen-lockfile

# 拷贝源代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 使用轻量级镜像运行
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 拷贝构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 安装生产依赖
RUN npm install --omit=dev --ignore-scripts

EXPOSE 3000

CMD ["npm", "run", "start"]
