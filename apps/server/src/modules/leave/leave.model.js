const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    leaveType: {
      type: String,
      required: true,
      enum: [
        'casual',
        'sick',
        'earned',
        'maternity',
        'paternity',
        'duty',
        'special_casual',
        'unpaid',
        'other'
      ],
      default: 'casual'
    },
    startDate: {
      type: Date,
      required: [true, 'Leave start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Leave end date is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

// Indexes for high-frequency queries
leaveSchema.index({ status: 1, department: 1 });
leaveSchema.index({ faculty: 1, startDate: -1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;

