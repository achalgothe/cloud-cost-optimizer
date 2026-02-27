const Cost = require('../models/Cost');

// @desc    Get cost overview
// @route   GET /api/costs/overview
// @access  Private
const getCostOverview = async (req, res) => {
  try {
    const { startDate, endDate, provider } = req.query;
    const user = req.user._id;

    // Build date filter
    const dateFilter = { user };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.date = { $gte: thirtyDaysAgo };
    }

    if (provider) {
      dateFilter.cloudProvider = provider;
    }

    // Get total cost
    const totalCostResult = await Cost.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);

    const totalCost = totalCostResult[0]?.total || 0;

    // Get cost by provider
    const costByProvider = await Cost.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$cloudProvider',
          total: { $sum: '$cost' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get cost by service type
    const costByServiceType = await Cost.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceType',
          total: { $sum: '$cost' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get daily cost trend
    const dailyTrend = await Cost.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top spending services
    const topServices = await Cost.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$serviceName',
          total: { $sum: '$cost' },
          provider: { $first: '$cloudProvider' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalCost,
        costByProvider,
        costByServiceType,
        dailyTrend,
        topServices,
        period: {
          startDate: dateFilter.date?.$gte || thirtyDaysAgo,
          endDate: dateFilter.date?.$lte || new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Get cost overview error:', error);
    res.status(500).json({ message: 'Server error fetching cost overview' });
  }
};

// @desc    Get cost breakdown
// @route   GET /api/costs/breakdown
// @access  Private
const getCostBreakdown = async (req, res) => {
  try {
    const { groupBy = 'service', startDate, endDate, provider } = req.query;
    const user = req.user._id;

    const dateFilter = { user };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.date = { $gte: thirtyDaysAgo };
    }

    if (provider) {
      dateFilter.cloudProvider = provider;
    }

    let groupField;
    switch (groupBy) {
      case 'provider':
        groupField = '$cloudProvider';
        break;
      case 'region':
        groupField = '$region';
        break;
      case 'type':
        groupField = '$serviceType';
        break;
      case 'service':
      default:
        groupField = '$serviceName';
    }

    const breakdown = await Cost.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupField,
          total: { $sum: '$cost' },
          count: { $sum: 1 },
          avgCost: { $avg: '$cost' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        groupBy,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Get cost breakdown error:', error);
    res.status(500).json({ message: 'Server error fetching cost breakdown' });
  }
};

// @desc    Get cost forecast
// @route   GET /api/costs/forecast
// @access  Private
const getCostForecast = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const user = req.user._id;

    // Get historical data for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historicalData = await Cost.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user),
          date: { $gte: ninetyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Simple linear regression for forecasting
    const forecast = generateForecast(historicalData, parseInt(days));

    res.json({
      success: true,
      data: {
        historical: historicalData,
        forecast,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Get cost forecast error:', error);
    res.status(500).json({ message: 'Server error fetching cost forecast' });
  }
};

// Simple forecast function (can be enhanced with ML)
function generateForecast(historicalData, days) {
  if (historicalData.length === 0) return [];

  const n = historicalData.length;
  const sumX = n;
  const sumY = historicalData.reduce((acc, d) => acc + d.total, 0);
  const avgY = sumY / n;

  // Simple moving average
  const windowSize = 7;
  const forecast = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);

    // Use average of last week or overall average
    const recentData = historicalData.slice(-windowSize);
    const avgRecent = recentData.reduce((acc, d) => acc + d.total, 0) / recentData.length;

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted: avgRecent || avgY,
    });
  }

  return forecast;
}

const mongoose = require('mongoose');

module.exports = {
  getCostOverview,
  getCostBreakdown,
  getCostForecast,
};
