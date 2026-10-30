const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      trim: true
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Institutional goal title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Goal description is required'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Academic Excellence',
        'Student Enrollment',
        'Examination & Results',
        'Faculty Development',
        'Placement & Industry',
        'Research & Publications',
        'Infrastructure & Finance',
        'Accreditation & Quality'
      ],
      default: 'Academic Excellence'
    },
    targetValue: {
      type: Number,
      required: [true, 'Target numeric value is required'],
      min: 0
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      default: '%',
      trim: true
    },
    priority: {
      type: String,
      required: true,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates institution-wide goal
    },
    periodType: {
      type: String,
      enum: ['annual', 'semester', 'quarterly', 'monthly'],
      default: 'annual'
    },
    academicYear: {
      type: String,
      required: true,
      default: '2026-2027',
      trim: true
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    deadline: {
      type: Date,
      required: [true, 'Goal deadline is required']
    },
    status: {
      type: String,
      required: true,
      enum: ['not_started', 'in_progress', 'at_risk', 'completed', 'overdue'],
      default: 'not_started'
    },
    achievementPercentage: {
      type: Number,
      default: 0,
      min: 0
    },
    progressHistory: [progressUpdateSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes for high performance querying
goalSchema.index({ academicYear: 1, category: 1 });
goalSchema.index({ status: 1, deadline: 1 });
goalSchema.index({ department: 1, priority: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;

