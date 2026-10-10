const express = require('express');
const router = express.Router();
const radarController = require('../controllers/radar.controller');

router.get('/stocks', radarController.getStocks);
router.post('/config', radarController.updateConfig);
router.post('/symbols', radarController.setSymbols);

module.exports = router;
