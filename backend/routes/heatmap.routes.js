const express = require('express');
const router = express.Router();
const heatmapController = require('../controllers/heatmap.controller');

router.get('/sectors', heatmapController.getSectors);
router.post('/refresh', heatmapController.refresh);

module.exports = router;
