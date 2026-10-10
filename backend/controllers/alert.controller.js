const logger = require('../utils/logger');

exports.list = (req, res) => {
  try {
    const alertService = req.app.locals.alertService;
    const { profileId } = req.query;
    res.json({ success: true, data: alertService.list(profileId || null) });
  } catch (error) {
    logger.error('alert.list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = (req, res) => {
  try {
    const alertService = req.app.locals.alertService;
    const { symbol, exchange, type, threshold, name, profileId, chatId } = req.body;

    if (!symbol || !type || threshold === undefined) {
      return res.status(400).json({ success: false, error: 'symbol, type, and threshold are required' });
    }

    const alert = alertService.create({ symbol, exchange, type, threshold, name, profileId, chatId });
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error('alert.create:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.update = (req, res) => {
  try {
    const alertService = req.app.locals.alertService;
    const { alertId } = req.params;
    const updated = alertService.update(alertId, req.body);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('alert.update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.remove = (req, res) => {
  try {
    const alertService = req.app.locals.alertService;
    const { alertId } = req.params;
    const deleted = alertService.delete(alertId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    logger.error('alert.remove:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
