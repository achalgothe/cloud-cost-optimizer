const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
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
  serviceName: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['compute', 'storage', 'database', 'network', 'analytics', 'ml', 'other'],
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  usageQuantity: {
    type: Number,
    default: 0,
  },
  usageUnit: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  resourceId: {
    type: String,
  },
  resourceName: {
    type: String,
  },
  tags: [{
    key: String,
    value: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

costSchema.index({ user: 1, date: -1 });
costSchema.index({ user: 1, cloudProvider: 1, date: -1 });

module.exports = mongoose.model('Cost', costSchema);
