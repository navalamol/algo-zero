const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Strategy type
  type: {
    type: String,
    enum: ['BREAKOUT', 'REVERSAL', 'MOMENTUM', 'MEAN_REVERSION', 'CUSTOM'],
    default: 'CUSTOM'
  },
  
  // Filters and conditions
  conditions: {
    // Price conditions
    priceMin: Number,
    priceMax: Number,
    priceChangeMin: Number,
    priceChangeMax: Number,
    
    // Volume conditions
    volumeMin: Number,
    volumeChangeMin: Number, // % change from average
    
    // RSI conditions
    rsiMin: Number,
    rsiMax: Number,
    
    // Buyer/Seller ratio
    buyerSellerRatioMin: Number,
    buyerSellerRatioMax: Number,
    
    // VWAP
    priceAboveVWAP: Boolean,
    priceBelowVWAP: Boolean,
    
    // Moving averages
    priceAboveSMA20: Boolean,
    priceAboveSMA50: Boolean,
    goldenCross: Boolean, // SMA20 crosses above SMA50
    deathCross: Boolean,  // SMA20 crosses below SMA50
    
    // Custom conditions (as code string)
    customCondition: String
  },
  
  // Trade parameters
  tradeConfig: {
    transactionType: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true
    },
    quantity: Number,
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      default: 'MARKET'
    },
    product: {
      type: String,
      enum: ['CNC', 'MIS', 'NRML'],
      default: 'CNC'
    },
    
    // Risk management
    stopLoss: Number,        // % or absolute
    stopLossType: {
      type: String,
      enum: ['PERCENTAGE', 'ABSOLUTE']
    },
    takeProfit: Number,      // % or absolute
    takeProfitType: {
      type: String,
      enum: ['PERCENTAGE', 'ABSOLUTE']
    },
    maxPositionValue: Number
  },
  
  // Watchlist/instruments to apply this strategy
  instruments: [{
    instrumentToken: Number,
    tradingSymbol: String,
    exchange: String
  }],
  
  // Strategy status
  isActive: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  stats: {
    totalSignals: {
      type: Number,
      default: 0
    },
    totalTrades: {
      type: Number,
      default: 0
    },
    successfulTrades: {
      type: Number,
      default: 0
    },
    failedTrades: {
      type: Number,
      default: 0
    },
    totalProfit: {
      type: Number,
      default: 0
    },
    lastTriggered: Date
  },
  
  // User reference (for multi-user support)
  userId: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

// Indexes
strategySchema.index({ userId: 1, isActive: 1 });
strategySchema.index({ 'instruments.instrumentToken': 1 });

// Methods
strategySchema.methods.updateStats = function(trade) {
  this.stats.totalTrades++;
  
  if (trade.status === 'COMPLETE') {
    if (trade.pnl > 0) {
      this.stats.successfulTrades++;
    } else {
      this.stats.failedTrades++;
    }
    this.stats.totalProfit += trade.pnl;
  }
  
  this.stats.lastTriggered = new Date();
  return this.save();
};

strategySchema.methods.incrementSignals = function() {
  this.stats.totalSignals++;
  return this.save();
};

module.exports = mongoose.model('Strategy', strategySchema);
