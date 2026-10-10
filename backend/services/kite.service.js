const { getKiteInstance, isDemoMode } = require('../config/kite.config');
const mockService = require('./mock.service');
const logger = require('../utils/logger');
const { RateLimiter } = require('../utils/helpers');

class KiteService {
  constructor() {
    this.kite = getKiteInstance();
    this.rateLimiter = new RateLimiter(10, 1000); // 10 requests per second
    this.instruments = null;
    this.instrumentsMap = new Map();
    this.demoMode = isDemoMode();
    
    if (this.demoMode) {
      logger.info('📊 Kite Service initialized in DEMO MODE');
    }
  }

  /**
   * Get all instruments
   */
  async getAllInstruments(exchange = null) {
    try {
      // Use mock data in demo mode
      if (this.demoMode) {
        if (!this.instruments) {
          this.instruments = mockService.getAllInstruments(exchange);
          this.instruments.forEach(instrument => {
            this.instrumentsMap.set(instrument.instrument_token, instrument);
          });
        }
        return this.instruments;
      }

      await this.rateLimiter.throttle();
      
      if (!this.instruments) {
        this.instruments = await this.kite.getInstruments(exchange);
        
        // Create a map for quick lookup
        this.instruments.forEach(instrument => {
          this.instrumentsMap.set(instrument.instrument_token, instrument);
        });
        
        logger.info(`Loaded ${this.instruments.length} instruments`);
      }
      
      return this.instruments;
    } catch (error) {
      logger.error('Error fetching instruments:', error);
      throw error;
    }
  }

  /**
   * Search instruments by symbol
   */
  async searchInstruments(query, exchange = 'NSE') {
    try {
      // Use mock data in demo mode
      if (this.demoMode) {
        return mockService.searchInstruments(query, exchange);
      }

      const instruments = await this.getAllInstruments();
      const searchQuery = query.toUpperCase();
      
      return instruments.filter(instrument => 
        instrument.exchange === exchange &&
        (instrument.tradingsymbol.includes(searchQuery) || 
         (instrument.name && instrument.name.toUpperCase().includes(searchQuery)))
      ).slice(0, 20); // Limit results
      
    } catch (error) {
      logger.error('Error searching instruments:', error);
      throw error;
    }
  }

  /**
   * Get quote for instruments
   */
  async getQuote(instruments) {
    try {
      if (this.demoMode) {
        return mockService.getQuote(instruments);
      }

      await this.rateLimiter.throttle();
      return await this.kite.getQuote(instruments);
    } catch (error) {
      logger.error('Error fetching quote:', error);
      throw error;
    }
  }

  /**
   * Get OHLC data
   */
  async getOHLC(instruments) {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getOHLC(instruments);
    } catch (error) {
      logger.error('Error fetching OHLC:', error);
      throw error;
    }
  }

  /**
   * Get LTP (Last Traded Price)
   */
  async getLTP(instruments) {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getLTP(instruments);
    } catch (error) {
      logger.error('Error fetching LTP:', error);
      throw error;
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(instrumentToken, interval, fromDate, toDate) {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getHistoricalData(
        instrumentToken,
        interval,
        fromDate,
        toDate
      );
    } catch (error) {
      logger.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getProfile();
    } catch (error) {
      logger.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Get margins
   */
  async getMargins(segment = null) {
    try {
      await this.rateLimiter.throttle();
      return await this.kite.getMargins(segment);
    } catch (error) {
      logger.error('Error fetching margins:', error);
      throw error;
    }
  }

  /**
   * Get positions
   */
  async getPositions() {
    try {
      if (this.demoMode) {
        return mockService.getPositions();
      }

      await this.rateLimiter.throttle();
      return await this.kite.getPositions();
    } catch (error) {
      logger.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Get holdings
   */
  async getHoldings() {
    try {
      if (this.demoMode) {
        return mockService.getHoldings();
      }

      await this.rateLimiter.throttle();
      return await this.kite.getHoldings();
    } catch (error) {
      logger.error('Error fetching holdings:', error);
      throw error;
    }
  }

  /**
   * Get instrument by token
   */
  getInstrumentByToken(token) {
    return this.instrumentsMap.get(token);
  }
}

module.exports = new KiteService();
