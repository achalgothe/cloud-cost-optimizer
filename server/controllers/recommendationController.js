const Recommendation = require('../models/Recommendation');
const Cost = require('../models/Cost');
const Resource = require('../models/Resource');

// @desc    Get AI-powered recommendations
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const { status, priority, provider, category } = req.query;
    const user = req.user._id;

    const filter = { user };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (provider) filter.cloudProvider = provider;
    if (category) filter.category = category;

    const recommendations = await Recommendation.find(filter)
      .sort({ priority: 1, estimatedSavings: -1 })
      .populate('user', 'name email');

    // Calculate summary
    const summary = {
      total: recommendations.length,
      byPriority: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length,
      },
      totalEstimatedSavings: recommendations.reduce((acc, r) => acc + r.estimatedSavings, 0),
      byStatus: {
        pending: recommendations.filter(r => r.status === 'pending').length,
        inProgress: recommendations.filter(r => r.status === 'in_progress').length,
        implemented: recommendations.filter(r => r.status === 'implemented').length,
      },
    };

    res.json({
      success: true,
      data: {
        recommendations,
        summary,
      },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
};

// @desc    Generate AI recommendations
// @route   POST /api/recommendations/generate
// @access  Private
const generateRecommendations = async (req, res) => {
  try {
    const user = req.user._id;
    const { provider } = req.body;

    // Get user's resources and costs
    const resourceFilter = { user };
    if (provider) resourceFilter.cloudProvider = provider;

    const resources = await Resource.find(resourceFilter);
    const costs = await Cost.find(resourceFilter);

    const recommendations = [];

    // Analyze resources for optimization opportunities
    for (const resource of resources) {
      // Check for underutilized resources
      if (resource.utilization) {
        const cpuUtil = resource.utilization.cpu || 0;
        const memoryUtil = resource.utilization.memory || 0;

        // Rightsizing recommendation
        if (cpuUtil < 30 && memoryUtil < 30) {
          const estimatedSavings = resource.cost * 0.4; // Estimate 40% savings
          
          recommendations.push({
            user,
            cloudProvider: resource.cloudProvider,
            category: 'rightsizing',
            priority: cpuUtil < 10 ? 'high' : 'medium',
            title: `Rightsize ${resource.resourceName || resource.resourceType}`,
            description: `This ${resource.resourceType} instance has low utilization (CPU: ${cpuUtil}%, Memory: ${memoryUtil}%). Consider downsizing to a smaller instance type.`,
            estimatedSavings,
            savingsPercentage: 40,
            implementationEffort: 'low',
            resourceId: resource.resourceId,
            resourceName: resource.resourceName,
            currentCost: resource.cost,
            optimizedCost: resource.cost - estimatedSavings,
            aiConfidence: Math.min(95, 70 + (30 - Math.max(cpuUtil, memoryUtil))),
          });
        }

        // Idle resource recommendation
        if (cpuUtil < 5 && memoryUtil < 5) {
          recommendations.push({
            user,
            cloudProvider: resource.cloudProvider,
            category: 'idle_resources',
            priority: 'high',
            title: `Review idle resource: ${resource.resourceName || resource.resourceType}`,
            description: `This ${resource.resourceType} appears to be idle (CPU: ${cpuUtil}%, Memory: ${memoryUtil}%). Consider stopping or terminating if not needed.`,
            estimatedSavings: resource.cost,
            savingsPercentage: 100,
            implementationEffort: 'low',
            resourceId: resource.resourceId,
            resourceName: resource.resourceName,
            currentCost: resource.cost,
            optimizedCost: 0,
            aiConfidence: 85,
          });
        }
      }
    }

    // Analyze spending patterns for reserved instance recommendations
    const costByService = {};
    costs.forEach(cost => {
      const key = `${cost.cloudProvider}-${cost.serviceName}`;
      if (!costByService[key]) {
        costByService[key] = {
          cloudProvider: cost.cloudProvider,
          serviceName: cost.serviceName,
          totalCost: 0,
          count: 0,
        };
      }
      costByService[key].totalCost += cost.cost;
      costByService[key].count += 1;
    });

    // Generate reserved instance recommendations for consistent workloads
    Object.values(costByService).forEach(service => {
      if (service.totalCost > 100 && service.count > 30) {
        const estimatedSavings = service.totalCost * 0.3; // 30% savings with RI
        
        recommendations.push({
          user,
          cloudProvider: service.cloudProvider,
          category: 'reserved_instances',
          priority: 'medium',
          title: `Purchase Reserved Instances for ${service.serviceName}`,
          description: `Based on consistent usage patterns for ${service.serviceName}, switching to Reserved Instances could save up to 30% compared to On-Demand pricing.`,
          estimatedSavings,
          savingsPercentage: 30,
          implementationEffort: 'medium',
          currentCost: service.totalCost,
          optimizedCost: service.totalCost - estimatedSavings,
          aiConfidence: 75,
        });
      }
    });

    // Save recommendations to database
    const savedRecommendations = await Recommendation.insertMany(recommendations);

    res.json({
      success: true,
      message: `Generated ${savedRecommendations.length} recommendations`,
      data: {
        recommendations: savedRecommendations,
        count: savedRecommendations.length,
      },
    });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ message: 'Server error generating recommendations' });
  }
};

// @desc    Update recommendation status
// @route   PUT /api/recommendations/:id
// @access  Private
const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let recommendation = await Recommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Verify ownership
    if (recommendation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status) recommendation.status = status;
    if (notes) recommendation.notes = notes;
    if (status === 'implemented') recommendation.implementedAt = new Date();

    recommendation = await recommendation.save();

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({ message: 'Server error updating recommendation' });
  }
};

// @desc    Delete recommendation
// @route   DELETE /api/recommendations/:id
// @access  Private
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findById(id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Verify ownership
    if (recommendation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await recommendation.deleteOne();

    res.json({
      success: true,
      message: 'Recommendation deleted',
    });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({ message: 'Server error deleting recommendation' });
  }
};

module.exports = {
  getRecommendations,
  generateRecommendations,
  updateRecommendation,
  deleteRecommendation,
};
