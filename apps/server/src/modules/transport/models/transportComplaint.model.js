const mongoose = require('mongoose');

const transportComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: [true, 'Complaint ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: [
        'Bus Delay',
        'Driver Behaviour',
        'Route Problem',
        'Pickup Problem',
        'Drop-off Problem',
        'Student Safety',
        'Bus Condition',
        'Transport Fee Issue',
        'Other'
      ]
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedByName: {
      type: String,
      trim: true
    },
    submittedByRole: {
      type: String,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    studentName: {
      type: String,
      trim: true
    },
    rollNumber: {
      type: String,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    supportingAttachments: [
      {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['Submitted', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Closed'],
      default: 'Submitted'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedToName: {
      type: String,
      trim: true
    },
    adminResponse: {
      type: String,
      trim: true
    },
    resolvedAt: {
      type: Date
    },
    closedAt: {
      type: Date
    },
    auditHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: { type: String },
        notes: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

transportComplaintSchema.index({ submittedBy: 1, createdAt: -1 });
transportComplaintSchema.index({ status: 1, createdAt: -1 });
transportComplaintSchema.index({ category: 1, createdAt: -1 });

const TransportComplaint = mongoose.model('TransportComplaint', transportComplaintSchema);

module.exports = TransportComplaint;

