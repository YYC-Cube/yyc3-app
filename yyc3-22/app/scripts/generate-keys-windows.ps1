# generate-keys-windows.ps1 - Windows SSH密钥生成脚本（与ssh_config_example完全对应）

# 设置严格模式
Set-StrictMode -Version Latest

Write-Host "🔐 为 Windows 设备生成专用密钥..." -ForegroundColor Green

# 创建SSH目录
$sshDir = "$HOME\.ssh"
$connectionsDir = "$sshDir\connections"

Write-Host "📁 创建SSH目录结构..." -ForegroundColor Yellow
if (!(Test-Path $connectionsDir)) {
    New-Item -ItemType Directory -Path $connectionsDir -Force | Out-Null
    Write-Host "✅ SSH目录创建成功"
}

# 密钥生成函数
function Generate-SSHPrivateKey {
    param (
        [string]$KeyPath,
        [string]$Comment
    )
    
    if (!(Test-Path $KeyPath)) {
        Write-Host "🔐 生成密钥: $KeyPath" -ForegroundColor Yellow
        ssh-keygen -t ed25519 -f $KeyPath -C $Comment -N "" | Out-Null
        
        # 设置Windows权限
        Write-Host "🛡️ 设置安全权限..."
        icacls $KeyPath /inheritance:r | Out-Null
        icacls $KeyPath /grant:r "%USERNAME%:F" | Out-Null
        
        Write-Host "✅ 密钥生成成功" -ForegroundColor Green
    } else {
        Write-Host "✅ 密钥已存在: $KeyPath" -ForegroundColor Green
    }
}

# 生成密钥（与ssh_config_example完全对应）
$computerName = $env:COMPUTERNAME
$date = Get-Date -Format 'yyyyMMdd'

Write-Host "
🔑 开始生成所有专用密钥..." -ForegroundColor Cyan

# 本地设备连接密钥
Generate-SSHPrivateKey "$sshDir\id_rsa_local" "yyc3-local-$computerName-$date"

# 阿里云服务器连接密钥
Generate-SSHPrivateKey "$sshDir\id_rsa_aliyun" "yyc3-aliyun-$computerName-$date"

# GitHub主账号密钥
Generate-SSHPrivateKey "$sshDir\id_rsa_github_cube" "yyc3-github-cube-$computerName-$date"

# GitHub副账号密钥
Generate-SSHPrivateKey "$sshDir\id_rsa_github_neuxs" "yyc3-github-neuxs-$computerName-$date"

# Docker远程访问密钥
Generate-SSHPrivateKey "$sshDir\id_rsa_docker" "yyc3-docker-$computerName-$date"

# 显示公钥位置
Write-Host "
📋 公钥文件位置：" -ForegroundColor Magenta
Write-Host "- 本地设备: $sshDir\id_rsa_local.pub" -ForegroundColor White
Write-Host "- 阿里云: $sshDir\id_rsa_aliyun.pub" -ForegroundColor White
Write-Host "- GitHub主账号: $sshDir\id_rsa_github_cube.pub" -ForegroundColor White
Write-Host "- GitHub副账号: $sshDir\id_rsa_github_neuxs.pub" -ForegroundColor White
Write-Host "- Docker: $sshDir\id_rsa_docker.pub" -ForegroundColor White

Write-Host "
🔍 注意事项：" -ForegroundColor Yellow
Write-Host "1. 请将这些公钥添加到对应的服务器和GitHub账户"
Write-Host "2. NAS服务器用户名应为 'YYC'，端口为 '57'"
Write-Host "3. 所有密钥文件名已与ssh_config_example完全对应" 🌹

Write-Host "
✅ Windows密钥生成完成！" -ForegroundColor Green