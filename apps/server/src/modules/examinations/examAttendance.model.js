const mongoose = require('mongoose');

const examAttendanceSchema = new mongoose.Schema(
  {
    examination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: [true, 'Examination reference is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'malpractice'],
      default: 'present'
    },
    remarks: {
      type: String,
      trim: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Unique index: student can only have 1 attendance record per examination subject session
examAttendanceSchema.index({ examination: 1, subject: 1, student: 1 }, { unique: true });
examAttendanceSchema.index({ examination: 1, date: 1 });

const ExamAttendance = mongoose.model('ExamAttendance', examAttendanceSchema);

module.exports = ExamAttendance;
