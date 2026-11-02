const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: Number,
      default: 1
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approverRole: {
      type: String,
      trim: true
    },
    approverName: {
      type: String,
      trim: true
    },
    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'escalated', 'forwarded'],
      default: 'submitted'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    previousStatus: {
      type: String,
      default: 'pending'
    },
    updatedStatus: {
      type: String,
      default: 'pending'
    }
  },
  { _id: false }
);

const leaveSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      trim: true,
      index: true,
      sparse: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    applicantRole: {
      type: String,
      enum: [
        'student',
        'faculty',
        'hod',
        'librarian',
        'library_staff',
        'accounts',
        'principal',
        'super_admin'
      ],
      default: 'faculty',
      index: true
    },
    applicantName: {
      type: String,
      trim: true
    },
    applicantIdNumber: {
      type: String,
      trim: true
    },
    academicClass: {
      type: String,
      trim: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
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
        'academic',
        'medical',
        'personal',
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
    numberOfDays: {
      type: Number,
      default: 1
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
      maxlength: 1000
    },
    documentUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'escalated', 'cancelled'],
      default: 'pending',
      index: true
    },
    currentApproverRole: {
      type: String,
      index: true
    },
    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    approvalStage: {
      type: Number,
      default: 1
    },
    maxApprovalStages: {
      type: Number,
      default: 1
    },
    approvalHistory: [approvalHistorySchema],
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
leaveSchema.index({ user: 1, startDate: -1 });
leaveSchema.index({ faculty: 1, startDate: -1 });
leaveSchema.index({ student: 1, startDate: -1 });
leaveSchema.index({ currentApprover: 1, status: 1 });
leaveSchema.index({ currentApproverRole: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
