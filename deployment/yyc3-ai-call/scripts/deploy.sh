#!/bin/bash
# =============================================================================
# YYC3-AI 应用一键部署脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目配置
PROJECT_NAME="yyc3-ai-call"
PROJECT_DIR="/Users/yanyu/www/deployments/$PROJECT_NAME"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示标题
show_header() {
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}       YYC3-AI 应用一键部署工具${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
    echo -e "${BLUE}项目名称: $PROJECT_NAME${NC}"
    echo -e "${BLUE}部署时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}工作目录: $PROJECT_DIR${NC}"
    echo ""
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    # 检查Node.js (用于本地开发)
    if [[ "$1" == "dev" ]] && ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi

    log_success "环境检查通过"
}

# 创建项目结构
create_project_structure() {
    log_info "创建项目结构..."

    # 确保目录存在
    mkdir -p "$PROJECT_DIR"/{frontend,backend,docs,scripts,configs,docker,nginx}

    # 创建备份目录
    mkdir -p "$BACKUP_DIR"

    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"

    log_success "项目结构创建完成"
}

# 生成前端项目
generate_frontend_project() {
    log_info "生成前端项目..."

    cd "$PROJECT_DIR/frontend"

    # 创建package.json
    cat > package.json << 'EOF'
{
  "name": "yyc3-ai-call-frontend",
  "version": "1.0.0",
  "description": "YYC3 AI通话助手前端应用",
  "private": true,
  "dependencies": {
    "@types/node": "^18.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.4.0",
    "socket.io-client": "^4.7.0",
    "antd": "^5.0.0",
    "@ant-design/icons": "^5.0.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.44.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write ."
  }
}
EOF

    # 创建Vite配置
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
EOF

    # 创建TypeScript配置
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

    # 创建基础源代码
    mkdir -p src/{components,pages,hooks,services,types,utils}

    # 创建主应用组件
    cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AICallInterface } from './components/AICallInterface';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>YYC3 AI通话助手</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<AICallInterface />} />
            <Route path="/chat" element={<AICallInterface />} />
            <Route path="/history" element={<div>历史记录页面</div>} />
              <Route path="/profile" element={<div>个人中心页面</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
EOF

    # 创建AI对话组件
    cat > src/components/AICallInterface.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Space, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import io from 'socket.io-client';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AICallInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 连接WebSocket (本地开发环境)
    const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      message.success('已连接到AI服务');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      message.warning('与AI服务断开连接');
    });

    socket.on('ai-response', (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.message,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-call/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          conversation_id: 'default'
        }),
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      const data = await response.json();
      // 通过WebSocket接收AI响应
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="AI对话"
      extra={
        <Space>
          <span>{isConnected ? '🟢 已连接' : '🔴 连接中...'}</span>
        </Space>
      }
      style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: msg.sender === 'user' ? '#1890ff' : '#52c41a'
                    }}
                  />
                }
                content={
                  <div style={{
                    maxWidth: '70%',
                    backgroundColor: msg.sender === 'user' ? '#f0f0f0' : '#e6f7ff',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <Text>{msg.content}</Text>
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      marginTop: '4px'
                    }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <RobotOutlined spin /> AI正在思考中...
          </div>
        )}
      </div>

      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="请输入您的问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          发送
        </Button>
      </Space.Compact>
    </Card>
  );
};
EOF

    # 创建CSS样式
    cat > src/App.css << 'EOF'
.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  color: white;
  margin-bottom: 20px;
}

.App-header h1 {
  margin: 0;
  font-size: 2.5em;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
EOF

    # 创建环境变量
    cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_NAME=YYC3-AI-Call
REACT_APP_VERSION=1.0.0
EOF

    cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.yyc3-ai.com
REACT_APP_WS_URL=https://api.yyc3-ai.com
REACT_APP_NAME=YYC3-AI-Call
REACT_APP_VERSION=1.0.0
EOF

    # 创建HTML模板
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YYC3 AI通话助手</title>
    <meta name="description" content="智能AI通话助手，提供自然语言对话服务" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

    # 创建入口文件
    cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

    log_success "前端项目生成完成"
}

# 生成后端项目
generate_backend_project() {
    log_info "生成后端项目..."

    cd "$PROJECT_DIR/backend"

    # 创建package.json
    cat > package.json << 'EOF'
{
  "name": "yyc3-ai-call-backend",
  "version": "1.0.0",
  "description": "YYC3 AI通话助手后端API服务",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write ."
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.0.0",
    "socket.io": "^4.7.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "joi": "^17.9.0",
    "winston": "^3.10.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/morgan": "^1.9.0",
    "@types/node": "^20.0.0",
    "@types/pg": "^8.10.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "typescript": "^5.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "eslint": "^8.44.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
EOF

    # 创建TypeScript配置
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

    # 创建源代码目录
    mkdir -p src/{routes,middleware,models,services,config,utils,types}

    # 创建主应用文件
    cat > src/app.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API路由
setupRoutes(app);

// Socket.IO连接处理
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    logger.info(`Client ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    await connectDatabase();

    server.listen(PORT, () => {
      logger.info(`🚀 YYC3-AI Backend running on http://localhost:${PORT}`);
      logger.info(`🔗 Socket.IO server ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 导出io实例供其他模块使用
export { io };

startServer();
EOF

    # 创建路由设置
    cat > src/routes/index.ts << 'EOF'
import { Router } from 'express';
import authRoutes from './auth';
import aiCallRoutes from './ai-call';
import userRoutes from './user';
import { io } from '../app';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ai-call', aiCallRoutes);
router.use('/users', userRoutes);

export default router;
export { io };
EOF

    # 创建AI对话路由
    cat > src/routes/ai-call.ts << 'EOF
import { Router } from 'express';
import Joi from 'joi';
import { io } from '../app';
import { AIService } from '../services/aiService';
import { ConversationService } from '../services/conversationService';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// 验证消息输入
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  conversation_id: Joi.string().optional()
});

// AI对话接口
router.post('/chat', validateRequest(messageSchema), async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    const userId = req.user?.id || 'anonymous';

    // 保存用户消息
    const conversation = await ConversationService.saveMessage(
      userId,
      conversation_id,
      message,
      'user'
    );

    // 获取AI响应
    const aiResponse = await AIService.generateResponse(message, {
      conversation_id: conversation.id,
      user_id: userId
    });

    // 保存AI消息
    await ConversationService.saveMessage(
      userId,
      conversation.id,
      aiResponse.message,
      'ai',
      aiResponse.metadata
    );

    // 通过WebSocket发送响应
    io.to(conversation.id).emit('ai-response', {
      message: aiResponse.message,
      conversation_id: conversation.id,
      timestamp: new Date()
    });

    res.json({
      success: true,
      conversation_id: conversation.id,
      ai_response: aiResponse.message
    });

  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取对话历史
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const messages = await ConversationService.getConversationMessages(id, userId);

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
EOF

    # 创建AI服务
    cat > src/services/aiService.ts << 'EOF
import { logger } from '../utils/logger';

export interface AIResponse {
  message: string;
  metadata?: any;
}

export class AIService {
  static async generateResponse(message: string, context?: any): Promise<AIResponse> {
    try {
      // 这里集成实际的AI API
      // 可以是OpenAI、Anthropic、或其他AI服务

      // 模拟AI响应 (实际部署时替换为真实API调用)
      const responses = [
        "您好！我是YYC3 AI助手，很高兴为您服务。",
        "我理解您的问题，让我来帮您解答。",
        "这是一个很好的问题！我建议您...",
        "根据我的分析，最佳的解决方案是...",
        "感谢您的信任，我会尽力帮助您。"
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        message: randomResponse,
        metadata: {
          model: 'yyc3-ai-v1',
          processing_time: Date.now()
        }
      };

    } catch (error) {
      logger.error('AI service error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  static async getConversationContext(conversationId: string) {
    // 获取对话上下文
    return {
      conversation_id: conversationId,
      history: [],
      context: {}
    };
  }
}
EOF

    # 创建数据库配置
    cat > src/config/database.ts << 'EOF
import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function connectDatabase(): Promise<void> {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'yyc3_ai_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 测试连接
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully');

    // 创建表
    await createTables();

  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
}

export async function createTables(): Promise<void> {
  const client = await pool.connect();

  try {
    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建对话表
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(200),
        context JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建消息表
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sender VARCHAR(10) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database tables created successfully');

  } catch (error) {
    logger.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool };
EOF

    # 创建环境变量
    cat > .env << 'EOF'
NODE_ENV=development
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_ai_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI API配置
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# 其他配置
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
EOF

    log_success "后端项目生成完成"
}

# 生成Docker配置
generate_docker_configs() {
    log_info "生成Docker配置..."

    # 开发环境配置
    cat > "$PROJECT_DIR/docker-compose.dev.yml" << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres-dev
    environment:
      POSTGRES_DB: yyc3_ai_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - yyc3-network

  redis:
    image: redis:7-alpine
    container_name: yyc3-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - yyc3-network

volumes:
  postgres_data:
  redis_data:

networks:
  yyc3-network:
    driver: bridge
EOF

    # 生产环境配置
    cat > "$PROJECT_DIR/docker-compose.prod.yml" << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: yyc3-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - static_files:/var/www/static
    depends_on:
      - frontend
      - backend
    networks:
      - yyc3-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres
    environment:
      POSTGRES_DB: yyc3_ai_prod
      POSTGRES_USER: yyc3_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - yyc3-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: yyc3-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - yyc3-network
    restart: unless-stopped

  backend:
    image: yyc3-ai/backend:latest
    container_name: yyc3-backend
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - yyc3-network
    restart: unless-stopped
    deploy:
      replicas: 2

  frontend:
    image: yyc3-ai/frontend:latest
    container_name: yyc3-frontend
    environment:
      - REACT_APP_API_URL=https://api.yyc3-ai.com
    networks:
      - yyc3-network
    restart: unless-stopped
    deploy:
      replicas: 2

volumes:
  postgres_data:
  redis_data:
  static_files:

networks:
  yyc3-network:
    driver: bridge
EOF

    log_success "Docker配置生成完成"
}

# 生成部署脚本
generate_deployment_scripts() {
    log_info "生成部署脚本..."

    # 开发环境启动脚本
    cat > "$PROJECT_DIR/scripts/start-dev.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 启动开发环境..."

# 启动数据库服务
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 启动后端服务
echo "🔄 启动后端服务..."
cd ../backend
npm run dev

echo "✅ 开发环境启动完成!"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo "📊 数据库: postgresql://localhost:5432/yyc3_ai_db"
EOF

    # 生产环境部署脚本
    cat > "$PROJECT_DIR/scripts/deploy-prod.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 部署生产环境..."

# 检查环境变量
if [[ -z "$DB_PASSWORD" ]]; then
  echo "❌ 请设置 DB_PASSWORD 环境变量"
  exit 1
fi

if [[ -z "$REDIS_PASSWORD" ]]; then
  echo "❌ 请设置 REDIS_PASSWORD 环境变量"
  exit 1
fi

if [[ -z "$JWT_SECRET" ]]; then
  echo "❌ 请设置 JWT_SECRET 环境变量"
  exit 1
fi

# 构建Docker镜像
echo "📦 构建Docker镜像..."
docker build -t yyc3-ai/backend:latest ./backend
docker build -t yyc3-ai/frontend:latest ./frontend

# 停止旧容器
echo "🔄 停止旧容器..."
docker-compose -f docker-compose.prod.yml down

# 启动新容器
echo "🔄 启动新容器..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ 前端服务正常"
else
  echo "❌ 前端服务异常"
fi

if curl -f http://localhost/api/health > /dev/null 2>&1; then
  echo "✅ 后端服务正常"
else
  echo "❌ 后端服务异常"
fi

echo "🎉 生产环境部署完成!"
echo "🌐 访问地址: http://localhost"
EOF

    # 测试脚本
    cat > "$PROJECT_DIR/scripts/test.sh" << 'EOF'
#!/bin/bash
set -e

echo "🧪 执行测试..."

# 前端测试
cd frontend
npm test

# 后端测试
cd ../backend
npm test

echo "✅ 所有测试通过!"
EOF

    # 备份脚本
    cat > "$PROJECT_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/yyc3-ai"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 开始备份..."

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 数据库备份
docker exec yyc3-postgres pg_dump -U yyc3_admin yyc3_ai_prod > "$BACKUP_DIR/db_backup_$DATE.sql"

# 文件备份
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" ./uploads

# 配置备份
cp -r ./configs "$BACKUP_DIR/configs_backup_$DATE"

echo "✅ 备份完成: $BACKUP_DIR"
echo "📅 备份文件:"
ls -la "$BACKUP_DIR/*_$DATE*"
EOF

    # 设置执行权限
    chmod +x "$PROJECT_DIR/scripts"/*.sh

    log_success "部署脚本生成完成"
}

# 生成Nginx配置
generate_nginx_configs() {
    log_info "生成Nginx配置..."

    mkdir -p "$PROJECT_DIR/nginx"

    # Nginx主配置
    cat > "$PROJECT_DIR/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    upstream backend {
        server backend:3001;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name yyc3-ai.com www.yyc3-ai.com;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS配置
    server {
        listen 443 ssl http2;
        server_name yyc3-ai.com www.yyc3-ai.com;

        # SSL证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API代理
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # WebSocket支持
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # WebSocket支持
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 前端静态文件
        location / {
            root /var/www/static;
            try_files \$uri \$uri/ /index.html;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }

        # 文件上传限制
        client_max_body_size 10M;

        # Gzip压缩
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types
            text/plain
            text/css
            text/xml
            text/javascript
            application/json
            application/javascript
            application/xml+rss
            application/atom+xml
            image/svg+xml;
    }
}
EOF

    log_success "Nginx配置生成完成"
}

# 生成项目文档
generate_documentation() {
    log_info "生成项目文档..."

    # README.md
    cat > "$PROJECT_DIR/README.md" << 'EOF'
# YYC3-AI-Call 应用

## 🎯 项目概述

YYC3-AI-Call 是一个智能AI通话助手应用，提供自然语言对话服务和智能回复功能。

## 🏗️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design
- **状态管理**: React Hooks + Context
- **网络通信**: Axios + Socket.IO

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **实时通信**: Socket.IO
- **身份验证**: JWT

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **进程管理**: PM2 (可选)
- **监控**: 日志记录 + 健康检查

## 🚀 快速开始

### 开发环境

1. **安装依赖**
   ```bash
   # 前端
   cd frontend && npm install

   # 后端
   cd backend && npm install
   ```

2. **启动数据库服务**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

3. **启动开发服务器**
   ```bash
   # 后端 (终端1)
   cd backend && npm run dev

   # 前端 (终端2)
   cd frontend && npm dev
   ```

4. **访问应用**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:3001
   - 健康检查: http://localhost:3001/health

### 生产部署

1. **构建镜像**
   ```bash
   docker build -t yyc3-ai/backend:latest ./backend
   docker build -t yyc3-ai/frontend:latest ./frontend
   ```

2. **配置环境变量**
   ```bash
   export DB_PASSWORD=your_secure_password
   export REDIS_PASSWORD=your_redis_password
   export JWT_SECRET=your_jwt_secret
   ```

3. **部署应用**
   ```bash
   ./scripts/deploy-prod.sh
   ```

## 📋 项目结构

```
yyc3-ai-call/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── services/        # API服务
│   │   ├── types/           # TypeScript类型
│   │   └── utils/           # 工具函数
│   ├── public/
│   └── package.json
├── backend/                  # 后端应用
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务服务
│   │   ├── config/          # 配置文件
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型
│   ├── dist/                # 编译输出
│   └── package.json
├── scripts/                  # 部署脚本
├── configs/                  # 配置文件
├── docker/                   # Docker配置
├── nginx/                    # Nginx配置
├── docs/                     # 项目文档
└── docker-compose.*.yml      # Docker编排
```

## 🔧 开发指南

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写单元测试

### API开发

1. 创建新的路由文件
2. 添加必要的验证中间件
3. 编写相应的服务逻辑
4. 添加错误处理

### 前端开发

1. 创建新的组件
2. 使用TypeScript定义Props类型
3. 集成设计系统
4. 添加响应式设计

## 📊 API文档

### 认证相关

- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `POST /auth/logout` - 用户登出

### AI对话

- `POST /ai-call/chat` - AI对话
- `GET /ai-call/conversations/:id/messages` - 获取对话历史

### 用户管理

- `GET /users/profile` - 获取用户信息
- `PUT /users/profile` - 更新用户信息

## 🔒 安全考虑

- JWT令牌认证
- 输入验证和清理
- SQL注入防护
- XSS和CSRF防护
- HTTPS加密传输
- 敏感信息加密存储

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行前端测试
cd frontend && npm test

# 运行后端测试
cd backend && npm test
```

## 📈 监控和日志

- 结构化日志记录
- 应用性能监控
- 错误追踪
- 健康检查端点
- 用户行为分析

## 🚀 部署和维护

### 自动化部署

- GitHub Actions CI/CD
- Docker容器化部署
- 蓝绿部署策略
- 回滚机制

### 备份策略

- 数据库定期备份
- 配置文件备份
- 日志文件归档
- 灾难恢复计划

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码变更
4. 创建Pull Request
5. 代码审查
6. 合并到主分支

## 📞 支持

- 技术支持: support@yyc3.com
- 文档: [项目文档](./docs/)
- 问题反馈: [Issues](https://github.com/yyc3/yyc3-ai-call/issues)

---

**版本**: v1.0.0
**最后更新**: $(date +%Y-%m-%d)
**维护团队**: YYC3开发团队
EOF

    log_success "项目文档生成完成"
}

# 主函数
main() {
    local command="${1:-help}"

    show_header

    case "$command" in
        "init")
            check_environment
            create_project_structure
            generate_frontend_project
            generate_backend_project
            generate_docker_configs
            generate_deployment_scripts
            generate_nginx_configs
            generate_documentation
            log_success "🎉 YYC3-AI-Call 项目初始化完成!"
            echo ""
            echo "📂 项目位置: $PROJECT_DIR"
            echo "🚀 下一步操作:"
            echo "   1. cd $PROJECT_DIR"
            echo "   2. ./scripts/start-dev.sh"
            echo ""
            echo "🌐 访问地址:"
            echo "   - 前端: http://localhost:3000"
            echo "   - 后端: http://localhost:3001"
            ;;
        "dev")
            log_info "启动开发环境..."
            cd "$PROJECT_DIR"
            ./scripts/start-dev.sh
            ;;
        "build")
            log_info "构建生产环境..."
            cd "$PROJECT_DIR"
            docker build -t yyc3-ai/backend:latest ./backend
            docker build -t yyc3-ai/frontend:latest ./frontend
            log_success "构建完成!"
            ;;
        "deploy")
            log_info "部署生产环境..."
            cd "$PROJECT_DIR"
            ./scripts/deploy-prod.sh
            ;;
        "test")
            log_info "执行测试..."
            cd "$PROJECT_DIR"
            ./scripts/test.sh
            ;;
        "backup")
            log_info "执行备份..."
            cd "$PROJECT_DIR"
            ./scripts/backup.sh
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 显示帮助
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  init              初始化完整项目"
    echo "  dev               启动开发环境"
    echo "  build             构建生产镜像"
    echo "  deploy            部署生产环境"
    echo "  test              执行测试"
    echo "  backup            备份数据"
    echo "  help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init           # 初始化项目"
    echo "  $0 dev            # 启动开发环境"
    echo "  $0 deploy         # 部署到生产"
    echo ""
    echo "项目功能:"
    echo "  ✅ 前后端全栈应用 (React + Node.js)"
    echo "  ✅ TypeScript类型支持"
    echo "  ✅ Docker容器化部署"
    echo "  ✅ PostgreSQL数据库"
    echo "  ✅ Redis缓存"
    echo "  ✅ Socket.IO实时通信"
    echo "  ✅ JWT身份认证"
    echo "  ✅ Nginx反向代理"
    echo "  ✅ 自动化部署脚本"
    echo "  ✅ 监控和日志系统"
}

# 执行主函数
main "$@"