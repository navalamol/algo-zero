const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @route   GET /api/auth/login-url
 * @desc    Get Kite Connect login URL
 * @access  Public
 */
router.get('/login-url', authController.getLoginURL);

/**
 * @route   POST /api/auth/generate-token
 * @desc    Generate access token from request token
 * @access  Public
 * @body    { request_token: string }
 */
router.post('/generate-token', authController.generateAccessToken);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate current access token
 * @access  Public
 */
router.get('/validate', authController.validateToken);

/**
 * @route   GET /api/auth/session
 * @desc    Get current session info
 * @access  Public
 */
router.get('/session', authController.getSessionInfo);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate session (logout)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/load-saved-token
 * @desc    Load saved access token from file
 * @access  Public
 */
router.get('/load-saved-token', authController.loadSavedToken);

module.exports = router;
