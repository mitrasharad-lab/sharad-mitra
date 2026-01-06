# ⚡ Quick Start Guide

Get your Gaming Parlour System up and running in 5 minutes!

---

## 🚀 For Beginners

### Step 1: Install Node.js

**Windows/macOS:**
1. Download from https://nodejs.org (LTS version)
2. Run installer
3. Open terminal/command prompt
4. Verify: `node --version`

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Get the Code

```bash
# If you have the code:
cd gaming-parlour-management

# Or clone from Git:
git clone https://github.com/your-username/gaming-parlour.git
cd gaming-parlour
```

### Step 3: Install & Run

```bash
# Install (only once)
npm install

# Start the system
npm run dev
```

### Step 4: Access the System

1. Open browser: http://localhost:5173
2. Choose your mode:
   - **Master PC** → Login: `admin` / `admin123`
   - **Client PC** → Choose PC-1 to PC-5 → Login: `demo1` / `demo123`

**That's it! You're running!** 🎉

---

## 🏠 Local Network Setup (Multiple PCs)

### On Master PC (Main Computer):

```bash
cd gaming-parlour-management
npm install
npm run build

# Get your IP address:
# Windows: ipconfig
# Linux/Mac: ifconfig

# Start server (replace 0.0.0.0 with your IP if needed)
npx vite preview --host 0.0.0.0 --port 5173
```

### On Client PCs (Gaming Computers):

1. Open browser
2. Go to: `http://MASTER-PC-IP:5173`
   - Example: `http://192.168.1.100:5173`
3. Select "Client PC"
4. Choose PC number (PC-1, PC-2, etc.)

---

## 🎮 First Time Usage

### As Admin (Master PC):

1. **Login**: admin / admin123
2. **Change Password** (important!):
   - Go to Users → Click admin → Change Password
3. **Add Customers**:
   - Users → Add New User
   - Or use demo accounts: demo1, demo2
4. **Monitor Dashboard**:
   - See all PCs
   - View revenue
   - Manage sessions

### As Customer (Client PC):

1. **Login**: demo1 / demo123 (or your username)
2. **Select Time**: Choose 30 min, 1 hour, 2 hours, etc.
3. **Start Gaming**: Timer starts automatically
4. **Warnings**: You'll get notified 5 minutes before time ends

---

## 📱 Key Features to Try

### 1. Food Ordering
- Master PC → Food & Drinks
- Add menu items
- Process orders
- Track inventory

### 2. Tournaments
- Master PC → Tournaments
- Create tournament
- Register players
- Run competitions

### 3. Reservations
- Customer books PC in advance
- Master PC confirms/manages
- Automated reminders

### 4. Promo Codes
- Master PC → Promo Codes
- See active codes
- Try: `WELCOME10` for 10% off

### 5. Queue System
- When all PCs are full
- Customers join queue
- Auto-notify when available

---

## 🔧 Common Tasks

### Add New User:
```
Master PC → Users → Add User
Fill details → Create
```

### Extend Session:
```
Master PC → Dashboard → Client PC card → Extend button
```

### Create Backup:
```
Master PC → Backup → Create Backup
Download backup file
```

### Export Data:
```
Master PC → Analytics → Export → Choose type → Download CSV
```

### Create Tournament:
```
Master PC → Tournaments → Create Tournament
Set prizes, entry fee, participants → Save
```

---

## 🎯 Sample Data

Your system comes with:

**Users:**
- Admin: `admin` / `admin123`
- Demo1: `demo1` / `demo123` (₹100 balance)
- Demo2: `demo2` / `demo123` (₹200 balance)

**Promo Codes:**
- `WELCOME10` - 10% discount
- `FIRSTGAME` - ₹20 off
- `FREEHOUR` - 60 minutes free
- `WEEKEND50` - 15% off
- `SILVER25` - 25% for premium members

**Food Items:**
- 15 items (snacks, drinks, meals, desserts)
- Prices: ₹15 to ₹125

**Games:**
- 15 popular games pre-loaded
- CS:GO, Valorant, GTA V, Minecraft, and more

**Pricing:**
- 30 min: ₹30
- 1 hour: ₹50
- 2 hours: ₹90
- Full day: ₹400

---

## ⚠️ Troubleshooting

### Can't access from other PCs?
```bash
# Check firewall
# Windows: Allow port 5173 in Windows Defender
# Linux: sudo ufw allow 5173/tcp
```

### Database not saving?
```bash
# Browser storage issue - try different browser
# Or export data and clear browser cache
```

### Session timer not working?
```bash
# Refresh page
# Check browser console for errors (F12)
```

### WebSocket errors?
```bash
# Using BroadcastChannel (same machine only)
# For network mode, see DEPLOYMENT_GUIDE.md
```

---

## 📚 Learn More

- **Full Features**: See ADVANCED_FEATURES.md
- **Deployment**: See DEPLOYMENT_GUIDE.md
- **Technical Docs**: See GAMING_PARLOUR_README.md

---

## 🎓 Tips for Success

1. **Test First**: Use demo accounts to test everything
2. **Backup Regularly**: Master PC → Backup (daily recommended)
3. **Monitor Analytics**: Check what games/times are popular
4. **Train Staff**: Show them Master PC dashboard
5. **Customer Feedback**: Ask users for suggestions
6. **Update Prices**: Adjust based on your market
7. **Use Promos**: Run campaigns to attract customers
8. **Tournaments**: Host weekly events for community

---

## 🆘 Need Help?

1. Check troubleshooting above
2. Read documentation files
3. Check console for errors (F12 in browser)
4. Review code comments in service files

---

**Happy Gaming!** 🎮

Start simple, add features as you grow!
