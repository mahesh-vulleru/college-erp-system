const mongoose = require('mongoose');

const libraryFineSchema = new mongoose.Schema(
  {
    fineNumber: {
      type: String,
      required: [true, 'Unique fine identifier is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: [true, 'Member reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    bookIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookIssue',
      default: null
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null
    },
    fineReason: {
      type: String,
      enum: ['overdue', 'damaged', 'lost', 'other'],
      default: 'overdue'
    },
    overdueDays: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: [true, 'Fine amount is required'],
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    waivedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'waived'],
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: null
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    waiveReason: {
      type: String,
      trim: true
    },
    paymentReference: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LibraryFine', libraryFineSchema);

