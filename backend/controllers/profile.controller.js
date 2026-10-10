// Profile Controller
// Handles profile-related API requests

const profileService = require('../services/profile.service');
const telegramService = require('../services/telegram.service');
const logger = require('../utils/logger');
const { getAllStrategies, toStrategyModel } = require('../config/default-strategies');

/**
 * Create a new profile
 */
exports.createProfile = async (req, res) => {
  try {
    const { name, displayName, capital, riskLevel, paperTrading } = req.body;

    // Validation
    if (!name || !capital) {
      return res.status(400).json({
        success: false,
        error: 'Name and capital are required'
      });
    }

    if (capital < 10000) {
      return res.status(400).json({
        success: false,
        error: 'Minimum capital is ₹10,000'
      });
    }

    const profile = await profileService.createProfile({
      name,
      displayName,
      capital,
      riskLevel: riskLevel || 'MODERATE',
      paperTrading: paperTrading !== false // Default to true
    });

    res.status(201).json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Error creating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all profiles
 */
exports.listProfiles = async (req, res) => {
  try {
    const profiles = await profileService.listProfiles();

    res.json({
      success: true,
      profiles
    });
  } catch (error) {
    logger.error('Error listing profiles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Load a profile
 */
exports.loadProfile = async (req, res) => {
  try {
    const { name } = req.params;

    const profile = await profileService.loadProfile(name);

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Error loading profile:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update profile config
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    const config = await profileService.getProfileConfig(name);
    
    // Merge updates
    if (updates.trading) {
      config.trading = { ...config.trading, ...updates.trading };
    }
    if (updates.profile) {
      config.profile = { ...config.profile, ...updates.profile };
    }

    await profileService.saveProfileConfig(name, config);

    // Update Telegram if config changed
    if (updates.trading?.notifications?.telegram) {
      const telegram = updates.trading.notifications.telegram;
      if (telegram.enabled && telegram.botToken && telegram.chatId) {
        telegramService.registerBot(
          telegram.chatId,
          telegram.botToken,
          telegram.enabled
        );
      }
    }

    res.json({
      success: true,
      profile: config
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a profile
 */
exports.deleteProfile = async (req, res) => {
  try {
    const { name } = req.params;

    await profileService.deleteProfile(name);

    res.json({
      success: true,
      message: `Profile "${name}" deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get profile strategies
 */
exports.getStrategies = async (req, res) => {
  try {
    const { name } = req.params;

    const strategies = await profileService.getStrategies(name);

    res.json({
      success: true,
      strategies
    });
  } catch (error) {
    logger.error('Error getting strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add strategy to profile
 */
exports.addStrategy = async (req, res) => {
  try {
    const { name } = req.params;
    const strategy = req.body;

    const strategies = await profileService.getStrategies(name);
    strategies.push({
      ...strategy,
      createdAt: new Date().toISOString(),
      id: `strategy_${Date.now()}`
    });

    await profileService.saveStrategies(name, strategies);

    res.status(201).json({
      success: true,
      strategies
    });
  } catch (error) {
    logger.error('Error adding strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get default strategies library
 */
exports.getDefaultStrategies = async (req, res) => {
  try {
    const strategies = getAllStrategies();

    res.json({
      success: true,
      strategies
    });
  } catch (error) {
    logger.error('Error getting default strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Adopt a default strategy
 */
exports.adoptStrategy = async (req, res) => {
  try {
    const { name } = req.params;
    const { strategyId } = req.body;

    const defaultStrategies = getAllStrategies();
    const defaultStrategy = defaultStrategies.find(s => s.id === strategyId);

    if (!defaultStrategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    const strategy = toStrategyModel(defaultStrategy);

    const strategies = await profileService.getStrategies(name);
    strategies.push({
      ...strategy,
      createdAt: new Date().toISOString(),
      id: `strategy_${Date.now()}`
    });

    await profileService.saveStrategies(name, strategies);

    res.status(201).json({
      success: true,
      message: `Strategy "${defaultStrategy.name}" added to your profile`,
      strategy
    });
  } catch (error) {
    logger.error('Error adopting strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get profile trades
 */
exports.getTrades = async (req, res) => {
  try {
    const { name } = req.params;

    const trades = await profileService.getTrades(name);

    res.json({
      success: true,
      trades
    });
  } catch (error) {
    logger.error('Error getting trades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get profile statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const { name } = req.params;

    const config = await profileService.getProfileConfig(name);

    res.json({
      success: true,
      statistics: config.statistics
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export profile
 */
exports.exportProfile = async (req, res) => {
  try {
    const { name } = req.params;

    const data = await profileService.exportProfile(name);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error exporting profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Import profile
 */
exports.importProfile = async (req, res) => {
  try {
    const { name } = req.params;
    const data = req.body;

    await profileService.importProfile(name, data);

    res.status(201).json({
      success: true,
      message: `Profile "${name}" imported successfully`
    });
  } catch (error) {
    logger.error('Error importing profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Test Telegram connection
 */
exports.testTelegram = async (req, res) => {
  try {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Bot token and chat ID are required'
      });
    }

    const result = await telegramService.testConnection(chatId, botToken);

    res.json(result);
  } catch (error) {
    logger.error('Error testing Telegram:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
