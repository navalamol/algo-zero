// User Profile Service
// File-based user profiles for personal/group use

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ProfileService {
  constructor() {
    this.profilesDir = path.join(__dirname, '../../profiles');
    this.currentProfile = null;
    this.ensureProfilesDirectory();
  }

  /**
   * Ensure profiles directory exists
   */
  async ensureProfilesDirectory() {
    try {
      await fs.mkdir(this.profilesDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating profiles directory:', error);
    }
  }

  /**
   * Create a new user profile
   */
  async createProfile(profileData) {
    const {
      name,
      displayName,
      capital,
      riskLevel = 'MODERATE',
      paperTrading = true
    } = profileData;

    // Validate name
    if (!name || !name.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error('Profile name must contain only letters, numbers, hyphens, and underscores');
    }

    const profileDir = path.join(this.profilesDir, name);

    // Check if profile already exists
    try {
      await fs.access(profileDir);
      throw new Error(`Profile "${name}" already exists`);
    } catch (error) {
      // Profile doesn't exist, continue
    }

    // Create profile directory
    await fs.mkdir(profileDir, { recursive: true });
    await fs.mkdir(path.join(profileDir, 'data'), { recursive: true });

    // Define risk presets
    const riskPresets = {
      CONSERVATIVE: {
        maxDailyTrades: 3,
        maxPositionSize: 25000,
        defaultStopLoss: 1,
        defaultTakeProfit: 2,
        riskPerTrade: 0.5,
        maxDailyLoss: 2000
      },
      MODERATE: {
        maxDailyTrades: 10,
        maxPositionSize: 50000,
        defaultStopLoss: 2,
        defaultTakeProfit: 5,
        riskPerTrade: 1,
        maxDailyLoss: 5000
      },
      AGGRESSIVE: {
        maxDailyTrades: 20,
        maxPositionSize: 100000,
        defaultStopLoss: 3,
        defaultTakeProfit: 8,
        riskPerTrade: 2,
        maxDailyLoss: 10000
      }
    };

    const riskConfig = riskPresets[riskLevel] || riskPresets.MODERATE;

    // Create config file
    const config = {
      profile: {
        name,
        displayName: displayName || name,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      },
      trading: {
        capital,
        riskLevel,
        paperTrading,
        ...riskConfig,
        
        tradingHours: {
          start: '09:15',
          end: '15:30'
        },
        
        exchanges: ['NSE'],
        
        notifications: {
          telegram: {
            enabled: false,
            botToken: '',
            chatId: '',
            onTradeExecuted: true,
            onDailySummary: true,
            onRiskAlert: true
          }
        },
        
        preferences: {
          autoExecute: false,
          requireConfirmation: true,
          waitAfterStopLoss: 300,
          cooldownPeriod: 1800
        }
      },
      
      statistics: {
        totalTrades: 0,
        totalPnL: 0,
        winningTrades: 0,
        losingTrades: 0,
        bestTrade: 0,
        worstTrade: 0,
        currentStreak: 0,
        bestStreak: 0,
        worstStreak: 0
      }
    };

    await fs.writeFile(
      path.join(profileDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create empty files
    await fs.writeFile(
      path.join(profileDir, 'strategies.json'),
      JSON.stringify([], null, 2)
    );

    await fs.writeFile(
      path.join(profileDir, 'trades.json'),
      JSON.stringify([], null, 2)
    );

    await fs.writeFile(
      path.join(profileDir, 'watchlists.json'),
      JSON.stringify({ default: [] }, null, 2)
    );

    await fs.writeFile(
      path.join(profileDir, 'journal.json'),
      JSON.stringify([], null, 2)
    );

    logger.info(`✅ Profile created: ${displayName || name}`);
    logger.info(`📁 Location: ${profileDir}`);
    logger.info(`💰 Capital: ₹${capital.toLocaleString('en-IN')}`);
    logger.info(`⚠️  Risk Level: ${riskLevel}`);
    logger.info(`📝 Paper Trading: ${paperTrading ? 'Yes' : 'No'}`);

    return config;
  }

  /**
   * Load a profile
   */
  async loadProfile(name) {
    const profileDir = path.join(this.profilesDir, name);
    const configPath = path.join(profileDir, 'config.json');

    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Update last active
      config.profile.lastActive = new Date().toISOString();
      await this.saveProfileConfig(name, config);

      this.currentProfile = { name, ...config };
      
      logger.info(`👤 Profile loaded: ${config.profile.displayName}`);
      
      return config;
    } catch (error) {
      throw new Error(`Profile "${name}" not found`);
    }
  }

  /**
   * Save profile config
   */
  async saveProfileConfig(name, config) {
    const profileDir = path.join(this.profilesDir, name);
    const configPath = path.join(profileDir, 'config.json');
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * List all profiles
   */
  async listProfiles() {
    try {
      const entries = await fs.readdir(this.profilesDir, { withFileTypes: true });
      const profiles = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const config = await this.getProfileConfig(entry.name);
            profiles.push({
              name: entry.name,
              displayName: config.profile.displayName,
              capital: config.trading.capital,
              paperTrading: config.trading.paperTrading,
              riskLevel: config.trading.riskLevel,
              lastActive: config.profile.lastActive,
              totalTrades: config.statistics.totalTrades,
              totalPnL: config.statistics.totalPnL
            });
          } catch (error) {
            // Skip invalid profiles
          }
        }
      }

      return profiles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get profile config
   */
  async getProfileConfig(name) {
    const configPath = path.join(this.profilesDir, name, 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Update profile statistics
   */
  async updateStatistics(name, trade) {
    const config = await this.getProfileConfig(name);
    
    config.statistics.totalTrades++;
    config.statistics.totalPnL += trade.pnl || 0;
    
    if (trade.pnl > 0) {
      config.statistics.winningTrades++;
      config.statistics.currentStreak = config.statistics.currentStreak > 0 
        ? config.statistics.currentStreak + 1 
        : 1;
    } else if (trade.pnl < 0) {
      config.statistics.losingTrades++;
      config.statistics.currentStreak = config.statistics.currentStreak < 0 
        ? config.statistics.currentStreak - 1 
        : -1;
    }
    
    if (trade.pnl > config.statistics.bestTrade) {
      config.statistics.bestTrade = trade.pnl;
    }
    
    if (trade.pnl < config.statistics.worstTrade) {
      config.statistics.worstTrade = trade.pnl;
    }
    
    if (config.statistics.currentStreak > config.statistics.bestStreak) {
      config.statistics.bestStreak = config.statistics.currentStreak;
    }
    
    if (config.statistics.currentStreak < config.statistics.worstStreak) {
      config.statistics.worstStreak = config.statistics.currentStreak;
    }
    
    await this.saveProfileConfig(name, config);
    
    return config.statistics;
  }

  /**
   * Get profile strategies
   */
  async getStrategies(name) {
    const strategiesPath = path.join(this.profilesDir, name, 'strategies.json');
    const data = await fs.readFile(strategiesPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Save profile strategies
   */
  async saveStrategies(name, strategies) {
    const strategiesPath = path.join(this.profilesDir, name, 'strategies.json');
    await fs.writeFile(strategiesPath, JSON.stringify(strategies, null, 2));
  }

  /**
   * Get profile trades
   */
  async getTrades(name) {
    const tradesPath = path.join(this.profilesDir, name, 'trades.json');
    const data = await fs.readFile(tradesPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Add trade to profile
   */
  async addTrade(name, trade) {
    const trades = await this.getTrades(name);
    trades.push({
      ...trade,
      timestamp: new Date().toISOString()
    });
    
    const tradesPath = path.join(this.profilesDir, name, 'trades.json');
    await fs.writeFile(tradesPath, JSON.stringify(trades, null, 2));
    
    // Update statistics if trade is closed
    if (trade.status === 'COMPLETE' && trade.pnl !== undefined) {
      await this.updateStatistics(name, trade);
    }
    
    return trades;
  }

  /**
   * Get watchlists
   */
  async getWatchlists(name) {
    const watchlistsPath = path.join(this.profilesDir, name, 'watchlists.json');
    const data = await fs.readFile(watchlistsPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Save watchlists
   */
  async saveWatchlists(name, watchlists) {
    const watchlistsPath = path.join(this.profilesDir, name, 'watchlists.json');
    await fs.writeFile(watchlistsPath, JSON.stringify(watchlists, null, 2));
  }

  /**
   * Get current active profile
   */
  getCurrentProfile() {
    return this.currentProfile;
  }

  /**
   * Delete profile
   */
  async deleteProfile(name) {
    const profileDir = path.join(this.profilesDir, name);
    
    // Recursive delete
    await fs.rm(profileDir, { recursive: true, force: true });
    
    logger.info(`🗑️  Profile deleted: ${name}`);
  }

  /**
   * Export profile data
   */
  async exportProfile(name) {
    const profileDir = path.join(this.profilesDir, name);
    
    const config = await this.getProfileConfig(name);
    const strategies = await this.getStrategies(name);
    const trades = await this.getTrades(name);
    const watchlists = await this.getWatchlists(name);
    
    return {
      config,
      strategies,
      trades,
      watchlists,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import profile data
   */
  async importProfile(name, data) {
    const profileDir = path.join(this.profilesDir, name);
    
    await fs.mkdir(profileDir, { recursive: true });
    await fs.mkdir(path.join(profileDir, 'data'), { recursive: true });
    
    await fs.writeFile(
      path.join(profileDir, 'config.json'),
      JSON.stringify(data.config, null, 2)
    );
    
    await fs.writeFile(
      path.join(profileDir, 'strategies.json'),
      JSON.stringify(data.strategies, null, 2)
    );
    
    await fs.writeFile(
      path.join(profileDir, 'trades.json'),
      JSON.stringify(data.trades, null, 2)
    );
    
    await fs.writeFile(
      path.join(profileDir, 'watchlists.json'),
      JSON.stringify(data.watchlists, null, 2)
    );
    
    logger.info(`✅ Profile imported: ${name}`);
  }
}

module.exports = new ProfileService();
