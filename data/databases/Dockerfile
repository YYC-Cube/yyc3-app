# PostgreSQL MCP Server Docker Image
FROM oven/bun:1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Development stage
FROM base AS dev
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies including dev dependencies
RUN bun install --frozen-lockfile

# Production build stage
FROM base AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (if needed)
# RUN bun run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcpserver

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app ./

# Create logs directory
RUN mkdir -p logs && \
    chown -R mcpserver:nodejs /app

# Switch to non-root user
USER mcpserver

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun run health-check || exit 1

# Expose port (if using HTTP mode)
# EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Start the application
CMD ["bun", "run", "index.ts"]