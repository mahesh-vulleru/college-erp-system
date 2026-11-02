const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online Payment', 'UPI', 'Card', 'Bank Transfer', 'DD'],
      default: 'Online Payment'
    },
    transactionReference: {
      type: String,
      trim: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const studentTransportFeeSchema = new mongoose.Schema(
  {
    feeRecordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    academicYear: {
      type: String,
      required: true,
      trim: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportFeeStructure'
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Exempted', 'Cancelled'],
      default: 'Pending'
    },
    payments: [paymentHistorySchema]
  },
  {
    timestamps: true
  }
);

studentTransportFeeSchema.index({ rollNumber: 1, academicYear: 1 });
studentTransportFeeSchema.index({ paymentStatus: 1, academicYear: 1 });

const StudentTransportFee = mongoose.model('StudentTransportFee', studentTransportFeeSchema);

module.exports = StudentTransportFee;

