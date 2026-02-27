const AWS = require('aws-sdk');
const CostExplorer = require('aws-sdk/clients/costexplorer');
const EC2 = require('aws-sdk/clients/ec2');

class AWSCostService {
  constructor(accessKeyId, secretAccessKey, region = 'us-east-1') {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;

    // Initialize AWS SDK
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    this.costExplorer = new CostExplorer({ region: 'us-east-1' });
    this.ec2 = new EC2();
  }

  /**
   * Get cost and usage data for the last N days
   */
  async getCostAndUsage(days = 30) {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const params = {
        TimePeriod: {
          Start: start.toISOString().split('T')[0],
          End: end.toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost', 'UsageQuantity'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const response = await this.costExplorer.getCostAndUsage(params).promise();
      
      return this.parseCostAndUsageResponse(response.ResultsByTime);
    } catch (error) {
      console.error('Error fetching AWS cost data:', error.message);
      throw error;
    }
  }

  /**
   * Get cost by service
   */
  async getCostByService(days = 30) {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const params = {
        TimePeriod: {
          Start: start.toISOString().split('T')[0],
          End: end.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      };

      const response = await this.costExplorer.getCostAndUsage(params).promise();
      
      return response.ResultsByTime[0]?.Groups?.map(group => ({
        service: group.Keys[0],
        cost: parseFloat(group.Metrics.UnblendedCost.Amount),
        usageQuantity: parseFloat(group.Metrics.UsageQuantity?.Amount || 0),
      })) || [];
    } catch (error) {
      console.error('Error fetching AWS cost by service:', error.message);
      throw error;
    }
  }

  /**
   * Get cost by region
   */
  async getCostByRegion(days = 30) {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const params = {
        TimePeriod: {
          Start: start.toISOString().split('T')[0],
          End: end.toISOString().split('T')[0],
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'REGION',
          },
        ],
      };

      const response = await this.costExplorer.getCostAndUsage(params).promise();
      
      return response.ResultsByTime[0]?.Groups?.map(group => ({
        region: group.Keys[0],
        cost: parseFloat(group.Metrics.UnblendedCost.Amount),
      })) || [];
    } catch (error) {
      console.error('Error fetching AWS cost by region:', error.message);
      throw error;
    }
  }

  /**
   * Get EC2 instances with utilization data
   */
  async getEC2Instances() {
    try {
      const instances = await this.ec2.describeInstances().promise();
      
      const allInstances = instances.Reservations.flatMap(reservation =>
        reservation.Instances.map(instance => ({
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          launchTime: instance.LaunchTime,
          availabilityZone: instance.Placement?.AvailabilityZone,
          platform: instance.Platform || 'linux',
          cpuOptions: instance.CpuOptions?.CoreCount || 0,
          memoryInfo: instance.MemoryInfo?.SizeInMiB || 0,
        }))
      );

      return allInstances;
    } catch (error) {
      console.error('Error fetching EC2 instances:', error.message);
      throw error;
    }
  }

  /**
   * Get EC2 CloudWatch metrics (CPU utilization)
   */
  async getEC2Metrics(instanceId, days = 7) {
    try {
      const CloudWatch = require('aws-sdk/clients/cloudwatch');
      const cloudwatch = new CloudWatch();

      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const params = {
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: instanceId,
          },
        ],
        StartTime: start,
        EndTime: end,
        Period: 86400, // 1 day
        Statistics: ['Average'],
      };

      const response = await cloudwatch.getMetricStatistics(params).promise();
      
      return response.Datapoints.map(point => ({
        timestamp: point.Timestamp,
        average: point.Average,
      }));
    } catch (error) {
      console.error('Error fetching EC2 metrics:', error.message);
      return [];
    }
  }

  /**
   * Get S3 bucket sizes
   */
  async getS3BucketSizes() {
    try {
      const S3 = require('aws-sdk/clients/s3');
      const s3 = new S3();

      const buckets = await s3.listBuckets().promise();
      
      const bucketSizes = await Promise.all(
        buckets.Buckets.map(async (bucket) => {
          const params = {
            Bucket: bucket.Name,
          };
          
          // Get bucket location
          const location = await s3.getBucketLocation(params).promise();
          
          return {
            name: bucket.Name,
            creationDate: bucket.CreationDate,
            location: location.LocationConstraint || 'us-east-1',
          };
        })
      );

      return bucketSizes;
    } catch (error) {
      console.error('Error fetching S3 bucket sizes:', error.message);
      return [];
    }
  }

  /**
   * Get RDS instances
   */
  async getRDSInstances() {
    try {
      const RDS = require('aws-sdk/clients/rds');
      const rds = new RDS();

      const instances = await rds.describeDBInstances().promise();
      
      return instances.DBInstances.map(db => ({
        dbInstanceIdentifier: db.DBInstanceIdentifier,
        dbInstanceClass: db.DBInstanceClass,
        engine: db.Engine,
        engineVersion: db.EngineVersion,
        dbInstanceStatus: db.DBInstanceStatus,
        allocatedStorage: db.AllocatedStorage,
        multiAZ: db.MultiAZ,
        availabilityZone: db.AvailabilityZone,
        endpoint: db.Endpoint?.Address,
      }));
    } catch (error) {
      console.error('Error fetching RDS instances:', error.message);
      return [];
    }
  }

  /**
   * Parse cost and usage response
   */
  parseCostAndUsageResponse(resultsByTime) {
    const dailyCosts = [];
    const serviceCosts = new Map();

    resultsByTime.forEach(result => {
      const date = result.TimePeriod.Start;
      const totalCost = parseFloat(result.Total?.UnblendedCost?.Amount || 0);

      dailyCosts.push({
        date,
        cost: totalCost,
      });

      result.Groups?.forEach(group => {
        const service = group.Keys[0];
        const cost = parseFloat(group.Metrics.UnblendedCost.Amount);

        if (!serviceCosts.has(service)) {
          serviceCosts.set(service, []);
        }

        serviceCosts.get(service).push({
          date,
          cost,
        });
      });
    });

    return {
      dailyCosts,
      serviceCosts: Array.from(serviceCosts.entries()).map(([service, data]) => ({
        service,
        data,
        total: data.reduce((sum, d) => sum + d.cost, 0),
      })),
      totalCost: dailyCosts.reduce((sum, d) => sum + d.cost, 0),
    };
  }

  /**
   * Get recommendations (AWS native)
   */
  async getComputeOptimizationRecommendations() {
    try {
      const ComputeOptimizer = require('aws-sdk/clients/computeoptimizer');
      const optimizer = new ComputeOptimizer();

      const ec2Recommendations = await optimizer.getEC2InstanceRecommendations().promise();
      
      return ec2Recommendations.instanceRecommendations?.map(rec => ({
        instanceId: rec.instanceArn,
        currentInstanceType: rec.currentInstanceType,
        recommendationSource: rec.recommendationSources?.[0],
        finding: rec.finding, // Active, Optimized, Underprovisioned, Overprovisioned
        savingsOpportunity: rec.savingsOpportunity?.savingsOpportunityPercentage,
        estimatedMonthlySavings: rec.savingsOpportunity?.estimatedMonthlySavings,
      })) || [];
    } catch (error) {
      console.error('Error fetching compute optimizer recommendations:', error.message);
      return [];
    }
  }
}

module.exports = AWSCostService;
