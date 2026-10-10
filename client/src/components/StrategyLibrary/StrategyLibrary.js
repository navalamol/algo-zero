import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  LibraryBooks,
  TrendingUp,
  ExpandMore,
  CheckCircle,
  Info,
  Star,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getRiskColor = (risk) => {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    default:
      return 'default';
  }
};

const StrategyLibrary = ({ profileName, onStrategyAdopted }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [adopting, setAdopting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles/library/strategies`);
      if (response.data.success) {
        setStrategies(response.data.strategies);
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
      setError('Failed to load strategy library');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptStrategy = async () => {
    if (!profileName) {
      setError('Please select a profile first');
      return;
    }

    if (!selectedStrategy) return;

    setAdopting(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/profiles/${profileName}/strategies/adopt`,
        { strategyName: selectedStrategy.name }
      );

      if (response.data.success) {
        setSuccess(`Strategy "${selectedStrategy.name}" adopted successfully!`);
        setSelectedStrategy(null);
        if (onStrategyAdopted) {
          onStrategyAdopted(selectedStrategy);
        }
      }
    } catch (err) {
      console.error('Failed to adopt strategy:', err);
      setError(err.response?.data?.error || 'Failed to adopt strategy');
    } finally {
      setAdopting(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LibraryBooks color="primary" fontSize="large" />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Strategy Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pre-built strategies with backtested results
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {strategies.map((strategy, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {strategy.name}
                  </Typography>
                  <Chip 
                    label={strategy.risk} 
                    size="small" 
                    color={getRiskColor(strategy.risk)}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {strategy.description}
                </Typography>

                {/* Performance Metrics */}
                <Box mb={2}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          {strategy.backtest.winRate}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Avg Return
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {strategy.backtest.avgReturn > 0 ? '+' : ''}{strategy.backtest.avgReturn}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Max Drawdown
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {strategy.backtest.maxDrawdown}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Trades
                        </Typography>
                        <Typography variant="body2">
                          {strategy.backtest.totalTrades}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Quick Tips */}
                {strategy.tips && strategy.tips.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Info fontSize="small" color="info" />
                        <Typography variant="caption">Tips & Best Practices</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {strategy.tips.map((tip, i) => (
                          <ListItem key={i}>
                            <ListItemText 
                              primary={tip}
                              primaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => setSelectedStrategy(strategy)}
                  sx={{ mt: 2 }}
                  disabled={!profileName}
                >
                  Adopt Strategy
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Adoption Confirmation Dialog */}
      <Dialog 
        open={Boolean(selectedStrategy)} 
        onClose={() => !adopting && setSelectedStrategy(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Adopt Strategy: {selectedStrategy?.name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will add the strategy to your profile: <strong>{profileName}</strong>
          </Alert>

          <Typography variant="body2" paragraph>
            {selectedStrategy?.description}
          </Typography>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Strategy Configuration:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Risk Level" 
                  secondary={selectedStrategy?.risk}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Stop Loss" 
                  secondary={`${selectedStrategy?.config?.stopLoss}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Take Profit" 
                  secondary={`${selectedStrategy?.config?.takeProfit}%`}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Position Size" 
                  secondary={`${selectedStrategy?.config?.positionSize || 1} lot(s)`}
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedStrategy(null)} disabled={adopting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdoptStrategy} 
            variant="contained" 
            disabled={adopting}
            startIcon={adopting ? <LinearProgress size={20} /> : <CheckCircle />}
          >
            {adopting ? 'Adopting...' : 'Confirm Adoption'}
          </Button>
        </DialogActions>
      </Dialog>

      {!profileName && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please select a profile to adopt strategies
        </Alert>
      )}
    </Box>
  );
};

export default StrategyLibrary;
