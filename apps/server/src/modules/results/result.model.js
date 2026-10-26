const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    internalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 40
    },
    externalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 60
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'AB'],
      default: 'B'
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'absent', 'withheld'],
      default: 'passed'
    }
  },
  { timestamps: true }
);

resultSchema.index({ examination: 1, student: 1, subject: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;

