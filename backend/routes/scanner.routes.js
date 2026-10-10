const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scanner.controller');

router.get('/templates', scannerController.getTemplates);
router.post('/run', scannerController.runScan);
router.get('/results', scannerController.getResults);
router.post('/symbols', scannerController.setSymbols);

module.exports = router;
