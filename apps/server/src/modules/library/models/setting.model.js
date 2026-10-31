const mongoose = require('mongoose');

const librarySettingSchema = new mongoose.Schema(
  {
    libraryName: {
      type: String,
      default: 'Central Institutional Library & Resource Center',
      trim: true
    },
    workingHours: {
      type: String,
      default: '8:00 AM - 8:00 PM (Mon-Sat)',
      trim: true
    },
    studentMaxBooks: {
      type: Number,
      default: 3,
      min: 1
    },
    facultyMaxBooks: {
      type: Number,
      default: 6,
      min: 1
    },
    studentLoanPeriodDays: {
      type: Number,
      default: 14,
      min: 1
    },
    facultyLoanPeriodDays: {
      type: Number,
      default: 30,
      min: 1
    },
    finePerDayOverdue: {
      type: Number,
      default: 5, // ₹5 per day
      min: 0
    },
    maxRenewalsAllowed: {
      type: Number,
      default: 2,
      min: 0
    },
    reservationHoldHours: {
      type: Number,
      default: 48,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LibrarySetting', librarySettingSchema);

