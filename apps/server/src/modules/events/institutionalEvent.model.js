const mongoose = require('mongoose');

const institutionalEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event or deadline title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    eventCategory: {
      type: String,
      required: true,
      enum: [
        'Academic Event',
        'Examination Deadline',
        'Accreditation Submission',
        'Institutional Review',
        'Council Meeting',
        'Administrative Deadline',
        'Fee Due Date',
        'Holiday'
      ],
      default: 'Academic Event'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    priority: {
      type: String,
      required: true,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates campus-wide event
    },
    assignedOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    venue: {
      type: String,
      trim: true,
      default: 'Main Campus'
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'],
      default: 'scheduled'
    },
    isAllDay: {
      type: Boolean,
      default: false
    },
    relatedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null
    },
    relatedCriteria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accreditation',
      default: null
    },
    reminderDaysBefore: {
      type: Number,
      default: 2,
      min: 0,
      max: 30
    },
    completedAt: {
      type: Date
    },
    completionNotes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes for fast calendar queries and deadline notifications
institutionalEventSchema.index({ startDate: 1, endDate: 1 });
institutionalEventSchema.index({ status: 1, priority: 1 });
institutionalEventSchema.index({ department: 1, assignedOwner: 1 });

const InstitutionalEvent = mongoose.model('InstitutionalEvent', institutionalEventSchema);

module.exports = InstitutionalEvent;

