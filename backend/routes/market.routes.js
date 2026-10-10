const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');

// Instruments routes
router.get('/instruments', marketController.getInstruments);
router.get('/instruments/search', marketController.searchInstruments);
router.get('/quote', marketController.getQuote);

// Watchlist routes
router.get('/watchlist', marketController.getWatchlist);
router.post('/watchlist', marketController.createWatchlist);
router.post('/watchlist/:watchlistId/add', marketController.addToWatchlist);
router.delete('/watchlist/:watchlistId/:instrumentToken', marketController.removeFromWatchlist);

// Stock filtering
router.post('/stocks/filter', marketController.getFilteredStocks);
router.get('/stocks/:instrumentToken', marketController.getStockDetails);

module.exports = router;
