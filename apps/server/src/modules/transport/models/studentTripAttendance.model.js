const mongoose = require('mongoose');

const studentTripAttendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    boardingStop: {
      type: String,
      required: true
    },
    dropStop: {
      type: String,
      required: true
    },
    boardingStatus: {
      type: String,
      enum: ['pending', 'boarded', 'not_boarded', 'absent'],
      default: 'pending'
    },
    dropStatus: {
      type: String,
      enum: ['pending', 'dropped', 'not_dropped'],
      default: 'pending'
    },
    boardingTimestamp: {
      type: Date
    },
    dropTimestamp: {
      type: Date
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true
    },
    correctionHistory: [
      {
        correctedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        previousStatus: String,
        newStatus: String,
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

studentTripAttendanceSchema.index({ trip: 1, rollNumber: 1 }, { unique: true });
studentTripAttendanceSchema.index({ trip: 1, boardingStatus: 1 });
studentTripAttendanceSchema.index({ student: 1, trip: 1 });

const StudentTripAttendance = mongoose.model('StudentTripAttendance', studentTripAttendanceSchema);

module.exports = StudentTripAttendance;

