# Personal Use Roadmap - Algo Trading for Friends 👥

## Vision
**"Empower a small group of friends to trade algorithmically with their own personalized strategies, risk preferences, and learning goals."**

Not a business platform - just a powerful tool friends can use together, learn from each other, and improve their trading skills.

---

## Key Principles

1. **Easy to Use** - Non-technical friends should be able to use it
2. **Personalized** - Each person has their own strategies, risk limits, preferences
3. **Safe** - Paper trading, risk limits, confirmations before real trades
4. **Social** - Share strategies, compete friendly, learn together
5. **Educational** - Understand why trades happened, journal insights

---

## Feature Set for Personal/Group Use

### ✅ Already Working
- Real-time market data
- Technical indicators (RSI, SMA, EMA, VWAP)
- Strategy execution
- Trade logging
- Stock filtering
- Risk management (stop-loss/take-profit)

### 🚀 High-Value Additions (Implementing Now)

#### 1. Trading Configuration System
**Why:** Different friends want different trading styles

**Features:**
```javascript
{
  // Per-user config
  "ravi": {
    "tradingHours": { "start": "09:15", "end": "15:30" },
    "maxDailyTrades": 10,
    "maxPositionSize": 50000,
    "defaultStopLoss": 2,
    "defaultTakeProfit": 5,
    "exchanges": ["NSE"],
    "riskPerTrade": 1,  // % of capital
    "paperTrading": false
  },
  "priya": {
    "tradingHours": { "start": "10:00", "end": "14:00" },  // More conservative hours
    "maxDailyTrades": 5,
    "maxPositionSize": 25000,
    "defaultStopLoss": 1.5,
    "defaultTakeProfit": 3,
    "paperTrading": true  // Still learning
  }
}
```

**Value:** Everyone trades according to their comfort level

---

#### 2. User Profiles (File-Based)
**Why:** Each friend has their own strategies and preferences

**Features:**
- Create profile with name, capital, risk tolerance
- Each profile has separate strategies
- Each profile has separate trade history
- Switch between profiles easily
- No database needed - JSON files per user

**File Structure:**
```
profiles/
  ravi/
    config.json
    strategies.json
    trades.json
    watchlists.json
  priya/
    config.json
    strategies.json
    trades.json
    watchlists.json
```

**Value:** Multiple people can use the same system without conflicts

---

#### 3. Default Strategies Library
**Why:** Friends want to start trading quickly without building strategies from scratch

**Pre-built Strategies:**
1. **RSI Oversold Reversal** - Buy when RSI < 30, strong volume
2. **Golden Cross Momentum** - Buy when SMA20 crosses above SMA50
3. **VWAP Breakout** - Buy when price breaks above VWAP with volume
4. **Morning Gap Up** - Trade stocks that gap up >2% at open
5. **Support Bounce** - Buy at support levels with confirmation
6. **Volume Spike Catcher** - Catch unusual volume spikes early
7. **Trend Following** - Follow strong trends with trailing stop
8. **Mean Reversion** - Fade extreme moves (conservative)
9. **Breakout Trader** - Trade breakouts above resistance
10. **Intraday Scalper** - Quick 0.5-1% profits multiple times

**Each strategy includes:**
- Name & description
- Risk level (Low/Medium/High)
- Recommended capital
- Expected win rate
- Backtested results (with sample data)
- When to use it (market conditions)

**Value:** Beginners can start immediately, learn from working strategies

---

#### 4. Paper Trading Mode
**Why:** Practice without risking real money

**Features:**
- Toggle paper trading per user
- Starts with virtual ₹1,00,000
- All trades simulated (no real API calls)
- Realistic execution (market impact, slippage)
- Track performance vs real trading
- Graduate to real trading when confident

**Value:** Learn and test strategies risk-free

---

#### 5. Telegram Notifications
**Why:** Get instant alerts without watching the screen

**Notifications:**
- 🔔 Trade executed: "SBIN BUY 100 @ ₹650 (RSI Oversold Strategy)"
- 📊 Daily summary: "5 trades, 3 wins, +₹1,250 profit"
- ⚠️ Risk alerts: "Stop-loss hit on RELIANCE"
- 📈 Opportunity alerts: "INFY matching your strategy criteria"
- 🎯 Target reached: "TATAMOTORS hit +5% target"

**Setup:**
```javascript
// Each user can configure their own Telegram bot
{
  "telegram": {
    "enabled": true,
    "botToken": "your_bot_token",
    "chatId": "your_chat_id",
    "notifications": {
      "tradeExecuted": true,
      "dailySummary": true,
      "riskAlerts": true,
      "opportunities": false
    }
  }
}
```

**Value:** Stay informed without constant monitoring

---

#### 6. India VIX Integration
**Why:** Adapt to market volatility automatically

**How it works:**
```javascript
// Morning: Fetch India VIX
const vix = await getIndiaVIX();  // e.g., 15.5

// Calculate volatility multiplier
const volatilityMultiplier = vix / 15;  // 1.0 in normal market, 1.5 in volatile

// Adjust strategy parameters
strategy.stopLoss = baseStopLoss * volatilityMultiplier;        // Wider stop in volatile markets
strategy.quantity = baseQuantity / volatilityMultiplier;        // Smaller position in volatile markets
strategy.takeProfit = baseTakeProfit * volatilityMultiplier;    // Higher targets in volatile markets
```

**Example:**
- Normal market (VIX=15): 2% stop-loss, 100 shares, 5% target
- Volatile market (VIX=25): 3.3% stop-loss, 60 shares, 8.3% target

**Value:** Dynamic risk management based on market conditions

---

#### 7. Advanced Strategy Features

**a) Wait Period After Stop-Loss**
```javascript
{
  "waitAfterStopLoss": 300,  // Wait 5 minutes before re-entering
  "cooldownPeriod": 1800     // 30 min cooldown for same stock
}
```

**Why:** Avoid revenge trading, let dust settle

---

**b) Pyramiding (Add to Winners)**
```javascript
{
  "pyramiding": {
    "enabled": true,
    "maxEntries": 3,
    "entries": [
      { "priceDropPercent": 2, "multiplier": 1 },   // First entry at 2% drop
      { "priceDropPercent": 4, "multiplier": 1.5 }, // Second entry at 4% drop (1.5x size)
      { "priceDropPercent": 6, "multiplier": 2 }    // Third entry at 6% drop (2x size)
    ]
  }
}
```

**Why:** Average down on dips, maximize winners

---

**c) Different Amounts per Strategy**
```javascript
const strategies = [
  {
    name: "Safe RSI Reversal",
    capitalAllocation: 50000,
    riskPerTrade: 0.5,    // Conservative
    maxPositions: 2
  },
  {
    name: "Aggressive Breakout",
    capitalAllocation: 100000,
    riskPerTrade: 2,      // Aggressive
    maxPositions: 5
  }
];
```

**Value:** Risk what you're comfortable with per strategy

---

#### 8. Backtesting Engine
**Why:** Test before trading real money

**Features:**
- Load historical data (JSON or CSV)
- Run strategy on past data
- Generate performance report:
  - Total return %
  - Win rate
  - Average profit per trade
  - Max drawdown
  - Sharpe ratio
  - Best/worst trades
- Visualize equity curve
- Compare multiple strategies

**Example Backtest:**
```
Strategy: RSI Oversold Reversal
Period: Jan 1, 2025 - Jan 31, 2025
Capital: ₹1,00,000

Results:
- Total trades: 45
- Winners: 28 (62%)
- Losers: 17 (38%)
- Profit: ₹8,750 (+8.75%)
- Max drawdown: -₹2,100 (-2.1%)
- Best trade: +₹1,200 (ITC)
- Worst trade: -₹800 (SBIN)

Recommendation: ✅ Strategy looks good for trending markets
```

**Value:** Confidence before risking real money

---

#### 9. Trade Journal
**Why:** Learn from successes and mistakes

**Features:**
- Auto-log every trade with context:
  - Why did the strategy trigger?
  - What were the indicator values?
  - Market conditions (VIX, trend)
  - Entry/exit reasoning
- Add manual notes:
  - "Should have waited for confirmation"
  - "Perfect entry, market trended all day"
- Review past trades:
  - Filter by strategy, outcome, date
  - Find patterns in losses
  - Replicate winning setups
- Weekly review summary:
  - "You tend to exit winners too early"
  - "Your stop-losses are too tight on Mondays"

**Value:** Continuous improvement, avoid repeating mistakes

---

#### 10. Shared Features for Group

**a) Group Dashboard**
```javascript
// Overview of all active traders (opt-in)
{
  "groupPerformance": [
    { "name": "Ravi", "todayPnL": +1250, "weekPnL": +3800, "trades": 8 },
    { "name": "Priya", "todayPnL": +850, "weekPnL": +2100, "trades": 5 },
    { "name": "Amit", "todayPnL": -500, "weekPnL": +1200, "trades": 12 }
  ]
}
```

**b) Shared Watchlists**
```javascript
// Anyone can add stocks to shared list
{
  "sharedWatchlists": {
    "momentum-picks": ["RELIANCE", "TCS", "INFY"],
    "value-stocks": ["ITC", "SBIN", "VEDL"],
    "breakout-watch": ["TATAMOTORS", "AXISBANK"]
  }
}
```

**c) Strategy Sharing**
```javascript
// Share strategies with friends (JSON export/import)
// Ravi creates a great strategy → exports → shares with Priya
```

**d) Friendly Leaderboard**
```javascript
// Weekly leaderboard (optional, opt-in)
{
  "weeklyLeaderboard": [
    { "rank": 1, "name": "Ravi", "return": 8.5, "trades": 15 },
    { "rank": 2, "name": "Priya", "return": 5.2, "trades": 8 },
    { "rank": 3, "name": "Amit", "return": 3.1, "trades": 20 }
  ]
}
```

**e) Group Chat / Discord Integration**
- Post daily summaries to Discord/Telegram group
- Discuss strategies
- Share learnings
- Celebrate wins, support on losses

**Value:** Social learning, motivation, friendly competition

---

## Implementation Priority

### Phase 1: Core Personalization (This week)
1. ✅ Trading configuration system
2. ✅ User profiles (file-based)
3. ✅ Default strategies library
4. ✅ Paper trading mode
5. ✅ India VIX integration

**Outcome:** Each friend can use the app their own way

---

### Phase 2: Notifications & Safety (Next week)
1. ✅ Telegram notifications
2. ✅ Wait period & pyramiding
3. ✅ Different amounts per strategy
4. ✅ Risk limits enforcement
5. ✅ Daily/weekly limits

**Outcome:** Safe, informed trading

---

### Phase 3: Learning & Improvement (Week 3)
1. ✅ Backtesting engine
2. ✅ Trade journal
3. ✅ Performance analytics
4. ✅ Strategy comparison
5. ✅ Historical data storage

**Outcome:** Learn and improve continuously

---

### Phase 4: Group Features (Week 4)
1. ✅ Group dashboard
2. ✅ Shared watchlists
3. ✅ Strategy sharing (export/import)
4. ✅ Discord integration
5. ✅ Friendly leaderboard

**Outcome:** Collaborative learning

---

## Architecture Updates

### Current Structure
```
AlgoTrading/
  backend/
    config/
    controllers/
    models/
    services/
    routes/
  client/
```

### New Structure
```
AlgoTrading/
  backend/
    config/
      trading.config.js         # NEW: Trading parameters
      vix.config.js             # NEW: VIX settings
    controllers/
      profile.controller.js     # NEW: User profiles
      backtest.controller.js    # NEW: Backtesting
      notification.controller.js # NEW: Telegram/Discord
    services/
      profile.service.js        # NEW: Profile management
      backtest.service.js       # NEW: Backtest engine
      vix.service.js            # NEW: VIX data
      telegram.service.js       # NEW: Telegram bot
      paper-trading.service.js  # NEW: Simulated trading
    models/
      Profile.model.js          # NEW: User profile
      TradeJournal.model.js     # NEW: Trade notes
    routes/
      profile.routes.js         # NEW
      backtest.routes.js        # NEW
  
  profiles/                     # NEW: User data
    ravi/
      config.json
      strategies.json
      trades.json
      journal.json
    priya/
      ...
  
  data/                         # NEW: Historical data
    historical/
      SBIN_2025_01.json
      RELIANCE_2025_01.json
  
  strategies/                   # NEW: Default strategies
    rsi-oversold.json
    golden-cross.json
    vwap-breakout.json
```

---

## Quick Setup Guide for Friends

### 1. Initial Setup (5 minutes)
```bash
# Clone and install
git clone <repo>
cd AlgoTrading
npm install
cd client && npm install

# Create your profile
npm run create-profile

# Enter your details:
# Name: Ravi
# Capital: 100000
# Risk Level: Medium
# Paper Trading: Yes
```

### 2. Configure Kite (if using real trading)
```bash
# Edit .env
KITE_API_KEY=your_key
KITE_API_SECRET=your_secret

# Authenticate
# Visit http://localhost:5000/auth.html
```

### 3. Choose Strategies
```bash
# Web UI: http://localhost:3000
# Go to Strategies → Browse Library
# Click "Use This Strategy" on pre-built strategies
# Customize if needed
```

### 4. Enable Notifications (optional)
```bash
# Create Telegram bot (@BotFather)
# Add bot token to your profile config
# Get chat ID and add to config
```

### 5. Start Trading!
```bash
npm run dev

# Paper trading: Test strategies risk-free
# Real trading: Strategies execute automatically
# Monitor: Web dashboard + Telegram alerts
```

---

## Safety Features

### 1. Confirmation Before First Real Trade
```
⚠️ WARNING: You are about to execute your first REAL trade!

Strategy: RSI Oversold Reversal
Action: BUY 100 shares of SBIN @ ₹650
Investment: ₹65,000

Are you sure you want to proceed? (yes/no)
```

### 2. Daily Limits
```javascript
{
  "dailyLimits": {
    "maxTrades": 10,           // Stop after 10 trades
    "maxLoss": 5000,           // Stop if loss exceeds ₹5,000
    "maxInvestment": 100000    // Stop if total investment exceeds ₹1L
  }
}
```

### 3. Risk Warnings
```
⚠️ You have lost ₹4,500 today (90% of daily limit)
⚠️ You have executed 9/10 trades today
⚠️ VIX is at 28 (high volatility) - Consider reducing position sizes
```

---

## Learning Resources (Built-in)

### 1. Strategy Explanations
Each default strategy includes:
- **What it does:** Plain English explanation
- **When to use:** Market conditions where it works best
- **Risk level:** Conservative/Moderate/Aggressive
- **Typical win rate:** Based on backtests
- **Example trades:** Real-world examples

### 2. Indicator Glossary
- What is RSI? How to read it?
- What is VWAP? Why traders use it?
- What is India VIX? How it affects trading?

### 3. Best Practices
- How to manage risk?
- When to increase position size?
- How to avoid overtrading?
- What to do after a losing streak?

---

## Next Steps

### I'm going to implement:
1. ✅ Trading config system (30 min)
2. ✅ User profiles (45 min)
3. ✅ Default strategies library (1 hour)
4. ✅ Paper trading mode (45 min)
5. ✅ Telegram notifications (1 hour)
6. ✅ India VIX integration (30 min)

**Total: ~5 hours of implementation**

After this, you and your friends can:
- Create individual profiles
- Choose from 10 pre-built strategies
- Practice with paper trading
- Get Telegram alerts
- Adapt to market volatility automatically

**Ready to start? Let's build this! 🚀**
