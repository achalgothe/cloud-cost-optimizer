const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const CostMonitorService = require('../services/costMonitorService');
const AlertService = require('../services/alertService');

// @desc    Run budget threshold check
// @route   POST /api/alerts/check-budgets
// @access  Private
const checkBudgets = async (req, res) => {
  try {
    const result = await CostMonitorService.checkBudgetThresholds();
    res.json({
      success: true,
      message: 'Budget threshold check completed',
      data: result,
    });
  } catch (error) {
    console.error('Check budgets error:', error);
    res.status(500).json({ message: 'Error checking budgets', error: error.message });
  }
};

// @desc    Run cost spike detection
// @route   POST /api/alerts/detect-spikes
// @access  Private
const detectSpikes = async (req, res) => {
  try {
    const result = await CostMonitorService.detectCostSpikes();
    res.json({
      success: true,
      message: 'Cost spike detection completed',
      data: result,
    });
  } catch (error) {
    console.error('Detect spikes error:', error);
    res.status(500).json({ message: 'Error detecting spikes', error: error.message });
  }
};

// @desc    Run all monitoring tasks
// @route   POST /api/alerts/monitor
// @access  Private/Admin
const runMonitoring = async (req, res) => {
  try {
    const result = await CostMonitorService.runMonitoring();
    res.json({
      success: true,
      message: 'Monitoring completed',
      data: result,
    });
  } catch (error) {
    console.error('Run monitoring error:', error);
    res.status(500).json({ message: 'Error running monitoring', error: error.message });
  }
};

// @desc    Send test alert
// @route   POST /api/alerts/test
// @access  Private
const sendTestAlert = async (req, res) => {
  try {
    const { type = 'email', recipient } = req.body;

    const testMessage = `
*Test Alert from Cloud Cost Optimizer*

This is a test alert to verify your notification settings are working correctly.

*Type:* ${type.toUpperCase()}
*Time:* ${new Date().toLocaleString()}

If you received this, your alerts are configured properly! ✅

_This is an automated test message from Cloud Cost Optimizer_
    `.trim();

    let result;
    if (type === 'slack') {
      result = await AlertService.sendSlackAlert({
        message: testMessage,
        type: 'info',
      });
    } else {
      result = await AlertService.sendEmailAlert({
        to: recipient || 'test@example.com',
        subject: '🧪 Test Alert - Cloud Cost Optimizer',
        message: testMessage,
        type: 'info',
      });
    }

    res.json({
      success: true,
      message: `Test ${type} alert sent`,
      data: result,
    });
  } catch (error) {
    console.error('Send test alert error:', error);
    res.status(500).json({ message: 'Error sending test alert', error: error.message });
  }
};

// @desc    Get alert history/logs
// @route   GET /api/alerts/history
// @access  Private
const getAlertHistory = async (req, res) => {
  try {
    // In production, this would query a database of sent alerts
    // For now, return mock data
    const history = [
      {
        _id: 'alert-1',
        type: 'budget',
        severity: 'warning',
        title: 'Budget Alert: Monthly AWS Budget - 85% Used',
        message: 'Your AWS spending has crossed the 80% threshold',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'sent',
      },
      {
        _id: 'alert-2',
        type: 'spike',
        severity: 'error',
        title: 'Cost Spike Detected: EC2 (AWS)',
        message: 'EC2 costs increased by 75% compared to last week',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'sent',
      },
      {
        _id: 'alert-3',
        type: 'budget',
        severity: 'error',
        title: 'Budget Exceeded: Monthly Azure Budget',
        message: 'Your Azure spending has exceeded the budget limit',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'sent',
      },
    ];

    res.json({
      success: true,
      data: {
        alerts: history,
        total: history.length,
      },
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({ message: 'Error getting alert history', error: error.message });
  }
};

// @desc    Get alert settings
// @route   GET /api/alerts/settings
// @access  Private
const getAlertSettings = async (req, res) => {
  try {
    // In production, get from user settings
    const settings = {
      emailAlerts: true,
      slackAlerts: true,
      budgetThresholds: [50, 80, 100],
      spikeThreshold: 50, // percentage
      dailySummary: true,
      weeklyReport: true,
      recipients: ['admin@company.com'],
      slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get alert settings error:', error);
    res.status(500).json({ message: 'Error getting alert settings', error: error.message });
  }
};

// @desc    Update alert settings
// @route   PUT /api/alerts/settings
// @access  Private
const updateAlertSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // In production, save to user settings
    console.log('Updating alert settings:', settings);

    res.json({
      success: true,
      message: 'Alert settings updated',
      data: settings,
    });
  } catch (error) {
    console.error('Update alert settings error:', error);
    res.status(500).json({ message: 'Error updating alert settings', error: error.message });
  }
};

router.use(protect);

router.post('/check-budgets', checkBudgets);
router.post('/detect-spikes', detectSpikes);
router.post('/monitor', runMonitoring);
router.post('/test', sendTestAlert);
router.get('/history', getAlertHistory);
router.get('/settings', getAlertSettings);
router.put('/settings', updateAlertSettings);

module.exports = router;
