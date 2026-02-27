/**
 * Cost Analytics Engine
 * - Fetch costs for 30/60/90 days
 * - Service-wise breakdown
 * - Daily trend analysis
 */

class CostAnalyticsService {
  /**
   * Generate mock cost data for analytics
   */
  static generateDailyCosts(days = 90) {
    const costs = [];
    const now = new Date();
    const baseCost = 150; // Base daily cost
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic variation
      const dayOfWeek = date.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
      const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      
      // Add occasional spikes (5% chance)
      const spikeMultiplier = Math.random() < 0.05 ? 1.5 + Math.random() : 1.0;
      
      const total = baseCost * weekendMultiplier * randomVariation * spikeMultiplier;
      
      costs.push({
        _id: date.toISOString().split('T')[0],
        date: date.toISOString(),
        total: parseFloat(total.toFixed(2)),
        aws: parseFloat((total * 0.55 * randomVariation).toFixed(2)),
        azure: parseFloat((total * 0.30 * randomVariation).toFixed(2)),
        gcp: parseFloat((total * 0.15 * randomVariation).toFixed(2)),
        services: {
          compute: parseFloat((total * 0.45).toFixed(2)),
          storage: parseFloat((total * 0.25).toFixed(2)),
          database: parseFloat((total * 0.18).toFixed(2)),
          network: parseFloat((total * 0.12).toFixed(2)),
        },
      });
    }
    
    return costs;
  }

  /**
   * Get cost overview for specified period
   */
  static getCostOverview(period = 30) {
    const dailyCosts = this.generateDailyCosts(period);
    
    const totalCost = dailyCosts.reduce((sum, day) => sum + day.total, 0);
    const avgDailyCost = totalCost / period;
    
    const costByProvider = [
      { 
        _id: 'aws', 
        name: 'Amazon Web Services',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.aws, 0).toFixed(2)),
        percentage: 0,
      },
      { 
        _id: 'azure', 
        name: 'Microsoft Azure',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.azure, 0).toFixed(2)),
        percentage: 0,
      },
      { 
        _id: 'gcp', 
        name: 'Google Cloud Platform',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.gcp, 0).toFixed(2)),
        percentage: 0,
      },
    ];
    
    // Calculate percentages
    costByProvider.forEach(p => {
      p.percentage = parseFloat(((p.total / totalCost) * 100).toFixed(1));
    });
    
    const costByServiceType = [
      { 
        _id: 'compute', 
        name: 'Compute',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.services.compute, 0).toFixed(2)),
      },
      { 
        _id: 'storage', 
        name: 'Storage',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.services.storage, 0).toFixed(2)),
      },
      { 
        _id: 'database', 
        name: 'Database',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.services.database, 0).toFixed(2)),
      },
      { 
        _id: 'network', 
        name: 'Network',
        total: parseFloat(dailyCosts.reduce((sum, day) => sum + day.services.network, 0).toFixed(2)),
      },
    ];
    
    // Top spending services
    const topServices = [
      { _id: 'EC2', provider: 'aws', name: 'Amazon EC2', total: parseFloat((totalCost * 0.25).toFixed(2)) },
      { _id: 'VMs', provider: 'azure', name: 'Azure Virtual Machines', total: parseFloat((totalCost * 0.18).toFixed(2)) },
      { _id: 'S3', provider: 'aws', name: 'Amazon S3', total: parseFloat((totalCost * 0.12).toFixed(2)) },
      { _id: 'GCE', provider: 'gcp', name: 'Compute Engine', total: parseFloat((totalCost * 0.10).toFixed(2)) },
      { _id: 'RDS', provider: 'aws', name: 'Amazon RDS', total: parseFloat((totalCost * 0.08).toFixed(2)) },
    ];
    
    return {
      period,
      totalCost: parseFloat(totalCost.toFixed(2)),
      avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
      costByProvider,
      costByServiceType,
      dailyTrend: dailyCosts,
      topServices,
      summary: {
        highestDay: dailyCosts.reduce((max, day) => day.total > max.total ? day : max, dailyCosts[0]),
        lowestDay: dailyCosts.reduce((min, day) => day.total < min.total ? day : min, dailyCosts[0]),
        trend: totalCost > (period * 140) ? 'increasing' : totalCost < (period * 120) ? 'decreasing' : 'stable',
      },
    };
  }

  /**
   * Get cost breakdown by specific dimension
   */
  static getCostBreakdown(dimension = 'service', period = 30) {
    const overview = this.getCostOverview(period);
    
    switch (dimension) {
      case 'provider':
        return {
          dimension,
          period,
          breakdown: overview.costByProvider,
          total: overview.totalCost,
        };
      case 'service':
        return {
          dimension,
          period,
          breakdown: overview.costByServiceType,
          total: overview.totalCost,
        };
      case 'daily':
        return {
          dimension,
          period,
          breakdown: overview.dailyTrend,
          total: overview.totalCost,
        };
      default:
        return {
          dimension,
          period,
          breakdown: overview.costByServiceType,
          total: overview.totalCost,
        };
    }
  }

  /**
   * Compare costs between two periods
   */
  static comparePeriods(currentPeriod = 30, previousPeriod = 30) {
    const current = this.getCostOverview(currentPeriod);
    const previous = this.getCostOverview(previousPeriod);
    
    const change = current.totalCost - previous.totalCost;
    const changePercent = ((change / previous.totalCost) * 100);
    
    return {
      current: {
        period: currentPeriod,
        total: current.totalCost,
        avgDaily: current.avgDailyCost,
      },
      previous: {
        period: previousPeriod,
        total: previous.totalCost,
        avgDaily: previous.avgDailyCost,
      },
      change: {
        absolute: parseFloat(change.toFixed(2)),
        percentage: parseFloat(changePercent.toFixed(2)),
        direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no_change',
      },
      insight: changePercent > 10 
        ? `Costs increased by ${changePercent.toFixed(1)}% compared to previous period`
        : changePercent < -10
        ? `Costs decreased by ${Math.abs(changePercent).toFixed(1)}% compared to previous period`
        : 'Costs remained stable compared to previous period',
    };
  }

  /**
   * Forecast costs for next N days
   */
  static forecastCosts(days = 7, period = 30) {
    const overview = this.getCostOverview(period);
    const dailyTrend = overview.dailyTrend;
    
    // Simple linear regression forecast
    const n = dailyTrend.length;
    const sumX = n * (n - 1) / 2;
    const sumY = dailyTrend.reduce((sum, d) => sum + d.total, 0);
    const sumXY = dailyTrend.reduce((sum, d, i) => sum + i * d.total, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecast = [];
    const now = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const predicted = intercept + slope * (n + i);
      const confidence = Math.max(0.7, 1 - (i * 0.05)); // Decreasing confidence
      
      forecast.push({
        _id: date.toISOString().split('T')[0],
        date: date.toISOString(),
        predicted: parseFloat(predicted.toFixed(2)),
        lowerBound: parseFloat((predicted * 0.9).toFixed(2)),
        upperBound: parseFloat((predicted * 1.1).toFixed(2)),
        confidence: parseFloat(confidence.toFixed(2)),
      });
    }
    
    return {
      period: days,
      basedOnPeriod: period,
      forecast,
      totalForecast: parseFloat(forecast.reduce((sum, f) => sum + f.predicted, 0).toFixed(2)),
      avgDailyForecast: parseFloat((forecast.reduce((sum, f) => sum + f.predicted, 0) / days).toFixed(2)),
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    };
  }
}

module.exports = CostAnalyticsService;
