const KiteConnect = require('kiteconnect').KiteConnect;
const logger = require('../utils/logger');

const kiteConfig = {
  apiKey: process.env.KITE_API_KEY,
  apiSecret: process.env.KITE_API_SECRET,
  accessToken: process.env.KITE_ACCESS_TOKEN,
  demoMode: process.env.DEMO_MODE === 'true',
  demoModeDb: process.env.DEMO_MODE_DB === 'true'
};

// Store Kite instance globally
let kiteInstance = null;

// Validate configuration
const validateConfig = () => {
  if (kiteConfig.demoMode) {
    logger.warn('⚠️  DEMO MODE ENABLED - Using mock data instead of real Kite API');
    return true;
  }

  if (!kiteConfig.apiKey) {
    throw new Error('KITE_API_KEY is not defined in environment variables');
  }
  if (!kiteConfig.apiSecret) {
    throw new Error('KITE_API_SECRET is not defined in environment variables');
  }
  if (!kiteConfig.accessToken) {
    logger.warn('⚠️  KITE_ACCESS_TOKEN not set. Will attempt to load from saved token file.');
  }
  return true;
};

// Initialize Kite Connect instance
const getKiteInstance = () => {
  if (kiteConfig.demoMode) {
    logger.info('Using mock Kite service (DEMO MODE)');
    return null; // Will be handled by mock service
  }

  if (kiteInstance) {
    return kiteInstance;
  }

  validateConfig();
  kiteInstance = new KiteConnect({
    api_key: kiteConfig.apiKey,
    debug: process.env.NODE_ENV === 'development'
  });
  
  if (kiteConfig.accessToken) {
    kiteInstance.setAccessToken(kiteConfig.accessToken);
    logger.info('✅ Access token set from environment variable');
  }
  
  return kiteInstance;
};

// Set access token dynamically (called after loading from file or generating new one)
const setAccessToken = (accessToken) => {
  kiteConfig.accessToken = accessToken;
  
  if (kiteConfig.demoMode) {
    return;
  }
  
  const kite = getKiteInstance();
  if (kite) {
    kite.setAccessToken(accessToken);
    logger.info('✅ Access token updated in Kite instance');
  }
};



// Check if demo mode is enabled
const isDemoModeDb = () => {
  return kiteConfig.demoModeDb;
};

// Check if demo mode is enabled
const isDemoMode = () => {
  return kiteConfig.demoMode;
};

module.exports = {
  kiteConfig,
  getKiteInstance,
  setAccessToken,
  validateConfig,
  isDemoMode,
  isDemoModeDb
};
