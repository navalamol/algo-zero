const kiteService = require('../services/kite.service');
const Stock = require('../models/Stock.model');
const Watchlist = require('../models/Watchlist.model');
const logger = require('../utils/logger');

/**
 * Get all instruments
 */
exports.getInstruments = async (req, res) => {
  try {
    const { exchange } = req.query;
    const instruments = await kiteService.getAllInstruments(exchange);
    
    res.json({
      success: true,
      count: instruments.length,
      data: instruments
    });
  } catch (error) {
    logger.error('Error in getInstruments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search instruments
 */
exports.searchInstruments = async (req, res) => {
  try {
    const { query, exchange = 'NSE' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    const instruments = await kiteService.searchInstruments(query, exchange);
    
    res.json({
      success: true,
      count: instruments.length,
      data: instruments
    });
  } catch (error) {
    logger.error('Error in searchInstruments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get quote for instruments
 */
exports.getQuote = async (req, res) => {
  try {
    const { instruments } = req.query;
    
    if (!instruments) {
      return res.status(400).json({
        success: false,
        error: 'Instruments parameter is required'
      });
    }
    
    const instrumentsArray = Array.isArray(instruments) ? instruments : [instruments];
    const quote = await kiteService.getQuote(instrumentsArray);
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Error in getQuote:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get watchlist
 */
exports.getWatchlist = async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    
    const watchlists = await Watchlist.find({ userId });
    
    res.json({
      success: true,
      count: watchlists.length,
      data: watchlists
    });
  } catch (error) {
    logger.error('Error in getWatchlist:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create watchlist
 */
exports.createWatchlist = async (req, res) => {
  try {
    const watchlistData = req.body;
    const watchlist = new Watchlist(watchlistData);
    await watchlist.save();
    
    res.status(201).json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    logger.error('Error in createWatchlist:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add instrument to watchlist
 */
exports.addToWatchlist = async (req, res) => {
  try {
    const { watchlistId } = req.params;
    const instrument = req.body;
    
    const watchlist = await Watchlist.findById(watchlistId);
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        error: 'Watchlist not found'
      });
    }
    
    await watchlist.addInstrument(instrument);
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    logger.error('Error in addToWatchlist:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove instrument from watchlist
 */
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { watchlistId, instrumentToken } = req.params;
    
    const watchlist = await Watchlist.findById(watchlistId);
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        error: 'Watchlist not found'
      });
    }
    
    await watchlist.removeInstrument(parseInt(instrumentToken));
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    logger.error('Error in removeFromWatchlist:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get filtered stocks
 */
exports.getFilteredStocks = async (req, res) => {
  try {
    const filters = req.body;
    
    // Build query
    const query = { isActive: true };
    
    if (filters.priceMin || filters.priceMax) {
      query.lastPrice = {};
      if (filters.priceMin) query.lastPrice.$gte = filters.priceMin;
      if (filters.priceMax) query.lastPrice.$lte = filters.priceMax;
    }
    
    if (filters.rsiMin || filters.rsiMax) {
      query['metrics.rsi'] = {};
      if (filters.rsiMin) query['metrics.rsi'].$gte = filters.rsiMin;
      if (filters.rsiMax) query['metrics.rsi'].$lte = filters.rsiMax;
    }
    
    if (filters.volumeMin) {
      query.volume = { $gte: filters.volumeMin };
    }
    
    if (filters.buyerSellerRatioMin) {
      query['metrics.buyerSellerRatio'] = { $gte: filters.buyerSellerRatioMin };
    }
    
    const stocks = await Stock.find(query)
      .limit(filters.limit || 100)
      .sort(filters.sortBy || { lastUpdateTime: -1 });
    
    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    logger.error('Error in getFilteredStocks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get stock details
 */
exports.getStockDetails = async (req, res) => {
  try {
    const { instrumentToken } = req.params;
    
    const stock = await Stock.findOne({ instrumentToken: parseInt(instrumentToken) });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }
    
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    logger.error('Error in getStockDetails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
