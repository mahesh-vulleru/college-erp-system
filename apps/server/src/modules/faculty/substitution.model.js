const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema(
  {
    originalFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Original faculty reference is required'],
      index: true
    },
    substituteFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Substitute faculty reference is required'],
      index: true
    },
    timetableSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: [true, 'Timetable slot reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Substitution date is required'],
      index: true
    },
    reason: {
      type: String,
      required: [true, 'Reason for substitution is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Prevent assigning duplicate substitute for the same timetable slot on the same date
substitutionSchema.index({ timetableSlot: 1, date: 1 }, { unique: true });

const FacultySubstitution = mongoose.model('FacultySubstitution', substitutionSchema);

module.exports = FacultySubstitution;

