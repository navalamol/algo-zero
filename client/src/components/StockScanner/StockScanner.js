import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  FilterList
} from '@mui/icons-material';
import socketService from '../../services/socket.service';
import apiService from '../../services/api.service';

export default function StockScanner() {
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanInfo, setLastScanInfo] = useState(null);

  useEffect(() => {
    apiService.get('/scanner/templates').then(res => {
      if (res.data.success) setTemplates(res.data.data);
    }).catch(() => {});

    socketService.on('scanner_results', (data) => {
      setResults(data.results || []);
      setLastScanInfo({ templateName: data.templateName, count: data.count, time: new Date() });
      setLoading(false);
    });

    return () => socketService.off('scanner_results');
  }, []);

  const runScan = async (templateId) => {
    setSelectedTemplate(templateId);
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.post('/scanner/run', { templateId });
      if (res.data.success) {
        setResults(res.data.data);
        setLastScanInfo({ templateName: templateId, count: res.data.count, time: new Date() });
      }
    } catch (e) {
      setError('Scan failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const templateColors = {
    momentum_burst: '#4caf50',
    oversold_reversal: '#2196f3',
    volume_breakout: '#ff9800',
    vwap_reclaim: '#9c27b0',
    weak_hands_exit: '#f44336'
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SearchIcon sx={{ color: '#2196f3', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Market Scanner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Screen stocks across multiple conditions in real time
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Scan Templates
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {templates.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card
              sx={{
                border: selectedTemplate === t.id ? `2px solid ${templateColors[t.id] || '#fff'}` : '1px solid transparent',
                cursor: 'pointer',
                '&:hover': { borderColor: templateColors[t.id] || '#fff' }
              }}
            >
              <CardActionArea onClick={() => runScan(t.id)} disabled={loading}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FilterList sx={{ color: templateColors[t.id] || '#fff', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {t.conditions.map((c, i) => (
                      <Chip
                        key={i}
                        label={`${c.indicator} ${c.operator} ${c.value}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Scanning…</Typography>
        </Box>
      )}

      {lastScanInfo && !loading && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${lastScanInfo.count} match${lastScanInfo.count !== 1 ? 'es' : ''}`}
            color={lastScanInfo.count > 0 ? 'success' : 'default'}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Scanned at {lastScanInfo.time.toLocaleTimeString()}
          </Typography>
          {selectedTemplate && (
            <Button size="small" onClick={() => runScan(selectedTemplate)}>
              Rescan
            </Button>
          )}
        </Box>
      )}

      {results.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Change %</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">RSI</TableCell>
                <TableCell align="right">VWAP (₹)</TableCell>
                <TableCell align="right">Buy/Sell Ratio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((stock) => (
                <TableRow key={stock.symbol} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stock.change >= 0
                        ? <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                        : <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{stock.symbol}</Typography>
                        <Typography variant="caption" color="text.secondary">{stock.exchange}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    ₹{stock.price.toLocaleString('en-IN')}
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
                    {(stock.volume || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">
                    {stock.rsi !== null ? (
                      <Chip
                        label={stock.rsi}
                        size="small"
                        sx={{
                          bgcolor: stock.rsi > 70 ? 'error.dark' : stock.rsi < 30 ? 'success.dark' : 'grey.700',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {stock.vwap ? `₹${stock.vwap.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {stock.buyerRatio ? (
                      <Typography
                        variant="body2"
                        sx={{ color: stock.buyerRatio >= 1 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}
                      >
                        {stock.buyerRatio.toFixed(2)}x
                      </Typography>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && results.length === 0 && selectedTemplate && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No stocks matched this scan at the moment. Try again in a few seconds.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
