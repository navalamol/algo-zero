require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db.config');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const orderRoutes = require('./routes/order.routes');
const strategyRoutes = require('./routes/strategy.routes');
const profileRoutes = require('./routes/profile.routes');

// Import services
const TickerService = require('./services/ticker.service');
const StrategyService = require('./services/strategy.service');
const authService = require('./services/auth.service');
const vixService = require('./services/vix.service');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for auth.html
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"],
      },
    },
  })
);
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Connect to database
connectDB();

// Load saved Kite access token on startup (if available)
const initializeAuth = async () => {
  const { isDemoMode } = require('./config/kite.config');
  
  if (!isDemoMode()) {
    logger.info('🔑 Attempting to load saved access token...');
    const tokenData = await authService.loadSavedAccessToken();
    
    if (tokenData) {
      logger.info('✅ Access token loaded successfully');
      // Validate the token
      const isValid = await authService.validateAccessToken().catch(() => false);
      if (!isValid) {
        logger.error('❌ Saved token is invalid or expired');
        logger.info('💡 Please authenticate at: http://localhost:' + (process.env.PORT || 5000) + '/auth.html');
      }
    } else {
      logger.warn('⚠️  No saved access token found');
      logger.info('💡 Please authenticate at: http://localhost:' + (process.env.PORT || 5000) + '/auth.html');
    }
  }
};

// Initialize auth after a short delay to ensure server is ready
setTimeout(initializeAuth, 1000);

// Initialize services
const tickerService = new TickerService(io);
const strategyService = new StrategyService(io);

// Make services available to routes
app.locals.tickerService = tickerService;
app.locals.strategyService = strategyService;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/profiles', profileRoutes);app.use('/api/profiles', profileRoutes);
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tickerConnected: tickerService.isConnected()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', (instruments) => {
    logger.info(`Client ${socket.id} subscribing to instruments:`, instruments);
    tickerService.addSubscription(socket.id, instruments);
  });
  
  socket.on('unsubscribe', (instruments) => {
    logger.info(`Client ${socket.id} unsubscribing from instruments:`, instruments);
    tickerService.removeSubscription(socket.id, instruments);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    tickerService.removeClient(socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    tickerService.disconnect();
    strategyService.stop();
    vixService.stop();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  
  try {
    // Initialize ticker service
    tickerService.connect();
    
    // Start strategy engine
    strategyService.start();
    
    // Start VIX monitoring
    vixService.start();
    
    logger.info('✅ All services started successfully');
    logger.info('📈 India VIX monitoring active');
    logger.info('👥 Profile system ready');
    logger.info('📝 Paper trading available');
    logger.info('📱 Telegram notifications configured');
    
  } catch (error) {
    logger.error('Error starting services:', error);
  }
});

module.exports = { app, server, io };
