const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required (e.g. CSE, ECE)'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 10
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    intakeCapacity: {
      type: Number,
      default: 60,
      min: 1,
      max: 240
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;

