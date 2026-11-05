const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Examination title is required'],
      trim: true
    },
    examType: {
      type: String,
      required: true,
      enum: ['Mid-Term 1', 'Mid-Term 2', 'Semester End', 'Practical / Lab', 'Supplementary'],
      default: 'Semester End'
    },
    academicYear: {
      type: String,
      required: true,
      trim: true // e.g. "2025-2026"
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    venue: {
      type: String,
      trim: true,
      default: 'Main Examination Hall'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    schedules: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true
        },
        date: {
          type: Date,
          required: true
        },
        startTime: {
          type: String,
          required: true,
          default: '09:30'
        },
        endTime: {
          type: String,
          required: true,
          default: '12:30'
        },
        venue: {
          type: String,
          default: 'Main Examination Hall'
        },
        roomNumber: {
          type: String,
          default: 'Hall A'
        },
        maxCapacity: {
          type: Number,
          default: 60
        },
        invigilator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],
    registrationDeadline: {
      type: Date
    },
    attendanceCutoffPercentage: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    isResultsPublished: {
      type: Boolean,
      default: false
    },
    resultsPublishedAt: {
      type: Date
    },
    resultsApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    instructions: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

examSchema.index({ status: 1, startDate: 1 });
examSchema.index({ academicYear: 1, semester: 1 });
examSchema.index({ department: 1 });
examSchema.index({ isResultsPublished: 1 });

const Examination = mongoose.model('Examination', examSchema);

module.exports = Examination;
