const Cost = require('../models/Cost');
const Budget = require('../models/Budget');
const AlertService = require('./alertService');

class CostMonitorService {
  /**
   * Check all budgets and send alerts if thresholds are crossed
   */
  static async checkBudgetThresholds() {
    console.log('🔍 Checking budget thresholds...');
    
    try {
      const budgets = await Budget.find({ status: 'active', alertsEnabled: true });
      const alertsSent = [];

      for (const budget of budgets) {
        // Calculate current spend for this budget period
        const now = new Date();
        let startDate;

        switch (budget.period) {
          case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const costFilter = {
          user: budget.user,
          date: { $gte: startDate },
        };

        if (budget.cloudProvider !== 'all') {
          costFilter.cloudProvider = budget.cloudProvider;
        }

        // Get actual spend
        const costData = await Cost.aggregate([
          { $match: costFilter },
          { $group: { _id: null, total: { $sum: '$cost' } } },
        ]);

        const actualSpend = costData[0]?.total || 0;
        const percentageUsed = budget.amount > 0 ? (actualSpend / budget.amount) * 100 : 0;

        // Update budget with actual spend
        budget.actualSpend = actualSpend;
        if (percentageUsed >= 100) {
          budget.status = 'exceeded';
        }
        await budget.save();

        // Check thresholds
        if (budget.thresholds && budget.thresholds.length > 0) {
          for (const threshold of budget.thresholds) {
            if (percentageUsed >= threshold.percentage) {
              // Check if we already sent this alert today
              const lastAlertKey = `lastAlert_${threshold.percentage}`;
              const lastAlert = budget[lastAlertKey];
              const oneDayMs = 24 * 60 * 60 * 1000;

              if (!lastAlert || Date.now() - new Date(lastAlert).getTime() > oneDayMs) {
                // Get recipients
                const recipients = threshold.recipients || ['admin@company.com'];

                // Send alert
                const alerts = await AlertService.sendBudgetAlert({
                  budgetName: budget.name,
                  budgetAmount: budget.amount,
                  currentSpend: actualSpend,
                  percentageUsed,
                  threshold: threshold.percentage,
                  recipients,
                  cloudProvider: budget.cloudProvider,
                });

                alertsSent.push(...alerts);

                // Update last alert time
                budget[lastAlertKey] = new Date();
                await budget.save();

                console.log(`   ✓ Alert sent for ${budget.name} at ${threshold.percentage}% threshold`);
              }
            }
          }
        }
      }

      console.log(`   Total alerts sent: ${alertsSent.length}`);
      return { success: true, alertsSent: alertsSent.length };
    } catch (error) {
      console.error('   ✗ Error checking budget thresholds:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect sudden cost spikes
   */
  static async detectCostSpikes() {
    console.log('🔍 Detecting cost spikes...');

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Get costs for last 7 days
      const recentCosts = await Cost.aggregate([
        {
          $match: {
            date: { $gte: sevenDaysAgo, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              cloudProvider: '$cloudProvider',
              serviceName: '$serviceName',
            },
            totalCost: { $sum: '$cost' },
            avgDailyCost: { $avg: '$cost' },
            days: { $sum: 1 },
          },
        },
      ]);

      // Get costs for previous 7 days (for comparison)
      const previousCosts = await Cost.aggregate([
        {
          $match: {
            date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              cloudProvider: '$cloudProvider',
              serviceName: '$serviceName',
            },
            totalCost: { $sum: '$cost' },
            avgDailyCost: { $avg: '$cost' },
          },
        },
      ]);

      const previousMap = new Map();
      previousCosts.forEach(cost => {
        const key = `${cost._id.cloudProvider}-${cost._id.serviceName}`;
        previousMap.set(key, cost.avgDailyCost);
      });

      const alertsSent = [];
      const spikeThreshold = 50; // 50% increase triggers alert

      for (const recent of recentCosts) {
        const key = `${recent._id.cloudProvider}-${recent._id.serviceName}`;
        const previousAvg = previousMap.get(key) || 0;
        const currentAvg = recent.avgDailyCost;

        if (previousAvg > 0 && currentAvg > previousAvg) {
          const spikePercentage = ((currentAvg - previousAvg) / previousAvg) * 100;

          if (spikePercentage >= spikeThreshold && currentAvg > 10) {
            console.log(`   ⚠️ Spike detected: ${recent._id.serviceName} (${spikePercentage.toFixed(1)}%)`);

            // Get user for this cost data
            const userCost = await Cost.findOne({
              cloudProvider: recent._id.cloudProvider,
              serviceName: recent._id.serviceName,
            });

            if (userCost) {
              // Get user's alert preferences
              const userBudgets = await Budget.find({ user: userCost.user });
              const recipients = ['admin@company.com']; // Default, should get from user settings

              const alerts = await AlertService.sendSpikeAlert({
                cloudProvider: recent._id.cloudProvider,
                serviceName: recent._id.serviceName,
                currentCost: currentAvg,
                averageCost: previousAvg,
                spikePercentage,
                recipients,
              });

              alertsSent.push(...alerts);
            }
          }
        }
      }

      console.log(`   Total spike alerts sent: ${alertsSent.length}`);
      return { success: true, alertsSent: alertsSent.length, spikesDetected: alertsSent.length };
    } catch (error) {
      console.error('   ✗ Error detecting cost spikes:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send daily summary
   */
  static async sendDailySummary() {
    console.log('📊 Sending daily summary...');

    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));

      // Get today's costs
      const todayCosts = await Cost.aggregate([
        { $match: { date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]);

      const totalSpend = todayCosts[0]?.total || 0;

      // Get top services
      const topServices = await Cost.aggregate([
        { $match: { date: { $gte: startOfDay } } },
        {
          $group: {
            _id: '$serviceName',
            cost: { $sum: '$cost' },
          },
        },
        { $sort: { cost: -1 } },
        { $limit: 5 },
      ]);

      // Get budget
      const budget = await Budget.findOne({ period: 'monthly' });
      const dailyBudget = budget ? budget.amount / 30 : 1000;

      // Get recommendation count
      const recommendationCount = 0; // Would need to query recommendations

      const recipients = ['admin@company.com'];

      const alerts = await AlertService.sendSummaryAlert({
        period: 'Daily',
        totalSpend,
        budgetAmount: dailyBudget,
        topServices: topServices.map(s => ({ name: s._id, cost: s.cost })),
        recommendations: recommendationCount,
        recipients,
      });

      console.log(`   Daily summary sent to ${recipients.length} recipients`);
      return { success: true, alertsSent: alerts.length };
    } catch (error) {
      console.error('   ✗ Error sending daily summary:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run all monitoring tasks
   */
  static async runMonitoring() {
    console.log('\n🚀 Starting cost monitoring...\n');

    const results = {
      budgetCheck: await this.checkBudgetThresholds(),
      spikeDetection: await this.detectCostSpikes(),
      // dailySummary: await this.sendDailySummary(), // Run separately
    };

    console.log('\n✅ Monitoring complete\n');
    return results;
  }
}

module.exports = CostMonitorService;
