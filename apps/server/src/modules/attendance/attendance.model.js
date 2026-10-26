const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
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
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      default: 'present'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Unique index to prevent duplicate attendance entry for same student, subject, date, period
attendanceSchema.index({ student: 1, subject: 1, date: 1, periodNumber: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;

