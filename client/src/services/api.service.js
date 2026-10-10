import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = {
  // Market endpoints
  getInstruments: (exchange = null) => {
    return axios.get(`${API_BASE_URL}/market/instruments`, {
      params: { exchange }
    });
  },

  searchInstruments: (query, exchange = 'NSE') => {
    return axios.get(`${API_BASE_URL}/market/instruments/search`, {
      params: { query, exchange }
    });
  },

  getQuote: (instruments) => {
    return axios.get(`${API_BASE_URL}/market/quote`, {
      params: { instruments }
    });
  },

  getWatchlist: () => {
    return axios.get(`${API_BASE_URL}/market/watchlist`);
  },

  createWatchlist: (data) => {
    return axios.post(`${API_BASE_URL}/market/watchlist`, data);
  },

  addToWatchlist: (watchlistId, instrument) => {
    return axios.post(`${API_BASE_URL}/market/watchlist/${watchlistId}/add`, instrument);
  },

  removeFromWatchlist: (watchlistId, instrumentToken) => {
    return axios.delete(`${API_BASE_URL}/market/watchlist/${watchlistId}/${instrumentToken}`);
  },

  getFilteredStocks: (filters) => {
    return axios.post(`${API_BASE_URL}/market/stocks/filter`, filters);
  },

  getStockDetails: (instrumentToken) => {
    return axios.get(`${API_BASE_URL}/market/stocks/${instrumentToken}`);
  },

  // Order endpoints
  placeOrder: (orderData) => {
    return axios.post(`${API_BASE_URL}/orders/place`, orderData);
  },

  getOrderHistory: () => {
    return axios.get(`${API_BASE_URL}/orders/history`);
  },

  getPositions: () => {
    return axios.get(`${API_BASE_URL}/orders/positions/list`);
  },

  getHoldings: () => {
    return axios.get(`${API_BASE_URL}/orders/holdings/list`);
  },

  getTrades: () => {
    return axios.get(`${API_BASE_URL}/orders/trades/list`);
  },

  getTradeStats: () => {
    return axios.get(`${API_BASE_URL}/orders/trades/stats`);
  },

  cancelOrder: (orderId) => {
    return axios.delete(`${API_BASE_URL}/orders/${orderId}`);
  },

  exitPosition: (data) => {
    return axios.post(`${API_BASE_URL}/orders/positions/exit`, data);
  },

  // Strategy endpoints
  getStrategies: () => {
    return axios.get(`${API_BASE_URL}/strategy`);
  },

  getStrategy: (id) => {
    return axios.get(`${API_BASE_URL}/strategy/${id}`);
  },

  createStrategy: (data) => {
    return axios.post(`${API_BASE_URL}/strategy`, data);
  },

  updateStrategy: (id, data) => {
    return axios.put(`${API_BASE_URL}/strategy/${id}`, data);
  },

  toggleStrategy: (id) => {
    return axios.post(`${API_BASE_URL}/strategy/${id}/toggle`);
  },

  deleteStrategy: (id) => {
    return axios.delete(`${API_BASE_URL}/strategy/${id}`);
  },

  getActiveSignals: () => {
    return axios.get(`${API_BASE_URL}/strategy/signals/active`);
  }
};

export default apiService;
