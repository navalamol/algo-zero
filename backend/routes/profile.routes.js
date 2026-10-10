// Profile Routes

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// Profile management
router.post('/', profileController.createProfile);
router.get('/', profileController.listProfiles);
router.get('/:name', profileController.loadProfile);
router.put('/:name', profileController.updateProfile);
router.delete('/:name', profileController.deleteProfile);

// Strategies
router.get('/:name/strategies', profileController.getStrategies);
router.post('/:name/strategies', profileController.addStrategy);
router.post('/:name/strategies/adopt', profileController.adoptStrategy);

// Default strategies library
router.get('/library/strategies', profileController.getDefaultStrategies);

// Trades
router.get('/:name/trades', profileController.getTrades);

// Statistics
router.get('/:name/statistics', profileController.getStatistics);

// Import/Export
router.get('/:name/export', profileController.exportProfile);
router.post('/:name/import', profileController.importProfile);

// Telegram
router.post('/telegram/test', profileController.testTelegram);

module.exports = router;
