const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Fee structure title is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
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
    feeCategory: {
      type: String,
      enum: ['tuition', 'laboratory', 'examination', 'library', 'development', 'hostel', 'transport', 'composite'],
      default: 'composite'
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active'
    },
    tuitionFee: {
      type: Number,
      required: true,
      default: 35000,
      min: 0
    },
    labFee: {
      type: Number,
      default: 5000,
      min: 0
    },
    libraryFee: {
      type: Number,
      default: 2000,
      min: 0
    },
    examFee: {
      type: Number,
      default: 1500,
      min: 0
    },
    otherFee: {
      type: Number,
      default: 1000,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

feeStructureSchema.pre('save', function (next) {
  this.totalAmount =
    (Number(this.tuitionFee) || 0) +
    (Number(this.labFee) || 0) +
    (Number(this.libraryFee) || 0) +
    (Number(this.examFee) || 0) +
    (Number(this.otherFee) || 0);
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
