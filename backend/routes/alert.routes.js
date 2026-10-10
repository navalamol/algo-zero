const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

router.get('/', alertController.list);
router.post('/', alertController.create);
router.put('/:alertId', alertController.update);
router.delete('/:alertId', alertController.remove);

module.exports = router;
