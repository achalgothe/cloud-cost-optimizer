const mongoose = require('mongoose');
const User = require('./models/User');
const Cost = require('./models/Cost');
const Resource = require('./models/Resource');
const Recommendation = require('./models/Recommendation');
const Budget = require('./models/Budget');

const seedData = async () => {
  try {
    // Connect to MongoDB
    const connectDB = require('./config/db');
    await connectDB();

    console.log('Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Cost.deleteMany({});
    await Resource.deleteMany({});
    await Recommendation.deleteMany({});
    await Budget.deleteMany({});

    // Create demo user
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@cloudoptimizer.com',
      password: 'password123',
      company: 'Tech Corp',
      role: 'user',
      cloudProviders: ['aws', 'azure', 'gcp'],
    });

    console.log(`Created user: ${user.email}`);

    // Create sample costs
    const providers = ['aws', 'azure', 'gcp'];
    const serviceTypes = ['compute', 'storage', 'database', 'network', 'analytics', 'ml'];
    const services = {
      aws: ['EC2', 'S3', 'RDS', 'Lambda', 'CloudFront', 'SageMaker'],
      azure: ['Virtual Machines', 'Blob Storage', 'SQL Database', 'Functions', 'CDN', 'ML Studio'],
      gcp: ['Compute Engine', 'Cloud Storage', 'Cloud SQL', 'Cloud Functions', 'Cloud CDN', 'AI Platform'],
    };
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

    const costs = [];
    const today = new Date();

    // Generate 90 days of cost data
    for (let day = 90; day >= 0; day--) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);

      providers.forEach((provider) => {
        serviceTypes.forEach((serviceType, index) => {
          const serviceName = services[provider][index];
          const region = regions[Math.floor(Math.random() * regions.length)];
          
          // Generate realistic cost data
          const baseCost = Math.random() * 50 + 10;
          const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
          const cost = baseCost * weekendMultiplier;

          costs.push({
            user: user._id,
            cloudProvider: provider,
            serviceName,
            serviceType,
            region,
            cost: parseFloat(cost.toFixed(2)),
            currency: 'USD',
            usageQuantity: Math.floor(Math.random() * 1000),
            usageUnit: 'hours',
            date,
            resourceId: `${provider}-${serviceType}-${Math.random().toString(36).substr(2, 9)}`,
            resourceName: `${serviceName}-${Math.floor(Math.random() * 100)}`,
            tags: [
              { key: 'Environment', value: Math.random() > 0.5 ? 'production' : 'development' },
              { key: 'Team', value: ['engineering', 'data', 'marketing'][Math.floor(Math.random() * 3)] },
            ],
          });
        });
      });
    }

    await Cost.insertMany(costs);
    console.log(`Created ${costs.length} cost records`);

    // Create sample resources
    const resources = [];
    providers.forEach((provider) => {
      for (let i = 0; i < 15; i++) {
        const cpuUtil = Math.random() * 100;
        const memoryUtil = Math.random() * 100;
        
        let status = 'optimal';
        if (cpuUtil < 10 && memoryUtil < 10) status = 'idle';
        else if (cpuUtil < 30 && memoryUtil < 30) status = 'underutilized';
        else if (cpuUtil > 80 || memoryUtil > 80) status = 'running';

        resources.push({
          user: user._id,
          cloudProvider: provider,
          resourceType: ['EC2', 'VM', 'Compute Instance'][providers.indexOf(provider)],
          resourceId: `${provider}-res-${Math.random().toString(36).substr(2, 9)}`,
          resourceName: `${provider === 'aws' ? 'EC2' : provider === 'azure' ? 'VM' : 'Instance'}-${i + 1}`,
          region: regions[Math.floor(Math.random() * regions.length)],
          status,
          utilization: {
            cpu: parseFloat(cpuUtil.toFixed(2)),
            memory: parseFloat(memoryUtil.toFixed(2)),
            storage: parseFloat((Math.random() * 100).toFixed(2)),
            network: parseFloat((Math.random() * 100).toFixed(2)),
          },
          cost: parseFloat((Math.random() * 200 + 50).toFixed(2)),
          currency: 'USD',
          specifications: {
            vcpu: (Math.floor(Math.random() * 8) + 1).toString(),
            memory: (Math.floor(Math.random() * 32) + 1).toString() + ' GB',
            storage: (Math.floor(Math.random() * 500) + 50).toString() + ' GB',
          },
          tags: [
            { key: 'Environment', value: Math.random() > 0.5 ? 'production' : 'development' },
          ],
          lastScannedAt: new Date(),
        });
      }
    });

    await Resource.insertMany(resources);
    console.log(`Created ${resources.length} resources`);

    // Create sample recommendations
    const recommendations = [
      {
        user: user._id,
        cloudProvider: 'aws',
        category: 'rightsizing',
        priority: 'high',
        title: 'Rightsize EC2 instance i-0abc123def',
        description: 'This EC2 instance has low utilization (CPU: 8%, Memory: 12%). Consider downsizing from m5.xlarge to m5.large.',
        estimatedSavings: 156.50,
        savingsPercentage: 45,
        implementationEffort: 'low',
        resourceId: 'i-0abc123def',
        resourceName: 'EC2-1',
        currentCost: 348.00,
        optimizedCost: 191.50,
        aiConfidence: 92,
        status: 'pending',
      },
      {
        user: user._id,
        cloudProvider: 'aws',
        category: 'idle_resources',
        priority: 'high',
        title: 'Review idle EC2 instance i-0xyz789',
        description: 'This EC2 instance appears to be idle (CPU: 2%, Memory: 5%). Consider stopping or terminating if not needed.',
        estimatedSavings: 285.00,
        savingsPercentage: 100,
        implementationEffort: 'low',
        resourceId: 'i-0xyz789',
        resourceName: 'EC2-2',
        currentCost: 285.00,
        optimizedCost: 0,
        aiConfidence: 88,
        status: 'pending',
      },
      {
        user: user._id,
        cloudProvider: 'azure',
        category: 'reserved_instances',
        priority: 'medium',
        title: 'Purchase Reserved VM Instances for Azure VMs',
        description: 'Based on consistent usage patterns for Virtual Machines, switching to Reserved Instances could save up to 30%.',
        estimatedSavings: 420.00,
        savingsPercentage: 30,
        implementationEffort: 'medium',
        currentCost: 1400.00,
        optimizedCost: 980.00,
        aiConfidence: 78,
        status: 'pending',
      },
      {
        user: user._id,
        cloudProvider: 'gcp',
        category: 'storage_optimization',
        priority: 'low',
        title: 'Move infrequently accessed data to Nearline storage',
        description: 'Approximately 40% of your Cloud Storage data hasn\'t been accessed in 30+ days. Consider using Nearline storage.',
        estimatedSavings: 85.00,
        savingsPercentage: 25,
        implementationEffort: 'low',
        aiConfidence: 72,
        status: 'pending',
      },
      {
        user: user._id,
        cloudProvider: 'aws',
        category: 'savings_plan',
        priority: 'medium',
        title: 'Enroll in Compute Savings Plan',
        description: 'Based on your consistent EC2 and Lambda usage, a 1-year Compute Savings Plan could save you 25%.',
        estimatedSavings: 580.00,
        savingsPercentage: 25,
        implementationEffort: 'medium',
        currentCost: 2320.00,
        optimizedCost: 1740.00,
        aiConfidence: 82,
        status: 'in_progress',
      },
    ];

    await Recommendation.insertMany(recommendations);
    console.log(`Created ${recommendations.length} recommendations`);

    // Create sample budgets
    const budgets = [
      {
        user: user._id,
        name: 'Monthly AWS Budget',
        cloudProvider: 'aws',
        amount: 5000,
        currency: 'USD',
        period: 'monthly',
        startDate: new Date(new Date().setDate(1)),
        thresholds: [
          { percentage: 50, action: 'email', recipients: ['admin@techcorp.com'] },
          { percentage: 80, action: 'email', recipients: ['admin@techcorp.com'] },
          { percentage: 100, action: 'email', recipients: ['admin@techcorp.com', 'finance@techcorp.com'] },
        ],
        alertsEnabled: true,
        status: 'active',
      },
      {
        user: user._id,
        name: 'Monthly Azure Budget',
        cloudProvider: 'azure',
        amount: 3000,
        currency: 'USD',
        period: 'monthly',
        startDate: new Date(new Date().setDate(1)),
        thresholds: [
          { percentage: 80, action: 'email', recipients: ['admin@techcorp.com'] },
        ],
        alertsEnabled: true,
        status: 'active',
      },
      {
        user: user._id,
        name: 'Total Cloud Budget',
        cloudProvider: 'all',
        amount: 10000,
        currency: 'USD',
        period: 'monthly',
        startDate: new Date(new Date().setDate(1)),
        thresholds: [
          { percentage: 75, action: 'email', recipients: ['finance@techcorp.com'] },
          { percentage: 100, action: 'email', recipients: ['finance@techcorp.com', 'cto@techcorp.com'] },
        ],
        alertsEnabled: true,
        status: 'active',
      },
    ];

    await Budget.insertMany(budgets);
    console.log(`Created ${budgets.length} budgets`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('Email: demo@cloudoptimizer.com');
    console.log('Password: password123');
    console.log('\nYou can now start the application with: npm run dev');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
