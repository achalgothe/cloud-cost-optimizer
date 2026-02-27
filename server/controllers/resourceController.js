const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const { status, provider, type, search } = req.query;
    const user = req.user._id;

    const filter = { user };

    if (status) filter.status = status;
    if (provider) filter.cloudProvider = provider;
    if (type) filter.resourceType = type;
    if (search) {
      filter.$or = [
        { resourceName: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(filter)
      .sort({ cost: -1 })
      .limit(100);

    // Calculate summary
    const summary = {
      total: resources.length,
      byStatus: {
        running: resources.filter(r => r.status === 'running').length,
        stopped: resources.filter(r => r.status === 'stopped').length,
        idle: resources.filter(r => r.status === 'idle').length,
        underutilized: resources.filter(r => r.status === 'underutilized').length,
        optimal: resources.filter(r => r.status === 'optimal').length,
      },
      totalCost: resources.reduce((acc, r) => acc + r.cost, 0),
      byProvider: {
        aws: resources.filter(r => r.cloudProvider === 'aws').length,
        azure: resources.filter(r => r.cloudProvider === 'azure').length,
        gcp: resources.filter(r => r.cloudProvider === 'gcp').length,
      },
    };

    res.json({
      success: true,
      data: {
        resources,
        summary,
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error fetching resources' });
  }
};

// @desc    Scan and add resources
// @route   POST /api/resources/scan
// @access  Private
const scanResources = async (req, res) => {
  try {
    const user = req.user._id;
    const { provider, resources } = req.body;

    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({ message: 'Resources array is required' });
    }

    const scannedResources = [];

    for (const resourceData of resources) {
      const resource = await Resource.findOneAndUpdate(
        { user, resourceId: resourceData.resourceId, cloudProvider: provider },
        {
          ...resourceData,
          user,
          cloudProvider: provider,
          lastScannedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      scannedResources.push(resource);
    }

    res.json({
      success: true,
      message: `Scanned ${scannedResources.length} resources`,
      data: {
        resources: scannedResources,
        count: scannedResources.length,
      },
    });
  } catch (error) {
    console.error('Scan resources error:', error);
    res.status(500).json({ message: 'Server error scanning resources' });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Server error fetching resource' });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let resource = await Resource.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error updating resource' });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await resource.deleteOne();

    res.json({
      success: true,
      message: 'Resource deleted',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error deleting resource' });
  }
};

module.exports = {
  getResources,
  scanResources,
  getResource,
  updateResource,
  deleteResource,
};
