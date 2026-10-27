const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['waiver', 'scholarship', 'discount', 'penalty', 'correction'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure'
    },
    feeCategory: {
      type: String,
      enum: ['tuition', 'laboratory', 'examination', 'library', 'development', 'hostel', 'transport', 'composite'],
      default: 'composite'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    academicYear: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0
    },
    adjustments: [adjustmentSchema],
    invoiceDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'waived', 'cancelled'],
      default: 'unpaid'
    },
    notes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

