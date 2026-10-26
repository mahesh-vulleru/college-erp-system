const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: true
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'NetBanking', 'Card', 'DemandDraft', 'Cheque'],
      default: 'UPI'
    },
    transactionReference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed'
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

