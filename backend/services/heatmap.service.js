const kiteService = require('./kite.service');
const sectorMapping = require('../config/sector-mapping');
const logger = require('../utils/logger');

class HeatmapService {
  constructor() {
    this.sectorData = {};
    this.lastUpdate = null;
    this.updateInterval = null;
    this.updateIntervalMs = 30000; // 30 seconds
  }

  start() {
    this.update();
    this.updateInterval = setInterval(() => this.update(), this.updateIntervalMs);
    logger.info('🗺️  Heatmap service started');
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async update() {
    try {
      const allSymbols = Object.values(sectorMapping)
        .flat()
        .map(s => `NSE:${s}`);

      const quotes = await kiteService.getQuote(allSymbols);

      const sectorPerformance = {};

      for (const [sector, stocks] of Object.entries(sectorMapping)) {
        const sectorStocks = [];
        let totalChange = 0;
        let count = 0;

        for (const symbol of stocks) {
          const quote = quotes[`NSE:${symbol}`];
          if (!quote) continue;

          const openPrice = quote.ohlc?.open || quote.last_price;
          const changePct = openPrice > 0
            ? ((quote.last_price - openPrice) / openPrice) * 100
            : 0;

          sectorStocks.push({
            symbol,
            price: Math.round(quote.last_price * 100) / 100,
            change: Math.round(changePct * 100) / 100,
            volume: quote.volume || 0
          });

          totalChange += changePct;
          count++;
        }

        sectorPerformance[sector] = {
          name: sector,
          change: count > 0 ? Math.round((totalChange / count) * 100) / 100 : 0,
          stocks: sectorStocks,
          stockCount: count
        };
      }

      this.sectorData = sectorPerformance;
      this.lastUpdate = new Date();

    } catch (error) {
      logger.error('Heatmap update error:', error.message);
    }
  }

  getSectorData() {
    return { sectors: this.sectorData, lastUpdate: this.lastUpdate };
  }
}

module.exports = new HeatmapService();
