const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: [true, 'Alert ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required']
    },
    busRegistrationNumber: {
      type: String,
      trim: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    triggeredByName: {
      type: String,
      trim: true
    },
    triggeredByRole: {
      type: String,
      trim: true
    },
    emergencyType: {
      type: String,
      required: [true, 'Emergency type is required'],
      enum: [
        'Medical Emergency',
        'Accident',
        'Vehicle Breakdown',
        'Student Safety Issue',
        'Fire Emergency',
        'Security Issue',
        'Other Emergency'
      ]
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Critical'
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, trim: true },
      speed: { type: Number }
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Acknowledged', 'Response Initiated', 'Resolved', 'Closed'],
      default: 'Active'
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date
    },
    responseNotes: {
      type: String,
      trim: true
    },
    responseInitiatedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    resolutionNotes: {
      type: String,
      trim: true
    },
    auditHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: { type: String },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ bus: 1, createdAt: -1 });

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

module.exports = EmergencyAlert;

