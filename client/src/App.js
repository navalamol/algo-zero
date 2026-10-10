import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShowChart,
  TrendingUp,
  History,
  Settings as SettingsIcon
} from '@mui/icons-material';

import Dashboard from './components/Dashboard/Dashboard';
import StockFilter from './components/StockFilter/StockFilter';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import TradeHistory from './components/TradeHistory/TradeHistory';
import Settings from './components/Settings/Settings';
import socketService from './services/socket.service';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
  },
});

function App() {
  const [tickerStatus, setTickerStatus] = useState('disconnected');

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Listen for ticker connection status
    socketService.on('ticker:connected', () => {
      setTickerStatus('connected');
    });

    socketService.on('ticker:disconnected', () => {
      setTickerStatus('disconnected');
    });

    socketService.on('ticker:error', (data) => {
      console.error('Ticker error:', data);
      setTickerStatus('error');
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Stock Filter', icon: <ShowChart />, path: '/filter' },
    { text: 'Strategies', icon: <TrendingUp />, path: '/strategies' },
    { text: 'Trade History', icon: <History />, path: '/trades' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Kite Algo Trading Platform
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: tickerStatus === 'connected' ? 'success.main' : 'error.main'
                  }}
                />
                <Typography variant="body2">
                  {tickerStatus === 'connected' ? 'Live' : 'Disconnected'}
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>

          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton component={Link} to={item.path}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>

          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/filter" element={<StockFilter />} />
                <Route path="/strategies" element={<StrategyBuilder />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/trades" element={<TradeHistory />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
