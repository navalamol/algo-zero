import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  Alert,
  Divider,
  Link,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Telegram,
  Save,
  HelpOutline,
  CheckCircle,
  Send,
  Notifications,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TelegramSettings = ({ profileName, initialConfig }) => {
  const [config, setConfig] = useState({
    enabled: false,
    botToken: '',
    chatId: '',
    onTradeExecuted: true,
    onStopLoss: true,
    onTarget: true,
    dailySummary: true
  });
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialConfig?.trading?.notifications?.telegram) {
      setConfig(initialConfig.trading.notifications.telegram);
    }
  }, [initialConfig]);

  const handleSave = async () => {
    if (!profileName) {
      setError('Please select a profile first');
      return;
    }

    if (config.enabled && (!config.botToken || !config.chatId)) {
      setError('Bot token and Chat ID are required when Telegram is enabled');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/profiles/${profileName}/config`,
        {
          trading: {
            notifications: {
              telegram: config
            }
          }
        }
      );

      if (response.data.success) {
        setSuccess('Telegram settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.error || 'Failed to save Telegram settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!config.botToken || !config.chatId) {
      setError('Please  configure bot token and chat ID first');
      return;
    }

    try {
      // Send test message via backend
      await axios.post(`${API_BASE_URL}/api/profiles/${profileName}/test-telegram`, {
        botToken: config.botToken,
        chatId: config.chatId
      });
      setSuccess('Test message sent! Check your Telegram.');
    } catch (err) {
      setError('Failed to send test message. Check your credentials.');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Telegram color="primary" fontSize="large" />
          <Box flexGrow={1}>
            <Typography variant="h6" fontWeight="bold">
              Telegram Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get real-time trade alerts on your phone
            </Typography>
          </Box>
          <IconButton onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Help Section */}
        <Collapse in={showHelp}>
          <Alert severity="info" icon={<HelpOutline />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              How to set up Telegram Bot:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>1.</ListItemIcon>
                <ListItemText 
                  primary="Open Telegram and search for @BotFather"
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>2.</ListItemIcon>
                <ListItemText 
                  primary="Send /newbot and follow instructions to create a bot"
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>3.</ListItemIcon>
                <ListItemText 
                  primary="Copy the Bot Token (looks like: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>4.</ListItemIcon>
                <ListItemText 
                  primary={
                    <>
                      Search for{' '}
                      <Link href="https://t.me/userinfobot" target="_blank" rel="noopener">
                        @userinfobot
                      </Link>
                      {' '}on Telegram and send /start to get your Chat ID
                    </>
                  }
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 32 }}>5.</ListItemIcon>
                <ListItemText 
                  primary="Don't forget to send /start to your bot to activate it!"
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            </List>
          </Alert>
        </Collapse>

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

        {/* Enable/Disable Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">Enable Telegram Notifications</Typography>
              <Typography variant="caption" color="text.secondary">
                Receive trade alerts on your phone
              </Typography>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <Divider sx={{ mb: 2 }} />

        {/* Configuration Fields */}
        <Box sx={{ opacity: config.enabled ? 1 : 0.5 }}>
          <TextField
            fullWidth
            label="Bot Token"
            value={config.botToken}
            onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
            disabled={!config.enabled}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            type="password"
            sx={{ mb: 2 }}
            helperText="Get from @BotFather on Telegram"
          />

          <TextField
            fullWidth
            label="Chat ID"
            value={config.chatId}
            onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
            disabled={!config.enabled}
            placeholder="123456789"
            sx={{ mb: 2 }}
            helperText="Get from @userinfobot on Telegram"
          />

          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={handleTestMessage}
            disabled={!config.enabled || !config.botToken || !config.chatId}
            sx={{ mb: 3 }}
          >
            Send Test Message
          </Button>

          <Divider sx={{ mb: 2 }} />

          {/* Notification Preferences */}
          <Typography variant="subtitle2" gutterBottom>
            Notification Preferences:
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={config.onTradeExecuted}
                  onChange={(e) => setConfig({ ...config, onTradeExecuted: e.target.checked })}
                  disabled={!config.enabled}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" color="success" />
                  <Typography variant="body2">Trade Executed</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.onStopLoss}
                  onChange={(e) => setConfig({ ...config, onStopLoss: e.target.checked })}
                  disabled={!config.enabled}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications fontSize="small" color="error" />
                  <Typography variant="body2">Stop-Loss Hit</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.onTarget}
                  onChange={(e) => setConfig({ ...config, onTarget: e.target.checked })}
                  disabled={!config.enabled}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" color="success" />
                  <Typography variant="body2">Target Reached</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.dailySummary}
                  onChange={(e) => setConfig({ ...config, dailySummary: e.target.checked })}
                  disabled={!config.enabled}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">Daily Summary (End of Day)</Typography>
                </Box>
              }
            />
          </FormGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Save Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving || !profileName}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>

        {!profileName && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select a profile to configure Telegram notifications
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramSettings;
