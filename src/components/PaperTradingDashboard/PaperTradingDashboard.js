import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PaperTradingDashboard = ({ profileName }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileName) {
      loadPaperTradingData();
    }
  }, [profileName]);

  const loadPaperTradingData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load profile to get paper trading data
      const response = await axios.get(`${API_BASE_URL}/api/profiles/${profileName}`);
      if (response.data.success) {
        const config = response.data.profile;
        
        // Mock portfolio data (in production, this would come from paper-trading service)
        setPortfolio({
          capital: config.trading.capital,
          usedCapital: config.trading.capital * 0.3, // Mock: 30% deployed
          availableCapital: config.trading.capital * 0.7,
          currentValue: config.trading.capital * 1.05, // Mock: 5% gain
          totalPnL: config.trading.capital * 0.05,
          totalPnLPercent: 5.0,
          positions: 2,
          completedTrades: 8
        });

        // Load trades from profile (mock for now)
        const mockTrades = [
          {
            id: 1,
            symbol: 'RELIANCE',
            type: 'BUY',
            quantity: 10,
            entryPrice: 2450.50,
            currentPrice: 2475.30,
            pnl: 248.00,
            pnlPercent: 1.01,
            status: 'OPEN',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: 2,
            symbol: 'TCS',
            type: 'BUY',
            quantity: 5,
            entryPrice: 3650.00,
            exitPrice: 3685.50,
            pnl: 177.50,
            pnlPercent: 0.97,
            status: 'CLOSED',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
          }
        ];
        setTrades(mockTrades);
      }
    } catch (err) {
      console.error('Failed to load paper trading data:', err);
      setError('Failed to load paper trading data');
    } finally {
      setLoading(false);
    }
  };

  if (!profileName) {
    return (
      <Alert severity="info">
        Select a profile to view paper trading dashboard
      </Alert>
    );
  }

  if (loading && !portfolio) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton color="inherit" size="small" onClick={loadPaperTradingData}>
          <Refresh />
        </IconButton>
      }>
        {error}
      </Alert>
    );
  }

  if (!portfolio) {
    return null;
  }

  const capitalUsedPercent = (portfolio.usedCapital / portfolio.capital) * 100;
  const isProfitable = portfolio.totalPnL >= 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          📝 Paper Trading Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={loadPaperTradingData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Portfolio Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalance color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Capital
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                ₹{portfolio.capital.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available: ₹{portfolio.availableCapital.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShowChart color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Current Value
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                ₹{portfolio.currentValue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Deployed: {capitalUsedPercent.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={capitalUsedPercent} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {isProfitable ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
                <Typography variant="subtitle2" color="text.secondary">
                  Total P&L
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                color={isProfitable ? 'success.main' : 'error.main'}
              >
                {isProfitable ? '+' : ''}₹{portfolio.totalPnL.toLocaleString()}
              </Typography>
              <Typography 
                variant="caption" 
                color={isProfitable ? 'success.main' : 'error.main'}
              >
                {isProfitable ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Trading Activity
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Open Positions:</Typography>
                <Chip label={portfolio.positions} size="small" color="primary" />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Completed:</Typography>
                <Chip label={portfolio.completedTrades} size="small" color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trades Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Recent Trades
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Entry</TableCell>
                  <TableCell align="right">Current/Exit</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {trade.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={trade.type} 
                        size="small" 
                        color={trade.type === 'BUY' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">{trade.quantity}</TableCell>
                    <TableCell align="right">₹{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ₹{(trade.currentPrice || trade.exitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={trade.pnl >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                        <br />
                        <Typography variant="caption" component="span">
                          ({trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
                        </Typography>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={trade.status} 
                        size="small" 
                        color={trade.status === 'OPEN' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {trade.timestamp.toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="body2">
          ⚠️ This is paper trading with simulated money. No real trades are placed.
        </Typography>
      </Alert>
    </Box>
  );
};

export default PaperTradingDashboard;
