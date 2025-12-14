# 邮件平台功能整合架构设计

> **YYC³ 项目文档**
> 
> @project YYC³ Email Platform
> @type 技术架构
> @version 1.0.0
> @created 2025-12-08
> @updated 2025-12-08
> @author YYC³ <admin@0379.email>
> @url https://github.com/YY-Nexus/0379-email-platform


## 1. 整体架构概述

基于对现有代码的分析，我们将构建一个完整的邮件平台应用，采用以下架构模式：

- **前端框架**：Next.js 14+ (App Router)
- **状态管理**：React Context + 自定义 Hooks
- **组件结构**：原子化设计模式（Atomic Design）
- **API集成**：统一的服务层封装
- **数据流**：单向数据流 + 事件驱动架构

## 2. 目录结构优化

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 收件箱主页面
│   ├── compose/           # 邮件撰写页面
│   ├── inbox/             # 收件箱路由组
│   ├── sent/              # 已发送邮件路由组
│   ├── drafts/            # 草稿箱路由组
│   ├── starred/           # 星标邮件路由组
│   ├── trash/             # 垃圾箱路由组
│   └── email/             # 邮件详情动态路由
│       └── [id]/page.tsx
├── components/             # 组件目录
│   ├── atoms/             # 原子组件（按钮、输入框等）
│   ├── molecules/         # 分子组件（表单、列表项等）
│   ├── organisms/         # 生物组件（完整功能块）
│   ├── templates/         # 页面模板
│   ├── common/            # 公共组件（已存在）
│   ├── mail/              # 邮件相关组件（已存在）
│   └── ui/                # UI组件库（已存在）
├── context/                # React Context
│   ├── ThemeContext.tsx   # 主题上下文（已存在）
│   └── EmailContext.tsx   # 邮件上下文（新建）
├── hooks/                  # 自定义Hooks
│   ├── useEmails.ts       # 邮件管理Hook
│   └── useEmailActions.ts # 邮件操作Hook
├── services/               # API服务
│   └── api.ts             # 统一API服务（已存在）
├── types/                  # TypeScript类型
│   └── index.ts           # 类型定义（已存在）
├── utils/                  # 工具函数
│   ├── formatters.ts      # 格式化工具
│   └── validators.ts      # 验证工具
└── theme/                  # 主题配置
    └── index.ts           # 主题定义（已存在）
```

## 3. 组件层次结构

### 3.1 原子组件（atoms）
- Button
- Input
- Checkbox
- IconButton
- Avatar
- Badge
- Tooltip
- Spinner

### 3.2 分子组件（molecules）
- EmailHeader
- EmailActions
- AttachmentList
- RecipientInput
- SearchBar
- FilterBar

### 3.3 生物组件（organisms）
- EmailListItem（已存在，需优化）
- EmailList（已存在，需优化）
- EmailDetail（已存在，需优化）
- EmailComposer（已存在，需优化）
- MailSidebar
- MailToolbar

### 3.4 模板组件（templates）
- MailLayout
- ComposerLayout
- DetailLayout

## 4. 状态管理设计

### 4.1 EmailContext 设计

我们将创建一个EmailContext来管理全局邮件状态，包括：

```typescript
interface EmailContextType {
  // 邮件数据
  emails: Email[];
  currentEmail: Email | null;
  selectedEmails: string[];
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'detail' | 'compose';
  
  // 操作方法
  fetchEmails: (filter?: EmailFilter) => Promise<void>;
  getEmailById: (id: string) => Promise<void>;
  sendEmail: (email: NewEmail) => Promise<void>;
  deleteEmails: (ids: string[]) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  markAsRead: (ids: string[], read: boolean) => Promise<void>;
  selectEmail: (id: string, selected: boolean) => void;
  selectAllEmails: (selected: boolean) => void;
  setViewMode: (mode: 'list' | 'detail' | 'compose') => void;
}
```

### 4.2 自定义Hooks

- **useEmails**：封装邮件列表操作逻辑
- **useEmailActions**：封装单个邮件操作逻辑
- **useEmailSelection**：封装邮件选择逻辑
- **useEmailFilter**：封装邮件过滤和排序逻辑

## 5. 路由规划

| 路径 | 页面组件 | 功能描述 |
|------|----------|----------|
| `/` | `InboxPage` | 收件箱主页面 |
| `/compose` | `ComposePage` | 邮件撰写页面 |
| `/email/[id]` | `EmailDetailPage` | 邮件详情页面 |
| `/sent` | `SentPage` | 已发送邮件页面 |
| `/drafts` | `DraftsPage` | 草稿箱页面 |
| `/starred` | `StarredPage` | 星标邮件页面 |
| `/trash` | `TrashPage` | 垃圾箱页面 |

## 6. API集成策略

### 6.1 统一API服务层

基于现有的api.ts，我们将进一步扩展和优化：

```typescript
// 邮件服务增强
export const emailService = {
  // 基本操作
  getAll: (filter?: EmailFilter) => api.get('/emails', { params: filter }),
  getById: (id: string) => api.get(`/emails/${id}`),
  create: (email: NewEmail) => api.post('/emails', email),
  update: (id: string, data: Partial<Email>) => api.patch(`/emails/${id}`, data),
  delete: (ids: string[]) => api.delete('/emails', { data: { ids } }),
  
  // 批量操作
  markAsRead: (ids: string[], read: boolean) => api.post('/emails/batch/mark-read', { ids, read }),
  toggleStar: (ids: string[], starred: boolean) => api.post('/emails/batch/toggle-star', { ids, starred }),
  moveToFolder: (ids: string[], folder: string) => api.post('/emails/batch/move', { ids, folder }),
  
  // 附件操作
  uploadAttachment: (file: File) => api.post('/attachments', file, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadAttachment: (id: string) => api.get(`/attachments/${id}`, { responseType: 'blob' }),
  
  // 搜索和过滤
  search: (query: string, filter?: EmailFilter) => api.get('/emails/search', { params: { q: query, ...filter } }),
};
```

### 6.2 请求拦截和错误处理

增强现有的请求拦截器，添加统一的错误处理和重试机制：

```typescript
// 请求拦截器优化
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器优化
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 处理401错误（未授权）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // 尝试刷新token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 7. 数据流设计

### 7.1 单向数据流

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   UI组件        │────▶│   Context       │────▶│   API服务层     │
│   (Events)      │     │   (State)       │     │   (Data)        │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 7.2 关键数据流程

#### 7.2.1 邮件列表加载流程
1. 组件通过useEmails Hook调用fetchEmails
2. Context设置isLoading为true
3. API服务调用后端接口获取数据
4. 返回数据更新Context中的emails状态
5. Context设置isLoading为false
6. 组件重新渲染显示邮件列表

#### 7.2.2 邮件操作流程（如删除、标记）
1. 组件触发操作（如点击删除按钮）
2. Context更新本地状态（乐观更新）
3. API服务调用后端接口执行操作
4. 成功后保持更新，失败则回滚状态

## 8. 性能优化策略

### 8.1 组件优化
- 使用React.memo和useMemo减少不必要的重渲染
- 实现虚拟滚动处理大量邮件列表
- 延迟加载非关键组件

### 8.2 数据优化
- 实现邮件列表的分页加载
- 添加数据缓存机制，减少重复请求
- 实现增量更新，只获取新邮件

### 8.3 渲染优化
- 使用代码分割减少初始加载时间
- 实现图片懒加载
- 优化CSS选择器和样式计算

## 9. 整合实施计划

### 9.1 第一阶段：基础设施搭建
- 创建EmailContext和相关Hooks
- 优化API服务层
- 完善类型定义

### 9.2 第二阶段：组件整合
- 重构现有组件，使其与新架构兼容
- 实现组件之间的通信和状态同步
- 优化组件性能

### 9.3 第三阶段：功能完善
- 实现完整的邮件操作功能
- 添加搜索和过滤功能
- 实现附件管理功能

### 9.4 第四阶段：测试和优化
- 编写单元测试和集成测试
- 性能测试和优化
- 用户体验优化

## 10. 技术债务和风险评估

### 10.1 现有技术债务
- 缺少统一的状态管理
- 组件间耦合度高
- 缺少完善的错误处理

### 10.2 潜在风险
- 数据模型变更可能导致兼容性问题
- 大量邮件数据可能影响性能
- API调用失败需要良好的降级策略

---

本架构设计为邮件平台的功能整合提供了清晰的指导框架。通过采用模块化、组件化的设计理念，我们将创建一个可维护、可扩展的邮件应用系统。后续实施过程中，可根据实际情况对设计进行调整和优化。