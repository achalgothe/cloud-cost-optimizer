const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const costRoutes = require('./routes/costs');
const recommendationRoutes = require('./routes/recommendations');
const resourceRoutes = require('./routes/resources');
const budgetRoutes = require('./routes/budgets');
const alertRoutes = require('./routes/alerts');
const dataRoutes = require('./routes/data');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Scheduled monitoring
const startMonitoring = () => {
  const CostMonitorService = require('./services/costMonitorService');
  
  // Check budgets every hour
  setInterval(() => {
    CostMonitorService.checkBudgetThresholds();
  }, 60 * 60 * 1000); // 1 hour
  
  // Detect spikes every 30 minutes
  setInterval(() => {
    CostMonitorService.detectCostSpikes();
  }, 30 * 60 * 1000); // 30 minutes
  
  // Daily summary at 9 AM
  const now = new Date();
  const nineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const timeToNineAM = nineAM.getTime() - now.getTime();
  const delay = timeToNineAM > 0 ? timeToNineAM : timeToNineAM + 24 * 60 * 60 * 1000;
  
  setTimeout(() => {
    CostMonitorService.sendDailySummary();
    setInterval(() => {
      CostMonitorService.sendDailySummary();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, delay);
  
  console.log('📅 Scheduled monitoring started');
};

// Start monitoring after a short delay
setTimeout(startMonitoring, 5000);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/data', dataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cloud Cost Optimizer API is running' });
});

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Access from Windows: http://localhost:${PORT}`);
});

module.exports = app;
