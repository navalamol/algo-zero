import React, { useState, useEffect } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Add,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProfileSelector = ({ onProfileChange }) => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profileConfig, setProfileConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles`);
      if (response.data.success) {
        setProfiles(response.data.profiles);
        
        // Auto-select first profile if available
        if (response.data.profiles.length > 0 && !selectedProfile) {
          const firstProfileName = response.data.profiles[0].name;
          setSelectedProfile(firstProfileName);
          loadProfileConfig(firstProfileName);
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
      setError('Failed to load profiles. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileConfig = async (profileName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles/${profileName}`);
      if (response.data.success) {
        setProfileConfig(response.data.config);
        if (onProfileChange) {
          onProfileChange(profileName, response.data.config);
        }
      }
    } catch (err) {
      console.error('Failed to load profile config:', err);
      setError(`Failed to load profile: ${profileName}`);
    }
  };

  const handleProfileChange = (event) => {
    const newProfile = event.target.value;
    setSelectedProfile(newProfile);
    loadProfileConfig(newProfile);
  };

  if (loading && profiles.length === 0) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading profiles...</Typography>
      </Box>
    );
  }

  if (profiles.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          No profiles found. Create a profile using: <code>npm run create-profile</code>
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <FormControl fullWidth size="small">
          <InputLabel id="profile-select-label">Active Profile</InputLabel>
          <Select
            labelId="profile-select-label"
            value={selectedProfile}
            label="Active Profile"
            onChange={handleProfileChange}
            startAdornment={<Person sx={{ mr: 1, color: 'primary.main' }} />}
          >
            {profiles.map((profile) => (
              <MenuItem key={profile.name} value={profile.name}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Person fontSize="small" />
                  <Typography>
                    {profile.displayName || profile.name}
                    {profile.paperTrading && (
                      <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                        (Paper)
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Refresh profiles">
          <IconButton onClick={loadProfiles} color="primary" size="small">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {profileConfig && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {profileConfig.trading?.paperTrading && (
            <Chip
              label="Paper Trading"
              color="warning"
              size="small"
              icon={<CheckCircle />}
            />
          )}
          <Chip
            label={`Risk: ${profileConfig.trading?.riskLevel || 'MODERATE'}`}
            color="info"
            size="small"
          />
          <Chip
            label={`Max Loss: ₹${(profileConfig.trading?.maxDailyLoss || 0).toLocaleString()}`}
            size="small"
          />
          {profileConfig.trading?.notifications?.telegram?.enabled && (
            <Chip
              label="Telegram Alerts"
              color="success"
              size="small"
              icon={<CheckCircle />}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProfileSelector;
