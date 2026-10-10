# API Reference

## Base URL
```
http://localhost:5000/api
```

## Market Endpoints

### Get All Instruments
```http
GET /market/instruments?exchange=NSE
```

**Response:**
```json
{
  "success": true,
  "count": 2000,
  "data": [
    {
      "instrument_token": 738561,
      "tradingsymbol": "SBIN",
      "name": "State Bank of India",
      "exchange": "NSE"
    }
  ]
}
```

### Search Instruments
```http
GET /market/instruments/search?query=INFY&exchange=NSE
```

### Get Quote
```http
GET /market/quote?instruments=NSE:INFY
```

### Get Filtered Stocks
```http
POST /market/stocks/filter

Body:
{
  "priceMin": 100,
  "priceMax": 1000,
  "rsiMin": 30,
  "rsiMax": 70,
  "volumeMin": 100000,
  "buyerSellerRatioMin": 1.5
}
```

### Watchlist Management
```http
GET /market/watchlist
POST /market/watchlist
POST /market/watchlist/:watchlistId/add
DELETE /market/watchlist/:watchlistId/:instrumentToken
```

## Order Endpoints

### Place Order
```http
POST /orders/place

Body:
{
  "tradingsymbol": "INFY",
  "exchange": "NSE",
  "transaction_type": "BUY",
  "quantity": 1,
  "order_type": "MARKET",
  "product": "CNC"
}
```

### Get Order History
```http
GET /orders/history
```

### Get Positions
```http
GET /orders/positions/list
```

### Get Holdings
```http
GET /orders/holdings/list
```

### Cancel Order
```http
DELETE /orders/:orderId
```

### Get Trades
```http
GET /orders/trades/list?status=COMPLETE
```

### Get Trade Statistics
```http
GET /orders/trades/stats
```

## Strategy Endpoints

### Get All Strategies
```http
GET /strategy?isActive=true
```

### Create Strategy
```http
POST /strategy

Body:
{
  "name": "RSI Reversal",
  "description": "Buy on oversold RSI",
  "type": "REVERSAL",
  "conditions": {
    "rsiMin": 0,
    "rsiMax": 30,
    "volumeChangeMin": 50,
    "buyerSellerRatioMin": 1.5
  },
  "tradeConfig": {
    "transactionType": "BUY",
    "quantity": 10,
    "orderType": "MARKET",
    "product": "CNC"
  },
  "instruments": [
    {
      "instrumentToken": 738561,
      "tradingSymbol": "SBIN",
      "exchange": "NSE"
    }
  ],
  "isActive": true
}
```

### Toggle Strategy
```http
POST /strategy/:id/toggle
```

### Update Strategy
```http
PUT /strategy/:id

Body: { ...updated fields }
```

### Delete Strategy
```http
DELETE /strategy/:id
```

### Get Active Signals
```http
GET /strategy/signals/active
```

## WebSocket Events

### Client to Server

#### Subscribe to Instruments
```javascript
socket.emit('subscribe', [738561, 779521]);
```

#### Unsubscribe from Instruments
```javascript
socket.emit('unsubscribe', [738561]);
```

### Server to Client

#### Ticker Connected
```javascript
socket.on('ticker:connected', (data) => {
  console.log('Ticker connected:', data);
});
```

#### Ticker Disconnected
```javascript
socket.on('ticker:disconnected', (data) => {
  console.log('Ticker disconnected:', data);
});
```

#### Tick Data
```javascript
socket.on('tick:data', (tick) => {
  console.log('Tick received:', tick);
  // {
  //   instrument_token: 738561,
  //   last_price: 550.50,
  //   volume_traded: 1000000,
  //   ohlc: { open, high, low, close },
  //   depth: { buy: [], sell: [] }
  // }
});
```

#### Strategy Signal
```javascript
socket.on('strategy:signal', (signal) => {
  console.log('Strategy signal:', signal);
  // {
  //   strategyId: "...",
  //   strategyName: "RSI Reversal",
  //   stock: { tradingSymbol: "SBIN", ... },
  //   signal: { price, rsi, volume, ... }
  // }
});
```

#### Strategy Trade Executed
```javascript
socket.on('strategy:trade', (trade) => {
  console.log('Trade executed:', trade);
});
```

#### Order Update
```javascript
socket.on('order:update', (order) => {
  console.log('Order update:', order);
});
```

## Technical Indicators

The platform calculates the following indicators automatically:

### RSI (Relative Strength Index)
- Period: 14
- Range: 0-100
- Oversold: < 30
- Overbought: > 70

### Moving Averages
- SMA20: Simple Moving Average (20 periods)
- SMA50: Simple Moving Average (50 periods)
- EMA12: Exponential Moving Average (12 periods)
- EMA26: Exponential Moving Average (26 periods)

### VWAP (Volume Weighted Average Price)
- Calculated from daily data
- Used to identify fair value

### Buyer/Seller Ratio
- Calculated from order book depth
- > 1: More buyers than sellers
- < 1: More sellers than buyers
- > 3: "Only Buyer" state
- < 0.33: "Only Seller" state

### Volume Analysis
- Current volume vs average volume
- Percentage change calculation
- High volume breakout detection

## Strategy Conditions

### Available Conditions

```javascript
{
  conditions: {
    // Price conditions
    priceMin: 100,
    priceMax: 1000,
    priceChangeMin: -5,      // % change
    priceChangeMax: 10,      // % change
    
    // Volume conditions
    volumeMin: 100000,
    volumeChangeMin: 50,     // % increase
    
    // RSI conditions
    rsiMin: 30,
    rsiMax: 70,
    
    // Buyer/Seller ratio
    buyerSellerRatioMin: 1.5,
    buyerSellerRatioMax: 5.0,
    
    // VWAP conditions
    priceAboveVWAP: true,
    priceBelowVWAP: false,
    
    // Moving average conditions
    priceAboveSMA20: true,
    priceAboveSMA50: true,
    goldenCross: false,      // SMA20 crosses above SMA50
    deathCross: false,       // SMA20 crosses below SMA50
    
    // Custom condition (JavaScript)
    customCondition: "return stock.lastPrice > 500 && metrics.rsi < 40;"
  }
}
```

## Database Models

### Stock Model
```javascript
{
  instrumentToken: Number,
  tradingSymbol: String,
  exchange: String,
  lastPrice: Number,
  volume: Number,
  ohlc: { open, high, low, close },
  depth: { buy: [], sell: [] },
  metrics: {
    rsi: Number,
    sma20: Number,
    sma50: Number,
    vwap: Number,
    buyerSellerRatio: Number
  },
  history: [{ timestamp, price, volume }]
}
```

### Strategy Model
```javascript
{
  name: String,
  description: String,
  type: String,  // BREAKOUT, REVERSAL, MOMENTUM, etc.
  conditions: { ... },
  tradeConfig: { ... },
  instruments: [],
  isActive: Boolean,
  stats: {
    totalSignals: Number,
    totalTrades: Number,
    successfulTrades: Number,
    totalProfit: Number
  }
}
```

### Trade Model
```javascript
{
  orderId: String,
  tradingSymbol: String,
  transactionType: String,  // BUY/SELL
  quantity: Number,
  status: String,  // PENDING,OPEN,COMPLETE,CANCELLED,REJECTED
  entryPrice: Number,
  exitPrice: Number,
  pnl: Number,
  pnlPercentage: Number,
  signalData: { ... }
}
```

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limiting

- The platform implements automatic rate limiting
- Kite API: 3 requests/second
- Internal rate limiter handles throttling
- WebSocket used for real-time data (no polling)

## Environment Variables

```env
# Required
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
KITE_ACCESS_TOKEN=your_access_token

# Optional
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kite-algo-trading
ENABLE_AUTO_TRADING=false
MAX_POSITIONS=5
MAX_ORDER_VALUE=50000
RISK_PER_TRADE=0.02
LOG_LEVEL=info
```

## Health Check

```http
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2024-02-21T10:30:00.000Z",
  "tickerConnected": true
}
```
