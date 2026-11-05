const mongoose = require('mongoose');

const examRegistrationSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: [true, 'Examination reference is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    status: {
      type: String,
      enum: ['registered', 'pending', 'approved', 'rejected'],
      default: 'registered'
    },
    eligibilityStatus: {
      type: String,
      enum: ['eligible', 'shortage', 'condoned', 'disqualified'],
      default: 'eligible'
    },
    attendancePercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    feeCleared: {
      type: Boolean,
      default: true
    },
    condonationRemarks: {
      type: String,
      trim: true
    },
    condonedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hallTicketGenerated: {
      type: Boolean,
      default: false
    },
    hallTicketNumber: {
      type: String,
      trim: true
    },
    seatNumber: {
      type: String,
      trim: true
    },
    hallTicketIssuedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound unique index ensuring a student can register for an examination only once
examRegistrationSchema.index({ examination: 1, student: 1 }, { unique: true });
examRegistrationSchema.index({ examination: 1, eligibilityStatus: 1 });
examRegistrationSchema.index({ examination: 1, hallTicketGenerated: 1 });
examRegistrationSchema.index({ student: 1 });

const ExamRegistration = mongoose.model('ExamRegistration', examRegistrationSchema);

module.exports = ExamRegistration;
