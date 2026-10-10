const crypto = require('crypto');
const { getKiteInstance, kiteConfig, setAccessToken } = require('../config/kite.config');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class AuthService {
  constructor() {
    this.kite = getKiteInstance();
    this.tokenFilePath = path.join(__dirname, '../../.kite_token');
  }

  /**
   * Generate login URL for Kite Connect authentication
   * Step 1: Redirect user to this URL
   */
  getLoginURL() {
    if (!kiteConfig.apiKey) {
      throw new Error('KITE_API_KEY not configured');
    }

    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${kiteConfig.apiKey}`;
    
    logger.info('Kite login URL generated');
    return loginUrl;
  }

  /**
   * Generate access token from request token
   * Step 2: After user authorizes, Kite redirects with request_token
   * 
   * @param {string} requestToken - The request token from Kite redirect
   * @returns {Promise<Object>} Access token response
   */
  async generateAccessToken(requestToken) {
    try {
      if (!requestToken) {
        throw new Error('Request token is required');
      }

      if (!kiteConfig.apiKey || !kiteConfig.apiSecret) {
        throw new Error('KITE_API_KEY and KITE_API_SECRET must be configured');
      }

      logger.info('Generating access token from request token...');

      // Generate checksum: SHA256(api_key + request_token + api_secret)
      const checksum = crypto
        .createHash('sha256')
        .update(kiteConfig.apiKey + requestToken + kiteConfig.apiSecret)
        .digest('hex');

      logger.info('Checksum generated successfully');

      // Generate session (access token)
      const response = await this.kite.generateSession(requestToken, kiteConfig.apiSecret);

      if (!response || !response.access_token) {
        throw new Error('Failed to generate access token');
      }

      logger.info('✅ Access token generated successfully');
      logger.info(`User ID: ${response.user_id}`);
      logger.info(`Access Token: ${response.access_token.substring(0, 10)}...`);

      // Save access token to file for persistence
      await this.saveAccessToken({
        access_token: response.access_token,
        user_id: response.user_id,
        user_name: response.user_name,
        user_type: response.user_type,
        email: response.email,
        generated_at: new Date().toISOString(),
        checksum: checksum
      });

      // Set access token in Kite instance
      setAccessToken(response.access_token);

      return {
        success: true,
        data: {
          access_token: response.access_token,
          user_id: response.user_id,
          user_name: response.user_name,
          checksum: checksum
        }
      };

    } catch (error) {
      logger.error('Error generating access token:', error);
      throw error;
    }
  }

  /**
   * Save access token to file
   */
  async saveAccessToken(tokenData) {
    try {
      await fs.writeFile(
        this.tokenFilePath,
        JSON.stringify(tokenData, null, 2),
        'utf8'
      );
      logger.info('Access token saved to file');
    } catch (error) {
      logger.error('Error saving access token:', error);
    }
  }

  /**
   * Load saved access token from file
   */
  async loadSavedAccessToken() {
    try {
      const fileContent = await fs.readFile(this.tokenFilePath, 'utf8');
      const tokenData = JSON.parse(fileContent);
      
      if (tokenData.access_token) {
        // Set access token globally in kite instance
        setAccessToken(tokenData.access_token);
        logger.info('✅ Loaded saved access token');
        logger.info(`User: ${tokenData.user_name} (${tokenData.user_id})`);
        return tokenData;
      }
    } catch (error) {
      logger.warn('⚠️  No saved access token found');
      return null;
    }
  }

  /**
   * Validate if current access token is valid
   */
  async validateAccessToken() {
    try {
      const profile = await this.kite.getProfile();
      logger.info('✅ Access token is valid');
      logger.info(`Logged in as: ${profile.user_name} (${profile.user_id})`);
      return true;
    } catch (error) {
      logger.error('❌ Access token is invalid or expired');
      return false;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession() {
    try {
      await this.kite.invalidateAccessToken();
      
      // Delete saved token file
      try {
        await fs.unlink(this.tokenFilePath);
      } catch (err) {
        // File might not exist
      }
      
      logger.info('Session invalidated successfully');
      return true;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      throw error;
    }
  }

  /**
   * Get current session info
   */
  async getSessionInfo() {
    try {
      const profile = await this.kite.getProfile();
      const margins = await this.kite.getMargins();
      
      return {
        user_id: profile.user_id,
        user_name: profile.user_name,
        user_type: profile.user_type,
        email: profile.email,
        broker: profile.broker,
        available_cash: margins.equity.available.cash,
        exchanges: profile.exchanges
      };
    } catch (error) {
      logger.error('Error getting session info:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
