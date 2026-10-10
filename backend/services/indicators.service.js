const { average } = require('../utils/helpers');

class IndicatorsService {
  /**
   * Calculate RSI (Relative Strength Index)
   * @param {Array} prices - Array of prices
   * @param {Number} period - RSI period (default 14)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return null;
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    let gains = [];
    let losses = [];

    for (let i = 0; i < changes.length; i++) {
      if (changes[i] > 0) {
        gains.push(changes[i]);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(changes[i]));
      }
    }

    // Calculate average gain and loss
    let avgGain = average(gains.slice(0, period));
    let avgLoss = average(losses.slice(0, period));

    // Smoothed averages for subsequent periods
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   * @param {Array} prices - Array of prices
   * @param {Number} period - Period
   */
  calculateSMA(prices, period) {
    if (prices.length < period) {
      return null;
    }

    const relevantPrices = prices.slice(-period);
    return average(relevantPrices);
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   * @param {Array} prices - Array of prices
   * @param {Number} period - Period
   */
  calculateEMA(prices, period) {
    if (prices.length < period) {
      return null;
    }

    const multiplier = 2 / (period + 1);
    let ema = average(prices.slice(0, period)); // Start with SMA

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   * @param {Array} data - Array of {price, volume} objects
   */
  calculateVWAP(data) {
    if (data.length === 0) return null;

    let totalPV = 0;
    let totalVolume = 0;

    data.forEach(item => {
      totalPV += item.price * item.volume;
      totalVolume += item.volume;
    });

    if (totalVolume === 0) return null;

    return totalPV / totalVolume;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * @param {Array} prices - Array of prices
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) {
      return null;
    }

    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    
    if (!emaFast || !emaSlow) return null;

    const macdLine = emaFast - emaSlow;

    // For signal line, we need MACD values array (simplified here)
    const signalLine = macdLine; // Should calculate EMA of MACD line
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  /**
   * Calculate Bollinger Bands
   * @param {Array} prices - Array of prices
   * @param {Number} period - Period (default 20)
   * @param {Number} stdDev - Standard deviation multiplier (default 2)
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      return null;
    }

    const sma = this.calculateSMA(prices, period);
    const relevantPrices = prices.slice(-period);

    // Calculate standard deviation
    const squaredDiffs = relevantPrices.map(price => Math.pow(price - sma, 2));
    const variance = average(squaredDiffs);
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * standardDeviation),
      middle: sma,
      lower: sma - (stdDev * standardDeviation)
    };
  }

  /**
   * Calculate Average True Range (ATR)
   * @param {Array} ohlc - Array of {high, low, close} objects
   * @param {Number} period - Period (default 14)
   */
  calculateATR(ohlc, period = 14) {
    if (ohlc.length < period) {
      return null;
    }

    const trueRanges = [];

    for (let i = 1; i < ohlc.length; i++) {
      const high = ohlc[i].high;
      const low = ohlc[i].low;
      const prevClose = ohlc[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      trueRanges.push(tr);
    }

    return average(trueRanges.slice(-period));
  }

  /**
   * Calculate OBV (On-Balance Volume)
   * @param {Array} data - Array of {price, volume} objects
   */
  calculateOBV(data) {
    if (data.length < 2) return null;

    let obv = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i].price > data[i - 1].price) {
        obv += data[i].volume;
      } else if (data[i].price < data[i - 1].price) {
        obv -= data[i].volume;
      }
    }

    return obv;
  }

  /**
   * Calculate buyer/seller pressure from order book depth
   * @param {Object} depth - Order book depth {buy: [], sell: []}
   */
  calculateBuyerSellerRatio(depth) {
    if (!depth || !depth.buy || !depth.sell) return null;

    const buyVolume = depth.buy.reduce((sum, order) => sum + order.quantity, 0);
    const sellVolume = depth.sell.reduce((sum, order) => sum + order.quantity, 0);

    if (sellVolume === 0) return buyVolume > 0 ? 999 : 1;

    return buyVolume / sellVolume;
  }

  /**
   * Detect if stock is in "only buyer" or "only seller" state
   * @param {Object} depth - Order book depth
   * @param {Number} threshold - Ratio threshold (default 3)
   */
  detectBuyerSellerState(depth, threshold = 3) {
    const ratio = this.calculateBuyerSellerRatio(depth);
    
    if (ratio === null) return 'NEUTRAL';
    
    if (ratio > threshold) return 'ONLY_BUYER';
    if (ratio < (1 / threshold)) return 'ONLY_SELLER';
    
    return 'NEUTRAL';
  }

  /**
   * Calculate volume change percentage
   * @param {Number} currentVolume
   * @param {Number} averageVolume
   */
  calculateVolumeChange(currentVolume, averageVolume) {
    if (!averageVolume || averageVolume === 0) return 0;
    return ((currentVolume - averageVolume) / averageVolume) * 100;
  }

  /**
   * Detect support and resistance levels
   * @param {Array} prices - Historical prices
   * @param {Number} lookback - Lookback period
   */
  detectSupportResistance(prices, lookback = 20) {
    if (prices.length < lookback) return null;

    const recentPrices = prices.slice(-lookback);
    const max = Math.max(...recentPrices);
    const min = Math.min(...recentPrices);

    // Simple approach: resistance = recent high, support = recent low
    // More sophisticated approaches can use pivot points, fibonacci, etc.
    
    return {
      resistance: max,
      support: min,
      range: max - min
    };
  }

  /**
   * Calculate all indicators for a stock
   * @param {Object} stockData - Stock data with history
   */
  calculateAllIndicators(stockData) {
    const prices = stockData.history.map(h => h.price);
    const volumes = stockData.history.map(h => h.volume);
    const priceVolumeData = stockData.history.map(h => ({
      price: h.price,
      volume: h.volume
    }));

    const indicators = {
      rsi: this.calculateRSI(prices),
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      vwap: this.calculateVWAP(priceVolumeData),
      buyerSellerRatio: this.calculateBuyerSellerRatio(stockData.depth),
      buyerSellerState: this.detectBuyerSellerState(stockData.depth),
      supportResistance: this.detectSupportResistance(prices)
    };

    // Calculate volume change if we have average
    if (volumes.length > 1) {
      const avgVolume = average(volumes.slice(0, -1));
      const currentVolume = volumes[volumes.length - 1];
      indicators.volumeChange = this.calculateVolumeChange(currentVolume, avgVolume);
    }

    return indicators;
  }
}

module.exports = new IndicatorsService();
