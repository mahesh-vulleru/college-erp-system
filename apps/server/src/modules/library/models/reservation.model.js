const mongoose = require('mongoose');

const bookReservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      required: [true, 'Unique reservation identifier is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required']
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMember',
      required: [true, 'Library member reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    reservationDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending'
    },
    allocatedCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCopy',
      default: null
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BookReservation', bookReservationSchema);

