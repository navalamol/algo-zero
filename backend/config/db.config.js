const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { isDemoModeDb } = require('./kite.config');

const connectDB = async () => {
  // Skip MongoDB connection in demo mode
  console.log('isDemoModeDb', isDemoModeDb());
  if (isDemoModeDb()) {
    logger.info('📦 Running in DEMO MODE - Using in-memory storage (MongoDB not required)');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kite-algo-trading';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    logger.info('💡 Tip: Set DEMO_MODE=true in .env to test without MongoDB');
    process.exit(1);
  }
};

module.exports = connectDB;
