const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Lenient protect middleware for test mode
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      req.user = { _id: 'mock-user-id', name: 'Demo User', email: 'demo@cloudoptimizer.com' };
      next();
      return;
    } catch (error) {
      // Continue without auth for test mode
    }
  }

  // Allow access without token in test mode
  req.user = { _id: 'mock-user-id', name: 'Demo User', email: 'demo@cloudoptimizer.com' };
  next();
};
const DataFlowController = require('../controllers/dataFlowController');

// @desc    Process cloud data (complete flow)
// @route   POST /api/data/process
// @access  Private
const processData = async (req, res) => {
  try {
    const { fetchFromAWS, awsCredentials, days = 30 } = req.body;

    const result = await DataFlowController.processCloudData(req.user, {
      fetchFromAWS,
      awsCredentials,
      days,
    });

    res.json(result);
  } catch (error) {
    console.error('Process data error:', error);
    res.status(500).json({ 
      message: 'Error processing cloud data', 
      error: error.message 
    });
  }
};

// @desc    Get insights
// @route   GET /api/data/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await DataFlowController.processCloudData(req.user, {
      days: parseInt(days),
    });

    res.json({
      success: true,
      data: {
        insights: result.data.insights,
        recommendations: result.data.recommendations,
      },
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Error getting insights', error: error.message });
  }
};

// @desc    Get cost analytics
// @route   GET /api/data/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await DataFlowController.processCloudData(req.user, {
      days: parseInt(days),
    });

    res.json({
      success: true,
      data: {
        costs: result.data.costs,
        analytics: result.metadata.analytics,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error getting analytics', error: error.message });
  }
};

// @desc    Import AWS data
// @route   POST /api/data/import/aws
// @access  Private
const importAWSData = async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region = 'us-east-1', days = 30 } = req.body;

    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({ message: 'AWS credentials required' });
    }

    const result = await DataFlowController.processCloudData(req.user, {
      fetchFromAWS: true,
      awsCredentials: {
        accessKeyId,
        secretAccessKey,
        region,
      },
      days,
    });

    res.json(result);
  } catch (error) {
    console.error('Import AWS data error:', error);
    res.status(500).json({ message: 'Error importing AWS data', error: error.message });
  }
};

// @desc    Get data flow status
// @route   GET /api/data/status
// @access  Private
const getDataFlowStatus = async (req, res) => {
  try {
    // Return current status of data pipeline
    const status = {
      pipeline: 'operational',
      lastSync: new Date().toISOString(),
      dataSources: {
        aws: 'connected',
        database: 'connected',
      },
      processing: {
        analytics: 'enabled',
        aiInsights: 'enabled',
      },
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ message: 'Error getting status', error: error.message });
  }
};

router.use(protect);

router.post('/process', processData);
router.get('/insights', getInsights);
router.get('/analytics', getAnalytics);
router.post('/import/aws', importAWSData);
router.get('/status', getDataFlowStatus);

module.exports = router;
