# Quick Start Guide - Personal Use 👥

## For You and Your Friends!

This algo trading platform is now optimized for **personal use** by a small group of friends. Each person can have their own profile, strategies, and risk preferences!

---

## 🚀 First Time Setup (5 minutes)

### 1. Install Dependencies
```bash
cd d:\AI\Zerodha\AlgoTrading
npm install
cd client
npm install
cd ..
```

### 2. Create Your Profile
```bash
npm run create-profile
```

**You'll be asked:**
- Profile name: `ravi` (lowercase, no spaces)
- Display name: `Ravi Kumar`
- Capital: `100000` (₹1,00,000)
- Risk level: `2` (MODERATE)
- Paper trading: `Y` (Yes, for practice)

**Output:**
```
✅ Profile created successfully!
📁 Profile location: profiles/ravi

🎯 Next steps:
  1. Start the server: npm run dev
  2. Open the web UI: http://localhost:3000
  3. Load your profile and browse default strategies
```

### 3. Configure Environment
```bash
# Copy example env file
copy .env.example .env

# Edit .env - Add your Kite API credentials (if using real trading)
# For paper trading, you can skip this
```

### 4. Start the App
```bash
npm run dev
```

**You'll see:**
```
✅ All services started successfully
📈 India VIX monitoring active
👥 Profile system ready
📝 Paper trading available
📱 Telegram notifications configured
Server running on port 5000
```

### 5. Open Web UI
```
http://localhost:3000
```

---

## 📱 Setup Telegram Notifications (Optional)

Get instant alerts on your phone!

### Step 1: Create Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Give it a name: `My Trading Bot`
4. Give it a username: `mytrading_bot` (must end with 'bot')
5. Copy the **bot token**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 2: Get Your Chat ID
1. Search for `@userinfobot` in Telegram
2. Start a chat
3. It will show your **Chat ID**: `123456789`

### Step 3: Configure in Profile
```bash
# API call or edit profiles/yourname/config.json

# Add to config.json:
"notifications": {
  "telegram": {
    "enabled": true,
    "botToken": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
    "chatId": "123456789",
    "onTradeExecuted": true,
    "onDailySummary": true,
    "onRiskAlert": true
  }
}
```

### Step 4: Test
```bash
# Via API
curl -X POST http://localhost:5000/api/profiles/telegram/test \
  -H "Content-Type: application/json" \
  -d '{
    "botToken": "your_bot_token",
    "chatId": "your_chat_id"
  }'
```

**You should receive:**
```
✅ Telegram Connected!
Your algo trading bot is now connected and will send you alerts.
```

---

## 🎯 Using Default Strategies

We've created **10 ready-to-use strategies** for you!

### Browse Strategies
```bash
# Via API
curl http://localhost:5000/api/profiles/library/strategies
```

**You'll see:**
1. RSI Oversold Reversal (MEDIUM risk, 60-65% win rate)
2. Golden Cross Momentum (MEDIUM risk, 55-60% win rate)
3. VWAP Breakout (HIGH risk, 50-55% win rate)
4. Morning Gap Up (HIGH risk, 55-60% win rate)
5. Support Bounce (LOW risk, 65-70% win rate)
6. Volume Spike Catcher (HIGH risk, 50-55% win rate)
7. Trend Following (MEDIUM risk, 50-55% win rate)
8. Mean Reversion (LOW risk, 70-75% win rate)
9. Resistance Breakout (MEDIUM risk, 55-60% win rate)
10. Intraday Scalper (HIGH risk, 60-65% win rate)

### Adopt a Strategy
```bash
# Via API - Add "RSI Oversold Reversal" to your profile
curl -X POST http://localhost:5000/api/profiles/ravi/strategies/adopt \
  -H "Content-Type: application/json" \
  -d '{"strategyId": "rsi-oversold-reversal"}'
```

**Or via Web UI:**
1. Go to Strategies → Browse Library
2. Click on a strategy to see details
3. Click "Use This Strategy"
4. Customize if needed
5. Click "Activate"

---

## 👥 Multiple Friends Using the App

### Each Friend Creates Their Profile

**Ravi (Aggressive trader):**
```bash
npm run create-profile
# Name: ravi
# Capital: 100000
# Risk: AGGRESSIVE
# Paper trading: No (confident)
```

**Priya (Conservative learner):**
```bash
npm run create-profile
# Name: priya
# Capital: 50000
# Risk: CONSERVATIVE
# Paper trading: Yes (learning)
```

**Amit (Moderate trader):**
```bash
npm run create-profile
# Name: amit
# Capital: 75000
# Risk: MODERATE
# Paper trading: Yes (testing)
```

### Switch Between Profiles

**Via API:**
```bash
# Load Ravi's profile
curl http://localhost:5000/api/profiles/ravi

# Load Priya's profile
curl http://localhost:5000/api/profiles/priya
```

**Via Web UI:**
- Top-right corner → Profile selector
- Select your name from dropdown

### Share Strategies

**Ravi creates a great strategy:**
1. Go to Strategies → My Strategies
2. Click on the strategy
3. Click "Export"
4. Share the JSON file with friends

**Priya imports it:**
1. Go to Strategies → Import
2. Upload Ravi's strategy JSON
3. Click "Import"
4. Strategy added to her profile!

---

## 📊 Paper Trading vs Real Trading

### Paper Trading (Default)
- ✅ Practice without risking real money
- ✅ Starts with virtual ₹1,00,000
- ✅ All trades simulated realistically
- ✅ Track performance
- ✅ Test strategies

**How to use:**
```javascript
// Already enabled by default in profile
{
  "trading": {
    "paperTrading": true,
    "capital": 100000
  }
}
```

### Switch to Real Trading

**⚠️ Only when confident!**

1. Update profile:
```json
{
  "trading": {
    "paperTrading": false
  }
}
```

2. Authenticate with Kite:
```
http://localhost:5000/auth.html
```

3. First trade will ask for confirmation:
```
⚠️ WARNING: You are about to execute your first REAL trade!
Are you sure? (yes/no)
```

---

## 🎓 Learning Path

### Week 1: Setup & Understand
- [x] Create profile
- [x] Enable paper trading
- [x] Browse default strategies
- [x] Read strategy descriptions
- [ ] Watch trades execute (observe only)

### Week 2: Experiment
- [ ] Activate 1-2 conservative strategies
- [ ] Track performance daily
- [ ] Understand why trades happened
- [ ] Adjust strategy parameters

### Week 3: Optimize
- [ ] Compare strategy performance
- [ ] Keep winning strategies
- [ ] Remove losing strategies
- [ ] Create your own custom strategy

### Week 4: Confidence Check
- [ ] Review P&L
- [ ] Win rate >55%?
- [ ] Understand market conditions?
- [ ] Ready for real trading?

**Only then → Switch to real trading with SMALL amounts**

---

## 🔥 Pro Tips

### 1. Start Conservative
- Use strategies with LOW or MEDIUM risk
- Start with small capital allocation
- Enable paper trading first

### 2. Diversify Strategies
- Don't use just 1 strategy
- Mix REVERSAL + BREAKOUT + MOMENTUM
- Some for trending markets, some for sideways

### 3. Monitor India VIX
- VIX < 15: Normal market, use all strategies
- VIX 15-20: Slightly cautious
- VIX > 25: High volatility, reduce position sizes or sit out

**The app automatically adjusts based on VIX!**

### 4. Set Limits
- Max trades per day (avoid overtrading)
- Max loss per day (protect capital)
- Max position size (diversify)

**Example:**
```json
{
  "trading": {
    "maxDailyTrades": 5,
    "maxDailyLoss": 2000,
    "maxPositionSize": 25000
  }
}
```

### 5. Keep a Journal
- Why did you enter this trade?
- What were the indicators saying?
- What can you learn from losses?

**Auto-logged for you!**

---

## 🤝 Group Features

### 1. Friendly Competition
```bash
# Get profile stats
curl http://localhost:5000/api/profiles/ravi/statistics

# Compare with friends
# Who has the best win rate?
# Who made the most profit?
```

### 2. Share Learnings
- Create a Discord/Telegram group
- Share what worked, what didn't
- Discuss market conditions
- Help each other improve

### 3. Strategy Marketplace (Among Friends)
- Share profitable strategies
- Test each other's strategies
- Collaborate on improvements

---

## ⚙️ Common Tasks

### View Your Trades
```bash
curl http://localhost:5000/api/profiles/ravi/trades
```

### View Your Strategies
```bash
curl http://localhost:5000/api/profiles/ravi/strategies
```

### View Your Statistics
```bash
curl http://localhost:5000/api/profiles/ravi/statistics
```

### Update Profile Settings
```bash
curl -X PUT http://localhost:5000/api/profiles/ravi \
  -H "Content-Type: application/json" \
  -d '{
    "trading": {
      "maxDailyTrades": 10,
      "defaultStopLoss": 2,
      "defaultTakeProfit": 5
    }
  }'
```

### Export Profile (Backup)
```bash
curl http://localhost:5000/api/profiles/ravi/export > ravi_backup.json
```

### Import Profile (Restore)
```bash
curl -X POST http://localhost:5000/api/profiles/ravi/import \
  -H "Content-Type: application/json" \
  -d @ravi_backup.json
```

---

## 🆘 Troubleshooting

### Profile not found
```bash
# Create it first
npm run create-profile
```

### Telegram not working
```bash
# Test connection
curl -X POST http://localhost:5000/api/profiles/telegram/test \
  -H "Content-Type: application/json" \
  -d '{
    "botToken": "your_bot_token",
    "chatId": "your_chat_id"
  }'

# Check response for errors
```

### Strategies not executing
```bash
# Check if strategies are active
curl http://localhost:5000/api/profiles/ravi/strategies

# Make sure "isActive": true
```

### VIX not updating
```bash
# Check logs
# VIX updates every 5 minutes from NSE
# If NSE API is down, uses last known value
```

---

## 🎉 Success Stories

### Ravi's Journey
```
Day 1:  Paper trading with RSI Oversold
  ↓
Week 2: 65% win rate, +₹8,500 profit (paper)
  ↓
Week 4: Switched to real trading with ₹25,000
  ↓
Month 3: Consistent ₹5,000-7,000 monthly profit
  ↓
Month 6: Using 5 strategies, ₹15,000 monthly
```

### Priya's Conservative Approach
```
Week 1-4: Paper trading only, learning
  ↓
Month 2: Real trading with CONSERVATIVE strategies
  ↓
Month 6: 70% win rate, small but consistent profits
  ↓
Result: ₹3,000-4,000 monthly (low risk)
```

---

## 📚 Next Steps

Once comfortable:
- [ ] Create custom strategies
- [ ] Backtest on historical data
- [ ] Optimize position sizing
- [ ] Explore F&O trading (advanced)
- [ ] Scale up capital

**Remember: Consistency > Big wins!**

---

## 💬 Get Help

- Check logs: `logs/app.log`
- API docs: `API_REFERENCE.md`
- Business model: `BUSINESS_EVALUATION.md`
- Roadmap: `PERSONAL_USE_ROADMAP.md`

**Happy Trading! 🚀📈**
