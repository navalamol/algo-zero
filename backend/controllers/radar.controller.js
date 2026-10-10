const logger = require('../utils/logger');

exports.getStocks = (req, res) => {
  try {
    const radarService = req.app.locals.radarService;
    res.json({ success: true, data: radarService.getRadarStocks() });
  } catch (error) {
    logger.error('radar.getStocks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateConfig = (req, res) => {
  try {
    const radarService = req.app.locals.radarService;
    const { imbalanceThreshold, scanIntervalMs, maxEntries } = req.body;
    radarService.updateConfig({ imbalanceThreshold, scanIntervalMs, maxEntries });
    res.json({ success: true, config: radarService.getConfig() });
  } catch (error) {
    logger.error('radar.updateConfig:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setSymbols = (req, res) => {
  try {
    const radarService = req.app.locals.radarService;
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'symbols must be an array' });
    }
    radarService.setSymbols(symbols);
    res.json({ success: true, count: symbols.length });
  } catch (error) {
    logger.error('radar.setSymbols:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
