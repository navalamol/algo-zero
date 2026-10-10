import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Slider,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { TrendingUp, Radar as RadarIcon, Settings } from '@mui/icons-material';
import socketService from '../../services/socket.service';
import apiService from '../../services/api.service';

export default function RadarDashboard() {
  const [radarStocks, setRadarStocks] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [threshold, setThreshold] = useState(30);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    socketService.on('radar_update', (stocks) => {
      setRadarStocks(stocks);
      setLastUpdate(new Date());
    });

    // Load current state on mount
    apiService.get('/radar/stocks').then(res => {
      if (res.data.success) setRadarStocks(res.data.data);
    }).catch(() => {});

    return () => socketService.off('radar_update');
  }, []);

  const applyConfig = async () => {
    try {
      await apiService.post('/radar/config', { imbalanceThreshold: threshold / 100 });
    } catch (e) {
      console.error('Config update failed', e);
    }
  };

  const pressureColor = (score) => {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <RadarIcon sx={{ color: '#4caf50', fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Order Flow Radar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stocks where buyers overwhelm sellers — auto-populated every 2s
          </Typography>
        </Box>
        <Button
          startIcon={<Settings />}
          onClick={() => setShowConfig(!showConfig)}
          variant="outlined"
          size="small"
        >
          Config
        </Button>
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            Updated {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {showConfig && (
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Buyer Imbalance Threshold: {threshold}%
            </Typography>
            <Slider
              value={threshold}
              onChange={(_, val) => setThreshold(val)}
              min={10}
              max={70}
              marks={[{ value: 20, label: '20%' }, { value: 30, label: '30%' }, { value: 50, label: '50%' }]}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" size="small" onClick={applyConfig}>
              Apply
            </Button>
          </CardContent>
        </Card>
      )}

      {radarStocks.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <RadarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Scanning for buyer-dominated stocks…
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stocks will appear here when buyer imbalance exceeds {threshold}%
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Change %</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">Buy Qty</TableCell>
                <TableCell align="right">Sell Qty</TableCell>
                <TableCell>Imbalance</TableCell>
                <TableCell>Pressure Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {radarStocks.map((stock) => (
                <TableRow key={stock.symbol} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {stock.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stock.exchange}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₹{stock.price.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${stock.change >= 0 ? '+' : ''}${stock.change}%`}
                      size="small"
                      sx={{
                        bgcolor: stock.change >= 0 ? 'success.dark' : 'error.dark',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {(stock.volume || 0).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      {stock.buyQty.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: '#f44336' }}>
                      {stock.sellQty.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (stock.imbalancePct + 100) / 2)}
                        sx={{
                          width: 80,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.800',
                          '& .MuiLinearProgress-bar': { bgcolor: '#4caf50', borderRadius: 4 }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#4caf50' }}>
                        +{stock.imbalancePct}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Composite score: 60% imbalance + 40% price momentum">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: pressureColor(stock.score),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {stock.score}
                        </Box>
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
