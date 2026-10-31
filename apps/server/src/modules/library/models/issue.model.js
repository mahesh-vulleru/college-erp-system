const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: [true, 'Unique issue transaction number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required']
    },
    bookCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCopy',
      required: [true, 'Physical copy reference is required']
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: [true, 'Member reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Borrower user reference is required']
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    returnDate: {
      type: Date,
      default: null
    },
    renewalCount: {
      type: Number,
      default: 0
    },
    maxRenewals: {
      type: Number,
      default: 2
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue', 'lost'],
      default: 'issued'
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuing librarian staff reference is required']
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    finePaid: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BookIssue', bookIssueSchema);

