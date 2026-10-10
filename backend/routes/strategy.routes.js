const express = require('express');
const router = express.Router();
const strategyController = require('../controllers/strategy.controller');

// Strategy CRUD routes
router.get('/', strategyController.getStrategies);
router.get('/:id', strategyController.getStrategyById);
router.post('/', strategyController.createStrategy);
router.put('/:id', strategyController.updateStrategy);
router.delete('/:id', strategyController.deleteStrategy);

// Strategy actions
router.post('/:id/toggle', strategyController.toggleStrategy);
router.get('/signals/active', strategyController.getActiveSignals);

module.exports = router;
