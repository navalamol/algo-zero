const logger = require('../utils/logger');

/**
 * Mock Service for testing without Kite API credentials
 * Provides realistic demo data for development and testing
 */
class MockService {
  constructor() {
    this.mockInstruments = [
      {
        instrument_token: 738561,
        exchange_token: 2885,
        tradingsymbol: 'SBIN',
        name: 'STATE BANK OF INDIA',
        last_price: 625.50,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 408065,
        exchange_token: 1594,
        tradingsymbol: 'INFY',
        name: 'INFOSYS LIMITED',
        last_price: 1456.75,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 2953217,
        exchange_token: 11536,
        tradingsymbol: 'TCS',
        name: 'TATA CONSULTANCY SERVICES',
        last_price: 3780.30,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 81153,
        exchange_token: 317,
        tradingsymbol: 'RELIANCE',
        name: 'RELIANCE INDUSTRIES LIMITED',
        last_price: 2456.80,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 54273,
        exchange_token: 212,
        tradingsymbol: 'HDFCBANK',
        name: 'HDFC BANK LIMITED',
        last_price: 1687.25,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 1270529,
        exchange_token: 4963,
        tradingsymbol: 'ICICIBANK',
        name: 'ICICI BANK LIMITED',
        last_price: 1089.90,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      },
      {
        instrument_token: 341249,
        exchange_token: 1333,
        tradingsymbol: 'WIPRO',
        name: 'WIPRO LIMITED',
        last_price: 445.60,
        expiry: '',
        strike: 0,
        tick_size: 0.05,
        lot_size: 1,
        instrument_type: 'EQ',
        segment: 'NSE',
        exchange: 'NSE'
      }
    ];

    this.prices = new Map();
    this.initializePrices();
  }

  /**
   * Initialize prices from mock instruments
   */
  initializePrices() {
    this.mockInstruments.forEach(instrument => {
      this.prices.set(instrument.instrument_token, instrument.last_price);
    });
  }

  /**
   * Get all instruments
   */
  getAllInstruments(exchange = null) {
    logger.info('[MOCK MODE] Fetching instruments');
    if (exchange) {
      return this.mockInstruments.filter(i => i.exchange === exchange);
    }
    return this.mockInstruments;
  }

  /**
   * Search instruments
   */
  searchInstruments(query, exchange = 'NSE') {
    logger.info(`[MOCK MODE] Searching instruments: ${query}`);
    const searchQuery = query.toUpperCase();
    return this.mockInstruments.filter(instrument => 
      instrument.exchange === exchange &&
      (instrument.tradingsymbol.includes(searchQuery) || 
       instrument.name.toUpperCase().includes(searchQuery))
    );
  }

  /**
   * Get quote for instruments
   */
  getQuote(instruments) {
    logger.info('[MOCK MODE] Fetching quote');
    const result = {};
    
    instruments.forEach(inst => {
      const [exchange, symbol] = inst.split(':');
      const instrument = this.mockInstruments.find(
        i => i.exchange === exchange && i.tradingsymbol === symbol
      );
      
      if (instrument) {
        const price = this.prices.get(instrument.instrument_token) || instrument.last_price;
        const change = (Math.random() - 0.5) * 10;
        
        result[inst] = {
          instrument_token: instrument.instrument_token,
          timestamp: new Date(),
          last_price: price,
          last_quantity: Math.floor(Math.random() * 100) + 1,
          last_trade_time: new Date(),
          average_price: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
          buy_quantity: Math.floor(Math.random() * 50000),
          sell_quantity: Math.floor(Math.random() * 50000),
          ohlc: {
            open: price - Math.random() * 20,
            high: price + Math.random() * 15,
            low: price - Math.random() * 15,
            close: price
          },
          net_change: change,
          oi: 0,
          oi_day_high: 0,
          oi_day_low: 0,
          depth: this.generateDepth(price)
        };
      }
    });
    
    return result;
  }

  /**
   * Generate mock order book depth
   */
  generateDepth(price) {
    const depth = { buy: [], sell: [] };
    
    // Generate 5 buy levels
    for (let i = 0; i < 5; i++) {
      depth.buy.push({
        price: price - (i + 1) * 0.5,
        quantity: Math.floor(Math.random() * 5000) + 100,
        orders: Math.floor(Math.random() * 50) + 5
      });
    }
    
    // Generate 5 sell levels
    for (let i = 0; i < 5; i++) {
      depth.sell.push({
        price: price + (i + 1) * 0.5,
        quantity: Math.floor(Math.random() * 5000) + 100,
        orders: Math.floor(Math.random() * 50) + 5
      });
    }
    
    return depth;
  }

  /**
   * Generate mock tick data
   */
  generateTick(instrumentToken) {
    const instrument = this.mockInstruments.find(i => i.instrument_token === instrumentToken);
    if (!instrument) return null;

    const currentPrice = this.prices.get(instrumentToken) || instrument.last_price;
    // Random price movement (+/- 0.5%)
    const newPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    this.prices.set(instrumentToken, newPrice);

    const depth = this.generateDepth(newPrice);

    return {
      instrument_token: instrumentToken,
      mode: 'full',
      tradable: true,
      last_price: newPrice,
      last_quantity: Math.floor(Math.random() * 100) + 1,
      average_price: newPrice,
      volume_traded: Math.floor(Math.random() * 1000000) + 100000,
      total_buy_quantity: depth.buy.reduce((sum, item) => sum + item.quantity, 0),
      total_sell_quantity: depth.sell.reduce((sum, item) => sum + item.quantity, 0),
      ohlc: {
        open: newPrice * (1 - Math.random() * 0.02),
        high: newPrice * (1 + Math.random() * 0.015),
        low: newPrice * (1 - Math.random() * 0.015),
        close: newPrice
      },
      change: (Math.random() - 0.5) * 2,
      last_trade_time: new Date(),
      exchange_timestamp: new Date(),
      oi: 0,
      oi_day_high: 0,
      oi_day_low: 0,
      depth: depth
    };
  }

  /**
   * Get mock positions
   */
  getPositions() {
    logger.info('[MOCK MODE] Fetching positions');
    return {
      net: [
        {
          tradingsymbol: 'SBIN',
          exchange: 'NSE',
          instrument_token: 738561,
          product: 'CNC',
          quantity: 10,
          overnight_quantity: 10,
          multiplier: 1,
          average_price: 620.00,
          close_price: 625.50,
          last_price: 625.50,
          value: 6205.00,
          pnl: 55.00,
          m2m: 55.00,
          unrealised: 55.00,
          realised: 0,
          buy_quantity: 10,
          buy_price: 620.00,
          buy_value: 6200.00,
          buy_m2m: 6200.00,
          sell_quantity: 0,
          sell_price: 0,
          sell_value: 0,
          sell_m2m: 0,
          day_buy_quantity: 0,
          day_buy_price: 0,
          day_buy_value: 0,
          day_sell_quantity: 0,
          day_sell_price: 0,
          day_sell_value: 0
        }
      ],
      day: []
    };
  }

  /**
   * Get mock holdings
   */
  getHoldings() {
    logger.info('[MOCK MODE] Fetching holdings');
    return [
      {
        tradingsymbol: 'INFY',
        exchange: 'NSE',
        instrument_token: 408065,
        isin: 'INE009A01021',
        product: 'CNC',
        price: 0,
        quantity: 5,
        t1_quantity: 0,
        realised_quantity: 5,
        authorised_quantity: 0,
        authorised_date: new Date(),
        opening_quantity: 5,
        collateral_quantity: 0,
        collateral_type: '',
        discrepancy: false,
        average_price: 1420.00,
        last_price: 1456.75,
        close_price: 1450.00,
        pnl: 183.75,
        day_change: 6.75,
        day_change_percentage: 0.47
      }
    ];
  }

  /**
   * Mock order placement
   */
  placeOrder(variety, params) {
    logger.info('[MOCK MODE] Placing order:', params);
    
    // Simulate order ID
    const orderId = `MOCK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Simulate success
    return {
      order_id: orderId
    };
  }

  /**
   * Get mock order history
   */
  getOrderHistory() {
    logger.info('[MOCK MODE] Fetching order history');
    return [
      {
        order_id: 'MOCK170873145001',
        exchange_order_id: 'DEMO-12345',
        parent_order_id: null,
        status: 'COMPLETE',
        status_message: null,
        order_timestamp: new Date(Date.now() - 3600000),
        exchange_update_timestamp: new Date(Date.now() - 3600000),
        exchange_timestamp: new Date(Date.now() - 3600000),
        variety: 'regular',
        exchange: 'NSE',
        tradingsymbol: 'SBIN',
        instrument_token: 738561,
        order_type: 'MARKET',
        transaction_type: 'BUY',
        validity: 'DAY',
        product: 'CNC',
        quantity: 10,
        disclosed_quantity: 0,
        price: 0,
        trigger_price: 0,
        average_price: 620.00,
        filled_quantity: 10,
        pending_quantity: 0,
        cancelled_quantity: 0
      }
    ];
  }

  /**
   * Get mock profile
   */
  getProfile() {
    logger.info('[MOCK MODE] Fetching profile');
    return {
      user_id: 'DEMO123',
      user_type: 'individual',
      email: 'demo@example.com',
      user_name: 'Demo User',
      user_shortname: 'Demo',
      broker: 'ZERODHA',
      exchanges: ['NSE', 'BSE', 'NFO', 'CDS', 'BFO', 'MCX'],
      products: ['CNC', 'NRML', 'MIS'],
      order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
      avatar_url: null
    };
  }

  /**
   * Get mock margins
   */
  getMargins(segment = null) {
    logger.info('[MOCK MODE] Fetching margins');
    const margins = {
      equity: {
        enabled: true,
        net: 100000.00,
        available: {
          adhoc_margin: 0,
          cash: 100000.00,
          opening_balance: 100000.00,
          live_balance: 100000.00,
          collateral: 0,
          intraday_payin: 0
        },
        utilised: {
          debits: 0,
          exposure: 0,
          m2m_realised: 0,
          m2m_unrealised: 0,
          option_premium: 0,
          payout: 0,
          span: 0,
          holding_sales: 0,
          turnover: 0,
          liquid_collateral: 0,
          stock_collateral: 0
        }
      }
    };

    return segment ? margins[segment] : margins;
  }
}

module.exports = new MockService();
