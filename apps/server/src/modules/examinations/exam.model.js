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
    }
  },
  { timestamps: true }
);

const Examination = mongoose.model('Examination', examSchema);

module.exports = Examination;
