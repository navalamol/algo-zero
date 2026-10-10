const cron = require('node-cron');
const logger = require('../utils/logger');
const Strategy = require('../models/Strategy.model');
const Stock = require('../models/Stock.model');
const orderService = require('./order.service');
const { isDemoModeDb } = require('../config/kite.config');
const memoryStore = require('./memory-store.service');
const vixService = require('./vix.service');
const { applyVIXAdjustment } = require('../config/trading.config');

class StrategyService {
  constructor(io) {
    this.io = io;
    this.activeStrategies = new Map();
    this.evaluationInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the strategy engine
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Strategy engine already running');
      return;
    }

    logger.info('Starting strategy engine...');
    this.isRunning = true;

    // Load active strategies
    await this.loadActiveStrategies();

    // Start periodic evaluation (every 1 second)
    this.evaluationInterval = setInterval(() => {
      this.evaluateStrategies();
    }, 1000);

    // Schedule daily cleanup at market close (3:30 PM)
    cron.schedule('30 15 * * 1-5', () => {
      this.dailyCleanup();
    });

    logger.info('Strategy engine started');
  }

  /**
   * Stop the strategy engine
   */
  stop() {
    if (!this.isRunning) return;

    logger.info('Stopping strategy engine...');
    this.isRunning = false;

    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }

    logger.info('Strategy engine stopped');
  }

  /**
   * Load active strategies from database
   */
  async loadActiveStrategies() {
    try {
      let strategies = [];
      
      if (isDemoModeDb()) {
        // Use in-memory storage in demo mode
        strategies = await memoryStore.find('strategies', { isActive: true });
      } else {
        strategies = await Strategy.find({ isActive: true });
      }
      
      this.activeStrategies.clear();
      
      strategies.forEach(strategy => {
        this.activeStrategies.set(strategy._id.toString(), strategy);
      });

      logger.info(`Loaded ${strategies.length} active strategies`);
      
    } catch (error) {
      logger.error('Error loading strategies:', error);
      // Don't throw - just continue with empty strategies
    }
  }

  /**
   * Evaluate all active strategies
   */
  async evaluateStrategies() {
    if (this.activeStrategies.size === 0) return;

    try {
      for (const [strategyId, strategy] of this.activeStrategies) {
        await this.evaluateStrategy(strategy);
      }
    } catch (error) {
      logger.error('Error evaluating strategies:', error);
    }
  }

  /**
   * Evaluate a single strategy
   */
  async evaluateStrategy(strategy) {
    try {
      // Get instruments for this strategy
      const instrumentTokens = strategy.instruments.map(i => i.instrumentToken);
      
      if (instrumentTokens.length === 0) {
        return;
      }

      // Get stock data
      const stocks = await Stock.find({
        instrumentToken: { $in: instrumentTokens },
        isActive: true
      });

      // Check each stock against strategy conditions
      for (const stock of stocks) {
        const signal = await this.checkConditions(stock, strategy);
        
        if (signal.triggered) {
          await this.handleSignal(stock, strategy, signal);
        }
      }
      
    } catch (error) {
      logger.error(`Error evaluating strategy ${strategy._id}:`, error);
    }
  }

  /**
   * Check if stock meets strategy conditions
   */
  async checkConditions(stock, strategy) {
    const conditions = strategy.conditions;
    const metrics = stock.metrics || {};
    
    const signal = {
      triggered: false,
      reasons: [],
      data: {}
    };

    // Price conditions
    if (conditions.priceMin && stock.lastPrice < conditions.priceMin) {
      return signal;
    }
    if (conditions.priceMax && stock.lastPrice > conditions.priceMax) {
      return signal;
    }

    // Price change conditions
    if (metrics.percentageChange !== undefined) {
      if (conditions.priceChangeMin && metrics.percentageChange < conditions.priceChangeMin) {
        return signal;
      }
      if (conditions.priceChangeMax && metrics.percentageChange > conditions.priceChangeMax) {
        return signal;
      }
    }

    // Volume conditions
    if (conditions.volumeMin && stock.volume < conditions.volumeMin) {
      return signal;
    }
    if (conditions.volumeChangeMin && metrics.volumeChange < conditions.volumeChangeMin) {
      return signal;
    }

    // RSI conditions
    if (metrics.rsi !== undefined && metrics.rsi !== null) {
      if (conditions.rsiMin && metrics.rsi < conditions.rsiMin) {
        return signal;
      }
      if (conditions.rsiMax && metrics.rsi > conditions.rsiMax) {
        return signal;
      }
    }

    // Buyer/Seller ratio conditions
    if (metrics.buyerSellerRatio !== undefined) {
      if (conditions.buyerSellerRatioMin && metrics.buyerSellerRatio < conditions.buyerSellerRatioMin) {
        return signal;
      }
      if (conditions.buyerSellerRatioMax && metrics.buyerSellerRatio > conditions.buyerSellerRatioMax) {
        return signal;
      }
    }

    // VWAP conditions
    if (metrics.vwap !== undefined) {
      if (conditions.priceAboveVWAP && stock.lastPrice <= metrics.vwap) {
        return signal;
      }
      if (conditions.priceBelowVWAP && stock.lastPrice >= metrics.vwap) {
        return signal;
      }
    }

    // Moving average conditions
    if (metrics.sma20 !== undefined) {
      if (conditions.priceAboveSMA20 && stock.lastPrice <= metrics.sma20) {
        return signal;
      }
    }
    if (metrics.sma50 !== undefined) {
      if (conditions.priceAboveSMA50 && stock.lastPrice <= metrics.sma50) {
        return signal;
      }
    }

    // Golden/Death cross
    if (metrics.sma20 !== undefined && metrics.sma50 !== undefined) {
      const isGoldenCross = metrics.sma20 > metrics.sma50;
      const isDeathCross = metrics.sma20 < metrics.sma50;
      
      if (conditions.goldenCross && !isGoldenCross) {
        return signal;
      }
      if (conditions.deathCross && !isDeathCross) {
        return signal;
      }
    }

    // Custom condition (eval - use with caution!)
    if (conditions.customCondition) {
      try {
        const customFunc = new Function('stock', 'metrics', conditions.customCondition);
        if (!customFunc(stock, metrics)) {
          return signal;
        }
      } catch (error) {
        logger.error('Error evaluating custom condition:', error);
        return signal;
      }
    }

    // All conditions passed
    signal.triggered = true;
    signal.data = {
      price: stock.lastPrice,
      volume: stock.volume,
      rsi: metrics.rsi,
      buyerSellerRatio: metrics.buyerSellerRatio,
      volumeChange: metrics.volumeChange,
      percentageChange: metrics.percentageChange
    };

    return signal;
  }

  /**
   * Handle triggered signal
   */
  async handleSignal(stock, strategy, signal) {
    try {
      logger.info(`Signal triggered for ${stock.tradingSymbol} - Strategy: ${strategy.name}`);
      
      // Update strategy stats
      await strategy.incrementSignals();
      
      // Emit signal to clients
      this.io.emit('strategy:signal', {
        strategyId: strategy._id,
        strategyName: strategy.name,
        stock: {
          instrumentToken: stock.instrumentToken,
          tradingSymbol: stock.tradingSymbol,
          exchange: stock.exchange,
          lastPrice: stock.lastPrice
        },
        signal: signal.data,
        timestamp: new Date()
      });

      // Check if we should execute trade
      if (process.env.ENABLE_AUTO_TRADING === 'true') {
        await this.executeTrade(stock, strategy, signal);
      } else {
        logger.info('Auto-trading disabled. Signal logged but not executed.');
      }
      
    } catch (error) {
      logger.error('Error handling signal:', error);
    }
  }

  /**
   * Execute trade based on strategy
   */
  async executeTrade(stock, strategy, signal) {
    try {
      const tradeConfig = strategy.tradeConfig;
      
      // Get current VIX for volatility-based adjustments
      const currentVIX = vixService.getCurrentVIX();
      const marketCondition = vixService.getMarketCondition();
      
      // Apply VIX adjustments to trading parameters
      const adjustedParams = applyVIXAdjustment({
        stopLoss: tradeConfig.stopLoss,
        takeProfit: tradeConfig.takeProfit,
        quantity: tradeConfig.quantity || 1
      }, currentVIX);
      
      logger.info(`📊 VIX Adjustment: ${currentVIX.toFixed(2)} (${marketCondition}) - Qty: ${tradeConfig.quantity} → ${adjustedParams.quantity}, Stop: ${tradeConfig.stopLoss}% → ${adjustedParams.stopLoss.toFixed(2)}%`);
      
      // Prepare order parameters with adjusted values
      const orderParams = {
        tradingsymbol: stock.tradingSymbol,
        exchange: stock.exchange,
        transaction_type: tradeConfig.transactionType,
        quantity: adjustedParams.quantity,
        order_type: tradeConfig.orderType || 'MARKET',
        product: tradeConfig.product || 'CNC',
        stopLoss: adjustedParams.stopLoss,
        takeProfit: adjustedParams.takeProfit
      };

      // Add limit price if order type is LIMIT
      if (tradeConfig.orderType === 'LIMIT') {
        orderParams.price = stock.lastPrice;
      }

      // Place order with profile name (if strategy has associated profile)
      const result = await orderService.placeOrder(
        orderParams,
        strategy._id,
        signal.data,
        strategy.profileName || null
      );

      if (result.success) {
        logger.info(`Trade executed: Order ID ${result.orderId}`);
        
        // Update strategy stats
        await strategy.updateStats({
          status: 'PENDING',
          pnl: 0
        });
        
        // Emit to clients
        this.io.emit('strategy:trade', {
          strategyId: strategy._id,
          strategyName: strategy.name,
          orderId: result.orderId,
          tradeId: result.tradeId,
          stock: stock.tradingSymbol
        });
      }
      
    } catch (error) {
      logger.error('Error executing trade:', error);
    }
  }

  /**
   * Add or update strategy
   */
  async addStrategy(strategyData) {
    try {
      let strategy;
      
      if (isDemoMode()) {
        strategy = await memoryStore.create('strategies', {
          ...strategyData,
          userId: strategyData.userId || 'default',
          isActive: strategyData.isActive !== undefined ? strategyData.isActive : true,
          signalsGenerated: 0,
          tradesExecuted: 0,
          successfulTrades: 0,
          totalPnL: 0
        });
      } else {
        strategy = new Strategy(strategyData);
        await strategy.save();
      }
      
      if (strategy.isActive) {
        this.activeStrategies.set(strategy._id.toString(), strategy);
      }
      
      logger.info(`Strategy added: ${strategy.name}`);
      
      return strategy;
      
    } catch (error) {
      logger.error('Error adding strategy:', error);
      throw error;
    }
  }

  /**
   * Toggle strategy active status
   */
  async toggleStrategy(strategyId) {
    try {
      let strategy;
      
      if (isDemoModeDb()) {
        strategy = await memoryStore.findById('strategies', strategyId);
        if (!strategy) {
          throw new Error('Strategy not found');
        }
        strategy.isActive = !strategy.isActive;
        await memoryStore.update('strategies', strategyId, { isActive: strategy.isActive });
      } else {
        strategy = await Strategy.findById(strategyId);
        
        if (!strategy) {
          throw new Error('Strategy not found');
        }
        
        strategy.isActive = !strategy.isActive;
        await strategy.save();
      }
      
      if (strategy.isActive) {
        this.activeStrategies.set(strategyId, strategy);
      } else {
        this.activeStrategies.delete(strategyId);
      }
      
      logger.info(`Strategy ${strategy.name} ${strategy.isActive ? 'enabled' : 'disabled'}`);
      
      return strategy;
      
    } catch (error) {
      logger.error('Error toggling strategy:', error);
      throw error;
    }
  }

  /**
   * Daily cleanup
   */
  async dailyCleanup() {
    try {
      logger.info('Running daily cleanup...');
      
      // Reset daily stats, clear old data, etc.
      // This is a placeholder for cleanup logic
      
      logger.info('Daily cleanup complete');
      
    } catch (error) {
      logger.error('Error during daily cleanup:', error);
    }
  }

  /**
   * Get active strategies
   */
  getActiveStrategies() {
    return Array.from(this.activeStrategies.values());
  }
}

module.exports = StrategyService;
