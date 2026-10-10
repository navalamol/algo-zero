const orderService = require('../services/order.service');
const kiteService = require('../services/kite.service');
const Trade = require('../models/Trade.model');
const logger = require('../utils/logger');
const { isDemoModeDb } = require('../config/kite.config');
const memoryStore = require('../services/memory-store.service');

/**
 * Place order
 */
exports.placeOrder = async (req, res) => {
  try {
    const orderParams = req.body;
    
    const result = await orderService.placeOrder(orderParams);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in placeOrder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Modify order
 */
exports.modifyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderParams = req.body;
    
    const result = await orderService.modifyOrder(orderId, orderParams);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in modifyOrder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { variety } = req.query;
    
    const result = await orderService.cancelOrder(orderId, variety);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in cancelOrder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get order history
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await orderService.getOrderHistory();
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    logger.error('Error in getOrderHistory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get order details
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderHistory = await orderService.getOrderDetails(orderId);
    
    res.json({
      success: true,
      data: orderHistory
    });
  } catch (error) {
    logger.error('Error in getOrderDetails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get positions
 */
exports.getPositions = async (req, res) => {
  try {
    const positions = await kiteService.getPositions();
    console.log('Positions:', positions);
    
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    logger.error('Error in getPositions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get holdings
 */
exports.getHoldings = async (req, res) => {
  try {
    const holdings = await kiteService.getHoldings();
    
    res.json({
      success: true,
      data: holdings
    });
  } catch (error) {
    logger.error('Error in getHoldings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get trades from database
 */
exports.getTrades = async (req, res) => {
  try {
    const { userId = 'default', limit = 100, status } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    let trades;
    if (isDemoModeDb()) {
      trades = await memoryStore.find('trades', query);
      trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      trades = trades.slice(0, parseInt(limit));
    } else {
      trades = await Trade.find(query)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate('strategyId');

        console.log('Trades:', trades);
    }
    
    res.json({
      success: true,
      count: trades.length,
      data: trades
    });
  } catch (error) {
    logger.error('Error in getTrades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get trade statistics
 */
exports.getTradeStats = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    let stats;
    if (isDemoModeDb()) {
      const trades = await memoryStore.find('trades', { userId });
      const completedTrades = trades.filter(t => t.status === 'COMPLETE');
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const successfulTrades = trades.filter(t => (t.pnl || 0) > 0).length;
      
      stats = [{
        _id: null,
        totalTrades: trades.length,
        completedTrades: completedTrades.length,
        totalPnL: totalPnL,
        avgPnL: trades.length > 0 ? totalPnL / trades.length : 0,
        successfulTrades: successfulTrades
      }];
    } else {
      stats = await Trade.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalTrades: { $sum: 1 },
            completedTrades: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETE'] }, 1, 0] }
            },
            totalPnL: { $sum: '$pnl' },
            avgPnL: { $avg: '$pnl' },
            successfulTrades: {
              $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] }
            }
          }
        }
      ]);
    }
    
    res.json({
      success: true,
      data: stats[0] || {
        totalTrades: 0,
        completedTrades: 0,
        totalPnL: 0,
        avgPnL: 0,
        successfulTrades: 0
      }
    });
  } catch (error) {
    logger.error('Error in getTradeStats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Exit position
 */
exports.exitPosition = async (req, res) => {
  try {
    const { tradingSymbol, exchange, quantity, transactionType } = req.body;
    
    const result = await orderService.exitPosition(
      tradingSymbol,
      exchange,
      quantity,
      transactionType
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in exitPosition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
