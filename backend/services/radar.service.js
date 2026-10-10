const kiteService = require('./kite.service');
const { isDemoMode } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');

class RadarService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.scanInterval = null;
    this.config = {
      imbalanceThreshold: 0.30,  // 30% net buyer imbalance to appear on radar
      scanIntervalMs: 2000,
      maxEntries: 20
    };
    this.radarStocks = [];
    this.watchSymbols = [];
    this.demoMode = isDemoMode();
  }

  start() {
    if (this.isRunning) return;

    if (this.demoMode && this.watchSymbols.length === 0) {
      const instruments = mockService.getAllInstruments();
      this.watchSymbols = instruments.map(i => `${i.exchange}:${i.tradingsymbol}`);
    }

    this.isRunning = true;
    this.scanInterval = setInterval(() => this.scan(), this.config.scanIntervalMs);
    logger.info('📡 Radar service started');
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isRunning = false;
    logger.info('📡 Radar service stopped');
  }

  setSymbols(symbols) {
    this.watchSymbols = symbols;
  }

  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    logger.info('📡 Radar config updated:', this.config);
  }

  async scan() {
    if (this.watchSymbols.length === 0) return;

    try {
      const quotes = await kiteService.getQuote(this.watchSymbols);
      const results = [];

      for (const [key, quote] of Object.entries(quotes)) {
        const depth = quote.depth;
        if (!depth || !depth.buy || !depth.sell) continue;

        const buyQty = depth.buy.reduce((sum, lvl) => sum + lvl.quantity, 0);
        const sellQty = depth.sell.reduce((sum, lvl) => sum + lvl.quantity, 0);
        const total = buyQty + sellQty;
        if (total === 0) continue;

        const imbalance = (buyQty - sellQty) / total; // range -1 to +1

        if (imbalance > this.config.imbalanceThreshold) {
          const openPrice = quote.ohlc?.open || quote.last_price;
          const changePct = openPrice > 0
            ? ((quote.last_price - openPrice) / openPrice) * 100
            : 0;

          // Composite score: 60% order-book imbalance + 40% intraday momentum
          const score = Math.round((imbalance * 0.6 + Math.max(0, changePct / 10) * 0.4) * 100);

          results.push({
            symbol: key.split(':')[1],
            exchange: key.split(':')[0],
            price: Math.round(quote.last_price * 100) / 100,
            change: Math.round(changePct * 100) / 100,
            volume: quote.volume || 0,
            buyQty,
            sellQty,
            imbalancePct: Math.round(imbalance * 1000) / 10,
            score,
            timestamp: new Date()
          });
        }
      }

      results.sort((a, b) => b.score - a.score);
      this.radarStocks = results.slice(0, this.config.maxEntries);
      this.io.emit('radar_update', this.radarStocks);

    } catch (error) {
      logger.error('Radar scan error:', error.message);
    }
  }

  getRadarStocks() {
    return this.radarStocks;
  }

  getConfig() {
    return this.config;
  }
}

module.exports = RadarService;
