const AWSCostService = require('../services/awsCostService');
const AnalyticsEngine = require('../services/analyticsEngine');
const AIInsightsEngine = require('../services/aiInsightsEngine');
const Cost = require('../models/Cost');
const Resource = require('../models/Resource');
const Recommendation = require('../models/Recommendation');

/**
 * Data Flow Controller
 * User → Dashboard → Backend API → AWS Data → Analytics Engine → AI Insights → UI
 */

class DataFlowController {
  /**
   * Complete data flow: Fetch AWS data → Analyze → Generate AI insights → Return to UI
   */
  static async processCloudData(user, options = {}) {
    const {
      fetchFromAWS = false,
      awsCredentials = null,
      days = 30,
    } = options;

    const result = {
      success: false,
      data: {
        costs: null,
        resources: null,
        insights: null,
        recommendations: null,
      },
      metadata: {
        source: fetchFromAWS ? 'aws_api' : 'database',
        generatedAt: new Date().toISOString(),
      },
    };

    try {
      let costData, resourceData, historicalData;

      // Step 1: Fetch data from AWS or Database
      if (fetchFromAWS && awsCredentials) {
        console.log('📊 Fetching data from AWS...');
        const awsData = await this.fetchFromAWS(awsCredentials, days);
        costData = awsData.costData;
        resourceData = awsData.resourceData;
        historicalData = awsData.historicalData;

        // Save to database
        await this.saveToDatabase(user._id, costData, resourceData);
      } else {
        console.log('📊 Fetching data from database...');
        const dbData = await this.fetchFromDatabase(user._id, days);
        costData = dbData.costData;
        resourceData = dbData.resourceData;
        historicalData = dbData.historicalData;
      }

      // Step 2: Run Analytics Engine
      console.log('🔬 Running analytics engine...');
      const analyticsResults = this.runAnalytics(costData, resourceData, historicalData);

      // Step 3: Generate AI Insights
      console.log('🤖 Generating AI insights...');
      const insights = await this.generateAIInsights(costData, resourceData, historicalData);

      // Step 4: Save recommendations to database
      await this.saveRecommendations(user._id, insights.recommendations);

      // Step 5: Prepare response for UI
      result.data = {
        costs: {
          total: costData.totalCost,
          byService: costData.serviceCosts,
          daily: costData.dailyCosts,
        },
        resources: {
          total: resourceData.length,
          items: resourceData,
        },
        insights: {
          summary: insights.summary,
          anomalies: insights.anomalies,
          forecasts: insights.forecasts,
          naturalLanguageSummary: AIInsightsEngine.generateSummary(insights),
        },
        recommendations: {
          total: insights.recommendations.length,
          items: insights.recommendations,
          savingsPotential: insights.savingsPotential,
        },
      };

      result.metadata.analytics = analyticsResults;
      result.success = true;

      console.log('✅ Data flow completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Error in data flow:', error.message);
      result.error = error.message;
      return result;
    }
  }

  /**
   * Fetch data from AWS
   */
  static async fetchFromAWS(credentials, days = 30) {
    const awsService = new AWSCostService(
      credentials.accessKeyId,
      credentials.secretAccessKey,
      credentials.region
    );

    // Fetch cost data
    const costAndUsage = await awsService.getCostAndUsage(days);
    const costByService = await awsService.getCostByService(days);
    const costByRegion = await awsService.getCostByRegion(days);

    // Fetch resources
    const ec2Instances = await awsService.getEC2Instances();
    const rdsInstances = await awsService.getRDSInstances();
    const s3Buckets = await awsService.getS3BucketSizes();

    // Format cost data
    const costData = {
      totalCost: costAndUsage.totalCost,
      dailyCosts: costAndUsage.dailyCosts,
      serviceCosts: costAndUsage.serviceCosts,
      byRegion: costByRegion,
    };

    // Format resource data
    const resourceData = [
      ...ec2Instances.map(inst => ({
        resourceId: inst.instanceId,
        resourceName: `EC2-${inst.instanceType}`,
        resourceType: 'EC2',
        region: inst.availabilityZone,
        status: inst.state,
        utilization: { cpu: 0, memory: 0 }, // Will be populated by CloudWatch
        cost: 0, // Will be calculated from cost data
        specifications: {
          instanceType: inst.instanceType,
          cpuOptions: inst.cpuOptions,
          memory: inst.memoryInfo,
        },
      })),
      ...rdsInstances.map(inst => ({
        resourceId: inst.dbInstanceIdentifier,
        resourceName: `RDS-${inst.dbInstanceClass}`,
        resourceType: 'RDS',
        region: inst.availabilityZone,
        status: inst.dbInstanceStatus,
        utilization: { cpu: 0, memory: 0 },
        cost: 0,
        specifications: {
          instanceClass: inst.dbInstanceClass,
          engine: inst.engine,
          storage: inst.allocatedStorage,
        },
      })),
    ];

    // Historical data for trend analysis
    const historicalData = costAndUsage.dailyCosts.map(d => ({
      date: d.date,
      cost: d.cost,
    }));

    return {
      costData,
      resourceData,
      historicalData,
    };
  }

  /**
   * Fetch data from database
   */
  static async fetchFromDatabase(userId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch costs
    const costs = await Cost.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Fetch resources
    const resources = await Resource.find({ user: userId });

    // Aggregate cost data
    const dailyCosts = [];
    const serviceMap = new Map();

    costs.forEach(cost => {
      // Daily costs
      const dateStr = cost.date.toISOString().split('T')[0];
      let dayEntry = dailyCosts.find(d => d.date === dateStr);
      if (!dayEntry) {
        dayEntry = { date: dateStr, cost: 0 };
        dailyCosts.push(dayEntry);
      }
      dayEntry.cost += cost.cost;

      // Service costs
      if (!serviceMap.has(cost.serviceName)) {
        serviceMap.set(cost.serviceName, []);
      }
      serviceMap.get(cost.serviceName).push({
        date: dateStr,
        cost: cost.cost,
      });
    });

    const serviceCosts = Array.from(serviceMap.entries()).map(([service, data]) => ({
      service,
      data,
      total: data.reduce((sum, d) => sum + d.cost, 0),
    }));

    const costData = {
      totalCost: costs.reduce((sum, c) => sum + c.cost, 0),
      dailyCosts,
      serviceCosts,
    };

    const historicalData = dailyCosts.map(d => ({
      date: d.date,
      cost: d.cost,
    }));

    return {
      costData,
      resourceData: resources,
      historicalData,
    };
  }

  /**
   * Run analytics on data
   */
  static runAnalytics(costData, resourceData, historicalData) {
    // Analyze trends
    const trendAnalysis = AnalyticsEngine.analyzeCostTrends(historicalData);

    // Identify opportunities
    const opportunities = AnalyticsEngine.identifyOptimizationOpportunities(
      costData.serviceCosts,
      resourceData
    );

    // Calculate savings potential
    const savingsPotential = AnalyticsEngine.calculateSavingsPotential(opportunities);

    return {
      trend: trendAnalysis,
      opportunities,
      savingsPotential,
    };
  }

  /**
   * Generate AI insights
   */
  static async generateAIInsights(costData, resourceData, historicalData) {
    return await AIInsightsEngine.generateInsights(
      costData,
      resourceData,
      historicalData
    );
  }

  /**
   * Save data to database
   */
  static async saveToDatabase(userId, costData, resourceData) {
    try {
      // Save costs
      const costDocs = costData.dailyCosts.flatMap(day => {
        return costData.serviceCosts.map(service => {
          const serviceDayData = service.data.find(d => d.date === day.date);
          return {
            user: userId,
            cloudProvider: 'aws',
            serviceName: service.service,
            serviceType: this.categorizeService(service.service),
            region: 'us-east-1',
            cost: serviceDayData?.cost || 0,
            currency: 'USD',
            date: new Date(day.date),
          };
        });
      });

      if (costDocs.length > 0) {
        await Cost.insertMany(costDocs);
      }

      // Save resources
      const resourceDocs = resourceData.map(r => ({
        ...r,
        user: userId,
        cloudProvider: 'aws',
        lastScannedAt: new Date(),
      }));

      if (resourceDocs.length > 0) {
        await Resource.insertMany(resourceDocs);
      }

      console.log(`💾 Saved ${costDocs.length} cost records and ${resourceDocs.length} resources`);
    } catch (error) {
      console.error('Error saving to database:', error.message);
    }
  }

  /**
   * Save recommendations to database
   */
  static async saveRecommendations(userId, recommendations) {
    try {
      const recDocs = recommendations.map(rec => ({
        user: userId,
        cloudProvider: 'aws',
        category: rec.category,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        estimatedSavings: rec.estimatedSavings,
        savingsPercentage: rec.savingsPercentage,
        implementationEffort: rec.implementationEffort,
        aiConfidence: rec.aiConfidence,
        resourceId: rec.resourceId,
        status: 'pending',
      }));

      if (recDocs.length > 0) {
        await Recommendation.insertMany(recDocs);
        console.log(`💾 Saved ${recDocs.length} recommendations`);
      }
    } catch (error) {
      console.error('Error saving recommendations:', error.message);
    }
  }

  /**
   * Categorize AWS service
   */
  static categorizeService(serviceName) {
    const mapping = {
      'Amazon Elastic Compute Cloud': 'compute',
      'Amazon Simple Storage Service': 'storage',
      'Amazon Relational Database Service': 'database',
      'AWS Lambda': 'compute',
      'Amazon CloudFront': 'network',
      'Amazon EC2 Container Service': 'compute',
      'AWS Data Transfer': 'network',
    };

    return mapping[serviceName] || 'other';
  }
}

module.exports = DataFlowController;
