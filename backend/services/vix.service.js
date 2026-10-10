// India VIX Integration Service
// Fetches and monitors India VIX for volatility-based adjustments

const axios = require('axios');
const logger = require('../utils/logger');

class VIXService {
  constructor() {
    this.currentVIX = 15; // Default VIX value
    this.vixHistory = [];
    this.lastUpdate = null;
    this.updateInterval = null;
  }

  /**
   * Start VIX monitoring
   */
  start(interval = 300000) { // Update every 5 minutes
    logger.info('Starting India VIX monitoring...');
    
    this.updateVIX();
    
    this.updateInterval = setInterval(() => {
      this.updateVIX();
    }, interval);

    logger.info('India VIX monitoring started');
  }

  /**
   * Stop VIX monitoring
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('India VIX monitoring stopped');
    }
  }

  /**
   * Fetch India VIX from NSE
   */
  async updateVIX() {
    try {
      // Method 1: Try NSE website (may require headers)
      const vix = await this.fetchFromNSE();
      
      if (vix) {
        this.currentVIX = vix;
        this.lastUpdate = new Date();
        
        this.vixHistory.push({
          value: vix,
          timestamp: new Date()
        });

        // Keep only last 100 readings
        if (this.vixHistory.length > 100) {
          this.vixHistory.shift();
        }

        logger.info(`India VIX updated: ${vix.toFixed(2)}`);
        return vix;
      }
    } catch (error) {
      logger.error('Error updating VIX:', error.message);
      // Keep using last known value
    }

    return this.currentVIX;
  }

  /**
   * Fetch VIX from NSE
   */
  async fetchFromNSE() {
    try {
      // NSE API endpoint for India VIX
      const response = await axios.get('https://www.nseindia.com/api/allIndices', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        timeout: 10000
      });

      const vixData = response.data.data.find(index => index.index === 'India VIX');
      
      if (vixData && vixData.last) {
        return parseFloat(vixData.last);
      }

      return null;
    } catch (error) {
      logger.error('NSE VIX fetch error:', error.message);
      return null;
    }
  }

  /**
   * Get current VIX value
   */
  getCurrentVIX() {
    return this.currentVIX;
  }

  /**
   * Get VIX market condition
   */
  getMarketCondition() {
    const vix = this.currentVIX;

    if (vix < 12) {
      return {
        condition: 'VERY_LOW',
        description: 'Extremely low volatility - Market complacency',
        recommendation: 'Be cautious, potential for sudden moves'
      };
    } else if (vix >= 12 && vix < 15) {
      return {
        condition: 'LOW',
        description: 'Low volatility - Calm market',
        recommendation: 'Normal trading conditions'
      };
    } else if (vix >= 15 && vix < 20) {
      return {
        condition: 'NORMAL',
        description: 'Normal volatility - Typical market',
        recommendation: 'Standard risk management'
      };
    } else if (vix >= 20 && vix < 25) {
      return {
        condition: 'ELEVATED',
        description: 'Elevated volatility - Increased uncertainty',
        recommendation: 'Widen stop-losses, reduce position sizes'
      };
    } else if (vix >= 25 && vix < 35) {
      return {
        condition: 'HIGH',
        description: 'High volatility - Turbulent market',
        recommendation: 'Reduce position sizes significantly, consider sitting out'
      };
    } else {
      return {
        condition: 'EXTREME',
        description: 'Extreme volatility - Market panic',
        recommendation: 'Avoid trading or trade very small sizes'
      };
    }
  }

  /**
   * Calculate volatility adjustment multiplier
   */
  getVolatilityMultiplier(baseVIX = 15) {
    return this.currentVIX / baseVIX;
  }

  /**
   * Adjust strategy parameters based on VIX
   */
  adjustStrategyForVolatility(strategy, baseVIX = 15) {
    const multiplier = this.getVolatilityMultiplier(baseVIX);
    
    return {
      ...strategy,
      stopLoss: strategy.stopLoss * multiplier,           // Wider stops in volatile markets
      takeProfit: strategy.takeProfit * multiplier,       // Higher targets in volatile markets
      quantity: Math.floor(strategy.quantity / multiplier), // Smaller positions in volatile markets
      positionSize: strategy.positionSize / multiplier,
      
      // Metadata
      vixAdjusted: true,
      currentVIX: this.currentVIX,
      volatilityMultiplier: multiplier,
      marketCondition: this.getMarketCondition()
    };
  }

  /**
   * Get VIX statistics
   */
  getVIXStats() {
    if (this.vixHistory.length === 0) {
      return null;
    }

    const values = this.vixHistory.map(v => v.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      current: this.currentVIX,
      average: avg,
      min,
      max,
      lastUpdate: this.lastUpdate,
      readingsCount: this.vixHistory.length
    };
  }

  /**
   * Check if VIX is rising (potential panic)
   */
  isVIXRising() {
    if (this.vixHistory.length < 5) {
      return false;
    }

    const recent = this.vixHistory.slice(-5).map(v => v.value);
    const older = this.vixHistory.slice(-10, -5).map(v => v.value);

    if (older.length === 0) return false;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return recentAvg > olderAvg * 1.1; // 10% increase
  }

  /**
   * Manual VIX override (for testing)
   */
  setVIX(value) {
    this.currentVIX = value;
    logger.info(`VIX manually set to: ${value}`);
  }
}

module.exports = new VIXService();
