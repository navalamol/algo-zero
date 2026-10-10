const kiteService = require('./kite.service');
const telegramService = require('./telegram.service');
const logger = require('../utils/logger');

class AlertService {
  constructor(io) {
    this.io = io;
    this.alerts = new Map();
    this.scanInterval = null;
    this.isRunning = false;
    this.idCounter = 1;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scanInterval = setInterval(() => this.evaluate(), 2000);
    logger.info('🔔 Alert service started');
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isRunning = false;
  }

  create(data) {
    const alert = {
      id: `ALT${this.idCounter++}`,
      symbol: data.symbol.toUpperCase(),
      exchange: data.exchange || 'NSE',
      type: data.type,         // 'price_above' | 'price_below' | 'volume_spike' | 'buyer_imbalance'
      threshold: Number(data.threshold),
      name: data.name || `${data.symbol} ${data.type} ${data.threshold}`,
      profileId: data.profileId || 'default',
      chatId: data.chatId || null,
      status: 'ACTIVE',
      createdAt: new Date(),
      triggeredAt: null
    };

    this.alerts.set(alert.id, alert);
    logger.info(`🔔 Alert created: ${alert.name}`);
    return alert;
  }

  delete(alertId) {
    return this.alerts.delete(alertId);
  }

  update(alertId, updates) {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;
    const updated = { ...alert, ...updates };
    this.alerts.set(alertId, updated);
    return updated;
  }

  list(profileId = null) {
    const all = Array.from(this.alerts.values());
    return profileId ? all.filter(a => a.profileId === profileId) : all;
  }

  async evaluate() {
    const active = Array.from(this.alerts.values()).filter(a => a.status === 'ACTIVE');
    if (active.length === 0) return;

    // Group alerts by exchange:symbol to reduce API calls
    const symbolMap = new Map();
    for (const alert of active) {
      const key = `${alert.exchange}:${alert.symbol}`;
      if (!symbolMap.has(key)) symbolMap.set(key, []);
      symbolMap.get(key).push(alert);
    }

    try {
      const quotes = await kiteService.getQuote(Array.from(symbolMap.keys()));

      for (const [key, quote] of Object.entries(quotes)) {
        const alerts = symbolMap.get(key) || [];
        for (const alert of alerts) {
          if (this._check(alert, quote)) {
            await this._fire(alert, quote);
          }
        }
      }
    } catch (error) {
      logger.error('Alert evaluation error:', error.message);
    }
  }

  _check(alert, quote) {
    const price = quote.last_price;
    const volume = quote.volume || 0;
    const depth = quote.depth || { buy: [], sell: [] };

    switch (alert.type) {
      case 'price_above':
        return price >= alert.threshold;
      case 'price_below':
        return price <= alert.threshold;
      case 'volume_spike':
        return volume >= alert.threshold;
      case 'buyer_imbalance': {
        const buyQty = depth.buy.reduce((s, l) => s + l.quantity, 0);
        const sellQty = depth.sell.reduce((s, l) => s + l.quantity, 0);
        const total = buyQty + sellQty;
        const imbalancePct = total > 0 ? ((buyQty - sellQty) / total) * 100 : 0;
        return imbalancePct >= alert.threshold;
      }
      default:
        return false;
    }
  }

  async _fire(alert, quote) {
    alert.status = 'TRIGGERED';
    alert.triggeredAt = new Date();
    this.alerts.set(alert.id, alert);

    const msg = this._formatMessage(alert, quote);
    this.io.emit('alert_triggered', { alert, quote: { last_price: quote.last_price, volume: quote.volume }, message: msg });

    if (alert.chatId) {
      await telegramService.sendMessage(alert.chatId, msg).catch(() => {});
    }

    logger.info(`🔔 Alert fired: ${alert.name} @ ₹${quote.last_price}`);
  }

  _formatMessage(alert, quote) {
    const labels = {
      price_above: '📈 Price crossed above ₹',
      price_below: '📉 Price dropped below ₹',
      volume_spike: '📊 Volume exceeded ',
      buyer_imbalance: '🟢 Buyer imbalance exceeded '
    };

    const unit = (alert.type === 'buyer_imbalance') ? '%' : (alert.type === 'volume_spike' ? ' shares' : '');

    return [
      `🔔 <b>Alert Triggered!</b>`,
      ``,
      `<b>${alert.name}</b>`,
      `${labels[alert.type] || alert.type}${alert.threshold}${unit}`,
      `<b>Current Price:</b> ₹${quote.last_price.toFixed(2)}`,
      `<b>Volume:</b> ${(quote.volume || 0).toLocaleString('en-IN')}`,
      ``,
      `<i>${new Date().toLocaleTimeString('en-IN')}</i>`
    ].join('\n');
  }
}

module.exports = AlertService;
