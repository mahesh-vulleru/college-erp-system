const mongoose = require('mongoose');

const libraryMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    memberType: {
      type: String,
      enum: ['student', 'faculty', 'staff'],
      required: [true, 'Member type is required']
    },
    membershipNumber: {
      type: String,
      required: [true, 'Membership card number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    department: {
      type: String,
      trim: true
    },
    maxBooksAllowed: {
      type: Number,
      default: 3,
      min: 1
    },
    loanPeriodDays: {
      type: Number,
      default: 14,
      min: 1
    },
    currentBooksIssued: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFinesDue: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'expired'],
      default: 'active'
    },
    membershipExpiry: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LibraryMember', libraryMemberSchema);

