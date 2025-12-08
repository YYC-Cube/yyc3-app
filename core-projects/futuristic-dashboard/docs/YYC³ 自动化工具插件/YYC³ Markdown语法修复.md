# YYC³ Markdown语法修复 （脚本 + 插件依赖方案）

一套 **脚本 + 插件依赖方案**，帮助团队自动解决 Markdown 语法问题，提升文档质量与开发效率。  

---

## ✅ Markdown 自动化工具方案

### 1. 脚本工具（命令行自动化）

#### **markdownlint-cli2**

- 功能：检测并修复 Markdown 语法错误（标题层级、列表缩进、空格等）。
- 安装：

  ```bash
  npm install -D markdownlint-cli2
  ```

- 使用：

  ```bash
  npx markdownlint-cli2 "**/*.md"
  ```

- 自动修复：

  ```bash
  npx markdownlint-cli2-fix "**/*.md"
  ```

#### **prettier**

- 功能：统一 Markdown 格式（缩进、换行、引号）。
- 安装：

  ```bash
  npm install -D prettier
  ```

- 使用：

  ```bash
  npx prettier --write "**/*.md"
  ```

---

### 2. 编辑器插件（VS Code 推荐）

- **Markdown All in One**  
  提供快捷键、目录生成、自动格式化。  
- **markdownlint**  
  实时检测 Markdown 语法错误。  
- **Prettier - Code formatter**  
  保存时自动格式化 Markdown 文件。  

---

## 3. Git Hook 自动化（保证团队协作一致性）

使用 **Husky + lint-staged** 在提交前自动检查 Markdown：

```bash
npm install -D husky lint-staged
```

在 `package.json` 中配置：

```json
{
  "lint-staged": {
    "*.md": [
      "prettier --write",
      "markdownlint-cli2-fix"
    ]
  }
}
```

初始化 Husky：

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

这样每次提交都会自动修复 Markdown。

---

## 4. CI/CD 集成（保证发布前文档质量）

在 GitHub Actions 中加入 Markdown 检查：

```yaml
- name: Lint Markdown
  run: npx markdownlint-cli2 "**/*.md"
```

---

## ✨ 优势总结

- ✅ **本地开发**：VS Code 插件实时提示错误  
- ✅ **自动修复**：Prettier + markdownlint-cli2 一键修复  
- ✅ **团队协作**：Husky + lint-staged 保证提交前一致性  
- ✅ **CI/CD**：流水线检查，避免不规范文档进入主分支  

🌹 **闭环建议**：  
可以把这些工具打包到 Monorepo 的 **docs 模块**，作为团队统一的文档质量保障方案。  

---

## **统一的文档工作流（文档目录结构 + 自动生成 TOC + 国际化支持）** 让 Markdown 文档管理更高效

---

## ✅ 文档工作流设计方案

### 1. 文档目录结构（模块化 + 国际化）

```
docs/
├── en/                        # 英文文档
│   ├── getting-started.md
│   ├── guides/
│   │   ├── installation.md
│   │   └── usage.md
│   └── reference/
│       └── api.md
├── zh/                        # 中文文档
│   ├── getting-started.md
│   ├── guides/
│   │   ├── installation.md
│   │   └── usage.md
│   └── reference/
│       └── api.md
├── i18n/                      # 国际化配置
│   └── locales.json           # 语言映射配置
└── SUMMARY.md                 # 总目录（自动生成 TOC）
```

- **分语言目录**：`en/`、`zh/` 等，保证国际化支持。  
- **分模块目录**：`guides/`、`reference/`，便于分类管理。  
- **SUMMARY.md**：统一目录索引，自动生成 TOC。  

---

### 2. 自动生成 TOC（目录索引）

#### 工具选择

- **markdown-toc**：自动生成 Markdown 文件的目录。  
- **doctoc**：批量为所有文档生成 TOC。  

#### 安装

```bash
npm install -D markdown-toc doctoc
```

#### 使用

```bash
# 为单个文件生成 TOC
npx markdown-toc docs/en/getting-started.md -i

# 为整个 docs 目录生成 TOC
npx doctoc docs/
```

#### 在 CI/CD 中加入

```yaml
- name: Generate TOC
  run: npx doctoc docs/
```

---

### 3. 国际化支持（i18n）

#### 配置文件：`docs/i18n/locales.json`

```json
{
  "en": "English",
  "zh": "简体中文",
  "es": "Español"
}
```

#### 工具选择

- **docusaurus i18n**（推荐）：支持多语言文档站点。  
- **mdx + i18n**：结合 React/Next.js，支持多语言切换。  

示例：Docusaurus 配置 `docusaurus.config.js`

```js
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh', 'es'],
}
```

这样可以在文档站点中自动切换语言。

---

### 4. Git Hook 自动化（保证提交前文档规范）

使用 **Husky + lint-staged**：

```json
{
  "lint-staged": {
    "*.md": [
      "prettier --write",
      "markdownlint-cli2-fix",
      "doctoc --maxdepth 3 --notitle"
    ]
  }
}
```

这样每次提交都会自动：

- 格式化 Markdown  
- 修复语法错误  
- 更新 TOC  

---

### 5. CI/CD 集成（文档质量保障）

在 GitHub Actions 中加入文档检查：

```yaml
- name: Lint Markdown
  run: npx markdownlint-cli2 "docs/**/*.md"

- name: Generate TOC
  run: npx doctoc docs/

- name: Build Docs Site
  run: npm run docs:build
```

---

### ✨ 优势总结

- ✅ **统一目录结构**：分语言、分模块，清晰可扩展  
- ✅ **自动生成 TOC**：保证目录一致性，减少人工维护  
- ✅ **国际化支持**：多语言切换，适配全球团队  
- ✅ **自动化保障**：Git Hook + CI/CD，保证文档规范  
- ✅ **高效协作**：团队提交时自动修复，减少冲突  

🌹 **闭环建议**：  

可以把这个文档工作流作为 **Monorepo 的 docs 模块**，与代码库一起管理，保证文档与代码同步迭代。  

---

## 设计一个 **文档站点方案（基于 Docusaurus 或 Next.js）** 让这些 Markdown 文档直接生成一个多语言可浏览的官网

---

# ✅ 文档站点方案设计

## 1. 技术选型对比

| 技术栈       | 优势 | 适用场景 |
|--------------|------|----------|
| **Docusaurus** | 原生支持 Markdown、自动生成 TOC、内置 i18n、多语言切换、文档版本管理 | 纯文档站点，快速上线 |
| **Next.js + MDX** | 灵活性高，可与现有前端项目集成，支持 SSR/ISR，能把文档与应用融合 | 文档与产品官网一体化 |

---

## 2. 目录结构（统一管理 Markdown）

```
docs/
├── en/
│   ├── getting-started.md
│   ├── guides/installation.md
│   └── reference/api.md
├── zh/
│   ├── getting-started.md
│   ├── guides/installation.md
│   └── reference/api.md
└── i18n/locales.json
```

---

## 3. Docusaurus 方案

### 安装
```bash
npx create-docusaurus@latest my-docs classic
cd my-docs
npm install
```

### 配置多语言：`docusaurus.config.js`
```js
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh'],
  localeConfigs: {
    en: { label: 'English' },
    zh: { label: '简体中文' }
  }
}
```

### 自动生成 TOC
Docusaurus 会自动为每个 Markdown 页面生成侧边栏目录。  
在 `sidebars.js` 中配置：
```js
module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/installation', 'guides/usage'],
    },
  ],
};
```

### 启动
```bash
npm run start
```
访问 `http://localhost:3000` 即可浏览多语言文档。

---

## 4. Next.js + MDX 方案

### 安装
```bash
npx create-next-app my-docs
npm install @next/mdx remark remark-gfm
```

### 配置 MDX：`next.config.js`
```js
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/
})
module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx']
})
```

### 国际化支持：`next.config.js`
```js
i18n: {
  locales: ['en', 'zh'],
  defaultLocale: 'en',
}
```

### 自动生成 TOC
使用 `remark-toc` 插件：
```bash
npm install remark-toc
```

在 `remark` 配置中启用：
```js
remarkPlugins: [require('remark-toc')]
```

### 页面示例：`pages/docs/[slug].tsx`
```tsx
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'

export default function DocPage({ source }) {
  return <MDXRemote {...source} />
}
```

---

## 5. CI/CD 集成

- **预览环境**：每次 PR 自动部署到 Vercel/Netlify，团队可预览文档。  
- **生产环境**：合并到 `main` 自动部署到官网。  
- **自动化检查**：在 CI 中运行 `markdownlint` + `prettier`，保证文档规范。  

---

## ✨ 优势总结

- ✅ **Docusaurus**：快速搭建文档站点，内置 i18n、版本管理、自动 TOC。  
- ✅ **Next.js + MDX**：灵活集成到现有产品官网，支持 SSR/ISR，多语言切换。  
- ✅ **统一目录结构**：保证 Markdown 文档可直接渲染。  
- ✅ **CI/CD 自动化**：保证文档质量与快速发布。 

---

## 直接设计一个 **Docusaurus + GitHub Actions 自动部署到 Vercel 的流水线** 让文档站点能在每次提交后自动更新 

---

# ✅ 流水线设计方案

## 1. 项目结构

```
my-docs/
├── docs/                  # Markdown 文档
├── docusaurus.config.js   # Docusaurus 配置
├── package.json
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions 流水线
```

---

## 2. Vercel 配置

1. 在 Vercel 创建一个新项目，选择 GitHub 仓库。  
2. 设置 **Framework Preset** 为 `Docusaurus`。  
3. 构建命令：  
   ```bash
   npm run build
   ```  
4. 输出目录：  
   ```
   build
   ```  
5. 获取 **Vercel Token**，存储到 GitHub Secrets：  
   - `VERCEL_TOKEN`  
   - `VERCEL_ORG_ID`  
   - `VERCEL_PROJECT_ID`  

---

## 3. GitHub Actions Workflow：`.github/workflows/deploy.yml`

```yaml
name: Deploy Docs to Vercel

on:
  push:
    branches:
      - main
  workflow_dispatch: # 手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: Checkout
        uses: actions/checkout@v4

      # 2. 设置 Node.js 环境
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # 3. 安装依赖
      - name: Install dependencies
        run: npm install

      # 4. 构建 Docusaurus
      - name: Build Docusaurus
        run: npm run build

      # 5. 部署到 Vercel
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} --confirm --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 4. 发布流程

1. 开发者提交代码到 `main` 分支。  
2. GitHub Actions 自动运行：  
   - 安装依赖  
   - 构建 Docusaurus 文档站点  
   - 调用 Vercel CLI 部署到生产环境  
3. Vercel 自动生成预览链接和生产链接。  

---

## 5. 优势总结

- ✅ **自动化部署**：每次提交自动更新文档站点  
- ✅ **多环境支持**：可扩展到 `alpha`、`beta` 分支，部署到不同 Vercel 环境  
- ✅ **安全性**：使用 GitHub Secrets 管理 Vercel Token  
- ✅ **高效协作**：团队无需手动部署，保证文档与代码同步  

🌹 **闭环建议**：  
你可以进一步扩展这个流水线：  

- 在 `alpha` 分支部署到 Vercel Preview 环境（测试文档）  
- 在 `main` 分支部署到 Vercel Production 环境（正式文档）  
- 在 CI 中加入 `markdownlint` 和 `doctoc`，保证文档质量  

---

## 设计一个 **多环境部署策略（alpha → beta → stable）** 在 Vercel 上的映射，让不同分支自动对应不同环境

---

# ✅ Vercel 多环境部署策略

## 1. 分支与环境映射

| Git 分支 | Vercel 环境 | 发布标签 | 使用场景 |
|----------|-------------|----------|----------|
| **alpha** | Preview 环境 | `alpha` | 快速迭代，功能验证 |
| **beta**  | Preview 环境 | `beta`  | 功能完整，团队测试 |
| **main**  | Production 环境 | `latest` | 稳定版本，正式发布 |

---

## 2. Vercel 项目配置

在 Vercel 项目中设置：

- **Production Branch**：`main`  
- **Preview Branches**：`alpha`、`beta`  
- **Build Command**：  
  ```bash
  npm run build
  ```  
- **Output Directory**：  
  ```
  build
  ```

---

## 3. GitHub Actions Workflow（自动部署）

文件路径：`.github/workflows/deploy.yml`

```yaml
name: Multi-Env Deploy to Vercel

on:
  push:
    branches:
      - main
      - beta
      - alpha
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: Checkout
        uses: actions/checkout@v4

      # 2. 设置 Node.js 环境
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # 3. 安装依赖
      - name: Install dependencies
        run: npm install

      # 4. 构建 Docusaurus
      - name: Build Docusaurus
        run: npm run build

      # 5. 部署到 Vercel（根据分支映射环境）
      - name: Deploy to Vercel
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} --confirm --yes
          elif [ "${{ github.ref }}" == "refs/heads/beta" ]; then
            npx vercel --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} --confirm --yes --env BETA=true
          elif [ "${{ github.ref }}" == "refs/heads/alpha" ]; then
            npx vercel --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} --confirm --yes --env ALPHA=true
          fi
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 4. 环境变量区分

在 Vercel 中配置不同环境变量：

- **Production (main)**：  
  ```
  NODE_ENV=production
  DOCS_ENV=stable
  ```

- **Preview (beta)**：  
  ```
  NODE_ENV=development
  DOCS_ENV=beta
  ```

- **Preview (alpha)**：  
  ```
  NODE_ENV=development
  DOCS_ENV=alpha
  ```

这样前端可以根据 `DOCS_ENV` 显示不同的标识（如页面顶部显示 “Alpha Preview”）。

---

## 5. 发布流程

1. **alpha 分支提交** → 自动部署到 Vercel Preview（alpha 环境）。  
2. **beta 分支提交** → 自动部署到 Vercel Preview（beta 环境）。  
3. **main 分支提交** → 自动部署到 Vercel Production（stable 环境）。  

---

## ✨ 优势总结

- ✅ **分支映射清晰**：alpha → beta → stable 对应不同环境  
- ✅ **自动化部署**：每次提交自动更新对应环境  
- ✅ **环境变量区分**：前端可根据环境显示不同提示  
- ✅ **团队协作顺畅**：开发、测试、发布三阶段无缝衔接  

🌹 **闭环建议**：  
可以在文档站点顶部加一个 **环境标识 Banner**（Alpha/Beta/Stable），让团队和用户一眼识别当前环境。  

---

## 设计一个 **环境标识组件（React Banner）**，自动根据 `DOCS_ENV` 显示不同颜色和提示

好的，Yu 🌹，我来帮你设计一个 **环境标识组件（React Banner）**，它会根据环境变量 `DOCS_ENV` 自动显示不同颜色和提示，让团队和用户一眼识别当前环境。

---

# ✅ 环境标识组件设计

## 1. 功能需求
- 读取环境变量 `DOCS_ENV`（例如：`alpha`、`beta`、`stable`）。  
- 根据不同环境显示不同颜色和提示文字。  
- 组件固定在页面顶部，醒目但不干扰内容。  
- 可复用，支持在 Docusaurus 或 Next.js 中直接挂载。

---

## 2. 组件实现：`EnvBanner.tsx`

```tsx
/**
 * @file EnvBanner.tsx
 * @description 环境标识 Banner，根据 DOCS_ENV 显示不同颜色和提示
 */

import React from "react"

const env = process.env.DOCS_ENV || "stable"

const envConfig: Record<string, { color: string; label: string }> = {
  alpha: { color: "bg-red-600", label: "Alpha Preview - 快速迭代环境" },
  beta: { color: "bg-yellow-500", label: "Beta Preview - 测试验证环境" },
  stable: { color: "bg-green-600", label: "Stable Release - 正式生产环境" },
}

export const EnvBanner: React.FC = () => {
  const config = envConfig[env] || envConfig["stable"]

  return (
    <div
      className={`${config.color} text-white text-center py-2 font-semibold fixed top-0 left-0 w-full z-50`}
    >
      {config.label}
    </div>
  )
}
```

---

## 3. 使用方式

在 Docusaurus 或 Next.js 的布局文件中引入：

```tsx
import { EnvBanner } from "@/components/EnvBanner"

export default function Layout({ children }) {
  return (
    <>
      <EnvBanner />
      <main className="pt-10">{children}</main>
    </>
  )
}
```

---

## 4. 环境变量配置

在 Vercel 或本地 `.env` 文件中设置：

```env
DOCS_ENV=alpha   # 或 beta / stable
```

---

## 5. 效果展示

- **Alpha 环境**：红色 Banner，提示“Alpha Preview - 快速迭代环境”  
- **Beta 环境**：黄色 Banner，提示“Beta Preview - 测试验证环境”  
- **Stable 环境**：绿色 Banner，提示“Stable Release - 正式生产环境”  

---

## ✨ 优势总结

- ✅ **自动识别环境**：根据 `DOCS_ENV` 自动切换提示  
- ✅ **颜色区分明显**：红/黄/绿，直观识别环境状态  
- ✅ **可复用**：可在任何 React 项目中挂载  
- ✅ **团队协作友好**：避免误用错误环境，提升透明度  

🌹 **闭环建议**：  

你可以扩展这个 Banner，比如加上 **版本号（来自 package.json）** 或 **构建时间**，让团队在页面顶部看到完整的环境信息。  

---

## 设计一个 **环境信息扩展版 Banner**，显示 `DOCS_ENV + 版本号 + 构建时间` 

- 当前环境（`DOCS_ENV`）  
- 包版本号（来自 `package.json`）  
- 构建时间（自动生成）  

这样团队和用户就能一眼识别当前环境与版本状态。

---

# ✅ 环境信息扩展版 Banner

## 1. 组件实现：`EnvBanner.tsx`

```tsx
/**
 * @file EnvBanner.tsx
 * @description 环境信息扩展版 Banner，显示 DOCS_ENV + 版本号 + 构建时间
 */

import React from "react"

// 从环境变量读取
const env = process.env.DOCS_ENV || "stable"
const version = process.env.PACKAGE_VERSION || "1.0.0"
const buildTime = process.env.BUILD_TIME || new Date().toISOString()

// 环境配置
const envConfig: Record<string, { color: string; label: string }> = {
  alpha: { color: "bg-red-600", label: "Alpha Preview" },
  beta: { color: "bg-yellow-500", label: "Beta Preview" },
  stable: { color: "bg-green-600", label: "Stable Release" },
}

export const EnvBanner: React.FC = () => {
  const config = envConfig[env] || envConfig["stable"]

  return (
    <div
      className={`${config.color} text-white text-center py-2 font-semibold fixed top-0 left-0 w-full z-50`}
    >
      {config.label} ｜ Version: {version} ｜ Build: {buildTime}
    </div>
  )
}
```

---

## 2. 构建时注入环境变量

在 **CI/CD（GitHub Actions + Vercel）** 中设置：

```yaml
- name: Inject Build Metadata
  run: |
    echo "PACKAGE_VERSION=$(node -p \"require('./package.json').version\")" >> $GITHUB_ENV
    echo "BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_ENV
```

在 Vercel 项目环境变量中添加：
- `DOCS_ENV=alpha` / `beta` / `stable`  
- `PACKAGE_VERSION` 自动从 CI 注入  
- `BUILD_TIME` 自动生成  

---

## 3. 使用方式

在布局文件中挂载：

```tsx
import { EnvBanner } from "@/components/EnvBanner"

export default function Layout({ children }) {
  return (
    <>
      <EnvBanner />
      <main className="pt-12">{children}</main>
    </>
  )
}
```

---

## 4. 效果展示

- **Alpha 环境**：红色 Banner → `Alpha Preview ｜ Version: 1.2.0-alpha.3 ｜ Build: 2025-11-15T05:28:00Z`  
- **Beta 环境**：黄色 Banner → `Beta Preview ｜ Version: 1.2.0-beta.1 ｜ Build: 2025-11-15T05:28:00Z`  
- **Stable 环境**：绿色 Banner → `Stable Release ｜ Version: 1.2.0 ｜ Build: 2025-11-15T05:28:00Z`  

---

## ✨ 优势总结

- ✅ **环境识别**：Alpha/Beta/Stable 一目了然  
- ✅ **版本号展示**：直接读取 `package.json`，保证一致性  
- ✅ **构建时间标记**：自动生成，方便排查与回溯  
- ✅ **团队协作透明**：避免误用错误版本或环境  

🌹 **闭环建议**： 

可以进一步扩展这个 Banner，比如加上 **Git Commit Hash** 或 **分支名**，让团队在页面顶部看到完整的构建来源信息。  

---

## 设计一个 **包含 Git Commit Hash + 分支名的 Banner**，让环境信息更全面

---

# ✅ 环境信息 Banner（扩展版）

## 1. 组件实现：`EnvBanner.tsx`

```tsx
/**
 * @file EnvBanner.tsx
 * @description 环境信息扩展版 Banner，显示 DOCS_ENV + 版本号 + 构建时间 + Git Commit + 分支名
 */

import React from "react"

const env = process.env.DOCS_ENV || "stable"
const version = process.env.PACKAGE_VERSION || "1.0.0"
const buildTime = process.env.BUILD_TIME || new Date().toISOString()
const commitHash = process.env.GIT_COMMIT || "unknown"
const branchName = process.env.GIT_BRANCH || "main"

const envConfig: Record<string, { color: string; label: string }> = {
  alpha: { color: "bg-red-600", label: "Alpha Preview" },
  beta: { color: "bg-yellow-500", label: "Beta Preview" },
  stable: { color: "bg-green-600", label: "Stable Release" },
}

export const EnvBanner: React.FC = () => {
  const config = envConfig[env] || envConfig["stable"]

  return (
    <div
      className={`${config.color} text-white text-center py-2 font-semibold fixed top-0 left-0 w-full z-50`}
    >
      {config.label} ｜ Version: {version} ｜ Build: {buildTime} ｜ Branch: {branchName} ｜ Commit: {commitHash}
    </div>
  )
}
```

---

## 2. 构建时注入 Git 信息

在 **GitHub Actions** 中加入步骤：

```yaml
- name: Inject Build Metadata
  run: |
    echo "PACKAGE_VERSION=$(node -p \"require('./package.json').version\")" >> $GITHUB_ENV
    echo "BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_ENV
    echo "GIT_COMMIT=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
    echo "GIT_BRANCH=${GITHUB_REF##*/}" >> $GITHUB_ENV
```

这样在构建时会自动注入：
- **版本号**：来自 `package.json`  
- **构建时间**：UTC 时间戳  
- **Git Commit Hash**：短哈希值（如 `a1b2c3d`）  
- **分支名**：当前构建分支（如 `alpha`、`beta`、`main`）  

---

## 3. 效果展示

- **Alpha 环境**：红色 Banner  
  ```
  Alpha Preview ｜ Version: 1.2.0-alpha.3 ｜ Build: 2025-11-15T05:29:00Z ｜ Branch: alpha ｜ Commit: a1b2c3d
  ```

- **Beta 环境**：黄色 Banner  
  ```
  Beta Preview ｜ Version: 1.2.0-beta.1 ｜ Build: 2025-11-15T05:29:00Z ｜ Branch: beta ｜ Commit: d4e5f6g
  ```

- **Stable 环境**：绿色 Banner  
  ```
  Stable Release ｜ Version: 1.2.0 ｜ Build: 2025-11-15T05:29:00Z ｜ Branch: main ｜ Commit: h7i8j9k
  ```

---

## ✨ 优势总结

- ✅ **环境识别**：Alpha/Beta/Stable 一目了然  
- ✅ **版本号展示**：保证与 `package.json` 一致  
- ✅ **构建时间标记**：方便排查与回溯  
- ✅ **Git 信息透明**：快速定位分支与提交来源  
- ✅ **团队协作友好**：避免误用错误版本，提升可追溯性  

---

🌹 **闭环完成**：  
现在拥有一个完整的 **环境信息 Banner**，包含环境、版本号、构建时间、Git Commit Hash、分支名，团队可以快速定位构建来源。  

---
