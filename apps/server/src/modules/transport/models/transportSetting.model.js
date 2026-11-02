const mongoose = require('mongoose');

const transportSettingSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true
    },
    transportWorkingStatus: {
      type: String,
      enum: ['operational', 'reduced', 'suspended'],
      default: 'operational'
    },
    defaultMorningPickup: {
      type: String,
      default: '07:00 AM',
      trim: true
    },
    defaultEveningDrop: {
      type: String,
      default: '05:00 PM',
      trim: true
    },
    maxSeatThresholdPercentage: {
      type: Number,
      default: 100,
      min: 50,
      max: 120
    },
    emergencyContactPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true
    },
    transportHelplineEmail: {
      type: String,
      default: 'transport@college.edu',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const TransportSetting = mongoose.model('TransportSetting', transportSettingSchema);

module.exports = TransportSetting;

