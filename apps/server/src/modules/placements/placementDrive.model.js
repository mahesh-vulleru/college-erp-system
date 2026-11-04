const mongoose = require('mongoose');

const recruitmentRoundSchema = new mongoose.Schema(
  {
    roundNumber: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Round name is required (e.g. Online Assessment)'],
      trim: true
    },
    mode: {
      type: String,
      enum: ['online', 'in_person', 'hybrid'],
      default: 'online'
    },
    scheduledDate: {
      type: Date
    },
    venue: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const placementDriveSchema = new mongoose.Schema(
  {
    driveCode: {
      type: String,
      required: [true, 'Drive code is required (e.g. DRV-2026-001)'],
      trim: true,
      uppercase: true,
      unique: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Recruiting company is required']
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    jobDescription: {
      type: String,
      trim: true
    },
    jobLocations: [
      {
        type: String,
        trim: true
      }
    ],
    ctc: {
      annualSalaryLpa: {
        type: Number,
        required: [true, 'Annual CTC package (LPA) is required'],
        min: [0, 'CTC package cannot be negative']
      },
      stipendMonthly: {
        type: Number,
        default: 0,
        min: [0, 'Monthly stipend cannot be negative']
      },
      breakupNotes: {
        type: String,
        trim: true
      }
    },
    eligibility: {
      minCgpa: {
        type: Number,
        default: 6.0,
        min: [0, 'CGPA cannot be negative'],
        max: [10, 'CGPA maximum is 10']
      },
      maxBacklogs: {
        type: Number,
        default: 0,
        min: [0, 'Backlogs cannot be negative']
      },
      allowedDepartments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Department'
        }
      ],
      allowedBatchYears: [
        {
          type: String,
          trim: true
        }
      ],
      minTenthPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 60
      },
      minTwelfthPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 60
      }
    },
    driveDate: {
      type: Date,
      required: [true, 'Drive date is required']
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required']
    },
    rounds: [recruitmentRoundSchema],
    status: {
      type: String,
      enum: [
        'upcoming',
        'registrations_open',
        'registrations_closed',
        'in_progress',
        'completed',
        'cancelled'
      ],
      default: 'upcoming'
    },
    hiringType: {
      type: String,
      enum: ['full_time', 'internship', 'intern_plus_ppo'],
      default: 'full_time'
    },
    maxOpenings: {
      type: Number,
      default: 10,
      min: 1
    },
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes
placementDriveSchema.index({ company: 1, status: 1 });
placementDriveSchema.index({ driveDate: 1 });
placementDriveSchema.index({ status: 1 });
placementDriveSchema.index({ 'eligibility.allowedDepartments': 1 });

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);

module.exports = PlacementDrive;

