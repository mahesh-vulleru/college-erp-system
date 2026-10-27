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
      ref: 'FeeStructure'
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
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
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'NetBanking', 'Card', 'DemandDraft', 'Cheque', 'Gateway'],
      default: 'UPI'
    },
    transactionReference: {
      type: String,
      trim: true
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed'
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    verificationDetails: {
      provider: {
        type: String,
        default: 'manual_institutional_counter'
      },
      signature: {
        type: String
      },
      verifiedAt: {
        type: Date,
        default: Date.now
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'processed', 'rejected'],
      default: 'none'
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundReason: {
      type: String,
      trim: true
    },
    refundedAt: {
      type: Date
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
