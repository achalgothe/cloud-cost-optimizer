const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import mock data
const {
  mockUser,
  mockCosts,
  mockRecommendations,
  mockResources,
  mockBudgets,
} = require('./mock-data');

// Import services
const CostAnalyticsService = require('./services/costAnalyticsService');
const AnomalyDetectionService = require('./services/anomalyDetectionService');

// Import alert routes
const alertRoutes = require('./routes/alerts');
const dataRoutes = require('./routes/data');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://172.31.22.125:3000', 'http://172.31.22.125:5000'],
  credentials: true,
}));

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '7d',
  });
};

// Mock auth middleware
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      req.user = mockUser;
      next();
      return;
    } catch (error) {
      // Token invalid but continue in test mode
    }
  }

  // Allow access without token in test mode
  req.user = mockUser;
  next();
};

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cloud Cost Optimizer API (Test Mode)',
    mode: 'mock-data'
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, company } = req.body;
  const user = {
    _id: 'user-' + Date.now(),
    name: name || 'Demo User',
    email: email || 'demo@cloudoptimizer.com',
    role: 'user',
    company: company || 'Tech Corp',
    cloudProviders: ['aws', 'azure', 'gcp'],
    token: generateToken('user-' + Date.now()),
  };
  res.status(201).json(user);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Accept any login in test mode
  const user = {
    ...mockUser,
    token: generateToken(mockUser._id),
  };
  res.json(user);
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/profile', protect, (req, res) => {
  const updatedUser = { ...req.user, ...req.body };
  res.json({
    ...updatedUser,
    token: generateToken(updatedUser._id),
  });
});

app.post('/api/auth/profile/avatar', protect, (req, res) => {
  const { avatar } = req.body;
  const updatedUser = { ...req.user, avatar: avatar || null };
  res.json({
    ...updatedUser,
    token: generateToken(updatedUser._id),
  });
});

app.put('/api/auth/password', protect, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // In test mode, just accept any current password
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }
  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// Cost routes
app.get('/api/costs/overview', protect, (req, res) => {
  res.json({
    success: true,
    data: mockCosts,
  });
});

app.get('/api/costs/breakdown', protect, (req, res) => {
  const { groupBy = 'service' } = req.query;
  res.json({
    success: true,
    data: {
      groupBy,
      breakdown: mockCosts.costByServiceType,
    },
  });
});

app.get('/api/costs/forecast', protect, (req, res) => {
  const { days = 30 } = req.query;
  const forecast = mockCosts.dailyTrend.slice(-7).map((item, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    predicted: item.total * (0.95 + Math.random() * 0.1),
  }));
  res.json({
    success: true,
    data: {
      historical: mockCosts.dailyTrend,
      forecast,
    },
  });
});

// Cost Analytics routes
app.get('/api/analytics/overview', protect, (req, res) => {
  const { period = 30 } = req.query;
  const analytics = CostAnalyticsService.getCostOverview(parseInt(period));
  res.json({
    success: true,
    data: analytics,
  });
});

app.get('/api/analytics/breakdown', protect, (req, res) => {
  const { dimension = 'service', period = 30 } = req.query;
  const breakdown = CostAnalyticsService.getCostBreakdown(dimension, parseInt(period));
  res.json({
    success: true,
    data: breakdown,
  });
});

app.get('/api/analytics/compare', protect, (req, res) => {
  const { currentPeriod = 30, previousPeriod = 30 } = req.query;
  const comparison = CostAnalyticsService.comparePeriods(parseInt(currentPeriod), parseInt(previousPeriod));
  res.json({
    success: true,
    data: comparison,
  });
});

app.get('/api/analytics/forecast', protect, (req, res) => {
  const { days = 7, period = 30 } = req.query;
  const forecast = CostAnalyticsService.forecastCosts(parseInt(days), parseInt(period));
  res.json({
    success: true,
    data: forecast,
  });
});

// Anomaly Detection routes
app.get('/api/anomaly/detect', protect, (req, res) => {
  const { period = 30 } = req.query;
  const analysis = AnomalyDetectionService.runFullAnalysis(parseInt(period));
  res.json({
    success: true,
    data: analysis,
  });
});

app.get('/api/anomaly/spikes', protect, (req, res) => {
  const { lookbackDays = 7, period = 30 } = req.query;
  const CostAnalyticsService = require('./services/costAnalyticsService');
  const dailyCosts = CostAnalyticsService.generateDailyCosts(parseInt(period));
  const spikes = AnomalyDetectionService.detectCostSpikes(dailyCosts, parseInt(lookbackDays));
  res.json({
    success: true,
    data: spikes,
  });
});

app.get('/api/anomaly/opportunities', protect, (req, res) => {
  const { period = 30 } = req.query;
  const CostAnalyticsService = require('./services/costAnalyticsService');
  const dailyCosts = CostAnalyticsService.generateDailyCosts(parseInt(period));
  const opportunities = AnomalyDetectionService.identifyOptimizationOpportunities(dailyCosts, parseInt(period));
  res.json({
    success: true,
    data: opportunities,
  });
});

// Recommendation routes
app.get('/api/recommendations', protect, (req, res) => {
  const { status, priority } = req.query;
  let filtered = mockRecommendations;
  
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  if (priority) {
    filtered = filtered.filter(r => r.priority === priority);
  }

  const summary = {
    total: filtered.length,
    byPriority: {
      high: filtered.filter(r => r.priority === 'high').length,
      medium: filtered.filter(r => r.priority === 'medium').length,
      low: filtered.filter(r => r.priority === 'low').length,
    },
    totalEstimatedSavings: filtered.reduce((acc, r) => acc + r.estimatedSavings, 0),
    byStatus: {
      pending: filtered.filter(r => r.status === 'pending').length,
      inProgress: filtered.filter(r => r.status === 'in_progress').length,
      implemented: filtered.filter(r => r.status === 'implemented').length,
    },
  };

  res.json({
    success: true,
    data: {
      recommendations: filtered,
      summary,
    },
  });
});

app.post('/api/recommendations/generate', protect, (req, res) => {
  res.json({
    success: true,
    message: `Generated ${mockRecommendations.length} recommendations`,
    data: {
      recommendations: mockRecommendations,
      count: mockRecommendations.length,
    },
  });
});

app.put('/api/recommendations/:id', protect, (req, res) => {
  const { id } = req.params;
  const rec = mockRecommendations.find(r => r._id === id);
  if (rec) {
    Object.assign(rec, req.body);
  }
  res.json({
    success: true,
    data: rec || mockRecommendations[0],
  });
});

app.delete('/api/recommendations/:id', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Recommendation deleted',
  });
});

// Resource routes
app.get('/api/resources', protect, (req, res) => {
  const { status, provider } = req.query;
  let filtered = mockResources;
  
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  if (provider) {
    filtered = filtered.filter(r => r.cloudProvider === provider);
  }

  const summary = {
    total: filtered.length,
    byStatus: {
      running: filtered.filter(r => r.status === 'running').length,
      stopped: filtered.filter(r => r.status === 'stopped').length,
      idle: filtered.filter(r => r.status === 'idle').length,
      underutilized: filtered.filter(r => r.status === 'underutilized').length,
      optimal: filtered.filter(r => r.status === 'optimal').length,
    },
    totalCost: filtered.reduce((acc, r) => acc + r.cost, 0),
    byProvider: {
      aws: filtered.filter(r => r.cloudProvider === 'aws').length,
      azure: filtered.filter(r => r.cloudProvider === 'azure').length,
      gcp: filtered.filter(r => r.cloudProvider === 'gcp').length,
    },
  };

  res.json({
    success: true,
    data: {
      resources: filtered,
      summary,
    },
  });
});

app.post('/api/resources/scan', protect, (req, res) => {
  res.json({
    success: true,
    message: `Scanned ${mockResources.length} resources`,
    data: {
      resources: mockResources,
      count: mockResources.length,
    },
  });
});

app.post('/api/resources', protect, (req, res) => {
  const newResource = {
    _id: 'res-' + Date.now(),
    ...req.body,
    user: mockUser._id,
    utilization: req.body.utilization || { cpu: 0, memory: 0, storage: 0, network: 0 },
    cost: parseFloat(req.body.cost) || 0,
    currency: 'USD',
    status: req.body.status || 'running',
    lastScannedAt: new Date(),
  };
  mockResources.push(newResource);
  res.status(201).json({
    success: true,
    data: newResource,
  });
});

// Budget routes
app.get('/api/budgets', protect, (req, res) => {
  res.json({
    success: true,
    data: mockBudgets,
  });
});

app.get('/api/budgets/:id', protect, (req, res) => {
  const budget = mockBudgets.find(b => b._id === req.params.id);
  res.json({
    success: true,
    data: budget || mockBudgets[0],
  });
});

app.post('/api/budgets', protect, (req, res) => {
  const newBudget = {
    _id: 'budget-' + Date.now(),
    name: req.body.name || 'New Budget',
    cloudProvider: req.body.cloudProvider || 'all',
    amount: parseFloat(req.body.amount) || 0,
    currency: 'USD',
    period: req.body.period || 'monthly',
    startDate: req.body.startDate || new Date().toISOString(),
    user: mockUser._id,
    actualSpend: 0,
    percentageUsed: '0',
    status: 'active',
    alertsEnabled: req.body.alertsEnabled !== undefined ? req.body.alertsEnabled : true,
    createdAt: new Date(),
  };
  mockBudgets.push(newBudget);
  res.status(201).json({
    success: true,
    data: newBudget,
  });
});

app.put('/api/budgets/:id', protect, (req, res) => {
  const budgetIndex = mockBudgets.findIndex(b => b._id === req.params.id);
  if (budgetIndex >= 0) {
    mockBudgets[budgetIndex] = {
      ...mockBudgets[budgetIndex],
      ...req.body,
    };
  }
  res.json({
    success: true,
    data: budgetIndex >= 0 ? mockBudgets[budgetIndex] : mockBudgets[0],
  });
});

app.delete('/api/budgets/:id', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Budget deleted',
  });
});

// Alert routes (test mode - inline to avoid DB middleware)
app.get('/api/alerts/history', protect, (req, res) => {
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
});

app.get('/api/alerts/settings', protect, (req, res) => {
  const settings = {
    emailAlerts: true,
    slackAlerts: true,
    budgetThresholds: [50, 80, 100],
    spikeThreshold: 50,
    dailySummary: true,
    weeklyReport: true,
    recipients: ['admin@company.com'],
    slackWebhook: process.env.SLACK_WEBHOOK_URL || '',
  };
  res.json({
    success: true,
    data: settings,
  });
});

app.put('/api/alerts/settings', protect, (req, res) => {
  const settings = req.body;
  console.log('Updating alert settings:', settings);
  res.json({
    success: true,
    message: 'Alert settings updated',
    data: settings,
  });
});

app.post('/api/alerts/monitor', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Monitoring completed',
    data: {
      budgetCheck: { alertsSent: 2 },
      spikeDetection: { alertsSent: 1 },
    },
  });
});

app.post('/api/alerts/test', protect, (req, res) => {
  const { type = 'email' } = req.body;
  console.log(`Sending test ${type} alert...`);
  res.json({
    success: true,
    message: `Test ${type} alert sent`,
    data: {
      type,
      recipient: 'test@example.com',
      timestamp: new Date().toISOString(),
    },
  });
});

// Data routes
app.use('/api/data', dataRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running in TEST MODE on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`\n⚠️  Using mock data - no database connection required!\n`);
});

module.exports = app;
