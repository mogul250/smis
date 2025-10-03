# SMIS Deployment Guide

## 🚀 Complete Deployment Guide for School Management Information System

This guide provides comprehensive instructions for deploying the SMIS application to production environments.

## 📋 Prerequisites

### System Requirements
- **Node.js**: v16.x or higher
- **MySQL**: v8.0 or higher
- **Docker**: v20.x or higher (optional)
- **Nginx**: v1.18 or higher (for reverse proxy)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

### Environment Setup
- **Production Server**: Ubuntu 20.04 LTS or CentOS 8
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **Network**: Stable internet connection with static IP

## 🔧 Pre-Deployment Configuration

### 1. Environment Variables

Create production environment files:

**Backend (.env)**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smis_production
DB_USER=smis_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_app_password

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
ENABLE_MONITORING=true

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=/var/uploads/smis
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=SMIS
NEXT_PUBLIC_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

### 2. Database Setup

```sql
-- Create production database
CREATE DATABASE smis_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'smis_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smis_production.* TO 'smis_user'@'localhost';
FLUSH PRIVILEGES;

-- Import schema
mysql -u smis_user -p smis_production < database/schema.sql
```

## 🐳 Docker Deployment (Recommended)

### 1. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: smis_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: smis_production
      MYSQL_USER: smis_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"
    networks:
      - smis_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: smis_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=smis_production
      - DB_USER=smis_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000
    ports:
      - "5000:5000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - smis_network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: smis_frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - smis_network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: smis_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - smis_network

  # Redis (for caching and sessions)
  redis:
    image: redis:7-alpine
    container_name: smis_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - smis_network
    command: redis-server --appendonly yes

volumes:
  mysql_data:
  redis_data:

networks:
  smis_network:
    driver: bridge
```

### 2. Production Dockerfiles

**Backend Dockerfile.prod**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
```

**Frontend Dockerfile.prod**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 3. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Frontend Server
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Login endpoint rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run Backend Tests
        run: |
          cd backend
          npm test
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/smis
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml build --no-cache
            docker-compose -f docker-compose.prod.yml up -d
            
            # Health check
            sleep 30
            curl -f http://localhost:5000/api/health || exit 1
```

## 📊 Monitoring and Logging

### 1. Log Management

```bash
# Create log rotation configuration
sudo tee /etc/logrotate.d/smis << EOF
/var/www/smis/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        docker-compose -f /var/www/smis/docker-compose.prod.yml restart backend
    endscript
}
EOF
```

### 2. Monitoring Setup

Install monitoring tools:

```bash
# Install Node Exporter for Prometheus
wget https://github.com/prometheus/node_exporter/releases/download/v1.3.1/node_exporter-1.3.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.3.1.linux-amd64.tar.gz
sudo mv node_exporter-1.3.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Security

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Reload privileges
FLUSH PRIVILEGES;
```

## 🚀 Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /var/www/smis
sudo chown $USER:$USER /var/www/smis
```

### 2. Application Deployment

```bash
# Clone repository
cd /var/www/smis
git clone https://github.com/yourusername/smis.git .

# Set up environment variables
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local

# Edit environment files with production values
nano .env
nano frontend/.env.local

# Create necessary directories
mkdir -p logs uploads nginx/ssl

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl -f http://localhost:5000/api/health
```

### 3. Post-Deployment Tasks

```bash
# Create admin user
docker-compose -f docker-compose.prod.yml exec backend node create-admin.js

# Set up log rotation
sudo cp logrotate.d/smis /etc/logrotate.d/

# Configure monitoring
# (Set up your preferred monitoring solution)

# Create backup script
sudo tee /usr/local/bin/smis-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/smis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /var/www/smis/docker-compose.prod.yml exec -T mysql mysqldump -u smis_user -p$DB_PASSWORD smis_production > $BACKUP_DIR/db_backup_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C /var/www/smis uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/smis-backup.sh

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/smis-backup.sh" | sudo crontab -
```

## 🔍 Health Checks and Monitoring

### Application Health Endpoints

- **Backend Health**: `GET /api/health`
- **Database Health**: `GET /api/health/database`
- **System Metrics**: `GET /api/health/metrics`

### Monitoring Checklist

- [ ] Application is responding to health checks
- [ ] Database connections are stable
- [ ] SSL certificate is valid and auto-renewing
- [ ] Logs are being rotated properly
- [ ] Backups are running daily
- [ ] Monitoring alerts are configured
- [ ] Performance metrics are being collected

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL container
   docker-compose -f docker-compose.prod.yml logs mysql
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec mysql mysql -u smis_user -p
   ```

2. **Frontend Build Errors**
   ```bash
   # Check build logs
   docker-compose -f docker-compose.prod.yml logs frontend
   
   # Rebuild frontend
   docker-compose -f docker-compose.prod.yml build --no-cache frontend
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew --dry-run
   ```

### Emergency Procedures

1. **Rollback Deployment**
   ```bash
   cd /var/www/smis
   git checkout previous-stable-tag
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Database Recovery**
   ```bash
   # Restore from backup
   docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u smis_user -p smis_production < /var/backups/smis/db_backup_YYYYMMDD_HHMMSS.sql
   ```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update SSL certificates
- **Annually**: Security audit and penetration testing

### Contact Information

- **Technical Support**: tech-support@yourdomain.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.yourdomain.com

---

**🎉 Congratulations! Your SMIS application is now successfully deployed to production.**

Remember to monitor the application regularly and keep all components updated for optimal security and performance.
