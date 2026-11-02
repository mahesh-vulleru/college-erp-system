const mongoose = require('mongoose');

const transportFeeStructureSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      trim: true // e.g. "2025-2026"
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    routeName: {
      type: String,
      trim: true
    },
    feeCategory: {
      type: String,
      enum: ['Regular', 'Concession', 'Hostel Commuter', 'Staff Dependent', 'Special'],
      default: 'Regular'
    },
    annualFee: {
      type: Number,
      required: true,
      min: 0
    },
    semesterFee: {
      type: Number,
      default: 0,
      min: 0
    },
    dueDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

transportFeeStructureSchema.index({ academicYear: 1, route: 1, feeCategory: 1 }, { unique: true });

const TransportFeeStructure = mongoose.model('TransportFeeStructure', transportFeeStructureSchema);

module.exports = TransportFeeStructure;

