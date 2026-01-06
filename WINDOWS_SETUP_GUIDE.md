# 🪟 Windows Setup Guide - Gaming Parlour System

Complete guide to set up your Gaming Parlour Management System on Windows at `C:\Claude\My-Gaming-Parlour`

---

## 📥 Method 1: Clone from Git (Recommended)

### Prerequisites
- Git for Windows: https://git-scm.com/download/win
- Node.js LTS: https://nodejs.org (Download Windows installer)

### Steps

1. **Open PowerShell or Command Prompt**
   ```cmd
   Win + X → Windows PowerShell
   ```

2. **Navigate to C:\Claude**
   ```cmd
   cd C:\
   mkdir Claude
   cd Claude
   ```

3. **Clone the Repository**
   ```cmd
   git clone https://github.com/mitrasharad-lab/sharad-mitra.git My-Gaming-Parlour
   cd My-Gaming-Parlour
   ```

4. **Checkout the Correct Branch**
   ```cmd
   git checkout claude/gaming-parlour-network-6TbJr
   ```

5. **Install Dependencies**
   ```cmd
   npm install
   ```

6. **Start the System**
   ```cmd
   npm run dev
   ```

7. **Access the Application**
   - Open browser: http://localhost:5173
   - Login as admin: `admin` / `admin123`

---

## 📦 Method 2: Download Archive

If you have the `gaming-parlour-backup.tar.gz` file:

### Prerequisites
- 7-Zip: https://www.7-zip.org/download.html
- Node.js LTS: https://nodejs.org

### Steps

1. **Extract the Archive**
   - Right-click `gaming-parlour-backup.tar.gz`
   - 7-Zip → Extract Here
   - This creates a `.tar` file
   - Right-click the `.tar` file → 7-Zip → Extract Here
   - This creates the `sharad-mitra` folder

2. **Move to Desired Location**
   ```cmd
   move sharad-mitra C:\Claude\My-Gaming-Parlour
   cd C:\Claude\My-Gaming-Parlour
   ```

3. **Install Dependencies**
   ```cmd
   npm install
   ```

4. **Start the System**
   ```cmd
   npm run dev
   ```

---

## 🚀 Quick Start After Setup

### For Testing (Single PC)

```cmd
cd C:\Claude\My-Gaming-Parlour
npm run dev
```

Then open multiple browser tabs:
- Tab 1: Master PC (admin login)
- Tab 2-6: Client PCs (demo1, demo2 logins)

### For Production (Multiple Physical PCs)

**On Master PC (Main Computer):**

1. Find your local IP address:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Build and serve:
   ```cmd
   cd C:\Claude\My-Gaming-Parlour
   npm install
   npm run build
   npx vite preview --host 0.0.0.0 --port 5173
   ```

3. Allow through firewall:
   ```cmd
   netsh advfirewall firewall add rule name="Gaming Parlour" dir=in action=allow protocol=TCP localport=5173
   ```

**On Client PCs (Gaming Computers):**

1. Open browser
2. Navigate to: `http://MASTER-PC-IP:5173`
   - Example: `http://192.168.1.100:5173`
3. Select "Client PC"
4. Choose PC number (PC-1, PC-2, etc.)

---

## 🎮 First Time Usage

### Master PC Login
- Username: `admin`
- Password: `admin123`
- **IMPORTANT**: Change password immediately!

### Customer Login (Demo Accounts)
- Username: `demo1` / Password: `demo123` (₹100 balance)
- Username: `demo2` / Password: `demo123` (₹200 balance)

---

## 📂 Project Structure

```
C:\Claude\My-Gaming-Parlour\
├── components/
│   └── gaming/
│       ├── EnhancedMasterDashboard.tsx
│       ├── ClientLogin.tsx
│       ├── ClientSession.tsx
│       └── panels/
│           ├── FoodPOSPanel.tsx
│           ├── TournamentPanel.tsx
│           ├── ReservationPanel.tsx
│           └── AllPanels.tsx
├── services/
│   ├── databaseService.ts
│   ├── databaseExtensions.ts
│   ├── authService.ts
│   ├── sessionService.ts
│   ├── reservationService.ts
│   ├── tournamentService.ts
│   ├── foodService.ts
│   └── ... (11 total service files)
├── gaming-types.ts
├── package.json
├── QUICK_START.md
├── DEPLOYMENT_GUIDE.md
├── ADVANCED_FEATURES.md
└── README_NEW.md
```

---

## ✅ Verify Installation

Run these commands to verify everything is working:

```cmd
cd C:\Claude\My-Gaming-Parlour

# Check Node.js version (should be 16+)
node --version

# Check npm version (should be 8+)
npm --version

# List installed packages
npm list --depth=0

# Start development server
npm run dev
```

Expected output:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
➜  press h + enter to show help
```

---

## 🎯 Available npm Commands

```cmd
# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Serve production on network
npx vite preview --host 0.0.0.0 --port 5173

# Install dependencies
npm install

# Clean install (if issues)
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 🔧 Troubleshooting

### Port 5173 Already in Use

```cmd
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3000
```

### Cannot Access from Other PCs

1. **Check Windows Firewall:**
   ```cmd
   # Add firewall rule
   netsh advfirewall firewall add rule name="Gaming Parlour" dir=in action=allow protocol=TCP localport=5173
   ```

2. **Check IP Address:**
   ```cmd
   ipconfig
   ```
   Make sure clients use the correct IPv4 address

3. **Verify Network:**
   - All PCs must be on same network
   - Try pinging: `ping 192.168.1.100`

### npm install Errors

```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Browser Issues

- Use Chrome or Edge (latest version)
- Clear browser cache: Ctrl + Shift + Delete
- Disable browser extensions
- Try incognito/private mode

---

## 🛠️ Windows-Specific Tips

### Create Desktop Shortcut

1. Create file: `C:\Claude\My-Gaming-Parlour\start-master.bat`
   ```batch
   @echo off
   cd C:\Claude\My-Gaming-Parlour
   start chrome.exe --app=http://localhost:5173
   npm run dev
   ```

2. Right-click → Create Shortcut → Move to Desktop

### Auto-Start on Windows Boot

1. Press `Win + R`
2. Type `shell:startup`
3. Copy your `.bat` file here

### Client PC Kiosk Mode

Create `start-client.bat` on each client PC:
```batch
@echo off
start chrome.exe --kiosk --app=http://192.168.1.100:5173
```

---

## 📊 System Requirements

**Minimum:**
- Windows 10 (64-bit)
- 4GB RAM
- 500MB free disk space
- Modern browser (Chrome/Edge)

**Recommended:**
- Windows 11
- 8GB RAM
- 1GB free disk space
- Gigabit network
- SSD for better performance

---

## 🔐 Security Checklist

Before going live:

- [ ] Change admin password from default
- [ ] Set up Windows Defender/Antivirus
- [ ] Configure Windows Firewall properly
- [ ] Enable Windows automatic updates
- [ ] Create regular backups (via Master PC → Backup)
- [ ] Train staff on security best practices

---

## 📚 Next Steps

1. **Read Documentation:**
   - `QUICK_START.md` - 5-minute beginner guide
   - `DEPLOYMENT_GUIDE.md` - Production deployment
   - `ADVANCED_FEATURES.md` - All 15 features explained

2. **Test Features:**
   - Create test user accounts
   - Start test sessions
   - Try food ordering
   - Create a tournament
   - Set up reservations

3. **Customize:**
   - Update pricing in Master PC → Users
   - Add your food menu items
   - Configure your games library
   - Set up promo codes

4. **Go Live:**
   - Follow DEPLOYMENT_GUIDE.md
   - Set up all client PCs
   - Train your staff
   - Start serving customers!

---

## 🆘 Getting Help

1. Check `QUICK_START.md` for common tasks
2. Review `DEPLOYMENT_GUIDE.md` troubleshooting section
3. Check browser console for errors (F12)
4. Review code comments in service files

---

## 📝 Important File Locations

- **Database**: Browser's IndexedDB + localStorage
- **Backups**: Download via Master PC → Backup panel
- **Logs**: Browser console (F12 → Console tab)
- **Config**: Services files in `/services` folder

---

**Your Gaming Parlour is ready to rock on Windows!** 🎮

Access at: http://localhost:5173 (local) or http://YOUR-IP:5173 (network)

For any issues, refer to the troubleshooting sections in the documentation files.
