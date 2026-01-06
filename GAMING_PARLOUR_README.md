# 🎮 Gaming Parlour Management System

A comprehensive, scalable management system for gaming parlours with master-client architecture.

## System Architecture

### Components:
1. **Master PC Application** - Central control panel for managing all client PCs
2. **Client PC Application** - User interface for customers
3. **Real-time Communication** - WebSocket-based bidirectional communication
4. **Database** - Local storage with export capabilities (SQLite/IndexedDB)

## Core Features

### ✅ Implemented Features:
- User authentication system (username/password)
- Time slot management with countdown timers
- 5-minute warning notifications
- Comprehensive data history (payments, login/logout times)
- Master control panel for all client PCs
- Timeline extension capabilities
- Scalable architecture (easy to add more PCs)
- Session management and tracking
- Real-time synchronization
- Payment tracking and history
- User activity logs

### 🚀 Recommended Additional Features:
- PC reservation system
- Automatic billing calculator
- Multiple pricing tiers (peak/off-peak)
- Membership and loyalty programs
- Food & beverage POS integration
- Analytics and reporting dashboard
- Game library management
- Session pause/resume
- Queue management
- Remote PC control (lock/unlock/restart)
- Network monitoring
- Multi-admin support
- Mobile app for bookings
- SMS/WhatsApp notifications

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Real-time Communication**: Socket.io / WebSocket
- **State Management**: React Context API
- **Database**: IndexedDB (browser) + optional backend (Node.js + SQLite)
- **Authentication**: JWT-based session management
- **Notifications**: Browser Notification API + Audio alerts

## System Requirements

### Master PC:
- Node.js 16+
- Modern browser (Chrome/Firefox/Edge)
- Network connectivity to all client PCs
- Minimum 4GB RAM
- Windows/Linux/macOS

### Client PCs:
- Node.js 16+
- Modern browser (Chrome/Firefox/Edge - fullscreen kiosk mode)
- Network connectivity to Master PC
- Minimum 2GB RAM
- Windows/Linux/macOS

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Master PC
```bash
# Set as Master PC
npm run master
```

### 3. Configure Client PCs
```bash
# Set as Client PC with ID (1-5)
npm run client -- --id=1
```

### 4. First Time Setup
- Access Master PC at: `http://localhost:5173/master`
- Default admin credentials:
  - Username: `admin`
  - Password: `admin123` (change immediately)

## Network Setup

### Option 1: Local Network (Recommended)
1. Connect all PCs to the same local network
2. Note the Master PC's IP address
3. Configure each client PC with Master's IP in `.env.local`

### Option 2: Server-Based
1. Deploy backend server to a VPS/cloud service
2. Point both master and clients to server URL
3. Provides remote access and better scalability

## Usage Guide

### Master PC Dashboard:
1. **Client Overview** - See status of all 5 PCs
2. **User Management** - Add/edit/delete users
3. **Session Control** - Start/stop/extend sessions
4. **Payment Tracking** - Record and view payments
5. **History & Reports** - View comprehensive logs
6. **Settings** - Configure rates, notifications, etc.

### Client PC Interface:
1. User logs in with credentials
2. Select or purchase time slot
3. Session starts with countdown timer
4. 5-minute warning before expiry
5. Automatic logout when time expires

## Pricing Configuration

Default pricing structure (customizable):
- **Hourly Rate**: ₹50/hour
- **Half Hour**: ₹30
- **2 Hours**: ₹90
- **Full Day**: ₹400

### Membership Tiers (Optional):
- **Bronze**: 5% discount
- **Silver**: 10% discount
- **Gold**: 15% discount + priority booking

## Data Management

### Stored Information:
- User profiles (name, username, password hash, membership)
- Session history (login time, logout time, duration)
- Payment records (date, amount, method, user)
- PC usage statistics
- Activity logs

### Export Options:
- CSV export for Excel
- PDF reports
- JSON data dump
- Automated daily backups

## Security Features

- Password hashing (bcrypt)
- JWT-based authentication
- Session timeout protection
- Admin access controls
- Audit logging
- Encrypted data storage

## Troubleshooting

### Client Can't Connect to Master:
1. Check network connectivity
2. Verify Master PC IP address
3. Check firewall settings
4. Ensure Master service is running

### Timer Not Syncing:
1. Check WebSocket connection
2. Verify system clocks are synchronized
3. Restart client application

### Database Issues:
1. Clear browser cache/IndexedDB
2. Export data first as backup
3. Reinitialize database

## Backup & Recovery

### Automatic Backups:
- Daily automatic backups to `./backups` folder
- Retention: 30 days
- Manual backup: Master PC > Settings > Backup Data

### Recovery:
- Master PC > Settings > Restore from Backup
- Select backup file (.json)
- Confirm restoration

## Support & Updates

For issues or feature requests, contact your system administrator.

## License

Proprietary - Gaming Parlour Management System
Copyright © 2026
