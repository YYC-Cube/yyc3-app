# Kubernetes/Helm 部署指南

## 概述

本指南将详细介绍如何使用 Kubernetes 和 Helm 在容器编排环境中部署邮件系统。Helm 是 Kubernetes 的包管理器，它简化了应用程序的部署、升级和管理过程。

## 环境要求

- Kubernetes 集群 (1.18+ 推荐)
- kubectl 命令行工具 (与集群版本匹配)
- Helm 3.x
- 足够的集群资源（建议至少 3 个节点，每个节点 4 CPU，8GB 内存）

## 安装前置工具

### 安装 kubectl

#### Linux

```bash
# 下载最新版本
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 安装
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 验证安装
kubectl version --client
```

#### macOS

```bash
# 使用 Homebrew 安装
brew install kubectl

# 或下载二进制文件
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
```

#### Windows

下载 [kubectl.exe](https://dl.k8s.io/release/v1.21.0/bin/windows/amd64/kubectl.exe) 并添加到系统 PATH 中。

### 安装 Helm 3

#### Linux

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

#### macOS

```bash
brew install helm
```

#### Windows

使用 Chocolatey 安装：

```bash
choco install kubernetes-helm
```

## Kubernetes 集群准备

确保你有一个正常运行的 Kubernetes 集群，并且 `kubectl` 已正确配置，可以访问该集群。

```bash
# 验证集群连接
kubectl cluster-info

# 检查节点状态
kubectl get nodes
```

## Helm Chart 结构

邮件系统的 Helm Chart 结构如下：

```
email-system/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── api-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── configmap.yaml
│   ├── admin-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── configmap.yaml
│   ├── mail-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── configmap.yaml
│   ├── llm-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── configmap.yaml
│   ├── mongodb/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── persistentvolumeclaim.yaml
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── persistentvolumeclaim.yaml
│   └── rabbitmq/
│       ├── statefulset.yaml
│       ├── service.yaml
│       └── persistentvolumeclaim.yaml
└── charts/
    └── # 可选的子 Chart
```

## 创建 Helm Chart

### Chart.yaml

创建 `email-system/Chart.yaml` 文件：

```yaml
apiVersion: v2
name: email-system
description: 邮件系统 Helm Chart
version: 1.0.0
appVersion: "1.0.0"
type: application
keywords:
  - email
  - mail
  - api
  - server
home: https://example.com
maintainers:
  - name: Your Name
    email: your.email@example.com
```

### values.yaml

创建 `email-system/values.yaml` 文件，包含所有可配置的参数：

```yaml
# 全局配置
global:
  environment: production
  domain: example.com
  imageRegistry: your-registry.example.com
  # 数据库凭证
  mongodb:
    username: admin
    password: "{{ .Values.secrets.mongodbPassword }}"
    database: email-system
  redis:
    password: "{{ .Values.secrets.redisPassword }}"
  rabbitmq:
    username: admin
    password: "{{ .Values.secrets.rabbitmqPassword }}"

# 服务配置
apiServer:
  enabled: true
  replicas: 2
  image:
    repository: email-system/api-server
    tag: latest
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi
  service:
    type: ClusterIP
    port: 3000
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
    hosts:
      - host: api.{{ .Values.global.domain }}
        paths:
          - path: /
            pathType: Prefix

adminServer:
  enabled: true
  replicas: 1
  image:
    repository: email-system/admin-server
    tag: latest
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi
  service:
    type: ClusterIP
    port: 3001
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
    hosts:
      - host: admin.{{ .Values.global.domain }}
        paths:
          - path: /
            pathType: Prefix

mailServer:
  enabled: true
  replicas: 2
  image:
    repository: email-system/mail-server
    tag: latest
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 512Mi
  service:
    type: ClusterIP
    port: 3003
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
    hosts:
      - host: mail.{{ .Values.global.domain }}
        paths:
          - path: /
            pathType: Prefix
  storage:
    size: 10Gi
    storageClass: standard

llmServer:
  enabled: true
  replicas: 1
  image:
    repository: email-system/llm-server
    tag: latest
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 1000m
      memory: 2Gi
  service:
    type: ClusterIP
    port: 3002
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
    hosts:
      - host: llm.{{ .Values.global.domain }}
        paths:
          - path: /
            pathType: Prefix

# 依赖服务配置
mongodb:
  enabled: true
  replicas: 1
  image:
    repository: mongo
    tag: 4.4
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi
  storage:
    size: 20Gi
    storageClass: standard

redis:
  enabled: true
  replicas: 1
  image:
    repository: redis
    tag: 6
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 100m
      memory: 256Mi
  storage:
    size: 5Gi
    storageClass: standard

rabbitmq:
  enabled: true
  replicas: 1
  image:
    repository: rabbitmq
    tag: 3-management
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 512Mi
  storage:
    size: 10Gi
    storageClass: standard

# 密钥配置（实际部署时应使用外部密钥管理或加密的 Secret）
secrets:
  mongodbPassword: "change-this-in-production"
  redisPassword: "change-this-in-production"
  rabbitmqPassword: "change-this-in-production"
  apiSecret: "change-this-in-production"
```

## 创建部署模板

### API Server 部署模板

创建 `email-system/templates/api-server/deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-api-server
  labels:
    app: {{ .Release.Name }}-api-server
spec:
  replicas: {{ .Values.apiServer.replicas }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}-api-server
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}-api-server
    spec:
      containers:
      - name: api-server
        image: {{ .Values.global.imageRegistry }}/{{ .Values.apiServer.image.repository }}:{{ .Values.apiServer.image.tag }}
        imagePullPolicy: {{ .Values.apiServer.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.apiServer.service.port }}
        resources:
          limits:
            cpu: {{ .Values.apiServer.resources.limits.cpu }}
            memory: {{ .Values.apiServer.resources.limits.memory }}
          requests:
            cpu: {{ .Values.apiServer.resources.requests.cpu }}
            memory: {{ .Values.apiServer.resources.requests.memory }}
        env:
        - name: NODE_ENV
          value: {{ .Values.global.environment }}
        - name: PORT
          value: "{{ .Values.apiServer.service.port }}"
        - name: MONGO_URL
          value: mongodb://{{ .Values.global.mongodb.username }}:{{ .Values.global.mongodb.password }}@{{ .Release.Name }}-mongodb:27017/{{ .Values.global.mongodb.database }}
        - name: REDIS_URL
          value: redis://:{{ .Values.global.redis.password }}@{{ .Release.Name }}-redis:6379
        - name: JWT_SECRET
          value: {{ .Values.secrets.apiSecret }}
        readinessProbe:
          httpGet:
            path: /health
            port: {{ .Values.apiServer.service.port }}
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: {{ .Values.apiServer.service.port }}
          initialDelaySeconds: 60
          periodSeconds: 30
```

### 其他服务模板

为其他服务（Admin Server、Mail Server、LLM Server）创建类似的部署模板，以及相应的 Service 和 Ingress 配置。

## 使用 Helm 部署

### 创建命名空间

建议在单独的命名空间中部署邮件系统：

```bash
kubectl create namespace email-system
```

### 创建密钥

使用 `kubectl` 创建包含敏感信息的 Secret：

```bash
kubectl create secret generic email-system-secrets \
  --namespace email-system \
  --from-literal=mongodbPassword=your-secure-mongodb-password \
  --from-literal=redisPassword=your-secure-redis-password \
  --from-literal=rabbitmqPassword=your-secure-rabbitmq-password \
  --from-literal=apiSecret=your-secure-api-secret
```

### 自定义配置

根据实际环境需求，创建自定义配置文件 `custom-values.yaml`，覆盖默认配置：

```yaml
global:
  domain: your-domain.com
  imageRegistry: your-registry.example.com

# 调整资源配置
apiServer:
  replicas: 3
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi

# 启用或禁用特定服务
llmServer:
  enabled: true
```

### 部署应用

使用 Helm 安装邮件系统：

```bash
helm install email-system ./email-system \
  --namespace email-system \
  -f custom-values.yaml
```

### 验证部署

查看所有已部署的资源：

```bash
kubectl get all -n email-system
```

检查各组件状态：

```bash
kubectl get pods -n email-system
```

查看服务访问地址：

```bash
kubectl get ingress -n email-system
```

## 更新部署

当需要更新应用时，可以修改自定义配置文件并执行以下命令：

```bash
helm upgrade email-system ./email-system \
  --namespace email-system \
  -f custom-values.yaml
```

## 回滚部署

如果更新后出现问题，可以回滚到之前的版本：

```bash
# 查看版本历史
helm history email-system --namespace email-system

# 回滚到特定版本
helm rollback email-system <revision-number> --namespace email-system
```

## 删除部署

如需删除整个部署：

```bash
helm uninstall email-system --namespace email-system
```

## 高可用配置建议

1. **多副本部署**：为关键服务设置多个副本，确保高可用性
2. **节点亲和性**：配置 Pod 反亲和性，使同一服务的副本分布在不同节点上
3. **资源限制**：合理设置资源请求和限制，避免资源争用
4. **持久化存储**：使用可靠的存储类，确保数据安全
5. **监控告警**：部署 Prometheus 和 Grafana 进行监控

## 性能优化建议

1. **水平扩展**：根据负载自动扩展服务副本数
2. **垂直扩展**：为资源密集型服务（如 LLM Server）分配更多资源
3. **缓存优化**：合理配置 Redis 缓存，减轻数据库压力
4. **数据库优化**：为 MongoDB 配置合适的索引
5. **网络优化**：配置合适的网络策略和 Ingress 规则

## 常见问题排查

1. **Pod 启动失败**
   - 检查日志：`kubectl logs <pod-name> -n email-system`
   - 检查事件：`kubectl describe pod <pod-name> -n email-system`

2. **服务不可访问**
   - 检查 Service 配置：`kubectl describe service <service-name> -n email-system`
   - 检查 Ingress 配置：`kubectl describe ingress <ingress-name> -n email-system`
   - 验证网络策略：`kubectl get networkpolicies -n email-system`

3. **资源不足**
   - 检查节点资源：`kubectl describe node <node-name>`
   - 调整资源请求和限制

4. **数据库连接问题**
   - 验证数据库服务状态
   - 检查连接字符串和凭证
   - 测试连接：在应用 Pod 中执行连接测试命令
