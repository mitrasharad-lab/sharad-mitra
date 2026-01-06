# 🎮 Gaming Parlour Management System

A comprehensive, full-featured management system for gaming parlours with master-client architecture. Built with React, TypeScript, and modern web technologies.

## ✨ Features

### Core Features (Implemented)

✅ **User Authentication System**
- Secure username/password login
- Role-based access (Admin, Staff, Customer)
- Session management with automatic expiry

✅ **Time Slot Management**
- Flexible pricing plans (30 min, 1 hour, 2 hours, etc.)
- Real-time countdown timers
- Pause and resume functionality
- Session extension capabilities

✅ **Master Control Panel**
- Monitor all 5 client PCs in real-time
- Extend session timelines remotely
- End sessions when needed
- View comprehensive statistics and analytics

✅ **Client PC Interface**
- User-friendly login screen
- Time slot purchase system
- Live countdown timer display
- Visual and audio warnings

✅ **5-Minute Warning System**
- Browser notifications
- Audio alerts
- Visual warning modal
- Countdown timer color changes

✅ **Comprehensive Data Tracking**
- Payment history for all users
- Login/logout timestamps
- Session duration tracking
- Activity logs for all operations
- Data export capabilities

✅ **Real-Time Communication**
- Master ↔ Client PC synchronization
- Instant session updates
- Remote control capabilities
- Heartbeat monitoring

✅ **Scalable Architecture**
- Easy to add more client PCs
- Modular component design
- IndexedDB for data persistence
- Expandable pricing system

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### First Time Setup

1. Open http://localhost:5173 in your browser
2. You'll see the main selection screen
3. Choose **Master PC** or **Client PC**

### Default Credentials

**Admin Access (Master PC):**
- Username: `admin`
- Password: `admin123`

**Demo Users (Client PC):**
- User 1: `demo1` / `demo123` (Bronze member, ₹100 balance)
- User 2: `demo2` / `demo123` (Silver member, ₹200 balance)

## 📖 How to Use

### Master PC (Control Center)

1. **Login** with admin credentials
2. **Monitor** all 5 client PCs from the dashboard
3. **View Statistics** - Revenue, active sessions, PC status
4. **Extend Sessions** - Click "Extend" on any active PC
5. **End Sessions** - Force end if needed
6. **View History** - Check all payments and sessions

**Navigation:**
- **Overview** - Dashboard with real-time stats
- **Clients** - Detailed view of all PCs
- **History** - Payment and session logs
- **Users** - User management (coming soon)

### Client PC (Gaming Stations)

1. **Select PC** - Choose PC-1 through PC-5
2. **Login** - Enter username and password
3. **Choose Plan** - Select gaming time (30min, 1hr, 2hr, etc.)
4. **Start Gaming** - Session begins with countdown timer
5. **Warnings** - Get notified 5 minutes before time expires
6. **Controls** - Pause, resume, or end session

**Timer Features:**
- Green: More than 15 minutes remaining
- Yellow: 5-15 minutes remaining
- Red: Less than 5 minutes (warning!)
- Audio + visual alerts at 5 minutes

## 🏗️ System Architecture

```
gaming-parlour-management/
├── components/
│   └── gaming/
│       ├── LoginSelector.tsx      # Mode selection screen
│       ├── MasterDashboard.tsx    # Master control panel
│       ├── ClientLogin.tsx        # Client login & pricing
│       └── ClientSession.tsx      # Active session view
├── services/
│   ├── databaseService.ts         # IndexedDB operations
│   ├── authService.ts             # Authentication
│   ├── sessionService.ts          # Session management
│   ├── communicationService.ts    # Real-time sync
│   └── initService.ts             # Initial setup
├── gaming-types.ts                # TypeScript definitions
├── GamingParlourApp.tsx           # Main app component
└── App.tsx                        # Entry point
```

## 💾 Data Management

### Stored Data:
- **Users** - Profiles, credentials, wallet balances
- **Sessions** - Login times, durations, status
- **Payments** - Amounts, methods, timestamps
- **Activity Logs** - All system operations
- **Client PCs** - Status, specs, current sessions
- **Pricing Rules** - Time plans and rates

### Database:
- Uses **IndexedDB** for browser-based storage
- Automatic initialization on first run
- Data persists across browser restarts
- Export/import functionality ready

## 🎯 Pricing Plans (Default)

| Plan | Duration | Price |
|------|----------|-------|
| 30 Minutes | 30 min | ₹30 |
| 1 Hour | 60 min | ₹50 |
| 2 Hours | 120 min | ₹90 |
| 3 Hours | 180 min | ₹130 |
| Full Day | 480 min | ₹400 |

*Prices can be customized in the database*

## 🔮 Additional Features (Recommended)

The system is designed to easily support these features:

### Business Features:
- 📊 **Advanced Analytics** - Peak hours, revenue trends
- 🎫 **Reservation System** - Book PCs in advance
- 💳 **Multiple Payment Methods** - Cash, card, UPI
- 🏆 **Membership Tiers** - Loyalty programs, discounts
- 🍕 **Food & Beverage POS** - Integrated snack/drink sales

### Technical Features:
- 🌐 **Network Monitoring** - Bandwidth tracking per PC
- 🔒 **Remote PC Control** - Lock, unlock, restart clients
- 📱 **Mobile App** - Check availability, make bookings
- 📧 **Notifications** - SMS/Email receipts and reminders
- 🎮 **Game Library** - Track installed games per PC

### Operational Features:
- 👥 **Multi-Admin** - Different permission levels
- 📈 **Reports** - Daily, weekly, monthly summaries
- 💾 **Auto Backup** - Scheduled data backups
- 🎟️ **Queue System** - Waiting list when full
- 🏅 **Tournaments** - Organize gaming competitions

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS (via index.css)
- **Build Tool:** Vite 6
- **Database:** IndexedDB (browser-based)
- **Communication:** BroadcastChannel API / WebSocket
- **State Management:** React Hooks
- **Notifications:** Browser Notification API

## 🔧 Configuration

### System Settings (Default):
- Warning Time: 5 minutes before expiry
- Grace Period: 2 minutes after expiry
- Auto-Lock on Expiry: Enabled
- Allow Pause: Enabled
- Max Pause Duration: 15 minutes
- Currency: ₹ (INR)
- Timezone: Asia/Kolkata
- Business Hours: 10:00 - 23:00

### Client PCs (Default Setup):
- **PC-1 & PC-2:** i7-12700K, RTX 3070, 16GB RAM
- **PC-3:** Ryzen 7 5800X, RTX 3080, 32GB RAM
- **PC-4 & PC-5:** i5-12400F, RTX 3060, 16GB RAM

## 📝 Usage Tips

1. **Testing:** Open multiple browser tabs to simulate Master + Clients
2. **Master Tab:** http://localhost:5173 → Select "Master PC"
3. **Client Tabs:** http://localhost:5173 → Select "Client PC" → Choose PC-1, PC-2, etc.
4. **Demo:** Login as demo1 or demo2 to test customer flow
5. **Extensions:** Use Master PC to extend sessions in real-time
6. **Fullscreen:** Press F11 on client PCs for immersive gaming experience

## 🚧 Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run master PC (port 5173)
npm run master

# Run client PC (port 5174)
npm run client
```

## 📄 License

Proprietary - Gaming Parlour Management System
Copyright © 2026

## 🤝 Support

For issues, questions, or feature requests:
1. Check the GAMING_PARLOUR_README.md for detailed documentation
2. Review the code comments in each service file
3. Contact your system administrator

---

## 🎉 What Makes This System Special?

✨ **Complete Solution** - Everything you need out of the box
⚡ **Real-Time** - Instant updates between master and clients
🎨 **Modern UI** - Beautiful, responsive design
📊 **Analytics Ready** - Built-in tracking for business insights
🔒 **Secure** - Password hashing and session management
📈 **Scalable** - Easy to expand to more PCs
💼 **Professional** - Enterprise-grade features
🎮 **User-Friendly** - Intuitive for both staff and customers

Perfect for gaming cafés, cyber cafés, PC bangs, and gaming centers!

---

**Ready to revolutionize your gaming parlour?** 🚀
