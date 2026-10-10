const kiteService = require('./kite.service');
const indicatorsService = require('./indicators.service');
const scanTemplates = require('../config/scan-templates');
const { isDemoMode } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');

class ScannerService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.results = [];
    this.watchSymbols = [];
    this.priceHistory = new Map(); // symbol -> [{price, volume}]
    this.demoMode = isDemoMode();
  }

  start() {
    if (this.isRunning) return;

    if (this.demoMode && this.watchSymbols.length === 0) {
      const instruments = mockService.getAllInstruments();
      this.watchSymbols = instruments.map(i => `${i.exchange}:${i.tradingsymbol}`);
    }

    this.isRunning = true;
    logger.info('🔍 Scanner service started');
  }

  stop() {
    this.isRunning = false;
  }

  setSymbols(symbols) {
    this.watchSymbols = symbols;
  }

  getTemplates() {
    return scanTemplates;
  }

  async runScan(templateId, customConditions = null) {
    const template = customConditions
      ? { id: 'custom', name: 'Custom Scan', conditions: customConditions }
      : scanTemplates.find(t => t.id === templateId);

    if (!template) throw new Error(`Template '${templateId}' not found`);

    const symbols = this.watchSymbols.length > 0
      ? this.watchSymbols
      : mockService.getAllInstruments().map(i => `${i.exchange}:${i.tradingsymbol}`);

    const quotes = await kiteService.getQuote(symbols);
    const matches = [];

    for (const [key, quote] of Object.entries(quotes)) {
      const symbol = key.split(':')[1];

      // Accumulate price history for indicator computation
      const history = this.priceHistory.get(symbol) || [];
      history.push({ price: quote.last_price, volume: quote.volume || 0 });
      if (history.length > 100) history.shift();
      this.priceHistory.set(symbol, history);

      const prices = history.map(h => h.price);
      const indicators = {
        rsi: prices.length >= 15 ? indicatorsService.calculateRSI(prices) : null,
        sma20: prices.length >= 20 ? indicatorsService.calculateSMA(prices, 20) : null,
        vwap: indicatorsService.calculateVWAP(history),
        buyerRatio: indicatorsService.calculateBuyerSellerRatio(quote.depth),
        volumeAvg: history.length > 5
          ? history.slice(-6, -1).reduce((s, h) => s + h.volume, 0) / 5
          : quote.volume || 1
      };

      const stockData = {
        symbol,
        price: quote.last_price,
        volume: quote.volume || 0,
        depth: quote.depth || { buy: [], sell: [] }
      };

      if (this._checkConditions(template.conditions, stockData, indicators)) {
        const openPrice = quote.ohlc?.open || quote.last_price;
        matches.push({
          symbol,
          exchange: key.split(':')[0],
          price: Math.round(quote.last_price * 100) / 100,
          change: openPrice > 0
            ? Math.round(((quote.last_price - openPrice) / openPrice) * 10000) / 100
            : 0,
          volume: quote.volume || 0,
          rsi: indicators.rsi !== null ? Math.round(indicators.rsi * 100) / 100 : null,
          vwap: indicators.vwap ? Math.round(indicators.vwap * 100) / 100 : null,
          buyerRatio: indicators.buyerRatio ? Math.round(indicators.buyerRatio * 100) / 100 : null,
          matchedTemplate: template.name,
          timestamp: new Date()
        });
      }
    }

    this.results = matches;
    this.io.emit('scanner_results', {
      templateId: template.id,
      templateName: template.name,
      count: matches.length,
      results: matches
    });

    logger.info(`🔍 Scan '${template.name}' found ${matches.length} matches`);
    return matches;
  }

  _checkConditions(conditions, stockData, indicators) {
    for (const cond of conditions) {
      const val = this._resolve(cond.indicator, stockData, indicators);
      if (val === null || val === undefined) continue;
      if (!this._compare(val, cond.operator, cond.value)) return false;
    }
    return true;
  }

  _resolve(indicator, stockData, indicators) {
    switch (indicator) {
      case 'rsi': return indicators.rsi;
      case 'price': return stockData.price;
      case 'volume': return stockData.volume;
      case 'vwap': return indicators.vwap;
      case 'sma20': return indicators.sma20;
      case 'buyerRatio': return indicators.buyerRatio;
      case 'volumeVsAvg':
        return indicators.volumeAvg > 0 ? stockData.volume / indicators.volumeAvg : null;
      case 'priceVsVwap':
        return indicators.vwap > 0 ? stockData.price / indicators.vwap : null;
      default: return null;
    }
  }

  _compare(value, operator, threshold) {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return Math.abs(value - threshold) < 0.001;
      default: return false;
    }
  }

  getResults() {
    return this.results;
  }
}

module.exports = ScannerService;
