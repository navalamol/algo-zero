const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  instruments: [{
    instrumentToken: {
      type: Number,
      required: true
    },
    tradingSymbol: {
      type: String,
      required: true
    },
    exchange: {
      type: String,
      required: true
    },
    name: String,
    segment: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Watchlist settings
  settings: {
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 1000 // milliseconds
    },
    enableAlerts: {
      type: Boolean,
      default: false
    }
  },
  
  // User reference
  userId: {
    type: String,
    default: 'default'
  },
  
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
watchlistSchema.index({ userId: 1 });
watchlistSchema.index({ 'instruments.instrumentToken': 1 });

// Methods
watchlistSchema.methods.addInstrument = function(instrument) {
  // Check if already exists
  const exists = this.instruments.some(
    i => i.instrumentToken === instrument.instrumentToken
  );
  
  if (!exists) {
    this.instruments.push({
      ...instrument,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

watchlistSchema.methods.removeInstrument = function(instrumentToken) {
  this.instruments = this.instruments.filter(
    i => i.instrumentToken !== instrumentToken
  );
  
  return this.save();
};

watchlistSchema.methods.getInstrumentTokens = function() {
  return this.instruments.map(i => i.instrumentToken);
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
