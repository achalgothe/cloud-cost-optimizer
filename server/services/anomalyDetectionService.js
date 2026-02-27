/**
 * Anomaly Detection Module
 * - Calculate moving average (7 days)
 * - Detect anomalies: cost > (mean + 2×std deviation)
 * - Generate spike alerts
 */

class AnomalyDetectionService {
  /**
   * Calculate statistical metrics for a dataset
   */
  static calculateStatistics(values) {
    const n = values.length;
    if (n === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
    
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { mean, stdDev, min, max };
  }

  /**
   * Calculate moving average for time series data
   */
  static calculateMovingAverage(dailyCosts, windowSize = 7) {
    const movingAverages = [];
    
    for (let i = 0; i < dailyCosts.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = dailyCosts.slice(start, i + 1);
      const avg = window.reduce((sum, d) => sum + d.total, 0) / window.length;
      
      movingAverages.push({
        date: dailyCosts[i].date,
        actual: dailyCosts[i].total,
        movingAverage: parseFloat(avg.toFixed(2)),
        deviation: parseFloat((dailyCosts[i].total - avg).toFixed(2)),
        deviationPercent: parseFloat(((dailyCosts[i].total - avg) / avg * 100).toFixed(2)),
      });
    }
    
    return movingAverages;
  }

  /**
   * Detect anomalies using statistical method
   * Anomaly: value > (mean + 2 × standard deviation)
   */
  static detectAnomalies(dailyCosts, period = 30) {
    const recentCosts = dailyCosts.slice(-period);
    const values = recentCosts.map(d => d.total);
    const stats = this.calculateStatistics(values);
    
    const threshold = stats.mean + (2 * stats.stdDev);
    const warningThreshold = stats.mean + (1.5 * stats.stdDev);
    
    const anomalies = [];
    const warnings = [];
    
    recentCosts.forEach(day => {
      const zScore = (day.total - stats.mean) / stats.stdDev;
      const deviationPercent = ((day.total - stats.mean) / stats.mean) * 100;
      
      if (day.total > threshold) {
        anomalies.push({
          _id: `anomaly-${day._id}`,
          date: day.date,
          actualCost: day.total,
          expectedCost: parseFloat(stats.mean.toFixed(2)),
          threshold: parseFloat(threshold.toFixed(2)),
          zScore: parseFloat(zScore.toFixed(2)),
          deviationPercent: parseFloat(deviationPercent.toFixed(2)),
          severity: 'error',
          message: `Cost spike detected on ${new Date(day.date).toLocaleDateString()} (${deviationPercent.toFixed(0)}% above average)`,
          recommendation: 'Investigate sudden cost increase - check for new deployments, traffic spikes, or misconfigured resources',
        });
      } else if (day.total > warningThreshold) {
        warnings.push({
          _id: `warning-${day._id}`,
          date: day.date,
          actualCost: day.total,
          expectedCost: parseFloat(stats.mean.toFixed(2)),
          threshold: parseFloat(warningThreshold.toFixed(2)),
          zScore: parseFloat(zScore.toFixed(2)),
          deviationPercent: parseFloat(deviationPercent.toFixed(2)),
          severity: 'warning',
          message: `Elevated costs on ${new Date(day.date).toLocaleDateString()} (${deviationPercent.toFixed(0)}% above average)`,
          recommendation: 'Monitor closely - costs are trending higher than normal',
        });
      }
    });
    
    return {
      period,
      statistics: {
        mean: parseFloat(stats.mean.toFixed(2)),
        stdDev: parseFloat(stats.stdDev.toFixed(2)),
        min: parseFloat(stats.min.toFixed(2)),
        max: parseFloat(stats.max.toFixed(2)),
        threshold: parseFloat(threshold.toFixed(2)),
        warningThreshold: parseFloat(warningThreshold.toFixed(2)),
      },
      anomalies,
      warnings,
      totalAnomalies: anomalies.length,
      totalWarnings: warnings.length,
      healthScore: this.calculateHealthScore(anomalies.length, warnings.length, period),
    };
  }

  /**
   * Calculate overall cost health score (0-100)
   */
  static calculateHealthScore(anomalyCount, warningCount, period) {
    // Base score of 100, deduct points for anomalies and warnings
    const anomalyPenalty = anomalyCount * 15;
    const warningPenalty = warningCount * 5;
    const score = Math.max(0, 100 - anomalyPenalty - warningPenalty);
    return score;
  }

  /**
   * Detect cost spikes by comparing to historical average
   */
  static detectCostSpikes(dailyCosts, lookbackDays = 7) {
    const spikes = [];
    
    for (let i = lookbackDays; i < dailyCosts.length; i++) {
      const historicalWindow = dailyCosts.slice(i - lookbackDays, i);
      const historicalAvg = historicalWindow.reduce((sum, d) => sum + d.total, 0) / lookbackDays;
      const currentCost = dailyCosts[i].total;
      
      const increasePercent = ((currentCost - historicalAvg) / historicalAvg) * 100;
      
      // Spike threshold: 50% increase over 7-day average
      if (increasePercent > 50) {
        spikes.push({
          _id: `spike-${dailyCosts[i]._id}`,
          date: dailyCosts[i].date,
          currentCost: parseFloat(currentCost.toFixed(2)),
          averageCost: parseFloat(historicalAvg.toFixed(2)),
          increasePercent: parseFloat(increasePercent.toFixed(2)),
          severity: increasePercent > 100 ? 'critical' : increasePercent > 75 ? 'high' : 'medium',
          message: `Cost spike detected: ${increasePercent.toFixed(0)}% increase compared to ${lookbackDays}-day average`,
          breakdown: {
            aws: dailyCosts[i].aws,
            azure: dailyCosts[i].azure,
            gcp: dailyCosts[i].gcp,
          },
          recommendation: this.getSpikeRecommendation(increasePercent),
        });
      }
    }
    
    return {
      lookbackDays,
      spikes,
      totalSpikes: spikes.length,
      criticalSpikes: spikes.filter(s => s.severity === 'critical').length,
      highSpikes: spikes.filter(s => s.severity === 'high').length,
      mediumSpikes: spikes.filter(s => s.severity === 'medium').length,
    };
  }

  /**
   * Get recommendation based on spike severity
   */
  static getSpikeRecommendation(increasePercent) {
    if (increasePercent > 100) {
      return '🚨 CRITICAL: Immediate investigation required. Check for runaway processes, unauthorized deployments, or DDoS attacks.';
    } else if (increasePercent > 75) {
      return '⚠️ HIGH: Review recent changes. Check auto-scaling policies, new resource deployments, and data transfer costs.';
    } else if (increasePercent > 50) {
      return '📊 MEDIUM: Monitor closely. Review service breakdown to identify cost drivers.';
    }
    return 'Continue monitoring.';
  }

  /**
   * Identify cost optimization opportunities
   */
  static identifyOptimizationOpportunities(dailyCosts, period = 30) {
    const recentCosts = dailyCosts.slice(-period);
    const stats = this.calculateStatistics(recentCosts.map(d => d.total));
    
    const opportunities = [];
    
    // Check for weekend savings opportunity
    const weekendDays = recentCosts.filter((_, i) => {
      const date = new Date(recentCosts[i].date);
      return date.getDay() === 0 || date.getDay() === 6;
    });
    
    const weekdayDays = recentCosts.filter((_, i) => {
      const date = new Date(recentCosts[i].date);
      return date.getDay() >= 1 && date.getDay() <= 5;
    });
    
    const avgWeekendCost = weekendDays.length > 0 
      ? weekendDays.reduce((sum, d) => sum + d.total, 0) / weekendDays.length 
      : 0;
    const avgWeekdayCost = weekdayDays.length > 0
      ? weekdayDays.reduce((sum, d) => sum + d.total, 0) / weekdayDays.length
      : 0;
    
    if (avgWeekendCost > 0 && avgWeekdayCost > 0) {
      const weekendRatio = avgWeekendCost / avgWeekdayCost;
      if (weekendRatio > 0.5) {
        const potentialSavings = (avgWeekendCost - avgWeekdayCost * 0.3) * 4; // 4 weekends
        opportunities.push({
          _id: 'opp-weekend',
          type: 'weekend_optimization',
          title: 'Weekend Cost Optimization',
          description: 'Your weekend costs are relatively high. Consider scheduling non-production resources to stop during weekends.',
          currentCost: parseFloat((avgWeekendCost * 8).toFixed(2)), // 8 weekend days
          potentialSavings: parseFloat(potentialSavings.toFixed(2)),
          confidence: 0.85,
          effort: 'low',
        });
      }
    }
    
    // Check for high variance opportunity
    const coefficientOfVariation = stats.stdDev / stats.mean;
    if (coefficientOfVariation > 0.3) {
      opportunities.push({
        _id: 'opp-variance',
        type: 'cost_stability',
        title: 'Reduce Cost Variability',
        description: 'Your costs show high variability. Consider reserved instances or savings plans for predictable workloads.',
        currentCost: parseFloat((stats.mean * 30).toFixed(2)),
        potentialSavings: parseFloat((stats.mean * 30 * 0.15).toFixed(2)), // 15% potential savings
        confidence: 0.75,
        effort: 'medium',
      });
    }
    
    // Check for high cost days
    const highCostDays = recentCosts.filter(d => d.total > stats.mean + stats.stdDev);
    if (highCostDays.length > 3) {
      opportunities.push({
        _id: 'opp-highdays',
        type: 'peak_optimization',
        title: 'Optimize Peak Cost Days',
        description: `${highCostDays.length} days had unusually high costs. Investigate patterns and consider cost allocation strategies.`,
        currentCost: parseFloat(highCostDays.reduce((sum, d) => sum + d.total, 0).toFixed(2)),
        potentialSavings: parseFloat((highCostDays.reduce((sum, d) => sum + d.total, 0) * 0.2).toFixed(2)),
        confidence: 0.70,
        effort: 'medium',
      });
    }
    
    return {
      period,
      opportunities,
      totalOpportunities: opportunities.length,
      totalPotentialSavings: parseFloat(opportunities.reduce((sum, o) => sum + o.potentialSavings, 0).toFixed(2)),
    };
  }

  /**
   * Run complete anomaly analysis
   */
  static runFullAnalysis(period = 30) {
    const CostAnalyticsService = require('./costAnalyticsService');
    const dailyCosts = CostAnalyticsService.generateDailyCosts(period + 30);
    
    const anomalyDetection = this.detectAnomalies(dailyCosts, period);
    const spikeDetection = this.detectCostSpikes(dailyCosts, 7);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(dailyCosts, period);
    const movingAverages = this.calculateMovingAverage(dailyCosts.slice(-period), 7);
    
    return {
      period,
      generatedAt: new Date().toISOString(),
      anomalyDetection,
      spikeDetection,
      optimizationOpportunities,
      movingAverages: movingAverages.slice(-14), // Last 14 days of moving averages
      summary: {
        overallHealth: anomalyDetection.healthScore >= 80 ? 'good' : anomalyDetection.healthScore >= 50 ? 'fair' : 'poor',
        healthScore: anomalyDetection.healthScore,
        totalAnomalies: anomalyDetection.totalAnomalies,
        totalSpikes: spikeDetection.totalSpikes,
        criticalIssues: spikeDetection.criticalSpikes + anomalyDetection.anomalies.filter(a => a.severity === 'error').length,
        potentialSavings: optimizationOpportunities.totalPotentialSavings,
      },
    };
  }
}

module.exports = AnomalyDetectionService;
