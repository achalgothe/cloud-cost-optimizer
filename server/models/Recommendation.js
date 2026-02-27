const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['rightsizing', 'reserved_instances', 'spot_instances', 'idle_resources', 'storage_optimization', 'savings_plan', 'architecture'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  estimatedSavings: {
    type: Number,
    required: true,
  },
  savingsPercentage: {
    type: Number,
  },
  implementationEffort: {
    type: String,
    enum: ['low', 'medium', 'high'],
  },
  resourceId: {
    type: String,
  },
  resourceName: {
    type: String,
  },
  currentCost: {
    type: Number,
  },
  optimizedCost: {
    type: Number,
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'implemented', 'rejected', 'dismissed'],
    default: 'pending',
  },
  implementedAt: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

recommendationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
