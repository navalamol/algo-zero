const Strategy = require('../models/Strategy.model');
const logger = require('../utils/logger');
const { isDemoModeDb, isDemoMode } = require('../config/kite.config');
const memoryStore = require('../services/memory-store.service');

/**
 * Get all strategies
 */
exports.getStrategies = async (req, res) => {
  try {
    const { userId = 'default', isActive } = req.query;
    
    const query = { userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    let strategies;
    if (isDemoModeDb()) {
      strategies = await memoryStore.find('strategies', query);
      strategies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      strategies = await Strategy.find(query).sort({ createdAt: -1 });
    }
    
    res.json({
      success: true,
      count: strategies.length,
      data: strategies
    });
  } catch (error) {
    logger.error('Error in getStrategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get strategy by ID
 */
exports.getStrategyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let strategy;
    if (isDemoMode()) {
      strategy = await memoryStore.findById('strategies', id);
    } else {
      strategy = await Strategy.findById(id);
    }
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Error in getStrategyById:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create strategy
 */
exports.createStrategy = async (req, res) => {
  try {
    const strategyData = req.body;
    
    const strategyService = req.app.locals.strategyService;
    const strategy = await strategyService.addStrategy(strategyData);
    
    res.status(201).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Error in createStrategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update strategy
 */
exports.updateStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    let strategy;
    if (isDemoModeDb()) {
      strategy = await memoryStore.update('strategies', id, updates);
    } else {
      strategy = await Strategy.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );
    }
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    // Reload active strategies if this was updated
    const strategyService = req.app.locals.strategyService;
    await strategyService.loadActiveStrategies();
    
    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Error in updateStrategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Toggle strategy active status
 */
exports.toggleStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    
    const strategyService = req.app.locals.strategyService;
    const strategy = await strategyService.toggleStrategy(id);
    
    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Error in toggleStrategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete strategy
 */
exports.deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    
    let strategy;
    if (isDemoModeDb()) {
      strategy = await memoryStore.findById('strategies', id);
      if (strategy) {
        await memoryStore.delete('strategies', id);
      }
    } else {
      strategy = await Strategy.findByIdAndDelete(id);
    }
    
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }
    
    // Reload active strategies
    const strategyService = req.app.locals.strategyService;
    await strategyService.loadActiveStrategies();
    
    res.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteStrategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active signals
 */
exports.getActiveSignals = async (req, res) => {
  try {
    const strategyService = req.app.locals.strategyService;
    const activeStrategies = strategyService.getActiveStrategies();
    
    res.json({
      success: true,
      count: activeStrategies.length,
      data: activeStrategies
    });
  } catch (error) {
    logger.error('Error in getActiveSignals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
