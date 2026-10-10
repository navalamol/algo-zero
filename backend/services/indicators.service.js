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
    if (prices.length < slowPeriod + signalPeriod) {
      return null;
    }

    // Build a series of MACD line values over all available data points
    const macdSeries = [];
    for (let i = slowPeriod; i <= prices.length; i++) {
      const slice = prices.slice(0, i);
      const fast = this.calculateEMA(slice, fastPeriod);
      const slow = this.calculateEMA(slice, slowPeriod);
      if (fast !== null && slow !== null) {
        macdSeries.push(fast - slow);
      }
    }

    if (macdSeries.length < signalPeriod) return null;

    const macdLine = macdSeries[macdSeries.length - 1];
    const signalLine = this.calculateEMA(macdSeries, signalPeriod);
    const histogram = signalLine !== null ? macdLine - signalLine : 0;

    return {
      macd: Math.round(macdLine * 10000) / 10000,
      signal: signalLine !== null ? Math.round(signalLine * 10000) / 10000 : null,
      histogram: Math.round(histogram * 10000) / 10000
    };
  }

  /**
   * Calculate Stochastic RSI
   * @param {Array} prices - Array of prices
   * @param {Number} rsiPeriod - RSI period (default 14)
   * @param {Number} stochPeriod - Stochastic lookback on RSI (default 14)
   */
  calculateStochasticRSI(prices, rsiPeriod = 14, stochPeriod = 14) {
    if (prices.length < rsiPeriod + stochPeriod + 1) {
      return null;
    }

    // Build RSI series
    const rsiValues = [];
    for (let i = rsiPeriod + 1; i <= prices.length; i++) {
      const rsi = this.calculateRSI(prices.slice(0, i), rsiPeriod);
      if (rsi !== null) rsiValues.push(rsi);
    }

    if (rsiValues.length < stochPeriod) return null;

    const window = rsiValues.slice(-stochPeriod);
    const lowestRSI = Math.min(...window);
    const highestRSI = Math.max(...window);
    const range = highestRSI - lowestRSI;

    const currentRSI = rsiValues[rsiValues.length - 1];
    const stochRSI = range === 0 ? 0 : ((currentRSI - lowestRSI) / range) * 100;

    return {
      value: Math.round(stochRSI * 100) / 100,
      rsi: currentRSI,
      overbought: stochRSI > 80,
      oversold: stochRSI < 20
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
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      stochasticRSI: this.calculateStochasticRSI(prices),
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
