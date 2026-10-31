const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    section: {
      type: String,
      default: 'A',
      uppercase: true,
      trim: true
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    startTime: {
      type: String,
      required: true, // e.g. "09:00"
      trim: true
    },
    endTime: {
      type: String,
      required: true, // e.g. "09:50"
      trim: true
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
    roomNumber: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Prevent timetable slot conflicts for the same room or same faculty
timetableSchema.index({ dayOfWeek: 1, periodNumber: 1, roomNumber: 1 });
timetableSchema.index({ dayOfWeek: 1, periodNumber: 1, faculty: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;

