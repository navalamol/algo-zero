const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');

/**
 * Get Kite login URL
 * Step 1: Frontend redirects user to this URL
 */
exports.getLoginURL = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        message: 'Demo mode active - No authentication required',
        loginUrl: null
      });
    }

    const loginUrl = authService.getLoginURL();
    
    res.json({
      success: true,
      loginUrl: loginUrl,
      instructions: 'Redirect user to this URL to authorize the app'
    });
  } catch (error) {
    logger.error('Error in getLoginURL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate access token from request token
 * Step 2: Frontend sends request_token after user authorizes
 * 
 * Body: { request_token: "..." }
 */
exports.generateAccessToken = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        message: 'Demo mode active - Using mock authentication',
        data: {
          access_token: 'demo_token',
          user_id: 'DEMO123',
          user_name: 'Demo User'
        }
      });
    }

    const { request_token } = req.body;

    if (!request_token) {
      return res.status(400).json({
        success: false,
        error: 'request_token is required'
      });
    }

    const result = await authService.generateAccessToken(request_token);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in generateAccessToken:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate current access token
 */
exports.validateToken = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        valid: true,
        message: 'Demo mode active'
      });
    }

    const isValid = await authService.validateAccessToken();
    
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    logger.error('Error in validateToken:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: error.message
    });
  }
};

/**
 * Get session info
 */
exports.getSessionInfo = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: {
          user_id: 'DEMO123',
          user_name: 'Demo User',
          user_type: 'investor',
          email: 'demo@example.com',
          broker: 'ZERODHA',
          available_cash: 100000,
          exchanges: ['NSE', 'BSE']
        }
      });
    }

    const sessionInfo = await authService.getSessionInfo();
    
    res.json({
      success: true,
      data: sessionInfo
    });
  } catch (error) {
    logger.error('Error in getSessionInfo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Logout (invalidate session)
 */
exports.logout = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        message: 'Demo mode - No session to invalidate'
      });
    }

    await authService.invalidateSession();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Error in logout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Load saved token
 */
exports.loadSavedToken = async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        message: 'Demo mode - No saved token needed'
      });
    }

    const tokenData = await authService.loadSavedAccessToken();
    
    if (tokenData) {
      res.json({
        success: true,
        message: 'Token loaded successfully',
        data: {
          user_id: tokenData.user_id,
          user_name: tokenData.user_name,
          generated_at: tokenData.generated_at
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No saved token found'
      });
    }
  } catch (error) {
    logger.error('Error in loadSavedToken:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
