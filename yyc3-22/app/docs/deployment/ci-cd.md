# CI/CD 流程

## GitHub Actions 配置

### 配置文件路径

- **配置文件**：`.github/workflows/deploy.yml`

### 配置示例

```yaml
name: Deploy 0379.email Services

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: |
          npm install

      - name: Run tests
        run: |
          npm test

      - name: Build Docker images
        run: |
          docker build -t ghcr.io/yyc3/yyc3-api:latest ./services/api
          docker build -t ghcr.io/yyc3/yyc3-admin:latest ./services/admin
          docker build -t ghcr.io/yyc3/yyc3-llm:latest ./services/llm
          docker build -t ghcr.io/yyc3/yyc3-mail:latest ./services/mail

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v1
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push Docker images
        run: |
          docker push ghcr.io/yyc3/yyc3-api:latest
          docker push ghcr.io/yyc3/yyc3-admin:latest
          docker push ghcr.io/yyc3/yyc3-llm:latest
          docker push ghcr.io/yyc3/yyc3-mail:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /Users/yanyu/www/yyc3-22/app
            git pull origin main
            ./deploy.sh
```

## GitLab CI 配置

### 配置文件路径

- **配置文件**：`.gitlab-ci.yml`

### 配置示例

```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_REGISTRY: registry.gitlab.com
  IMAGE_TAG: $CI_COMMIT_SHA

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:dind
  script:
      - docker build -t $DOCKER_REGISTRY/yyc3/yyc3-api:$IMAGE_TAG ./services/api
      - docker build -t $DOCKER_REGISTRY/yyc3/yyc3-admin:$IMAGE_TAG ./services/admin
      - docker build -t $DOCKER_REGISTRY/yyc3/yyc3-llm:$IMAGE_TAG ./services/llm
      - docker build -t $DOCKER_REGISTRY/yyc3/yyc3-mail:$IMAGE_TAG ./services/mail
      - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
      - docker push $DOCKER_REGISTRY/yyc3/yyc3-api:$IMAGE_TAG
      - docker push $DOCKER_REGISTRY/yyc3/yyc3-admin:$IMAGE_TAG
      - docker push $DOCKER_REGISTRY/yyc3/yyc3-llm:$IMAGE_TAG
      - docker push $DOCKER_REGISTRY/yyc3/yyc3-mail:$IMAGE_TAG

test:
  stage: test
  image: node:16-alpine
  script:
    - npm install
    - npm test

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config
  script:
    - ssh $DEPLOY_USER@$DEPLOY_HOST "cd /Users/yanyu/www/yyc3-22/app && git pull origin main && ./deploy.sh"
  only:
    - main
```

## 自动部署脚本

### 部署脚本路径

- **脚本路径**：`/Users/yanyu/www/yyc3-22/app/deploy.sh`

### 脚本示例

```bash
# 自动部署脚本

#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail

echo "开始部署 0379.email 服务平台..."

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 进入项目目录
cd /Users/yanyu/www/yyc3-22/app

# 安装根目录依赖
npm install

# 进入各服务目录并安装依赖
services=("api" "admin" "llm" "mail")

for service in "${services[@]}"; do
    echo "部署 $service 服务..."
    cd /Users/yanyu/www/yyc3-22/app/services/$service

    # 安装依赖
    npm install --production

    # 重启服务
    pm2 restart yyc3-$service || pm2 start server.js --name yyc3-$service

    echo "$service 服务部署完成"
    cd /Users/yanyu/www/yyc3-22/app
done

# 保存 PM2 配置
npm run pm2:save

# 重载 Nginx 配置
echo "重载 Nginx 配置..."
sudo nginx -t && sudo systemctl reload nginx

echo "部署完成！所有服务已重启并配置完成。"
```

## Helm Chart 发布

### GitHub Pages 发布

- **仓库地址**：<https://yyc3.github.io/YanYuCloudCube>
- **配置命令**：

  ```bash
  helm package ./helm
  helm repo index . --url https://yyc3.github.io/YanYuCloudCube
  git add .
  git commit -m "Update Helm charts"
  git push
  ```

### OCI 仓库发布

- **仓库地址**：`oci://ghcr.io/yyc3/yyc3-services`
- **发布命令**：

  ```bash
  helm package ./helm
  helm push yyc3-services-1.0.1.tgz oci://ghcr.io/yyc3
  ```

## ChartMuseum 配置

### 配置文件路径

- **配置文件**：`.helm/chartmuseum.yaml`

### 配置示例

```yaml
baseurl: https://charts.yourdomain.com
storage: local
storage.local.rootdir: ./charts
cache: redis
cache.redis.addr: localhost:6379
```

### 启动命令

```bash
chartmuseum --config .helm/chartmuseum.yaml --port=8080
```
