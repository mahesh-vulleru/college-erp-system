const mongoose = require('mongoose');

const studentTransportAllocationSchema = new mongoose.Schema(
  {
    allocationId: {
      type: String,
      required: [true, 'Allocation ID is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2025-2026'
    },
    guardianName: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required']
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required']
    },
    pickupStop: {
      type: String,
      required: [true, 'Pickup stop is required'],
      trim: true
    },
    dropStop: {
      type: String,
      required: [true, 'Drop stop is required'],
      trim: true
    },
    pickupTime: {
      type: String,
      trim: true
    },
    dropTime: {
      type: String,
      trim: true
    },
    allocationDate: {
      type: Date,
      default: Date.now
    },
    allocationStatus: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'completed'],
      default: 'active'
    },
    transportFeeStatus: {
      type: String,
      enum: ['paid', 'pending', 'partial', 'waived'],
      default: 'pending'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

studentTransportAllocationSchema.index({ student: 1, allocationStatus: 1 });
studentTransportAllocationSchema.index({ bus: 1, allocationStatus: 1 });
studentTransportAllocationSchema.index({ route: 1, allocationStatus: 1 });

const StudentTransportAllocation = mongoose.model(
  'StudentTransportAllocation',
  studentTransportAllocationSchema
);

module.exports = StudentTransportAllocation;

