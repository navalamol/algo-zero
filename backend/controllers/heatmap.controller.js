const heatmapService = require('../services/heatmap.service');
const logger = require('../utils/logger');

exports.getSectors = (req, res) => {
  try {
    res.json({ success: true, data: heatmapService.getSectorData() });
  } catch (error) {
    logger.error('heatmap.getSectors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    await heatmapService.update();
    res.json({ success: true, data: heatmapService.getSectorData() });
  } catch (error) {
    logger.error('heatmap.refresh:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
