# Kite Algo Trading Platform - Setup Guide

## Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
3. **Zerodha Kite Connect Account** - [Sign up here](https://kite.trade/)

### Step 1: Get Kite Connect Credentials

1. Go to [Kite Connect](https://kite.trade/) and sign up
2. Create an app to get:
   - API Key
   - API Secret
3. Generate access token using the login flow

**Important**: The access token expires daily and needs to be regenerated. For development, you can use request token flow.

### Step 2: Install MongoDB

**Windows:**
```powershell
# Download and install MongoDB from https://www.mongodb.com/try/download/community
# Or using Chocolatey:
choco install mongodb

# Start MongoDB
mongod
```

**Linux/Mac:**
```bash
# Using package manager
sudo apt-get install mongodb  # Ubuntu/Debian
brew install mongodb-community  # Mac

# Start MongoDB
sudo systemctl start mongod
```

### Step 3: Clone and Setup Project

```powershell
# Navigate to the project directory
cd d:\AI\Zerodha\AlgoTrading

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 4: Configure Environment Variables

1. Copy the example environment file:
```powershell
Copy-Item .env.example .env
```

2. Edit `.env` file with your credentials:
```env
# Zerodha Kite Connect API Configuration
KITE_API_KEY=your_actual_api_key_here
KITE_API_SECRET=your_actual_api_secret_here
KITE_ACCESS_TOKEN=your_actual_access_token_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/kite-algo-trading

# WebSocket Configuration
WS_RECONNECT_INTERVAL=5000
MAX_RECONNECT_ATTEMPTS=10

# Trading Configuration
ENABLE_AUTO_TRADING=false  # IMPORTANT: Set to false initially for safety!
MAX_POSITIONS=5
MAX_ORDER_VALUE=50000
RISK_PER_TRADE=0.02

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANT SAFETY SETTINGS:**
- Keep `ENABLE_AUTO_TRADING=false` while testing
- Test thoroughly in paper trading mode before enabling auto-trading
- Set appropriate risk limits (MAX_POSITIONS, MAX_ORDER_VALUE, etc.)

### Step 5: Start the Application

**Option 1: Start everything together**
```powershell
npm run dev:all
```

**Option 2: Start separately**

Terminal 1 (Backend):
```powershell
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd client
npm start
```

### Step 6: Access the Application

- **Frontend**: Open browser to http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Using the Platform

### 1. Dashboard
- View real-time market statistics
- Monitor active strategies
- Track open positions and recent trades
- See live trading signals

### 2. Stock Filter
- Search for stocks by symbol
- Apply multiple filters:
  - Price range (min/max)
  - RSI range (Relative Strength Index)
  - Volume thresholds
  - Buyer/Seller ratio
  - Volume change percentage
- View real-time updates for filtered stocks
- Identify "Only Buyer" or "Only Seller" states

### 3. Strategy Builder

**Creating a Strategy:**

1. Click "New Strategy" button
2. Fill in strategy details:
   - **Name**: Give your strategy a descriptive name
   - **Type**: Choose from Breakout, Reversal, Momentum, Mean Reversion, or Custom
   - **Conditions**: Set entry conditions
     - Price range
     - RSI thresholds (e.g., 30-70 for reversal)
     - Volume minimums
     - Buyer/Seller ratio minimums
   - **Trade Configuration**:
     - Transaction Type (BUY/SELL)
     - Quantity
     - Order Type (MARKET/LIMIT)
     - Product (CNC/MIS/NRML)
   - **Instruments**: Select stocks to apply this strategy
   - **Activate**: Enable/disable the strategy

3. Click "Create" to save

**Example Strategies:**

**Breakout Strategy:**
```
Conditions:
- Volume Change Min: 200% (2x normal volume)
- Buyer/Seller Ratio Min: 2.0
- RSI Min: 50, RSI Max: 70
- Price Above SMA20: Yes

Trade Config:
- Transaction Type: BUY
- Quantity: 10
- Order Type: MARKET
- Product: CNC
```

**Reversal Strategy:**
```
Conditions:
- RSI Min: 0, RSI Max: 30 (oversold)
- Buyer/Seller Ratio Min: 1.5
- Volume Change Min: 50%

Trade Config:
- Transaction Type: BUY
- Quantity: 5
- Order Type: MARKET
```

### 4. Trade History
- View all executed trades
- Filter by status (Pending, Open, Complete, etc.)
- Track P&L for each trade
- Monitor success rate

## Testing Before Going Live

### Step 1: Paper Trading Mode

Keep `ENABLE_AUTO_TRADING=false` in your `.env` file. This allows you to:
- Create and test strategies
- Receive signals
- See what would be traded
- No actual orders are placed

### Step 2: Test with Real Data

1. Add stocks to watchlist
2. Create simple strategies with clear conditions
3. Monitor signals generated
4. Verify the logic matches your expectations

### Step 3: Enable Auto-Trading (When Ready)

**⚠️ WARNING: Only enable after thorough testing!**

1. Update `.env`:
```env
ENABLE_AUTO_TRADING=true
```

2. Set safety limits:
```env
MAX_POSITIONS=3          # Maximum concurrent positions
MAX_ORDER_VALUE=10000    # Maximum value per order
RISK_PER_TRADE=0.01      # 1% risk per trade
```

3. Restart the backend:
```powershell
npm run dev
```

4. Monitor closely during market hours

## Common Issues and Solutions

### Issue 1: MongoDB Connection Failed
**Solution:**
```powershell
# Start MongoDB service
mongod

# Or on Linux:
sudo systemctl start mongod
```

### Issue 2: Kite API Authentication Error
**Solutions:**
- Verify API Key and Secret are correct
- Regenerate access token (expires daily)
- Check if API subscription is active

### Issue 3: WebSocket Not Connecting
**Solutions:**
- Verify access token is valid
- Check internet connection
- Ensure firewall allows WebSocket connections

### Issue 4: No Live Data
**Solutions:**
- Check if market is open (9:15 AM - 3:30 PM IST, Mon-Fri)
- Verify WebSocket connection (green indicator in UI)
- Check if instruments are subscribed

## API Rate Limits

Kite Connect has rate limits:
- 3 requests per second
- Handled automatically by the platform's rate limiter
- WebSocket for real-time data (no polling needed)

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment variables** for all sensitive data
3. **Start with small quantities** when testing live trading
4. **Set strict risk limits**
5. **Monitor logs** regularly
6. **Keep access tokens secure**

## Getting Help

- Check logs in `logs/` directory
- Review console output for errors
- Ensure all dependencies are installed
- Verify MongoDB is running
- Check Kite Connect API status

## Next Steps

1. ✅ Install and configure the platform
2. ✅ Test with paper trading mode
3. ✅ Create and test simple strategies
4. ✅ Monitor signals and verify logic
5. ✅ Gradually enable auto-trading with limits
6. 🚀 Scale up as you gain confidence

## Development

### Running Tests
```powershell
npm test
```

### Building for Production
```powershell
# Build frontend
cd client
npm run build

# The build files will be in client/build/
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Use process manager (PM2):
```powershell
npm install -g pm2
pm2 start backend/server.js --name kite-algo-trading
```

## License

MIT License - See LICENSE file for details

## Disclaimer

**IMPORTANT**: This software is for educational purposes only. Trading in financial markets involves significant risk of loss. The developers are not responsible for any financial losses incurred while using this software. Always:
- Test thoroughly before live trading
- Start with small amounts
- Set strict risk limits
- Never invest more than you can afford to lose
- Consult with a financial advisor

---

**Happy Trading! 🚀📈**
