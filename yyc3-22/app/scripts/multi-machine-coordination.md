# 密钥生成脚本 (macOS专用)

# !/bin/zsh

# generate-keys-macos.sh

echo "🔐 为 macOS 设备生成专用密钥..."

# 为云服务器生成专用密钥 - 与ssh_config_example保持一致

keys=("id_rsa_local" "id_rsa_aliyun" "id_rsa_github_cube" "id_rsa_github_neuxs" "id_rsa_docker")
comments=("yyc3-local-$(hostname)-$(date +%Y%m%d)" "yyc3-aliyun-$(hostname)-$(date +%Y%m%d)" "yyc3-github-cube-$(hostname)" "yyc3-github-neuxs-$(hostname)" "yyc3-docker-$(hostname)")

for i in "${!keys[@]}"; do
    key=${keys[$i]}
comment=${comments[$i]}
if [ ! -f ~/.ssh/${key} ]; then
echo "生成 ${key} 密钥..."
        ssh-keygen -t ed25519 -f ~/.ssh/${key} -C "${comment}" -N ""
        chmod 600 ~/.ssh/${key}
else
echo "✅ ${key} 密钥已存在"
fi
done

# 添加到macOS钥匙串

echo "🔑 将密钥添加到ssh-agent..."
eval "$(ssh-agent -s)"

for key in "${keys[@]}"; do
    if [ -f "~/.ssh/${key}" ]; then
ssh-add --apple-use-keychain "~/.ssh/${key}"
fi
done

echo "✅ macOS密钥生成完成！"

## Apple M4 (yyc3-77) - 辅助开发机；简化配置

## 使用相同的配置结构，但生成此设备专用密钥

cp /Users/yyc3-22/.ssh/config ~/.ssh/config

## 生成此设备专用密钥 - 保持与ssh_config_example一致

./generate-keys-macos.sh

## Windows MateBook (yyc3-66) - Windows开发机；PowerShell 脚本

# generate-keys-windows.ps1

Write-Host "🔐 为 Windows 设备生成专用密钥..." -ForegroundColor Green

### 创建SSH目录

$sshDir = "$HOME\.ssh"
$connectionsDir = "$sshDir\connections"

if (!(Test-Path $connectionsDir)) {
New-Item -ItemType Directory -Path $connectionsDir -Force
}

### 为云服务器生成专用密钥 - 与ssh_config_example保持一致

$keys = @("id_rsa_local", "id_rsa_aliyun", "id_rsa_github_cube", "id_rsa_github_neuxs", "id_rsa_docker")
$comments = @("yyc3-local-$env:COMPUTERNAME-$(Get-Date -Format 'yyyyMMdd')", "yyc3-aliyun-$env:COMPUTERNAME-$(Get-Date -Format 'yyyyMMdd')", "yyc3-github-cube-$env:COMPUTERNAME", "yyc3-github-neuxs-$env:COMPUTERNAME", "yyc3-docker-$env:COMPUTERNAME")

for ($i = 0; $i -lt $keys.Length; $i++) {
    $key = $keys[$i]
$comment = $comments[$i]
$keyPath = "$sshDir\$key"
if (!(Test-Path $keyPath)) {
        Write-Host "生成 $key 密钥..." -ForegroundColor Yellow
        ssh-keygen -t ed25519 -f $keyPath -C "$comment" -N ""
icacls $keyPath /inheritance:r
icacls $keyPath /grant:r "%USERNAME%:F"
} else {
Write-Host "✅ $key 密钥已存在" -ForegroundColor Green
}
}

Write-Host "✅ Windows密钥生成完成！" -ForegroundColor Green

## Windows SSH Config - 与ssh_config_example保持一致

### 保存为 C:\Users\yyc3-66\.ssh\config

Host \*
ServerAliveInterval 60
ServerAliveCountMax 3
ConnectTimeout 10
Compression yes
StrictHostKeyChecking yes
IdentitiesOnly yes

### 阿里云 ECS - 华北2

Host aliyun-ecs-33
HostName 8.152.195.33
User root
Port 22
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_aliyun
ForwardAgent yes

### 阿里云 ECS - 华北6

Host aliyun-ecs-121
HostName 8.152.195.33
User root
Port 22
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_aliyun
ForwardAgent yes

### 本地设备配置

Host local-macbook-m4max
HostName 192.168.3.22
User yyc3-22
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_local

Host local-imac-m4
HostName 192.168.3.77
User yyc3-77
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_local

Host local-nas
HostName 192.168.3.45
User YYC
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_local
Port 57

### GitHub双账号配置 - Windows版本

Host github.com-cube
HostName github.com
User git
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_github_cube
IdentitiesOnly yes
ForwardAgent yes

Host github.com-neuxs
HostName github.com
User git
IdentityFile C:\Users\yyc3-66\.ssh\id_rsa_github_neuxs
IdentitiesOnly yes
ForwardAgent yes

## macOS/Linux SSH Config - 与ssh_config_example保持一致

### 保存为 ~/.ssh/config

Host \*
ServerAliveInterval 60
ServerAliveCountMax 3
ConnectTimeout 10
Compression yes
StrictHostKeyChecking yes
IdentitiesOnly yes

### 阿里云 ECS - 华北2

Host aliyun-ecs-33
HostName 8.152.195.33
User root
Port 22
IdentityFile ~/.ssh/id_rsa_aliyun
ForwardAgent yes

### 阿里云 ECS - 华北6

Host aliyun-ecs-121
HostName 8.152.195.33
User root
Port 22
IdentityFile ~/.ssh/id_rsa_aliyun
ForwardAgent yes

### 本地设备配置

Host local-macbook-m4max
HostName 192.168.3.22
User yyc3-22
IdentityFile ~/.ssh/id_rsa_local

Host local-imac-m4
HostName 192.168.3.77
User yyc3-77
IdentityFile ~/.ssh/id_rsa_local

Host local-huawei
HostName 192.168.3.66
User yyc3-66
IdentityFile ~/.ssh/id_rsa_local

Host local-nas
HostName 192.168.3.45
User YYC
IdentityFile ~/.ssh/id_rsa_local
Port 57

### GitHub双账号配置 - macOS/Linux版本

Host github.com-cube
HostName github.com
User git
IdentityFile ~/.ssh/id_rsa_github_cube
IdentitiesOnly yes
ForwardAgent yes

Host github.com-neuxs
HostName github.com
User git
IdentityFile ~/.ssh/id_rsa_github_neuxs
IdentitiesOnly yes
ForwardAgent yes

### Docker远程访问配置

Host docker-mac
HostName 192.168.3.22
User yyc3-22
IdentityFile ~/.ssh/id_rsa_docker
Port 22
LocalForward 2375 /var/run/docker.sock

## NAS服务器 (yyc3-45) - 存储中心；NAS专用配置脚本

# !/bin/bash

# nas-setup.sh

echo "🛠️ 设置NAS服务器SSH访问..."

# 创建授权密钥文件

mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

echo "请将以下设备的公钥添加到 ~/.ssh/authorized_keys："
echo "1. M4 Max (yyc3-22) - local-macbook-m4max"
echo "2. M4 (yyc3-77) - local-imac-m4"
echo "3. Windows MateBook (yyc3-66) - local-huawei"
echo "注意：NAS服务器用户名为YYC，主机名称为yyc3-45"

# 生成NAS自身的密钥（用于访问其他服务）

if [ ! -f ~/.ssh/nas_host_key ]; then
ssh-keygen -t ed25519 -f ~/.ssh/nas_host_key -C "nas-server-$(hostname)" -N ""
fi

echo "✅ NAS SSH设置完成"

## 阿里云服务器配置；ECS初始化脚本

# !/bin/bash

# ecs-init.sh

# 适用于阿里云Linux和Ubuntu

# 创建开发用户 - 与ssh_config_example保持一致

useradd -m -s /bin/bash yanyu # 开发环境使用yanyu用户
usermod -aG sudo yanyu

# 创建root用户SSH目录（如果需要直接使用root连接）

mkdir -p /root/.ssh
chmod 700 /root/.ssh

echo "请将开发设备的公钥添加到 /root/.ssh/authorized_keys"
echo "完成后运行：chmod 600 /root/.ssh/authorized_keys"
echo ""
echo "也请为开发用户配置："
echo "mkdir -p /home/yanyu/.ssh"
echo "chmod 700 /home/yanyu/.ssh"
echo "将开发设备的公钥添加到 /home/yanyu/.ssh/authorized_keys"
echo "chmod 600 /home/yanyu/.ssh/authorized_keys"
echo "chown -R yanyu:yanyu /home/yanyu/.ssh"

# 安全配置

sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

echo "✅ ECS初始化完成"

## 通用环境变量文件 .env - 与ssh_config_example保持一致

# 所有系统通用的环境变量

# 路径变量根据系统自动适配

# 系统检测和路径适配

if [["$OSTYPE" == "darwin"*]]; then
export DEV_BASE_PATH="/Users/$(whoami)/Development"
elif [[ "$OSTYPE" == "linux-gnu"\* ]]; then
export DEV_BASE_PATH="/home/$(whoami)/development"  
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    export DEV_BASE_PATH="/c/Users/$(whoami)/Development"
fi

# 通用配置 - 与ssh_config_example保持一致

export PROJECT_NAME="yyc3"
export DOCKER_REGISTRY="docker.io"
export GITHUB_MAIN="YYC-Cube" # GitHub主仓 - 对应github.com-cube
export GITHUB_DEV="YY-Neuxs" # GitHub副仓 - 对应github.com-neuxs
export DOCKER_USER="yanyuit" # Docker远程访问用户名

# 服务器信息 - 与ssh_config_example保持一致

export ALIYUN_ECS_33="aliyun-ecs-33" # 华北2服务器
export ALIYUN_ECS_121="aliyun-ecs-121" # 华北6服务器
export NAS_SERVER="local-nas" # NAS服务器

# 本地设备信息 - 与ssh_config_example保持一致

export MACBOOK="local-macbook-m4max"
export IMAC="local-imac-m4"
export HUAWEI="local-huawei"

export DOCKER_REMOTE="local-macbook-m4max:2375"

## - 跨系统同步脚本 sync-config.sh

# !/bin/bash

# 跨系统配置文件同步

RSYNC_OPTS="-avz --exclude='_.key' --exclude='_.pub'"

sync_to_remote() {
local host=$1
local src_path=$2
local dest_path=$3

    if [[ "$OSTYPE" == "darwin"* || "$OSTYPE" == "linux-gnu"* ]]; then
        rsync $RSYNC_OPTS "$src_path" "$host:$dest_path"
    else
        # Windows使用scp
        scp -r "$src_path" "$host:$dest_path"
    fi

}

# 同步到其他设备 - 与ssh_config_example保持一致

echo "🔄 同步配置文件到其他设备..."

# 同步到M4 - 使用ssh_config_example中的主机名

sync_to_remote "local-imac-m4" "~/.env" "~/.env"
sync_to_remote "local-imac-m4" "~/scripts/" "~/scripts/"
sync_to_remote "local-imac-m4" "~/.ssh/config" "~/.ssh/config"

# 同步到Windows - 使用ssh_config_example中的主机名

sync_to_remote "local-huawei" "~/.env" "~/.env"
sync_to_remote "local-huawei" "~/scripts/" "~/scripts/"
sync_to_remote "local-huawei" "~/.ssh/config" "~/.ssh/config"

echo "✅ 配置同步完成"

## 创建脚本目录

mkdir -p ~/scripts

## 保存上述脚本文件

chmod +x ~/scripts/\*.sh

## 生成密钥

~/scripts/generate-keys-macos.sh

## 配置环境变量

cp env-template .env
nano .env

## 分发公钥到服务器 - 与ssh_config_example保持一致

# 分发到阿里云ECS服务器

ssh-copy-id -i ~/.ssh/id_rsa_aliyun.pub aliyun-ecs-33 # 华北2服务器
ssh-copy-id -i ~/.ssh/id_rsa_aliyun.pub aliyun-ecs-121 # 华北6服务器

# 分发到NAS服务器

ssh-copy-id -i ~/.ssh/id_rsa_local.pub -p 57 YYC@192.168.3.45 # NAS服务器，注意使用非标准端口和YYC用户名

## Windows上使用PowerShell脚本

# 在M4设备上执行相同流程

# 在Windows上使用PowerShell脚本

## 验证连接 - 与ssh_config_example保持一致

```bash
# 测试GitHub连接
ssh -T git@github.com-cube  # 验证主账号GitHub连接
ssh -T git@github.com-neuxs # 验证副账号GitHub连接

# 测试本地设备连接
ssh local-macbook-m4max    # 连接M4 Max
ssh local-imac-m4          # 连接iMac M4
ssh local-nas              # 连接NAS服务器（端口57，用户YYC）
ssh local-huawei           # 连接华为笔记本

# 测试阿里云服务器连接
ssh aliyun-ecs-33          # 连接华北2 ECS服务器
ssh aliyun-ecs-121         # 连接华北6 ECS服务器

# 测试Docker远程连接
docker -H tcp://192.168.3.22:2375 info  # 连接到M4 Max上的Docker
```

~/scripts/check-env.sh

## GitHub仓库克隆 - 与ssh_config_example保持一致

```bash
# 克隆主账号仓库 - 使用github.com-cube主机别名
git clone git@github.com-cube:YYC-Cube/repo-name.git

# 克隆副账号仓库 - 使用github.com-neuxs主机别名
git clone git@github.com-neuxs:YY-Neuxs/repo-name.git

# 配置已克隆仓库的远程地址
git remote set-url origin git@github.com-cube:YYC-Cube/repo-name.git
```

## 多机协同配置注意事项

### 1. SSH配置文件一致性

- 确保所有设备上的SSH配置文件都与ssh_config_example保持一致
- 所有密钥文件名、主机名、IP地址必须严格匹配
- 定期同步更新的配置到所有设备

### 2. NAS服务器特殊配置

- NAS服务器用户名为YYC（非root或admin）
- 使用非标准端口57进行连接
- 主机名称为yyc3-45
- 确保在NAS上创建YYC用户并配置正确的SSH权限

### 3. 密钥管理安全

- 所有密钥文件权限必须设置为600
- 对于Windows系统，使用icacls设置正确的文件权限
- 定期更新密钥（建议90天一次）
- 每个设备生成独立的密钥对

### 4. GitHub双账号使用

- 克隆仓库时必须使用主机别名（github.com-cube和github.com-neuxs）
- 确保每个仓库的git config user.name和user.email与对应的GitHub账号一致
- 为不同项目设置不同的全局或局部git配置

### 5. 开发环境用户

- 阿里云服务器上使用yanyu作为开发用户
- 本地设备使用各自的用户名（yyc3-22、yyc3-77、yyc3-66）
- NAS服务器使用YYC用户名

### 6. 配置同步流程

- 使用sync-config.sh脚本同步配置文件到所有设备
- 同步时排除密钥文件（出于安全考虑）
- 定期验证各设备的连接状态

# 多机协同配置总结 - 与ssh_config_example完全对应

## 🔑 核心密钥文件（严格按照ssh_config_example）

```
~/.ssh/id_rsa_local        # 本地设备连接
~/.ssh/id_rsa_aliyun       # 阿里云服务器连接
~/.ssh/id_rsa_github_cube  # GitHub主账号连接
~/.ssh/id_rsa_github_neuxs # GitHub副账号连接
~/.ssh/id_rsa_docker       # Docker远程访问
```

## 🖥️ 所有设备主机别名（与ssh_config_example一致）

### 本地设备

- `local-macbook-m4max` - M4 Max (192.168.3.22)
- `local-imac-m4` - iMac M4 (192.168.3.77)
- `local-huawei` - 华为笔记本 (192.168.3.66)
- `local-nas` - NAS服务器 (192.168.3.45:57) - 用户：YYC

### 阿里云服务器

- `aliyun-ecs-33` - 华北2服务器 (8.152.195.33)
- `aliyun-ecs-121` - 华北6服务器 (8.152.195.33)

### GitHub账号

- `github.com-cube` - YYC-Cube主账号
- `github.com-neuxs` - YY-Neuxs副账号

## ⚠️ 关键注意事项

1. **NAS服务器特殊配置**
   - 用户名：`YYC`（非root或admin）
   - 端口：`57`（非标准端口）
   - 主机名：`yyc3-45`

2. **开发用户配置**
   - 阿里云服务器：`yanyu`（开发用户）和`root`
   - 本地设备：各自的用户名（yyc3-22、yyc3-77、yyc3-66）

3. **文件权限要求**
   - SSH密钥文件：600权限
   - SSH配置文件：600权限
   - Windows系统使用icacls设置正确权限

4. **GitHub克隆规范**
   - 必须使用主机别名，不能直接使用github.com
   - 主账号：`git@github.com-cube:YYC-Cube/repo.git`
   - 副账号：`git@github.com-neuxs:YY-Neuxs/repo.git`

5. **配置一致性维护**
   - 所有设备的SSH配置必须与ssh_config_example完全一致
   - 使用sync-config.sh保持配置同步
   - 定期验证连接状态

## 🔄 使用流程总结

1. 复制ssh_config_example到各设备的SSH配置目录
2. 生成所有必要的密钥文件
3. 将公钥分发到各服务器和设备
4. 配置环境变量文件
5. 测试所有连接
6. 使用主机别名进行日常操作

**注意：本配置文档中的所有参数值均严格基于ssh_config_example文件，确保多机协同环境的一致性和稳定性！** 🌹
