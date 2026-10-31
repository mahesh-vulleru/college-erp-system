const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required']
    },
    accessionNumber: {
      type: String,
      required: [true, 'Unique accession number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    barcode: {
      type: String,
      trim: true
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'damaged', 'lost'],
      default: 'good'
    },
    status: {
      type: String,
      enum: ['available', 'issued', 'reserved', 'maintenance', 'lost', 'damaged'],
      default: 'available'
    },
    currentIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookIssue',
      default: null
    },
    acquiredDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BookCopy', bookCopySchema);

