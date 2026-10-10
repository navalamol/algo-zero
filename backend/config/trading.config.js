// Trading Configuration System
// Centralized config for trading parameters

const dotenv = require('dotenv');
dotenv.config();

const TRADING_CONFIG = {
  // Market Hours
  marketHours: {
    start: '09:15',
    end: '15:30',
    preMarketStart: '09:00',
    postMarketEnd: '15:45'
  },

  // Evaluation Intervals
  evaluation: {
    tickInterval: 1000,        // Evaluate strategies every 1 second
    dataFetchInterval: 5000,   // Fetch quote data every 5 seconds
    vixUpdateInterval: 300000  // Update VIX every 5 minutes
  },

  // Exchanges
  exchanges: ['NSE', 'BSE'],
  defaultExchange: 'NSE',

  // Risk Management Defaults
  risk: {
    defaultStopLoss: 2,           // 2% stop-loss
    defaultTakeProfit: 5,         // 5% take-profit
    maxDailyLoss: 5000,           // Max ₹5,000 loss per day
    maxDailyTrades: 20,           // Max 20 trades per day
    maxConcurrentPositions: 5,   // Max 5 open positions
    maxPositionSize: 100000,     // Max ₹1L per position
    riskPerTrade: 1              // Risk 1% of capital per trade
  },

  // Order Defaults
  order: {
    defaultOrderType: 'MARKET',
    defaultProduct: 'CNC',
    defaultQuantity: 1,
    allowAfterMarketOrders: false
  },

  // Strategy Execution
  strategy: {
    enabled: true,
    autoExecute: true,
    requireConfirmation: false,
    waitAfterStopLoss: 300,      // Wait 5 minutes after stop-loss hit
    cooldownPeriod: 1800,        // 30-minute cooldown for same stock
    maxRetriesOnError: 3
  },

  // Volatility Adjustment (VIX-based)
  volatility: {
    enabled: true,
    baseVIX: 15,                 // Normal market VIX
    adjustStopLoss: true,        // Widen stop-loss in volatile markets
    adjustPositionSize: true,    // Reduce position size in volatile markets
    adjustTakeProfit: true       // Increase targets in volatile markets
  },

  // Notifications
  notifications: {
    telegram: {
      enabled: false,
      onTradeExecuted: true,
      onStopLossHit: true,
      onTargetReached: true,
      onDailySummary: true,
      onRiskAlert: true,
      dailySummaryTime: '15:45'
    },
    discord: {
      enabled: false
    },
    email: {
      enabled: false
    }
  },

  // Backtesting
  backtest: {
    initialCapital: 100000,
    commission: 0.03,            // 0.03% brokerage
    slippage: 0.05,             // 0.05% slippage
    includeWeekends: false
  },

  // Paper Trading
  paperTrading: {
    enabled: process.env.PAPER_TRADING === 'true' || false,
    initialCapital: 100000,
    realisticExecution: true,   // Simulate real market conditions
    slippage: 0.1              // 0.1% slippage in paper trading
  },

  // Data Storage
  data: {
    saveHistoricalData: true,
    historicalDataPath: './data/historical',
    maxStorageDays: 90,
    saveTradeJournal: true
  },

  // Performance
  performance: {
    maxConcurrentConnections: 10,
    requestTimeout: 30000,
    retryDelay: 1000
  }
};

/**
 * Get current trading config
 */
function getTradingConfig() {
  return TRADING_CONFIG;
}

/**
 * Update trading config
 */
function updateTradingConfig(updates) {
  Object.assign(TRADING_CONFIG, updates);
  return TRADING_CONFIG;
}

/**
 * Check if market is open
 */
function isMarketOpen() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }

  // Time check
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 100 + minutes;

  const [startHour, startMin] = TRADING_CONFIG.marketHours.start.split(':');
  const [endHour, endMin] = TRADING_CONFIG.marketHours.end.split(':');
  
  const marketStart = parseInt(startHour) * 100 + parseInt(startMin);
  const marketEnd = parseInt(endHour) * 100 + parseInt(endMin);

  return currentTime >= marketStart && currentTime <= marketEnd;
}

/**
 * Calculate position size based on risk
 */
function calculatePositionSize(price, riskAmount, stopLossPercent) {
  const riskPerShare = price * (stopLossPercent / 100);
  const quantity = Math.floor(riskAmount / riskPerShare);
  return quantity;
}

/**
 * Apply VIX-based adjustments
 */
function applyVIXAdjustment(config, currentVIX) {
  if (!TRADING_CONFIG.volatility.enabled) {
    return config;
  }

  const volatilityMultiplier = currentVIX / TRADING_CONFIG.volatility.baseVIX;
  
  const adjusted = { ...config };

  if (TRADING_CONFIG.volatility.adjustStopLoss) {
    adjusted.stopLoss = config.stopLoss * volatilityMultiplier;
  }

  if (TRADING_CONFIG.volatility.adjustPositionSize) {
    adjusted.quantity = Math.floor(config.quantity / volatilityMultiplier);
  }

  if (TRADING_CONFIG.volatility.adjustTakeProfit) {
    adjusted.takeProfit = config.takeProfit * volatilityMultiplier;
  }

  return adjusted;
}

/**
 * Get market session info
 */
function getMarketSession() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (currentTime >= 915 && currentTime < 945) {
    return 'OPENING';
  } else if (currentTime >= 945 && currentTime < 1500) {
    return 'REGULAR';
  } else if (currentTime >= 1500 && currentTime <= 1530) {
    return 'CLOSING';
  } else {
    return 'CLOSED';
  }
}

module.exports = {
  TRADING_CONFIG,
  getTradingConfig,
  updateTradingConfig,
  isMarketOpen,
  calculatePositionSize,
  applyVIXAdjustment,
  getMarketSession
};
