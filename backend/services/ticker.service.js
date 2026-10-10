const KiteTicker = require('kiteconnect').KiteTicker;
const { kiteConfig, isDemoMode } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');
const Stock = require('../models/Stock.model');
const indicatorsService = require('./indicators.service');

class TickerService {
  constructor(io) {
    this.io = io;
    this.ticker = null;
    this.isConnectedFlag = false;
    this.subscriptions = new Map(); // client_id -> [tokens]
    this.allSubscribedTokens = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10;
    this.reconnectInterval = parseInt(process.env.WS_RECONNECT_INTERVAL) || 5000;
    this.demoMode = isDemoMode();
    this.mockTickInterval = null;
  }

  /**
   * Initialize and connect ticker
   */
  connect() {
    try {
      // Use mock ticker in demo mode
      if (this.demoMode) {
        logger.info('📊 Starting mock ticker (DEMO MODE)');
        this.isConnectedFlag = true;
        this.io.emit('ticker:connected', { status: 'connected', mode: 'demo' });
        this.startMockTicker();
        return;
      }

      if (!kiteConfig.apiKey || !kiteConfig.accessToken) {
        logger.error('Cannot connect ticker: Missing API key or access token');
        return;
      }

      this.ticker = new KiteTicker({
        api_key: kiteConfig.apiKey,
        access_token: kiteConfig.accessToken
      });

      this.setupEventHandlers();
      this.ticker.connect();
      
      logger.info('Ticker connecting...');
      
    } catch (error) {
      logger.error('Error initializing ticker:', error);
    }
  }

  /**
   * Setup ticker event handlers
   */
  setupEventHandlers() {
    this.ticker.on('connect', () => {
      this.isConnectedFlag = true;
      this.reconnectAttempts = 0;
      logger.info('Ticker connected successfully');
      
      // Resubscribe to all tokens
      if (this.allSubscribedTokens.size > 0) {
        const tokens = Array.from(this.allSubscribedTokens);
        this.ticker.subscribe(tokens);
        this.ticker.setMode(this.ticker.modeFull, tokens);
        logger.info(`Resubscribed to ${tokens.length} instruments`);
      }
      
      // Notify all clients
      this.io.emit('ticker:connected', { status: 'connected' });
    });

    this.ticker.on('disconnect', (error) => {
      this.isConnectedFlag = false;
      logger.warn('Ticker disconnected:', error);
      
      this.io.emit('ticker:disconnected', { status: 'disconnected' });
      
      // Attempt to reconnect
      this.attemptReconnect();
    });

    this.ticker.on('error', (error) => {
      logger.error('Ticker error:', error);
      this.io.emit('ticker:error', { error: error.message });
    });

    this.ticker.on('close', () => {
      this.isConnectedFlag = false;
      logger.info('Ticker connection closed');
    });

    this.ticker.on('ticks', async (ticks) => {
      await this.handleTicks(ticks);
    });

    this.ticker.on('order_update', (order) => {
      logger.info('Order update received:', order);
      this.io.emit('order:update', order);
    });
  }

  /**
   * Handle incoming ticks
   */
  async handleTicks(ticks) {
    try {
      // Process each tick
      for (const tick of ticks) {
        // Update stock in database
        await this.updateStockData(tick);
        
        // Emit to all connected clients
        this.io.emit('tick:data', tick);
        
        // Emit to specific stock room if anyone is watching
        this.io.to(`stock:${tick.instrument_token}`).emit('tick:update', tick);
      }
      
    } catch (error) {
      logger.error('Error handling ticks:', error);
    }
  }

  /**
   * Update stock data in database
   */
  async updateStockData(tick) {
    try {
      let stock = await Stock.findOne({ instrumentToken: tick.instrument_token });
      
      if (!stock) {
        // Create new stock entry
        stock = new Stock({
          instrumentToken: tick.instrument_token,
          tradingSymbol: tick.tradable ? 'UNKNOWN' : 'UNKNOWN',
          exchange: 'NSE' // Default, should be set properly
        });
      }
      
      // Update tick data
      await stock.updateTick(tick);
      
      // Add to history
      if (tick.last_price && tick.volume_traded) {
        await stock.addToHistory(tick.last_price, tick.volume_traded);
      }
      
      // Calculate indicators if we have enough history
      if (stock.history.length >= 14) {
        const indicators = indicatorsService.calculateAllIndicators(stock);
        stock.metrics = indicators;
        stock.lastCalculated = new Date();
        await stock.save();
      }
      
    } catch (error) {
      logger.error('Error updating stock data:', error);
    }
  }

  /**
   * Add subscription for a client
   */
  addSubscription(clientId, tokens) {
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }
    
    // Add to client subscriptions
    const currentSubs = this.subscriptions.get(clientId) || [];
    const newSubs = [...new Set([...currentSubs, ...tokens])];
    this.subscriptions.set(clientId, newSubs);
    
    // Add to all subscribed tokens
    tokens.forEach(token => this.allSubscribedTokens.add(token));
    
    // Subscribe via ticker if connected
    if (this.isConnectedFlag && this.ticker) {
      this.ticker.subscribe(tokens);
      this.ticker.setMode(this.ticker.modeFull, tokens);
      logger.info(`Subscribed to tokens: ${tokens.join(', ')}`);
    }
  }

  /**
   * Remove subscription for a client
   */
  removeSubscription(clientId, tokens) {
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }
    
    const currentSubs = this.subscriptions.get(clientId) || [];
    const newSubs = currentSubs.filter(t => !tokens.includes(t));
    
    if (newSubs.length > 0) {
      this.subscriptions.set(clientId, newSubs);
    } else {
      this.subscriptions.delete(clientId);
    }
    
    // Check if any other client is subscribed to these tokens
    tokens.forEach(token => {
      const isSubscribedByOthers = Array.from(this.subscriptions.values())
        .some(subs => subs.includes(token));
      
      if (!isSubscribedByOthers) {
        this.allSubscribedTokens.delete(token);
        
        // Unsubscribe from ticker
        if (this.isConnectedFlag && this.ticker) {
          this.ticker.unsubscribe([token]);
          logger.info(`Unsubscribed from token: ${token}`);
        }
      }
    });
  }

  /**
   * Remove all subscriptions for a client
   */
  removeClient(clientId) {
    const tokens = this.subscriptions.get(clientId) || [];
    if (tokens.length > 0) {
      this.removeSubscription(clientId, tokens);
    }
    this.subscriptions.delete(clientId);
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }
    
    this.reconnectAttempts++;
    
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Start mock ticker for demo mode
   */
  startMockTicker() {
    if (this.mockTickInterval) {
      clearInterval(this.mockTickInterval);
    }

    // Generate mock ticks every 1 second
    this.mockTickInterval = setInterval(() => {
      if (this.allSubscribedTokens.size > 0) {
        const ticks = [];
        this.allSubscribedTokens.forEach(token => {
          const tick = mockService.generateTick(token);
          if (tick) {
            ticks.push(tick);
          }
        });

        if (ticks.length > 0) {
          this.handleTicks(ticks);
        }
      }
    }, 1000);

    logger.info('Mock ticker started, generating ticks every 1 second');
  }

  /**
   * Stop mock ticker
   */
  stopMockTicker() {
    if (this.mockTickInterval) {
      clearInterval(this.mockTickInterval);
      this.mockTickInterval = null;
      logger.info('Mock ticker stopped');
    }
  }

  /**
   * Disconnect ticker
   */
  disconnect() {
    if (this.demoMode) {
      this.stopMockTicker();
      this.isConnectedFlag = false;
      return;
    }

    if (this.ticker) {
      this.ticker.disconnect();
      logger.info('Ticker disconnected manually');
    }
  }

  /**
   * Check if ticker is connected
   */
  isConnected() {
    return this.isConnectedFlag;
  }

  /**
   * Get all subscribed tokens
   */
  getSubscribedTokens() {
    return Array.from(this.allSubscribedTokens);
  }
}

module.exports = TickerService;
