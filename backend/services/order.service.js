const { getKiteInstance, isDemoMode, isDemoModeDb } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');
const { RateLimiter, validateOrderParams, isMarketOpen } = require('../utils/helpers');
const Trade = require('../models/Trade.model');
const memoryStore = require('./memory-store.service');

class OrderService {
  constructor() {
    this.kite = getKiteInstance();
    this.rateLimiter = new RateLimiter(10, 1000);
    this.pendingOrders = new Map();
    this.demoMode = isDemoMode();
  }

  /**
   * Place an order
   */
  async placeOrder(orderParams, strategyId = null, signalData = null) {
    try {
      // Validate order parameters
      validateOrderParams(orderParams);
      
      // Check if auto-trading is enabled
      if (process.env.ENABLE_AUTO_TRADING !== 'true') {
        logger.warn('Auto-trading is disabled. Order not placed.');
        return {
          success: false,
          message: 'Auto-trading is disabled'
        };
      }
      
      // Check if market is open
      if (!isMarketOpen()) {
        logger.warn('Market is closed. Order not placed.');
        return {
          success: false,
          message: 'Market is closed'
        };
      }
      
      let trade;
      const tradeData = {
        userId: 'default',
        strategyId,
        strategyName: strategyId ? 'Strategy' : 'Manual',
        tradingSymbol: orderParams.tradingsymbol,
        exchange: orderParams.exchange,
        transactionType: orderParams.transaction_type,
        quantity: orderParams.quantity,
        orderType: orderParams.order_type,
        product: orderParams.product,
        price: orderParams.price,
        triggerPrice: orderParams.trigger_price,
        placedAt: new Date(),
        status: 'PENDING',
        signalData
      };
      
      if (isDemoModeDb()) {
        trade = await memoryStore.create('trades', tradeData);
      } else {
        trade = new Trade(tradeData);
        await trade.save();
      }
      
      // Place order via Kite API or mock
      await this.rateLimiter.throttle();
      
      const response = this.demoMode 
        ? await mockService.placeOrder(orderParams.variety || 'regular', orderParams)
        : await this.kite.placeOrder(orderParams.variety || 'regular', orderParams);
      
      // Update trade with order ID
      if (isDemoModeDb()) {
        trade = await memoryStore.update('trades', trade._id, {
          orderId: response.order_id,
          status: 'OPEN'
        });
      } else {
        trade.orderId = response.order_id;
        trade.status = 'OPEN';
        await trade.save();
      }
      
      this.pendingOrders.set(response.order_id, trade._id);
      
      logger.info(`Order placed successfully: ${response.order_id}`);
      
      return {
        success: true,
        orderId: response.order_id,
        tradeId: trade._id
      };
      
    } catch (error) {
      logger.error('Error placing order:', error);
      
      // Update trade status to failed
      if (trade && trade._id) {
        if (isDemoModeDb()) {
          await memoryStore.update('trades', trade._id, {
            status: 'FAILED',
            errorMessage: error.message
          });
        } else {
          trade.status = 'FAILED';
          trade.errorMessage = error.message;
          await trade.save();
        }
      }
      
      throw error;
    }
  }

  /**
   * Modify an order
   */
  async modifyOrder(orderId, orderParams) {
    try {
      await this.rateLimiter.throttle();
      
      const response = await this.kite.modifyOrder(
        orderParams.variety || 'regular',
        orderId,
        orderParams
      );
      
      logger.info(`Order modified: ${orderId}`);
      
      return response;
      
    } catch (error) {
      logger.error('Error modifying order:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, variety = 'regular') {
    try {
      await this.rateLimiter.throttle();
      
      const response = await this.kite.cancelOrder(variety, orderId);
      
      // Update trade status
      const trade = await Trade.findOne({ orderId });
      if (trade) {
        trade.status = 'CANCELLED';
        await trade.save();
      }
      
      this.pendingOrders.delete(orderId);
      
      logger.info(`Order cancelled: ${orderId}`);
      
      return response;
      
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory() {
    try {
      if (this.demoMode) {
        return mockService.getOrderHistory();
      }

      await this.rateLimiter.throttle();
      return await this.kite.getOrders();
    } catch (error) {
      logger.error('Error fetching order history:', error);
      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId) {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getOrderHistory(orderId);
    } catch (error) {
      logger.error('Error fetching order details:', error);
      throw error;
    }
  }

  /**
   * Get trades
   */
  async getTrades() {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getTrades();
    } catch (error) {
      logger.error('Error fetching trades:', error);
      throw error;
    }
  }

  /**
   * Update order status from order update
   */
  async updateOrderStatus(orderUpdate) {
    try {
      const trade = await Trade.findOne({ orderId: orderUpdate.order_id });
      
      if (!trade) {
        logger.warn(`Trade not found for order: ${orderUpdate.order_id}`);
        return;
      }
      
      trade.status = orderUpdate.status;
      
      if (orderUpdate.average_price) {
        trade.averagePrice = orderUpdate.average_price;
        trade.entryPrice = orderUpdate.average_price;
      }
      
      if (orderUpdate.status === 'COMPLETE') {
        trade.executedAt = new Date();
      }
      
      if (orderUpdate.status === 'REJECTED') {
        trade.errorMessage = orderUpdate.status_message;
      }
      
      await trade.save();
      
      if (orderUpdate.status === 'COMPLETE' || orderUpdate.status === 'CANCELLED' || orderUpdate.status === 'REJECTED') {
        this.pendingOrders.delete(orderUpdate.order_id);
      }
      
    } catch (error) {
      logger.error('Error updating order status:', error);
    }
  }

  /**
   * Place bracket order (with SL and target)
   */
  async placeBracketOrder(orderParams) {
    try {
      validateOrderParams(orderParams);
      
      await this.rateLimiter.throttle();
      
      const response = await this.kite.placeOrder('bo', {
        ...orderParams,
        squareoff: orderParams.squareoff,
        stoploss: orderParams.stoploss,
        trailing_stoploss: orderParams.trailing_stoploss
      });
      
      logger.info(`Bracket order placed: ${response.order_id}`);
      
      return response;
      
    } catch (error) {
      logger.error('Error placing bracket order:', error);
      throw error;
    }
  }

  /**
   * Exit position
   */
  async exitPosition(tradingSymbol, exchange, quantity, transactionType) {
    try {
      const orderParams = {
        tradingsymbol: tradingSymbol,
        exchange: exchange,
        transaction_type: transactionType === 'BUY' ? 'SELL' : 'BUY',
        quantity: quantity,
        order_type: 'MARKET',
        product: 'CNC'
      };
      
      return await this.placeOrder(orderParams);
      
    } catch (error) {
      logger.error('Error exiting position:', error);
      throw error;
    }
  }

  /**
   * Get pending orders
   */
  getPendingOrders() {
    return Array.from(this.pendingOrders.keys());
  }
}

module.exports = new OrderService();
