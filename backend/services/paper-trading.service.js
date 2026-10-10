// Paper Trading Service
// Simulates real trading without actual money

const logger = require('../utils/logger');

class PaperTradingService {
  constructor() {
    this.positions = new Map(); // symbol -> position
    this.orders = [];
    this.trades = [];
    this.capital = 100000; // Starting capital
    this.availableCapital = 100000;
    this.pnl = 0;
    this.commission = 0.0003; // 0.03% brokerage
    this.slippage = 0.001; // 0.1% slippage
  }

  /**
   * Initialize paper trading with capital
   */
  initialize(initialCapital = 100000) {
    this.capital = initialCapital;
    this.availableCapital = initialCapital;
    this.pnl = 0;
    this.positions.clear();
    this.orders = [];
    this.trades = [];
    
    logger.info(`📝 Paper Trading initialized with ₹${initialCapital.toLocaleString('en-IN')}`);
  }

  /**
   * Place a paper order
   */
  async placeOrder(orderParams) {
    const {
      tradingSymbol,
      transactionType,
      quantity,
      orderType = 'MARKET',
      price,
      product = 'CNC'
    } = orderParams;

    // Simulate realistic order ID
    const orderId = `PAPER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate execution price (with slippage)
    let executionPrice = price;
    if (orderType === 'MARKET') {
      // Add slippage for market orders
      const slippageAmount = price * this.slippage;
      executionPrice = transactionType === 'BUY' 
        ? price + slippageAmount 
        : price - slippageAmount;
    }

    // Calculate total cost
    const totalCost = executionPrice * quantity;
    const brokerage = totalCost * this.commission;
    const totalWithBrokerage = totalCost + brokerage;

    // Check if we have enough capital for buy orders
    if (transactionType === 'BUY') {
      if (totalWithBrokerage > this.availableCapital) {
        logger.warn(`❌ Paper order rejected: Insufficient capital (Need: ₹${totalWithBrokerage.toFixed(2)}, Available: ₹${this.availableCapital.toFixed(2)})`);
        
        return {
          success: false,
          error: 'Insufficient capital',
          required: totalWithBrokerage,
          available: this.availableCapital
        };
      }
    }

    // Create order
    const order = {
      orderId,
      tradingSymbol,
      transactionType,
      quantity,
      orderType,
      product,
      price: executionPrice,
      totalCost,
      brokerage,
      status: 'COMPLETE',
      placedAt: new Date(),
      executedAt: new Date(),
      isPaperTrade: true
    };

    this.orders.push(order);

    // Update positions
    if (transactionType === 'BUY') {
      this.buyPosition(tradingSymbol, quantity, executionPrice, brokerage);
    } else {
      this.sellPosition(tradingSymbol, quantity, executionPrice, brokerage);
    }

    logger.info(`📝 Paper ${transactionType}: ${quantity} ${tradingSymbol} @ ₹${executionPrice.toFixed(2)} (Brokerage: ₹${brokerage.toFixed(2)})`);

    return {
      success: true,
      orderId,
      order,
      position: this.getPosition(tradingSymbol),
      accountSummary: this.getAccountSummary()
    };
  }

  /**
   * Buy position
   */
  buyPosition(symbol, quantity, price, brokerage) {
    const totalCost = (price * quantity) + brokerage;
    
    if (this.positions.has(symbol)) {
      // Add to existing position
      const position = this.positions.get(symbol);
      const newQuantity = position.quantity + quantity;
      const newAvgPrice = ((position.averagePrice * position.quantity) + (price * quantity)) / newQuantity;
      
      position.quantity = newQuantity;
      position.averagePrice = newAvgPrice;
      position.totalCost += totalCost;
      position.brokerage += brokerage;
    } else {
      // New position
      this.positions.set(symbol, {
        symbol,
        quantity,
        averagePrice: price,
        totalCost,
        brokerage,
        openedAt: new Date()
      });
    }

    this.availableCapital -= totalCost;
  }

  /**
   * Sell position
   */
  sellPosition(symbol, quantity, price, brokerage) {
    if (!this.positions.has(symbol)) {
      logger.error(`❌ Cannot sell ${symbol}: No position exists`);
      return null;
    }

    const position = this.positions.get(symbol);
    
    if (position.quantity < quantity) {
      logger.error(`❌ Cannot sell ${quantity} of ${symbol}: Only ${position.quantity} available`);
      return null;
    }

    // Calculate P&L
    const sellValue = price * quantity;
    const costBasis = position.averagePrice * quantity;
    const tradePnL = sellValue - costBasis - brokerage;
    const profitPercent = (tradePnL / costBasis) * 100;

    // Record trade
    this.trades.push({
      symbol,
      quantity,
      buyPrice: position.averagePrice,
      sellPrice: price,
      pnl: tradePnL,
      profitPercent,
      brokerage,
      closedAt: new Date(),
      isPaperTrade: true
    });

    // Update position
    position.quantity -= quantity;
    position.totalCost -= costBasis;

    // Remove position if fully sold
    if (position.quantity === 0) {
      this.positions.delete(symbol);
    }

    // Update capital and P&L
    this.availableCapital += sellValue - brokerage;
    this.pnl += tradePnL;

    logger.info(`📝 Paper SELL Result: ${profitPercent > 0 ? '✅' : '❌'} P&L: ₹${tradePnL.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

    return {
      pnl: tradePnL,
      profitPercent,
      closedTrade: this.trades[this.trades.length - 1]
    };
  }

  /**
   * Get current position for a symbol
   */
  getPosition(symbol) {
    return this.positions.get(symbol) || null;
  }

  /**
   * Get all positions
   */
  getAllPositions() {
    return Array.from(this.positions.values());
  }

  /**
   * Get account summary
   */
  getAccountSummary() {
    const usedCapital = this.capital - this.availableCapital;
    const totalValue = this.availableCapital + this.getPortfolioValue();
    const totalReturn = totalValue - this.capital;
    const returnPercent = (totalReturn / this.capital) * 100;

    return {
      initialCapital: this.capital,
      availableCapital: this.availableCapital,
      usedCapital,
      portfolioValue: this.getPortfolioValue(),
      totalValue,
      realizedPnL: this.pnl,
      unrealizedPnL: this.getUnrealizedPnL(),
      totalReturn,
      returnPercent,
      totalTrades: this.trades.length,
      openPositions: this.positions.size,
      isPaperTrading: true
    };
  }

  /**
   * Calculate portfolio value (positions at current market price)
   */
  getPortfolioValue() {
    let total = 0;
    for (const position of this.positions.values()) {
      // Use average price as current price (in real scenario, fetch live price)
      total += position.averagePrice * position.quantity;
    }
    return total;
  }

  /**
   * Calculate unrealized P&L
   */
  getUnrealizedPnL() {
    let unrealized = 0;
    for (const position of this.positions.values()) {
      const currentValue = position.averagePrice * position.quantity;
      unrealized += currentValue - position.totalCost;
    }
    return unrealized;
  }

  /**
   * Update position with current market price
   */
  updatePositionPrice(symbol, currentPrice) {
    const position = this.positions.get(symbol);
    if (!position) return null;

    const currentValue = currentPrice * position.quantity;
    const unrealizedPnL = currentValue - position.totalCost;
    const unrealizedPercent = (unrealizedPnL / position.totalCost) * 100;

    return {
      ...position,
      currentPrice,
      currentValue,
      unrealizedPnL,
      unrealizedPercent
    };
  }

  /**
   * Get trade history
   */
  getTradeHistory() {
    return this.trades;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgProfit: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        profitFactor: 0
      };
    }

    const winners = this.trades.filter(t => t.pnl > 0);
    const losers = this.trades.filter(t => t.pnl < 0);
    
    const totalProfit = winners.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0));
    
    return {
      totalTrades: this.trades.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: (winners.length / this.trades.length) * 100,
      avgProfit: winners.length > 0 ? totalProfit / winners.length : 0,
      avgLoss: losers.length > 0 ? totalLoss / losers.length : 0,
      bestTrade: Math.max(...this.trades.map(t => t.pnl)),
      worstTrade: Math.min(...this.trades.map(t => t.pnl)),
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
      totalProfit,
      totalLoss
    };
  }

  /**
   * Reset paper trading account
   */
  reset() {
    this.initialize(this.capital);
    logger.info('📝 Paper Trading account reset');
  }

  /**
   * Export paper trading data
   */
  exportData() {
    return {
      capital: this.capital,
      availableCapital: this.availableCapital,
      pnl: this.pnl,
      positions: Array.from(this.positions.entries()),
      orders: this.orders,
      trades: this.trades,
      accountSummary: this.getAccountSummary(),
      performanceStats: this.getPerformanceStats()
    };
  }

  /**
   * Import paper trading data
   */
  importData(data) {
    this.capital = data.capital;
    this.availableCapital = data.availableCapital;
    this.pnl = data.pnl;
    this.positions = new Map(data.positions);
    this.orders = data.orders;
    this.trades = data.trades;
    
    logger.info('📝 Paper Trading data imported');
  }
}

module.exports = new PaperTradingService();
