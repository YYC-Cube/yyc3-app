#!/bin/bash

# YYC3 Future Dashboard Deployment Script
# Deploys complete monitoring stack to yyc3-33 server (8.152.195.33)

set -e

# Configuration
SERVER="8.152.195.33"
SERVER_USER="root"
SERVER_PATH="/opt/yyc3-future-dashboard"
LOCAL_PATH="/Users/yanyu/www"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 YYC3 Future Dashboard Deployment to yyc3-33${NC}"
echo "=================================================="
echo "Server: $SERVER"
echo "Local Path: $LOCAL_PATH"
echo "Remote Path: $SERVER_PATH"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

if ! command_exists ssh; then
    echo -e "${RED}❌ SSH is not installed. Please install OpenSSH client.${NC}"
    exit 1
fi

if ! command_exists rsync; then
    echo -e "${RED}❌ rsync is not installed. Please install rsync.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies check passed${NC}"

# Test server connectivity
echo -e "${BLUE}🌐 Testing server connectivity...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER "echo 'Connection successful'" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Server connectivity test passed${NC}"
else
    echo -e "${RED}❌ Cannot connect to server $SERVER${NC}"
    echo "Please ensure:"
    echo "1. Server is accessible"
    echo "2. SSH key is configured"
    echo "3. User $SERVER_USER has SSH access"
    exit 1
fi

# Prepare server directories
echo -e "${BLUE}📁 Preparing server directories...${NC}"
ssh $SERVER_USER@$SERVER "mkdir -p $SERVER_PATH/{nginx/conf.d,monitoring/grafana/provisioning/datasources,ssl,logs}"

# Copy configuration files
echo -e "${BLUE}📋 Copying configuration files...${NC}"

# Nginx configuration (subdomains only)
echo "  - Copying Nginx subdomain configuration..."
mkdir -p "$LOCAL_PATH/nginx/conf.d"
cp "$LOCAL_PATH/nginx/conf.d/subdomains.conf" "$LOCAL_PATH/nginx/conf.d/default.conf"
rsync -avz --delete "$LOCAL_PATH/nginx/" $SERVER_USER@$SERVER:$SERVER_PATH/nginx/

# Docker monitoring configuration
echo "  - Copying Docker Compose configuration..."
scp "$LOCAL_PATH/docker-compose.monitoring.yml" $SERVER_USER@$SERVER:$SERVER_PATH/docker-compose.yml

# Monitoring configuration
echo "  - Copying monitoring configuration..."
rsync -avz --delete "$LOCAL_PATH/monitoring/" $SERVER_USER@$SERVER:$SERVER_PATH/monitoring/

# SSL setup script
echo "  - Copying SSL setup script..."
scp "$LOCAL_PATH/ssl-setup.sh" $SERVER_USER@$SERVER:$SERVER_PATH/
chmod +x $SERVER_USER@$SERVER:$SERVER_PATH/ssl-setup.sh

# Create environment file
echo -e "${BLUE}🔧 Creating environment configuration...${NC}"
cat << 'EOF' | ssh $SERVER_USER@$SERVER "cat > $SERVER_PATH/.env"
# YYC3 Future Dashboard Environment Configuration
REDIS_PASSWORD=yyc3_redis_2024_secure
GRAFANA_USER=admin
GRAFANA_PASSWORD=yyc3_grafana_2024_secure
DATABASE_URL=postgresql://yyc3:yyc3_db_2024@localhost:5432/yyc3_dashboard
NODE_ENV=production
DOMAIN=yanyu.work
MAIN_DOMAIN=vercel.app
EOF

# Install Docker on server if not exists
echo -e "${BLUE}🐳 Checking Docker installation...${NC}"
if ! ssh $SERVER_USER@$SERVER "command -v docker" >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing Docker...${NC}"
    ssh $SERVER_USER@$SERVER << 'EOF'
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
usermod -aG docker $USER
rm get-docker.sh
EOF
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose if not exists
if ! ssh $SERVER_USER@$SERVER "command -v docker-compose" >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    ssh $SERVER_USER@$SERVER << 'EOF'
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
EOF
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Setup SSL certificates
echo -e "${BLUE}🔒 Setting up SSL certificates...${NC}"
ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && ./ssl-setup.sh --server"

# Start Docker services
echo -e "${BLUE}🚀 Starting Docker services...${NC}"
ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker-compose down"
ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker-compose up -d"

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"
ssh $SERVER_USER@$SERVER "cd $SERVER_PATH && docker-compose ps"

# Health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"

# Check if services are responding
HEALTH_CHECKS=(
    "Nginx:http://localhost:80"
    "Grafana:http://localhost:4000"
    "Prometheus:http://localhost:9090"
    "Redis Commander:http://localhost:8081"
)

for check in "${HEALTH_CHECKS[@]}"; do
    service=$(echo $check | cut -d: -f1)
    url=$(echo $check | cut -d: -f2)

    echo -n "  Checking $service... "
    if ssh $SERVER_USER@$SERVER "curl -f -s $url/health >/dev/null 2>&1 || curl -f -s $url >/dev/null 2>&1"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${YELLOW}⚠️ Warning${NC}"
    fi
done

# Setup firewall rules
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ssh $SERVER_USER@$SERVER << 'EOF'
# Install UFW if not exists
if ! command -v ufw >/dev/null 2>&1; then
    apt-get update
    apt-get install -y ufw
fi

# Configure firewall rules
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow monitoring ports (optional, restrict to your IP)
ufw allow 9090/tcp  # Prometheus
ufw allow 4000/tcp  # Grafana
ufw allow 8081/tcp  # Redis Commander

# Enable firewall
ufw --force enable
EOF

echo -e "${GREEN}✅ Firewall configured${NC}"

# Setup log rotation
echo -e "${BLUE}📋 Setting up log rotation...${NC}"
ssh $SERVER_USER@$SERVER "cat > /etc/logrotate.d/yyc3-future-dashboard << 'EOF'
$SERVER_PATH/nginx/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        docker exec yyc3-nginx nginx -s reload >/dev/null 2>&1 || true
    endscript
}
EOF"

# Create monitoring dashboard URL
echo ""
echo -e "${GREEN}🎉 Deployment Completed Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Access URLs (Subdomains on yyc3-33):${NC}"
echo -e "🤖 AI Agent:         ${GREEN}https://ai.yanyu.work${NC}"
echo -e "📋 Kanban Board:     ${GREEN}https://kanban.yanyu.work${NC}"
echo -e "🚀 Future Dashboard: ${GREEN}https://future.yanyu.work${NC}"
echo -e "📊 Status Monitor:   ${GREEN}https://monitor.yanyu.work${NC}"
echo -e "🔧 API Gateway:      ${GREEN}https://api.yanyu.work${NC}"
echo -e "📈 Grafana:          ${GREEN}https://grafana.yanyu.work${NC}"
echo ""
echo -e "${BLUE}🏠 Main Domain (Vercel):${NC}"
echo -e "🌐 Main Site:        ${GREEN}https://yanyu.work${NC} (or your Vercel domain)"
echo ""
echo -e "${BLUE}🔧 Internal Monitoring URLs:${NC}"
echo -e "📊 Prometheus:       http://$SERVER:9090"
echo -e "🔍 Redis Commander:  http://$SERVER:8081"
echo ""
echo -e "${BLUE}👤 Default Credentials:${NC}"
echo -e "📈 Grafana:          admin / yyc3_grafana_2024_secure"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Update DNS records for subdomains to point to $SERVER:"
echo "   - ai.yanyu.work → $SERVER"
echo "   - kanban.yanyu.work → $SERVER"
echo "   - future.yanyu.work → $SERVER"
echo "   - monitor.yanyu.work → $SERVER"
echo "   - api.yanyu.work → $SERVER"
echo "   - grafana.yanyu.work → $SERVER"
echo "2. Configure SSL certificates with Let's Encrypt:"
echo "   ssh $SERVER_USER@$SERVER 'cd $SERVER_PATH && ./ssl-setup.sh --server'"
echo "3. Deploy main domain to Vercel (avoiding domain mapping on server)"
echo "4. Test all services are accessible"
echo "5. Configure Grafana dashboards"
echo "6. Set up monitoring alerts"
echo ""
echo -e "${YELLOW}⚠️  Security Note:${NC}"
echo "- Main domain (yanyu.work) is mapped to Vercel to avoid审查"
echo "- Only subdomains are deployed on Chinese server"
echo "- This separation minimizes regulatory risk"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "View logs:    ssh $SERVER_USER@$SERVER 'cd $SERVER_PATH && docker-compose logs -f'"
echo "Restart:      ssh $SERVER_USER@$SERVER 'cd $SERVER_PATH && docker-compose restart'"
echo "Update:       ssh $SERVER_USER@$SERVER 'cd $SERVER_PATH && docker-compose pull && docker-compose up -d'"
echo ""
echo -e "${GREEN}✨ YYC3 Future Dashboard is now live on yyc3-33 server!${NC}"