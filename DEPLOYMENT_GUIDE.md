# 🚀 Deployment Guide - Gaming Parlour Management System

Complete guide for deploying your gaming parlour system to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Network Deployment](#local-network-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Network Configuration](#network-configuration)
5. [Security Setup](#security-setup)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## 📦 Prerequisites

### Hardware Requirements

**Master PC:**
- **Minimum**: Intel i3 / AMD Ryzen 3, 4GB RAM, 100GB Storage
- **Recommended**: Intel i5 / AMD Ryzen 5, 8GB RAM, 256GB SSD
- **Network**: Gigabit Ethernet
- **OS**: Windows 10/11, Ubuntu 20.04+, macOS 11+

**Client PCs:**
- **Gaming Specs**: As per your gaming requirements
- **Network**: Gigabit Ethernet (WiFi acceptable but not recommended)
- **OS**: Windows 10/11 recommended

**Network Infrastructure:**
- Gigabit Switch (minimum 6 ports)
- Router with DHCP
- Cat6 Ethernet cables
- Stable internet connection (optional but recommended)

### Software Requirements

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Edge 90+
- **Git**: For version control (optional)

---

## 🏠 Local Network Deployment

### Option 1: Same Machine (Testing Only)

Perfect for testing the system with multiple browser tabs.

```bash
# Clone or navigate to project
cd gaming-parlour-management

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access:**
- Master PC: http://localhost:5173 (choose "Master PC")
- Client PCs: Open multiple tabs, choose "Client PC" for each

### Option 2: Local Network (Recommended for Production)

Deploy across multiple physical PCs on the same local network.

#### Step 1: Network Setup

1. **Connect all PCs to the same network switch/router**
2. **Assign static IP addresses** (recommended):
   ```
   Master PC:    192.168.1.100
   Client PC-1:  192.168.1.101
   Client PC-2:  192.168.1.102
   Client PC-3:  192.168.1.103
   Client PC-4:  192.168.1.104
   Client PC-5:  192.168.1.105
   ```

3. **Configure firewall rules** to allow port 5173

#### Step 2: Master PC Setup

```bash
# On Master PC
cd gaming-parlour-management
npm install

# Build for production
npm run build

# Serve the built files
npx vite preview --host 0.0.0.0 --port 5173
```

Or use a production server:

```bash
# Install serve globally
npm install -g serve

# Serve the dist folder
serve -s dist -l 5173 --host 0.0.0.0
```

#### Step 3: Client PC Setup

**Method A: Browser Kiosk Mode (Recommended)**

On each client PC, create a startup script:

**Windows (`start-client.bat`):**
```batch
@echo off
start chrome.exe --kiosk --app=http://192.168.1.100:5173
```

**Linux (`start-client.sh`):**
```bash
#!/bin/bash
chromium-browser --kiosk --app=http://192.168.1.100:5173
```

**macOS:**
```bash
#!/bin/bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --app=http://192.168.1.100:5173
```

**Method B: Auto-start on Boot**

**Windows:**
1. Press `Win + R`, type `shell:startup`
2. Place `start-client.bat` in the Startup folder

**Linux (systemd):**
```bash
sudo nano /etc/systemd/system/gaming-client.service
```

```ini
[Unit]
Description=Gaming Parlour Client
After=network.target

[Service]
Type=simple
User=gamer
ExecStart=/usr/bin/chromium-browser --kiosk --app=http://192.168.1.100:5173
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable gaming-client
sudo systemctl start gaming-client
```

#### Step 4: Testing

1. Start Master PC server
2. Access Master dashboard: http://192.168.1.100:5173
3. On each client, open browser to same URL
4. Select appropriate PC (PC-1, PC-2, etc.)
5. Test login and session management

---

## ☁️ Cloud Deployment

Deploy to a cloud server for remote access and centralized management.

### Option 1: Deploy to Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to deploy
```

**Note:** This deploys only the frontend. You'll need a separate backend for real-time communication in production.

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: VPS Deployment (Full Control)

Using DigitalOcean, Linode, AWS EC2, or similar.

#### Server Setup

```bash
# Connect to your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

#### Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/gaming-parlour.git
cd gaming-parlour

# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start "npx vite preview --host 0.0.0.0 --port 5173" --name gaming-parlour
pm2 save
pm2 startup
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/gaming-parlour
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gaming-parlour /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## 🌐 Network Configuration

### Local Network Setup

#### Router Configuration

1. **Enable DHCP** with static IP reservations
2. **Port Forwarding** (if accessing from outside):
   - External Port: 80 or 443
   - Internal Port: 5173
   - Internal IP: Master PC IP

3. **DNS** (optional):
   - Add local DNS entry: `gaming-parlour.local` → Master PC IP

#### Firewall Rules

**Windows Firewall:**
```powershell
netsh advfirewall firewall add rule name="Gaming Parlour" dir=in action=allow protocol=TCP localport=5173
```

**Linux (ufw):**
```bash
sudo ufw allow 5173/tcp
sudo ufw enable
```

**macOS:**
System Preferences → Security & Privacy → Firewall → Firewall Options → Add exception for port 5173

### WebSocket Configuration (For Real-time Features)

If using network mode instead of BroadcastChannel:

1. **Update `communicationService.ts`:**
   - Change default mode to 'network'
   - Configure WebSocket server URL

2. **Deploy WebSocket Server:**

```bash
# Install ws library
npm install ws

# Create server file (server.js)
```

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

console.log('WebSocket server running on port 8080');
```

```bash
# Run server
pm2 start server.js --name websocket-server
```

---

## 🔒 Security Setup

### 1. Change Default Credentials

**IMMEDIATELY after deployment:**

```typescript
// Update in initService.ts or via UI
admin password: admin123 → YOUR_SECURE_PASSWORD
```

### 2. Enable HTTPS

For production, always use HTTPS:

- **Local Network**: Self-signed certificate or local CA
- **Cloud**: Let's Encrypt (free) or commercial SSL

### 3. Implement Rate Limiting

```bash
# Install nginx
# Add to nginx config:
```

```nginx
limit_req_zone $binary_remote_addr zone=gaming:10m rate=10r/s;

server {
    location / {
        limit_req zone=gaming burst=20 nodelay;
        # ... rest of config
    }
}
```

### 4. Database Security

Current implementation uses browser storage. For production:

```typescript
// Encrypt sensitive data
import CryptoJS from 'crypto-js';

const encrypt = (data: string, key: string) => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

const decrypt = (data: string, key: string) => {
  return CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);
};
```

### 5. Secure Communication

```typescript
// In production, always use WSS (WebSocket Secure)
const wsUrl = window.location.protocol === 'https:'
  ? 'wss://your-domain.com:8080'
  : 'ws://localhost:8080';
```

### 6. Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

---

## ⚡ Performance Optimization

### 1. Build Optimization

```bash
# Use production build
npm run build

# Analyze bundle size
npm install -g source-map-explorer
source-map-explorer 'dist/assets/*.js'
```

### 2. Caching Strategy

**Nginx caching:**

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

```typescript
// Limit query results
const sessions = await db.getAllSessions();
const recentSessions = sessions.slice(-100); // Last 100 only

// Use indices effectively
// Already implemented in databaseService.ts
```

### 4. Image Optimization

```bash
# Compress images
npm install -g imagemin-cli
imagemin src/assets/* --out-dir=src/assets/optimized
```

### 5. Network Optimization

- Use CDN for static assets
- Enable gzip compression
- Minimize HTTP requests

**Enable gzip in nginx:**

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## 🔧 Troubleshooting

### Issue: Clients can't connect to Master

**Solution:**
1. Check Master PC IP: `ipconfig` (Windows) or `ifconfig` (Linux/macOS)
2. Verify firewall allows port 5173
3. Ensure all PCs are on same network
4. Test with: `ping 192.168.1.100` from client

### Issue: Database not persisting

**Solution:**
1. Check browser storage limits
2. Clear browser cache and reload
3. Export data regularly
4. Consider backend database for production

### Issue: Real-time updates not working

**Solution:**
1. Check BroadcastChannel support (modern browsers only)
2. Switch to WebSocket mode for cross-browser support
3. Verify WebSocket server is running

### Issue: Performance degradation

**Solution:**
1. Clear old data from database
2. Run backup cleanup: `await backupService.cleanOldBackups(30)`
3. Restart browser/application
4. Check network bandwidth

### Issue: Session timers not accurate

**Solution:**
1. Synchronize system clocks across all PCs
2. Use NTP server for time sync
3. Check for browser tab throttling

---

## 🔄 Maintenance

### Daily Tasks

```bash
# Check system status
pm2 status

# View logs
pm2 logs gaming-parlour

# Monitor resources
htop
```

### Weekly Tasks

```bash
# Update dependencies (test first!)
npm update

# Clear old logs
pm2 flush

# Database cleanup
# Via UI: Master PC → Backup → Clean Old Backups
```

### Monthly Tasks

```bash
# Security updates
apt update && apt upgrade -y

# Review analytics
# Via UI: Master PC → Analytics

# Backup system configuration
cp -r ~/.pm2 ~/backups/pm2-$(date +%Y%m%d)
```

### Backup Strategy

**Automated Daily Backups:**
```bash
# Create backup script (backup.sh)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gaming-parlour"

mkdir -p $BACKUP_DIR

# Export database via API or manual export
curl http://localhost:5173/api/export > $BACKUP_DIR/data_$TIMESTAMP.json

# Keep only last 30 days
find $BACKUP_DIR -name "data_*.json" -mtime +30 -delete
```

```bash
# Add to crontab
crontab -e

# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 📊 Monitoring

### Server Monitoring

```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate

# Monitor in real-time
pm2 monit
```

### Application Monitoring

Add to your code:

```typescript
// Log important events
console.log(`[${new Date().toISOString()}] Session started: ${userId}`);

// Track errors
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
  // Send to monitoring service
});
```

### Health Checks

```bash
# Create health check endpoint
curl http://your-server:5173/health
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Change default admin password
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Test all features with real users
- [ ] Configure monitoring and alerts
- [ ] Document your specific network setup
- [ ] Train staff on admin panel
- [ ] Create user guide for customers
- [ ] Set up maintenance schedule
- [ ] Test disaster recovery plan
- [ ] Configure rate limiting
- [ ] Optimize performance
- [ ] Review security settings
- [ ] Set up customer support process

---

## 📞 Support & Updates

### Getting Help

1. Check troubleshooting section above
2. Review code comments in service files
3. Check GitHub issues
4. Contact support team

### Updating the System

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart gaming-parlour
```

---

## 🌟 Advanced Configurations

### Multi-Location Support

For managing multiple gaming parlours:

1. Deploy central backend server
2. Each location connects to central server
3. Centralized user database
4. Location-based reporting

### Custom Branding

Update in `index.css` and components:

```css
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-accent-color;
}
```

### Integration with External Systems

- POS systems
- Accounting software
- CRM systems
- Email/SMS gateways

---

**Your gaming parlour is ready for production!** 🚀

For questions or issues, refer to the documentation or contact support.
