/**
 * Analytics Engine
 * Processes raw cloud cost data and generates insights
 */

class AnalyticsEngine {
  /**
   * Analyze cost trends and detect anomalies
   */
  static analyzeCostTrends(dailyCosts) {
    if (!dailyCosts || dailyCosts.length < 7) {
      return {
        trend: 'insufficient_data',
        averageDaily: 0,
        projectedMonthly: 0,
        anomaly: false,
      };
    }

    const costs = dailyCosts.map(d => d.cost);
    const averageDaily = costs.reduce((a, b) => a + b, 0) / costs.length;
    const projectedMonthly = averageDaily * 30;

    // Calculate trend (simple linear regression)
    const n = costs.length;
    const sumX = n * (n + 1) / 2;
    const sumY = costs.reduce((a, b) => a + b, 0);
    const sumXY = costs.reduce((sum, cost, i) => sum + (i + 1) * cost, 0);
    const sumX2 = n * (n + 1) * (2 * n + 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    let trend = 'stable';
    if (slope > averageDaily * 0.01) trend = 'increasing';
    if (slope < -averageDaily * 0.01) trend = 'decreasing';

    // Detect anomalies (values > 2 standard deviations)
    const mean = averageDaily;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;
    
    const anomalies = costs.filter(cost => cost > threshold);
    const hasAnomaly = anomalies.length > 0;

    return {
      trend,
      averageDaily,
      projectedMonthly,
      slope,
      anomaly: hasAnomaly,
      anomalyThreshold: threshold,
      standardDeviation: stdDev,
    };
  }

  /**
   * Identify cost optimization opportunities
   */
  static identifyOptimizationOpportunities(serviceCosts, resources = []) {
    const opportunities = [];

    // Analyze service costs
    serviceCosts.forEach(service => {
      const percentage = (service.total / serviceCosts.reduce((a, b) => a + b.total, 0)) * 100;

      // High spending services
      if (percentage > 30) {
        opportunities.push({
          type: 'high_spend_service',
          service: service.service,
          cost: service.total,
          percentage,
          priority: 'high',
          recommendation: `Review ${service.service} spending - represents ${percentage.toFixed(1)}% of total costs`,
          potentialSavings: service.total * 0.15, // Estimate 15% savings potential
        });
      }

      // Services with rapid growth
      if (service.data.length >= 7) {
        const recentWeek = service.data.slice(-7).reduce((a, b) => a + b.cost, 0);
        const previousWeek = service.data.slice(0, -7).reduce((a, b) => a + b.cost, 0);
        const growth = previousWeek > 0 ? ((recentWeek - previousWeek) / previousWeek) * 100 : 0;

        if (growth > 20) {
          opportunities.push({
            type: 'rapid_growth',
            service: service.service,
            cost: service.total,
            growth,
            priority: 'medium',
            recommendation: `${service.service} costs grew ${growth.toFixed(1)}% - investigate cause`,
            potentialSavings: service.total * 0.10,
          });
        }
      }
    });

    // Analyze resources for rightsizing
    resources.forEach(resource => {
      if (resource.utilization) {
        const cpu = resource.utilization.cpu || 0;
        const memory = resource.utilization.memory || 0;

        // Underutilized resources
        if (cpu < 20 && memory < 20) {
          opportunities.push({
            type: 'underutilized_resource',
            resource: resource.resourceName || resource.resourceId,
            resourceType: resource.resourceType,
            cpu,
            memory,
            cost: resource.cost,
            priority: cpu < 10 ? 'high' : 'medium',
            recommendation: `Rightsize ${resource.resourceType} - CPU: ${cpu}%, Memory: ${memory}%`,
            potentialSavings: resource.cost * 0.40, // 40% savings from rightsizing
          });
        }

        // Idle resources
        if (cpu < 5 && memory < 5) {
          opportunities.push({
            type: 'idle_resource',
            resource: resource.resourceName || resource.resourceId,
            resourceType: resource.resourceType,
            cpu,
            memory,
            cost: resource.cost,
            priority: 'high',
            recommendation: `Consider terminating idle ${resource.resourceType}`,
            potentialSavings: resource.cost, // 100% savings
          });
        }
      }
    });

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Calculate ROI for reserved instances
   */
  static calculateReservedInstanceROI(onDemandCost, reservedCost, termYears = 1) {
    const totalOnDemand = onDemandCost * 12 * termYears;
    const totalReserved = reservedCost * 12 * termYears;
    const savings = totalOnDemand - totalReserved;
    const roi = (savings / totalReserved) * 100;
    const paybackPeriod = totalReserved / (totalOnDemand / 12); // months

    return {
      onDemandTotal: totalOnDemand,
      reservedTotal: totalReserved,
      savings,
      roi,
      paybackPeriod: Math.round(paybackPeriod),
      breakEvenMonth: Math.ceil(reservedCost / (onDemandCost - reservedCost)),
    };
  }

  /**
   * Forecast future costs
   */
  static forecastCosts(historicalData, days = 30) {
    if (!historicalData || historicalData.length < 14) {
      return { forecast: [], confidence: 'low' };
    }

    // Simple moving average with trend
    const windowSize = 7;
    const recentData = historicalData.slice(-windowSize);
    const averageRecent = recentData.reduce((a, b) => a + b.cost, 0) / recentData.length;

    // Calculate trend
    const olderData = historicalData.slice(-14, -7);
    const averageOlder = olderData.reduce((a, b) => a + b.cost, 0) / olderData.length;
    const trend = (averageRecent - averageOlder) / averageOlder;

    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Apply trend with some dampening
      const dampenedTrend = trend * 0.5;
      const predicted = averageRecent * (1 + dampenedTrend * (i / days));

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: parseFloat(predicted.toFixed(2)),
        low: parseFloat((predicted * 0.9).toFixed(2)), // Confidence interval
        high: parseFloat((predicted * 1.1).toFixed(2)),
      });
    }

    return {
      forecast,
      confidence: historicalData.length >= 30 ? 'high' : 'medium',
      averageDaily: averageRecent,
      trend: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
      projectedMonthly: parseFloat((averageRecent * 30).toFixed(2)),
    };
  }

  /**
   * Generate cost allocation tags analysis
   */
  static analyzeTags(resources) {
    const tagAnalysis = {};

    resources.forEach(resource => {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(tag => {
          const key = tag.key || 'untagged';
          const value = tag.value || 'unknown';

          if (!tagAnalysis[key]) {
            tagAnalysis[key] = {};
          }

          if (!tagAnalysis[key][value]) {
            tagAnalysis[key][value] = {
              count: 0,
              totalCost: 0,
              resources: [],
            };
          }

          tagAnalysis[key][value].count++;
          tagAnalysis[key][value].totalCost += resource.cost || 0;
          tagAnalysis[key][value].resources.push(resource.resourceName || resource.resourceId);
        });
      }
    });

    // Format and sort
    const formatted = Object.entries(tagAnalysis).map(([key, values]) => ({
      tag: key,
      values: Object.entries(values).map(([value, data]) => ({
        value,
        count: data.count,
        cost: data.totalCost,
        resources: data.resources.slice(0, 5), // Top 5 resources
      })).sort((a, b) => b.cost - a.cost),
    }));

    return formatted;
  }

  /**
   * Calculate savings potential
   */
  static calculateSavingsPotential(opportunities) {
    const total = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
    
    const byPriority = {
      high: opportunities.filter(o => o.priority === 'high').reduce((sum, o) => sum + o.potentialSavings, 0),
      medium: opportunities.filter(o => o.priority === 'medium').reduce((sum, o) => sum + o.potentialSavings, 0),
      low: opportunities.filter(o => o.priority === 'low').reduce((sum, o) => sum + o.potentialSavings, 0),
    };

    const byType = {};
    opportunities.forEach(opp => {
      if (!byType[opp.type]) {
        byType[opp.type] = 0;
      }
      byType[opp.type] += opp.potentialSavings;
    });

    return {
      total,
      byPriority,
      byType,
      count: opportunities.length,
      averagePerOpportunity: total / (opportunities.length || 1),
    };
  }
}

module.exports = AnalyticsEngine;
