# Quick Start Guide - Test WITHOUT API Keys!

## 🚀 Fastest Way to Test the Platform

You can test the entire platform **without Kite API credentials** using Demo Mode!

### Step 1: Install MongoDB

**Windows (Quick Method):**
```powershell
# Using Chocolatey
choco install mongodb

# Start MongoDB
net start MongoDB
```

**OR Download Installer:**
1. Visit: https://www.mongodb.com/try/download/community
2. Download & Install MongoDB Community Server
3. Start the service

See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed instructions.

### Step 2: Install Dependencies

```powershell
cd d:\AI\Zerodha\AlgoTrading

# Install all dependencies
npm run install:all
```

This will install:
- Backend dependencies (Express, MongoDB, Socket.io, kiteconnect@5.1.0)
- Frontend dependencies (React, Material-UI)

### Step 3: Verify Demo Mode is Enabled

The `.env` file should have:
```env
DEMO_MODE=false
DEMO_MODE_DB=true
```

This is **already configured** for you! No API keys needed.

### Step 4: Start the Application

**Option 1: Start everything together (Recommended)**

for /f "tokens=5" %a in ('netstat -ano ^| findstr :5000') do taskkill /PID %a /F

```powershell
npm run dev:all
```

**Option 2: Start separately**

Terminal 1 - Backend:
```powershell
npm run dev
```

Terminal 2 - Frontend:
```powershell
cd client
npm start
```

### Step 5: Access the Platform

Open your browser to: **http://localhost:3000**

You'll see:
- ✅ Real-time mock data (prices updating every second)
- ✅ 7 popular stocks (SBIN, INFY, TCS, RELIANCE, HDFCBANK, ICICIBANK, WIPRO)
- ✅ Fully functional UI with filtering
- ✅ Strategy builder
- ✅ Trade history
- ✅ Dashboard with live updates

## 📊 What You Can Test in Demo Mode

### ✅ Available Features

1. **Stock Filtering**
   - Search for stocks by name/symbol
   - Filter by price, RSI, volume, buyer/seller ratio
   - See real-time mock price updates
   - View order book depth

2. **Strategy Builder**
   - Create custom strategies
   - Set conditions (RSI, volume, price ranges)
   - Test strategy logic
   - See signal generation (with mock data)

3. **Dashboard**
   - Real-time statistics
   - Mock positions
   - Trade history
   - Live signals

4. **Technical Indicators**
   - RSI (Relative Strength Index)
   - Moving Averages (SMA20, SMA50)
   - VWAP
   - Volume analysis
   - Buyer/Seller ratio

### ⚠️ Demo Mode Limitations

- Mock data only (7 stocks)
- Orders are simulated - not sent to Zerodha
- No real money involved
- Limited to NSE exchange
- Prices change randomly for simulation

## 🔄 Switching to Real Kite API

Once you've tested and are comfortable with the platform:

### Step 1: Get Kite Connect Credentials

1. Sign up at: https://kite.trade/
2. Create an app
3. Get your API Key, API Secret
4. Generate Access Token

### Step 2: Update .env

```env
# Disable demo mode
DEMO_MODE=false

# Add your real credentials
KITE_API_KEY=your_actual_api_key
KITE_API_SECRET=your_actual_api_secret
KITE_ACCESS_TOKEN=your_actual_access_token
```

### Step 3: Restart the Application

```powershell
npm run dev:all
```

Now you're connected to real Kite API! 🎉

## 📋 Installation Checklist

- [ ] MongoDB installed and running
- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm run install:all`)
- [ ] `.env` file has `DEMO_MODE=true`
- [ ] Backend starts without errors
- [ ] Frontend opens in browser
- [ ] Can see mock stocks in UI

## 🧪 Testing the Platform

### Test 1: Stock Filter

1. Go to "Stock Filter" page
2. Set filters:
   - Min RSI: 30
   - Max RSI: 70
   - Min Buyer/Seller Ratio: 1.5
3. Click "Search"
4. Watch prices update in real-time!

### Test 2: Create a Strategy

1. Go to "Strategies" page
2. Click "New Strategy"
3. Fill in:
   - Name: "RSI Reversal Test"
   - RSI Min: 0, RSI Max: 35
   - Transaction Type: BUY
4. Select instruments (e.g., SBIN, INFY)
5. Enable the strategy
6. Watch for signals in Dashboard!

### Test 3: Dashboard

1. Go to "Dashboard"
2. Watch for:
   - Live signals appearing
   - Mock positions showing
   - Statistics updating

## 🐛 Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```powershell
# Start MongoDB
net start MongoDB

# Verify it's running
Get-Service MongoDB
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```powershell
# Change port in .env
PORT=5001
```

Or kill the process using port 5000:
```powershell
# Find process
netstat -ano | findstr :5000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Cannot Find Module 'kiteconnect'

**Solution:**
```powershell
# Reinstall dependencies
npm install
cd client
npm install
```

### Demo Mode Not Working

**Solution:**
Check console logs. You should see:
```
📊 Kite Service initialized in DEMO MODE
📊 Starting mock ticker (DEMO MODE)
```

If not, verify `.env` has:
```env
DEMO_MODE=true
```

## 📚 Next Steps

1. ✅ Test in Demo Mode (No API keys needed)
2. ✅ Understand the platform features
3. ✅ Create and test strategies
4. ✅ Get comfortable with the UI
5. 🔑 Get Kite API credentials when ready
6. 🔄 Switch to real API
7. 📈 Start with paper trading mode
8. 💰 Enable auto-trading (carefully!)

## 🎯 Platform Overview

### Backend (http://localhost:5000)
- Express REST API
- MongoDB database
- WebSocket for real-time data
- Strategy evaluation engine
- Technical indicators calculation

### Frontend (http://localhost:3000)
- React with Material-UI
- Real-time updates via Socket.io
- Stock filtering interface
- Strategy builder
- Dashboard & analytics

## 💡 Tips

1. **Start in Demo Mode** - Test everything without risk
2. **Monitor Console Logs** - Backend shows all activity
3. **Check Browser Console** - Frontend logs WebSocket events
4. **Use MongoDB Compass** - Visual tool to see database
5. **Test Strategies Thoroughly** - Before enabling auto-trading

## ✅ Verification Commands

```powershell
# Check MongoDB is running
Get-Service MongoDB

# Connect to MongoDB shell
mongosh

# In mongosh, verify database:
use kite-algo-trading
show collections

# Check backend health
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:3000
```

## 🎊 You're Ready!

If all checks pass, you can now:
- Test the entire platform
- Create strategies
- See mock data flowing
- Understand the architecture
- Prepare for real trading

**All without spending a penny or connecting to Zerodha!** 🚀

Need help? Check:
- [README.md](README.md) - Full project documentation
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - Detailed MongoDB setup
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Production setup guide
