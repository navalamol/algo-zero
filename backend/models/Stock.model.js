const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  instrumentToken: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  tradingSymbol: {
    type: String,
    required: true
  },
  exchange: {
    type: String,
    required: true,
    enum: ['NSE', 'BSE', 'NFO', 'CDS', 'BFO', 'MCX']
  },
  name: String,
  segment: String,
  lotSize: Number,
  
  // Latest tick data
  lastPrice: Number,
  lastUpdateTime: Date,
  volume: Number,
  averagePrice: Number,
  ohlc: {
    open: Number,
    high: Number,
    low: Number,
    close: Number
  },
  
  // Depth data (order book)
  depth: {
    buy: [{
      price: Number,
      quantity: Number,
      orders: Number
    }],
    sell: [{
      price: Number,
      quantity: Number,
      orders: Number
    }]
  },
  
  // Calculated metrics
  metrics: {
    rsi: Number,
    sma20: Number,
    sma50: Number,
    ema12: Number,
    ema26: Number,
    vwap: Number,
    buyerSellerRatio: Number,
    volumeChange: Number,
    priceChange: Number,
    percentageChange: Number
  },
  
  // Historical data for indicators (limited)
  history: [{
    timestamp: Date,
    price: Number,
    volume: Number
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastCalculated: Date
}, {
  timestamps: true
});

// Indexes for performance
stockSchema.index({ tradingSymbol: 1, exchange: 1 });
stockSchema.index({ 'metrics.rsi': 1 });
stockSchema.index({ lastUpdateTime: -1 });

// Methods
stockSchema.methods.updateTick = function(tickData) {
  this.lastPrice = tickData.last_price;
  this.lastUpdateTime = new Date(tickData.exchange_timestamp || Date.now());
  this.volume = tickData.volume_traded || this.volume;
  this.averagePrice = tickData.average_traded_price || this.averagePrice;
  
  if (tickData.ohlc) {
    this.ohlc = {
      open: tickData.ohlc.open,
      high: tickData.ohlc.high,
      low: tickData.ohlc.low,
      close: tickData.ohlc.close
    };
  }
  
  if (tickData.depth) {
    this.depth = {
      buy: tickData.depth.buy || [],
      sell: tickData.depth.sell || []
    };
  }
  
  return this.save();
};

stockSchema.methods.addToHistory = function(price, volume) {
  this.history.push({
    timestamp: new Date(),
    price,
    volume
  });
  
  // Keep only last 100 records
  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
  
  return this.save();
};

module.exports = mongoose.model('Stock', stockSchema);
