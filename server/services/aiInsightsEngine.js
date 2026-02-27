/**
 * AI Insights Engine
 * Generates intelligent recommendations using rule-based AI
 */

const AnalyticsEngine = require('./analyticsEngine');

class AIInsightsEngine {
  /**
   * Generate comprehensive insights from cost and resource data
   */
  static async generateInsights(costData, resourceData, historicalData) {
    const insights = {
      summary: {},
      anomalies: [],
      recommendations: [],
      forecasts: {},
      optimizations: [],
    };

    // 1. Analyze cost trends
    insights.summary = this.generateCostSummary(costData, historicalData);

    // 2. Detect anomalies
    insights.anomalies = this.detectAnomalies(historicalData);

    // 3. Generate recommendations
    insights.recommendations = await this.generateRecommendations(
      costData,
      resourceData,
      historicalData
    );

    // 4. Create forecasts
    insights.forecasts = AnalyticsEngine.forecastCosts(historicalData, 30);

    // 5. Identify optimizations
    insights.optimizations = AnalyticsEngine.identifyOptimizationOpportunities(
      costData.serviceCosts || [],
      resourceData
    );

    // 6. Calculate savings potential
    insights.savingsPotential = AnalyticsEngine.calculateSavingsPotential(
      insights.optimizations
    );

    return insights;
  }

  /**
   * Generate cost summary
   */
  static generateCostSummary(costData, historicalData) {
    const trendAnalysis = AnalyticsEngine.analyzeCostTrends(historicalData);

    return {
      totalCost: costData.totalCost || 0,
      averageDaily: trendAnalysis.averageDaily,
      projectedMonthly: trendAnalysis.projectedMonthly,
      trend: trendAnalysis.trend,
      trendPercentage: trendAnalysis.slope
        ? ((trendAnalysis.slope / trendAnalysis.averageDaily) * 100).toFixed(2)
        : 0,
      hasAnomaly: trendAnalysis.anomaly,
      topServices: (costData.serviceCosts || [])
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(s => ({
          name: s.service,
          cost: s.total,
          percentage: ((s.total / costData.totalCost) * 100).toFixed(1),
        })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Detect cost anomalies
   */
  static detectAnomalies(historicalData) {
    const anomalies = [];
    const trendAnalysis = AnalyticsEngine.analyzeCostTrends(historicalData);

    if (!trendAnalysis.anomaly) {
      return anomalies;
    }

    historicalData.forEach(day => {
      if (day.cost > trendAnalysis.anomalyThreshold) {
        anomalies.push({
          type: 'cost_spike',
          date: day.date,
          actualCost: day.cost,
          expectedCost: trendAnalysis.averageDaily,
          deviation: ((day.cost - trendAnalysis.averageDaily) / trendAnalysis.averageDaily * 100).toFixed(1),
          severity: day.cost > trendAnalysis.averageDaily * 2 ? 'high' : 'medium',
          message: `Cost spike detected on ${day.date}: $${day.cost.toFixed(2)} (${((day.cost - trendAnalysis.averageDaily) / trendAnalysis.averageDaily * 100).toFixed(1)}% above average)`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate AI-powered recommendations
   */
  static async generateRecommendations(costData, resourceData, historicalData) {
    const recommendations = [];

    // 1. Rightsizing recommendations
    recommendations.push(...this.generateRightsizingRecommendations(resourceData));

    // 2. Reserved Instance recommendations
    recommendations.push(...this.generateRIRecommendations(costData, historicalData));

    // 3. Idle resource recommendations
    recommendations.push(...this.generateIdleResourceRecommendations(resourceData));

    // 4. Storage optimization recommendations
    recommendations.push(...this.generateStorageRecommendations(costData));

    // 5. Architecture optimization recommendations
    recommendations.push(...this.generateArchitectureRecommendations(resourceData));

    // Sort by potential savings
    return recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  /**
   * Generate rightsizing recommendations
   */
  static generateRightsizingRecommendations(resources) {
    const recommendations = [];

    resources.forEach(resource => {
      if (!resource.utilization) return;

      const cpu = resource.utilization.cpu || 0;
      const memory = resource.utilization.memory || 0;
      const avgUtilization = (cpu + memory) / 2;

      if (avgUtilization < 40 && cpu < 50 && memory < 50) {
        const savings = resource.cost * 0.4; // 40% potential savings
        
        recommendations.push({
          category: 'rightsizing',
          priority: avgUtilization < 20 ? 'high' : 'medium',
          title: `Rightsize ${resource.resourceName || resource.resourceType}`,
          description: `This ${resource.resourceType} has low average utilization (${avgUtilization.toFixed(1)}%). Consider downsizing to a smaller instance type.`,
          details: {
            currentCPU: cpu,
            currentMemory: memory,
            currentCost: resource.cost,
            suggestedAction: 'Downsize instance',
          },
          estimatedSavings: parseFloat(savings.toFixed(2)),
          savingsPercentage: 40,
          implementationEffort: 'low',
          aiConfidence: Math.min(95, 70 + (40 - avgUtilization)),
          resourceId: resource.resourceId,
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate Reserved Instance recommendations
   */
  static generateRIRecommendations(costData, historicalData) {
    const recommendations = [];

    // Analyze consistent workloads
    (costData.serviceCosts || []).forEach(service => {
      if (service.total < 100) return; // Skip small services

      // Check for consistent usage
      if (service.data && service.data.length >= 30) {
        const costs = service.data.map(d => d.cost);
        const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
        const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avgCost;

        // Low variance = consistent workload = good RI candidate
        if (coefficientOfVariation < 0.3) {
          const riDiscount = 0.3; // 30% typical RI discount
          const savings = service.total * riDiscount;

          recommendations.push({
            category: 'reserved_instances',
            priority: service.total > 500 ? 'high' : 'medium',
            title: `Purchase Reserved Instances for ${service.service}`,
            description: `${service.service} shows consistent usage patterns. Reserved Instances could save up to 30% compared to On-Demand pricing.`,
            details: {
              serviceName: service.service,
              monthlyOnDemand: service.total,
              estimatedMonthlyRI: service.total * (1 - riDiscount),
              commitmentTerm: '1 year',
            },
            estimatedSavings: parseFloat(savings.toFixed(2)),
            savingsPercentage: 30,
            implementationEffort: 'medium',
            aiConfidence: Math.min(90, 75 + (0.3 - coefficientOfVariation) * 50),
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Generate idle resource recommendations
   */
  static generateIdleResourceRecommendations(resources) {
    const recommendations = [];

    resources.forEach(resource => {
      if (!resource.utilization) return;

      const cpu = resource.utilization.cpu || 0;
      const memory = resource.utilization.memory || 0;

      if (cpu < 5 && memory < 5) {
        recommendations.push({
          category: 'idle_resources',
          priority: 'high',
          title: `Terminate or stop idle ${resource.resourceName || resource.resourceType}`,
          description: `This ${resource.resourceType} appears to be idle (CPU: ${cpu}%, Memory: ${memory}%). Consider stopping or terminating if not needed.`,
          details: {
            cpu: cpu,
            memory: memory,
            monthlyCost: resource.cost,
            suggestedAction: cpu < 2 ? 'Terminate' : 'Stop',
          },
          estimatedSavings: parseFloat(resource.cost.toFixed(2)),
          savingsPercentage: 100,
          implementationEffort: 'low',
          aiConfidence: 85,
          resourceId: resource.resourceId,
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate storage optimization recommendations
   */
  static generateStorageRecommendations(costData) {
    const recommendations = [];

    const storageService = (costData.serviceCosts || []).find(
      s => s.service?.includes('S3') || s.service?.includes('Storage')
    );

    if (storageService && storageService.total > 100) {
      recommendations.push({
        category: 'storage_optimization',
        priority: 'medium',
        title: 'Optimize S3 storage classes',
        description: 'Consider moving infrequently accessed data to S3 Infrequent Access or Glacier for significant cost savings.',
        details: {
          currentStorageCost: storageService.total,
          estimatedSavingsPercentage: 40,
          actions: [
            'Enable S3 Intelligent-Tiering',
            'Move old data to Glacier',
            'Set up lifecycle policies',
          ],
        },
        estimatedSavings: parseFloat((storageService.total * 0.4).toFixed(2)),
        savingsPercentage: 40,
        implementationEffort: 'medium',
        aiConfidence: 70,
      });
    }

    return recommendations;
  }

  /**
   * Generate architecture optimization recommendations
   */
  static generateArchitectureRecommendations(resources) {
    const recommendations = [];

    // Check for single AZ deployments
    const azDistribution = {};
    resources.forEach(resource => {
      const az = resource.region || resource.availabilityZone || 'unknown';
      if (!azDistribution[az]) {
        azDistribution[az] = 0;
      }
      azDistribution[az]++;
    });

    const totalResources = resources.length;
    const maxInOneAZ = Math.max(...Object.values(azDistribution));

    if (totalResources > 5 && maxInOneAZ / totalResources > 0.8) {
      recommendations.push({
        category: 'architecture',
        priority: 'medium',
        title: 'Improve high availability',
        description: 'Most resources are in a single Availability Zone. Consider distributing across multiple AZs for better fault tolerance.',
        details: {
          azDistribution,
          risk: 'Single point of failure',
        },
        estimatedSavings: 0, // This is about reliability, not cost
        implementationEffort: 'high',
        aiConfidence: 80,
      });
    }

    // Check for Spot Instance opportunities
    const statelessResources = resources.filter(r => 
      r.resourceType?.includes('EC2') && 
      r.utilization?.cpu < 60
    );

    if (statelessResources.length > 3) {
      const potentialSavings = statelessResources.reduce((sum, r) => sum + (r.cost || 0) * 0.6, 0);
      
      recommendations.push({
        category: 'spot_instances',
        priority: 'medium',
        title: 'Use Spot Instances for fault-tolerant workloads',
        description: `${statelessResources.length} instances could potentially use Spot pricing for up to 70% savings.`,
        details: {
          eligibleInstances: statelessResources.length,
          averageSavings: 60,
        },
        estimatedSavings: parseFloat(potentialSavings.toFixed(2)),
        savingsPercentage: 60,
        implementationEffort: 'medium',
        aiConfidence: 75,
      });
    }

    return recommendations;
  }

  /**
   * Generate natural language summary
   */
  static generateSummary(insights) {
    const { summary, anomalies, savingsPotential } = insights;

    let summaryText = `Your cloud spending this period is $${summary.totalCost.toFixed(2)}`;

    if (summary.trend === 'increasing') {
      summaryText += `, showing an increasing trend (${summary.trendPercentage}% above average).`;
    } else if (summary.trend === 'decreasing') {
      summaryText += `, showing a decreasing trend (${Math.abs(summary.trendPercentage)}% below average).`;
    } else {
      summaryText += ', remaining relatively stable.';
    }

    if (anomalies.length > 0) {
      summaryText += ` We detected ${anomalies.length} cost anomalies that require attention.`;
    }

    if (savingsPotential.total > 0) {
      summaryText += ` You could save up to $${savingsPotential.total.toFixed(2)} per month by implementing our ${savingsPotential.count} optimization recommendations.`;
    }

    return summaryText;
  }
}

module.exports = AIInsightsEngine;
