/**
 * Calculate percentage change
 */
const percentageChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Round to specified decimal places
 */
const roundTo = (num, decimals = 2) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Delay/sleep function
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chunk array into smaller arrays
 */
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Calculate average of array
 */
const average = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

/**
 * Get trading symbol from instrument token
 */
const getTradingSymbol = (instruments, token) => {
  const instrument = instruments.find(i => i.instrument_token === token);
  return instrument ? instrument.tradingsymbol : null;
};

/**
 * Validate order parameters
 */
const validateOrderParams = (params) => {
  const required = ['tradingsymbol', 'exchange', 'transaction_type', 'quantity', 'order_type', 'product'];
  const missing = required.filter(field => !params[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Check if market is open (NSE timing: 9:15 AM - 3:30 PM)
 */
const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay();
  
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) return false;
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Market opens at 9:15 AM (555 minutes) and closes at 3:30 PM (930 minutes)
  const marketOpen = 9 * 60 + 15;  // 555
  const marketClose = 15 * 60 + 30; // 930
  
  return currentTime >= marketOpen && currentTime <= marketClose;
};

/**
 * Rate limiter helper
 */
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }
  
  addRequest() {
    this.requests.push(Date.now());
  }
  
  async throttle() {
    while (!this.canMakeRequest()) {
      await sleep(100);
    }
    this.addRequest();
  }
}

module.exports = {
  percentageChange,
  roundTo,
  formatCurrency,
  sleep,
  chunkArray,
  average,
  getTradingSymbol,
  validateOrderParams,
  isMarketOpen,
  RateLimiter
};
