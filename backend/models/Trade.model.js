const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  // Reference to strategy
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy'
  },
  strategyName: String,
  
  // Order details
  orderId: String,
  instrumentToken: Number,
  tradingSymbol: {
    type: String,
    required: true
  },
  exchange: {
    type: String,
    required: true
  },
  
  // Transaction details
  transactionType: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'SL', 'SL-M']
  },
  product: {
    type: String,
    enum: ['CNC', 'MIS', 'NRML']
  },
  
  // Price details
  price: Number,
  averagePrice: Number,
  triggerPrice: Number,
  
  // Trade status
  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'COMPLETE', 'CANCELLED', 'REJECTED', 'FAILED'],
    default: 'PENDING'
  },
  
  // Timestamps
  placedAt: Date,
  executedAt: Date,
  closedAt: Date,
  
  // P&L tracking
  entryPrice: Number,
  exitPrice: Number,
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercentage: {
    type: Number,
    default: 0
  },
  
  // Risk management
  stopLoss: Number,
  takeProfit: Number,
  
  // Signal metadata (conditions that triggered the trade)
  signalData: {
    rsi: Number,
    volume: Number,
    price: Number,
    buyerSellerRatio: Number,
    conditions: mongoose.Schema.Types.Mixed
  },
  
  // Error/rejection reason
  errorMessage: String,
  
  // User reference
  userId: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

// Indexes
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ orderId: 1 });
tradeSchema.index({ strategyId: 1 });
tradeSchema.index({ status: 1 });
tradeSchema.index({ tradingSymbol: 1, exchange: 1 });

// Methods
tradeSchema.methods.updateStatus = function(status, details = {}) {
  this.status = status;
  
  if (details.averagePrice) {
    this.averagePrice = details.averagePrice;
  }
  
  if (status === 'COMPLETE') {
    this.executedAt = new Date();
  }
  
  if (details.errorMessage) {
    this.errorMessage = details.errorMessage;
  }
  
  return this.save();
};

tradeSchema.methods.calculatePnL = function(exitPrice) {
  this.exitPrice = exitPrice;
  
  const multiplier = this.transactionType === 'BUY' ? 1 : -1;
  this.pnl = multiplier * (this.exitPrice - this.entryPrice) * this.quantity;
  
  if (this.entryPrice > 0) {
    this.pnlPercentage = (multiplier * (this.exitPrice - this.entryPrice) / this.entryPrice) * 100;
  }
  
  this.closedAt = new Date();
  this.status = 'COMPLETE';
  
  return this.save();
};

module.exports = mongoose.model('Trade', tradeSchema);
