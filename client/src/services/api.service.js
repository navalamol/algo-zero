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
    return axios.get(`${API_BASE_URL}/strategies`);
  },

  getStrategy: (id) => {
    return axios.get(`${API_BASE_URL}/strategies/${id}`);
  },

  createStrategy: (data) => {
    return axios.post(`${API_BASE_URL}/strategies`, data);
  },

  updateStrategy: (id, data) => {
    return axios.put(`${API_BASE_URL}/strategies/${id}`, data);
  },

  toggleStrategy: (id) => {
    return axios.post(`${API_BASE_URL}/strategies/${id}/toggle`);
  },

  deleteStrategy: (id) => {
    return axios.delete(`${API_BASE_URL}/strategies/${id}`);
  },

  getActiveSignals: () => {
    return axios.get(`${API_BASE_URL}/strategies/signals/active`);
  },

  // Generic HTTP helpers for new feature components
  get: (path, params = {}) => axios.get(`${API_BASE_URL}${path}`, { params }),
  post: (path, data = {}) => axios.post(`${API_BASE_URL}${path}`, data),
  put: (path, data = {}) => axios.put(`${API_BASE_URL}${path}`, data),
  delete: (path) => axios.delete(`${API_BASE_URL}${path}`)
};

export default apiService;
