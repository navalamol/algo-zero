/**
 * In-Memory Storage Service for Demo Mode
 * Replaces MongoDB when database is not available
 */

const logger = require('../utils/logger');

class MemoryStore {
  constructor() {
    this.stocks = new Map();
    this.strategies = new Map();
    this.trades = new Map();
    this.watchlists = new Map();
    this.autoIncrementIds = {
      stocks: 1,
      strategies: 1,
      trades: 1,
      watchlists: 1
    };
    
    logger.info('📦 In-Memory Store initialized (No database required)');
  }

  // Generic CRUD operations
  
  /**
   * Create a new document
   */
  create(collection, data) {
    const id = this.autoIncrementIds[collection]++;
    const doc = {
      _id: id.toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this[collection].set(id.toString(), doc);
    return Promise.resolve(doc);
  }

  /**
   * Find documents
   */
  find(collection, query = {}) {
    const results = [];
    
    this[collection].forEach(doc => {
      if (this.matchesQuery(doc, query)) {
        results.push(doc);
      }
    });
    
    return Promise.resolve(results);
  }

  /**
   * Find one document
   */
  findOne(collection, query) {
    for (const [id, doc] of this[collection]) {
      if (this.matchesQuery(doc, query)) {
        return Promise.resolve(doc);
      }
    }
    return Promise.resolve(null);
  }

  /**
   * Find by ID
   */
  findById(collection, id) {
    return Promise.resolve(this[collection].get(id.toString()) || null);
  }

  /**
   * Update a document
   */
  update(collection, id, updates) {
    const doc = this[collection].get(id.toString());
    if (!doc) {
      return Promise.resolve(null);
    }
    
    const updated = {
      ...doc,
      ...updates,
      updatedAt: new Date()
    };
    
    this[collection].set(id.toString(), updated);
    return Promise.resolve(updated);
  }

  /**
   * Delete a document
   */
  delete(collection, id) {
    const deleted = this[collection].delete(id.toString());
    return Promise.resolve(deleted);
  }

  /**
   * Clear a collection
   */
  clear(collection) {
    this[collection].clear();
    return Promise.resolve(true);
  }

  /**
   * Count documents
   */
  count(collection, query = {}) {
    let count = 0;
    
    this[collection].forEach(doc => {
      if (this.matchesQuery(doc, query)) {
        count++;
      }
    });
    
    return Promise.resolve(count);
  }

  /**
   * Match document against query
   */
  matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) {
      return true;
    }
    
    for (const [key, value] of Object.entries(query)) {
      // Simple equality check
      if (doc[key] !== value) {
        // Check nested properties
        if (key.includes('.')) {
          const keys = key.split('.');
          let val = doc;
          for (const k of keys) {
            val = val?.[k];
          }
          if (val !== value) return false;
        } else {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      stocks: this.stocks.size,
      strategies: this.strategies.size,
      trades: this.trades.size,
      watchlists: this.watchlists.size
    };
  }

  /**
   * Clear all data
   */
  reset() {
    this.stocks.clear();
    this.strategies.clear();
    this.trades.clear();
    this.watchlists.clear();
    
    this.autoIncrementIds = {
      stocks: 1,
      strategies: 1,
      trades: 1,
      watchlists: 1
    };
    
    logger.info('Memory store reset');
  }
}

// Singleton instance
const memoryStore = new MemoryStore();

module.exports = memoryStore;
