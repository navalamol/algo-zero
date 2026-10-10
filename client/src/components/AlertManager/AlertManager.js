import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  NotificationsActive,
  Delete,
  Add,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import socketService from '../../services/socket.service';
import apiService from '../../services/api.service';

const ALERT_TYPES = [
  { value: 'price_above', label: 'Price crosses above ₹' },
  { value: 'price_below', label: 'Price drops below ₹' },
  { value: 'volume_spike', label: 'Volume exceeds (shares)' },
  { value: 'buyer_imbalance', label: 'Buyer imbalance exceeds %' }
];

export default function AlertManager() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    symbol: '',
    exchange: 'NSE',
    type: 'price_above',
    threshold: '',
    name: ''
  });
  const [toast, setToast] = useState(null);

  const loadAlerts = () => {
    apiService.get('/alerts').then(res => {
      if (res.data.success) setAlerts(res.data.data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadAlerts();

    socketService.on('alert_triggered', (data) => {
      setToast({ severity: 'success', message: `🔔 ${data.alert.name} triggered @ ₹${data.quote.last_price}` });
      setAlerts(prev =>
        prev.map(a => a.id === data.alert.id ? { ...a, status: 'TRIGGERED', triggeredAt: new Date() } : a)
      );
    });

    return () => socketService.off('alert_triggered');
  }, []);

  const handleCreate = async () => {
    if (!form.symbol || !form.threshold) return;
    try {
      const res = await apiService.post('/alerts', form);
      if (res.data.success) {
        setAlerts(prev => [...prev, res.data.data]);
        setForm({ symbol: '', exchange: 'NSE', type: 'price_above', threshold: '', name: '' });
        setToast({ severity: 'info', message: 'Alert created' });
      }
    } catch (e) {
      setToast({ severity: 'error', message: e.response?.data?.error || 'Failed to create alert' });
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await apiService.delete(`/alerts/${alertId}`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleReactivate = async (alertId) => {
    try {
      const res = await apiService.put(`/alerts/${alertId}`, { status: 'ACTIVE', triggeredAt: null });
      if (res.data.success) {
        setAlerts(prev => prev.map(a => a.id === alertId ? res.data.data : a));
      }
    } catch (e) {
      console.error('Reactivate failed', e);
    }
  };

  const statusChip = (alert) => {
    if (alert.status === 'TRIGGERED') {
      return <Chip icon={<CheckCircle />} label="Triggered" size="small" color="success" />;
    }
    if (alert.status === 'DISABLED') {
      return <Chip icon={<Cancel />} label="Disabled" size="small" />;
    }
    return <Chip label="Active" size="small" color="primary" />;
  };

  const typeLabel = (type) => ALERT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <NotificationsActive sx={{ color: '#ff9800', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">Alert Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Set price, volume, or order-flow alerts — fires via browser and Telegram
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Create New Alert
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <TextField
                label="Symbol"
                value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                size="small"
                fullWidth
                placeholder="e.g. SBIN"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Exchange</InputLabel>
                <Select
                  value={form.exchange}
                  label="Exchange"
                  onChange={e => setForm({ ...form, exchange: e.target.value })}
                >
                  <MenuItem value="NSE">NSE</MenuItem>
                  <MenuItem value="BSE">BSE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={form.type}
                  label="Alert Type"
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  {ALERT_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Threshold"
                type="number"
                value={form.threshold}
                onChange={e => setForm({ ...form, threshold: e.target.value })}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Name (optional)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={!form.symbol || !form.threshold}
                startIcon={<Add />}
                fullWidth
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {alerts.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell align="right">Threshold</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Triggered At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {alert.name || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${alert.exchange}:${alert.symbol}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{typeLabel(alert.type)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {alert.type === 'buyer_imbalance'
                        ? `${alert.threshold}%`
                        : alert.type === 'volume_spike'
                        ? alert.threshold.toLocaleString('en-IN')
                        : `₹${alert.threshold}`}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(alert)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {alert.triggeredAt
                        ? new Date(alert.triggeredAt).toLocaleTimeString('en-IN')
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {alert.status === 'TRIGGERED' && (
                        <Tooltip title="Reactivate">
                          <IconButton size="small" onClick={() => handleReactivate(alert.id)}>
                            <NotificationsActive fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(alert.id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <NotificationsActive sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No alerts set. Create one above to get notified when a stock hits your target.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast && (
          <Alert severity={toast.severity} onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}
