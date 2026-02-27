import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SlackIcon from '@mui/icons-material/Chat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BudgetIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    emailAlerts: true,
    slackAlerts: false,
    budgetThresholds: [50, 80, 100],
    spikeThreshold: 50,
    dailySummary: true,
    weeklyReport: false,
    recipients: ['admin@company.com'],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testType, setTestType] = useState('email');

  useEffect(() => {
    fetchAlertHistory();
    fetchSettings();
  }, []);

  const fetchAlertHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/alerts/history');
      setAlerts(response.data.data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/alerts/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleRunMonitoring = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const response = await axios.post('/api/alerts/monitor');
      setMessage({
        type: 'success',
        text: `Monitoring completed! ${response.data.data.budgetCheck?.alertsSent || 0} budget alerts and ${response.data.data.spikeDetection?.alertsSent || 0} spike alerts sent.`,
      });
      await fetchAlertHistory();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to run monitoring',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    try {
      setMessage({ type: '', text: '' });
      await axios.post('/api/alerts/test', { type: testType });
      setMessage({
        type: 'success',
        text: `Test ${testType} alert sent successfully!`,
      });
      setTestDialogOpen(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send test alert',
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/alerts/settings', settings);
      setMessage({
        type: 'success',
        text: 'Alert settings saved!',
      });
      setSettingsDialogOpen(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save settings',
      });
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'budget':
        return <BudgetIcon />;
      case 'spike':
        return <TrendingUpIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <CheckCircleIcon color="info" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Alerts & Notifications</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <RefreshIcon className="spin" /> : <RefreshIcon />}
            onClick={handleRunMonitoring}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Checks'}
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Email Alerts
                </Typography>
              </Box>
              <Typography variant="h4" color={settings.emailAlerts ? 'success.main' : 'text.secondary'}>
                {settings.emailAlerts ? 'Enabled' : 'Disabled'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SlackIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Slack Alerts
                </Typography>
              </Box>
              <Typography variant="h4" color={settings.slackAlerts ? 'success.main' : 'text.secondary'}>
                {settings.slackAlerts ? 'Enabled' : 'Disabled'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BudgetIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Budget Thresholds
                </Typography>
              </Box>
              <Typography variant="h6">
                {settings.budgetThresholds.join('%, ')}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography color="text.secondary" variant="body2">
                  Spike Detection
                </Typography>
              </Box>
              <Typography variant="h6">
                &gt;{settings.spikeThreshold}% increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => {
                  setTestType('email');
                  setTestDialogOpen(true);
                }}
                startIcon={<EmailIcon />}
              >
                Test Email
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => {
                  setTestType('slack');
                  setTestDialogOpen(true);
                }}
                startIcon={<SlackIcon />}
              >
                Test Slack
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Recent Alerts
          </Typography>
          {alerts.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No alerts yet. Click "Run Checks" to test monitoring.
            </Typography>
          ) : (
            <List>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getSeverityIcon(alert.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body1" fontWeight="500" sx={{ mr: 1 }}>
                            {alert.title}
                          </Typography>
                          <Chip label={alert.type} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alert Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Notification Channels
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailAlerts}
                  onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                />
              }
              label="Email Alerts"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.slackAlerts}
                  onChange={(e) => setSettings({ ...settings, slackAlerts: e.target.checked })}
                />
              }
              label="Slack Alerts"
              sx={{ mb: 3, display: 'block' }}
            />

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Budget Alert Thresholds (%)
            </Typography>
            <TextField
              fullWidth
              value={settings.budgetThresholds.join(', ')}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  budgetThresholds: e.target.value.split(',').map((n) => parseInt(n.trim())).filter((n) => !isNaN(n)),
                })
              }
              helperText="Comma-separated values (e.g., 50, 80, 100)"
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Cost Spike Threshold (%)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={settings.spikeThreshold}
              onChange={(e) => setSettings({ ...settings, spikeThreshold: parseInt(e.target.value) })}
              helperText="Alert when costs increase by this percentage"
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Scheduled Reports
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dailySummary}
                  onChange={(e) => setSettings({ ...settings, dailySummary: e.target.checked })}
                />
              }
              label="Daily Summary"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.weeklyReport}
                  onChange={(e) => setSettings({ ...settings, weeklyReport: e.target.checked })}
                />
              }
              label="Weekly Report"
              sx={{ mb: 2, display: 'block' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Alert Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)}>
        <DialogTitle>Send Test Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This will send a test {testType} alert to verify your configuration.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTestAlert} variant="contained">
            Send Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;
