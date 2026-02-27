const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cloudProvider: {
    type: String,
    enum: ['aws', 'azure', 'gcp'],
    required: true,
  },
  resourceType: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
    required: true,
  },
  resourceName: {
    type: String,
  },
  region: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['running', 'stopped', 'idle', 'underutilized', 'optimal'],
    required: true,
  },
  utilization: {
    cpu: {
      type: Number,
      min: 0,
      max: 100,
    },
    memory: {
      type: Number,
      min: 0,
      max: 100,
    },
    storage: {
      type: Number,
      min: 0,
      max: 100,
    },
    network: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  cost: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  specifications: {
    type: Map,
    of: String,
  },
  tags: [{
    key: String,
    value: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastScannedAt: {
    type: Date,
    default: Date.now,
  },
});

resourceSchema.index({ user: 1, cloudProvider: 1 });
resourceSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
