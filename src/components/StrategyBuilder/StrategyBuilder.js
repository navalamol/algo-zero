import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import apiService from '../../services/api.service';

function StrategyBuilder() {
  const [strategies, setStrategies] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM',
    conditions: {
      priceMin: '',
      priceMax: '',
      rsiMin: '',
      rsiMax: '',
      volumeMin: '',
      volumeChangeMin: '',
      buyerSellerRatioMin: '',
      buyerSellerRatioMax: '',
      priceAboveVWAP: false,
      priceAboveSMA20: false,
      priceAboveSMA50: false
    },
    tradeConfig: {
      transactionType: 'BUY',
      quantity: 1,
      orderType: 'MARKET',
      product: 'CNC',
      stopLoss: '',
      stopLossType: 'PERCENTAGE',
      takeProfit: '',
      takeProfitType: 'PERCENTAGE'
    },
    instruments: [],
    isActive: false
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await apiService.getStrategies();
      setStrategies(response.data.data);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const handleOpenDialog = (strategy = null) => {
    if (strategy) {
      setEditingStrategy(strategy);
      setFormData(strategy);
    } else {
      setEditingStrategy(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStrategy(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'CUSTOM',
      conditions: {
        priceMin: '',
        priceMax: '',
        rsiMin: '',
        rsiMax: '',
        volumeMin: '',
        volumeChangeMin: '',
        buyerSellerRatioMin: '',
        buyerSellerRatioMax: '',
        priceAboveVWAP: false,
        priceAboveSMA20: false,
        priceAboveSMA50: false
      },
      tradeConfig: {
        transactionType: 'BUY',
        quantity: 1,
        orderType: 'MARKET',
        product: 'CNC',
        stopLoss: '',
        stopLossType: 'PERCENTAGE',
        takeProfit: '',
        takeProfitType: 'PERCENTAGE'
      },
      instruments: [],
      isActive: false
    });
  };

  const handleSearchInstruments = async (query) => {
    if (query.length < 2) {
      setInstruments([]);
      return;
    }

    try {
      const response = await apiService.searchInstruments(query);
      setInstruments(response.data.data);
    } catch (error) {
      console.error('Error searching instruments:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editingStrategy) {
        await apiService.updateStrategy(editingStrategy._id, formData);
      } else {
        await apiService.createStrategy(formData);
      }
      
      loadStrategies();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const handleToggle = async (strategyId) => {
    try {
      await apiService.toggleStrategy(strategyId);
      loadStrategies();
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  const handleDelete = async (strategyId) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await apiService.deleteStrategy(strategyId);
        loadStrategies();
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Strategy Builder
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Strategy
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Instruments</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signals</TableCell>
                <TableCell>Trades</TableCell>
                <TableCell>Success Rate</TableCell>
                <TableCell>Total P&L</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {strategies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No strategies created yet
                  </TableCell>
                </TableRow>
              ) : (
                strategies.map((strategy) => (
                  <TableRow key={strategy._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {strategy.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {strategy.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{strategy.type}</TableCell>
                    <TableCell>{strategy.instruments.length}</TableCell>
                    <TableCell>
                      <Chip
                        label={strategy.isActive ? 'Active' : 'Inactive'}
                        color={strategy.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{strategy.stats?.totalSignals || 0}</TableCell>
                    <TableCell>{strategy.stats?.totalTrades || 0}</TableCell>
                    <TableCell>
                      {strategy.stats?.totalTrades > 0
                        ? `${Math.round((strategy.stats.successfulTrades / strategy.stats.totalTrades) * 100)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`₹${strategy.stats?.totalProfit?.toFixed(2) || 0}`}
                        color={strategy.stats?.totalProfit >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggle(strategy._id)}
                        color={strategy.isActive ? 'warning' : 'success'}
                      >
                        {strategy.isActive ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(strategy)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(strategy._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Strategy Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Strategy Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="BREAKOUT">Breakout</MenuItem>
                  <MenuItem value="REVERSAL">Reversal</MenuItem>
                  <MenuItem value="MOMENTUM">Momentum</MenuItem>
                  <MenuItem value="MEAN_REVERSION">Mean Reversion</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={formData.tradeConfig.transactionType}
                  label="Transaction Type"
                  onChange={(e) => setFormData({
                    ...formData,
                    tradeConfig: { ...formData.tradeConfig, transactionType: e.target.value }
                  })}
                >
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Conditions
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={formData.conditions.priceMin}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, priceMin: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={formData.conditions.priceMax}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, priceMax: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Min Volume"
                type="number"
                value={formData.conditions.volumeMin}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, volumeMin: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Min RSI"
                type="number"
                value={formData.conditions.rsiMin}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, rsiMin: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Max RSI"
                type="number"
                value={formData.conditions.rsiMax}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, rsiMax: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                label="Min B/S Ratio"
                type="number"
                value={formData.conditions.buyerSellerRatioMin}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { ...formData.conditions, buyerSellerRatioMin: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.tradeConfig.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  tradeConfig: { ...formData.tradeConfig, quantity: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.tradeConfig.product}
                  label="Product"
                  onChange={(e) => setFormData({
                    ...formData,
                    tradeConfig: { ...formData.tradeConfig, product: e.target.value }
                  })}
                >
                  <MenuItem value="CNC">CNC</MenuItem>
                  <MenuItem value="MIS">MIS</MenuItem>
                  <MenuItem value="NRML">NRML</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={instruments}
                getOptionLabel={(option) => `${option.tradingsymbol} - ${option.name || ''}`}
                value={formData.instruments}
                onInputChange={(e, value) => {
                  setSearchQuery(value);
                  handleSearchInstruments(value);
                }}
                onChange={(e, value) => setFormData({ ...formData, instruments: value })}
                renderInput={(params) => (
                  <TextField {...params} label="Select Instruments" />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Activate Strategy"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingStrategy ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StrategyBuilder;
