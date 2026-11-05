const mongoose = require('mongoose');

const roundFeedbackSchema = new mongoose.Schema(
  {
    roundNumber: {
      type: Number,
      required: true
    },
    roundName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'failed', 'absent'],
      default: 'pending'
    },
    score: {
      type: Number
    },
    feedbackNotes: {
      type: String,
      trim: true
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluatedAt: {
      type: Date
    }
  },
  { _id: true }
);

const placementApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: [true, 'Application identifier is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: [true, 'Placement drive reference is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student applicant reference is required']
    },
    resumeUrl: {
      type: String,
      trim: true
    },
    currentCgpaAtApplication: {
      type: Number,
      min: 0,
      max: 10
    },
    activeBacklogsAtApplication: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: [
        'applied',
        'shortlisted',
        'in_rounds',
        'selected',
        'rejected',
        'withdrawn',
        'offer_accepted',
        'offer_declined'
      ],
      default: 'applied'
    },
    currentRoundIndex: {
      type: Number,
      default: 0
    },
    roundFeedback: [roundFeedbackSchema],
    offerDetails: {
      offeredCtcLpa: {
        type: Number,
        min: 0
      },
      offerDate: {
        type: Date
      },
      offerLetterUrl: {
        type: String,
        trim: true
      },
      acceptanceDeadline: {
        type: Date
      }
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// CRITICAL SAFEGUARD: Compound unique index prevents any duplicate application by a student to the same drive
placementApplicationSchema.index({ drive: 1, student: 1 }, { unique: true });

// Performance lookup indexes
placementApplicationSchema.index({ student: 1, status: 1 });
placementApplicationSchema.index({ drive: 1, status: 1 });
placementApplicationSchema.index({ status: 1 });

const PlacementApplication = mongoose.model(
  'PlacementApplication',
  placementApplicationSchema
);

module.exports = PlacementApplication;

