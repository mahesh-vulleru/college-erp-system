const mongoose = require('mongoose');

const transportExpenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Fuel Expenses',
        'Vehicle Maintenance',
        'Repair Expenses',
        'Insurance Expenses',
        'Permit Expenses',
        'Driver-related Authorized Expenses',
        'Staff-related Expenses',
        'Emergency Expenses',
        'Other Transport Expenses'
      ]
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    expenseDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    vendor: {
      type: String,
      required: true,
      trim: true
    },
    invoiceNumber: {
      type: String,
      trim: true
    },
    attachmentReference: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Corporate Card', 'Bank Transfer', 'UPI', 'Cheque'],
      default: 'Bank Transfer'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalStatus: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'],
      default: 'Submitted'
    },
    approvalRemarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

transportExpenseSchema.index({ category: 1, expenseDate: -1 });
transportExpenseSchema.index({ approvalStatus: 1, expenseDate: -1 });

const TransportExpense = mongoose.model('TransportExpense', transportExpenseSchema);

module.exports = TransportExpense;

