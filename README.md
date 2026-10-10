# Kite Algo Trading Platform

A comprehensive algorithmic trading platform built with Zerodha Kite Connect API, featuring real-time market data streaming, technical indicators, strategy engine, and automated trade execution.

## Features

### Core Features
- ✅ Real-time market data streaming via WebSocket
- ✅ Advanced stock filtering with multiple parameters (price, volume, RSI, buyers/sellers ratio)
- ✅ Technical indicators (RSI, Moving Averages, VWAP, Volume analysis)
- ✅ Strategy engine for automated trading signals
- ✅ Order management and execution
- ✅ Trade history and performance tracking
- ✅ Real-time monitoring dashboard

### Advanced Features
- 📊 Order book depth analysis (buyer/seller pressure)
- 🎯 Multi-timeframe analysis
- 📈 Support/Resistance zone detection
- 🔔 Real-time alerts and notifications
- 📱 Responsive UI for monitoring across devices
- 🔒 Risk management (max positions, order value limits)
- 📝 Comprehensive logging and error handling

## Technology Stack

### Backend
- **Node.js** + Express.js
- **Kite Connect API** for trading operations
- **WebSocket** for real-time data streaming
- **MongoDB** for data persistence
- **Socket.io** for client-server real-time communication

### Frontend
- **React** with hooks
- **Material-UI** for UI components
- **Chart.js / Lightweight Charts** for visualization
- **Socket.io-client** for real-time updates
- **Axios** for API calls

## Project Structure

```
kite-algo-trading/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── config/
│   │   ├── kite.config.js       # Kite Connect configuration
│   │   └── db.config.js         # Database configuration
│   ├── controllers/
│   │   ├── market.controller.js  # Market data endpoints
│   │   ├── order.controller.js   # Order management
│   │   └── strategy.controller.js # Strategy operations
│   ├── services/
│   │   ├── kite.service.js       # Kite API wrapper
│   │   ├── ticker.service.js     # WebSocket ticker management
│   │   ├── indicators.service.js # Technical indicators
│   │   ├── strategy.service.js   # Strategy engine
│   │   └── order.service.js      # Order execution
│   ├── models/
│   │   ├── Stock.model.js        # Stock schema
│   │   ├── Strategy.model.js     # Strategy schema
│   │   ├── Trade.model.js        # Trade history schema
│   │   └── Watchlist.model.js    # Watchlist schema
│   ├── routes/
│   │   ├── market.routes.js
│   │   ├── order.routes.js
│   │   └── strategy.routes.js
│   └── utils/
│       ├── logger.js             # Winston logger
│       └── helpers.js            # Helper functions
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── StockFilter/
│   │   │   ├── OrderBook/
│   │   │   ├── StrategyBuilder/
│   │   │   └── TradeHistory/
│   │   ├── services/
│   │   │   ├── api.service.js
│   │   │   └── socket.service.js
│   │   ├── hooks/
│   │   │   └── useStocks.js
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Zerodha Kite Connect API credentials

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AlgoTrading
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Kite API credentials
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode (backend + frontend)
   npm run dev:all

   # Or run separately
   npm run dev      # Backend only
   npm run client   # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Getting Kite Connect Credentials

1. Sign up for Kite Connect at https://kite.trade
2. Create an app to get API Key and API Secret
3. Generate access token using login flow
4. Add credentials to `.env` file

## Usage

### Basic Workflow

1. **Configure Watchlist**: Add stocks you want to monitor
2. **Set Filters**: Configure filter parameters (RSI range, volume threshold, etc.)
3. **Create Strategy**: Define buy/sell conditions
4. **Enable Auto-Trading**: Turn on automated execution (use with caution!)
5. **Monitor**: Watch real-time data and executed trades

### Example Strategies

**Breakout Strategy**
- Volume > 2x average volume
- Price breaking resistance with strong buying pressure
- RSI between 50-70

**Reversal Strategy**
- RSI oversold (<30) or overbought (>70)
- Divergence in price and volume
- Price near support/resistance zones

## API Documentation

### Market Data Endpoints

```
GET  /api/market/instruments       # Get all instruments
GET  /api/market/quote/:symbol     # Get quote for symbol
POST /api/market/watchlist         # Add to watchlist
GET  /api/market/watchlist         # Get watchlist
```

### Order Endpoints

```
POST /api/orders/place             # Place order
GET  /api/orders/history           # Order history
GET  /api/orders/positions         # Get positions
DELETE /api/orders/:orderId        # Cancel order
```

### Strategy Endpoints

```
POST /api/strategy/create          # Create strategy
GET  /api/strategy/list            # List strategies
PUT  /api/strategy/:id/toggle      # Enable/disable strategy
GET  /api/strategy/signals         # Get active signals
```

## Safety Features

- **Paper Trading Mode**: Test strategies without real money
- **Risk Limits**: Max positions, order value, risk per trade
- **Kill Switch**: Emergency stop for all trading
- **Position Limits**: Prevent over-exposure
- **Logging**: Complete audit trail

## Performance Optimization

- WebSocket connection pooling
- Data caching for frequently accessed instruments
- Efficient technical indicator calculation
- Database indexing for fast queries
- Rate limiting to respect Kite API limits

## Roadmap

- [ ] Backtesting engine
- [ ] More technical indicators (MACD, Bollinger Bands, etc.)
- [ ] Machine learning-based predictions
- [ ] Multi-account support
- [ ] Mobile app
- [ ] Options trading support
- [ ] Portfolio analytics

## Disclaimer

**IMPORTANT**: This software is for educational purposes. Trading in financial markets involves significant risk. The developers are not responsible for any financial losses incurred while using this software. Always test thoroughly in paper trading mode before using real money.

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
