const logger = require('../utils/logger');

exports.getTemplates = (req, res) => {
  try {
    const scannerService = req.app.locals.scannerService;
    res.json({ success: true, data: scannerService.getTemplates() });
  } catch (error) {
    logger.error('scanner.getTemplates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.runScan = async (req, res) => {
  try {
    const scannerService = req.app.locals.scannerService;
    const { templateId, conditions } = req.body;

    if (!templateId && !conditions) {
      return res.status(400).json({ success: false, error: 'templateId or conditions required' });
    }

    const results = await scannerService.runScan(templateId, conditions || null);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error('scanner.runScan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResults = (req, res) => {
  try {
    const scannerService = req.app.locals.scannerService;
    res.json({ success: true, data: scannerService.getResults() });
  } catch (error) {
    logger.error('scanner.getResults:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setSymbols = (req, res) => {
  try {
    const scannerService = req.app.locals.scannerService;
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'symbols must be an array' });
    }
    scannerService.setSymbols(symbols);
    res.json({ success: true, count: symbols.length });
  } catch (error) {
    logger.error('scanner.setSymbols:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
