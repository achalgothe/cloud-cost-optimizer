const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cloudProvider: {
    type: String,
    enum: ['aws', 'azure', 'gcp', 'all'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  thresholds: [{
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    action: {
      type: String,
      enum: ['email', 'sms', 'webhook', 'slack'],
    },
    recipients: [String],
  }],
  actualSpend: {
    type: Number,
    default: 0,
  },
  forecastedSpend: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'exceeded', 'completed'],
    default: 'active',
  },
  alertsEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

budgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
