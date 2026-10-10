const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Order routes
router.post('/place', orderController.placeOrder);
router.put('/:orderId', orderController.modifyOrder);
router.delete('/:orderId', orderController.cancelOrder);
router.get('/history', orderController.getOrderHistory);
router.get('/:orderId', orderController.getOrderDetails);

// Position and holdings routes
router.get('/positions/list', orderController.getPositions);
router.get('/holdings/list', orderController.getHoldings);
router.post('/positions/exit', orderController.exitPosition);

// Trade routes (from database)
router.get('/trades/list', orderController.getTrades);
router.get('/trades/stats', orderController.getTradeStats);

module.exports = router;
