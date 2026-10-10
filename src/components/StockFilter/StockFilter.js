import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import apiService from '../../services/api.service';
import socketService from '../../services/socket.service';

function StockFilter() {
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    rsiMin: '',
    rsiMax: '',
    volumeMin: '',
    volumeChangeMin: '',
    buyerSellerRatioMin: '',
    limit: 50
  });

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [liveStocks, setLiveStocks] = useState({});

  useEffect(() => {
    // Listen for live tick updates
    socketService.on('tick:data', (tick) => {
      setLiveStocks(prev => ({
        ...prev,
        [tick.instrument_token]: tick
      }));

      // Update stocks list if the stock is in our filtered results
      setStocks(prev => prev.map(stock => 
        stock.instrumentToken === tick.instrument_token
          ? { ...stock, lastPrice: tick.last_price, volume: tick.volume_traded }
          : stock
      ));
    });

    return () => {
      socketService.off('tick:data');
    };
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filterData = {
        priceMin: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
        rsiMin: filters.rsiMin ? parseFloat(filters.rsiMin) : undefined,
        rsiMax: filters.rsiMax ? parseFloat(filters.rsiMax) : undefined,
        volumeMin: filters.volumeMin ? parseInt(filters.volumeMin) : undefined,
        volumeChangeMin: filters.volumeChangeMin ? parseFloat(filters.volumeChangeMin) : undefined,
        buyerSellerRatioMin: filters.buyerSellerRatioMin ? parseFloat(filters.buyerSellerRatioMin) : undefined,
        limit: filters.limit
      };

      const response = await apiService.getFilteredStocks(filterData);
      setStocks(response.data.data);

      // Subscribe to live updates for these stocks
      const instrumentTokens = response.data.data.map(stock => stock.instrumentToken);
      if (instrumentTokens.length > 0) {
        socketService.subscribe(instrumentTokens);
      }
    } catch (error) {
      console.error('Error filtering stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstrumentSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiService.searchInstruments(query);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error searching instruments:', error);
    }
  };

  const handleReset = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      rsiMin: '',
      rsiMax: '',
      volumeMin: '',
      volumeChangeMin: '',
      buyerSellerRatioMin: '',
      limit: 50
    });
    setStocks([]);
  };

  const getChangeColor = (value) => {
    if (!value) return 'default';
    return value >= 0 ? 'success' : 'error';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stock Filter
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Criteria
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={searchResults}
              getOptionLabel={(option) => `${option.tradingsymbol} - ${option.name || ''}`}
              onInputChange={(e, value) => {
                setSearchQuery(value);
                handleInstrumentSearch(value);
              }}
              onChange={(e, value) => setSelectedStock(value)}
              renderInput={(params) => (
                <TextField {...params} label="Search Instrument" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              value={filters.priceMin}
              onChange={(e) => handleFilterChange('priceMin', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              value={filters.priceMax}
              onChange={(e) => handleFilterChange('priceMax', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min RSI"
              type="number"
              value={filters.rsiMin}
              onChange={(e) => handleFilterChange('rsiMin', e.target.value)}
              helperText="0-100"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Max RSI"
              type="number"
              value={filters.rsiMax}
              onChange={(e) => handleFilterChange('rsiMax', e.target.value)}
              helperText="0-100"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Volume"
              type="number"
              value={filters.volumeMin}
              onChange={(e) => handleFilterChange('volumeMin', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Volume Change %"
              type="number"
              value={filters.volumeChangeMin}
              onChange={(e) => handleFilterChange('volumeChangeMin', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Min Buyer/Seller Ratio"
              type="number"
              value={filters.buyerSellerRatioMin}
              onChange={(e) => handleFilterChange('buyerSellerRatioMin', e.target.value)}
              helperText=">1 = more buyers"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Result Limit"
              type="number"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filtered Stocks ({stocks.length})
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Change %</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>RSI</TableCell>
                <TableCell>VWAP</TableCell>
                <TableCell>B/S Ratio</TableCell>
                <TableCell>State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {loading ? 'Loading...' : 'No stocks found. Apply filters and search.'}
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock) => {
                  const liveTick = liveStocks[stock.instrumentToken];
                  const currentPrice = liveTick?.last_price || stock.lastPrice;
                  
                  return (
                    <TableRow key={stock.instrumentToken}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {stock.tradingSymbol}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {stock.exchange}
                        </Typography>
                      </TableCell>
                      <TableCell>₹{currentPrice?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${stock.metrics?.percentageChange?.toFixed(2) || 0}%`}
                          color={getChangeColor(stock.metrics?.percentageChange)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {stock.volume?.toLocaleString()}
                        {stock.metrics?.volumeChange && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            +{stock.metrics.volumeChange.toFixed(1)}%
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {stock.metrics?.rsi?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell>
                        ₹{stock.metrics?.vwap?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell>
                        {stock.metrics?.buyerSellerRatio?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell>
                        {stock.metrics?.buyerSellerRatio > 3 && (
                          <Chip label="Only Buyer" color="success" size="small" />
                        )}
                        {stock.metrics?.buyerSellerRatio < 0.33 && (
                          <Chip label="Only Seller" color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default StockFilter;
