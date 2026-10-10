import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Person,
  LibraryBooks,
  Telegram,
  AccountBalance
} from '@mui/icons-material';
import ProfileSelector from '../ProfileSelector/ProfileSelector';
import StrategyLibrary from '../StrategyLibrary/StrategyLibrary';
import TelegramSettings from '../TelegramSettings/TelegramSettings';
import PaperTradingDashboard from '../PaperTradingDashboard/PaperTradingDashboard';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileConfig, setProfileConfig] = useState(null);

  const handleProfileChange = (profileName, config) => {
    setSelectedProfile(profileName);
    setProfileConfig(config);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Profile & Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your trading profile, strategies, and notification preferences
      </Typography>

      {/* Profile Selector at the top */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <ProfileSelector onProfileChange={handleProfileChange} />
      </Paper>

      {/* Tabs for different settings sections */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AccountBalance />} label="Paper Trading" iconPosition="start" />
          <Tab icon={<LibraryBooks />} label="Strategy Library" iconPosition="start" />
          <Tab icon={<Telegram />} label="Telegram" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <PaperTradingDashboard profileName={selectedProfile} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <StrategyLibrary 
              profileName={selectedProfile}
              onStrategyAdopted={(strategy) => {
                console.log('Strategy adopted:', strategy);
              }}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TelegramSettings 
              profileName={selectedProfile}
              initialConfig={profileConfig}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
