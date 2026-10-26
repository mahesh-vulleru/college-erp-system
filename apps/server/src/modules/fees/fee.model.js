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
    tuitionFee: {
      type: Number,
      required: true,
      default: 35000
    },
    labFee: {
      type: Number,
      default: 5000
    },
    libraryFee: {
      type: Number,
      default: 2000
    },
    examFee: {
      type: Number,
      default: 1500
    },
    otherFee: {
      type: Number,
      default: 1000
    },
    totalAmount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

feeStructureSchema.pre('save', function (next) {
  this.totalAmount = (this.tuitionFee || 0) + (this.labFee || 0) + (this.libraryFee || 0) + (this.examFee || 0) + (this.otherFee || 0);
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;

