import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse
} from '@mui/material';
import { GridView, Refresh } from '@mui/icons-material';
import apiService from '../../services/api.service';

const changeColor = (change) => {
  if (change > 2) return '#1b5e20';
  if (change > 1) return '#2e7d32';
  if (change > 0) return '#388e3c';
  if (change > -1) return '#c62828';
  if (change > -2) return '#b71c1c';
  return '#7f0000';
};

const textColor = (change) => Math.abs(change) > 0.5 ? '#fff' : '#ccc';

export default function SectorHeatmap() {
  const [sectors, setSectors] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiService.get('/heatmap/sectors');
      if (res.data.success) {
        setSectors(res.data.data.sectors || {});
        setLastUpdate(res.data.data.lastUpdate ? new Date(res.data.data.lastUpdate) : new Date());
      }
    } catch (e) {
      console.error('Heatmap fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await apiService.post('/heatmap/refresh');
      if (res.data.success) {
        setSectors(res.data.data.sectors || {});
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('Heatmap refresh error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const sectorList = Object.values(sectors);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <GridView sx={{ color: '#ff9800', fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Sector Heatmap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intraday sector performance — click a sector to see constituent stocks
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={refresh}
          disabled={loading}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {sectorList.map((sector) => (
          <Grid item xs={6} sm={4} md={3} key={sector.name}>
            <Card
              onClick={() => setExpanded(expanded === sector.name ? null : sector.name)}
              sx={{
                bgcolor: changeColor(sector.change),
                cursor: 'pointer',
                minHeight: 100,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.02)' },
                border: expanded === sector.name ? '2px solid #fff' : '2px solid transparent'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: textColor(sector.change) }}>
                  {sector.name}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: textColor(sector.change) }}
                >
                  {sector.change >= 0 ? '+' : ''}{sector.change}%
                </Typography>
                <Typography variant="caption" sx={{ color: textColor(sector.change), opacity: 0.8 }}>
                  {sector.stockCount} stocks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {expanded && sectors[expanded] && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {expanded} — Constituent Stocks
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sectors[expanded].stocks.map((stock) => (
                <Tooltip
                  key={stock.symbol}
                  title={`Vol: ${(stock.volume || 0).toLocaleString('en-IN')}`}
                >
                  <Chip
                    label={`${stock.symbol}  ${stock.change >= 0 ? '+' : ''}${stock.change}%`}
                    size="small"
                    sx={{
                      bgcolor: changeColor(stock.change),
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {sectorList.length === 0 && !loading && (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <GridView sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              Loading sector data… This may take a moment in demo mode.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
