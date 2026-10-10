import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart
} from '@mui/icons-material';
import apiService from '../../services/api.service';
import socketService from '../../services/socket.service';

function Dashboard() {
  const [stats, setStats] = useState({
    totalTrades: 0,
    completedTrades: 0,
    totalPnL: 0,
    successfulTrades: 0
  });
  const [positions, setPositions] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [signals, setSignals] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    loadDashboardData();

    // Listen for real-time signals
    socketService.on('strategy:signal', (signal) => {
      setSignals(prev => [signal, ...prev].slice(0, 10));
    });

    socketService.on('strategy:trade', (trade) => {
      loadDashboardData();
    });

    return () => {
      socketService.off('strategy:signal');
      socketService.off('strategy:trade');
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, positionsRes, tradesRes, strategiesRes, orderHistoryRes] = await Promise.all([
        apiService.getTradeStats(),
        apiService.getPositions().catch(() => ({ data: { data: { net: [] } } })),
        apiService.getTrades(),
        apiService.getStrategies(),
        apiService.getOrderHistory()
      ]);

      setOrderHistory(orderHistoryRes.data.data);
      setStats(statsRes.data.data);
      setPositions(positionsRes.data.data?.net || []);
      setRecentTrades(tradesRes.data.data.slice(0, 10));
      setActiveStrategies(strategiesRes.data.data.filter(s => s.isActive));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Trades"
            value={stats.totalTrades}
            icon={<ShowChart fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Strategies"
            value={activeStrategies.length}
            icon={<TrendingUp fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={stats.totalTrades > 0 
              ? `${Math.round((stats.successfulTrades / stats.totalTrades) * 100)}%`
              : '0%'}
            icon={<TrendingUp fontSize="large" />}
            color="success.main"
            subtitle={`${stats.successfulTrades} / ${stats.totalTrades}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total P&L"
            value={`₹${stats.totalPnL.toFixed(2)}`}
            icon={stats.totalPnL >= 0 ? <TrendingUp fontSize="large" /> : <TrendingDown fontSize="large" />}
            color={stats.totalPnL >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Signals
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Strategy</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>RSI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {signals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No signals yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    signals.map((signal, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{signal.stock.tradingSymbol}</TableCell>
                        <TableCell>{signal.strategyName}</TableCell>
                        <TableCell>₹{signal.signal.price?.toFixed(2)}</TableCell>
                        <TableCell>{signal.signal.rsi?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Open Positions
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Avg Price</TableCell>
                    <TableCell>P&L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No open positions
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((position, index) => (
                      <TableRow key={index}>
                        <TableCell>{position.tradingsymbol}</TableCell>
                        <TableCell>{position.quantity}</TableCell>
                        <TableCell>₹{position.average_price}</TableCell>
                        <TableCell>
                          <Chip
                            label={`₹${position.pnl.toFixed(2)}`}
                            color={position.pnl >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}> 
            <Typography variant="h6" gutterBottom>
              Order History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell> 
                    <TableCell>Symbol</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity</TableCell>   
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderHistory.map((order) => (
                      <TableRow key={order._id || order.order_id}>
                        <TableCell>
                          {new Date(order.order_timestamp || order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{order.tradingsymbol || order.tradingSymbol}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.transaction_type || order.transactionType}
                            color={(order.transaction_type || order.transactionType) === 'BUY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>₹{order.price?.toFixed(2) || order.average_price?.toFixed(2) || '-'}</TableCell>
                        <TableCell>
                          <Chip label={order.status} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Trades
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>P&L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No trades yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTrades.map((trade) => (
                      <TableRow key={trade._id}>
                        <TableCell>
                          {new Date(trade.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{trade.tradingSymbol}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.transactionType}
                            color={trade.transactionType === 'BUY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>₹{trade.averagePrice?.toFixed(2) || '-'}</TableCell>
                        <TableCell>
                          <Chip label={trade.status} size="small" />
                        </TableCell>
                        <TableCell>
                          {trade.pnl !== 0 && (
                            <Chip
                              label={`₹${trade.pnl.toFixed(2)}`}
                              color={trade.pnl >= 0 ? 'success' : 'error'}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
