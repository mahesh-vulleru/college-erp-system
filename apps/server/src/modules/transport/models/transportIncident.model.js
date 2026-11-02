const mongoose = require('mongoose');

const transportIncidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: [true, 'Incident ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Incident category is required'],
      enum: [
        'Accident',
        'Vehicle Breakdown',
        'Student Safety',
        'Driver Related',
        'Route Issue',
        'Other'
      ]
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    busRegistrationNumber: {
      type: String,
      trim: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedByName: {
      type: String,
      trim: true
    },
    incidentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, trim: true }
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true
    },
    supportingAttachments: [
      {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileType: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedOfficerName: {
      type: String,
      trim: true
    },
    investigationNotes: {
      type: String,
      trim: true
    },
    correctiveActions: {
      type: String,
      trim: true
    },
    resolutionDetails: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Reported', 'Acknowledged', 'Under Investigation', 'Action Required', 'Resolved', 'Closed'],
      default: 'Reported'
    },
    resolvedAt: {
      type: Date
    },
    closedAt: {
      type: Date
    },
    auditHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedByName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

transportIncidentSchema.index({ status: 1, incidentDate: -1 });
transportIncidentSchema.index({ category: 1, incidentDate: -1 });
transportIncidentSchema.index({ bus: 1, incidentDate: -1 });

const TransportIncident = mongoose.model('TransportIncident', transportIncidentSchema);

module.exports = TransportIncident;

