import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import apiService from '../../services/api.service';

function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({});
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadTrades();
    loadStats();
  }, [filterStatus]);

  const loadTrades = async () => {
    try {
      const response = await apiService.getTrades();
      let filteredTrades = response.data.data;
      
      if (filterStatus) {
        filteredTrades = filteredTrades.filter(t => t.status === filterStatus);
      }
      
      setTrades(filteredTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getTradeStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'warning',
      'OPEN': 'info',
      'COMPLETE': 'success',
      'CANCELLED': 'default',
      'REJECTED': 'error',
      'FAILED': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trade History
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Trades
              </Typography>
              <Typography variant="h4">
                {stats.totalTrades || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Trades
              </Typography>
              <Typography variant="h4">
                {stats.completedTrades || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.totalTrades > 0
                  ? `${Math.round((stats.successfulTrades / stats.totalTrades) * 100)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total P&L
                  </Typography>
                  <Typography
                    variant="h4"
                    color={stats.totalPnL >= 0 ? 'success.main' : 'error.main'}
                  >
                    ₹{stats.totalPnL?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                {stats.totalPnL >= 0 ? (
                  <TrendingUp fontSize="large" color="success" />
                ) : (
                  <TrendingDown fontSize="large" color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            All Trades
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter by Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="COMPLETE">Complete</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Entry Price</TableCell>
                <TableCell>Exit Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>P&L</TableCell>
                <TableCell>P&L %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TableRow key={trade._id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {trade.tradingSymbol}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {trade.exchange}
                      </Typography>
                    </TableCell>
                    <TableCell>{trade.strategyName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={trade.transactionType}
                        color={trade.transactionType === 'BUY' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>
                      {trade.entryPrice ? `₹${trade.entryPrice.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.status}
                        color={getStatusColor(trade.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {trade.pnl !== 0 && (
                        <Typography
                          variant="body2"
                          color={trade.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          ₹{trade.pnl.toFixed(2)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {trade.pnlPercentage !== 0 && (
                        <Chip
                          label={`${trade.pnlPercentage.toFixed(2)}%`}
                          color={trade.pnlPercentage >= 0 ? 'success' : 'error'}
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
    </Box>
  );
}

export default TradeHistory;
