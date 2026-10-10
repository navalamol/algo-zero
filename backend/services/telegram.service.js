// Telegram Notification Service
// Sends trading alerts to Telegram

const axios = require('axios');
const logger = require('../utils/logger');

class TelegramService {
  constructor() {
    this.bots = new Map(); // chatId -> { botToken, enabled }
  }

  /**
   * Register a Telegram bot for a user
   */
  registerBot(chatId, botToken, enabled = true) {
    this.bots.set(chatId, {
      botToken,
      enabled
    });
    
    logger.info(`📱 Telegram bot registered for chat ID: ${chatId}`);
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(chatId, message, options = {}) {
    const bot = this.bots.get(chatId);
    
    if (!bot || !bot.enabled) {
      return null;
    }

    try {
      const url = `https://api.telegram.org/bot${bot.botToken}/sendMessage`;
      
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      });

      return response.data;
    } catch (error) {
      logger.error('Telegram send error:', error.message);
      return null;
    }
  }

  /**
   * Notify about trade execution
   */
  async notifyTradeExecuted(chatId, trade) {
    const {
      transactionType,
      tradingSymbol,
      quantity,
      price,
      strategyName,
      orderId
    } = trade;

    const emoji = transactionType === 'BUY' ? '🟢' : '🔴';
    const totalValue = (price * quantity).toLocaleString('en-IN');
    
    const message = `
${emoji} <b>Trade Executed</b>

<b>Action:</b> ${transactionType}
<b>Symbol:</b> ${tradingSymbol}
<b>Quantity:</b> ${quantity}
<b>Price:</b> ₹${price.toFixed(2)}
<b>Total:</b> ₹${totalValue}

<b>Strategy:</b> ${strategyName || 'Manual'}
<b>Order ID:</b> ${orderId}

<i>${new Date().toLocaleTimeString('en-IN')}</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Notify about stop-loss hit
   */
  async notifyStopLossHit(chatId, trade) {
    const {
      tradingSymbol,
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      pnlPercentage
    } = trade;

    const message = `
⚠️ <b>Stop-Loss Hit</b>

<b>Symbol:</b> ${tradingSymbol}
<b>Quantity:</b> ${quantity}
<b>Entry:</b> ₹${entryPrice.toFixed(2)}
<b>Exit:</b> ₹${exitPrice.toFixed(2)}

<b>Loss:</b> ₹${Math.abs(pnl).toLocaleString('en-IN')} (${pnlPercentage.toFixed(2)}%)

<i>${new Date().toLocaleTimeString('en-IN')}</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Notify about target reached
   */
  async notifyTargetReached(chatId, trade) {
    const {
      tradingSymbol,
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      pnlPercentage
    } = trade;

    const message = `
🎯 <b>Target Reached!</b>

<b>Symbol:</b> ${tradingSymbol}
<b>Quantity:</b> ${quantity}
<b>Entry:</b> ₹${entryPrice.toFixed(2)}
<b>Exit:</b> ₹${exitPrice.toFixed(2)}

<b>Profit:</b> ₹${pnl.toLocaleString('en-IN')} (+${pnlPercentage.toFixed(2)}%)

<i>${new Date().toLocaleTimeString('en-IN')}</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(chatId, summary) {
    const {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnL,
      winRate,
      bestTrade,
      worstTrade
    } = summary;

    const emoji = totalPnL >= 0 ? '💰' : '📉';
    const pnlSign = totalPnL >= 0 ? '+' : '';

    const message = `
📊 <b>Daily Trading Summary</b>
${new Date().toLocaleDateString('en-IN')}

${emoji} <b>P&L:</b> ${pnlSign}₹${totalPnL.toLocaleString('en-IN')}

<b>Total Trades:</b> ${totalTrades}
✅ Winners: ${winningTrades}
❌ Losers: ${losingTrades}
📈 Win Rate: ${winRate.toFixed(1)}%

<b>Best Trade:</b> +₹${bestTrade.toLocaleString('en-IN')}
<b>Worst Trade:</b> -₹${Math.abs(worstTrade).toLocaleString('en-IN')}

<i>Keep up the good work! 🚀</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send risk alert
   */
  async sendRiskAlert(chatId, alert) {
    const { type, message, value, limit } = alert;

    let emoji = '⚠️';
    if (type === 'DAILY_LOSS_LIMIT') emoji = '🛑';
    if (type === 'POSITION_SIZE') emoji = '📏';
    if (type === 'DAILY_TRADES') emoji = '🔢';

    const alertMessage = `
${emoji} <b>Risk Alert</b>

${message}

<b>Current:</b> ${value}
<b>Limit:</b> ${limit}

<i>Consider reducing position sizes or stopping trading for today.</i>
    `.trim();

    return this.sendMessage(chatId, alertMessage);
  }

  /**
   * Send opportunity alert
   */
  async sendOpportunityAlert(chatId, opportunity) {
    const {
      symbol,
      strategyName,
      signal,
      rsi,
      volume,
      price
    } = opportunity;

    const message = `
💡 <b>Trading Opportunity</b>

<b>Symbol:</b> ${symbol}
<b>Strategy:</b> ${strategyName}
<b>Signal:</b> ${signal}

<b>Price:</b> ₹${price.toFixed(2)}
<b>RSI:</b> ${rsi}
<b>Volume:</b> ${volume.toLocaleString('en-IN')}

<i>Check the app for more details</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Send market condition alert
   */
  async sendMarketAlert(chatId, marketData) {
    const { vix, condition, recommendation } = marketData;

    let emoji = 'ℹ️';
    if (condition === 'HIGH' || condition === 'EXTREME') emoji = '🚨';
    if (condition === 'ELEVATED') emoji = '⚠️';

    const message = `
${emoji} <b>Market Condition Update</b>

<b>India VIX:</b> ${vix.toFixed(2)}
<b>Condition:</b> ${condition}

<b>Recommendation:</b>
${recommendation}

<i>${new Date().toLocaleTimeString('en-IN')}</i>
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Test Telegram connection
   */
  async testConnection(chatId, botToken) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      await axios.post(url, {
        chat_id: chatId,
        text: '✅ <b>Telegram Connected!</b>\n\nYour algo trading bot is now connected and will send you alerts.',
        parse_mode: 'HTML'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.description || error.message 
      };
    }
  }

  /**
   * Enable/disable notifications for a chat
   */
  enableNotifications(chatId, enabled = true) {
    const bot = this.bots.get(chatId);
    if (bot) {
      bot.enabled = enabled;
      logger.info(`📱 Telegram notifications ${enabled ? 'enabled' : 'disabled'} for chat ID: ${chatId}`);
    }
  }

  /**
   * Remove bot
   */
  removeBot(chatId) {
    this.bots.delete(chatId);
    logger.info(`📱 Telegram bot removed for chat ID: ${chatId}`);
  }
}

module.exports = new TelegramService();
